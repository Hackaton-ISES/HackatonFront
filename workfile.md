# Tender Guardian Backend Workfile

## Purpose

This file documents the backend API behavior that the frontend should integrate with.
The most important flow for now is tender publishing by an admin user.

## Base Notes

- Auth is token-based.
- All protected requests must send:
  - `Authorization: Token <token>`
- Demo users:
  - `admin / admin123`
  - `acme / acme123`
  - `nova / nova123`

## Tender Create Flow

### Business rule

Admin publishes a tender first.
Companies join later by submitting applications/bids.

Because of that, the create-tender API does **not** require participants.
It also does **not** accept lifecycle-only fields such as winner/completion state.

### Endpoint

- `POST /tenders`

### Who can use it

- Admin only

### Request body

```json
{
  "title": "School Computer Procurement 2026",
  "organization": "Ministry of Education",
  "category": "IT Equipment",
  "budget": "120000.00",
  "average_market_price": "110000.00",
  "final_price": "0.00",
  "created_at": "2026-04-25T09:00:00Z",
  "deadline": "2026-05-02T09:00:00Z"
}
```

### Required fields

- `title`
- `organization`
- `category`
- `budget`
- `average_market_price`
- `created_at`
- `deadline`

### Optional fields

- `final_price`
  - if omitted, backend defaults it to `"0.00"`

### Fields intentionally NOT accepted on create

These are backend-managed or later-stage workflow fields and should not be sent by the frontend on tender creation:

- `participant_ids`
- `participants_count`
- `winner_company_id`
- `status`
- `is_completed_by_winner`
- `bids`
- `risk_analysis`
- `reasons`

### Backend behavior on create

When a tender is created:

- `status` is automatically set to `active`
- `participants_count` is automatically set to `0`
- `winner_company` is automatically set to `null`
- `is_completed_by_winner` is automatically set to `null`
- risk analysis is created automatically

### Validation rules

- `deadline` must be later than `created_at`
- no participants are required

### Successful response

The create endpoint returns the created tender in frontend-friendly read format.

Example:

```json
{
  "id": "T-2026-0008",
  "title": "School Computer Procurement 2026",
  "organization": "Ministry of Education",
  "category": "IT Equipment",
  "budget": "120000.00",
  "averageMarketPrice": "110000.00",
  "finalPrice": "0.00",
  "participantsCount": 0,
  "winnerCompanyId": null,
  "status": "active",
  "createdAt": "2026-04-25T09:00:00Z",
  "deadline": "2026-05-02T09:00:00Z",
  "riskScore": 0,
  "riskLevel": "LOW",
  "riskFlags": [],
  "riskAnalysis": {
    "total_score": 0,
    "risk_level": "low",
    "price_score": 0,
    "company_history_score": 0,
    "consecutive_wins_score": 0,
    "participants_score": 0,
    "fake_competition_score": 0,
    "ai_summary": "",
    "analyzed_at": "2026-04-25T09:00:01Z",
    "reasons": []
  },
  "reasons": [],
  "bids": []
}
```

## Tender Participation Flow

### How companies join a tender

Companies do not get inserted into a tender by admin during create.
They join by creating an application.

Endpoint:

- `POST /applications`

When an application is created:

- the company is added to `tender.participants`
- `participants_count` is updated
- risk analysis is recalculated

## Frontend Guidance

For the create-tender page:

- show only publish-time fields
- do not send participant fields
- do not send winner fields
- do not send completion fields
- treat a newly created tender as open for company applications

## Summary

Frontend should treat tender creation as a publishing step, not a full tender-finalization step.
The backend now matches that flow.
