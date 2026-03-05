import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import AberturaDeVaga from "@/pages/rh/AberturaDeVaga";
import GestaoRH from "@/pages/rh/GestaoRH";
import AlteracaoFuncao from "@/pages/dp/AlteracaoFuncao";
import SolicitacaoFerias from "@/pages/dp/SolicitacaoFerias";
import AdminUsuarios from "@/pages/admin/Usuarios";
import AdminPermissoes from "@/pages/admin/Permissoes";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/rh/gestao-rh" replace />} />
            <Route path="/rh/gestao-rh" element={<GestaoRH />} />
            <Route path="/rh/abertura-de-vaga" element={<AberturaDeVaga />} />
            <Route path="/departamento-pessoal/alteracao-funcao" element={<AlteracaoFuncao />} />
            <Route path="/departamento-pessoal/solicitacao-ferias" element={<SolicitacaoFerias />} />
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="/admin/permissoes" element={<AdminPermissoes />} />
            <Route path="/financeiro" element={<ModulePlaceholder title="Financeiro" />} />
            <Route path="/logistica" element={<ModulePlaceholder title="Logística" />} />
            <Route path="/qualidade" element={<ModulePlaceholder title="Qualidade" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
