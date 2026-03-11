import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

const AlterarSenha = () => {
  const { user, profile, loading, refetchProfile } = useAuthContext();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { logAction } = useAuditLog();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isFirstLogin = profile?.must_change_password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (novaSenha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });
      if (updateError) throw updateError;

      if (profile) {
        await supabase
          .from("profiles")
          .update({ must_change_password: false } as Record<string, unknown>)
          .eq("user_id", profile.user_id);
      }

      toast.success("Senha alterada com sucesso.");
      await logAction({ modulo: "Autenticação", pagina: "Alterar Senha", acao: "troca_senha", descricao: "Alterou a senha" });
      refetchProfile();
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      let message = "Erro ao alterar senha.";
      if (raw.toLowerCase().includes("same password") || raw.toLowerCase().includes("different from the old password")) {
        message = "A nova senha não pode ser igual à senha anterior.\nPor favor, escolha uma senha diferente.";
      } else if (raw.toLowerCase().includes("password")) {
        message = "Senha inválida. Verifique os requisitos e tente novamente.";
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            Alterar Senha
          </CardTitle>
          {isFirstLogin && (
            <p className="text-sm text-amber-600 font-medium">
              Por segurança, altere sua senha antes de acessar o sistema.
            </p>
          )}
          {!isFirstLogin && (
            <p className="text-sm text-muted-foreground">
              Defina sua nova senha
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input
                id="novaSenha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium text-center whitespace-pre-line">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              <Lock className="h-4 w-4 mr-2" />
              {submitting ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlterarSenha;
