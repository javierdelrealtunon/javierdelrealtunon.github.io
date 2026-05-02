import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("#viewerCanvas");
const viewerWrap = document.querySelector("#viewerWrap");
const dropZone = document.querySelector("#dropZone");
const fileInput = document.querySelector("#fileInput");
const chooseFile = document.querySelector("#chooseFile");
const emptyState = document.querySelector("#emptyState");
const toast = document.querySelector("#toast");
const fileStatus = document.querySelector("#fileStatus");
const backgroundMode = document.querySelector("#backgroundMode");
const exposure = document.querySelector("#exposure");
const lightIntensity = document.querySelector("#lightIntensity");
const showGrid = document.querySelector("#showGrid");
const autoRotate = document.querySelector("#autoRotate");
const wireframe = document.querySelector("#wireframe");
const showBounds = document.querySelector("#showBounds");
const animationSelect = document.querySelector("#animationSelect");
const resetCamera = document.querySelector("#resetCamera");
const togglePlay = document.querySelector("#togglePlay");
const clearScene = document.querySelector("#clearScene");
const vertexCount = document.querySelector("#vertexCount");
const triangleCount = document.querySelector("#triangleCount");
const materialCount = document.querySelector("#materialCount");
const modelSize = document.querySelector("#modelSize");

const DEFAULT_MODEL_URL = "./models/nave.glb";

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = Number(exposure.value);

const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 5000);
camera.position.set(3.5, 2.4, 4.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.screenSpacePanning = true;
controls.autoRotateSpeed = 1.2;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x2f343a, 1.1);
const keyLight = new THREE.DirectionalLight(0xffffff, Number(lightIntensity.value));
keyLight.position.set(5, 8, 5);
scene.add(hemiLight, keyLight);

const grid = new THREE.GridHelper(10, 20, 0x6f7780, 0x353b42);
grid.position.y = -0.01;
scene.add(grid);

const boundsHelper = new THREE.Box3Helper(new THREE.Box3(), 0xf2b84b);
boundsHelper.visible = false;
scene.add(boundsHelper);

const loader = new GLTFLoader();
const clock = new THREE.Clock();
let currentRoot = null;
let mixer = null;
let clips = [];
let currentAction = null;
let isPlaying = true;
let activeUrls = [];
let originalMaterials = new Map();
let resizeObserver;

function resizeRenderer() {
  const { width, height } = viewerWrap.getBoundingClientRect();
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  renderer.setSize(safeWidth, safeHeight, false);
  camera.aspect = safeWidth / safeHeight;
  camera.updateProjectionMatrix();
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.borderColor = isError ? "rgba(227, 93, 91, 0.75)" : "";
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3300);
}

function revokeUrls() {
  activeUrls.forEach((url) => URL.revokeObjectURL(url));
  activeUrls = [];
}

function clearModel() {
  if (!currentRoot) {
    return;
  }
  scene.remove(currentRoot);
  currentRoot.traverse((node) => {
    if (node.isMesh) {
      node.geometry?.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => material?.dispose?.());
    }
  });
  currentRoot = null;
  mixer = null;
  clips = [];
  currentAction = null;
  originalMaterials.clear();
  boundsHelper.visible = false;
  animationSelect.innerHTML = '<option value="">Sin animaciones</option>';
  animationSelect.disabled = true;
  togglePlay.disabled = true;
}

function resetStats() {
  vertexCount.textContent = "0";
  triangleCount.textContent = "0";
  materialCount.textContent = "0";
  modelSize.textContent = "-";
  fileStatus.textContent = "Sin archivo cargado";
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function collectStats(root) {
  let vertices = 0;
  let triangles = 0;
  const materials = new Set();
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);

  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    const geometry = node.geometry;
    if (geometry?.attributes?.position) {
      vertices += geometry.attributes.position.count;
      triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
    }
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    nodeMaterials.forEach((material) => material && materials.add(material.uuid));
  });

  vertexCount.textContent = formatNumber(vertices);
  triangleCount.textContent = formatNumber(Math.round(triangles));
  materialCount.textContent = formatNumber(materials.size);
  modelSize.textContent = `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`;
}

function frameModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const direction = new THREE.Vector3(0.72, 0.48, 0.72).normalize();

  camera.near = Math.max(maxDim / 1000, 0.01);
  camera.far = Math.max(maxDim * 100, 100);
  camera.position.copy(center).add(direction.multiplyScalar(distance * 1.75));
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = maxDim * 0.02;
  controls.maxDistance = maxDim * 20;
  controls.update();

  grid.scale.setScalar(Math.max(maxDim / 5, 1));
  grid.position.y = box.min.y;
  boundsHelper.box.copy(box);
}

function applyWireframe(enabled) {
  if (!currentRoot) {
    return;
  }
  currentRoot.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    if (!originalMaterials.has(node.uuid)) {
      originalMaterials.set(node.uuid, materials.map((material) => material));
    }
    materials.forEach((material) => {
      if (material) {
        material.wireframe = enabled;
      }
    });
  });
}

function updateAnimationControls() {
  animationSelect.innerHTML = "";
  if (!clips.length) {
    animationSelect.innerHTML = '<option value="">Sin animaciones</option>';
    animationSelect.disabled = true;
    togglePlay.disabled = true;
    return;
  }

  clips.forEach((clip, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = clip.name || `Animacion ${index + 1}`;
    animationSelect.append(option);
  });
  animationSelect.disabled = false;
  togglePlay.disabled = false;
}

function addLoadedModel(gltf, modelName) {
  currentRoot = gltf.scene;
  clips = gltf.animations || [];
  scene.add(currentRoot);
  mixer = clips.length ? new THREE.AnimationMixer(currentRoot) : null;
  updateAnimationControls();
  if (clips.length) {
    playClip(0);
  }
  collectStats(currentRoot);
  frameModel(currentRoot);
  applyWireframe(wireframe.checked);
  boundsHelper.visible = showBounds.checked;
  emptyState.style.display = "none";
  fileStatus.textContent = modelName;
  showToast("Modelo cargado.");
}

function playClip(index) {
  if (!mixer || !clips[index]) {
    return;
  }
  currentAction?.fadeOut(0.18);
  currentAction = mixer.clipAction(clips[index]);
  currentAction.reset().fadeIn(0.18);
  if (isPlaying) {
    currentAction.play();
  }
}

function loadFiles(fileList) {
  const files = Array.from(fileList || []);
  const modelFile = files.find((file) => /\.(glb|gltf)$/i.test(file.name));

  if (!modelFile) {
    showToast("Elige un archivo .glb o .gltf.", true);
    return;
  }

  clearModel();
  revokeUrls();
  const fileMap = new Map();
  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    activeUrls.push(url);
    fileMap.set(file.name, url);
    fileMap.set(encodeURI(file.name), url);
  });

  const fileUrl = fileMap.get(modelFile.name);
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    const cleanUrl = url.split("/").pop();
    return fileMap.get(url) || fileMap.get(cleanUrl) || url;
  });
  loader.manager = manager;
  fileStatus.textContent = modelFile.name;
  showToast(`Cargando ${modelFile.name}...`);

  loader.load(
    fileUrl,
    (gltf) => {
      addLoadedModel(gltf, modelFile.name);
    },
    undefined,
    (error) => {
      console.error(error);
      clearModel();
      resetStats();
      emptyState.style.display = "";
      showToast("No he podido abrir el modelo. Revisa que el archivo GLB/GLTF sea valido.", true);
    },
  );
}

function loadDefaultModel() {
  loader.manager = THREE.DefaultLoadingManager;
  loader.load(
    DEFAULT_MODEL_URL,
    (gltf) => {
      clearModel();
      addLoadedModel(gltf, "nave.glb");
    },
    undefined,
    () => {
      showToast("Pon tu modelo en models/nave.glb para cargarlo automaticamente.");
    },
  );
}

function createIntroModel() {
  const group = new THREE.Group();
  const materialA = new THREE.MeshStandardMaterial({ color: 0x2fbf9b, roughness: 0.55, metalness: 0.18 });
  const materialB = new THREE.MeshStandardMaterial({ color: 0xf2b84b, roughness: 0.38, metalness: 0.28 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 1.35), materialA);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.035, 12, 80), materialB);
  ring.rotation.x = Math.PI / 2.8;
  ring.rotation.y = Math.PI / 5;
  group.add(body, ring);
  group.position.y = 0.75;
  group.userData.isIntro = true;
  scene.add(group);
  currentRoot = group;
  collectStats(group);
  frameModel(group);
  fileStatus.textContent = "Modelo de ejemplo";
}

chooseFile.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => loadFiles(fileInput.files));

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
  viewerWrap.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => dropZone.classList.remove("is-dragging"));
  viewerWrap.addEventListener(eventName, () => dropZone.classList.remove("is-dragging"));
});

[dropZone, viewerWrap].forEach((target) => {
  target.addEventListener("drop", (event) => {
    event.preventDefault();
    loadFiles(event.dataTransfer?.files);
  });
});

backgroundMode.addEventListener("change", () => {
  document.body.classList.toggle("bg-graphite", backgroundMode.value === "graphite");
  document.body.classList.toggle("bg-light", backgroundMode.value === "light");
});

exposure.addEventListener("input", () => {
  renderer.toneMappingExposure = Number(exposure.value);
});

lightIntensity.addEventListener("input", () => {
  keyLight.intensity = Number(lightIntensity.value);
});

showGrid.addEventListener("change", () => {
  grid.visible = showGrid.checked;
});

autoRotate.addEventListener("change", () => {
  controls.autoRotate = autoRotate.checked;
});

wireframe.addEventListener("change", () => {
  applyWireframe(wireframe.checked);
});

showBounds.addEventListener("change", () => {
  boundsHelper.visible = showBounds.checked;
});

animationSelect.addEventListener("change", () => {
  playClip(Number(animationSelect.value));
});

resetCamera.addEventListener("click", () => {
  if (currentRoot) {
    frameModel(currentRoot);
  }
});

togglePlay.addEventListener("click", () => {
  isPlaying = !isPlaying;
  currentAction?.paused = !isPlaying;
  togglePlay.innerHTML = isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
  window.lucide?.createIcons();
});

clearScene.addEventListener("click", () => {
  clearModel();
  revokeUrls();
  resetStats();
  emptyState.style.display = "";
  createIntroModel();
  emptyState.style.display = "";
  showToast("Escena limpia.");
});

function animate() {
  const delta = clock.getDelta();
  if (mixer && isPlaying) {
    mixer.update(delta);
  }
  if (currentRoot?.userData?.isIntro) {
    currentRoot.rotation.y += delta * 0.35;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("beforeunload", revokeUrls);
resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(viewerWrap);
resizeRenderer();
createIntroModel();
loadDefaultModel();
animate();
window.lucide?.createIcons();
window.addEventListener("load", () => window.lucide?.createIcons());
