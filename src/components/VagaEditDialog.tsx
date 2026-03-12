import { useState } from "react";
import { toast } from "@/lib/toast";
import { capitalizeName, formatFirstLastName } from "@/utils/formatName";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useCreateNotificacao } from "@/hooks/useNotificacoes";
import { useAuthContext } from "@/contexts/AuthContext";
import { STATUS_PROCESSO } from "@/utils/statusProcesso";
import type { Vaga } from "@/hooks/useVagas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  vaga: Vaga | null;
  onClose: () => void;
  onSaved?: () => void;
}

function getEditFormFromVaga(vaga: Vaga): Record<string, string> {
  return {
    nome_candidato: vaga.nome_candidato || "",
    cargo: vaga.cargo || "",
    salario: vaga.salario || "",
    telefone: vaga.telefone || "",
    cpf: (vaga as any).cpf || "",
    sexo: (vaga as any).sexo || "",
    centro_custo_nome: vaga.centro_custo_nome || "",
    site_contrato: vaga.site_contrato || "",
    local_trabalho: (vaga as any).local_trabalho || "",
    data_nascimento: (vaga as any).data_nascimento || "",
  };
}

export default function VagaEditDialog({ vaga, onClose, onSaved }: Props) {
  const { profile } = useAuthContext();
  const { logAction } = useAuditLog();
  const createNotificacao = useCreateNotificacao();
  const [editForm, setEditForm] = useState<Record<string, string>>(
    vaga ? getEditFormFromVaga(vaga) : {}
  );
  const [saving, setSaving] = useState(false);
  const [reenviarLoading, setReenviarLoading] = useState(false);

  // Reset form when vaga changes
  if (vaga && editForm._id !== vaga.id) {
    const newForm = getEditFormFromVaga(vaga);
    newForm._id = vaga.id;
    setEditForm(newForm);
  }

  const handleSave = async () => {
    if (!vaga) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("vagas").update({
        nome_candidato: capitalizeName(editForm.nome_candidato),
        cargo: editForm.cargo,
        salario: editForm.salario,
        telefone: editForm.telefone,
        cpf: editForm.cpf,
        sexo: editForm.sexo,
        centro_custo_nome: editForm.centro_custo_nome,
        site_contrato: editForm.site_contrato,
        local_trabalho: editForm.local_trabalho,
        data_nascimento: editForm.data_nascimento,
        atualizado_por: formatFirstLastName(profile?.nome) || "Sistema",
      } as any).eq("id", vaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: vaga.id,
        acao: "Dados editados após devolução",
        usuario_nome: formatFirstLastName(profile?.nome) || "Sistema",
      } as any);

      await logAction({
        modulo: "Recursos Humanos", pagina: "Solicitações Devolvidas", acao: "edicao",
        descricao: `Editou dados da vaga devolvida: ${editForm.cargo} — ${editForm.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${editForm.cargo} - ${editForm.nome_candidato}`,
      });

      toast.success("Dados da vaga atualizados com sucesso.");
      onSaved?.();
    } catch {
      toast.error("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleReenviar = async () => {
    if (!vaga) return;
    setReenviarLoading(true);
    try {
      const { error } = await supabase.from("vagas").update({
        status: "Aguardando Aprovação",
        status_processo: STATUS_PROCESSO.AGUARDANDO_DIRETORIA,
        responsavel_etapa: "Diretoria",
        observacao_reprovacao: null,
        atualizado_por: formatFirstLastName(profile?.nome) || "Sistema",
      } as any).eq("id", vaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: vaga.id,
        acao: "Reenviada pelo RH para aprovação",
        usuario_nome: formatFirstLastName(profile?.nome) || "Sistema",
      } as any);

      await createNotificacao.mutateAsync({
        titulo: "Vaga reenviada para aprovação",
        mensagem: `A vaga ${vaga.cargo} (${vaga.nome_candidato}) foi corrigida e reenviada para aprovação.`,
        tipo: "warning",
        link: "/rh/aprovacao-vaga",
        vaga_id: vaga.id,
        destinatario_grupo: "Diretoria",
      });

      await logAction({
        modulo: "Recursos Humanos", pagina: "Solicitações Devolvidas", acao: "reenvio",
        descricao: `Reenviou vaga para aprovação: ${vaga.cargo} — ${vaga.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });

      toast.success("Vaga reenviada para aprovação da Diretoria.");
      onSaved?.();
    } catch {
      toast.error("Erro ao reenviar vaga.");
    } finally {
      setReenviarLoading(false);
    }
  };

  return (
    <Dialog open={!!vaga} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-6 pb-8">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Dados da Vaga</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 pr-2 min-h-0">
          <div><Label>Nome do Candidato</Label><Input value={editForm.nome_candidato || ""} onChange={(e) => setEditForm(p => ({ ...p, nome_candidato: e.target.value }))} /></div>
          <div><Label>Cargo / Função</Label><Input value={editForm.cargo || ""} onChange={(e) => setEditForm(p => ({ ...p, cargo: e.target.value }))} /></div>
          <div><Label>Salário</Label><Input value={editForm.salario || ""} onChange={(e) => setEditForm(p => ({ ...p, salario: e.target.value }))} /></div>
          <div><Label>Centro de Custo</Label><Input value={editForm.centro_custo_nome || ""} onChange={(e) => setEditForm(p => ({ ...p, centro_custo_nome: e.target.value }))} /></div>
          <div><Label>Site / Contrato</Label><Input value={editForm.site_contrato || ""} onChange={(e) => setEditForm(p => ({ ...p, site_contrato: e.target.value }))} /></div>
          <div><Label>Local de Trabalho</Label><Input value={editForm.local_trabalho || ""} onChange={(e) => setEditForm(p => ({ ...p, local_trabalho: e.target.value }))} /></div>
          <div><Label>Data de Nascimento</Label><Input type="date" value={editForm.data_nascimento || ""} onChange={(e) => setEditForm(p => ({ ...p, data_nascimento: e.target.value }))} /></div>
          <div><Label>Telefone</Label><Input value={editForm.telefone || ""} onChange={(e) => setEditForm(p => ({ ...p, telefone: e.target.value }))} /></div>
          <div><Label>CPF</Label><Input value={editForm.cpf || ""} onChange={(e) => setEditForm(p => ({ ...p, cpf: e.target.value }))} maxLength={14} /></div>
          <div>
            <Label>Sexo</Label>
            <Select value={editForm.sexo || ""} onValueChange={(v) => setEditForm(p => ({ ...p, sexo: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(vaga as any)?.observacao_reprovacao && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
              <strong>Motivo da devolução:</strong> {(vaga as any).observacao_reprovacao}
            </div>
          )}
        </div>
        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-4 border-t mt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button onClick={handleReenviar} disabled={reenviarLoading || saving}>
            {reenviarLoading ? "Reenviando..." : "Salvar e Reenviar para Aprovação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
