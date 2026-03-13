import { useState, useRef } from "react";
import { Bell, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNotificacoesNaoLidas, useNotificacoes, useMarcarLida, useMarcarTodasLidas } from "@/hooks/useNotificacoes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { formatFirstLastName } from "@/utils/formatName";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function UserAreaHeader() {
  const { profile, signOut } = useAuthContext();
  const { data: naoLidas = [] } = useNotificacoesNaoLidas();
  const { data: todasNotificacoes = [] } = useNotificacoes();
  const marcarLida = useMarcarLida();
  const marcarTodasLidas = useMarcarTodasLidas();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem("erp_avatar_url");
    } catch {
      return null;
    }
  });

  const handleNotifClick = (notif: typeof naoLidas[0]) => {
    if (!notif.lida) {
      marcarLida.mutate(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${profile.user_id}.${ext}`;

      const { error } = await supabase.storage
        .from("aso-documentos")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("aso-documentos")
        .getPublicUrl(path);

      const url = urlData.publicUrl + "?t=" + Date.now();
      setAvatarUrl(url);
      localStorage.setItem("erp_avatar_url", url);
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao enviar foto.");
    }
  };

  // Show last 15 notifications (read + unread)
  const recentNotifs = todasNotificacoes.slice(0, 15);

  return (
    <div className="flex items-center gap-1">
      {/* Notifications Bell */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            {naoLidas.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {naoLidas.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Notificações</p>
          </div>
          <div className="max-h-80 overflow-y-scroll [scrollbar-gutter:stable]">
            {recentNotifs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                Nenhuma notificação.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentNotifs.map((n) => {
                  const isUnread = !n.lida;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className={`text-sm text-foreground ${isUnread ? "font-bold" : "font-normal"}`}>
                        {n.titulo}
                      </p>
                      <p className={`text-xs mt-0.5 ${isUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {n.mensagem}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString("pt-BR")}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* User Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 cursor-pointer border-2 border-border hover:border-primary transition-colors">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                {getInitials(profile?.nome || "U")}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground">{formatFirstLastName(profile?.nome)}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
            <Camera className="h-4 w-4 mr-2" />
            Alterar foto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/alterar-senha")} className="cursor-pointer">
            Alterar senha
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
    </div>
  );
}
