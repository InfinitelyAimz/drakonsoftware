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
    // The spine supplies the movement; a shallow turn adds a little depth.
    dragon.position.set(0, 0, Math.sin(elapsed * .24) * .16);
    dragon.rotation.set(Math.sin(elapsed * .34) * .035, Math.sin(elapsed * .28 - .4) * .16, 0);
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
        const float bodyWidth = 4.8;

        vec3 headPath(float t) {
          return vec3(
            0.22 * sin(t * 0.39),
            0.24 * sin(t * 0.67) + 0.07 * sin(t * 0.31 + 0.5),
            0.16 * sin(t * 0.48)
          );
        }
        float headTurn(float t) {
          return 0.13 * cos(t * 0.67) + 0.025 * sin(t * 0.31);
        }
        float originalSpine(float u) {
          // Follow the drawn body: low at the tail, rising into the neck.
          return (-0.15 + 0.38 * smoothstep(0.61, 0.85, u)) * 2.4;
        }
        vec3 spineOffset(float u, float t) {
          float distanceFromHead = max(0.0, 0.84 - u);
          float delay = distanceFromHead * 3.15;
          float tail = pow(clamp(distanceFromHead / 0.84, 0.0, 1.0), 1.15);
          // Positive u phase sends each bend from the head toward the tail.
          float wave = t * 1.7 + u * 8.6;
          vec3 following = headPath(t - delay);
          following.y += sin(wave) * (0.08 + 0.38 * tail) * smoothstep(0.0, 0.14, distanceFromHead);
          following.z += cos(wave - 0.9) * 0.18 * tail;
          following.x += sin(wave - 0.45) * 0.06 * tail;
          return following;
        }
        vec2 turn(vec2 p, float angle) {
          float c = cos(angle), s = sin(angle);
          return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        }
        void main() {
          artworkUv = uv;
          float u = uv.x;
          vec3 offset = spineOffset(u, time);
          vec3 before = spineOffset(max(0.0, u - 0.008), time);
          vec3 after = spineOffset(min(1.0, u + 0.008), time);
          float bend = atan(after.y - before.y, 0.016 * bodyWidth + after.x - before.x);
          float delay = max(0.0, 0.84 - u) * 3.15;
          float sectionTurn = bend * 0.72 + headTurn(time - delay) * 0.38;
          vec3 p = position;
          vec2 section = turn(vec2(0.0, p.y - originalSpine(u)), sectionTurn);
          p.x += section.x;
          p.y = originalSpine(u) + section.y;
          p += offset;

          // Move the skull and snout as one rigid region, separate from body flex.
          vec2 headAnchor = vec2((0.84 - 0.5) * bodyWidth, originalSpine(0.84));
          vec3 rigidHead = position;
          rigidHead.xy = headAnchor + turn(position.xy - headAnchor, headTurn(time));
          rigidHead += headPath(time);
          p = mix(p, rigidHead, smoothstep(0.77, 0.86, u));
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
