import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface CriadoPorInfoProps {
  /** UUID of the creator (from profiles.user_id) */
  criadoPorId?: string | null;
  /** Direct name string (for localStorage-based records) */
  criadoPorNome?: string | null;
  /** ISO date string */
  criadoEm?: string | null;
  className?: string;
}

export function CriadoPorInfo({ criadoPorId, criadoPorNome, criadoEm, className = "" }: CriadoPorInfoProps) {
  const [nome, setNome] = useState<string | null>(criadoPorNome || null);

  useEffect(() => {
    if (criadoPorNome) {
      setNome(criadoPorNome);
      return;
    }
    if (!criadoPorId) return;

    supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", criadoPorId)
      .single()
      .then(({ data }) => {
        if (data) setNome(data.nome);
      });
  }, [criadoPorId, criadoPorNome]);

  if (!nome && !criadoEm) return null;

  const dataFormatada = criadoEm
    ? new Date(criadoEm).toLocaleDateString("pt-BR")
    : null;
  const horaFormatada = criadoEm
    ? new Date(criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`flex items-start gap-2 text-xs text-muted-foreground ${className}`}>
      <User className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div>
        {nome && <span>Criado por: <strong className="text-foreground">{nome}</strong></span>}
        {dataFormatada && (
          <span className="ml-1">
            — {dataFormatada} às {horaFormatada}
          </span>
        )}
      </div>
    </div>
  );
}
