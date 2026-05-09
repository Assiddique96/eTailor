import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const [customers, jobs, invoices] = await Promise.all([
      db.customer.findMany({
        where: {
          shopId: user.shopId,
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
      db.job.findMany({
        where: {
          shopId: user.shopId,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
      db.invoice.findMany({
        where: {
          shopId: user.shopId,
          invoiceNumber: { contains: q, mode: "insensitive" },
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      results: [
        ...customers.map((item) => ({ type: "customer", item })),
        ...jobs.map((item) => ({ type: "job", item })),
        ...invoices.map((item) => ({ type: "invoice", item })),
      ],
    });
  } catch {
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
