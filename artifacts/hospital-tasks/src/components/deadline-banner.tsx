import React, { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, Clock, X, ChevronRight } from "lucide-react";
import { useDeadlineAlerts } from "@/hooks/use-deadline-alerts";

export function DeadlineBanner() {
  const { overdue, dueToday } = useDeadlineAlerts();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (overdue.length === 0 && dueToday.length === 0) return null;

  const isOverdue = overdue.length > 0;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 text-sm font-medium border-b ${
        isOverdue
          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isOverdue ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isOverdue && (
          <span>
            <strong>{overdue.length}</strong>{" "}
            {overdue.length === 1 ? "tarefa atrasada" : "tarefas atrasadas"}
            {overdue.length <= 2 &&
              ": " + overdue.map((t) => t.title).join(", ")}
            .{" "}
          </span>
        )}
        {dueToday.length > 0 && (
          <span>
            <strong>{dueToday.length}</strong>{" "}
            {dueToday.length === 1 ? "tarefa vence hoje" : "tarefas vencem hoje"}
            {dueToday.length <= 2 &&
              ": " + dueToday.map((t) => t.title).join(", ")}
            .{" "}
          </span>
        )}
        <Link
          href="/tasks"
          className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:no-underline font-semibold"
        >
          Ver tarefas <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
        aria-label="Fechar alerta"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
