import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTask, useListCategories, TaskInputPriority, TaskInputStatus, TaskInputSourceType } from "@workspace/api-client-react";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/triage";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"] as const),
  status: z.enum(["pending", "in_progress", "done", "cancelled"] as const).optional(),
  categoryId: z.string().optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  sourceType: z.enum(["manual", "text", "pdf", "spreadsheet", "audio"] as const).optional(),
});

export default function TaskNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      sourceType: "manual",
    },
  });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Tarefa criada", description: "A nova tarefa foi adicionada à triagem." });
        setLocation(`/tasks/${data.id}`);
      },
      onError: () => {
        toast({ title: "Erro", description: "Ocorreu um erro ao criar a tarefa.", variant: "destructive" });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTask.mutate({
      data: {
        ...values,
        categoryId: values.categoryId ? parseInt(values.categoryId) : undefined,
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/tasks"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Nova Tarefa</h1>
          <p className="text-muted-foreground mt-1">Classifique a nova demanda para a triagem.</p>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold">O que precisa ser feito?</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da tarefa..." className="h-12 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-bold">Prioridade (Classificação de Triagem)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {(Object.keys(PRIORITY_LABELS) as TaskInputPriority[]).map((prio) => (
                        <FormItem key={prio} className="flex-1">
                          <FormControl>
                            <RadioGroupItem value={prio} className="sr-only" />
                          </FormControl>
                          <FormLabel 
                            className={`flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all ${
                              field.value === prio ? `border-current ring-2 ring-offset-2 ${PRIORITY_COLORS[prio].bg} ${PRIORITY_COLORS[prio].text} ring-${PRIORITY_COLORS[prio].text.split('-')[1]}-500` : ""
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full mb-2 ${PRIORITY_COLORS[prio].bg.split(' ')[0].replace('bg-', 'bg-')} shadow-sm`} />
                            <span className="font-bold uppercase tracking-wide text-sm">{PRIORITY_LABELS[prio]}</span>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Detalhes (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os detalhes importantes..." 
                      className="min-h-[120px] resize-y" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Data de Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" size="lg" className="w-full text-lg h-14 mt-8" disabled={createTask.isPending}>
              {createTask.isPending ? "Salvando..." : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Confirmar Nova Tarefa
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
