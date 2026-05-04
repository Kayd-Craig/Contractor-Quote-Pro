import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

interface LineItem {
  id: string;
  type: "material" | "labor";
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  markupPercent: number;
  store?: string | null;
  sku?: string | null;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function buildQuoteText(body: {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  jobAddress?: string | null;
  jobDescription: string;
  contractorName: string;
  contractorPhone?: string | null;
  contractorEmail?: string | null;
  lineItems: LineItem[];
  materialSubtotal: number;
  laborSubtotal: number;
  markupAmount: number;
  total: number;
}): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [];
  lines.push("═══════════════════════════════════");
  lines.push("           QUICK QUOTE");
  lines.push("═══════════════════════════════════");
  lines.push(`Date: ${date}`);
  lines.push("");
  lines.push("FROM:");
  lines.push(`  ${body.contractorName}`);
  if (body.contractorPhone) lines.push(`  ${body.contractorPhone}`);
  if (body.contractorEmail) lines.push(`  ${body.contractorEmail}`);
  lines.push("");
  lines.push("TO:");
  lines.push(`  ${body.customerName}`);
  if (body.customerPhone) lines.push(`  ${body.customerPhone}`);
  if (body.customerEmail) lines.push(`  ${body.customerEmail}`);
  if (body.jobAddress) lines.push(`  ${body.jobAddress}`);
  lines.push("");
  lines.push("JOB DESCRIPTION:");
  lines.push(`  ${body.jobDescription}`);
  lines.push("");

  const materials = body.lineItems.filter((i) => i.type === "material");
  const labor = body.lineItems.filter((i) => i.type === "labor");

  if (materials.length > 0) {
    lines.push("───────────────────────────────────");
    lines.push("MATERIALS");
    lines.push("───────────────────────────────────");
    for (const item of materials) {
      const itemTotal =
        item.quantity * item.unitPrice * (1 + item.markupPercent / 100);
      const storeTag = item.store
        ? item.store === "homedepot"
          ? " [Home Depot]"
          : " [Lowe's]"
        : "";
      lines.push(`  ${item.description}${storeTag}`);
      lines.push(
        `  ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)} + ${item.markupPercent}% = ${formatCurrency(itemTotal)}`
      );
    }
    lines.push(`  Subtotal: ${formatCurrency(body.materialSubtotal)}`);
    lines.push("");
  }

  if (labor.length > 0) {
    lines.push("───────────────────────────────────");
    lines.push("LABOR");
    lines.push("───────────────────────────────────");
    for (const item of labor) {
      const itemTotal =
        item.quantity * item.unitPrice * (1 + item.markupPercent / 100);
      lines.push(`  ${item.description}`);
      lines.push(
        `  ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)}/hr + ${item.markupPercent}% = ${formatCurrency(itemTotal)}`
      );
    }
    lines.push(`  Subtotal: ${formatCurrency(body.laborSubtotal)}`);
    lines.push("");
  }

  lines.push("═══════════════════════════════════");
  lines.push("QUOTE SUMMARY");
  lines.push("═══════════════════════════════════");
  if (materials.length > 0) {
    lines.push(`  Materials:    ${formatCurrency(body.materialSubtotal)}`);
  }
  if (labor.length > 0) {
    lines.push(`  Labor:        ${formatCurrency(body.laborSubtotal)}`);
  }
  lines.push(`  Markup:       ${formatCurrency(body.markupAmount)}`);
  lines.push("  ─────────────────────────────────");
  lines.push(`  TOTAL:        ${formatCurrency(body.total)}`);
  lines.push("═══════════════════════════════════");
  lines.push("");
  lines.push("This quote is valid for 30 days.");
  lines.push("Thank you for your business!");

  return lines.join("\n");
}

router.post("/quotes/send", (req: Request, res: Response) => {
  const body = req.body;

  if (!body.customerName || !body.jobDescription || !body.contractorName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const quoteText = buildQuoteText(body);

  return res.json({
    success: true,
    message: "Quote formatted successfully",
    quoteText,
  });
});

export default router;
