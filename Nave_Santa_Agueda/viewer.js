const MODEL_URL = "./models/nave.glb";

const modelViewer = document.querySelector("#modelViewer");
const fileInput = document.querySelector("#fileInput");
const chooseFile = document.querySelector("#chooseFile");
const dropZone = document.querySelector("#dropZone");
const fileStatus = document.querySelector("#fileStatus");
const toast = document.querySelector("#toast");
const autoRotate = document.querySelector("#autoRotate");
const exposure = document.querySelector("#exposure");
const shadowIntensity = document.querySelector("#shadowIntensity");
const resetCamera = document.querySelector("#resetCamera");
const clearScene = document.querySelector("#clearScene");
const debugStatus = document.querySelector("#debugStatus");

let objectUrl = "";

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3600);
}

function writeDebug(message, isError = false) {
  debugStatus.textContent = message;
  debugStatus.classList.toggle("is-error", isError);
}

function setModel(src, name) {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  }
  modelViewer.src = src;
  fileStatus.textContent = name;
}

function loadLocalFile(file) {
  if (!file || !/\.glb$/i.test(file.name)) {
    showToast("Elige un archivo .glb.", true);
    return;
  }
  const nextObjectUrl = URL.createObjectURL(file);
  setModel(nextObjectUrl, file.name);
  objectUrl = nextObjectUrl;
}

chooseFile.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => loadLocalFile(fileInput.files?.[0]));

["dragenter", "dragover"].forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  document.addEventListener(eventName, () => {
    dropZone.classList.remove("is-dragging");
  });
});

document.addEventListener("drop", (event) => {
  event.preventDefault();
  loadLocalFile(event.dataTransfer?.files?.[0]);
});

autoRotate.addEventListener("change", () => {
  modelViewer.toggleAttribute("auto-rotate", autoRotate.checked);
});

exposure.addEventListener("input", () => {
  modelViewer.exposure = Number(exposure.value);
});

shadowIntensity.addEventListener("input", () => {
  modelViewer.shadowIntensity = Number(shadowIntensity.value);
});

resetCamera.addEventListener("click", () => {
  modelViewer.cameraOrbit = "45deg 65deg auto";
  modelViewer.fieldOfView = "30deg";
  modelViewer.jumpCameraToGoal();
});

clearScene.addEventListener("click", () => {
  setModel(MODEL_URL, "nave.glb");
});

modelViewer.addEventListener("load", () => {
  fileStatus.textContent = fileStatus.textContent || "nave.glb";
  writeDebug("OK: modelo cargado en el visor.");
  showToast("Modelo cargado.");
});

modelViewer.addEventListener("error", (event) => {
  console.error("model-viewer error", event);
  showToast("No se pudo cargar models/nave.glb. Revisa que exista y se llame exactamente nave.glb.", true);
});

async function checkDefaultModel() {
  try {
    const response = await fetch(MODEL_URL, { cache: "no-store" });
    if (!response.ok) {
      writeDebug(`ERROR ${response.status}: no se encuentra ${MODEL_URL}.`, true);
      return;
    }

    const contentType = response.headers.get("content-type") || "sin content-type";
    const contentLength = response.headers.get("content-length") || "tamano desconocido";
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    const signature = String.fromCharCode(...bytes.slice(0, 4));

    if (signature !== "glTF") {
      writeDebug(`ERROR: nave.glb no parece GLB. Firma: ${signature || "vacia"}. Tipo: ${contentType}.`, true);
      return;
    }

    writeDebug(`OK: ${MODEL_URL} existe. ${contentLength} bytes. ${contentType}.`);
  } catch (error) {
    writeDebug(`ERROR: no se pudo comprobar ${MODEL_URL}. ${error.message}`, true);
  }
}

window.addEventListener("beforeunload", () => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
});

setModel(MODEL_URL, "nave.glb");
checkDefaultModel();
