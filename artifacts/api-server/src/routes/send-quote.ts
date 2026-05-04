import { Router } from "express";
import type { Request, Response } from "express";
import { generateQuotePdf } from "./quote-pdf.js";

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
  taxRate?: number | null;
  taxAmount?: number | null;
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
      lines.push(`  ${item.description}`);
      lines.push(`  Qty: ${item.quantity} ${item.unit}`);
    }
    lines.push(`  Subtotal: ${formatCurrency(materialCharge)}`);
    lines.push("");
  }

  if (labor.length > 0) {
    lines.push("───────────────────────────────────");
    lines.push("LABOR");
    lines.push("───────────────────────────────────");
    for (const item of labor) {
      lines.push(`  ${item.description}`);
      lines.push(`  Qty: ${item.quantity} ${item.unit}`);
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
  if (body.taxAmount && body.taxAmount > 0) {
    const taxLabel = body.taxRate ? `Tax (${body.taxRate}%)` : "Tax";
    lines.push(`  ${taxLabel}:${" ".repeat(Math.max(1, 14 - taxLabel.length))}${formatCurrency(body.taxAmount)}`);
  }
  lines.push("  ─────────────────────────────────");
  lines.push(`  TOTAL:        ${formatCurrency(body.total)}`);
  lines.push("═══════════════════════════════════");
  lines.push("");
  lines.push("This quote is valid for 30 days.");
  lines.push("Thank you for your business!");

  return lines.join("\n");
}

router.post("/quotes/send", async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.customerName || !body.jobDescription || !body.contractorName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const quoteText = buildQuoteText(body);

  try {
    const pdfBuffer = await generateQuotePdf({
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      jobAddress: body.jobAddress,
      jobDescription: body.jobDescription,
      businessName: body.businessName,
      contractorName: body.contractorName,
      contractorPhone: body.contractorPhone,
      contractorEmail: body.contractorEmail,
      contractorLicense: body.contractorLicense,
      logoBase64: body.logoBase64 || null,
      lineItems: body.lineItems,
      materialSubtotal: body.materialSubtotal,
      laborSubtotal: body.laborSubtotal,
      markupAmount: body.markupAmount,
      discountAmount: body.discountAmount,
      discountType: body.discountType,
      taxRate: body.taxRate,
      taxAmount: body.taxAmount,
      total: body.total,
      quoteFont: body.quoteFont,
      quoteTemplate: body.quoteTemplate,
    });

    const pdfBase64 = pdfBuffer.toString("base64");

    return res.json({
      success: true,
      message: "Quote formatted successfully",
      quoteText,
      pdfBase64,
    });
  } catch (err) {
    req.log.error({ err }, "PDF generation failed");
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
