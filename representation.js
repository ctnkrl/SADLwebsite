import * as THREE from './assets/vendor/three.module.js';

const stage = document.querySelector('#representation-stage');
const canvas = document.querySelector('#representation');
const pauseButton = document.querySelector('#pause-scene');
const shapeButtons = [...document.querySelectorAll('[data-shape]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function startScene() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
  renderer.setClearColor(0xffffff, 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 10, 24);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(0, 0.3, 11);
  camera.lookAt(0, 0, 0);
  const group = new THREE.Group();
  scene.add(group);
  let seed = 2026;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const count = 4400;
  const expanded = new Float32Array(count * 3);
  const collapsed = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [0x6ce2ba, 0xed8d9f, 0x8abce4, 0xe9cb80].map(hex => new THREE.Color(hex));
  const glyph = document.createElement('canvas');
  glyph.width = 1000;
  glyph.height = 250;
  const ctx = glyph.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = '800 240px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SADL', 500, 137);
  const textLeft = 500 - ctx.measureText('SADL').width / 2;
  const letterEnds = ['S', 'SA', 'SAD', 'SADL'].map(text => textLeft + ctx.measureText(text).width);
  const pixels = ctx.getImageData(0, 0, 1000, 250).data;
  const samples = [];
  for (let y = 12; y < 245; y += 3) for (let x = 20; x < 980; x += 3) {
    if (pixels[(y * 1000 + x) * 4 + 3] > 100) samples.push([x, y]);
  }
  for (let i = 0; i < count; i++) {
    const p = samples[Math.floor(random() * samples.length)];
    const j = i * 3;
    const x = (p[0] / 1000 - 0.5) * 13.0;
    expanded[j] = x + (random() - 0.5) * 0.035;
    expanded[j + 1] = (0.5 - p[1] / 250) * 3.3 + 0.15;
    expanded[j + 2] = (random() - 0.5) * 0.75;
    collapsed[j] = (random() - 0.5) * 8.3;
    collapsed[j + 1] = (random() - 0.5) * 0.10;
    collapsed[j + 2] = (random() - 0.5) * 0.10;
    positions[j] = expanded[j];
    positions[j + 1] = expanded[j + 1];
    positions[j + 2] = expanded[j + 2];
    const color = palette[Math.max(0, letterEnds.findIndex(end => p[0] <= end))];
    colors[j] = color.r;
    colors[j + 1] = color.g;
    colors[j + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.031, vertexColors: true, transparent: true, opacity: 1, sizeAttenuation: true, depthWrite: false });
  group.add(new THREE.Points(geometry, material));
  const grid = new THREE.GridHelper(22, 32, 0xc7d9d1, 0xe3ece8);
  grid.position.y = -1.6;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  let target = 1;
  let morph = 1;
  let paused = reducedMotion.matches;
  let visible = true;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;
  let last = 0;
  let clock = 0;
  let previousX = 0;
  let drag = false;
  let dragRotation = 0;
  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    camera.aspect = width / height;
    camera.fov = width < 700 ? 39 : 36;
    camera.position.z = Math.max(5.5, 11.5 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    group.scale.setScalar(width < 700 ? 0.82 : 1);
    group.rotation.y = THREE.MathUtils.clamp(group.rotation.y, -0.24, 0.24);
    render(performance.now());
  }
  function draw(time) {
    const dt = Math.min((time - last) / 1000 || 0.016, 0.05);
    last = time;
    if (!paused) clock += dt;
    morph += (target - morph) * Math.min(1, dt * 4.5);
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      const wave = paused ? 0 : Math.sin(clock * 0.6 + i * 0.031) * 0.012;
      positions[j] = collapsed[j] + (expanded[j] - collapsed[j]) * morph;
      positions[j + 1] = collapsed[j + 1] + (expanded[j + 1] - collapsed[j + 1]) * morph + wave;
      positions[j + 2] = collapsed[j + 2] + (expanded[j + 2] - collapsed[j + 2]) * morph;
    }
    geometry.attributes.position.needsUpdate = true;
    const rotation = paused ? 0 : Math.sin(clock * 0.22) * 0.12;
    const targetRotation = THREE.MathUtils.clamp(rotation + pointerX * 0.16 + dragRotation, -0.24, 0.24);
    group.rotation.y += (targetRotation - group.rotation.y) * 0.06;
    group.rotation.x += (pointerY * 0.06 - group.rotation.x) * 0.06;
    renderer.render(scene, camera);
    canvas.dataset.frames = String(++frame);
  }
  let raf;
  function render(time) {
    draw(time);
    if (!raf && visible && !document.hidden && (!paused || Math.abs(target - morph) > 0.001)) raf = requestAnimationFrame(tick);
  }
  function tick(time) {
    raf = undefined;
    render(time);
  }
  function wake() { if (!raf) render(performance.now()); }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) wake(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = performance.now(); wake(); } });
  stage.addEventListener('pointermove', event => {
    const bounds = stage.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
    if (drag) { dragRotation = THREE.MathUtils.clamp(dragRotation + (event.clientX - previousX) * 0.003, -0.24, 0.24); previousX = event.clientX; }
    wake();
  });
  stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; drag = false; });
  stage.addEventListener('pointerdown', event => { drag = true; previousX = event.clientX; stage.setPointerCapture(event.pointerId); });
  stage.addEventListener('pointerup', () => { drag = false; });
  shapeButtons.forEach(button => button.addEventListener('click', () => {
    target = button.dataset.shape === 'collapsed' ? 0 : 1;
    shapeButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    canvas.dataset.shape = button.dataset.shape;
    if (reducedMotion.matches) morph = target;
    wake();
  }));
  function syncPauseButton() {
    pauseButton.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Play animation' : 'Pause animation';
    pauseButton.title = label;
    pauseButton.setAttribute('aria-label', label);
    pauseButton.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}"></i>`;
    window.lucide?.createIcons();
  }
  pauseButton.addEventListener('click', () => { paused = !paused; syncPauseButton(); last = performance.now(); wake(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncPauseButton(); wake(); });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(raf); stage.classList.remove('is-ready'); stage.classList.add('is-unavailable'); });
  canvas.dataset.shape = 'expanded';
  stage.classList.add('is-ready');
  syncPauseButton();
  resize();
}

try { startScene(); } catch (error) {
  stage.classList.add('is-unavailable');
  console.warn('Representation animation unavailable; showing the paper figure.', error.message);
}
