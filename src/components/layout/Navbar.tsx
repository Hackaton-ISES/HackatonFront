import { LogOut, ShieldAlert } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const adminLinks = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/create", label: "Create tender" },
  ];
  const companyLinks = [
    { to: "/company", label: "Tenders" },
    { to: "/company/applications", label: "My applications" },
  ];
  const links = user.role === "admin" ? adminLinks : companyLinks;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-gradient-header text-primary-foreground border-b border-border/10">
      <div className="container flex h-16 items-center gap-6">
        <Link
          to={user.role === "admin" ? "/admin" : "/company"}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="rounded-lg bg-primary-foreground/10 p-1.5 backdrop-blur">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
              Tender System
            </span>
            <span className="text-sm font-semibold">Risk Detection</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-[11px] uppercase tracking-wider text-primary-foreground/60">
              {user.role}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
