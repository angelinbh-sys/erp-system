import {
  Users,
  FileText,
  DollarSign,
  Car,
  Award,
  Building2,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const modules = [
  {
    label: "Recursos Humanos",
    icon: Users,
    children: [
      { title: "Gestão RH", url: "/rh/gestao-rh" },
      { title: "Abertura de Vaga", url: "/rh/abertura-de-vaga" },
    ],
  },
  {
    label: "Departamento Pessoal",
    icon: FileText,
    children: [
      { title: "Alteração de Função / Cargo", url: "/departamento-pessoal/alteracao-funcao" },
      { title: "Solicitação de Férias", url: "/departamento-pessoal/solicitacao-ferias" },
    ],
  },
  {
    label: "Financeiro",
    icon: DollarSign,
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
    label: "Admin",
    icon: Shield,
    children: [
      { title: "Usuários", url: "/admin/usuarios" },
      { title: "Grupos de Permissão", url: "/admin/permissoes" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
      <SidebarContent>
        {modules.map((mod) => (
          <SidebarGroup key={mod.label}>
            <SidebarGroupLabel className="text-sidebar-accent-foreground font-semibold uppercase text-xs tracking-wider">
              <mod.icon className="h-4 w-4 mr-2 shrink-0" />
              {!collapsed && mod.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mod.children.length > 0 ? (
                  mod.children.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="hover:bg-sidebar-accent text-sidebar-foreground pl-8"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          {!collapsed && (
                            <span className="flex items-center gap-2">
                              <span className="text-sidebar-muted text-xs">–</span>
                              <span>{item.title}</span>
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={mod.url || "#"}
                        end
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        {!collapsed && <span className="text-sm text-sidebar-foreground italic ml-6">Em breve</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
