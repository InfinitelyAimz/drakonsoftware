import * as THREE from './three.module.min.js';

// Animate the supplied artwork itself. No substitute dragon is generated.
const stage = document.querySelector('.dragon-stage');
const canvas = stage?.querySelector('canvas');
if (canvas) {
  try { animateArtwork(); } catch (error) { console.warn('Showing the supplied dragon artwork.', error); }
}

function animateArtwork() {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setClearColor(0x080b0b, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 30);
  camera.position.z = 8;
  let paused = false;
  let visible = true;
  let ready = false;
  let elapsed = 0;
  let lastTime = null;
  let request = null;
  let lastPaint = 0;
  let dragon;
  let uniforms;

  function updateLabel() {
    canvas.setAttribute('aria-label', paused ? 'Resume dragon animation' : 'Pause dragon animation');
    canvas.setAttribute('aria-pressed', String(paused));
  }
  function draw() {
    if (!ready) return;
    uniforms.time.value = elapsed;
    // A shallow figure-eight glide and gentle turns keep the whole dragon in view.
    dragon.position.set(Math.sin(elapsed * .3) * .26, Math.sin(elapsed * .6) * .23, 0);
    dragon.rotation.set(Math.sin(elapsed * .45) * .045, Math.sin(elapsed * .3 - .4) * .26, Math.sin(elapsed * .3 + .3) * .065);
    renderer.render(scene, camera);
  }
  function tick(now) {
    if (lastTime !== null) elapsed += Math.min(now - lastTime, 80) / 1000;
    lastTime = now;
    if (now - lastPaint >= 1000 / 30) { draw(); lastPaint = now; }
    request = requestAnimationFrame(tick);
  }
  function sync() {
    if (request !== null) cancelAnimationFrame(request);
    request = null;
    lastTime = null;
    updateLabel();
    draw();
    if (ready && !paused && visible && !document.hidden) request = requestAnimationFrame(tick);
  }
  function toggle() { paused = !paused; sync(); }
  canvas.setAttribute('role', 'button');
  canvas.tabIndex = 0;
  canvas.addEventListener('click', toggle);
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
  });
  document.addEventListener('visibilitychange', sync);
  function resize() {
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    draw();
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:.05}).observe(stage);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    ready = false;
    sync();
    stage.classList.remove('dragon-ready');
  });
  new THREE.TextureLoader().load('drakon-swimmer.png', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    uniforms = {artwork:{value:texture}, time:{value:0}};
    const material = new THREE.ShaderMaterial({
      uniforms,
      side:THREE.DoubleSide,
      toneMapped:false,
      vertexShader:`
        varying vec2 artworkUv;
        uniform float time;
        void main() {
          artworkUv = uv;
          vec3 p = position;
          // Wave energy is strongest at the tail; the head keeps its drawn shape.
          float tail = pow(1.0 - uv.x, 1.5);
          float wave = time * 2.25 - uv.x * 8.0;
          p.y += sin(wave) * 0.24 * tail;
          p.z += cos(wave - 0.5) * 0.18 * tail;
          p.x += sin(time * 1.15 - uv.x * 4.0) * 0.035 * tail;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader:`
        varying vec2 artworkUv;
        uniform sampler2D artwork;
        void main() {
          gl_FragColor = texture2D(artwork, artworkUv);
          #include <colorspace_fragment>
        }
      `
    });
    const geometry = new THREE.PlaneGeometry(4.8, 4.8 * texture.image.height / texture.image.width, 100, 24);
    dragon = new THREE.Mesh(geometry, material);
    dragon.frustumCulled = false;
    scene.add(dragon);
    ready = true;
    resize();
    sync();
    stage.classList.add('dragon-ready');
  }, undefined, () => { stage.classList.remove('dragon-ready'); });
  resize();
  updateLabel();
}
