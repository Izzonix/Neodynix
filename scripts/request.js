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
await Backendless.Messaging.sendEmail(
  "New Website Request",
  `New request from ${name}\nEmail: ${email}\nCategory: ${category}\nTemplate: ${template}\nDetails: ${details}\nLink: ${followup}`,
  "isaacsemwogerere37@gmail.com"
);
