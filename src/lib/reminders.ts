import { db } from "@/lib/db";

export async function runReminderDispatch(shopId?: string) {
  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const dueJobs = await db.job.findMany({
    where: {
      ...(shopId ? { shopId } : {}),
      status: { in: ["PENDING", "IN_PROGRESS", "READY_FOR_FITTING"] },
      dueDate: { gte: now, lte: next48h },
      reminderSentAt: null,
    },
    include: { customer: true },
    take: 200,
  });

  let remindersSent = 0;
  for (const job of dueJobs) {
    await db.customerMessage.create({
      data: {
        shopId: job.shopId,
        customerId: job.customerId,
        channel: "APP",
        subject: "Job update reminder",
        message: `Your order "${job.title}" is due on ${job.dueDate.toDateString()}.`,
        sentBy: "system",
      },
    });
    await db.job.update({
      where: { id: job.id },
      data: { reminderSentAt: now },
    });
    remindersSent += 1;
  }

  return {
    checked: dueJobs.length,
    remindersSent,
  };
}
