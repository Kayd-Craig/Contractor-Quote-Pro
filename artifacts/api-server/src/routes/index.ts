import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import sendQuoteRouter from "./send-quote";
import taxRatesRouter from "./tax-rates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(sendQuoteRouter);
router.use(taxRatesRouter);

export default router;
