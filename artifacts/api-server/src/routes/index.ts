import { Router, type IRouter } from "express";
import healthRouter from "./health";
import disputesRouter from "./disputes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(disputesRouter);

export default router;
