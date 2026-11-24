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

`dragon-art.js` animates the supplied long dragon image (`drakon-swimmer.png`) with a tail-led swimming wave, a gentle glide and shallow turns. The image is preserved as supplied; no substitute model is used. The original logo remains in the header. The animation starts automatically; tap/click the dragon or use Enter/Space to pause and resume. There is no separate visible control. Rendering stops offscreen and when the tab is hidden. The supplied image remains visible if WebGL is unavailable.

Three.js 0.187.0 is bundled locally. Its MIT license is included in `THREE-LICENSE.txt`.
