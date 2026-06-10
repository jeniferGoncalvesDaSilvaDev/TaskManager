import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetTask,
  getGetTaskQueryKey,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useListCategories,
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
} from "lucide-react";
import { format } from "date-fns";

export default function TaskDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);

  const { data: task, isLoading } = useGetTask(id, {
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
        toast({ title: "Excluída", description: "Tarefa removida da triagem." });
        setLocation("/tasks");
      },
    },
  });

  const [editData, setEditData] = useState<Record<string, string>>({});

  const handleEditClick = () => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        categoryId: task.categoryId?.toString() || "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateTask.mutate({
      id,
      data: {
        ...editData,
        priority: editData.priority as any,
        categoryId: editData.categoryId ? parseInt(editData.categoryId) : null,
        dueDate: editData.dueDate || null,
      },
    });
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

  if (!task) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-lg font-semibold">Tarefa não encontrada.</p>
        <Button asChild variant="outline">
          <Link href="/tasks">Voltar para Lista</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" asChild className="rounded-full flex-shrink-0">
          <Link href="/tasks">
            <ArrowLeft className="h-5 w-5" />
          </Link>
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
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-sm mb-1 block">Título</label>
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="text-lg font-bold h-12"
                  />
                </div>
                <div>
                  <label className="font-bold text-sm mb-1 block">Descrição</label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="min-h-[160px]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
                  {task.title}
                </h1>
                <div className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">
                  {task.description || "Nenhuma descrição fornecida."}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-bold text-base border-b pb-2">Informações</h3>

            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <label className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                      <Folder className="h-4 w-4" /> Categoria
                    </label>
                    <Select
                      value={editData.categoryId}
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
                      value={editData.dueDate}
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
          </div>

          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-base border-b pb-2 mb-4">Alterar Status</h3>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  { value: "pending", label: "Pendente", icon: Circle, color: "bg-slate-700 text-white hover:bg-slate-800" },
                  { value: "in_progress", label: "Em Andamento", icon: Clock, color: "bg-blue-600 text-white hover:bg-blue-700" },
                  { value: "done", label: "Concluída", icon: CheckCircle2, color: "bg-green-600 text-white hover:bg-green-700" },
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
