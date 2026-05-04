import { Router } from "express";
import type { Request, Response } from "express";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

router.post("/connect/onboard", async (req: Request, res: Response) => {
  const { email, businessName, contractorName, existingAccountId } = req.body;

  try {
    const stripe = await getUncachableStripeClient();
    let accountId = existingAccountId;

    if (existingAccountId && typeof existingAccountId === "string" && existingAccountId.startsWith("acct_")) {
      const existing = await stripe.accounts.retrieve(existingAccountId);
      if (existing.metadata?.source !== "quick_quote") {
        return res.status(403).json({ error: "Account does not belong to this platform" });
      }
      accountId = existing.id;
    } else {
      const accountParams: Record<string, any> = {
        type: "express",
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          source: "quick_quote",
        },
      };

      if (email) accountParams.email = email;
      if (businessName) accountParams.business_profile = { name: businessName };

      const account = await stripe.accounts.create(accountParams);
      accountId = account.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/connect/refresh?account_id=${accountId}`,
      return_url: `${baseUrl}/api/connect/return?account_id=${accountId}`,
      type: "account_onboarding",
    });

    return res.json({
      accountId,
      onboardingUrl: accountLink.url,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create Connect account");
    if (err?.message?.includes("signed up for Connect")) {
      return res.status(400).json({
        error: "Stripe Connect is not enabled on this account. The platform admin needs to enable Connect at https://dashboard.stripe.com/connect first.",
        connectRequired: true,
      });
    }
    return res.status(500).json({ error: "Failed to create Stripe account" });
  }
});

async function validateAccountOwnership(stripe: any, accountId: string): Promise<boolean> {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account.metadata?.source === "quick_quote";
  } catch {
    return false;
  }
}

router.get("/connect/status", async (req: Request, res: Response) => {
  const accountId = req.query.account_id as string;

  if (!accountId || !accountId.startsWith("acct_")) {
    return res.status(400).json({ error: "Invalid or missing account_id" });
  }

  try {
    const stripe = await getUncachableStripeClient();

    if (!(await validateAccountOwnership(stripe, accountId))) {
      return res.status(403).json({ error: "Account not found or does not belong to this platform" });
    }

    const account = await stripe.accounts.retrieve(accountId);

    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;

    let status: string;
    if (chargesEnabled && payoutsEnabled) {
      status = "active";
    } else if (detailsSubmitted) {
      status = "pending";
    } else {
      status = "incomplete";
    }

    return res.json({
      accountId: account.id,
      status,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      email: account.email ?? null,
      businessName: account.business_profile?.name ?? null,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get Connect status");
    if (err?.type === "StripeInvalidRequestError") {
      return res.status(404).json({ error: "Account not found" });
    }
    return res.status(500).json({ error: "Failed to retrieve account status" });
  }
});

router.get("/connect/dashboard", async (req: Request, res: Response) => {
  const accountId = req.query.account_id as string;

  if (!accountId || !accountId.startsWith("acct_")) {
    return res.status(400).json({ error: "Invalid or missing account_id" });
  }

  try {
    const stripe = await getUncachableStripeClient();

    if (!(await validateAccountOwnership(stripe, accountId))) {
      return res.status(403).json({ error: "Account not found or does not belong to this platform" });
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return res.json({
      dashboardUrl: loginLink.url,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create dashboard link");
    if (err?.type === "StripeInvalidRequestError") {
      return res.status(400).json({ error: "Account must complete onboarding before accessing dashboard" });
    }
    return res.status(500).json({ error: "Failed to create dashboard link" });
  }
});

router.get("/connect/balance", async (req: Request, res: Response) => {
  const accountId = req.query.account_id as string;

  if (!accountId || !accountId.startsWith("acct_")) {
    return res.status(400).json({ error: "Invalid or missing account_id" });
  }

  try {
    const stripe = await getUncachableStripeClient();

    if (!(await validateAccountOwnership(stripe, accountId))) {
      return res.status(403).json({ error: "Account not found or does not belong to this platform" });
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    const available = balance.available
      .filter((b: any) => b.currency === "usd")
      .reduce((sum: number, b: any) => sum + b.amount, 0);
    const pending = balance.pending
      .filter((b: any) => b.currency === "usd")
      .reduce((sum: number, b: any) => sum + b.amount, 0);

    return res.json({
      availableBalance: available / 100,
      pendingBalance: pending / 100,
      currency: "usd",
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get balance");
    return res.status(500).json({ error: "Failed to retrieve balance" });
  }
});

export default router;
