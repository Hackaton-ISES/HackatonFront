import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createTender } from "@/lib/api";
import { TenderForm } from "@/components/admin/TenderForm";
import { toast } from "sonner";

export default function AdminCreateTender() {
  const navigate = useNavigate();

  const handleSubmit = async (values: {
    title: string;
    organization: string;
    category: string;
    budget: number;
    averageMarketPrice: number;
    deadline: string;
  }) => {
    const selectedDeadline = new Date(values.deadline);
    if (selectedDeadline.getTime() <= Date.now()) {
      toast.error("Deadline must be later than the current time");
      return;
    }

    try {
      const t = await createTender({
        ...values,
      });
      toast.success("Tender created");
      navigate(`/admin/tenders/${t.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tender");
    }
  };

  return (
    <main className="container py-8 max-w-2xl">
      <Link
        to="/admin/tenders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create tender</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish a new public procurement tender for companies to review and apply to.
        </p>
      </div>

      <TenderForm
        initialValues={{
          title: "",
          organization: "",
          category: "",
          budget: "",
          averageMarketPrice: "",
          deadline: "",
        }}
        submitLabel="Create tender"
        submittingLabel="Creating tender..."
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/tenders")}
      />
    </main>
  );
}
