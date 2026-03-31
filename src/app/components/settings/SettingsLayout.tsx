import { NavLink, Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import {
  UserCog,
  Bell,
  Users,
  Shield,
  KeyRound,
  Bot,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Server,
  UserCheck,
  Globe,
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { authService } from "@/services/api/auth";

type AppRole = "SUPER_ADMIN" | "ORG_ADMIN" | "SECURITY_OWNER" | "AUDITOR" | "CONTRIBUTOR" | "VIEWER";
const ADMIN_ROLES: AppRole[] = ["SUPER_ADMIN", "ORG_ADMIN", "SECURITY_OWNER"];

interface SettingsNavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: AppRole[];
}

interface SettingsNavGroup {
  group: string;
  items: SettingsNavItem[];
}

const settingsNav: SettingsNavGroup[] = [
  {
    group: "Account",
    items: [
      { label: "Profile",       to: "/settings/profile",       icon: UserCog },
      { label: "Notifications", to: "/settings/notifications", icon: Bell },
    ],
  },
  {
    group: "Access",
    items: [
      { label: "Users",           to: "/settings/access/users",    icon: Users,    roles: ADMIN_ROLES },
      { label: "Roles",           to: "/settings/access/roles",    icon: Shield,   roles: ADMIN_ROLES },
      { label: "Access Requests", to: "/settings/access/requests", icon: KeyRound },
    ],
  },
  {
    group: "Compliance",
    items: [
      { label: "Compliance",      to: "/settings/compliance",      icon: ShieldCheck, roles: ADMIN_ROLES },
    ],
  },
  {
    group: "Risk",
    items: [
      { label: "Risk",            to: "/settings/risk",            icon: AlertTriangle, roles: ADMIN_ROLES },
    ],
  },
  {
    group: "Modules",
    items: [
      { label: "Assets",          to: "/settings/assets",          icon: Server,       roles: ADMIN_ROLES },
      { label: "Personnel",       to: "/settings/personnel",       icon: UserCheck,    roles: ADMIN_ROLES },
      { label: "Customer Trust",  to: "/settings/customer-trust",  icon: Globe,        roles: ADMIN_ROLES },
    ],
  },
  {
    group: "Integrations",
    items: [
      { label: "MCP",             to: "/settings/mcp",             icon: Bot,          roles: ADMIN_ROLES },
      { label: "AI Settings",     to: "/settings/ai",              icon: Sparkles,     roles: ADMIN_ROLES },
    ],
  },
];

export function SettingsLayout() {
  const user = authService.getCachedUser();
  const userRole = (user?.role ?? "") as AppRole;
  const navigate = useNavigate();

  // Default redirect to /settings/profile
  useEffect(() => {
    if (window.location.pathname === "/settings" || window.location.pathname === "/settings/") {
      navigate("/settings/profile", { replace: true });
    }
  }, [navigate]);

  const canSee = (roles?: AppRole[]) =>
    !roles || roles.length === 0 || roles.includes(userRole);

  return (
    <div className="flex flex-col min-h-screen bg-muted">
      {/* Page header */}
      <div className="bg-card border-b border-border px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left nav — desktop (sticky sidebar) ── */}
        <nav className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-card border-r border-border py-4 px-3 gap-6 sticky top-0 self-start min-h-[calc(100vh-57px)]">
          {settingsNav.map((group) => {
            const visibleItems = group.items.filter((item) => canSee(item.roles));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.group}>
                <p className="px-3 mb-1 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
                  {group.group}
                </p>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )
                          }
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {item.label}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* ── Top nav — mobile (horizontal scroll) ── */}
        <div className="lg:hidden w-full bg-card border-b border-border px-4 overflow-x-auto flex-shrink-0">
          <div className="flex gap-1 py-2 min-w-max">
            {settingsNav.flatMap((group) =>
              group.items
                .filter((item) => canSee(item.roles))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent"
                        )
                      }
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })
            )}
          </div>
        </div>

        {/* ── Content area ── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
