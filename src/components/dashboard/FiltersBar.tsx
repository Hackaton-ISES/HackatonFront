import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { RiskLevel } from "@/types/tender";

export type RiskFilter = "ALL" | RiskLevel;

interface FiltersBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  riskFilter: RiskFilter;
  onRiskFilterChange: (v: RiskFilter) => void;
  organization: string;
  onOrganizationChange: (v: string) => void;
  organizations: string[];
  onClear: () => void;
  hasFilters: boolean;
}

export function FiltersBar({
  search,
  onSearchChange,
  riskFilter,
  onRiskFilterChange,
  organization,
  onOrganizationChange,
  organizations,
  onClear,
  hasFilters,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tender nomi bo'yicha qidirish..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card h-10"
        />
      </div>

      <Select
        value={riskFilter}
        onValueChange={(v) => onRiskFilterChange(v as RiskFilter)}
      >
        <SelectTrigger className="w-full md:w-[170px] h-10 bg-card">
          <SelectValue placeholder="Xavf darajasi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Barcha xavf darajalari</SelectItem>
          <SelectItem value="LOW">🟢 Past</SelectItem>
          <SelectItem value="MEDIUM">🟡 O'rta</SelectItem>
          <SelectItem value="HIGH">🔴 Yuqori</SelectItem>
        </SelectContent>
      </Select>

      <Select value={organization} onValueChange={onOrganizationChange}>
        <SelectTrigger className="w-full md:w-[240px] h-10 bg-card">
          <SelectValue placeholder="Tashkilot" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Barcha tashkilotlar</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org} value={org}>
              {org}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-10 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Tozalash
        </Button>
      )}
    </div>
  );
}
