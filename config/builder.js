// Build a production-ready HTML email for "Real Accessories" order confirmations
// Usage: const htmlContent = buildOrderEmail({ user, order });
// Then pass htmlContent to your sendEmail(to, subject, htmlContent) function.

function buildOrderEmail({ user = {}, order = {} }) {
  const brandName = "Real Accessories";
  const logoUrl = "https://www.logoai.com/api/proxy?url=https:%2F%2Ftempfile.aiquickdraw.com%2Fs%2F6f99adf9130fd9222ec7fcfb3605d75c_0_1754416431_8402.png";

  const fmt = (dt) => {
    try {
      return new Date(dt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
    } catch (_) {
      return dt || "";
    }
  };

  const currency = (n) => {
    const num = Number(n || 0);
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
    } catch (_) {
      return `₹${num}`;
    }
  };

  const items = Array.isArray(order.products) ? order.products : [];

  const itemsRows = items
    .map((it, idx) => {
      const lineTotal = it.total_price ?? (Number(it.price || 0) * Number(it.quantity || 0));
      // You can swap product id with populated product name if available: it.product?.name
      const productLabel = it.product?.name || it.product?.title || it.product_name || it.product || `Item ${idx + 1}`;
      const variant = (it.variant && String(it.variant).trim()) ? ` (${it.variant})` : "";
      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #e6ecf0;word-break:break-word;">${productLabel}${variant}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e6ecf0;text-align:center;">${it.quantity || 1}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e6ecf0;text-align:right;">${currency(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  const address = order.address || {};
  const addressBlock = [address.name, address.phone, address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join("<br/>");

  const totalAmount = order.totalAmount ?? items.reduce((s, it) => s + Number(it.total_price || (it.price || 0) * (it.quantity || 0)), 0);

  const preheader = `Thanks for your purchase! Order ${order._id || ""} is ${order.orderStatus || order.paymentStatus || "processing"}.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brandName} — Order Confirmation</title>
  <style>
    /* Some clients support media queries; keep critical styles inline below too */
    @media only screen and (max-width:600px) { .container { width:100% !important; } .px { padding-left:16px !important; padding-right:16px !important; } .stack { display:block !important; width:100% !important; } }
    /* Dark mode friendly links */
    a { color:#0d6efd; text-decoration:none; }
  </style>
</head>
<body style="margin:0;background-color:#f5f8fa;font-family:Arial, Helvetica, sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f8fa;">
    <tr>
      <td align="center" style="padding:24px;">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td class="px" style="padding:24px 32px;">
              <table width="100%" role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:left;">
                    <img src="${logoUrl}" alt="${brandName}" width="150" style="display:block;"/>
                  </td>
                  <td style="text-align:right;vertical-align:middle;font-size:12px;color:#6b7c93;">
                    <div>Order placed</div>
                    <div style="font-weight:bold;color:#111827;">${fmt(order.createdAt)}</div>
                  </td>
                </tr>
              </table>

              <h1 style="margin:20px 0 8px;font-size:20px;color:#111827;">Thanks for your purchase!</h1>
              <p style="margin:0 0 16px;color:#4b5563;font-size:14px;">Hi${user.name ? ` ${user.name}` : ""}, we’re processing your order and will notify you when it ships.</p>

              ${order.otp || order.OTP ? `
              <div style="background:#f0f9ff;border:1px solid #bae6fd;color:#0c4a6e;padding:12px 16px;border-radius:6px;margin:12px 0;">
                <strong>OTP:</strong> <span style="font-family:monospace;">${order.otp || order.OTP}</span>
              </div>` : ""}

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;border:1px solid #e6ecf0;border-radius:6px;overflow:hidden;">
                <tr>
                  <td class="stack" style="padding:16px;border-bottom:1px solid #e6ecf0;vertical-align:top;width:60%;">
                    <div style="font-size:12px;color:#6b7280;">Order ID</div>
                    <div style="font-size:14px;color:#111827;font-weight:600;">${order._id || "—"}</div>
                  </td>
                  <td class="stack" style="padding:16px;border-bottom:1px solid #e6ecf0;vertical-align:top;width:40%;">
                    <div style="font-size:12px;color:#6b7280;">Payment</div>
                    <div style="font-size:14px;color:#111827;font-weight:600;">${order.paymentStatus || "—"}</div>
                    ${order.razorpay_payment_id ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;">ID: ${order.razorpay_payment_id}</div>` : ""}
                  </td>
                </tr>
                <tr>
                  <td class="stack" style="padding:16px;vertical-align:top;">
                    <div style="font-size:12px;color:#6b7280;">Order Status</div>
                    <div style="font-size:14px;color:#111827;font-weight:600;">${order.orderStatus || "—"}</div>
                  </td>
                  <td class="stack" style="padding:16px;vertical-align:top;">
                    <div style="font-size:12px;color:#6b7280;">Razorpay Order</div>
                    <div style="font-size:14px;color:#111827;font-weight:600;">${order.razorpay_order_id || "—"}</div>
                  </td>
                </tr>
              </table>

              <h2 style="margin:16px 0 8px;font-size:16px;color:#111827;">Items</h2>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <thead>
                  <tr>
                    <th align="left" style="padding:8px;border-bottom:2px solid #e6ecf0;font-size:12px;color:#6b7280;font-weight:600;">Product</th>
                    <th align="center" style="padding:8px;border-bottom:2px solid #e6ecf0;font-size:12px;color:#6b7280;font-weight:600;">Qty</th>
                    <th align="right" style="padding:8px;border-bottom:2px solid #e6ecf0;font-size:12px;color:#6b7280;font-weight:600;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows || `<tr><td colspan="3" style="padding:12px 8px;color:#6b7280;text-align:center;">No items</td></tr>`}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding:12px 8px;border-top:2px solid #e6ecf0;text-align:right;font-weight:700;color:#111827;">Total</td>
                    <td style="padding:12px 8px;border-top:2px solid #e6ecf0;text-align:right;font-weight:700;color:#111827;">${currency(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>

              ${addressBlock ? `
              <h2 style="margin:20px 0 8px;font-size:16px;color:#111827;">Shipping Address</h2>
              <div style="padding:12px 16px;border:1px solid #e6ecf0;border-radius:6px;color:#111827;line-height:1.5;">${addressBlock}</div>` : ""}

              <div style="margin:24px 0;">
                <a href="https://yourdomain.example/orders/${order._id || ''}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 18px;border-radius:6px;font-weight:600;">View Order</a>
                <span style="display:inline-block;width:8px;"></span>
                <a href="mailto:support@realaccessories.example" style="display:inline-block;padding:12px 18px;border:1px solid #e6ecf0;border-radius:6px;color:#111827;font-weight:600;">Contact Support</a>
              </div>

              <p style="margin:0;color:#6b7280;font-size:12px;">If you didn’t make this purchase, please contact support immediately.</p>

              <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e6ecf0;font-size:12px;color:#6b7280;">
                <div>${brandName}</div>
                <div>© ${new Date().getFullYear()} ${brandName}. All rights reserved.</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


module.exports = { buildOrderEmail };
