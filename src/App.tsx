import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import AberturaDeVaga from "@/pages/rh/AberturaDeVaga";
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
            <Route path="/" element={<Navigate to="/rh/abertura-de-vaga" replace />} />
            <Route path="/rh/abertura-de-vaga" element={<AberturaDeVaga />} />
            <Route path="/departamento-pessoal" element={<ModulePlaceholder title="Departamento Pessoal" />} />
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
