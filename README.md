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

### 3D model review

`dragon-review.html` is a separate, unlinked model review page with side, front,
back, three-quarter, head, front-face and fin-detail views, drag rotation,
keyboard controls and zoom.
`dragon-model.js` builds the original volumetric V4 interpretation of the supplied
`drakon-swimmer.png` artwork. The unseen front and back are interpreted, and the
model is static and unrigged for likeness review before animation. It does not
replace the homepage's existing animation.

`drakon-model-v4.glb` is the current downloadable glTF 2.0 binary model;
V1–V3 downloads retain the earlier models. Rebuild the current version with
`node export-dragon.mjs` after editing the model source. V3 adds forward-canted
sculpted eye sockets, a broader forehead, muzzle, nostrils and orbital rims.
The fins use subdivided closed surfaces with curved camber and tapered edges;
the gold margins are vertex colours on the same surface, rather than stacked
extruded inlays. The dorsal mane has a rounded teardrop cross-section. Mirrored
parts have their triangle winding corrected when baking the exported model.
Its emerald, blue and warm gold materials retain the V2 palette and lighting.
V4 adds deterministic staggered reptile scales, pores and variation through
matching colour-detail, normal and roughness maps in `dragon-scales.js`.
Body UVs follow its length and circumference; the gold face uses finer relief,
the fins use softer relief, and eyes, horns and claw tips remain smooth. The
GLB embeds all three PNG texture maps, UVs and tangent frames, so the surface
detail is retained outside this viewer. No external texture service is used.
The model uses 12 material batches and 82,840 triangles. Three.js and its included license
are shared with the existing site.

`dragon-art.js` animates the supplied long dragon image (`drakon-swimmer.png`) along a flexible spine: the head steers as one rigid region, the body follows with a delay, and stronger S-shaped waves travel toward the tail, with gentle depth changes. The image is preserved as supplied; no substitute model is used. The original logo remains in the header. The animation starts automatically; tap/click the dragon or use Enter/Space to pause and resume. There is no separate visible control. Rendering stops offscreen and when the tab is hidden. The supplied image remains visible if WebGL is unavailable.

Three.js 0.187.0 is bundled locally. Its MIT license is included in `THREE-LICENSE.txt`.
