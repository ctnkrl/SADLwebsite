import * as THREE from './assets/vendor/three.module.js';
import { OrbitControls } from './assets/vendor/OrbitControls.js';

const $ = selector => document.querySelector(selector);
const stage = $('#pca-stage');
const view = $('.geometry-view');
let current = { id: $('#geometry-select').value, label: $('#geometry-select').selectedOptions[0].textContent };
let selectedView = '3d';
let data;
let renderer, scene, camera, controls, cloud, frame;
let visible = false;
const colors = [0xdc4960, 0x45a38a, 0x3f7cc4, 0xd5a635];
const zh = () => document.documentElement.lang.startsWith('zh');

function label(text, position) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '42px "Times New Roman"'; ctx.textAlign = 'center'; ctx.fillStyle = '#344c49';
  ctx.fillText(text, 128, 44);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.position.set(...position); sprite.scale.set(0.85, 0.2125, 1);
  cloud.add(sprite);
}

function disposeCloud() {
  if (!cloud) return;
  scene.remove(cloud);
  cloud.traverse(object => {
    object.geometry?.dispose();
    object.material?.map?.dispose();
    object.material?.dispose();
  });
}

function renderCloud() {
  if (!data || !scene || current.id.startsWith('glyph-')) return;
  const dataset = data.datasets[current.id];
  if (!dataset) return;
  disposeCloud();
  cloud = new THREE.Group(); scene.add(cloud);
  const raw = dataset.positions;
  const extent = Math.ceil(raw.reduce((max, v) => Math.max(max, Math.abs(v)), 0)) || 1;
  for (let task = 0; task < 4; task++) {
    const start = task * dataset.points_per_task * 3;
    const points = [];
    for (let i = start; i < start + dataset.points_per_task * 3; i += 3) points.push(raw[i] / extent, raw[i + 2] / extent, raw[i + 1] / extent);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const stamp = document.createElement('canvas'); stamp.width = stamp.height = 32;
    const context = stamp.getContext('2d'); context.fillStyle = '#fff'; context.beginPath(); context.arc(16, 16, 15, 0, Math.PI * 2); context.fill();
    const material = new THREE.PointsMaterial({ color: colors[task], map: new THREE.CanvasTexture(stamp), alphaTest: .2, size: 3.4 * Math.min(devicePixelRatio, 2), sizeAttenuation: false, transparent: true, opacity: .85, depthWrite: false });
    const object = new THREE.Points(geometry, material);
    object.name = `task-${task}`; object.visible = $(`[data-pca-task="${task}"]`).checked;
    cloud.add(object);
  }
  const grid = new THREE.GridHelper(2, 4, 0xc7d6d2, 0xe6eeeb);
  grid.position.y = -1; cloud.add(grid);
  const box = new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)), 0xd8e3df);
  cloud.add(box);
  label('PC1', [0, -1.32, 1]); label('PC2', [1.3, -1.28, 0]); label('PC3', [-1.55, 0.18, 1]);
  for (const n of [-1, 0, 1]) {
    label(String(n * extent), [n, -1.13, 1]);
    if (n !== 1) label(String(n * extent), [1.13, -1.13, n]);
    if (n !== -1) label(String(n * extent), [-1.12, n, 1]);
  }
  stage.dataset.points = String(dataset.points_per_task * 4);
  stage.dataset.dataset = current.id;
  stage.dataset.variance = dataset.explained_variance.join(',');
  reset();
}

function reset() {
  if (!camera) return;
  camera.position.set(3.6, 2.5, 4.2);
  controls.target.set(0, 0, 0); camera.zoom = 1; camera.updateProjectionMatrix(); controls.update();
}

function syncView() {
  const glyph = current.id.startsWith('glyph-');
  const interactive = !glyph && selectedView === '3d' && !!renderer;
  stage.hidden = !interactive;
  $('#geometry-panel').hidden = interactive;
  $('.geometry-tools').hidden = !interactive;
  $('.pca-task-filters').hidden = !interactive;
  $('.pca-note').hidden = !interactive;
  document.querySelectorAll('[data-geometry-view]').forEach(button => {
    button.disabled = glyph && button.dataset.geometryView === '3d';
    button.setAttribute('aria-pressed', String(button.dataset.geometryView === (interactive ? '3d' : 'paper')));
  });
  $('#pca-title').textContent = current.label;
  $('#pca-subtitle').textContent = zh() ? 'INTACT · 第 1 个 epoch · Z · 训练 seed 0' : 'INTACT · Epoch 1 · Z · training seed 0';
  $('#pca-reset').title = $('#pca-reset').ariaLabel = zh() ? '重置视角' : 'Reset view';
  $('#pca-expand').title = $('#pca-expand').ariaLabel = zh() ? '放大视图' : 'Expand view';
  $('#pca-spin').title = $('#pca-spin').ariaLabel = zh() ? '自动旋转' : 'Rotate automatically';
  if (interactive) resize();
}

function resize() {
  if (!renderer || !stage.clientWidth) return;
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  camera.aspect = stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
}

function tick() {
  frame = undefined;
  if (!visible || document.hidden) return;
  controls.update(); renderer.render(scene, camera);
  stage.dataset.camera = camera.position.toArray().map(v => v.toFixed(2)).join(',');
  frame = requestAnimationFrame(tick);
}
function wake() { if (!frame && renderer && visible && !document.hidden) frame = requestAnimationFrame(tick); }

window.addEventListener('sadl-geometry-change', event => {
  const changed = current.id !== event.detail.id;
  current = event.detail;
  if (changed) renderCloud();
  syncView();
});
document.querySelectorAll('[data-geometry-view]').forEach(button => button.addEventListener('click', () => { selectedView = button.dataset.geometryView; syncView(); }));
document.querySelectorAll('[data-pca-task]').forEach(input => input.addEventListener('change', () => {
  const object = cloud?.getObjectByName(`task-${input.dataset.pcaTask}`);
  if (object) object.visible = input.checked;
  stage.dataset.visibleTasks = [...document.querySelectorAll('[data-pca-task]:checked')].map(i => i.dataset.pcaTask).join(',');
}));
$('#pca-reset').addEventListener('click', reset);
$('#pca-spin').addEventListener('click', () => {
  if (!controls) return;
  controls.autoRotate = !controls.autoRotate;
  $('#pca-spin').setAttribute('aria-pressed', String(controls.autoRotate));
});
$('#pca-expand').addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else if (view.requestFullscreen) await view.requestFullscreen();
  else view.classList.toggle('is-expanded');
  resize();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') { view.classList.remove('is-expanded'); resize(); } });
document.addEventListener('visibilitychange', wake);

try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#pca-canvas'), antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0xffffff);
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(36, 1, .01, 100);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .09; controls.enablePan = false;
  controls.minDistance = 1.2; controls.maxDistance = 15; controls.autoRotateSpeed = .7;
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; wake(); }).observe(stage);
  syncView();
  const response = await fetch('assets/data/endpoint-pca.json');
  if (!response.ok) throw new Error(`Geometry data: ${response.status}`);
  data = await response.json(); renderCloud(); wake();
} catch (error) {
  renderer?.dispose(); renderer = undefined; selectedView = 'paper'; syncView();
  console.warn('Using the original paper figure:', error.message);
}
