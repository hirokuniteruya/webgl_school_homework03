import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import sunImg from "./img/sun.jpg";
import moonImg from "./img/moon.jpg";
import earthImg from "./img/earth.jpg";

window.addEventListener("DOMContentLoaded", main);

// 汎用変数
let run = true;
let startTime = 0;

// three.js に関連するオブジェクト用の変数
let scene;
let camera;
let renderer;
let renderer_b;
let geometry;
let controls;
let axesHelper;
let directionalLight;
let ambientLight;
let satelliteCamera;
let renderTarget;
let satelliteCameraScreen;

// 太陽、地球、月 それぞれの メッシュ、マテリアル、テクスチャ
let sun;
let sunMaterial;
let sunTexture;
let earth;
let earthMaterial;
let earthTexture;
let moon;
let moonMaterial;
let moonTexture;

// 月の移動量に対するスケール
const EARTH_RANGE = 4.75;

// カメラに関するパラメータ
const CAMERA_PARAM = {
  fovy: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 30.0,
  x: 0.0,
  y: 1.0,
  z: 10.0,
  lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
};
// レンダラに関するパラメータ
const RENDERER_PARAM = {
  clearColor: 0x000000,
  width: window.innerWidth,
  height: window.innerHeight,
};
// renderer_bに関するパラメータ
const RENDERER_B_PARAM = {
  clearColor: 0x000000,
  width: 300,
  height: 300,
};
// マテリアルのパラメータ
const MATERIAL_PARAM = {
  color: 0xffffff,
};
// ライトに関するパラメータ
const DIRECTIONAL_LIGHT_PARAM = {
  color: 0xffffff,
  intensity: 1.0,
  x: 1.0,
  y: 1.0,
  z: 1.0,
};
// アンビエントライトに関するパラメータ
const AMBIENT_LIGHT_PARAM = {
  color: 0xffffff,
  intensity: 0.2,
};

/**
 * イベントリスナの設定とテクスチャ画像の読込を行う。
 * また、テクスチャ読込完了後に init 関数の呼出しを行う。
 */
function main() {
  // esc キーによるアニメーション一時停止と再開
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      run = !run;
      if (run === true) animate();
    }
  });
  // リサイズイベント
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  const loader = new THREE.TextureLoader();
  sunTexture = loader.load(sunImg, () => {
    earthTexture = loader.load(earthImg, () => {
      moonTexture = loader.load(moonImg, init);
    });
  });
}

/**
 * ThreeJS　　の各オブジェクトの生成と animate 関数の呼出しを行う。
 */
function init() {
  // シーングラフ
  scene = new THREE.Scene();

  // レンダラ
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
  renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);
  const wrapper = document.querySelector("#WebGL-output");
  wrapper.appendChild(renderer.domElement);

  // カメラ
  camera = new THREE.PerspectiveCamera(
    CAMERA_PARAM.fovy,
    CAMERA_PARAM.aspect,
    CAMERA_PARAM.near,
    CAMERA_PARAM.far
  );
  camera.position.set(CAMERA_PARAM.x, CAMERA_PARAM.y, CAMERA_PARAM.z);
  camera.lookAt(CAMERA_PARAM.lookAt);

  // スフィアジオメトリの作成
  geometry = new THREE.SphereBufferGeometry(1.0, 64, 64);

  // マテリアルの生成とテクスチャの設定
  sunMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
  sunMaterial.map = sunTexture;
  earthMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
  earthMaterial.map = earthTexture;
  moonMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
  moonMaterial.map = moonTexture;

  // メッシュの生成とシーンへの追加
  sun = new THREE.Mesh(geometry, sunMaterial);
  earth = new THREE.Mesh(geometry, earthMaterial);
  moon = new THREE.Mesh(geometry, moonMaterial);
  scene.add(sun);
  scene.add(earth);
  scene.add(moon);

  // 建物（ bldg: building ）
  const bldgGeometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
  const bldg_a = new THREE.Mesh(
    bldgGeometry,
    new THREE.MeshLambertMaterial({ color: "green" })
  );
  const bldg_b = new THREE.Mesh(
    bldgGeometry,
    new THREE.MeshLambertMaterial({ color: "pink" })
  );
  bldg_a.position.set(1.1, 0.0, 0.0);
  bldg_b.position.set(0.0, 1.1, 0.0);
  earth.add(bldg_a);
  earth.add(bldg_b);

  // 衛星の軌道
  const ringGeometry = new THREE.RingBufferGeometry(
    EARTH_RANGE - 0.01,
    EARTH_RANGE + 0.01,
    256,
    1
  );
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeometry,ringMaterial);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  const ring_b = ring.clone();
  ring_b.scale.multiplyScalar(0.8);
  scene.add(ring_b);

  const ring_c = ring.clone();
  ring_c.scale.multiplyScalar(0.6);
  scene.add(ring_c);

  // 地球のサイズと初期位置の設置
  earth.scale.setScalar(0.36);
  earth.position.set(2.75, 0.0, 0.0);

  // 月のサイズと初期位置の設定
  moon.scale.setScalar(0.18);
  moon.position.copy(earth.position);
  moon.position.add(new THREE.Vector3(0.0, 1.0, 0.0));

  // 衛星カメラ
  satelliteCamera = new THREE.PerspectiveCamera(
    70, // fov
    1, // aspect
    CAMERA_PARAM.near,
    CAMERA_PARAM.far
  );
  satelliteCamera.position.set(moon.position);
  satelliteCamera.position.add(new THREE.Vector3(0.0, 1.0, 0.0));

  // 衛星カメラで撮影したシーンを描画するためのレンダラ
  renderer_b = new THREE.WebGLRenderer();
  renderer_b.setClearColor(new THREE.Color(RENDERER_B_PARAM.clearColor));
  renderer_b.setSize(RENDERER_B_PARAM.width, RENDERER_B_PARAM.height);
  const wrapper_b = document.querySelector("#satelliteDisplay");
  wrapper_b.appendChild(renderer_b.domElement);

  // ディレクショナルライト
  directionalLight = new THREE.DirectionalLight(
    DIRECTIONAL_LIGHT_PARAM.color,
    DIRECTIONAL_LIGHT_PARAM.intensity
  );
  directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
  directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
  directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
  scene.add(directionalLight);

  // アンビエントライト
  ambientLight = new THREE.AmbientLight(
    AMBIENT_LIGHT_PARAM.color,
    AMBIENT_LIGHT_PARAM.intensity
  );
  scene.add(ambientLight);

  // 軸ヘルパー
  axesHelper = new THREE.AxesHelper(5.0);
  // scene.add(axesHelper);

  // コントロール
  controls = new OrbitControls(camera, renderer.domElement);

  // レンダリング開始時のタイムスタンプを取得
  startTime = Date.now();

  run = true;
  animate();
}

function animate() {
  if (run === true) requestAnimationFrame(animate);

  // 例に倣ってとりあえず回しておく…
  sun.rotation.y += 0.005;
  earth.rotation.y += 0.04;
  moon.rotation.y += 0.03;

  // nowTime と sin, cos の算出
  const nowTime = (Date.now() - startTime) / 1000;
  const sin = Math.sin(nowTime);
  const cos = Math.cos(nowTime);

  // 地球の位置の更新
  earth.position.set(cos * EARTH_RANGE, 0.0, -sin * EARTH_RANGE);

  let unitVector = new THREE.Vector3(1.0, -0.8, 0.0).normalize();
  let unitVectorZ = new THREE.Vector3(0.0, 0.0, -1.0); // z軸の負方向の単位ベクトル

  const tangent = new THREE.Vector3()
    .crossVectors(unitVector, unitVectorZ)
    .normalize();
  const angle = (Math.PI * nowTime) / 2;

  unitVector.applyAxisAngle(tangent, angle);

  // 月の位置の更新
  moon.position.copy(earth.position);
  moon.position.add(unitVector);

  // 衛星カメラの位置の更新
  // satelliteCamera.position.copy(earth.position);
  // satelliteCamera.position.add(new THREE.Vector3(0.0, 0.0, 1.0));
  satelliteCamera.position.copy(moon.position);
  satelliteCamera.lookAt(earth.position);

  // レンダリング
  renderer.render(scene, camera);
  renderer_b.render(scene, satelliteCamera);
}
