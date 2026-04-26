import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/Loader";
import { toast } from "sonner";

export interface TenderFormValues {
  title: string;
  organization: string;
  category: string;
  budget: string;
  averageMarketPrice: string;
  deadline: string;
}

interface TenderFormProps {
  initialValues: TenderFormValues;
  submitLabel: string;
  submittingLabel?: string;
  onSubmit: (values: {
    title: string;
    organization: string;
    category: string;
    budget: number;
    averageMarketPrice: number;
    deadline: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function TenderForm({
  initialValues,
  submitLabel,
  submittingLabel = "Saqlanmoqda...",
  onSubmit,
  onCancel,
}: TenderFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [organization, setOrganization] = useState(initialValues.organization);
  const [category, setCategory] = useState(initialValues.category);
  const [budget, setBudget] = useState(initialValues.budget);
  const [averageMarketPrice, setAverageMarketPrice] = useState(initialValues.averageMarketPrice);
  const [deadline, setDeadline] = useState(initialValues.deadline);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericBudget = Number(budget);
    const numericAverageMarketPrice = Number(averageMarketPrice);

    if (!title.trim() || !organization.trim() || !category.trim() || !deadline) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      toast.error("Byudjet musbat son bo'lishi kerak");
      return;
    }
    if (!Number.isFinite(numericAverageMarketPrice) || numericAverageMarketPrice <= 0) {
      toast.error("O'rtacha bozor narxi musbat son bo'lishi kerak");
      return;
    }
    const selectedDeadline = new Date(deadline);
    if (Number.isNaN(selectedDeadline.getTime())) {
      toast.error("Muddat to'g'ri sana va vaqt bo'lishi kerak");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        organization: organization.trim(),
        category: category.trim(),
        budget: numericBudget,
        averageMarketPrice: numericAverageMarketPrice,
        deadline,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm animate-fade-in"
    >
      <div className="space-y-1.5">
        <Label htmlFor="title">Nomi *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="organization">Tashkilot *</Label>
        <Input
          id="organization"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          maxLength={120}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="budget">Byudjet (USD) *</Label>
          <Input
            id="budget"
            type="number"
            min={1}
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="masalan: 500000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="averageMarketPrice">O'rtacha bozor narxi (USD) *</Label>
          <Input
            id="averageMarketPrice"
            type="number"
            min={0.01}
            step="0.01"
            value={averageMarketPrice}
            onChange={(e) => setAverageMarketPrice(e.target.value)}
            placeholder="masalan: 450000"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategoriya *</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="masalan: Qurilish, Sog'liqni saqlash"
            maxLength={60}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Muddat *</Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={submitting} className="min-w-[140px]">
          {submitting ? <Loader size="sm" /> : submitLabel}
        </Button>
      </div>
      {submitting && <p className="text-xs text-muted-foreground">{submittingLabel}</p>}
    </form>
  );
}
