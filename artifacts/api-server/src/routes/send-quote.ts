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
  businessName?: string | null;
  contractorName: string;
  contractorPhone?: string | null;
  contractorEmail?: string | null;
  lineItems: LineItem[];
  materialSubtotal: number;
  laborSubtotal: number;
  markupAmount: number;
  discountAmount?: number | null;
  discountType?: "percent" | "flat" | null;
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
  if (body.businessName) lines.push(`  ${body.businessName}`);
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

  // Distribute markup proportionally into subtotals so the customer
  // never sees a raw markup line or percentage.
  const baseTotal = body.materialSubtotal + body.laborSubtotal;
  const materialFraction = baseTotal > 0 ? body.materialSubtotal / baseTotal : 0;
  const laborFraction = baseTotal > 0 ? body.laborSubtotal / baseTotal : 0;
  const materialCharge = body.materialSubtotal + body.markupAmount * materialFraction;
  const laborCharge = body.laborSubtotal + body.markupAmount * laborFraction;

  if (materials.length > 0) {
    lines.push("───────────────────────────────────");
    lines.push("MATERIALS");
    lines.push("───────────────────────────────────");
    for (const item of materials) {
      const itemBase = item.quantity * item.unitPrice;
      const storeTag = item.store
        ? item.store === "homedepot"
          ? " [Home Depot]"
          : " [Lowe's]"
        : "";
      lines.push(`  ${item.description}${storeTag}`);
      lines.push(`  ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(itemBase)}`);
    }
    lines.push(`  Subtotal: ${formatCurrency(materialCharge)}`);
    lines.push("");
  }

  if (labor.length > 0) {
    lines.push("───────────────────────────────────");
    lines.push("LABOR");
    lines.push("───────────────────────────────────");
    for (const item of labor) {
      const itemBase = item.quantity * item.unitPrice;
      lines.push(`  ${item.description}`);
      lines.push(`  ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(itemBase)}`);
    }
    lines.push(`  Subtotal: ${formatCurrency(laborCharge)}`);
    lines.push("");
  }

  lines.push("═══════════════════════════════════");
  lines.push("QUOTE SUMMARY");
  lines.push("═══════════════════════════════════");
  if (materials.length > 0) {
    lines.push(`  Materials:    ${formatCurrency(materialCharge)}`);
  }
  if (labor.length > 0) {
    lines.push(`  Labor:        ${formatCurrency(laborCharge)}`);
  }
  if (body.discountAmount && body.discountAmount > 0) {
    lines.push(`  Discount:     -${formatCurrency(body.discountAmount)}`);
  }
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
