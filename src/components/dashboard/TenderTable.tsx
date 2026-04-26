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
        <h3 className="text-lg font-semibold text-foreground mb-1">Tender topilmadi</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Kerakli tenderni topish uchun filter yoki qidiruvni o'zgartiring.
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
              Tashkilot
            </th>
            <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Byudjet
            </th>
            <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Yakuniy narx
            </th>
            <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ishtirokchilar
            </th>
            <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Xavf
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
