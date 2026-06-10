import React, { useState } from "react";
import { Link } from "wouter";
import { useListTasks, getListTasksQueryKey, TaskPriority, TaskStatus, useListCategories, useUpdateTaskStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/triage";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, Filter } from "lucide-react";
import { format } from "date-fns";

export default function TasksList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const queryParams: any = {};
  if (search) queryParams.search = search;
  if (status !== "all") queryParams.status = status;
  if (priority !== "all") queryParams.priority = priority;
  if (category !== "all") queryParams.categoryId = parseInt(category);

  const { data: tasks, isLoading } = useListTasks(queryParams, {
    query: { queryKey: getListTasksQueryKey(queryParams) }
  });

  const { data: categories } = useListCategories();
  
  const updateStatus = useUpdateTaskStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Lista de Tarefas</h1>
          <p className="text-muted-foreground mt-1">Todas as tarefas em um só lugar, organizadas pela urgência.</p>
        </div>
        <Button asChild className="h-11 px-8">
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nova Tarefa
          </Link>
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar tarefas..." 
            className="pl-9 h-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40 h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full md:w-40 h-10">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda Prioridade</SelectItem>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-40 h-10">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda Categoria</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-xl border" />)}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-bold">Nenhuma tarefa encontrada</h3>
          <p className="text-muted-foreground mt-1">Tente ajustar os filtros ou crie uma nova tarefa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks?.map((task) => (
            <div key={task.id} className="group bg-card rounded-xl border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-4 flex-1">
                <div className={`mt-1 w-4 h-4 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority].bg.split(' ')[0].replace('bg-', 'bg-')} ring-4 ring-background`} />
                <div className="space-y-1">
                  <Link href={`/tasks/${task.id}`} className="text-lg font-bold hover:underline line-clamp-1">
                    {task.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text} ${PRIORITY_COLORS[task.priority].border}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${STATUS_COLORS[task.status].bg} ${STATUS_COLORS[task.status].text}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    
                    {task.categoryName && (
                      <span className="flex items-center gap-1.5 bg-secondary px-2 py-0.5 rounded-md text-xs font-medium text-secondary-foreground">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.categoryColor || '#ccc' }} />
                        {task.categoryName}
                      </span>
                    )}

                    {task.dueDate && (
                      <span className="text-xs">
                        Vence em: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                {task.status !== "done" && (
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                    onClick={() => updateStatus.mutate({ id: task.id, data: { status: "done" } })}
                    disabled={updateStatus.isPending}
                  >
                    Concluir
                  </Button>
                )}
                <Button variant="secondary" className="flex-1 md:flex-none" asChild>
                  <Link href={`/tasks/${task.id}`}>Ver</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
