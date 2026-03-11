import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Log login after successful auth (can't use useAuditLog since profile may not be ready)
async function logLoginAudit(email: string) {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const { data: profile } = await supabase.from("profiles").select("nome").eq("user_id", userId!).single();
    await (supabase.from("audit_logs" as any) as any).insert({
      user_id: userId,
      user_name: profile?.nome || email,
      modulo: "Autenticação",
      pagina: "Login",
      acao: "login",
      descricao: `Login realizado: ${email}`,
    });
  } catch { /* silent */ }
}

const Login = () => {
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !senha.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), senha);
      await logLoginAudit(email.trim());
      navigate("/", { replace: true });
    } catch {
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast.error("Informe seu email.");
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/alterar-senha`,
      });
      if (error) throw error;
      toast.success("Link de recuperação enviado para seu email.");
      setShowForgot(false);
      setForgotEmail("");
    } catch {
      toast.error("Erro ao enviar link de recuperação. Verifique o email informado.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            ERP System
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Faça login para acessar o sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => { setShowForgot(true); setForgotEmail(email); }}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Forgot password dialog */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Informe seu email cadastrado. Enviaremos um link para redefinir sua senha.
          </p>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForgot(false)}>Cancelar</Button>
            <Button onClick={handleForgotPassword} disabled={forgotLoading}>
              {forgotLoading ? "Enviando..." : "Enviar Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
