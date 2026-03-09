import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import AlterarSenha from "@/pages/AlterarSenha";
import Dashboard from "@/pages/Dashboard";
import AberturaDeVaga from "@/pages/rh/AberturaDeVaga";
import GestaoRH from "@/pages/rh/GestaoRH";
import AprovacaoVagas from "@/pages/rh/AprovacaoVagas";
import AlteracaoFuncao from "@/pages/dp/AlteracaoFuncao";
import SolicitacaoFerias from "@/pages/dp/SolicitacaoFerias";
import Admissao from "@/pages/dp/Admissao";
import Efetivo from "@/pages/dp/Efetivo";
import AdminUsuarios from "@/pages/admin/Usuarios";
import AdminPermissoes from "@/pages/admin/Permissoes";
import AgendamentoASO from "@/pages/sesmt/AgendamentoASO";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alterar-senha" element={<AlterarSenha />} />
              <Route path="/rh/gestao-rh" element={<GestaoRH />} />
              <Route path="/rh/abertura-de-vaga" element={<AberturaDeVaga />} />
              <Route path="/rh/aprovacao-vagas" element={<AprovacaoVagas />} />
              <Route path="/departamento-pessoal/alteracao-funcao" element={<AlteracaoFuncao />} />
              <Route path="/departamento-pessoal/solicitacao-ferias" element={<SolicitacaoFerias />} />
              <Route path="/departamento-pessoal/admissao" element={<Admissao />} />
              <Route path="/departamento-pessoal/efetivo" element={<Efetivo />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/permissoes" element={<AdminPermissoes />} />
              <Route path="/sesmt/agendamento-aso" element={<AgendamentoASO />} />
              <Route path="/financeiro" element={<ModulePlaceholder title="Financeiro" />} />
              <Route path="/logistica" element={<ModulePlaceholder title="Logística" />} />
              <Route path="/qualidade" element={<ModulePlaceholder title="Qualidade" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
