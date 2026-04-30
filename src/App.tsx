import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import ColaboradorDetalhes from "@/pages/dp/ColaboradorDetalhes";
import AdminUsuarios from "@/pages/admin/Usuarios";
import AdminPermissoes from "@/pages/admin/Permissoes";
import AuditLog from "@/pages/admin/AuditLog";
import LimparDadosTeste from "@/pages/admin/LimparDadosTeste";
import AgendamentoASO from "@/pages/sesmt/AgendamentoASO";
import DashboardContratos from "@/pages/contratos/DashboardContratos";
import CadastroContratos from "@/pages/contratos/CadastroContratos";
import MedicoesPage from "@/pages/contratos/Medicoes";
import RelatoriosContratos from "@/pages/contratos/RelatoriosContratos";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import Organograma from "@/pages/planejamento/Organograma";
import RegistroFrequencia from "@/pages/rh/RegistroFrequencia";
import DashboardFrequencia from "@/pages/rh/DashboardFrequencia";
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
            <Route path="/alterar-senha" element={<AlterarSenha />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/contratos/dashboard"
                element={
                  <ProtectedRoute modulo="Contratos" pagina="Dashboard de Contratos">
                    <PageErrorBoundary title="o dashboard de contratos">
                      <DashboardContratos />
                    </PageErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contratos/cadastro"
                element={
                  <ProtectedRoute modulo="Contratos" pagina="Cadastro de Contratos">
                    <CadastroContratos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contratos/medicoes"
                element={
                  <ProtectedRoute modulo="Contratos" pagina="Medições">
                    <PageErrorBoundary title="a tela de medições">
                      <MedicoesPage />
                    </PageErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contratos/relatorios"
                element={
                  <ProtectedRoute modulo="Contratos" pagina="Relatórios">
                    <RelatoriosContratos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rh/gestao-rh"
                element={
                  <ProtectedRoute modulo="Recursos Humanos" pagina="Gestão RH">
                    <GestaoRH />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rh/solicitacao-de-vaga"
                element={
                  <ProtectedRoute modulo="Recursos Humanos" pagina="Solicitação de Vaga">
                    <AberturaDeVaga />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rh/aprovacao-vaga"
                element={
                  <ProtectedRoute modulo="Recursos Humanos" pagina="Aprovação de Vaga">
                    <AprovacaoVagas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rh/registro-frequencia"
                element={
                  <ProtectedRoute modulo="Recursos Humanos" pagina="Registro de Frequência">
                    <RegistroFrequencia />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rh/dashboard-frequencia"
                element={
                  <ProtectedRoute modulo="Recursos Humanos" pagina="Dashboard Frequência">
                    <DashboardFrequencia />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departamento-pessoal/alteracao-funcao"
                element={
                  <ProtectedRoute modulo="Dep. Pessoal" pagina="Alteração de Função / Cargo">
                    <AlteracaoFuncao />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departamento-pessoal/solicitacao-ferias"
                element={
                  <ProtectedRoute modulo="Dep. Pessoal" pagina="Solicitação de Férias">
                    <SolicitacaoFerias />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departamento-pessoal/admissao"
                element={
                  <ProtectedRoute modulo="Dep. Pessoal" pagina="Admissão">
                    <Admissao />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departamento-pessoal/efetivo"
                element={
                  <ProtectedRoute modulo="Dep. Pessoal" pagina="Efetivo">
                    <Efetivo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departamento-pessoal/efetivo/:id"
                element={
                  <ProtectedRoute modulo="Dep. Pessoal" pagina="Efetivo">
                    <ColaboradorDetalhes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute modulo="Admin" pagina="Usuários">
                    <AdminUsuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/permissoes"
                element={
                  <ProtectedRoute modulo="Admin" pagina="Grupos de Permissão">
                    <AdminPermissoes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-log"
                element={
                  <ProtectedRoute modulo="Admin" pagina="Log de Auditoria">
                    <AuditLog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/limpar-dados"
                element={
                  <ProtectedRoute modulo="Admin" pagina="Limpar Dados de Teste">
                    <LimparDadosTeste />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sesmt/agendamento-aso"
                element={
                  <ProtectedRoute modulo="SESMT" pagina="Agendamento de ASO">
                    <AgendamentoASO />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planejamento/organograma"
                element={
                  <ProtectedRoute modulo="Planejamento" pagina="Organograma de Projetos">
                    <Organograma />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financeiro"
                element={
                  <ProtectedRoute modulo="Financeiro" pagina="Financeiro">
                    <ModulePlaceholder title="Financeiro" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logistica"
                element={
                  <ProtectedRoute modulo="Logística" pagina="Logística">
                    <ModulePlaceholder title="Logística" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qualidade"
                element={
                  <ProtectedRoute modulo="Qualidade" pagina="Qualidade">
                    <ModulePlaceholder title="Qualidade" />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
