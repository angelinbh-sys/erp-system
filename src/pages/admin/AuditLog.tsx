import { useState } from "react";
import { Search, Filter, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuditLogs, AUDIT_LOG_PAGE_SIZE, type AuditLogFilters } from "@/hooks/useAuditLog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const MODULOS = [
  "Recursos Humanos", "Dep. Pessoal", "SESMT", "Admin", "Financeiro", "Logística", "Qualidade", "Autenticação",
];

const AuditLog = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(appliedFilters, page);
  const logs = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_LOG_PAGE_SIZE));

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };
  const handleClear = () => {
    setFilters({});
    setAppliedFilters({});
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Log de Auditoria
      </h2>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs">Data Início</Label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Usuário</Label>
              <Input
                placeholder="Nome do usuário"
                value={filters.usuario || ""}
                onChange={(e) => setFilters((p) => ({ ...p, usuario: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Módulo</Label>
              <Select
                value={filters.modulo || "__all__"}
                onValueChange={(v) => setFilters((p) => ({ ...p, modulo: v === "__all__" ? undefined : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {MODULOS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Página</Label>
              <Input
                placeholder="Nome da página"
                value={filters.pagina || ""}
                onChange={(e) => setFilters((p) => ({ ...p, pagina: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Ação</Label>
              <Input
                placeholder="Tipo de ação"
                value={filters.acao || ""}
                onChange={(e) => setFilters((p) => ({ ...p, acao: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-1" />
              Buscar
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-40" />
              <p>Nenhum registro de auditoria encontrado.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-3">
              {total} registro(s) encontrado(s) — exibindo {logs.length} nesta página
            </p>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{log.user_name}</TableCell>
                      <TableCell className="text-xs">{log.modulo}</TableCell>
                      <TableCell className="text-xs">{log.pagina}</TableCell>
                      <TableCell className="text-xs">{log.descricao}</TableCell>
                      <TableCell className="text-xs">{log.registro_ref || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{log.motivo || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditLog;
