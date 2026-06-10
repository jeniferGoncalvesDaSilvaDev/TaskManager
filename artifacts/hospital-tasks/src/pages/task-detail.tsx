import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetTask, getGetTaskQueryKey, useUpdateTask, useDeleteTask, useUpdateTaskStatus, TaskStatus, useListCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/triage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Calendar, Folder, User, FileText, CheckCircle2, Circle, Clock, XCircle, Clock4 } from "lucide-react";
import { format } from "date-fns";

export default function TaskDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);

  const { data: task, isLoading } = useGetTask(id, {
    query: { enabled: !!id, queryKey: getGetTaskQueryKey(id) }
  });

  const { data: categories } = useListCategories();

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        toast({ title: "Salvo", description: "Tarefa atualizada com sucesso." });
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(id) });
      }
    }
  });

  const updateStatus = useUpdateTaskStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(id) });
      }
    }
  });

  const deleteTask = useDeleteTask({
    mutation: {
      onSuccess: () => {
        toast({ title: "Excluída", description: "Tarefa removida da triagem." });
        setLocation("/tasks");
      }
    }
  });

  const [editData, setEditData] = useState<any>({});

  const handleEditClick = () => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        categoryId: task.categoryId?.toString() || "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateTask.mutate({
      id,
      data: {
        ...editData,
        categoryId: editData.categoryId ? parseInt(editData.categoryId) : null,
        dueDate: editData.dueDate || null,
      }
    });
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-6 max-w-4xl mx-auto"><div className="h-10 w-32 bg-muted rounded"></div><div className="h-64 bg-card border rounded-2xl"></div></div>;
  }

  if (!task) {
    return <div className="text-center py-20">Tarefa não encontrada.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/tasks"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={handleEditClick}>Editar Detalhes</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={updateTask.isPending}>Salvar</Button>
            </>
          )}
          <Button variant="destructive" size="icon" onClick={() => {
            if (confirm("Tem certeza que deseja excluir?")) deleteTask.mutate({ id });
          }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
               <span className={`px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider border ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text} ${PRIORITY_COLORS[task.priority].border}`}>
                  {PRIORITY_LABELS[task.priority]}
               </span>
               <span className={`px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider ${STATUS_COLORS[task.status].bg} ${STATUS_COLORS[task.status].text}`}>
                  {STATUS_LABELS[task.status]}
               </span>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-sm mb-1 block">Título</label>
                  <Input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="text-xl font-bold h-12" />
                </div>
                <div>
                  <label className="font-bold text-sm mb-1 block">Descrição</label>
                  <Textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="min-h-[200px]" />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-4">{task.title}</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                  {task.description || "Nenhuma descrição fornecida."}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-lg border-b pb-2">Informações</h3>
            
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <label className="font-medium text-sm flex items-center gap-2 text-muted-foreground"><Folder className="h-4 w-4"/> Categoria</label>
                    <Select value={editData.categoryId} onValueChange={v => setEditData({...editData, categoryId: v})}>
                      <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem categoria</SelectItem>
                        {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium text-sm flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4"/> Vencimento</label>
                    <Input type="date" value={editData.dueDate} onChange={e => setEditData({...editData, dueDate: e.target.value})} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Folder className="w-4 h-4" /> Categoria</span>
                    {task.categoryName ? (
                      <div className="flex items-center gap-2 font-medium">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.categoryColor || '#ccc' }} />
                        {task.categoryName}
                      </div>
                    ) : "-"}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Calendar className="w-4 h-4" /> Vencimento</span>
                    <span className="font-medium">{task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "-"}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><FileText className="w-4 h-4" /> Origem</span>
                    <span className="font-medium capitalize">{task.sourceType || "manual"}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Clock4 className="w-4 h-4" /> Criada em</span>
                    <span className="font-medium text-sm">{format(new Date(task.createdAt), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg border-b pb-2 mb-4">Ação Rápida: Status</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant={task.status === "pending" ? "default" : "outline"} 
                className={`justify-start ${task.status === "pending" ? "bg-slate-700 text-white hover:bg-slate-800" : ""}`}
                onClick={() => updateStatus.mutate({ id, data: { status: "pending" } })}
              >
                <Circle className="mr-2 h-4 w-4" /> Pendente
              </Button>
              <Button 
                variant={task.status === "in_progress" ? "default" : "outline"} 
                className={`justify-start ${task.status === "in_progress" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                onClick={() => updateStatus.mutate({ id, data: { status: "in_progress" } })}
              >
                <Clock className="mr-2 h-4 w-4" /> Em Andamento
              </Button>
              <Button 
                variant={task.status === "done" ? "default" : "outline"} 
                className={`justify-start ${task.status === "done" ? "bg-green-600 text-white hover:bg-green-700" : ""}`}
                onClick={() => updateStatus.mutate({ id, data: { status: "done" } })}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Concluída
              </Button>
              <Button 
                variant={task.status === "cancelled" ? "default" : "outline"} 
                className={`justify-start ${task.status === "cancelled" ? "bg-gray-600 text-white hover:bg-gray-700" : ""}`}
                onClick={() => updateStatus.mutate({ id, data: { status: "cancelled" } })}
              >
                <XCircle className="mr-2 h-4 w-4" /> Cancelada
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
