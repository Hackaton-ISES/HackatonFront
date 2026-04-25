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
  submittingLabel = "Saving...",
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
      toast.error("Please complete all required fields");
      return;
    }
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      toast.error("Budget must be a positive number");
      return;
    }
    if (!Number.isFinite(numericAverageMarketPrice) || numericAverageMarketPrice <= 0) {
      toast.error("Average market price must be a positive number");
      return;
    }
    const selectedDeadline = new Date(deadline);
    if (Number.isNaN(selectedDeadline.getTime())) {
      toast.error("Deadline must be a valid date and time");
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
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="organization">Organization *</Label>
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
          <Label htmlFor="budget">Budget (USD) *</Label>
          <Input
            id="budget"
            type="number"
            min={1}
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 500000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="averageMarketPrice">Average market price (USD) *</Label>
          <Input
            id="averageMarketPrice"
            type="number"
            min={0.01}
            step="0.01"
            value={averageMarketPrice}
            onChange={(e) => setAverageMarketPrice(e.target.value)}
            placeholder="e.g. 450000"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Construction, Healthcare"
            maxLength={60}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline *</Label>
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
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="min-w-[140px]">
          {submitting ? <Loader size="sm" /> : submitLabel}
        </Button>
      </div>
      {submitting && <p className="text-xs text-muted-foreground">{submittingLabel}</p>}
    </form>
  );
}
