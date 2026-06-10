import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tasksRouter from "./tasks";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tasksRouter);
router.use(categoriesRouter);

export default router;
