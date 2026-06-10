import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Activity, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { useGetTaskStats, useGetRecentTasks, TaskStatus, TaskPriority } from "@workspace/api-client-react";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/triage";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetTaskStats();
  const { data: recentTasks, isLoading: recentLoading } = useGetRecentTasks();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Painel de Triagem</h1>
          <p className="text-lg text-muted-foreground mt-2">Visão geral do seu pronto-socorro de tarefas.</p>
        </div>
        <Link href="/tasks/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Tarefa
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-xl border" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Tarefas</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.byPriority.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.byStatus.done}</div>
              <p className="text-xs text-muted-foreground mt-1">Taxa: {(stats.completionRate * 100).toFixed(0)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.byStatus.pending}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Atividades Recentes</h2>
        <div className="bg-card rounded-xl border shadow-sm divide-y">
          {recentLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : recentTasks?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma tarefa recente.</div>
          ) : (
            recentTasks?.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[task.priority].bg.split(' ')[0].replace('bg-', 'bg-')}`} />
                  <div>
                    <Link href={`/tasks/${task.id}`} className="font-semibold hover:underline">
                      {task.title}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      <span>&bull;</span>
                      <span>{STATUS_LABELS[task.status]}</span>
                      {task.categoryName && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.categoryColor || '#ccc' }} />
                            {task.categoryName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
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
