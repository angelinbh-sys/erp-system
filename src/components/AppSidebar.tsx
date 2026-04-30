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
  FolderKanban,
  LayoutDashboard,
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
import { useAuthContext } from "@/contexts/AuthContext";

type ChildItem = { title: string; url: string; modulo: string; pagina: string };
type ModuleDef = {
  label: string;
  icon: typeof Users;
  children: ChildItem[];
  url?: string;
  modulo?: string;
  pagina?: string;
};

const modules: ModuleDef[] = [
  {
    label: "Contratos",
    icon: FolderKanban,
    children: [
      { title: "Dashboard de Contratos", url: "/contratos/dashboard", modulo: "Contratos", pagina: "Dashboard de Contratos" },
      { title: "Cadastro de Contratos", url: "/contratos/cadastro", modulo: "Contratos", pagina: "Cadastro de Contratos" },
      { title: "Medições", url: "/contratos/medicoes", modulo: "Contratos", pagina: "Medições" },
      { title: "Relatórios", url: "/contratos/relatorios", modulo: "Contratos", pagina: "Relatórios" },
    ],
  },
  {
    label: "Planejamento",
    icon: LayoutDashboard,
    children: [
      { title: "Organograma de Projetos", url: "/planejamento/organograma", modulo: "Planejamento", pagina: "Organograma de Projetos" },
    ],
  },
  {
    label: "Recursos Humanos",
    icon: Users,
    children: [
      { title: "Gestão RH", url: "/rh/gestao-rh", modulo: "Recursos Humanos", pagina: "Gestão RH" },
      { title: "Solicitação de Vaga", url: "/rh/solicitacao-de-vaga", modulo: "Recursos Humanos", pagina: "Solicitação de Vaga" },
      { title: "Aprovação de Vaga", url: "/rh/aprovacao-vaga", modulo: "Recursos Humanos", pagina: "Aprovação de Vaga" },
      { title: "Registro de Frequência", url: "/rh/registro-frequencia", modulo: "Recursos Humanos", pagina: "Registro de Frequência" },
      { title: "Dashboard Frequência", url: "/rh/dashboard-frequencia", modulo: "Recursos Humanos", pagina: "Dashboard Frequência" },
    ],
  },
  {
    label: "Dep. Pessoal",
    icon: FileText,
    children: [
      { title: "Alteração de Função / Cargo", url: "/departamento-pessoal/alteracao-funcao", modulo: "Dep. Pessoal", pagina: "Alteração de Função / Cargo" },
      { title: "Solicitação de Férias", url: "/departamento-pessoal/solicitacao-ferias", modulo: "Dep. Pessoal", pagina: "Solicitação de Férias" },
      { title: "Admissão", url: "/departamento-pessoal/admissao", modulo: "Dep. Pessoal", pagina: "Admissão" },
      { title: "Efetivo", url: "/departamento-pessoal/efetivo", modulo: "Dep. Pessoal", pagina: "Efetivo" },
    ],
  },
  {
    label: "Financeiro",
    icon: CircleDollarSign,
    children: [],
    url: "/financeiro",
    modulo: "Financeiro",
    pagina: "Financeiro",
  },
  {
    label: "Logística",
    icon: Car,
    children: [],
    url: "/logistica",
    modulo: "Logística",
    pagina: "Logística",
  },
  {
    label: "Qualidade",
    icon: Award,
    children: [],
    url: "/qualidade",
    modulo: "Qualidade",
    pagina: "Qualidade",
  },
  {
    label: "SESMT",
    icon: HardHat,
    children: [
      { title: "Agendamento de ASO", url: "/sesmt/agendamento-aso", modulo: "SESMT", pagina: "Agendamento de ASO" },
    ],
  },
  {
    label: "Admin",
    icon: Shield,
    children: [
      { title: "Usuários", url: "/admin/usuarios", modulo: "Admin", pagina: "Usuários" },
      { title: "Grupos de Permissão", url: "/admin/permissoes", modulo: "Admin", pagina: "Grupos de Permissão" },
      { title: "Log de Auditoria", url: "/admin/audit-log", modulo: "Admin", pagina: "Log de Auditoria" },
      { title: "Limpar Dados de Teste", url: "/admin/limpar-dados", modulo: "Admin", pagina: "Limpar Dados de Teste" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile } = useAuthContext();

  const hasAccess = (modulo: string, pagina: string): boolean => {
    if (profile?.super_admin) return true;
    const key = `${modulo}::${pagina}`;
    return profile?.permissoes?.[key]?.["acesso"] === true;
  };

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
        {modules.map((mod) => {
          if (mod.children.length > 0) {
            const visibleChildren = mod.children.filter((item) => hasAccess(item.modulo, item.pagina));
            if (visibleChildren.length === 0) return null;
            return (
              <div key={mod.label} className="px-2 mb-1">
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
                      {visibleChildren.map((item) => {
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
              </div>
            );
          }

          // Module without children (placeholder modules)
          if (mod.modulo && mod.pagina && !hasAccess(mod.modulo, mod.pagina)) return null;
          return (
            <div key={mod.label} className="px-2 mb-1">
              <div className="flex items-center gap-2 px-3 py-2.5 text-sidebar-foreground">
                <mod.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-semibold uppercase tracking-wider text-sidebar-foreground">
                    {mod.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
