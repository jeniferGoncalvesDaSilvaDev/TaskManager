import { Router } from "express";
import { db, categoriesTable, insertCategorySchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { tasksTable } from "@workspace/db";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        color: categoriesTable.color,
        taskCount: sql<number>`cast(count(${tasksTable.id}) as int)`,
      })
      .from(categoriesTable)
      .leftJoin(tasksTable, eq(tasksTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", async (req, res) => {
  const parsed = insertCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
    res.status(201).json({ ...cat, taskCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create category");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete category");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
