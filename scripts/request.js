await Backendless.Messaging.sendEmailFromTemplate(
  "WebsiteRequest", // your template name
  {
    name,
    email,
    category,
    template,
    details,
    followup_link
  },
  email
);
