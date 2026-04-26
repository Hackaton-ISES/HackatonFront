import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      toast.error("Login va parolni kiriting");
      return;
    }
    setSubmitting(true);
    try {
      const u = await login(loginId, password);
      toast.success(`Xush kelibsiz, ${u.name}`);
      navigate(u.role === "admin" ? "/admin" : "/company", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kirish amalga oshmadi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-header flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur">
            <ShieldAlert className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-foreground/60 mb-2">
            Tenderlarda korrupsiyani aniqlash
          </p>
          <h1 className="text-2xl font-bold text-primary-foreground">Tizimga kirish</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Davlat xaridlari xavf tahlili platformasiga kiring.
          </p>
        </div>

        <div className="rounded-xl bg-card border border-border shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Loginingizni kiriting"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader size="sm" /> : "Kirish"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Kompaniya akkauntingiz yo'qmi?{" "}
            <Link to="/register" className="font-medium text-foreground hover:text-primary">
              Ro'yxatdan o'ting
            </Link>
          </div>

          <div className="mt-3 text-center text-sm">
            <Link to="/public" className="font-medium text-foreground hover:text-primary">
              Ochiq shaffoflik panelini ko'rish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
