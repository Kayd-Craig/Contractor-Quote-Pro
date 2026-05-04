import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";

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

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature' });
      return;
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        logger.error('Stripe webhook: req.body is not a Buffer');
        res.status(500).json({ error: 'Webhook processing error' });
        return;
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error({ err: error }, 'Webhook error');
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

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

app.get("/api/connect/return", (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Account Setup Complete</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #F7F6F4; color: #1A3A5C; }
        .card { text-align: center; background: white; padding: 48px 36px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
        .check { font-size: 64px; margin-bottom: 16px; color: #2E7D32; }
        h1 { font-size: 24px; margin: 0 0 8px; color: #2E7D32; }
        p { font-size: 16px; color: #555; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="check">&#10003;</div>
        <h1>Account Setup Complete!</h1>
        <p>Your Stripe account is connected. You can now receive payments through Quick Quote. Return to the app to continue.</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/api/connect/refresh", (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Session Expired</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #F7F6F4; color: #1A3A5C; }
        .card { text-align: center; background: white; padding: 48px 36px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 22px; margin: 0 0 8px; color: #1A3A5C; }
        p { font-size: 16px; color: #555; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">&#8634;</div>
        <h1>Session Expired</h1>
        <p>Your Stripe onboarding session has expired. Please return to the Quick Quote app and tap "Complete Account Setup" to continue where you left off.</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/api/payment-success", (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Successful</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #F7F6F4; color: #1A3A5C; }
        .card { text-align: center; background: white; padding: 48px 36px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
        .check { font-size: 64px; margin-bottom: 16px; color: #2E7D32; }
        h1 { font-size: 24px; margin: 0 0 8px; color: #2E7D32; }
        p { font-size: 16px; color: #555; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="check">&#10003;</div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your payment. Your contractor has been notified. You may close this page.</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/api/payment-cancelled", (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Cancelled</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #F7F6F4; color: #1A3A5C; }
        .card { text-align: center; background: white; padding: 48px 36px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
        .icon { font-size: 64px; margin-bottom: 16px; color: #C62828; }
        h1 { font-size: 24px; margin: 0 0 8px; }
        p { font-size: 16px; color: #555; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">&#10007;</div>
        <h1>Payment Cancelled</h1>
        <p>No charge was made. You can return to the payment link to try again, or contact your contractor.</p>
      </div>
    </body>
    </html>
  `);
});

app.use("/api", requireApiKey, router);

export default app;
