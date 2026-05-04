import { Router } from "express";
import type { Request, Response } from "express";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

const MAX_AMOUNT = 999_999.99;
const SERVICE_FEE_PERCENT = 3;
const SERVICE_FEE_FLAT_CENTS = 50;

router.post("/quotes/payment", async (req: Request, res: Response) => {
  const {
    customerName,
    customerEmail,
    jobDescription,
    amount,
    quoteId,
    contractorName,
    businessName,
  } = req.body;

  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    return res.status(400).json({ error: "customerName is required" });
  }
  if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
    return res.status(400).json({ error: "jobDescription is required" });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }
  if (amount > MAX_AMOUNT) {
    return res.status(400).json({ error: `amount must not exceed ${MAX_AMOUNT}` });
  }

  const amountCents = Math.round(amount * 100);
  const serviceFeeCents = Math.round(amountCents * (SERVICE_FEE_PERCENT / 100)) + SERVICE_FEE_FLAT_CENTS;
  const serviceFee = serviceFeeCents / 100;

  try {
    const stripe = await getUncachableStripeClient();

    const displayName = businessName || contractorName || "Quick Quote";
    const description = `${displayName} — ${jobDescription}`;

    const sessionParams: Record<string, any> = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Quote for ${customerName}`,
              description,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service Fee",
              description: `${SERVICE_FEE_PERCENT}% + $${(SERVICE_FEE_FLAT_CENTS / 100).toFixed(2)} processing fee`,
            },
            unit_amount: serviceFeeCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        quoteId: quoteId || "",
        customerName,
        jobDescription,
        serviceFee: serviceFee.toFixed(2),
      },
      success_url: `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}/api/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}/api/payment-cancelled`,
    };

    if (customerEmail && typeof customerEmail === "string" && customerEmail.includes("@")) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.json({
      success: true,
      sessionId: session.id,
      paymentUrl: session.url,
      serviceFee,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create checkout session");
    if (err?.type === "StripeInvalidRequestError") {
      return res.status(422).json({ error: "Invalid payment request" });
    }
    return res.status(500).json({ error: "Failed to create payment session" });
  }
});

router.get("/quotes/payment-status/:sessionId", async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return res.status(400).json({ error: "Invalid sessionId format" });
  }

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.json({
      sessionId: session.id,
      status: session.payment_status,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      customerEmail: session.customer_details?.email || null,
      paymentUrl: session.url,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to retrieve payment status");
    if (err?.type === "StripeInvalidRequestError") {
      return res.status(404).json({ error: "Payment session not found" });
    }
    return res.status(500).json({ error: "Failed to retrieve payment status" });
  }
});

export default router;
