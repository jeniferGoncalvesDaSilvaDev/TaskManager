import { Router } from "express";
import { db, tasksTable, categoriesTable, insertTaskSchema } from "@workspace/db";
import { eq, desc, sql, and, ilike, type SQL } from "drizzle-orm";

const router = Router();

function taskWithCategory() {
  return db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      priority: tasksTable.priority,
      status: tasksTable.status,
      progress: tasksTable.progress,
      startTime: tasksTable.startTime,
      endTime: tasksTable.endTime,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      assignee: tasksTable.assignee,
      dueDate: tasksTable.dueDate,
      sourceType: tasksTable.sourceType,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id));
}

/**
 * Derive status, startTime and endTime from a progress value.
 * Returns only the fields that should change.
 */
function progressSideEffects(
  progress: number,
  current: { status: string; startTime: Date | null; endTime: Date | null }
) {
  const updates: Record<string, unknown> = {};
  const now = new Date();

  if (progress > 0 && !current.startTime) {
    updates.startTime = now;
  }
  if (progress === 100) {
    updates.status = "done";
    if (!current.endTime) updates.endTime = now;
  } else if (progress > 0 && current.status === "pending") {
    updates.status = "in_progress";
    if (!current.startTime) updates.startTime = now;
  } else if (progress === 0) {
    updates.status = "pending";
  }

  return updates;
}

/**
 * Derive progress, startTime and endTime from a status change.
 */
function statusSideEffects(
  status: string,
  current: { progress: number; startTime: Date | null; endTime: Date | null }
) {
  const updates: Record<string, unknown> = {};
  const now = new Date();

  if (status === "done") {
    updates.progress = 100;
    if (!current.endTime) updates.endTime = now;
    if (!current.startTime) updates.startTime = now;
  } else if (status === "in_progress") {
    if (current.progress === 0) updates.progress = 1;
    if (!current.startTime) updates.startTime = now;
    updates.endTime = null;
  } else if (status === "pending") {
    updates.progress = 0;
    updates.startTime = null;
    updates.endTime = null;
  } else if (status === "cancelled") {
    if (!current.endTime && current.startTime) updates.endTime = now;
  }

  return updates;
}

router.get("/tasks/stats", async (req, res) => {
  try {
    const rows = await db
      .select({
        status: tasksTable.status,
        priority: tasksTable.priority,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(tasksTable)
      .groupBy(tasksTable.status, tasksTable.priority);

    const stats = {
      total: 0,
      byStatus: { pending: 0, in_progress: 0, done: 0, cancelled: 0 } as Record<string, number>,
      byPriority: { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>,
      completionRate: 0,
    };

    for (const row of rows) {
      stats.total += row.count;
      if (row.status in stats.byStatus) stats.byStatus[row.status] += row.count;
      if (row.priority in stats.byPriority) stats.byPriority[row.priority] += row.count;
    }

    stats.completionRate =
      stats.total > 0 ? Math.round((stats.byStatus.done / stats.total) * 100) : 0;

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/recent", async (req, res) => {
  try {
    const tasks = await taskWithCategory().orderBy(desc(tasksTable.updatedAt)).limit(10);
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tasks/import", async (req, res) => {
  const { content, sourceType, defaultPriority = "medium", defaultCategoryId } = req.body;

  if (!content || !sourceType) {
    res.status(400).json({ error: "content and sourceType are required" });
    return;
  }

  try {
    const lines = content
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 2);

    const toInsert = lines.map((line: string) => ({
      title: line.slice(0, 200),
      priority: defaultPriority,
      status: "pending" as const,
      progress: 0,
      sourceType,
      categoryId: defaultCategoryId ?? null,
    }));

    if (toInsert.length === 0) {
      res.status(400).json({ error: "No tasks found in content" });
      return;
    }

    const inserted = await db.insert(tasksTable).values(toInsert).returning();
    const tasks = await taskWithCategory().where(
      sql`${tasksTable.id} = ANY(ARRAY[${sql.join(
        inserted.map((t) => sql`${t.id}`),
        sql`, `
      )}]::int[])`
    );

    res.status(201).json({ imported: tasks.length, tasks });
  } catch (err) {
    req.log.error({ err }, "Failed to import tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const { status, priority, categoryId, search } = req.query as Record<string, string>;
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(tasksTable.status, status));
    if (priority) conditions.push(eq(tasksTable.priority, priority));
    if (categoryId) conditions.push(eq(tasksTable.categoryId, Number(categoryId)));
    if (search) conditions.push(ilike(tasksTable.title, `%${search}%`));

    const orderExpr = sql`CASE ${tasksTable.priority}
      WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`;

    const query = taskWithCategory();
    const tasks =
      conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(orderExpr, desc(tasksTable.createdAt))
        : await query.orderBy(orderExpr, desc(tasksTable.createdAt));

    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tasks", async (req, res) => {
  const parsed = insertTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const data = parsed.data;
    // Apply side effects for initial progress/status
    const progressVal = typeof data.progress === "number" ? data.progress : 0;
    const fx = progressSideEffects(progressVal, {
      status: data.status || "pending",
      startTime: null,
      endTime: null,
    });
    const [task] = await db
      .insert(tasksTable)
      .values({ ...data, ...fx })
      .returning();
    const [full] = await taskWithCategory().where(eq(tasksTable.id, task.id));
    res.status(201).json(full);
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [task] = await taskWithCategory().where(eq(tasksTable.id, id));
    if (!task) { res.status(404).end(); return; }
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to get task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [current] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!current) { res.status(404).end(); return; }

    const { title, description, priority, status, categoryId, assignee, dueDate, progress } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (assignee !== undefined) updates.assignee = assignee;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    // Handle progress change with side effects
    if (progress !== undefined) {
      const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
      updates.progress = clampedProgress;
      const fx = progressSideEffects(clampedProgress, {
        status: current.status,
        startTime: current.startTime,
        endTime: current.endTime,
      });
      Object.assign(updates, fx);
    }

    // Handle explicit status change (only if progress isn't also changing)
    if (status !== undefined && progress === undefined) {
      updates.status = status;
      const fx = statusSideEffects(status, {
        progress: current.progress,
        startTime: current.startTime,
        endTime: current.endTime,
      });
      Object.assign(updates, fx);
    }

    await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id));
    const [full] = await taskWithCategory().where(eq(tasksTable.id, id));
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/tasks/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status is required" }); return; }

  try {
    const [current] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!current) { res.status(404).end(); return; }

    const fx = statusSideEffects(status, {
      progress: current.progress,
      startTime: current.startTime,
      endTime: current.endTime,
    });

    await db
      .update(tasksTable)
      .set({ status, updatedAt: new Date(), ...fx })
      .where(eq(tasksTable.id, id));

    const [full] = await taskWithCategory().where(eq(tasksTable.id, id));
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Failed to update task status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
