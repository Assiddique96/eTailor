/**
 * Generates a unique 6-character alphanumeric tracking code.
 * Uses uppercase letters and numbers, excluding ambiguous chars (0, O, I, 1).
 * Example: "X4K9TM"
 */
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTrackingCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export const STATUS_STEPS = [
  { status: "PENDING",           label: "Order Received",    desc: "Your order has been received and is being reviewed.", icon: "📋" },
  { status: "IN_PROGRESS",       label: "In Production",     desc: "Your garment is currently being worked on.",          icon: "🧵" },
  { status: "READY_FOR_FITTING", label: "Ready for Fitting", desc: "Your garment is ready. Please schedule a fitting.",   icon: "👔" },
  { status: "COMPLETED",         label: "Completed",         desc: "Your garment is complete and ready for pickup.",      icon: "✅" },
  { status: "DELIVERED",         label: "Delivered",         desc: "Your order has been delivered. Enjoy!",               icon: "🎉" },
];

export function getStepIndex(status: string): number {
  return STATUS_STEPS.findIndex((s) => s.status === status);
}
