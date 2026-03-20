import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* ─── KPI Skeleton ──────────────────────────────────────────────── */
export function SkeletonKpiCard() {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-7 w-14 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonKpiGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonKpiCard key={i} />
      ))}
    </div>
  );
}

/* ─── Table Skeleton ────────────────────────────────────────────── */
export function SkeletonTable({
  columns = 5,
  rows = 5,
  headers,
}: {
  columns?: number;
  rows?: number;
  headers?: string[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {(headers ?? Array.from({ length: columns })).map((h, i) => (
            <TableHead key={i}>{typeof h === "string" ? h : <Skeleton className="h-4 w-20 rounded" />}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TableRow key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <TableCell key={c}>
                <Skeleton
                  className="h-4 rounded"
                  style={{ width: `${60 + Math.random() * 30}%` }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ─── Aniversariantes Skeleton ──────────────────────────────────── */
export function SkeletonAniversariantes() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40 rounded" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Skeleton className="h-4 w-48 mb-3 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-44 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Atividades Skeleton ───────────────────────────────────────── */
export function SkeletonAtividades() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-44 rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-md border border-border p-3">
            <Skeleton className="mt-0.5 h-2 w-2 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Card com tabela skeleton ──────────────────────────────────── */
export function SkeletonTableCard({
  title,
  columns = 5,
  rows = 5,
  headers,
}: {
  title: string;
  columns?: number;
  rows?: number;
  headers?: string[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 rounded" style={{ width: `${title.length * 8}px`, maxWidth: "200px" }} />
      </CardHeader>
      <CardContent className="p-0">
        <SkeletonTable columns={columns} rows={rows} headers={headers} />
      </CardContent>
    </Card>
  );
}
