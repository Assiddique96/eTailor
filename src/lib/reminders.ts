import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { reminderTemplate } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";

/**
 * Dispatches due-date reminders for jobs approaching within 48 hours.
 *
 * Idempotency strategy:
 * Each job is claimed atomically with a conditional update:
 *   UPDATE Job SET reminderSentAt = now WHERE id = ? AND reminderSentAt IS NULL
 *
 * Only the row that wins the update (updateCount === 1) proceeds to send.
 * This prevents duplicate sends even if the cron fires multiple times or
 * two concurrent invocations overlap.
 */
export async function runReminderDispatch(shopId?: string) {
  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Fetch candidates — reminderSentAt IS NULL is the eligibility gate
  const candidates = await db.job.findMany({
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

  for (const job of candidates) {
    // Atomic claim: only succeeds if reminderSentAt is STILL null.
    // This is the idempotency guard — a second concurrent invocation
    // will find updateCount === 0 and skip sending.
    const claimed = await db.job.updateMany({
      where: { id: job.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });

    if (claimed.count === 0) {
      // Another process already claimed this job — skip
      continue;
    }

    try {
      // Log in-app message
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
      }

      // Notify shop that a reminder was dispatched
      createNotification({
        shopId:     job.shopId,
        type:       "REMINDER_SENT",
        title:      "Reminder sent",
        body:       `Due-date reminder sent for "${job.title}" (due ${job.dueDate.toDateString()}).`,
        entityId:   job.id,
        entityType: "Job",
      }).catch(console.warn);

      remindersSent += 1;
    } catch (err) {
      // Sending failed — roll back the claim so this job retries next run
      console.error(`[Reminders] Failed for job ${job.id}, rolling back claim:`, err);
      await db.job.update({
        where: { id: job.id },
        data: { reminderSentAt: null },
      });
    }
  }

  return { checked: candidates.length, remindersSent };
}
