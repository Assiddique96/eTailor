import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { reminderTemplate } from "@/lib/email-templates";

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
    include: {
      customer: true,
      shop: { select: { name: true } },
    },
    take: 200,
  });

  let remindersSent = 0;

  for (const job of dueJobs) {
    // Always log an in-app message
    await db.customerMessage.create({
      data: {
        shopId: job.shopId,
        customerId: job.customerId,
        channel: "APP",
        subject: "Job reminder",
        message: `Your order "${job.title}" is due on ${job.dueDate.toDateString()}.`,
        sentBy: "system",
      },
    });

    // Send email if customer has one
    if (job.customer.email) {
      try {
        await sendEmail({
          to: job.customer.email,
          subject: `Reminder: "${job.title}" is due soon`,
          html: reminderTemplate({
            customerName: `${job.customer.firstName} ${job.customer.lastName}`,
            jobTitle: job.title,
            dueDate: job.dueDate.toDateString(),
            shopName: job.shop.name,
          }),
        });

        // Also log the email message
        await db.customerMessage.create({
          data: {
            shopId: job.shopId,
            customerId: job.customerId,
            channel: "EMAIL",
            subject: "Job reminder",
            message: `Email reminder sent for "${job.title}" due ${job.dueDate.toDateString()}.`,
            sentBy: "system",
          },
        });
      } catch (err) {
        console.error(`Failed to send reminder email for job ${job.id}:`, err);
      }
    }

    await db.job.update({
      where: { id: job.id },
      data: { reminderSentAt: now },
    });

    remindersSent += 1;
  }

  return { checked: dueJobs.length, remindersSent };
}
