const base = (content: string, shopName: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e7e5e4;overflow:hidden;">
        <tr>
          <td style="padding:24px 32px;background:#4f46e5;">
            <span style="color:#fff;font-size:18px;font-weight:600;">eTailor</span>
            <span style="color:#a5b4fc;font-size:13px;margin-left:8px;">${shopName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f7f6f3;border-top:1px solid #e7e5e4;">
            <p style="margin:0;font-size:12px;color:#a8a29e;">
              This message was sent by ${shopName} via eTailor · Tailoring Management Platform
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export function reminderTemplate({
  customerName, jobTitle, dueDate, shopName,
}: { customerName: string; jobTitle: string; dueDate: string; shopName: string }) {
  return base(`
    <h2 style="margin:0 0 16px;color:#1c1917;font-size:20px;">Job Reminder</h2>
    <p style="color:#57534e;margin:0 0 12px;">Hi <strong>${customerName}</strong>,</p>
    <p style="color:#57534e;margin:0 0 20px;">
      This is a reminder that your order is coming up soon:
    </p>
    <div style="background:#eef2ff;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-weight:600;color:#1c1917;">${jobTitle}</p>
      <p style="margin:0;color:#4f46e5;font-size:14px;">Due: ${dueDate}</p>
    </div>
    <p style="color:#57534e;margin:0;">Please contact us if you have any questions or need to reschedule.</p>
  `, shopName);
}

export function messageTemplate({
  customerName, subject, body, shopName,
}: { customerName: string; subject: string; body: string; shopName: string }) {
  return base(`
    <h2 style="margin:0 0 16px;color:#1c1917;font-size:20px;">${subject}</h2>
    <p style="color:#57534e;margin:0 0 12px;">Hi <strong>${customerName}</strong>,</p>
    <p style="color:#57534e;margin:0 0 20px;line-height:1.6;">${body}</p>
    <p style="color:#a8a29e;font-size:13px;margin:0;">
      Feel free to reply to this email or contact us directly.
    </p>
  `, shopName);
}

export function invoiceTemplate({
  customerName, invoiceNumber, total, shopName,
}: { customerName: string; invoiceNumber: string; total: string; shopName: string }) {
  return base(`
    <h2 style="margin:0 0 16px;color:#1c1917;font-size:20px;">Invoice Ready</h2>
    <p style="color:#57534e;margin:0 0 12px;">Hi <strong>${customerName}</strong>,</p>
    <p style="color:#57534e;margin:0 0 20px;">Your invoice has been prepared:</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:0 0 20px;border:1px solid #bbf7d0;">
      <p style="margin:0 0 4px;font-weight:600;color:#1c1917;font-family:monospace;">${invoiceNumber}</p>
      <p style="margin:0;color:#059669;font-size:20px;font-weight:600;">$${total}</p>
    </div>
    <p style="color:#57534e;margin:0;">Please contact us to arrange payment at your earliest convenience.</p>
  `, shopName);
}

export function welcomeTemplate({
  fullName, shopName,
}: { fullName: string; shopName: string }) {
  return base(`
    <h2 style="margin:0 0 16px;color:#1c1917;font-size:20px;">Welcome to ${shopName}</h2>
    <p style="color:#57534e;margin:0 0 12px;">Hi <strong>${fullName}</strong>,</p>
    <p style="color:#57534e;margin:0 0 20px;line-height:1.6;">
      Your account has been created. You can now sign in to access your workspace.
    </p>
    <p style="color:#a8a29e;font-size:13px;margin:0;">
      If you did not expect this email, please contact your shop administrator.
    </p>
  `, shopName);
}
