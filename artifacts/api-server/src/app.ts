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

const LEGAL_PAGE_CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #F7F6F4;
    color: #1A3A5C;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .header {
    background: #2E7D32;
    color: white;
    padding: 32px 20px;
    text-align: center;
  }
  .header h1 { margin: 0 0 6px; font-size: 28px; font-weight: 700; }
  .header p { margin: 0; opacity: 0.9; font-size: 14px; }
  .container {
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 24px 64px;
  }
  h2 {
    color: #2E7D32;
    margin-top: 32px;
    margin-bottom: 12px;
    font-size: 20px;
    border-bottom: 2px solid #E5E4E0;
    padding-bottom: 6px;
  }
  h3 { color: #1A3A5C; margin-top: 20px; margin-bottom: 8px; font-size: 16px; }
  p, li { font-size: 15px; }
  ul { padding-left: 22px; }
  li { margin-bottom: 6px; }
  a { color: #2E7D32; }
  .meta { color: #6B7280; font-size: 13px; margin-bottom: 20px; }
  .footer {
    text-align: center;
    color: #6B7280;
    font-size: 13px;
    padding: 24px;
    border-top: 1px solid #E5E4E0;
    margin-top: 40px;
  }
`;

app.get("/api/privacy", (_req: Request, res: Response) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacy Policy — QuickQuote Contractor</title>
  <style>${LEGAL_PAGE_CSS}</style>
</head>
<body>
  <div class="header">
    <h1>Privacy Policy</h1>
    <p>QuickQuote Contractor</p>
  </div>
  <div class="container">
    <p class="meta">Effective date: May 6, 2026</p>

    <p>This Privacy Policy explains how QuickQuote Contractor ("we", "us", "the app") handles information when you use the mobile app. We built QuickQuote to be a simple, on-device tool for contractors. We collect as little data as possible.</p>

    <h2>1. Information stored on your device</h2>
    <p>Almost everything you create in QuickQuote — quotes, customers, materials, photos, business profile, your logo, schedule and availability — is stored <strong>only on your device</strong> using your phone's local storage (AsyncStorage). We do not have a copy of this data on our servers.</p>

    <h3>What's stored locally</h3>
    <ul>
      <li>Your business profile (name, business name, phone, email, license number, ZIP, logo)</li>
      <li>Customer details you enter (name, address, phone, email)</li>
      <li>Quotes, line items, photos you attach to jobs, and quote PDFs you generate</li>
      <li>Your weekly availability and blocked dates</li>
      <li>App preferences (preferred store, default markup, contractor discount)</li>
    </ul>

    <h2>2. Information sent to our server</h2>
    <p>The app contacts our server only for these specific tasks:</p>
    <ul>
      <li><strong>Material catalog search</strong> — when you search for products, your search query is sent to our server to look up matching items. We do not store your queries.</li>
      <li><strong>Tax rate lookup</strong> — your job-site ZIP code is sent to look up the local sales tax rate. We do not store ZIP codes.</li>
      <li><strong>PDF generation</strong> — when you preview or send a quote PDF, the quote contents are sent to our server to render the PDF and immediately returned to your device. We do not store the PDF or quote contents.</li>
      <li><strong>Payments (Stripe)</strong> — when you request payment from a customer, the quote total, line items, and your customer's email are sent to Stripe to create a checkout link. See section 4.</li>
    </ul>

    <h2>3. Device permissions</h2>
    <p>QuickQuote requests these device permissions only when you take an action that requires them:</p>
    <ul>
      <li><strong>Camera</strong> — to take job-site photos that you attach to a quote.</li>
      <li><strong>Photo library</strong> — to pick existing photos to attach to a quote, or to pick a logo from your photos.</li>
    </ul>
    <p>Photos you take or pick are stored locally on your device, attached to the quote you chose. They are not uploaded to our servers and we never see them.</p>

    <h2>4. Payments via Stripe</h2>
    <p>When you use the "Request Payment" feature, QuickQuote uses <a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe</a> to create a payment link. Information shared with Stripe includes the quote total, line items, your business name, and the email address of the customer you are billing. When you sign up for Stripe Connect to receive payouts, Stripe handles your banking and identity verification directly — we never see or store your bank details. Stripe's handling of this data is governed by Stripe's own privacy policy.</p>

    <h2>5. What we do NOT do</h2>
    <ul>
      <li>We do not run analytics, tracking, or advertising SDKs.</li>
      <li>We do not sell or share your data with third parties (other than Stripe, only for the payments feature you initiate).</li>
      <li>We do not require an account or login.</li>
      <li>We do not track your location in the background.</li>
    </ul>

    <h2>6. Data retention and deletion</h2>
    <p>Because your data lives on your device, you control retention. Deleting the app removes all your stored quotes, customers, photos, and settings. You can also delete individual quotes from inside the app (long-press a quote in the list, or use the trash icon on a quote's detail page).</p>

    <h2>7. Children's privacy</h2>
    <p>QuickQuote is a business tool for contractors and is not directed to children under 13. We do not knowingly collect any information from children under 13.</p>

    <h2>8. Changes to this policy</h2>
    <p>If we change this policy, we will update the effective date above. Material changes will be highlighted in the app or on this page.</p>

    <h2>9. Contact</h2>
    <p>Questions about this policy or your data? Email <a href="mailto:josh4finley5@gmail.com">josh4finley5@gmail.com</a>.</p>

    <div class="footer">© 2026 QuickQuote Contractor</div>
  </div>
</body>
</html>`);
});

app.get("/api/support", (_req: Request, res: Response) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Support — QuickQuote Contractor</title>
  <style>${LEGAL_PAGE_CSS}</style>
</head>
<body>
  <div class="header">
    <h1>Support</h1>
    <p>QuickQuote Contractor</p>
  </div>
  <div class="container">
    <h2>Need help?</h2>
    <p>Email <a href="mailto:josh4finley5@gmail.com">josh4finley5@gmail.com</a> with a description of your issue and a screenshot if possible. We typically respond within 1–2 business days.</p>

    <h2>Common questions</h2>

    <h3>Where is my data stored?</h3>
    <p>All your quotes, customers, and settings live on your device. Deleting the app removes everything. See our <a href="/api/privacy">Privacy Policy</a> for details.</p>

    <h3>How do I get paid?</h3>
    <p>Open Settings → Payments &amp; Payouts and connect a Stripe account. After that, every accepted quote shows a "Request Payment" button — your customer pays online and the money lands in your bank account.</p>

    <h3>Why can't I add Home Depot or Lowe's items to my cart automatically?</h3>
    <p>Home Depot and Lowe's don't allow third-party apps to add items to their carts. QuickQuote opens each item on their site so you can add it yourself. Amazon items support automatic add-to-cart for the whole list.</p>

    <h3>How do I back up my quotes?</h3>
    <p>Generate and email yourself a PDF of any quote — it serves as a permanent record. We're working on cloud sync for a future update.</p>

    <div class="footer">© 2026 QuickQuote Contractor</div>
  </div>
</body>
</html>`);
});

app.use("/api", requireApiKey, router);

export default app;
