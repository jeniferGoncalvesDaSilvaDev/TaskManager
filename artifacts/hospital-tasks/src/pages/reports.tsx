import React, { useMemo } from "react";
import { useListTasks } from "@workspace/api-client-react";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { TrendingUp, Clock, CheckCircle2, Target, BarChart2, AlertTriangle } from "lucide-react";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/triage";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${accent || "text-primary"}`} />
      </div>
      <div>
        <p className={`text-3xl font-extrabold tabular-nums ${accent || ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: { label: string; value: number; max: number; sub?: string }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.max), 1);

  return (
    <div className="flex items-end gap-2 h-40 w-full">
      {data.map((d, i) => {
        const pct = maxVal > 0 ? Math.round((d.value / maxVal) * 100) : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="text-xs font-bold tabular-nums text-foreground">
              {d.value > 0 ? d.value : ""}
            </span>
            <div className="w-full relative flex items-end" style={{ height: "80%" }}>
              <div
                className="w-full rounded-t-md bg-primary transition-all duration-500"
                style={{ height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {d.label}
            </span>
            {d.sub && (
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {d.sub}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  max,
  color,
  count,
  avgProgress,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  count: number;
  avgProgress: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground tabular-nums text-xs">
          {count} tarefa{count !== 1 ? "s" : ""} · media {avgProgress}%
        </span>
      </div>
      <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function Reports() {
  const { data: allTasks, isLoading } = useListTasks({});

  const stats = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return null;

    const done = allTasks.filter((t) => t.status === "done");
    const active = allTasks.filter((t) => t.status !== "cancelled");

    const today = new Date();

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const dayStart = startOfDay(day).getTime();
      const dayEnd = endOfDay(day).getTime();

      const completed = done.filter((t) => {
        if (!t.endTime) return false;
        const ts = new Date(t.endTime).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });

      return {
        label: format(day, "EEE"),
        sub: format(day, "dd/MM"),
        value: completed.length,
        max: done.length,
      };
    });

    const withTime = done.filter((t) => t.startTime && t.endTime);
    let avgMinutes = 0;
    if (withTime.length > 0) {
      const totalMs = withTime.reduce((acc, t) => {
        return acc + (new Date(t.endTime!).getTime() - new Date(t.startTime!).getTime());
      }, 0);
      avgMinutes = Math.round(totalMs / withTime.length / 60000);
    }

    const formatDuration = (mins: number) => {
      if (mins < 60) return `${mins} min`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    const onTime = done.filter((t) => {
      if (!t.dueDate || !t.endTime) return false;
      const due = new Date(t.dueDate);
      due.setHours(23, 59, 59);
      return new Date(t.endTime) <= due;
    });
    const complianceRate =
      done.length > 0 ? Math.round((onTime.length / done.length) * 100) : 0;

    const priorities = ["critical", "high", "medium", "low"] as const;
    const byPriority = priorities.map((p) => {
      const group = active.filter((t) => t.priority === p);
      const totalProgress = group.reduce((acc, t) => acc + (t.progress ?? 0), 0);
      const avg = group.length > 0 ? Math.round(totalProgress / group.length) : 0;
      return { priority: p, count: group.length, avgProgress: avg };
    });

    const maxCount = Math.max(...byPriority.map((b) => b.count), 1);

    const inProgress = allTasks.filter((t) => t.status === "in_progress");
    const avgInProgress =
      inProgress.length > 0
        ? Math.round(
            inProgress.reduce((acc, t) => acc + (t.progress ?? 0), 0) / inProgress.length
          )
        : 0;

    return {
      total: allTasks.length,
      done: done.length,
      inProgress: inProgress.length,
      completionRate: allTasks.length > 0 ? Math.round((done.length / allTasks.length) * 100) : 0,
      last7Days,
      avgMinutes,
      formattedDuration: withTime.length > 0 ? formatDuration(avgMinutes) : "—",
      complianceRate,
      onTimeCount: onTime.length,
      byPriority,
      maxCount,
      avgInProgress,
      withTimeCount: withTime.length,
    };
  }, [allTasks]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card border rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-card border rounded-2xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-24 space-y-3">
        <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-4" />
        <h2 className="text-xl font-bold">Nenhum dado disponivel</h2>
        <p className="text-muted-foreground text-sm">
          Crie e conclua algumas tarefas para ver seu relatorio de produtividade.
        </p>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Relatorio de Produtividade
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analise do desempenho e progresso das suas tarefas.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Taxa de Conclusao"
          value={`${stats.completionRate}%`}
          sub={`${stats.done} de ${stats.total} tarefas`}
          accent="text-green-600"
        />
        <StatCard
          icon={Clock}
          label="Tempo Medio"
          value={stats.formattedDuration}
          sub={
            stats.withTimeCount > 0
              ? `base: ${stats.withTimeCount} tarefa${stats.withTimeCount !== 1 ? "s" : ""}`
              : "sem dados de tempo"
          }
          accent="text-blue-600"
        />
        <StatCard
          icon={Target}
          label="Dentro do Prazo"
          value={`${stats.complianceRate}%`}
          sub={`${stats.onTimeCount} de ${stats.done} concluidas`}
          accent={stats.complianceRate >= 70 ? "text-green-600" : "text-orange-500"}
        />
        <StatCard
          icon={TrendingUp}
          label="Em Andamento"
          value={`${stats.avgInProgress}%`}
          sub={`media de ${stats.inProgress} tarefa${stats.inProgress !== 1 ? "s" : ""} ativas`}
          accent="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Tarefas Concluidas — Ultimos 7 Dias
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quantidade de tarefas marcadas como concluidas por dia.
            </p>
          </div>
          {stats.done === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Nenhuma tarefa concluida ainda.
            </div>
          ) : (
            <BarChart data={stats.last7Days} />
          )}
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Progresso Medio por Prioridade
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Percentual medio de conclusao agrupado por nivel de triagem.
            </p>
          </div>
          <div className="space-y-4 pt-1">
            {stats.byPriority.map(({ priority, count, avgProgress }) => (
              <HorizontalBar
                key={priority}
                label={PRIORITY_LABELS[priority]}
                value={count}
                max={stats.maxCount}
                color={priorityColors[priority]}
                count={count}
                avgProgress={avgProgress}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Resumo de Execucao
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tarefas com horario de inicio e fim registrados.
          </p>
        </div>

        {stats.withTimeCount === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Nenhuma tarefa com tempo de execucao registrado ainda. <br />
            Atualize o progresso de uma tarefa para comecar a registrar os horarios.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left font-semibold py-2 pr-4">Tarefa</th>
                  <th className="text-left font-semibold py-2 pr-4 hidden sm:table-cell">
                    Inicio
                  </th>
                  <th className="text-left font-semibold py-2 pr-4 hidden sm:table-cell">Fim</th>
                  <th className="text-left font-semibold py-2 pr-4">Duracao</th>
                  <th className="text-left font-semibold py-2">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allTasks
                  ?.filter((t) => t.startTime && t.endTime)
                  .slice(0, 10)
                  .map((t) => {
                    const ms =
                      new Date(t.endTime!).getTime() - new Date(t.startTime!).getTime();
                    const mins = Math.floor(ms / 60000);
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    const dur = h > 0 ? `${h}h ${m}min` : `${mins}min`;
                    return (
                      <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-2.5 pr-4 font-medium truncate max-w-[160px]">
                          {t.title}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground tabular-nums hidden sm:table-cell text-xs">
                          {format(new Date(t.startTime!), "dd/MM HH:mm")}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground tabular-nums hidden sm:table-cell text-xs">
                          {format(new Date(t.endTime!), "dd/MM HH:mm")}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                          {dur}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${t.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {t.progress ?? 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
