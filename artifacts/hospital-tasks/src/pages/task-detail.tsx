import React, { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetTask,
  getGetTaskQueryKey,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useListCategories,
  useListSubtasks,
  getListSubtasksQueryKey,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/triage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Folder,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Clock4,
  Play,
  Flag,
  TrendingUp,
  CheckSquare,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";

function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100
      ? "bg-green-500"
      : value >= 66
      ? "bg-blue-500"
      : value >= 33
      ? "bg-amber-500"
      : "bg-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" /> Progresso
        </span>
        <span className="font-bold tabular-nums">{value}%</span>
      </div>
      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ProgressSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const color =
    value === 100
      ? "#22c55e"
      : value >= 66
      ? "#3b82f6"
      : value >= 33
      ? "#f59e0b"
      : "#f87171";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-bold text-sm flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" /> Progresso
        </label>
        <span className="font-bold text-lg tabular-nums" style={{ color }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value}%, var(--secondary) ${value}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {value === 0
          ? "Pendente — tarefa ainda nao iniciada"
          : value === 100
          ? "Concluida — horario de fim sera registrado"
          : `Em Andamento — ${value}% do trabalho realizado`}
      </p>
    </div>
  );
}

function TimeField({
  label,
  icon: Icon,
  value,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string | null | undefined;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" /> {label}
      </span>
      {value ? (
        <div className="space-y-0.5">
          <p className="font-semibold text-sm">
            {format(new Date(value), "dd/MM/yyyy")}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {format(new Date(value), "HH:mm:ss")}
          </p>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground italic">Nao registrado</span>
      )}
    </div>
  );
}

export default function TaskDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: task, isLoading, isError } = useGetTask(id, {
    query: { enabled: !!id, queryKey: getGetTaskQueryKey(id) },
  });

  const { data: categories } = useListCategories();

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        toast({ title: "Salvo", description: "Tarefa atualizada com sucesso." });
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(id) });
      },
    },
  });

  const updateStatus = useUpdateTaskStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(id) });
      },
    },
  });

  const deleteTask = useDeleteTask({
    mutation: {
      onSuccess: () => {
        toast({ title: "Excluida", description: "Tarefa removida da triagem." });
        setLocation("/tasks");
      },
    },
  });

  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const { data: subtasks = [] } = useListSubtasks(id, {
    query: { enabled: !!id, queryKey: getListSubtasksQueryKey(id) },
  });

  const addSubtask = useCreateSubtask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubtasksQueryKey(id) });
        setNewSubtaskTitle("");
        addInputRef.current?.focus();
      },
    },
  });

  const toggleSubtask = useUpdateSubtask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubtasksQueryKey(id) });
      },
    },
  });

  const removeSubtask = useDeleteSubtask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubtasksQueryKey(id) });
      },
    },
  });

  useEffect(() => {
    if (isAddingSubtask) addInputRef.current?.focus();
  }, [isAddingSubtask]);

  function handleAddSubtask() {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    addSubtask.mutate({ id, data: { title, position: subtasks.length } });
  }

  const handleEditClick = () => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        categoryId: task.categoryId?.toString() || "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
        progress: task.progress ?? 0,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateTask.mutate({
      id,
      data: {
        title: editData.title as string,
        description: editData.description as string,
        priority: editData.priority as any,
        categoryId: editData.categoryId ? parseInt(editData.categoryId as string) : null,
        dueDate: (editData.dueDate as string) || null,
        progress: editData.progress as number,
      },
    });
  };

  const handleProgressChange = (progress: number) => {
    updateTask.mutate({ id, data: { progress } });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-32 bg-muted rounded" />
        <div className="h-48 bg-card border rounded-2xl" />
        <div className="h-48 bg-card border rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-lg font-semibold">Erro ao carregar a tarefa.</p>
        <p className="text-sm text-muted-foreground">O servidor pode estar indisponível. Tente novamente.</p>
        <Button variant="outline" onClick={() => setLocation("/tasks")}>
          Voltar para Lista
        </Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-lg font-semibold">Tarefa nao encontrada.</p>
        <Button variant="outline" onClick={() => setLocation("/tasks")}>
          Voltar para Lista
        </Button>
      </div>
    );
  }

  const progress = task.progress ?? 0;

  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0" onClick={() => setLocation("/tasks")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2 flex-wrap justify-end">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              Editar
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateTask.isPending}>
                Salvar
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir?")) deleteTask.mutate({ id });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border rounded-2xl p-5 md:p-8 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider border ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text} ${PRIORITY_COLORS[task.priority].border}`}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>
              <span
                className={`px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider ${STATUS_COLORS[task.status].bg} ${STATUS_COLORS[task.status].text}`}
              >
                {STATUS_LABELS[task.status]}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div>
                  <label className="font-bold text-sm mb-1 block">Titulo</label>
                  <Input
                    value={editData.title as string}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="text-lg font-bold h-12"
                  />
                </div>
                <div>
                  <label className="font-bold text-sm mb-1 block">Descricao</label>
                  <Textarea
                    value={editData.description as string}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="min-h-[140px]"
                  />
                </div>
                <ProgressSlider
                  value={editData.progress as number}
                  onChange={(v) => setEditData({ ...editData, progress: v })}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
                    {task.title}
                  </h1>
                  <div className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">
                    {task.description || "Nenhuma descricao fornecida."}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <ProgressBar value={progress} />
                </div>
              </div>
            )}
          </div>

          {/* Checklist card */}
          {!isEditing && (
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" /> Checklist
                  {subtasks.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {subtasks.filter((s) => s.done).length}/{subtasks.length}
                    </span>
                  )}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs gap-1"
                  onClick={() => setIsAddingSubtask((v) => !v)}
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </Button>
              </div>

              {subtasks.length > 0 && (
                <div className="mb-3">
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${subtasks.length > 0 ? Math.round((subtasks.filter((s) => s.done).length / subtasks.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleSubtask.mutate({
                          id,
                          subtaskId: s.id,
                          data: { done: !s.done },
                        })
                      }
                      className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {s.done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        s.done ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {s.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask.mutate({ id, subtaskId: s.id })}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {subtasks.length === 0 && !isAddingSubtask && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    Nenhum passo adicionado ainda.
                  </p>
                )}
              </div>

              {isAddingSubtask && (
                <div className="mt-2 flex gap-2">
                  <Input
                    ref={addInputRef}
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Descreva o passo..."
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                      if (e.key === "Escape") {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-3"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim() || addSubtask.isPending}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2"
                    onClick={() => {
                      setIsAddingSubtask(false);
                      setNewSubtaskTitle("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Quick progress update — only in view mode */}
          {!isEditing && (
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Atualizar Progresso Rapido
              </h3>
              <ProgressSlider value={progress} onChange={handleProgressChange} />
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Times card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-bold text-base border-b pb-2">Horarios</h3>
            <TimeField label="Hora de Inicio" icon={Play} value={task.startTime as string | null} />
            <TimeField label="Hora de Fim" icon={Flag} value={task.endTime as string | null} />
            {task.startTime && task.endTime && (
              <div>
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" /> Duracao
                </span>
                <span className="font-semibold text-sm">
                  {(() => {
                    const ms =
                      new Date(task.endTime as string).getTime() -
                      new Date(task.startTime as string).getTime();
                    const mins = Math.floor(ms / 60000);
                    const hours = Math.floor(mins / 60);
                    const remainingMins = mins % 60;
                    if (hours > 0) return `${hours}h ${remainingMins}min`;
                    return `${mins}min`;
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base border-b pb-2">Informacoes</h3>
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <label className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                    <Folder className="h-4 w-4" /> Categoria
                  </label>
                  <Select
                    value={editData.categoryId as string}
                    onValueChange={(v) => setEditData({ ...editData, categoryId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem categoria</SelectItem>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Vencimento
                  </label>
                  <Input
                    type="date"
                    value={editData.dueDate as string}
                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Folder className="w-4 h-4" /> Categoria
                  </span>
                  {task.categoryName ? (
                    <div className="flex items-center gap-2 font-medium">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.categoryColor || "#ccc" }}
                      />
                      {task.categoryName}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem categoria</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" /> Vencimento
                  </span>
                  <span className="font-medium">
                    {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4" /> Origem
                  </span>
                  <span className="font-medium capitalize">{task.sourceType || "manual"}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Clock4 className="w-4 h-4" /> Criada em
                  </span>
                  <span className="font-medium text-sm">
                    {format(new Date(task.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Status card */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-base border-b pb-2 mb-4">Alterar Status</h3>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  { value: "pending", label: "Pendente", icon: Circle, color: "bg-slate-700 text-white hover:bg-slate-800" },
                  { value: "in_progress", label: "Em Andamento", icon: Clock, color: "bg-blue-600 text-white hover:bg-blue-700" },
                  { value: "done", label: "Concluida", icon: CheckCircle2, color: "bg-green-600 text-white hover:bg-green-700" },
                  { value: "cancelled", label: "Cancelada", icon: XCircle, color: "bg-gray-600 text-white hover:bg-gray-700" },
                ] as const
              ).map(({ value, label, icon: Icon, color }) => (
                <Button
                  key={value}
                  variant={task.status === value ? "default" : "outline"}
                  className={`justify-start ${task.status === value ? color : ""}`}
                  onClick={() => updateStatus.mutate({ id, data: { status: value } })}
                  disabled={updateStatus.isPending}
                >
                  <Icon className="mr-2 h-4 w-4" /> {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
