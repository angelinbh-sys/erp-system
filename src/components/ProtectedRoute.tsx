import { useAuthContext } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  modulo: string;
  pagina: string;
  children: ReactNode;
}

export function ProtectedRoute({ modulo, pagina, children }: ProtectedRouteProps) {
  const { profile } = useAuthContext();

  if (profile?.super_admin) return <>{children}</>;

  const key = `${modulo}::${pagina}`;
  const hasAccess = profile?.permissoes?.[key]?.["acesso"] === true;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
          Acesso não autorizado
        </h2>
        <p className="text-muted-foreground max-w-md">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador caso precise de acesso.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
