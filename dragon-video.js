const video = document.querySelector('.dragon-video');
const control = document.querySelector('.dragon-video-control');
if (video && control) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = reducedMotion.matches;
  let inView = true;
  video.muted = true;
  function updateControl() {
    control.setAttribute('aria-label', video.paused ? 'Play dragon animation' : 'Pause dragon animation');
    control.setAttribute('aria-pressed', String(userPaused));
  }
  function sync() {
    if (userPaused || !inView || document.hidden) video.pause();
    else video.play().catch(updateControl);
    updateControl();
  }
  control.addEventListener('click', () => {
    userPaused = !video.paused;
    sync();
  });
  video.addEventListener('play', updateControl);
  video.addEventListener('pause', updateControl);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', event => { userPaused = event.matches; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, {threshold: .05}).observe(video);
  }
  sync();
}
