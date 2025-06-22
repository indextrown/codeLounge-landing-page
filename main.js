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

  function updateModelScale() {
    if (!loadedModel) return;

    const scaleFactor = window.innerWidth <= 768 ? 3.8 : 5;
    const scale = scaleFactor / modelMaxDim;
    loadedModel.scale.set(scale, scale, scale);
  }

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
  
  resizeCanvas();

  // 조명
  const ambient = new THREE.AmbientLight(0xffffff, 1.0); // 조명 강화
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 1.5); // 조명 강화
  directional.position.set(5, 10, 7);
  scene.add(directional);

  // OrbitControls 추가
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;

  // 아이폰 목업 생성
  function createIPhoneMockup() {
    const group = new THREE.Group();
    
    // 메인 바디 (검은색)
    const bodyGeometry = new THREE.BoxGeometry(2, 4, 0.2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // 화면 (검은색)
    const screenGeometry = new THREE.BoxGeometry(1.8, 3.6, 0.05);
    const screenMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.z = 0.125;
    group.add(screen);
    
    // 앱 UI 배경
    const appBgGeometry = new THREE.PlaneGeometry(1.6, 3.2);
    const appBgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.9
    });
    const appBg = new THREE.Mesh(appBgGeometry, appBgMaterial);
    appBg.position.z = 0.15;
    group.add(appBg);
    
    // 앱 아이콘들
    const iconColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFEAA7, 0xDDA0DD];
    for (let i = 0; i < 6; i++) {
      const iconGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.02);
      const iconMaterial = new THREE.MeshPhongMaterial({ color: iconColors[i] });
      const icon = new THREE.Mesh(iconGeometry, iconMaterial);
      icon.position.set(
        (i % 3 - 1) * 0.4,
        1 - Math.floor(i / 3) * 0.4,
        0.16
      );
      group.add(icon);
    }
    
    // 상단 노치
    const notchGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.05);
    const notchMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const notch = new THREE.Mesh(notchGeometry, notchMaterial);
    notch.position.set(0, 1.8, 0.125);
    group.add(notch);
    
    // 하단 홈 인디케이터
    const homeGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
    const homeMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const home = new THREE.Mesh(homeGeometry, homeMaterial);
    home.position.set(0, -1.9, 0.125);
    group.add(home);
    
    // 카메라 렌즈
    const cameraGeometry = new THREE.CircleGeometry(0.15, 32);
    const cameraMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
    camera.position.set(0.6, 1.5, 0.125);
    camera.rotation.x = -Math.PI / 2;
    group.add(camera);
    
    // 카메라 플래시
    const flashGeometry = new THREE.CircleGeometry(0.08, 32);
    const flashMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.set(-0.6, 1.5, 0.125);
    flash.rotation.x = -Math.PI / 2;
    group.add(flash);
    
    // 볼륨 버튼
    const volumeGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
    const volumeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const volume = new THREE.Mesh(volumeGeometry, volumeMaterial);
    volume.position.set(-1.025, 0.5, 0);
    group.add(volume);
    
    // 사이드 버튼
    const sideGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
    const sideMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const side = new THREE.Mesh(sideGeometry, sideMaterial);
    side.position.set(-1.025, -0.8, 0);
    group.add(side);
    
    return group;
  }

  // 모델 생성 및 추가
  console.log('Three.js 초기화 시작...');

  const loader = new GLTFLoader();
  loader.load(
    'model/apple_iphone_15_pro_max_black.glb',
    function (gltf) {
      loadedModel = gltf.scene;
      
      // --- Final Texture Application Logic ---
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        'model/codeLounge.png',
        (texture) => {
          texture.flipY = true;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 텍스처 선명도 향상

          console.log("Applying final texture to screen material 'pIJKfZsazmcpEiU'");
          
          let screenApplied = false;
          loadedModel.traverse((node) => {
            if (node.isMesh && node.material.name === 'pIJKfZsazmcpEiU') {
              // Clone the material to ensure we don't affect other parts of the model
              const newMaterial = node.material.clone();
              
              newMaterial.map = texture;
              newMaterial.emissive = new THREE.Color(0xffffff);
              newMaterial.emissiveMap = texture;
              newMaterial.emissiveIntensity = 0.9;
              newMaterial.color.set(0x000000); // Set base color to black to avoid tinting
              
              node.material = newMaterial;
              screenApplied = true;
            }
          });

          if (!screenApplied) {
            console.error("Critical error: Could not re-apply texture to 'pIJKfZsazmcpEiU'.");
          }
        },
        undefined,
        (error) => {
          console.error('An error happened while loading the texture:', error);
        }
      );
      // --- End of Final Logic ---
      
      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      loadedModel.position.sub(center);
      
      modelMaxDim = Math.max(size.x, size.y, size.z);
      updateModelScale(); // Set initial scale based on window size
      
      loadedModel.rotation.y = Math.PI;

      scene.add(loadedModel);
      console.log('GLB 모델이 성공적으로 로드되었습니다.');
    },
    undefined,
    function (error) {
      console.error('GLB 모델 로드 실패:', error);
      console.log('대체 목업을 생성합니다.');
      const fallbackMockup = createIPhoneMockup();
      scene.add(fallbackMockup);
    }
  );

  // 애니메이션 함수
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // 애니메이션 시작
  animate();

  // 윈도우 리사이즈 이벤트
  window.addEventListener('resize', resizeCanvas);

  console.log('Three.js 초기화 완료');

} else {
  // WebGL을 사용할 수 없을 때 에러 메시지 표시
  document.getElementById('mockup-canvas').style.display = 'none';
  document.getElementById('webgl-error-message').style.display = 'block';
  console.error('WebGL is not available.');
} 