# Drakon Software & IT Solutions

Business website for Drakon Software & IT Solutions.

## Website files

- `index.html`: page content and enquiry form
- `styles.css`: responsive layout and branding
- `app.js`: navigation, direct email submission and WhatsApp enquiry preparation
- `drakon-primary.png` and `drakon-secondary.png`: supplied colour logos

This is a static website with no build step or dependencies. GitHub Pages can publish it from the `main` branch and the `/(root)` folder. The `.nojekyll` file keeps the files served directly.

Direct email integration is prepared for Formspree. Set the verified form endpoint in the quote form’s `data-email-endpoint` attribute in `index.html` to enable Email as the default option. Until an endpoint is configured, visitors use the working WhatsApp form or the direct email contact link. Form submissions include a honeypot, sending state, timeout/error handling and service-confirmed success. No email passwords or API secrets belong in the website.

## Making changes

Edit the page, styles or script and commit to `main`. GitHub Pages publishes the updated files automatically once hosting is enabled.

## Contact

- Phone / WhatsApp: +27 72 524 3008
- Email: drakonsoftwaresolutions@gmail.com

Logo and business branding belong to Drakon Software & IT Solutions.

## Dragon animation

`dragon3d.js` renders a custom 3D interpretation of the brand dragon: gold horns and armour, green-to-teal-to-blue scales, articulated serpentine body and claws. It starts automatically. Tap/click the dragon, or focus it and press Space/Enter, to pause or resume; there is no separate visible control. Rendering stops when offscreen or the page is hidden. WebGL failures preserve the original logo artwork as a fallback.

Three.js 0.187.0 is bundled locally. Its MIT license is included in `THREE-LICENSE.txt`.
