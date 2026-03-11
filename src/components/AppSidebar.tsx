import { useState } from "react";
import {
  Users,
  FileText,
  CircleDollarSign,
  Car,
  Award,
  Building2,
  Shield,
  ChevronDown,
  HardHat,
  Home,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const modules = [
  {
    label: "Recursos Humanos",
    icon: Users,
    children: [
      { title: "Gestão RH", url: "/rh/gestao-rh" },
      { title: "Abertura de Vaga", url: "/rh/abertura-de-vaga" },
      { title: "Aprovação de Vagas", url: "/rh/aprovacao-vagas" },
    ],
  },
  {
    label: "Dep. Pessoal",
    icon: FileText,
    children: [
      { title: "Alteração de Função / Cargo", url: "/departamento-pessoal/alteracao-funcao" },
      { title: "Solicitação de Férias", url: "/departamento-pessoal/solicitacao-ferias" },
      { title: "Admissão", url: "/departamento-pessoal/admissao" },
      { title: "Efetivo", url: "/departamento-pessoal/efetivo" },
    ],
  },
  {
    label: "Financeiro",
    icon: CircleDollarSign,
    children: [],
    url: "/financeiro",
  },
  {
    label: "Logística",
    icon: Car,
    children: [],
    url: "/logistica",
  },
  {
    label: "Qualidade",
    icon: Award,
    children: [],
    url: "/qualidade",
  },
  {
    label: "SESMT",
    icon: HardHat,
    children: [
      { title: "Agendamento de ASO", url: "/sesmt/agendamento-aso" },
    ],
  },
  {
    label: "Admin",
    icon: Shield,
    children: [
      { title: "Usuários", url: "/admin/usuarios" },
      { title: "Grupos de Permissão", url: "/admin/permissoes" },
      { title: "Log de Auditoria", url: "/admin/audit-log" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    modules.forEach((mod) => {
      if (mod.children.length > 0) {
        const isActive = mod.children.some((c) => location.pathname.startsWith(c.url));
        initial[mod.label] = isActive;
      }
    });
    return initial;
  });

  const toggleModule = (label: string) => {
    setOpenModules((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <span className="font-heading text-lg font-bold text-sidebar-primary-foreground">
              ERP System
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <div className="px-2 mb-1">
          <NavLink
            to="/"
            end
            className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold uppercase tracking-wider transition-colors ${
              location.pathname === "/"
                ? "text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
            style={location.pathname === "/" ? { color: "hsl(var(--sidebar-active))" } : undefined}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Início</span>}
          </NavLink>
        </div>
        {modules.map((mod) => (
          <div key={mod.label} className="px-2 mb-1">
            {mod.children.length > 0 ? (
              <Collapsible open={openModules[mod.label] ?? false} onOpenChange={() => toggleModule(mod.label)}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
                  <mod.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-semibold uppercase tracking-wider">
                        {mod.label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          openModules[mod.label] ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 mt-1 space-y-0.5">
                    {mod.children.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <NavLink
                          key={item.title}
                          to={item.url}
                          end
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive
                              ? "font-medium"
                              : "text-sidebar-muted hover:bg-sidebar-accent"
                          }`}
                          style={isActive ? { color: "hsl(var(--sidebar-active))" } : undefined}
                        >
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sidebar-foreground">
                <mod.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-semibold uppercase tracking-wider text-sidebar-foreground">
                    {mod.label}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
