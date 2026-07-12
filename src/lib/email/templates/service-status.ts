export function serviceAcceptedEmail(customerName: string, watchBrand: string, watchModel: string, shippingAddress: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Service Request Accepted</h2>
      <p style="color: #4a4a4a;">Hi ${customerName},</p>
      <p style="color: #4a4a4a;">
        Your service request for your <strong>${watchBrand} ${watchModel}</strong> has been accepted.
      </p>
      <p style="color: #4a4a4a;">Please ship your watch to the following address:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <pre style="margin: 0; font-family: sans-serif; white-space: pre-wrap;">${shippingAddress || "Address will be provided separately."}</pre>
      </div>
      <p style="color: #6a6a6a; font-size: 14px;">
        Once shipped, you can track the progress in your portal.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #9a9a9a; font-size: 12px;">Zojotu Watch Services</p>
    </div>
  `;
  const text = `Hi ${customerName},\n\nYour service request for ${watchBrand} ${watchModel} has been accepted.\n\nPlease ship your watch to:\n${shippingAddress || "Address will be provided separately."}\n\nZojotu Watch Services`;
  return { html, text };
}

export function serviceRefusedEmail(customerName: string, watchBrand: string, watchModel: string, reason: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Service Request Declined</h2>
      <p style="color: #4a4a4a;">Hi ${customerName},</p>
      <p style="color: #4a4a4a;">
        Unfortunately, your service request for your <strong>${watchBrand} ${watchModel}</strong> has been declined.
      </p>
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p style="color: #6a6a6a; font-size: 14px;">
        If you have questions, please contact us.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #9a9a9a; font-size: 12px;">Zojotu Watch Services</p>
    </div>
  `;
  const text = `Hi ${customerName},\n\nYour service request for ${watchBrand} ${watchModel} has been declined.\n\nReason: ${reason}\n\nZojotu Watch Services`;
  return { html, text };
}

export function serviceStatusUpdateEmail(customerName: string, watchBrand: string, watchModel: string, status: string) {
  const statusMessages: Record<string, string> = {
    Shipped: "Your watch is now marked as shipped.",
    Received: "We have received your watch and it is now in our workshop.",
    Diagnosed: "Your watch has been diagnosed. Check your portal for details.",
    "In Progress": "Work has begun on your watch.",
    Completed: "Your watch service is complete! It is ready for collection or return shipping.",
    Collected: "Your watch has been collected/returned. Thank you for choosing Zojotu.",
  };

  const message = statusMessages[status] || `Your service status has been updated to: ${status}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Service Status Update</h2>
      <p style="color: #4a4a4a;">Hi ${customerName},</p>
      <p style="color: #4a4a4a;">
        Update on your <strong>${watchBrand} ${watchModel}</strong>:
      </p>
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #166534; font-weight: 600;">Status: ${status}</p>
        <p style="margin: 8px 0 0; color: #4a4a4a;">${message}</p>
      </div>
      <p style="color: #6a6a6a; font-size: 14px;">
        View full details in your <a href="#" style="color: #2563eb;">service portal</a>.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #9a9a9a; font-size: 12px;">Zojotu Watch Services</p>
    </div>
  `;
  const text = `Hi ${customerName},\n\nUpdate on your ${watchBrand} ${watchModel}:\n\nStatus: ${status}\n${message}\n\nZojotu Watch Services`;
  return { html, text };
}

export function servicePaymentEmail(
  customerName: string,
  watchBrand: string,
  watchModel: string,
  finalCost: number,
  paymentInformation: string
) {
  const isLink = paymentInformation.startsWith('http');
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Payment Details for Your Service</h2>
      <p style="color: #4a4a4a;">Hi ${customerName},</p>
      <p style="color: #4a4a4a;">
        The service for your <strong>${watchBrand} ${watchModel}</strong> is ready for payment.
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">Total Amount Due</p>
        <p style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 700;">€${finalCost.toFixed(2)}</p>
        
        ${isLink ? `
        <a href="${paymentInformation}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 20px;">
          Pay Now
        </a>
        ` : `
        <div style="margin-top: 10px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 5px; color: #64748b; font-size: 14px;">Payment Information (IBAN/Details)</p>
          <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 16px; font-weight: 600;">${paymentInformation}</p>
        </div>
        `}
      </div>
      <p style="color: #6a6a6a; font-size: 14px;">
        Once payment is confirmed, we will proceed with the next steps (collection or shipping).
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #9a9a9a; font-size: 12px;">Zojotu Watch Services</p>
    </div>
  `;
  const text = `Hi ${customerName},\n\nThe service for your ${watchBrand} ${watchModel} is ready for payment.\n\nTotal Amount Due: €${finalCost.toFixed(2)}\n\nPayment Information: ${paymentInformation}\n\nZojotu Watch Services`;
  return { html, text };
}
