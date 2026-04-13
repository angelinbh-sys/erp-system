import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isAfter,
  startOfDay,
  isSameDay,
  differenceInCalendarDays,
  isWeekend,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DayStatus = "vazio" | "preenchendo" | "finalizado" | "atrasado" | "futuro";

interface FrequenciaCalendarProps {
  mesAtual: Date;
  onMesChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  diaSelecionado: Date | null;
  /** Set of date strings (yyyy-MM-dd) that have saved frequency records */
  diasFinalizados: Set<string>;
  /** Set of date strings (yyyy-MM-dd) currently being filled (unsaved changes) */
  diasPreenchendo: Set<string>;
}

const DIAS_SEMANA = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

function countBusinessDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const current = new Date(from);
  current.setDate(current.getDate() + 1);
  while (current <= to) {
    if (!isWeekend(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getDayStatus(
  day: Date,
  hoje: Date,
  diasFinalizados: Set<string>,
  diasPreenchendo: Set<string>
): DayStatus {
  const key = format(day, "yyyy-MM-dd");

  if (isAfter(startOfDay(day), hoje)) return "futuro";
  if (diasFinalizados.has(key)) return "finalizado";
  if (diasPreenchendo.has(key)) return "preenchendo";

  // Check if late: past day, not weekend, not finalized, and > 48 business hours (2 business days)
  if (isBefore(startOfDay(day), hoje) && !isWeekend(day)) {
    const bizDays = countBusinessDaysBetween(day, hoje);
    if (bizDays > 2) return "atrasado";
  }

  return "vazio";
}

const statusBg: Record<DayStatus, string> = {
  vazio: "bg-white dark:bg-background",
  preenchendo: "bg-green-400",
  finalizado: "bg-muted-foreground/60",
  atrasado: "bg-red-400",
  futuro: "bg-muted/30",
};

export default function FrequenciaCalendar({
  mesAtual,
  onMesChange,
  onDayClick,
  diaSelecionado,
  diasFinalizados,
  diasPreenchendo,
}: FrequenciaCalendarProps) {
  const hoje = startOfDay(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(mesAtual), { locale: ptBR });
    const end = endOfWeek(endOfMonth(mesAtual), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [mesAtual]);

  const weeks = useMemo(() => {
    const w: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      w.push(calendarDays.slice(i, i + 7));
    }
    return w;
  }, [calendarDays]);

  const handlePrevMonth = () => {
    const prev = new Date(mesAtual);
    prev.setMonth(prev.getMonth() - 1);
    onMesChange(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(mesAtual);
    next.setMonth(next.getMonth() + 1);
    onMesChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-t-lg px-4 py-3">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="text-primary-foreground hover:bg-primary/80">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold uppercase">
          {format(mesAtual, "MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase()}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-primary-foreground hover:bg-primary/80">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-primary/80 text-primary-foreground text-center text-sm font-semibold">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 border border-border">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const inMonth = isSameMonth(day, mesAtual);
            const status = getDayStatus(day, hoje, diasFinalizados, diasPreenchendo);
            const isFuture = status === "futuro";
            const selected = diaSelecionado && isSameDay(day, diaSelecionado);
            const isToday = isSameDay(day, hoje);
            const clickable = inMonth && !isFuture;

            return (
              <div
                key={`${wi}-${di}`}
                onClick={() => clickable && onDayClick(day)}
                className={cn(
                  "relative min-h-[80px] md:min-h-[100px] border border-border/50 p-1 transition-all",
                  inMonth ? statusBg[status] : "bg-muted/10",
                  clickable && "cursor-pointer hover:ring-2 hover:ring-primary/50",
                  !clickable && "cursor-default opacity-50",
                  selected && "ring-2 ring-primary ring-offset-1",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    !inMonth && "text-muted-foreground/40",
                    isToday && "bg-primary text-primary-foreground rounded-full px-1.5 py-0.5",
                    status === "finalizado" && inMonth && "text-white",
                    status === "atrasado" && inMonth && "text-white",
                    status === "preenchendo" && inMonth && "text-white",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-border bg-white dark:bg-background" />
          <span>Vazio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-400" />
          <span>Em preenchimento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted-foreground/60" />
          <span>Finalizado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-400" />
          <span>Atrasado</span>
        </div>
      </div>
    </div>
  );
}
