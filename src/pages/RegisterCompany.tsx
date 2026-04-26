import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function RegisterCompany() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !username.trim() || !password) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        companyName: companyName.trim(),
        username: username.trim(),
        password,
        email: email.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      toast.success(`${user.name} uchun akkaunt yaratildi`);
      navigate("/company", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ro'yxatdan o'tish amalga oshmadi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-header flex items-center justify-center p-6">
      <div className="w-full max-w-xl animate-slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-foreground/60 mb-2">
            Kompaniya akkaunti
          </p>
          <h1 className="text-2xl font-bold text-primary-foreground">Kompaniya akkauntini yaratish</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Tenderlarni ko'rish va ariza yuborish uchun kompaniyangizni ro'yxatdan o'tkazing.
          </p>
        </div>

        <div className="rounded-xl bg-card border border-border shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Kompaniya nomi *</Label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Ism</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Familiya</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username">Foydalanuvchi nomi *</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Parol *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader size="sm" /> : "Akkaunt yaratish"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            Akkauntingiz bormi?{" "}
            <Link to="/login" className="font-medium text-foreground hover:text-primary">
              Tizimga kiring
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
