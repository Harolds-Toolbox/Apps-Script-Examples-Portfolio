function notifyReviewers_(request) {
  const recipients = portalProperty_('REVIEWER_EMAILS');
  MailApp.sendEmail({
    to: recipients,
    subject: 'New request: ' + request.reference,
    body: [
      'A new request is ready for review.',
      '',
      'Reference: ' + request.reference,
      'Title: ' + request.title,
      'Amount: ' + request.amount.toFixed(2),
      '',
      'Open the request portal to review it.'
    ].join('\n')
  });
}

function notifyRequester_(request) {
  MailApp.sendEmail({
    to: request.requesterEmail,
    subject: 'Request updated: ' + request.reference,
    body: [
      'Your request has been updated.',
      '',
      'Reference: ' + request.reference,
      'Status: ' + request.status
    ].join('\n')
  });
}
