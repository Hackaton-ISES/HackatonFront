# Company Suspicion Migration Workfile

## Goal

The product should no longer label a tender itself as corrupt.

Instead, the system should calculate a **suspicion score for companies** so the platform can identify companies that may be involved in corruption patterns and prevent future abuse.

This update implements the backend side of that shift.

## Suspicion Logic Implemented

Company suspicion is now calculated from these cases:

1. `Narx boyicha bozor va tender narxlarini solishtirish`
   The system checks tenders won by a company and compares `final_price` vs `average_market_price`.

2. `Oldingi tenderda yutib, keyin uni amalga oshirmasa`
   If a company wins a tender and later does not complete it, the company receives suspicion points.
   Each failed completed tender increases suspicion.

3. `Ketma-ket yutishi`
   If a company wins at least 3 tenders in a row in the same organization/category flow, the company receives suspicion points.

4. `Soxta raqobat`
   The system checks:
   - repeated participation with the same companies
   - bid prices that are very close, around 1-2%
   - repeated winner vs repeated losing-company patterns, especially when this happens at least 4-5 times

Higher score means more suspicious.

## New Backend Model

The backend now stores company-level analysis in:

- `CompanySuspicionAnalysis`
- `CompanySuspicionReason`

Important fields:

- `total_score`
- `suspicion_level`: `LOW | MEDIUM | HIGH`
- `price_score`
- `failed_delivery_score`
- `consecutive_wins_score`
- `fake_competition_score`

## API Changes

### 1. Companies are now the main risk/suspicion entity

New primary endpoints:

- `GET /companies`
- `GET /companies/<companyId>`
- `POST /companies/<companyId>/analyze`

Risk aliases also now work with `companyId`:

- `POST /risk/analyze/<companyId>`
- `GET /risk/flags/<companyId>`
- `GET /risk/stats`

### 2. Tenders no longer return tender risk fields

These fields were removed from tender list/detail payloads:

- `riskScore`
- `riskLevel`
- `riskFlags`
- nested tender-level risk analysis objects

Tenders are still used as procurement records, but suspicion is attached to companies.

## Response Shapes

### `GET /companies`

```json
[
  {
    "id": "c-alpha-infrastructure",
    "name": "Alpha Infrastructure",
    "total_participations": 15,
    "total_wins": 7,
    "completed_projects": 6,
    "failed_projects": 1,
    "created_at": "2026-04-25T10:00:00Z",
    "updated_at": "2026-04-25T10:00:00Z",
    "suspicionScore": 78,
    "suspicionLevel": "HIGH",
    "suspicionFlags": [
      {
        "severity": "critical",
        "message": "Alpha Infrastructure won 5 consecutive tenders..."
      }
    ]
  }
]
```

### `GET /companies/<companyId>`

```json
{
  "id": "c-alpha-infrastructure",
  "name": "Alpha Infrastructure",
  "total_participations": 15,
  "total_wins": 7,
  "completed_projects": 6,
  "failed_projects": 1,
  "created_at": "2026-04-25T10:00:00Z",
  "updated_at": "2026-04-25T10:00:00Z",
  "suspicionScore": 78,
  "suspicionLevel": "HIGH",
  "suspicionFlags": [
    {
      "severity": "critical",
      "message": "Alpha Infrastructure won 5 consecutive tenders..."
    }
  ],
  "suspicionAnalysis": {
    "total_score": 78,
    "suspicion_level": "high",
    "price_score": 20,
    "failed_delivery_score": 20,
    "consecutive_wins_score": 20,
    "fake_competition_score": 18,
    "analyzed_at": "2026-04-25T10:00:00Z",
    "reasons": [
      {
        "id": 1,
        "title": "Consecutive wins pattern",
        "description": "Alpha Infrastructure won 4 consecutive tenders...",
        "score": 20,
        "created_at": "2026-04-25T10:00:00Z"
      }
    ]
  },
  "reasons": [
    {
      "id": 1,
      "title": "Consecutive wins pattern",
      "description": "Alpha Infrastructure won 4 consecutive tenders...",
      "score": 20,
      "created_at": "2026-04-25T10:00:00Z"
    }
  ]
}
```

### `POST /risk/analyze/<companyId>`

```json
{
  "companyId": "c-alpha-infrastructure",
  "companyName": "Alpha Infrastructure",
  "totalScore": 78,
  "suspicionLevel": "HIGH",
  "price_score": 20,
  "failed_delivery_score": 20,
  "consecutive_wins_score": 20,
  "fake_competition_score": 18,
  "suspicionFlags": [
    {
      "severity": "critical",
      "message": "Alpha Infrastructure won 4 consecutive tenders..."
    }
  ]
}
```

### `GET /risk/stats`

```json
{
  "total": 6,
  "high": 1,
  "medium": 2,
  "low": 3,
  "distribution": {
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3
  },
  "top_suspicious_companies": [
    {
      "companyId": "c-alpha-infrastructure",
      "companyName": "Alpha Infrastructure",
      "totalScore": 78,
      "suspicionLevel": "HIGH"
    }
  ],
  "total_analyzed_companies": 6
}
```

## Frontend Update Required

There is no frontend code in this repository, so the frontend still needs to be updated separately.

### Replace the old tender-risk UI

Frontend should stop using tender cards/tables like:

- tender risk score
- tender risk level
- tender risk flags

### Build company-based suspicion UI instead

Recommended pages/components:

1. `Companies Suspicion List`
   Source: `GET /companies`
   Columns:
   - company name
   - suspicion score
   - suspicion level
   - total wins
   - failed projects
   - top suspicion reasons

2. `Company Suspicion Detail`
   Source: `GET /companies/<companyId>`
   Show:
   - company profile
   - score breakdown
   - all suspicion reasons
   - tenders won by this company

3. `Dashboard`
   Source: `GET /risk/stats`
   Show:
   - high/medium/low company counts
   - top suspicious companies
   - simple charts by suspicion level

### Frontend field mapping

Old tender-based fields:

- `riskScore`
- `riskLevel`
- `riskFlags`

New company-based fields:

- `suspicionScore`
- `suspicionLevel`
- `suspicionFlags`

## Backend Notes

- Tender CRUD still exists.
- Application submission still exists.
- When tenders or bids change, company suspicion is recalculated.
- Company registration now also creates company suspicion analysis data.

## Suggested Frontend Rollout

1. Switch dashboard source from tender risk stats to company suspicion stats.
2. Replace tender risk table with company suspicion table.
3. Add company detail page using `GET /companies/<companyId>`.
4. Remove any UI that assumes a tender itself has a corruption label.
