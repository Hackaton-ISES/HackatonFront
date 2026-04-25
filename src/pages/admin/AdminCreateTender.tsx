import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/Loader";
import { createTender } from "@/lib/api";
import { toast } from "sonner";

export default function AdminCreateTender() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericBudget = Number(budget);
    if (!title.trim() || !organization.trim() || !deadline) {
      toast.error("Please complete all required fields");
      return;
    }
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      toast.error("Budget must be a positive number");
      return;
    }
    setSubmitting(true);
    try {
      const t = await createTender({
        title: title.trim(),
        organization: organization.trim(),
        budget: numericBudget,
        deadline,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      });
      toast.success("Tender created");
      navigate(`/admin/tenders/${t.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tender");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container py-8 max-w-2xl">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create tender</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish a new public procurement tender.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm animate-fade-in"
      >
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            required
          />
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
            <Label htmlFor="deadline">Deadline *</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Construction, Healthcare"
            maxLength={60}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate("/admin")} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="min-w-[140px]">
            {submitting ? <Loader size="sm" /> : "Create tender"}
          </Button>
        </div>
      </form>
    </main>
  );
}
