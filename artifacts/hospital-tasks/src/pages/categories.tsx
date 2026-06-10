import React, { useState } from "react";
import {
  useListCategories,
  getListCategoriesQueryKey,
  useCreateCategory,
  useDeleteCategory,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
];

export default function Categories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[11]);
  const [formOpen, setFormOpen] = useState(false);

  const createCategory = useCreateCategory({
    mutation: {
      onSuccess: () => {
        setName("");
        setFormOpen(false);
        toast({ title: "Categoria criada", description: "Nova tag disponivel para uso." });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      },
    },
  });

  const deleteCategory = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Categoria excluida", description: "A categoria foi removida." });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      },
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCategory.mutate({ data: { name, color } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize suas tarefas em setores especificos.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setFormOpen((v) => !v)}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Categoria
        </Button>
      </div>

      {formOpen && (
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Categoria
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="mb-2 block font-semibold">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Financeiro"
                required
                className="max-w-sm"
              />
            </div>

            <div>
              <Label className="mb-2 block font-semibold">Cor</Label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createCategory.isPending || !name.trim()}
                className="min-w-[120px]"
              >
                {createCategory.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card rounded-xl border" />
          ))}
        </div>
      ) : categories?.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-dashed text-muted-foreground space-y-2">
          <Tag className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="font-semibold">Nenhuma categoria criada ainda.</p>
          <p className="text-sm">Clique em "Nova Categoria" para comecar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories?.map((cat) => (
            <div
              key={cat.id}
              className="bg-card border rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <span className="font-bold text-base block truncate">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {cat.taskCount} {cat.taskCount === 1 ? "tarefa" : "tarefas"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => {
                  if (confirm(`Excluir "${cat.name}"?`)) deleteCategory.mutate({ id: cat.id });
                }}
                disabled={deleteCategory.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
