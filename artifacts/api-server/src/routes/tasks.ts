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
      sourceType,
      categoryId: defaultCategoryId ?? null,
    }));

    if (toInsert.length === 0) {
      res.status(400).json({ error: "No tasks found in content" });
      return;
    }

    const inserted = await db.insert(tasksTable).values(toInsert).returning();

    const tasks = await taskWithCategory()
      .where(
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

    const query = taskWithCategory();
    const tasks =
      conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(
            sql`CASE ${tasksTable.priority}
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
              ELSE 5 END`,
            desc(tasksTable.createdAt)
          )
        : await query.orderBy(
            sql`CASE ${tasksTable.priority}
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
              ELSE 5 END`,
            desc(tasksTable.createdAt)
          );

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
    const [task] = await db.insert(tasksTable).values(parsed.data).returning();
    const [full] = await taskWithCategory().where(eq(tasksTable.id, task.id));
    res.status(201).json(full);
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [task] = await taskWithCategory().where(eq(tasksTable.id, id));
    if (!task) {
      res.status(404).end();
      return;
    }
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to get task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { title, description, priority, status, categoryId, assignee, dueDate } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (priority !== undefined) updates.priority = priority;
  if (status !== undefined) updates.status = status;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (assignee !== undefined) updates.assignee = assignee;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  try {
    await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id));
    const [full] = await taskWithCategory().where(eq(tasksTable.id, id));
    if (!full) {
      res.status(404).end();
      return;
    }
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
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
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }
  try {
    await db.update(tasksTable).set({ status, updatedAt: new Date() }).where(eq(tasksTable.id, id));
    const [full] = await taskWithCategory().where(eq(tasksTable.id, id));
    if (!full) {
      res.status(404).end();
      return;
    }
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Failed to update task status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
