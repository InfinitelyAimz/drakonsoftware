(() => {
  const stage = document.querySelector('.dragon-stage');
  const canvas = stage?.querySelector('canvas');
  const button = stage?.querySelector('.motion-toggle');
  if (!canvas || !button) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const image = new Image();
  let paused = reducedMotion.matches;
  let visible = true;
  let ready = false;
  let frame = null;
  let elapsed = 0;
  let lastTime = null;
  let lastPaint = 0;
  let width = 500;
  let height = 500;

  function draw(seconds) {
    ctx.clearRect(0, 0, width, height);
    // Sample only the original dragon, above the wordmark. The PNG is unchanged.
    const crop = {x: image.width * .17, y: image.height * .15,
      width: image.width * .65, height: image.height * .59};
    const phase = seconds * Math.PI * 2 / 19;
    const dragonWidth = width * .64;
    const dragonHeight = dragonWidth * crop.height / crop.width;
    const x = width * (.5 + Math.sin(phase) * .105);
    const y = height * (.47 - Math.sin(phase * 2) * .09);
    const bank = Math.sin(phase + .4) * .16;
    const scale = 1 + Math.sin(phase - .5) * .035;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Small waves travel along the artwork to give the body a swimming rhythm.
    const strips = 100;
    for (let strip = 0; strip < strips; strip++) {
      const progress = strip / strips;
      const flex = Math.sin(seconds * 2.3 - progress * Math.PI * 2)
        * dragonHeight * .018 * (.2 + progress * .8);
      ctx.drawImage(image,
        crop.x + crop.width * progress, crop.y, crop.width / strips, crop.height,
        -dragonWidth / 2 + dragonWidth * progress,
        -dragonHeight / 2 + flex, dragonWidth / strips + .45, dragonHeight);
    }
    ctx.restore();
  }

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
  }

  function tick(time) {
    if (lastTime !== null) elapsed += Math.min(time - lastTime, 80) / 1000;
    lastTime = time;
    if (time - lastPaint >= 1000 / 30) {
      draw(elapsed);
      lastPaint = time;
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    stop();
    button.textContent = paused ? 'Play animation' : 'Pause animation';
    button.setAttribute('aria-pressed', String(paused));
    canvas.setAttribute('aria-label', paused
      ? 'Original gold, teal and blue Drakon dragon, animation paused'
      : 'Original gold, teal and blue Drakon dragon swimming in a gentle loop');
    if (ready) {
      draw(elapsed);
      if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (ready) draw(elapsed);
  }

  button.addEventListener('click', () => { paused = !paused; sync(); });
  reducedMotion.addEventListener('change', event => { paused = event.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, {threshold: .05}).observe(stage);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  image.addEventListener('load', () => {
    ready = true;
    resize();
    stage.classList.add('dragon-ready');
    button.hidden = false;
    sync();
  });
  // If canvas or image loading fails, the original artwork remains visible.
  image.src = 'drakon-primary.png';
})();
