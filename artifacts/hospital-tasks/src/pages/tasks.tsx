import React, { useState } from "react";
import { Link } from "wouter";
import {
  useListTasks,
  getListTasksQueryKey,
  useListCategories,
  useUpdateTaskStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/triage";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

export default function TasksList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryParams: Record<string, unknown> = {};
  if (search) queryParams.search = search;
  if (status !== "all") queryParams.status = status;
  if (priority !== "all") queryParams.priority = priority;
  if (category !== "all") queryParams.categoryId = parseInt(category);

  const { data: tasks, isLoading } = useListTasks(queryParams as any, {
    query: { queryKey: getListTasksQueryKey(queryParams as any) },
  });

  const { data: categories } = useListCategories();

  const updateStatus = useUpdateTaskStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      },
    },
  });

  const hasFilters = search || status !== "all" || priority !== "all" || category !== "all";

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Lista de Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organizadas pela urgência da triagem.
          </p>
        </div>
        <Button asChild className="h-11 px-6 w-full sm:w-auto">
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nova Tarefa
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-3 md:p-4 flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              className="pl-9 h-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`md:hidden flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md border transition-colors ${
              hasFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-secondary"
            }`}
          >
            <Filter className="w-4 h-4" />
            {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div
          className={`${
            filtersOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row gap-3 px-3 md:px-4 pb-3 md:pb-4`}
        >
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40 h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
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
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
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
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPriority("all");
                setCategory("all");
              }}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors self-center"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card rounded-xl border" />
          ))}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-dashed space-y-2">
          <Filter className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-40" />
          <h3 className="text-base font-bold">Nenhuma tarefa encontrada</h3>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "Tente ajustar os filtros acima."
              : "Crie sua primeira tarefa clicando em Nova Tarefa."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks?.map((task) => (
            <div
              key={task.id}
              className="group bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`mt-1 w-4 h-4 rounded-full flex-shrink-0 ring-4 ring-background ${
                    task.priority === "critical"
                      ? "bg-red-500"
                      : task.priority === "high"
                      ? "bg-orange-500"
                      : task.priority === "medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                <div className="min-w-0 space-y-1.5">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-base md:text-lg font-bold hover:underline line-clamp-1 block"
                  >
                    {task.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text} ${PRIORITY_COLORS[task.priority].border}`}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${STATUS_COLORS[task.status].bg} ${STATUS_COLORS[task.status].text}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.categoryName && (
                      <span className="flex items-center gap-1.5 bg-secondary px-2 py-0.5 rounded-md text-xs font-medium text-secondary-foreground">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.categoryColor || "#ccc" }}
                        />
                        {task.categoryName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs">
                        Vence: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {task.status !== "done" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                    onClick={() =>
                      updateStatus.mutate({ id: task.id, data: { status: "done" } })
                    }
                    disabled={updateStatus.isPending}
                  >
                    Concluir
                  </Button>
                )}
                <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" asChild>
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
