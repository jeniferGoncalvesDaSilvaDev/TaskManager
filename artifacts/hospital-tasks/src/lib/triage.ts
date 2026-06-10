import { TaskPriority, TaskStatus } from "@workspace/api-client-react";

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
  high: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  medium: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  low: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
};

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" },
  in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  done: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  cancelled: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400" },
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa"
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  done: "Concluída",
  cancelled: "Cancelada"
};
