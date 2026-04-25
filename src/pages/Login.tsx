import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      toast.error("Please enter login and password");
      return;
    }
    setSubmitting(true);
    try {
      const u = await login(loginId, password);
      toast.success(`Welcome, ${u.name}`);
      navigate(u.role === "admin" ? "/admin" : "/company", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (id: string, pw: string) => {
    setLoginId(id);
    setPassword(pw);
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
            Tender Corruption Detection
          </p>
          <h1 className="text-2xl font-bold text-primary-foreground">Sign in</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Access the procurement risk platform.
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
                placeholder="admin or acme"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
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
              {submitting ? <Loader size="sm" /> : "Login"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Demo accounts
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillDemo("admin", "admin123")}
                className="flex justify-between rounded-md px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <span className="font-mono">admin / admin123</span>
                <span className="text-muted-foreground">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("acme", "acme123")}
                className="flex justify-between rounded-md px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <span className="font-mono">acme / acme123</span>
                <span className="text-muted-foreground">Company</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("nova", "nova123")}
                className="flex justify-between rounded-md px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <span className="font-mono">nova / nova123</span>
                <span className="text-muted-foreground">Company</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
