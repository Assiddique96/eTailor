import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "invoices.read")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const invoice = await db.invoice.findFirst({
      where: { id, shopId: user.shopId },
      include: { customer: true, shop: true, payments: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    page.drawText(invoice.shop.name, { x: 50, y: 790, size: 20, font: bold });
    page.drawText(`Invoice ${invoice.invoiceNumber}`, { x: 50, y: 760, size: 14, font: bold });
    page.drawText(`Customer: ${invoice.customer.firstName} ${invoice.customer.lastName}`, { x: 50, y: 735, size: 12, font });
    page.drawText(`Issued: ${invoice.issuedAt.toDateString()}`, { x: 50, y: 715, size: 12, font });
    page.drawText(`Status: ${invoice.paymentStatus}`, { x: 50, y: 695, size: 12, font });

    page.drawLine({ start: { x: 50, y: 675 }, end: { x: 545, y: 675 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

    page.drawText(`Subtotal: $${Number(invoice.subtotal).toFixed(2)}`, { x: 50, y: 645, size: 12, font });
    page.drawText(`Discount: $${Number(invoice.discount).toFixed(2)}`, { x: 50, y: 625, size: 12, font });
    page.drawText(`Tax: $${Number(invoice.tax).toFixed(2)}`, { x: 50, y: 605, size: 12, font });
    page.drawText(`Total: $${Number(invoice.total).toFixed(2)}`, { x: 50, y: 575, size: 14, font: bold });

    const paidAmount = invoice.payments.reduce((acc, payment) => acc + Number(payment.amount), 0);
    page.drawText(`Paid: $${paidAmount.toFixed(2)}`, { x: 50, y: 550, size: 12, font });
    page.drawText(`Balance: $${(Number(invoice.total) - paidAmount).toFixed(2)}`, { x: 50, y: 530, size: 12, font });

    let y = 500;
    page.drawText("Payment Receipts", { x: 50, y, size: 13, font: bold });
    y -= 20;
    for (const payment of invoice.payments.slice(0, 12)) {
      page.drawText(
        `${payment.paidAt.toDateString()} - ${payment.method} - $${Number(payment.amount).toFixed(2)} ${payment.reference ?? ""}`,
        { x: 50, y, size: 10, font }
      );
      y -= 14;
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 500 });
  }
}
