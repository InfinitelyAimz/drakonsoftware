# Drakon Software & IT Solutions

Business website for Drakon Software & IT Solutions.

## Website files

- `index.html`: page content and enquiry form
- `styles.css`: responsive layout and branding
- `app.js`: navigation, direct email submission and WhatsApp enquiry preparation
- `drakon-primary.png` and `drakon-secondary.png`: supplied colour logos

This is a static website with no build step or dependencies. GitHub Pages can publish it from the `main` branch and the `/(root)` folder. The `.nojekyll` file keeps the files served directly.

Email enquiries are submitted directly to FormSubmit and routed to drakonsoftwaresolutions@gmail.com. FormSubmit requires a one-time activation email before delivery starts. The form includes a honeypot, a sending state, timeout/error handling, and a success message only after the service accepts the request. WhatsApp remains available and prepares a message for the visitor to review and send. No email passwords or API secrets are stored in the website. The direct email link still opens the visitor’s email app.

## Making changes

Edit the page, styles or script and commit to `main`. GitHub Pages publishes the updated files automatically once hosting is enabled.

## Contact

- Phone / WhatsApp: +27 72 524 3008
- Email: drakonsoftwaresolutions@gmail.com

Logo and business branding belong to Drakon Software & IT Solutions.
