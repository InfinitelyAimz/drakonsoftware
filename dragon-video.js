const video = document.querySelector('.dragon-video');
const control = document.querySelector('.dragon-video-control');
if (video && control) {
  let userPaused = false;
  let inView = true;
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
  // Limit casual media shortcuts only on the dragon, not the rest of the page.
  const stage = video.closest('.dragon-video-stage');
  stage.addEventListener('contextmenu', event => event.preventDefault());
  stage.addEventListener('dragstart', event => event.preventDefault());
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
  video.addEventListener('loadeddata', sync);
  video.addEventListener('canplay', sync);
  window.addEventListener('pageshow', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, {threshold: .05}).observe(video);
  }
  sync();
}
