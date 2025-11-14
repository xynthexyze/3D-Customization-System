import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/geometries/TextGeometry.js';

const container = document.getElementById('viewer-container');
const colorPicker = document.getElementById('colorPicker');
const textInput = document.getElementById('signText');
const updateTextBtn = document.getElementById('updateTextBtn');

if (!container || !colorPicker || !textInput || !updateTextBtn) {
  console.error("Missing DOM elements for 3D viewer.");
  return;
}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(2, 2, 5);
controls.update();

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// Load model
let signageBase;
const loader = new GLTFLoader();
loader.load(
  './base_signage.glb',
  (gltf) => {
    signageBase = gltf.scene;
    signageBase.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      }
    });
    scene.add(signageBase);
  },
  undefined,
  (error) => console.error('Error loading model:', error)
);

// Text
let textMesh;
const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/helvetiker_regular.typeface.json',
  (font) => {
    createText(font, "Your Sign Here");
    updateTextBtn.addEventListener('click', () => {
      const newText = textInput.value || "Your Sign Here";
      scene.remove(textMesh);
      createText(font, newText);
    });
  }
);

function createText(font, text) {
  const geometry = new TextGeometry(text, {
    font: font,
    size: 0.3,
    height: 0.05,
  });
  const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
  textMesh = new THREE.Mesh(geometry, material);
  textMesh.position.set(-1, 0.5, 0);
  scene.add(textMesh);
}

// Color change
colorPicker.addEventListener('input', (event) => {
  const color = new THREE.Color(event.target.value);
  if (signageBase) {
    signageBase.traverse((child) => {
      if (child.isMesh) child.material.color.set(color);
    });
  }
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});