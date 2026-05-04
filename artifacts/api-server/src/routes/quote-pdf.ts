import PDFDocument from "pdfkit";

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

interface TemplateColors {
  headerBg: string;
  headerText: string;
  headerSubText: string;
  bodyText: string;
  bodySubText: string;
  divider: string;
  accent: string;
  totalBg: string;
  footerText: string;
}

const TEMPLATES: Record<string, TemplateColors> = {
  typewriter: {
    headerBg: "",
    headerText: "#1a1a10",
    headerSubText: "#3a3a28",
    bodyText: "#1a1a10",
    bodySubText: "#4a4a38",
    divider: "#9a9874",
    accent: "#3a3a28",
    totalBg: "",
    footerText: "#6a6a50",
  },
  professional: {
    headerBg: "#1A3A5C",
    headerText: "#FFFFFF",
    headerSubText: "#C0D0E0",
    bodyText: "#1A1A2E",
    bodySubText: "#5A5A7A",
    divider: "#D0D5DD",
    accent: "#1A3A5C",
    totalBg: "#F2F4F7",
    footerText: "#667085",
  },
  bold: {
    headerBg: "#2E7D32",
    headerText: "#FFFFFF",
    headerSubText: "#C0E8C0",
    bodyText: "#111111",
    bodySubText: "#555555",
    divider: "#E0E0E0",
    accent: "#2E7D32",
    totalBg: "#F0FFF0",
    footerText: "#888888",
  },
  minimal: {
    headerBg: "",
    headerText: "#111111",
    headerSubText: "#777777",
    bodyText: "#222222",
    bodySubText: "#888888",
    divider: "#E8E8E8",
    accent: "#333333",
    totalBg: "",
    footerText: "#AAAAAA",
  },
};

const FONTS: Record<string, string> = {
  classic: "Courier",
  modern: "Helvetica",
  elegant: "Times-Roman",
  clean: "Helvetica",
};

const FONT_BOLD: Record<string, string> = {
  classic: "Courier-Bold",
  modern: "Helvetica-Bold",
  elegant: "Times-Bold",
  clean: "Helvetica-Bold",
};

function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export interface QuotePdfInput {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  jobAddress?: string | null;
  jobDescription: string;
  businessName?: string | null;
  contractorName: string;
  contractorPhone?: string | null;
  contractorEmail?: string | null;
  contractorLicense?: string | null;
  logoBase64?: string | null;
  lineItems: LineItem[];
  materialSubtotal: number;
  laborSubtotal: number;
  markupAmount: number;
  discountAmount?: number | null;
  discountType?: "percent" | "flat" | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  total: number;
  quoteFont?: string;
  quoteTemplate?: string;
}

export function generateQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const template = input.quoteTemplate || "professional";
    const fontKey = input.quoteFont || "modern";
    const t = TEMPLATES[template] || TEMPLATES.professional;
    const font = FONTS[fontKey] || "Helvetica";
    const fontBold = FONT_BOLD[fontKey] || "Helvetica-Bold";
    const isTypewriter = template === "typewriter";

    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 55, right: 55 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 110;
    const leftX = 55;
    let y = 50;

    const fmt = (n: number) => `$${n.toFixed(2)}`;
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const baseTotal = input.materialSubtotal + input.laborSubtotal;
    const materialFraction = baseTotal > 0 ? input.materialSubtotal / baseTotal : 0;
    const laborFraction = baseTotal > 0 ? input.laborSubtotal / baseTotal : 0;
    const materialCharge = input.materialSubtotal + input.markupAmount * materialFraction;
    const laborCharge = input.laborSubtotal + input.markupAmount * laborFraction;

    let logoBuffer: Buffer | null = null;
    if (input.logoBase64) {
      try {
        let raw = input.logoBase64;
        if (raw.startsWith("data:")) {
          raw = raw.split(",")[1] || "";
        }
        logoBuffer = Buffer.from(raw, "base64");
      } catch {
        logoBuffer = null;
      }
    }

    const logoHeight = 40;
    const extraHeaderSpace = logoBuffer ? logoHeight + 10 : 0;

    if (t.headerBg) {
      doc.rect(0, 0, doc.page.width, 130 + extraHeaderSpace).fill(t.headerBg);
      y = 35;

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, (doc.page.width - logoHeight) / 2, y, {
            width: logoHeight,
            height: logoHeight,
            fit: [logoHeight, logoHeight],
          });
          y += logoHeight + 8;
        } catch {
          // skip logo if it can't be rendered
        }
      }

      doc.font(fontBold).fontSize(18).fillColor(t.headerText);
      doc.text((input.businessName || "CONTRACTOR QUOTE").toUpperCase(), leftX, y, {
        width: pageWidth,
        align: "center",
      });
      y += 24;
      if (input.contractorName) {
        doc.font(font).fontSize(11).fillColor(t.headerSubText);
        doc.text(input.contractorName, leftX, y, { width: pageWidth, align: "center" });
        y += 15;
      }
      const contactParts = [input.contractorPhone, input.contractorEmail].filter(Boolean);
      if (contactParts.length > 0) {
        doc.font(font).fontSize(10).fillColor(t.headerSubText);
        doc.text(contactParts.join("  |  "), leftX, y, { width: pageWidth, align: "center" });
        y += 14;
      }
      if (input.contractorLicense) {
        doc.font(font).fontSize(10).fillColor(t.headerSubText);
        doc.text(`Lic# ${input.contractorLicense}`, leftX, y, { width: pageWidth, align: "center" });
        y += 14;
      }
      y = 145 + extraHeaderSpace;
    } else {
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, (doc.page.width - logoHeight) / 2, y, {
            width: logoHeight,
            height: logoHeight,
            fit: [logoHeight, logoHeight],
          });
          y += logoHeight + 8;
        } catch {
          // skip logo if it can't be rendered
        }
      }

      doc.font(fontBold).fontSize(16).fillColor(t.headerText);
      doc.text((input.businessName || "CONTRACTOR QUOTE").toUpperCase(), leftX, y, {
        width: pageWidth,
        align: "center",
      });
      y += 22;
      if (input.contractorName) {
        doc.font(font).fontSize(11).fillColor(t.headerSubText);
        doc.text(input.contractorName, leftX, y, { width: pageWidth, align: "center" });
        y += 15;
      }
      const contactParts = [input.contractorPhone, input.contractorEmail].filter(Boolean);
      if (contactParts.length > 0) {
        doc.font(font).fontSize(10).fillColor(t.headerSubText);
        doc.text(contactParts.join("  |  "), leftX, y, { width: pageWidth, align: "center" });
        y += 14;
      }
      if (input.contractorLicense) {
        doc.font(font).fontSize(10).fillColor(t.headerSubText);
        doc.text(`Lic# ${input.contractorLicense}`, leftX, y, { width: pageWidth, align: "center" });
        y += 14;
      }
      y += 8;
    }

    if (isTypewriter) {
      doc.font(font).fontSize(10).fillColor(t.divider);
      doc.text("= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =", leftX, y, {
        width: pageWidth,
        align: "center",
      });
      y += 18;
    } else {
      doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).lineWidth(1).strokeColor(t.divider).stroke();
      y += 14;
    }

    doc.font(fontBold).fontSize(isTypewriter ? 16 : 15).fillColor(template === "bold" ? t.accent : t.bodyText);
    doc.text(isTypewriter ? "E S T I M A T E" : "ESTIMATE", leftX, y, {
      width: pageWidth,
      align: "center",
      characterSpacing: isTypewriter ? 3 : 1,
    });
    y += 20;
    doc.font(font).fontSize(10).fillColor(t.bodySubText);
    doc.text(dateStr, leftX, y, { width: pageWidth, align: "center" });
    y += 20;

    if (isTypewriter) {
      doc.font(font).fontSize(10).fillColor(t.divider);
      doc.text("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", leftX, y, {
        width: pageWidth,
        align: "center",
      });
      y += 18;
    } else {
      doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).lineWidth(0.5).strokeColor(t.divider).stroke();
      y += 12;
    }

    doc.font(fontBold).fontSize(10).fillColor(t.bodySubText);
    doc.text("TO:", leftX, y);
    y += 14;
    doc.font(font).fontSize(11).fillColor(t.bodyText);
    doc.text(input.customerName, leftX + 20, y);
    y += 15;
    if (input.jobAddress) {
      doc.text(input.jobAddress, leftX + 20, y);
      y += 15;
    }
    if (input.customerPhone) {
      doc.text(input.customerPhone, leftX + 20, y);
      y += 15;
    }
    if (input.customerEmail) {
      doc.text(input.customerEmail, leftX + 20, y);
      y += 15;
    }

    if (input.jobDescription && input.jobDescription !== "Job quote") {
      y += 6;
      doc.font(fontBold).fontSize(10).fillColor(t.bodySubText);
      doc.text("JOB:", leftX, y);
      y += 14;
      doc.font(font).fontSize(11).fillColor(t.bodyText);
      doc.text(input.jobDescription, leftX + 20, y, { width: pageWidth - 20 });
      y += doc.heightOfString(input.jobDescription, { width: pageWidth - 20 }) + 4;
    }

    y += 8;
    if (isTypewriter) {
      doc.font(font).fontSize(10).fillColor(t.divider);
      doc.text("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", leftX, y, {
        width: pageWidth,
        align: "center",
      });
      y += 18;
    } else {
      doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).lineWidth(0.5).strokeColor(t.divider).stroke();
      y += 12;
    }

    const materials = input.lineItems.filter((i) => i.type === "material");
    const labor = input.lineItems.filter((i) => i.type === "labor");

    function drawLineItems(items: LineItem[], sectionTitle: string) {
      doc.font(fontBold).fontSize(10).fillColor(template === "bold" ? t.accent : t.bodySubText);
      doc.text(sectionTitle, leftX, y);
      y += 16;

      for (const item of items) {
        if (y > 680) {
          doc.addPage();
          y = 50;
        }
        const total = item.quantity * item.unitPrice;
        doc.font(font).fontSize(11).fillColor(t.bodyText);
        doc.text(item.description, leftX + 10, y);
        y += 14;
        doc.font(font).fontSize(9).fillColor(t.bodySubText);
        const detailLabel =
          item.unit === "flat"
            ? "flat rate"
            : `${item.quantity} ${item.unit} @ $${item.unitPrice.toFixed(2)}`;
        doc.text(detailLabel, leftX + 10, y);
        doc.text(fmt(total), leftX + pageWidth - 70, y - 14, {
          width: 70,
          align: "right",
        });
        y += 12;
      }
      y += 8;
    }

    if (materials.length > 0) {
      drawLineItems(materials, "MATERIALS");
    }
    if (labor.length > 0) {
      drawLineItems(labor, "LABOR");
    }

    if (isTypewriter) {
      doc.font(font).fontSize(10).fillColor(t.divider);
      doc.text("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", leftX, y, {
        width: pageWidth,
        align: "center",
      });
      y += 18;
    } else {
      doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).lineWidth(0.5).strokeColor(t.divider).stroke();
      y += 12;
    }

    const summaryX = leftX + pageWidth - 250;
    const summaryW = 250;

    if (t.totalBg) {
      doc.rect(summaryX - 10, y - 4, summaryW + 20, 
        (materials.length > 0 && labor.length > 0 ? 80 : 60) + 
        (input.discountAmount && input.discountAmount > 0 ? 18 : 0) + 
        (input.taxAmount && input.taxAmount > 0 ? 18 : 0)
      ).fill(t.totalBg);
    }

    function summaryRow(label: string, value: string, color?: string) {
      doc.font(font).fontSize(10).fillColor(t.bodySubText);
      doc.text(label, summaryX, y);
      doc.font(font).fontSize(10).fillColor(color || t.bodyText);
      doc.text(value, summaryX, y, { width: summaryW, align: "right" });
      y += 18;
    }

    if (materials.length > 0) {
      summaryRow("Materials", fmt(materialCharge));
    }
    if (labor.length > 0) {
      summaryRow("Labor", fmt(laborCharge));
    }
    if (input.discountAmount && input.discountAmount > 0) {
      summaryRow("Discount", `-${fmt(input.discountAmount)}`, "#3a7a3a");
    }
    if (input.taxAmount && input.taxAmount > 0) {
      const taxLabel = input.taxRate ? `Tax (${input.taxRate}%)` : "Tax";
      summaryRow(taxLabel, fmt(input.taxAmount));
    }

    y += 4;
    if (isTypewriter) {
      doc.font(font).fontSize(10).fillColor(t.divider);
      doc.text("- - - - - - - - - - - - - - -", summaryX, y, {
        width: summaryW,
        align: "center",
      });
      y += 14;
    } else {
      doc.moveTo(summaryX, y).lineTo(summaryX + summaryW, y).lineWidth(2).strokeColor(t.accent).stroke();
      y += 10;
    }

    doc.font(fontBold).fontSize(14).fillColor(template === "bold" ? t.accent : t.bodyText);
    doc.text("TOTAL DUE", summaryX, y);
    doc.text(fmt(input.total), summaryX, y, { width: summaryW, align: "right" });
    y += 30;

    if (isTypewriter) {
      doc.font(font).fontSize(10).fillColor(t.divider);
      doc.text("= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =", leftX, y, {
        width: pageWidth,
        align: "center",
      });
      y += 18;
    } else {
      doc.moveTo(leftX, y).lineTo(leftX + pageWidth, y).lineWidth(0.5).strokeColor(t.divider).stroke();
      y += 14;
    }

    doc.font(font).fontSize(10).fillColor(t.footerText);
    doc.text("This quote is valid for 30 days.", leftX, y, {
      width: pageWidth,
      align: "center",
    });
    y += 14;
    doc.text("Thank you for your business!", leftX, y, {
      width: pageWidth,
      align: "center",
    });

    doc.end();
  });
}
