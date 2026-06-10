import React, { useState } from "react";
import { useImportTasks, useListCategories, ImportInputSourceType, ImportInputDefaultPriority, Task } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, FileAudio, FileSpreadsheet, AlertCircle } from "lucide-react";
import { PRIORITY_LABELS } from "@/lib/triage";
import { Link } from "wouter";

export default function ImportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useListCategories();

  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState<ImportInputSourceType>("text");
  const [priority, setPriority] = useState<ImportInputDefaultPriority>("medium");
  const [categoryId, setCategoryId] = useState<string>("all");

  const [result, setResult] = useState<{ imported: number; tasks: Task[] } | null>(null);

  const importTasks = useImportTasks({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        toast({ title: "Importação concluída", description: `${data.imported} tarefas foram criadas com sucesso.` });
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast({ title: "Erro na importação", description: "Ocorreu um erro ao processar o conteúdo.", variant: "destructive" });
      }
    }
  });

  const handleImport = () => {
    if (!content.trim()) return;
    
    importTasks.mutate({
      data: {
        content,
        sourceType,
        defaultPriority: priority,
        defaultCategoryId: categoryId !== "all" ? parseInt(categoryId) : undefined
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Importação em Lote</h1>
        <p className="text-muted-foreground mt-1">Cole textos, transcrições ou atas para que a IA crie as tarefas automaticamente.</p>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <Label className="text-lg font-bold block mb-4">Conteúdo Bruto</Label>
              <Textarea 
                placeholder="Cole o texto aqui. A inteligência do sistema identificará as tarefas, descrições e prioridades se não estiverem definidas..."
                className="min-h-[300px] text-base resize-y"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <Label className="font-bold block mb-3">Tipo de Fonte</Label>
                <RadioGroup value={sourceType} onValueChange={(v: any) => setSourceType(v)} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="r1" />
                    <Label htmlFor="r1" className="flex items-center gap-2 cursor-pointer"><FileText className="w-4 h-4"/> Texto Livre / Ata</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="audio" id="r2" />
                    <Label htmlFor="r2" className="flex items-center gap-2 cursor-pointer"><FileAudio className="w-4 h-4"/> Transcrição de Áudio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="spreadsheet" id="r3" />
                    <Label htmlFor="r3" className="flex items-center gap-2 cursor-pointer"><FileSpreadsheet className="w-4 h-4"/> Tabela (CSV/Texto)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="r4" />
                    <Label htmlFor="r4" className="flex items-center gap-2 cursor-pointer"><FileText className="w-4 h-4"/> Extração de PDF</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="font-bold block mb-2">Prioridade Padrão</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Usada se o texto não sugerir urgência.</p>
              </div>

              <div>
                <Label className="font-bold block mb-2">Categoria Padrão</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Sem Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sem categoria</SelectItem>
                    {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full h-12 text-lg font-bold" 
                size="lg"
                onClick={handleImport}
                disabled={!content.trim() || importTasks.isPending}
              >
                {importTasks.isPending ? "Processando..." : <><Upload className="mr-2 h-5 w-5" /> Processar Texto</>}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-green-200 dark:border-green-900 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Importação Concluída!</h2>
          <p className="text-lg"><strong>{result.imported}</strong> tarefas foram extraídas e criadas.</p>
          
          <div className="text-left bg-secondary p-4 rounded-xl max-h-[300px] overflow-auto space-y-3">
            {result.tasks.map(t => (
              <div key={t.id} className="bg-card p-3 rounded-lg border flex gap-3 items-center">
                 <div className={`w-3 h-3 rounded-full flex-shrink-0 bg-${t.priority === 'critical' ? 'red' : t.priority === 'high' ? 'orange' : t.priority === 'medium' ? 'amber' : 'emerald'}-500`} />
                 <span className="font-medium truncate">{t.title}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={() => { setResult(null); setContent(""); }}>Importar Mais</Button>
            <Button asChild><Link href="/tasks">Ver Tarefas</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
