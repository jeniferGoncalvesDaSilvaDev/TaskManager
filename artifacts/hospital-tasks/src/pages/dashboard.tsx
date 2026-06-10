import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Activity, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useGetTaskStats, useGetRecentTasks } from "@workspace/api-client-react";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/triage";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetTaskStats();
  const { data: recentTasks, isLoading: recentLoading } = useGetRecentTasks();

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Painel de Triagem</h1>
          <p className="text-base md:text-lg text-muted-foreground mt-1">
            Visão geral do seu pronto-socorro de tarefas.
          </p>
        </div>
        <Button asChild className="h-11 px-6 w-full sm:w-auto">
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nova Tarefa
          </Link>
        </Button>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card rounded-xl border" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">tarefas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="text-3xl font-bold text-red-600">{stats.byPriority.critical}</div>
              <p className="text-xs text-muted-foreground mt-1">prioridade máxima</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="text-3xl font-bold text-green-600">{stats.byStatus.done}</div>
              <p className="text-xs text-muted-foreground mt-1">
                taxa: {stats.completionRate.toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="text-3xl font-bold">{stats.byStatus.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">aguardando</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-3 md:space-y-4">
        <h2 className="text-xl md:text-2xl font-bold">Atividades Recentes</h2>
        <div className="bg-card rounded-xl border shadow-sm divide-y">
          {recentLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : recentTasks?.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground space-y-2">
              <Activity className="mx-auto h-10 w-10 opacity-30 mb-3" />
              <p className="font-semibold">Nenhuma tarefa ainda.</p>
              <p className="text-sm">Crie sua primeira tarefa para iniciar a triagem.</p>
            </div>
          ) : (
            recentTasks?.map((task) => (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${
                      task.priority === "critical"
                        ? "bg-red-500"
                        : task.priority === "high"
                        ? "bg-orange-500"
                        : task.priority === "medium"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-semibold hover:underline line-clamp-1"
                    >
                      {task.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span className="text-xs">{STATUS_LABELS[task.status]}</span>
                      {task.categoryName && (
                        <>
                          <span className="hidden sm:inline">&bull;</span>
                          <span className="flex items-center gap-1 text-xs">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: task.categoryColor || "#ccc" }}
                            />
                            {task.categoryName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link href={`/tasks/${task.id}`}>Detalhes</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
