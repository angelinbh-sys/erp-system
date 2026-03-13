import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificacoesNaoLidas, useMarcarLida } from "@/hooks/useNotificacoes";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificacoesBell() {
  const { profile } = useAuthContext();
  const grupoPermissao = profile?.super_admin ? "super_admin" : profile?.grupo_permissao || "";
  const { data: notificacoes = [] } = useNotificacoesNaoLidas(grupoPermissao);
  const marcarLida = useMarcarLida();
  const navigate = useNavigate();

  const handleClick = (notif: typeof notificacoes[0]) => {
    marcarLida.mutate(notif.id);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificacoes.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {notificacoes.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Notificações</p>
        </div>
        <div className="max-h-[350px] overflow-y-scroll">
          {notificacoes.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              Nenhuma notificação pendente.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{n.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.mensagem}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString("pt-BR")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
