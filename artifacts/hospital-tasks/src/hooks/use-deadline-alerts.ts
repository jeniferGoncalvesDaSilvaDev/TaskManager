import { useMemo } from "react";
import { useListTasks } from "@workspace/api-client-react";

export function useDeadlineAlerts() {
  const { data: tasks } = useListTasks({});

  const alerts = useMemo(() => {
    if (!tasks) return { overdue: [], dueToday: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const active = tasks.filter(
      (t) => t.status !== "done" && t.status !== "cancelled" && t.dueDate
    );

    const overdue = active.filter((t) => {
      const d = new Date(t.dueDate!);
      d.setHours(0, 0, 0, 0);
      return d < today;
    });

    const dueToday = active.filter((t) => {
      const d = new Date(t.dueDate!);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    return { overdue, dueToday };
  }, [tasks]);

  return alerts;
}
