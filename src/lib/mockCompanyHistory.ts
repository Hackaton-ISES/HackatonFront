import type { BidRecord, CompanyHistory } from "@/types/tender";

// Aggregated history per company — feeds the risk engine.
export const mockCompanyHistory: Record<string, CompanyHistory> = {
  "alpha-construction": {
    companyId: "alpha-construction",
    companyName: "Alpha Construction LLC",
    failedExecutions: 2,
    consecutiveWins: 4,
    losingParticipations: 1,
  },
  "medsupply-group": {
    companyId: "medsupply-group",
    companyName: "MedSupply Group",
    failedExecutions: 0,
    consecutiveWins: 1,
    losingParticipations: 3,
  },
  "netcore-solutions": {
    companyId: "netcore-solutions",
    companyName: "NetCore Solutions",
    failedExecutions: 1,
    consecutiveWins: 2,
    losingParticipations: 2,
  },
  "freshmeals-co": {
    companyId: "freshmeals-co",
    companyName: "FreshMeals Co.",
    failedExecutions: 0,
    consecutiveWins: 1,
    losingParticipations: 4,
  },
  "autoservice-plus": {
    companyId: "autoservice-plus",
    companyName: "AutoService Plus",
    failedExecutions: 0,
    consecutiveWins: 1,
    losingParticipations: 2,
  },
  "pharmadist-international": {
    companyId: "pharmadist-international",
    companyName: "PharmaDist International",
    failedExecutions: 1,
    consecutiveWins: 3,
    losingParticipations: 1,
  },
  "greenspace-designs": {
    companyId: "greenspace-designs",
    companyName: "GreenSpace Designs",
    failedExecutions: 0,
    consecutiveWins: 1,
    losingParticipations: 1,
  },
  "securelogic-audit": {
    companyId: "securelogic-audit",
    companyName: "SecureLogic Audit",
    failedExecutions: 0,
    consecutiveWins: 1,
    losingParticipations: 2,
  },
  "archivetech-inc": {
    companyId: "archivetech-inc",
    companyName: "ArchiveTech Inc.",
    failedExecutions: 0,
    consecutiveWins: 1,
    losingParticipations: 1,
  },
  "medtransport-vehicles": {
    companyId: "medtransport-vehicles",
    companyName: "MedTransport Vehicles",
    failedExecutions: 0,
    consecutiveWins: 1,
    losingParticipations: 2,
  },
  "shadow-bidder-llc": {
    companyId: "shadow-bidder-llc",
    companyName: "Shadow Bidder LLC",
    failedExecutions: 0,
    consecutiveWins: 0,
    losingParticipations: 6,
  },
};

// Per-tender bid sheets — used by fake-competition detection (price spread + repeated co-bidders).
export const mockBidsByTender: Record<string, BidRecord[]> = {
  "T-2024-0142": [
    { companyId: "alpha-construction", companyName: "Alpha Construction LLC", price: 6_720_000 },
  ],
  "T-2024-0138": [
    { companyId: "medsupply-group", companyName: "MedSupply Group", price: 1_185_000 },
    { companyId: "shadow-bidder-llc", companyName: "Shadow Bidder LLC", price: 1_280_000 },
    { companyId: "freshmeals-co", companyName: "FreshMeals Co.", price: 1_310_000 },
  ],
  "T-2024-0151": [
    { companyId: "netcore-solutions", companyName: "NetCore Solutions", price: 1_020_000 },
    { companyId: "shadow-bidder-llc", companyName: "Shadow Bidder LLC", price: 1_032_000 },
  ],
  "T-2024-0119": [
    { companyId: "freshmeals-co", companyName: "FreshMeals Co.", price: 415_000 },
    { companyId: "medsupply-group", companyName: "MedSupply Group", price: 460_000 },
  ],
  "T-2024-0160": [
    { companyId: "alpha-construction", companyName: "Alpha Construction LLC", price: 3_220_000 },
  ],
  "T-2024-0147": [
    { companyId: "autoservice-plus", companyName: "AutoService Plus", price: 990_000 },
    { companyId: "medtransport-vehicles", companyName: "MedTransport Vehicles", price: 1_050_000 },
  ],
  // Suspicious price-clustering: 3 bidders within 1.5%
  "T-2024-0155": [
    { companyId: "pharmadist-international", companyName: "PharmaDist International", price: 4_080_000 },
    { companyId: "shadow-bidder-llc", companyName: "Shadow Bidder LLC", price: 4_120_000 },
    { companyId: "medsupply-group", companyName: "MedSupply Group", price: 4_140_000 },
  ],
  "T-2024-0162": [
    { companyId: "greenspace-designs", companyName: "GreenSpace Designs", price: 175_500 },
  ],
  "T-2024-0166": [
    { companyId: "securelogic-audit", companyName: "SecureLogic Audit", price: 380_000 },
    { companyId: "shadow-bidder-llc", companyName: "Shadow Bidder LLC", price: 388_000 },
  ],
  "T-2024-0170": [
    { companyId: "alpha-construction", companyName: "Alpha Construction LLC", price: 2_100_000 },
  ],
  "T-2024-0173": [
    { companyId: "archivetech-inc", companyName: "ArchiveTech Inc.", price: 235_000 },
    { companyId: "netcore-solutions", companyName: "NetCore Solutions", price: 250_000 },
  ],
  "T-2024-0180": [
    { companyId: "medtransport-vehicles", companyName: "MedTransport Vehicles", price: 1_320_000 },
    { companyId: "shadow-bidder-llc", companyName: "Shadow Bidder LLC", price: 1_345_000 },
  ],
};

// Convert "Alpha Construction LLC" → "alpha-construction"
export function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/llc|inc\.?|co\.?|group|international|solutions|designs|plus|vehicles|audit/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
