import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

// Helpers
const INDIGO  = rgb(0.31, 0.27, 0.90);
const DARK    = rgb(0.11, 0.10, 0.09);
const MUTED   = rgb(0.54, 0.51, 0.49);
const LIGHT   = rgb(0.91, 0.90, 0.89);
const SUCCESS = rgb(0.02, 0.58, 0.41);
const DANGER  = rgb(0.86, 0.15, 0.15);
const WHITE   = rgb(1, 1, 1);

function money(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusColor(status: string) {
  if (status === "PAID")    return SUCCESS;
  if (status === "UNPAID")  return DANGER;
  if (status === "PARTIAL") return rgb(0.85, 0.47, 0.04);
  return MUTED;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "invoices.read"))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { id } = await context.params;
    const invoice = await db.invoice.findFirst({
      where: { id, shopId: user.shopId },
      include: { customer: true, shop: true, payments: true, job: true },
    });
    if (!invoice)
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    // ── Page setup ──────────────────────────────────────
    const pdf  = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const mono = await pdf.embedFont(StandardFonts.Courier);

    const L = 50;   // left margin
    const R = width - 50; // right margin
    let y = height;

    // ── Header band ─────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: INDIGO });

    // Shop name
    page.drawText(invoice.shop.name, {
      x: L, y: height - 38, size: 22, font: bold, color: WHITE,
    });

    // Invoice label top-right
    page.drawText("INVOICE", {
      x: R - 70, y: height - 30, size: 14, font: bold, color: WHITE,
    });
    page.drawText(invoice.invoiceNumber, {
      x: R - font.widthOfTextAtSize(invoice.invoiceNumber, 11),
      y: height - 46, size: 11, font: mono, color: rgb(0.8, 0.8, 1),
    });

    // Shop contact row under name
    const shopMeta = [invoice.shop.email, invoice.shop.phone, invoice.shop.address]
      .filter(Boolean)
      .join("   ·   ");
    if (shopMeta) {
      page.drawText(shopMeta, {
        x: L, y: height - 56, size: 9, font, color: rgb(0.8, 0.8, 1),
      });
    }

    y = height - 110;

    // ── Status badge ─────────────────────────────────────
// ── Status badge ─────────────────────────────────────
const statusLabel = invoice.paymentStatus || "PENDING"; // Fallback
const sColor = statusColor(statusLabel);
const badgeW = 70; 
const badgeH = 20;
const radius = 4;

// Ensure these are absolute numbers
const bx = Number(R - badgeW);
const by = Number(y - 2);

// Create the path string on a single line or carefully joined 
// to prevent unexpected whitespace/undefined issues
const badgePath = `M ${bx + radius} ${by} L ${bx + badgeW - radius} ${by} Q ${bx + badgeW} ${by} ${bx + badgeW} ${by + radius} L ${bx + badgeW} ${by + badgeH - radius} Q ${bx + badgeW} ${by + badgeH} ${bx + badgeW - radius} ${by + badgeH} L ${bx + radius} ${by + badgeH} Q ${bx} ${by + badgeH} ${bx} ${by + badgeH - radius} L ${bx} ${by + radius} Q ${bx} ${by} ${bx + radius} ${by} Z`;

// Use the path
page.drawSvgPath(badgePath, { color: sColor });
    
    const sLabelW = bold.widthOfTextAtSize(statusLabel, 9);
    page.drawText(statusLabel, {
      x: R - badgeW / 2 - sLabelW / 2, 
      y: y + 5, 
      size: 9, 
      font: bold, 
      color: WHITE,
    });

    // ── Bill To / Invoice Details ────────────────────────
    // Left: Bill To
    page.drawText("BILL TO", { x: L, y, size: 8, font: bold, color: MUTED });
    y -= 14;
    page.drawText(`${invoice.customer.firstName} ${invoice.customer.lastName}`, {
      x: L, y, size: 12, font: bold, color: DARK,
    });
    y -= 14;
    if (invoice.customer.phone) {
      page.drawText(invoice.customer.phone, { x: L, y, size: 10, font, color: MUTED });
      y -= 12;
    }
    if (invoice.customer.email) {
      page.drawText(invoice.customer.email, { x: L, y, size: 10, font, color: MUTED });
      y -= 12;
    }

    // Right: Invoice meta
    const metaX = 370;
    let metaY = height - 110;
    const metaRows = [
      ["Invoice No.",  invoice.invoiceNumber],
      ["Issue Date",   invoice.issuedAt.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })],
      ["Due Date",     invoice.dueAt ? invoice.dueAt.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "On receipt"],
      ...(invoice.job ? [["Job Ref.", invoice.job.title]] : []),
    ];
    for (const [label, value] of metaRows) {
      page.drawText(label, { x: metaX, y: metaY, size: 9, font, color: MUTED });
      page.drawText(value, { x: metaX + 80, y: metaY, size: 9, font: bold, color: DARK });
      metaY -= 14;
    }

    // ── Divider ──────────────────────────────────────────
    y -= 20;
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: LIGHT });
    y -= 20;

    // ── Line items table ─────────────────────────────────
    const col1 = L;
    const col2 = 380;
    const col3 = 460;
    const col4 = R - 10;

    // Table header
    page.drawRectangle({ x: L - 5, y: y - 4, width: R - L + 10, height: 20, color: rgb(0.97, 0.96, 0.95) });
    page.drawText("Description",  { x: col1, y, size: 9, font: bold, color: MUTED });
    page.drawText("Type",         { x: col2, y, size: 9, font: bold, color: MUTED });
    page.drawText("Amount",       { x: col4 - bold.widthOfTextAtSize("Amount", 9), y, size: 9, font: bold, color: MUTED });
    y -= 22;

    // Subtotal row
    page.drawText("Services / Garment work", { x: col1, y, size: 10, font, color: DARK });
    page.drawText("Subtotal", { x: col2, y, size: 10, font, color: DARK });
    const subtotalStr = money(Number(invoice.subtotal));
    page.drawText(subtotalStr, { x: col4 - font.widthOfTextAtSize(subtotalStr, 10), y, size: 10, font, color: DARK });
    y -= 16;

    if (Number(invoice.discount) > 0) {
      page.drawText("Discount", { x: col1, y, size: 10, font, color: DARK });
      page.drawText("Deduction", { x: col2, y, size: 10, font, color: DARK });
      const discStr = `-${money(Number(invoice.discount))}`;
      page.drawText(discStr, { x: col4 - font.widthOfTextAtSize(discStr, 10), y, size: 10, font, color: SUCCESS });
      y -= 16;
    }

    if (Number(invoice.tax) > 0) {
      page.drawText("Tax", { x: col1, y, size: 10, font, color: DARK });
      page.drawText("VAT / Tax", { x: col2, y, size: 10, font, color: DARK });
      const taxStr = money(Number(invoice.tax));
      page.drawText(taxStr, { x: col4 - font.widthOfTextAtSize(taxStr, 10), y, size: 10, font, color: DARK });
      y -= 16;
    }

    // Total band
    y -= 6;
    page.drawRectangle({ x: L - 5, y: y - 8, width: R - L + 10, height: 28, color: INDIGO });
    page.drawText("TOTAL", { x: col1, y: y + 5, size: 11, font: bold, color: WHITE });
    const totalStr = money(Number(invoice.total));
    page.drawText(totalStr, { x: col4 - bold.widthOfTextAtSize(totalStr, 13), y: y + 4, size: 13, font: bold, color: WHITE });
    y -= 30;

    // ── Payment summary ──────────────────────────────────
    y -= 16;
    const paidTotal = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance   = Number(invoice.total) - paidTotal;

    page.drawText("PAYMENT SUMMARY", { x: L, y, size: 8, font: bold, color: MUTED });
    y -= 14;

    const summaryRows: [string, string, typeof DARK][] = [
      ["Total invoiced", money(Number(invoice.total)), DARK],
      ["Amount paid",    money(paidTotal),             SUCCESS],
      ["Balance due",    money(balance),               balance > 0 ? DANGER : SUCCESS],
    ];
    for (const [label, value, color] of summaryRows) {
      page.drawText(label, { x: L,              y, size: 10, font,  color: MUTED });
      page.drawText(value, { x: L + 120,        y, size: 10, font: bold, color });
      y -= 14;
    }

    // ── Payment receipts ─────────────────────────────────
    if (invoice.payments.length > 0) {
      y -= 16;
      page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: LIGHT });
      y -= 16;
      page.drawText("PAYMENT HISTORY", { x: L, y, size: 8, font: bold, color: MUTED });
      y -= 14;

      // Table header
      page.drawRectangle({ x: L - 5, y: y - 4, width: R - L + 10, height: 18, color: rgb(0.97, 0.96, 0.95) });
      page.drawText("Date",      { x: L,       y, size: 8, font: bold, color: MUTED });
      page.drawText("Method",    { x: L + 100, y, size: 8, font: bold, color: MUTED });
      page.drawText("Reference", { x: L + 200, y, size: 8, font: bold, color: MUTED });
      page.drawText("Amount",    { x: R - bold.widthOfTextAtSize("Amount", 8) - 5, y, size: 8, font: bold, color: MUTED });
      y -= 18;

      for (const payment of invoice.payments.slice(0, 15)) {
        const amtStr = money(Number(payment.amount));
        page.drawText(payment.paidAt.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }), { x: L,       y, size: 9, font, color: DARK });
        page.drawText(payment.method,                { x: L + 100, y, size: 9, font, color: DARK });
        page.drawText(payment.reference ?? "—",      { x: L + 200, y, size: 9, font, color: MUTED });
        page.drawText(amtStr, { x: R - font.widthOfTextAtSize(amtStr, 9) - 5, y, size: 9, font, color: SUCCESS });
        y -= 14;
        // Light row separator
        page.drawLine({ start: { x: L, y: y + 2 }, end: { x: R, y: y + 2 }, thickness: 0.3, color: LIGHT });
      }
    }

    // ── Footer ───────────────────────────────────────────
    const footerY = 36;
    page.drawLine({ start: { x: L, y: footerY + 18 }, end: { x: R, y: footerY + 18 }, thickness: 0.5, color: LIGHT });
    page.drawText(`Thank you for your business — ${invoice.shop.name}`, {
      x: L, y: footerY + 6, size: 9, font, color: MUTED,
    });
    page.drawText(`Generated by eTailor · ${new Date().toLocaleDateString()}`, {
      x: R - font.widthOfTextAtSize(`Generated by eTailor · ${new Date().toLocaleDateString()}`, 8),
      y: footerY + 6, size: 8, font, color: LIGHT,
    });

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 500 });
  }
}
