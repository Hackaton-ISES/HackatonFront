import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/Loader";
import { CountdownTimer } from "@/components/common/CountdownTimer";
import { useAuth } from "@/context/AuthContext";
import { createApplication } from "@/lib/api";
import { daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Tender } from "@/types/tender";

interface ApplicationFormProps {
  tender: Tender | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (tenderId: string) => void;
}

const applicationSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Bu maydon majburiy")
    .max(100, "100 belgidan kam bo'lishi kerak"),
  proposedPrice: z
    .number({ invalid_type_error: "Narx raqam bo'lishi kerak" })
    .positive("Narx 0 dan katta bo'lishi kerak")
    .max(1_000_000_000, "Narx juda katta ko'rinmoqda"),
  productName: z
    .string()
    .trim()
    .min(1, "Bu maydon majburiy")
    .max(120, "120 belgidan kam bo'lishi kerak"),
  productDescription: z
    .string()
    .trim()
    .min(1, "Bu maydon majburiy")
    .max(1000, "1000 belgidan kam bo'lishi kerak"),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof applicationSchema>, string>>;

export function ApplicationForm({ tender, open, onOpenChange, onSuccess }: ApplicationFormProps) {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState(user?.name ?? "");
  const [price, setPrice] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCompanyName(user?.name ?? "");
  }, [user?.name]);

  if (!tender) return null;

  const expired = daysUntil(tender.deadline) < 0;

  const reset = () => {
    setPrice("");
    setProductName("");
    setProductDescription("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!tender.id?.trim()) {
      toast.error("Ushbu ariza uchun tender ID topilmadi");
      return;
    }
    if (!user.id?.trim()) {
      toast.error("Ushbu akkaunt uchun kompaniya ID topilmadi");
      return;
    }

    if (expired) {
      toast.error("Ushbu tender muddati tugagan");
      return;
    }

    const parsed = applicationSchema.safeParse({
      companyName,
      proposedPrice: Number(price),
      productName,
      productDescription,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Yuborishdan oldin xatolarni tuzating");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const data = parsed.data;
      await createApplication({
        tenderId: tender.id.trim(),
        companyId: user.id.trim(),
        companyName: data.companyName,
        proposedPrice: data.proposedPrice,
        productName: data.productName,
        productDescription: data.productDescription,
      });
      toast.success("Tenderga ariza muvaffaqiyatli yuborildi", {
        description: tender.title,
      });
      reset();
      onOpenChange(false);
      onSuccess?.(tender.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuborib bo'lmadi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tenderga ariza yuborish</DialogTitle>
          <DialogDescription className="line-clamp-2">{tender.title}</DialogDescription>
          <div className="pt-1">
            <CountdownTimer deadline={tender.deadline} />
          </div>
        </DialogHeader>

        {expired && (
          <div className="rounded-md border border-risk-high-border bg-risk-high-bg p-3 text-sm text-risk-high">
            Bu tender muddati tugagan va endi arizalar qabul qilinmaydi.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
          <Field
            id="companyName"
            label="Kompaniya nomi"
            error={errors.companyName}
          >
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={100}
              aria-invalid={!!errors.companyName}
            />
          </Field>

          <Field
            id="price"
            label="Taklif qilingan narx (USD)"
            error={errors.proposedPrice}
          >
            <Input
              id="price"
              type="number"
              min={1}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="masalan: 1200000"
              aria-invalid={!!errors.proposedPrice}
            />
          </Field>

          <Field
            id="productName"
            label="Mahsulot / xizmat nomi"
            error={errors.productName}
          >
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              maxLength={120}
              aria-invalid={!!errors.productName}
            />
          </Field>

          <Field
            id="productDescription"
            label="Mahsulot tavsifi"
            error={errors.productDescription}
          >
            <Textarea
              id="productDescription"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              aria-invalid={!!errors.productDescription}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={submitting || expired} className="min-w-[100px]">
              {submitting ? <Loader size="sm" /> : "Yuborish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn(error && "text-risk-high")}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-risk-high">{error}</p>}
    </div>
  );
}
