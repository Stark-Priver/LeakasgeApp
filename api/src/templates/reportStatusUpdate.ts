export const getReportStatusUpdateTemplate = (
  reporterName: string,
  reportId: string,
  newStatus: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report Status Updated</title>
    </head>
    <body>
      <h1>Report Status Updated</h1>
      <p>Hello ${reporterName},</p>
      <p>The status of your report with ID <strong>${reportId}</strong> has been updated to <strong>${newStatus}</strong>.</p>
      <p>Thank you for using the Leakage App.</p>
    </body>
    </html>
  `;
};
