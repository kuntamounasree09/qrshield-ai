import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scansRouter from "./scans";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scansRouter);
router.use(settingsRouter);

export default router;
