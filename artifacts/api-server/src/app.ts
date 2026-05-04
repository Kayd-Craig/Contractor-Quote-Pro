import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const API_SECRET_KEY = process.env["API_SECRET_KEY"];

function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (!API_SECRET_KEY) {
    next();
    return;
  }
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", requireApiKey, router);

export default app;
