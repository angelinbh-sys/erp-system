import { useState } from "react";
import { toast } from "@/lib/toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Navigate } from "react-router-dom";

const LimparDadosTeste = () => {
  const { profile, loading } = useAuthContext();
  const { logAction } = useAuditLog();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <p className="text-muted-foreground p-6">Carregando...</p>;

  // Only super_admin can access
  if (!profile?.super_admin) {
    return <Navigate to="/" replace />;
  }

  const handleCleanup = async () => {
    setDeleting(true);
    const SENTINEL = "00000000-0000-0000-0000-000000000000";
    const steps: Array<{ table: "vagas_historico" | "colaboradores_historico" | "colaboradores" | "notificacoes" | "vagas"; label: string }> = [
      { table: "vagas_historico", label: "histórico de vagas" },
      { table: "colaboradores_historico", label: "histórico de colaboradores" },
      { table: "colaboradores", label: "colaboradores" },
      { table: "notificacoes", label: "notificações" },
      { table: "vagas", label: "vagas" },
    ];

    try {
      for (const step of steps) {
        const { error } = await supabase.from(step.table).delete().neq("id", SENTINEL);
        if (error) {
          console.error(`Erro ao excluir ${step.table}:`, error);
          toast.error(`Falha ao excluir ${step.label}: ${error.message}`);
          setDeleting(false);
          return;
        }
      }

      await logAction({
        modulo: "Admin",
        pagina: "Limpar Dados de Teste",
        acao: "exclusao",
        descricao: "Excluiu todos os dados de teste (vagas, colaboradores, notificações, históricos)",
      });

      toast.success("Todos os dados de teste foram excluídos com sucesso.");
      setShowConfirm(false);
    } catch (err) {
      console.error("Erro inesperado ao limpar dados de teste:", err);
      toast.error("Erro inesperado ao excluir dados de teste.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Limpar Dados de Teste
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Ação Irreversível
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta ação irá excluir permanentemente todos os dados de teste do sistema:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Todas as vagas e seus históricos</li>
            <li>Todos os colaboradores e seus históricos</li>
            <li>Todas as notificações</li>
          </ul>
          <p className="text-sm text-destructive font-medium">
            Esta ação não pode ser desfeita. Os registros de auditoria serão mantidos.
          </p>

          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Dados de Teste
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir TODOS os dados de teste? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Excluindo..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LimparDadosTeste;
