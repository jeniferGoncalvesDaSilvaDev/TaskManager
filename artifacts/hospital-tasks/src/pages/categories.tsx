import React, { useState } from "react";
import { useListCategories, getListCategoriesQueryKey, useCreateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", 
  "#14b8a6", "#06b6d4", "#0ea5e9", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", 
  "#a855f7", "#d946ef", "#d946ef", "#ec4899", "#f43f5e", "#f43f5e", "#64748b"
];

export default function Categories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[11]); // default blue

  const createCategory = useCreateCategory({
    mutation: {
      onSuccess: () => {
        setName("");
        toast({ title: "Categoria criada", description: "Nova tag disponível para uso." });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      }
    }
  });

  const deleteCategory = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Categoria excluída", description: "A categoria foi removida." });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCategory.mutate({ data: { name, color } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Categorias</h1>
        <p className="text-muted-foreground mt-1">Organize suas tarefas em setores específicos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5"/> Nova Categoria</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label className="mb-2 block font-semibold">Nome</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Financeiro" required />
              </div>
              
              <div>
                <Label className="mb-2 block font-semibold">Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={createCategory.isPending || !name.trim()}>
                {createCategory.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-card rounded-xl border" />)}
            </div>
          ) : categories?.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-dashed text-muted-foreground">
              <Tag className="mx-auto h-10 w-10 mb-3 opacity-50" />
              Nenhuma categoria criada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {categories?.map((cat) => (
                <div key={cat.id} className="bg-card border rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-bold text-lg">{cat.name}</span>
                    <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md font-medium">
                      {cat.taskCount} {cat.taskCount === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir "${cat.name}"?`)) {
                        deleteCategory.mutate({ id: cat.id });
                      }
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
      </div>
    </div>
  );
}
