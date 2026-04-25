import { FileSearch } from "lucide-react";
import { TenderRow } from "./TenderRow";
import type { Tender } from "@/types/tender";

interface TenderTableProps {
  tenders: Tender[];
  onSelect: (tender: Tender) => void;
}

export function TenderTable({ tenders, onSelect }: TenderTableProps) {
  if (tenders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileSearch className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No tenders found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto animate-fade-in">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tender
            </th>
            <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Organization
            </th>
            <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Budget
            </th>
            <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Final Price
            </th>
            <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bidders
            </th>
            <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk
            </th>
            <th className="py-3 pl-3 pr-6 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {tenders.map((tender) => (
            <TenderRow key={tender.id} tender={tender} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
