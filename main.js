import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

if (isWebGLAvailable()) {
  let loadedModel = null;
  let modelMaxDim = 1;

  const canvas = document.getElementById('mockup-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0.5, 12);

  function resizeCanvas() {
    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateModelScale();
  }

  function updateModelScale() {
    if (!loadedModel) return;
    const scaleFactor = window.innerWidth <= 768 ? 3.8 : 5;
    const scale = scaleFactor / modelMaxDim;
    loadedModel.scale.set(scale, scale, scale);
  }

  resizeCanvas();

  // Light
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const directional = new THREE.DirectionalLight(0xffffff, 1.5);
  directional.position.set(5, 10, 7);
  scene.add(directional);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.enablePan = false;

  // 상태 변수
  let isUserInteracting = false;
  let targetReturning = false;

  // 초기 카메라 기준 회전 정보
  const initialTarget = new THREE.Vector3(0, 0, 0);
  let initialSpherical, currentSpherical;

  // 오토 회전 관련 변수
  let autoRotateEnabled = true;
  let autoThetaOffset = 0;
  const maxAutoTheta = THREE.MathUtils.degToRad(30); // ±30도

  // 사용자 조작 감지
  controls.addEventListener('start', () => {
    isUserInteracting = true;
    targetReturning = false;
    autoRotateEnabled = false;
  });

  controls.addEventListener('end', () => {
    isUserInteracting = false;
    targetReturning = true;
  });

  const loader = new GLTFLoader();
  loader.load(
    'model/apple_iphone_15_pro_max_black.glb',
    function (gltf) {
      loadedModel = gltf.scene;

      const video = document.createElement('video');
      video.src = 'model/codeLounge.mp4';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.play();

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.flipY = true;
      videoTexture.colorSpace = THREE.SRGBColorSpace;

      loadedModel.traverse((node) => {
        if (node.isMesh && node.material.name === 'pIJKfZsazmcpEiU') {
          node.material = new THREE.MeshBasicMaterial({ map: videoTexture });
        }
      });

      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      loadedModel.position.sub(center);
      modelMaxDim = Math.max(size.x, size.y, size.z);
      updateModelScale();

      loadedModel.rotation.y = Math.PI;
      scene.add(loadedModel);

      controls.target.copy(loadedModel.position);
      initialTarget.copy(controls.target);

      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      initialSpherical = new THREE.Spherical().setFromVector3(offset);
      currentSpherical = new THREE.Spherical().clone(initialSpherical);
    },
    undefined,
    function (error) {
      console.error('GLB 모델 로드 실패:', error);
    }
  );

  function animate(time) {
    requestAnimationFrame(animate);

    // 원위치 복원 로직
    if (!isUserInteracting && targetReturning && initialSpherical && controls) {
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      currentSpherical.setFromVector3(offset);

      const lerpSpeed = 0.05;
      currentSpherical.theta += (initialSpherical.theta - currentSpherical.theta) * lerpSpeed;
      currentSpherical.phi   += (initialSpherical.phi   - currentSpherical.phi)   * lerpSpeed;

      const newOffset = new THREE.Vector3().setFromSpherical(currentSpherical);
      camera.position.copy(controls.target.clone().add(newOffset));
      camera.lookAt(controls.target);

      controls.target.lerp(initialTarget, lerpSpeed);

      const angleDiff = Math.abs(currentSpherical.theta - initialSpherical.theta) +
                        Math.abs(currentSpherical.phi   - initialSpherical.phi);
      const distance = controls.target.distanceTo(initialTarget);

      if (angleDiff < 0.01 && distance < 0.01) {
        controls.target.copy(initialTarget);
        targetReturning = false;
        autoRotateEnabled = true; // 복원 끝나면 오토 회전 재시작
      }
    }

    // 오토 회전 로직
    if (!isUserInteracting && !targetReturning && autoRotateEnabled && initialSpherical) {
      const t = time * 0.001; // ms → s
      autoThetaOffset = Math.sin(t) * maxAutoTheta;

      const spherical = new THREE.Spherical().copy(initialSpherical);
      spherical.theta += autoThetaOffset;

      const newOffset = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(initialTarget.clone().add(newOffset));
      camera.lookAt(initialTarget);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
  window.addEventListener('resize', resizeCanvas);

} else {
  document.getElementById('mockup-canvas').style.display = 'none';
  document.getElementById('webgl-error-message').style.display = 'block';
  console.error('WebGL is not available.');
}
