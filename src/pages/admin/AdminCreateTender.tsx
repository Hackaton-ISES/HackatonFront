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
      toast.error("Muddat hozirgi vaqtdan keyin bo'lishi kerak");
      return;
    }

    try {
      const t = await createTender({
        ...values,
      });
      toast.success("Tender yaratildi");
      navigate(`/admin/tenders/${t.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tender yaratib bo'lmadi");
    }
  };

  return (
    <main className="container py-8 max-w-2xl">
      <Link
        to="/admin/tenders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Tenderlarga qaytish
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tender yaratish</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kompaniyalar ko'rishi va ariza yuborishi uchun yangi davlat xaridi tenderini e'lon qiling.
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
        submitLabel="Tender yaratish"
        submittingLabel="Tender yaratilmoqda..."
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/tenders")}
      />
    </main>
  );
}
