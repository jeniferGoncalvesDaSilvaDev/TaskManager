import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  useImportTasks,
  useListCategories,
  ImportInputSourceType,
  ImportInputDefaultPriority,
  Task,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, FileAudio, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { PRIORITY_LABELS } from "@/lib/triage";

const SOURCE_TYPES: {
  value: ImportInputSourceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { value: "text", label: "Texto Livre / Ata", icon: FileText, hint: "Copie e cole texto de qualquer fonte" },
  { value: "audio", label: "Transcrição de Áudio", icon: FileAudio, hint: "Cole o texto transcrito de uma reunião ou áudio" },
  { value: "spreadsheet", label: "Tabela (CSV/Texto)", icon: FileSpreadsheet, hint: "Cole dados copiados de uma planilha" },
  { value: "pdf", label: "Extração de PDF", icon: FileText, hint: "Cole o texto extraído de um PDF" },
];

export default function ImportPage() {
  const [, navigate] = useLocation();
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
        toast({
          title: "Importacao concluida",
          description: `${data.imported} tarefas foram criadas com sucesso.`,
        });
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast({
          title: "Erro na importacao",
          description: "Ocorreu um erro ao processar o conteudo.",
          variant: "destructive",
        });
      },
    },
  });

  const handleImport = () => {
    if (!content.trim()) return;
    importTasks.mutate({
      data: {
        content,
        sourceType,
        defaultPriority: priority,
        defaultCategoryId: categoryId !== "all" ? parseInt(categoryId) : undefined,
      },
    });
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        <div className="bg-card border border-green-200 dark:border-green-900 rounded-2xl p-6 md:p-10 text-center space-y-5">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
              Importacao Concluida
            </h2>
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground">{result.imported}</strong> tarefas foram extraidas e criadas.
            </p>
          </div>

          <div className="text-left bg-secondary rounded-xl max-h-64 overflow-auto space-y-2 p-3">
            {result.tasks.map((t) => (
              <div key={t.id} className="bg-card p-3 rounded-lg border flex gap-3 items-center">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    t.priority === "critical"
                      ? "bg-red-500"
                      : t.priority === "high"
                      ? "bg-orange-500"
                      : t.priority === "medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                <span className="font-medium text-sm truncate">{t.title}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setResult(null);
                setContent("");
              }}
            >
              Importar Mais
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => navigate("/tasks")}>
              Ver Tarefas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Importacao em Lote</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Cole textos, transcricoes ou atas para criar tarefas automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-2xl p-5 shadow-sm h-full flex flex-col">
            <Label className="text-base font-bold block mb-3">Conteudo</Label>
            <Textarea
              placeholder="Cole o texto aqui. Cada linha sera interpretada como uma tarefa. Funciona com atas de reuniao, listas, transcricoes de audio, dados de planilha..."
              className="flex-1 min-h-[240px] md:min-h-[320px] text-base resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {content.split("\n").filter((l) => l.trim().length > 2).length} linhas validas detectadas
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
            <div>
              <Label className="font-bold block mb-3">Tipo de Fonte</Label>
              <RadioGroup
                value={sourceType}
                onValueChange={(v: any) => setSourceType(v)}
                className="space-y-2"
              >
                {SOURCE_TYPES.map(({ value, label, icon: Icon, hint }) => (
                  <div
                    key={value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      sourceType === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary"
                    }`}
                    onClick={() => setSourceType(value)}
                  >
                    <RadioGroupItem value={value} id={`r-${value}`} className="mt-0.5" />
                    <div className="min-w-0">
                      <Label
                        htmlFor={`r-${value}`}
                        className="flex items-center gap-1.5 cursor-pointer font-semibold text-sm"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="font-bold block mb-2">Prioridade Padrao</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Usada quando o texto nao indica urgencia.
              </p>
            </div>

            <div>
              <Label className="font-bold block mb-2">Categoria Padrao</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sem categoria</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full h-11 font-bold"
              onClick={handleImport}
              disabled={!content.trim() || importTasks.isPending}
            >
              {importTasks.isPending ? (
                "Processando..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Processar e Criar Tarefas
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
