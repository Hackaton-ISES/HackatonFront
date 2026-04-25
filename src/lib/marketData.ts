// Average market price per category — used by the price anomaly rule.
// In production this would come from historical tender data.
export const marketPriceByCategory: Record<string, number> = {
  Construction: 2_000_000,
  Healthcare: 1_400_000,
  "IT Services": 500_000,
  Catering: 400_000,
  Transportation: 950_000,
  Landscaping: 180_000,
  General: 500_000,
};

export function getMarketPrice(category: string): number {
  return marketPriceByCategory[category] ?? marketPriceByCategory.General;
}
