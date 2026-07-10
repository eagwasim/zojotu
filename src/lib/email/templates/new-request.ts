export function newServiceRequestAdminEmail(customerName: string, customerEmail: string, watchBrand: string, watchModel: string, issueDescription: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">New Service Request</h2>
      <p style="color: #4a4a4a;">A new service request has been submitted and is awaiting your review.</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
        <p style="margin: 0 0 8px;"><strong>Watch:</strong> ${watchBrand} ${watchModel}</p>
        <p style="margin: 0;"><strong>Issue:</strong> ${issueDescription}</p>
      </div>
      <p style="color: #6a6a6a; font-size: 14px;">
        Log in to your admin panel to accept or refuse this request.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #9a9a9a; font-size: 12px;">Zojotu Watch Services</p>
    </div>
  `;
  const text = `New Service Request\n\nCustomer: ${customerName} (${customerEmail})\nWatch: ${watchBrand} ${watchModel}\nIssue: ${issueDescription}\n\nLog in to your admin panel to review.`;
  return { html, text };
}
