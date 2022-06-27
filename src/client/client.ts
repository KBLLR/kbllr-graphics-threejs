console.clear()
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { WebGLRenderer } from 'three'
import {
  EffectComposer,
  EffectPass,
  SMAAEffect,
  NoiseEffect,
  RenderPass,
  sRGBEncoding,
  VSMShadowMap,
  BloomEffect,
  VignetteEffect,
  blendFunction,
  OverrideMaterialManager
} from '../../node_modules/postprocessing/build/postprocessing.esm.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { ButtonProps, TabParams } from '@tweakpane/core'
import { FolderParams } from 'tweakpane'
import { PaneConfig } from 'tweakpane/dist/types/pane/pane-config'


//==========================
// Post-processing
OverrideMaterialManager.workaroundEnabled = false;


const OPTIONS = {
  fadeFactor: 0.1,
  scaleX: 0,
  scaleY: 0,
  rotationAngle: 0
}

let orthoCamera
{
  const left = -innerWidth / 2
  const right = innerWidth / 2
  const top = -innerHeight / 2
  const bottom = innerHeight / 2
  const near = -100
  const far = 100

  orthoCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far)
  orthoCamera.position.z = -10
  orthoCamera.lookAt(new THREE.Vector3(0, 0, 0))
}

const fullscreenQuadGeometry = new THREE.PlaneGeometry(innerWidth, innerHeight)

const uvMatrix = new THREE.Matrix3()
 // tx : Float, ty : Float, sx : Float, sy : Float, rotation : Float, cx : Float, cy : Float

const fadeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    fadeFactor: { value: OPTIONS.fadeFactor },
    uvMatrix: { value: uvMatrix }
  },
  vertexShader: `
    uniform mat3 uvMatrix;
    varying vec2 vUv;
    void main () {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = (uvMatrix * vec3(uv, 1.0)).xy;
    }
  `,
  fragmentShader: `
    uniform sampler2D inputTexture;
    uniform float fadeFactor;
    varying vec2 vUv;
    void main () {
      float dist = distance(vUv, vec2(0.5));
      vec4 texColor = texture2D(inputTexture, vUv);
      vec4 fadeColor = vec4(0.0, 0.0, 0.0, 1.0);
      gl_FragColor = mix(texColor, fadeColor, fadeFactor);
    }
  `
})
const fadePlane = new THREE.Mesh(
  fullscreenQuadGeometry,
  fadeMaterial
)

const resultMaterial = new THREE.MeshBasicMaterial({ map: null })
const resultPlane = new THREE.Mesh(
  fullscreenQuadGeometry,
  resultMaterial
)

////////////////////////////////////////////////////////////////////
// ✧ SCREENSHOT FUNCTION 📸
///////////////


//==========================


////////////////////////////////////////////////////////////////////
// ✧ GENERATIVE Data Texture
///////////////

const Template = "https://unsplash.com/photos/QwoNAhbmLLo"

let arrayTop = [
"lines", 
"butterfly", 
"iris",
"raven",
"crow",
"geometry",
"sun",
"shimmer", 
"bubbles",
"planets", 
"New York",  
"feather", 
"neon",
"clouds", "smoke",
]

let topic = arrayTop[Math.floor(Math.random() * arrayTop.length)]

const g_texture = (topic, repeat: 4) => {
  const path = `https://source.unsplash.com/random/?${topic}`;
  const preload = new THREE.TextureLoader().load(
    path ? path : Template,
    (e) => {
      e.mapping = THREE.EquirectangularRefractionMapping;
      e.anisotropy = renderer.capabilities.getMaxAnisotropy();
      e.magFilter = THREE.NearestFilter;
      e.minFilter = THREE.LinearMipmapLinearFilter;
      e.wrapS = e.wrapT = THREE.MirroredRepeatWrapping;
      e.type = THREE.HalfFloatType;
      e.format = THREE.RGBAFormat;
      e.repeat.set(repeat, repeat);
      e.dispose();
    }
  );
  console.log(preload)
  return preload;
};


////////////////////
// ✧ RANDOMIZERS///
//////////////////

// const randomSeed = () => {
// // Log the seed for later reproduc
// console.log('Seed:', Random.getSeed());
// };

//--Random Color Generator
var rRGB = () => Math.random() * 256 >> 0
var randRGB = `rgb(${rRGB()}, ${rRGB()}, ${rRGB()})`
console.log(randRGB)

//--Random PARAM between 0.1 and 1.0
var rParam = () => Math.random() * 1.0 >> 0.1
var randPARAM = `rParam()`
console.log(randPARAM)

/////  ////////////  /////////  /////
// ✧ COLOR + MATERIAL PROPERTY PARAMS /// 
///  /////  /////  /////   ///////////

const background = new THREE.Color(0xffffff)
const clearBgCol = new THREE.Color(0xf5f5f5) 
const lightCol = new THREE.Color(0xffffff)

const spLightCol = new THREE.Color(0xffffff)

const hLightCol1 = new THREE.Color(0xffffff)
const hLightCol2 = new THREE.Color(0x000000)

const pLightCol = new THREE.Color(0xffffff)

const mat_1_color = new THREE.Color(0x708090)
const mat_1_emissive = new THREE.Color(0x000000)
const attCol_Mat1 = new THREE.Color(0xF5F5F5)
const shnColor_Mat1 = new THREE.Color(0xffffff)

const shnColor_Mat2 = new THREE.Color(0xD8BFD8)
const specColor_Mat2 = new THREE.Color(0xF5F5F5)


//=====================================================
//--Most Classes share properties with Object 3D
//--A Layers object assigns an Object3D to 1 or more of 32 layers numbered 0 to 31
//--internally the layers are stored as a bit mask
//--by default all Object3Ds are a member of layer 0.


const PARAMS = {
	userS: {
		overlay: true, //<div>Tv Lines</div>
		gui: {

		},
	},
	rndr: {
		bgCol: clearBgCol.convertLinearToSRGB(), 
	},
  cam: {
  	vfov: 59,
  },
  scene: {
    background: background.convertLinearToSRGB(),
  },
  grid: {
    size: 40,
    divisions: 40,
    toggle: true,
  },
  light: {
  	dirLight: {
  		color: lightCol.convertLinearToSRGB(),
  		intensity: 0.0,
  	  castShadow: true,
  	  pX: 0, pY: 10, pZ: 0,
  	  target: {x: 0, y: 0, z: 0}, 
  	},
  	pLight: {
  		color: pLightCol.convertLinearToSRGB(),
  		intensity: 0.0,
  	},
  	hLight: {
  		col1: hLightCol1.convertLinearToSRGB(),
  		col2: hLightCol2.convertLinearToSRGB(),
  		intensity: 0,
  		pX: 0, pY: 0, pZ: 0,
  	},
  	spotLight: {
  		col: spLightCol.convertLinearToSRGB(),
  		intensity: 10,
  		castShadow: true,
  	},
  },
  geo:{
  	sphere: {
  		radius: 4,
  		widthS: 115,
  		heightS:115,
  		phiS: 0,
  		phiL: Math.PI * 2,
  		thetaS: 10,
  		thetaL: Math.PI * 2,
  		rSh: true,
  	},
  	plane: {
  		w: 100,
  		h: 100,
  		wS:100,
  		hS:100,
  		rSh: false,
  	},
  	torus: {//look for Parametric equation for a 3D torus
  	  radius: 1,
  	  tube: 0.1,
  	  tubularSegments: 200,
  	  radialSegments: 30,
  	  arc: 6.283,
  	  rSh: true,
  	},
  	torusK: {
  	  radius: 1,
  	  tube: 0.1,
  	  tubularSegments: 300,
  	  radialSegments: 20,
  	  p: 1,
  	  q: 3,
  	  rSh: true,
  	},
  },
  material: {
  	mat_1: {
  	  color: mat_1_color.convertLinearToSRGB(),
  	  metal: 0.4,
  	  attColor: attCol_Mat1.convertLinearToSRGB(),
  	  attDist: 2.0,
  	  rough: 0.05,
  	  alpha: 1.0,
  	  transm: 1.0, 
  	  shn: 0.5,
  	  shnColor: shnColor_Mat1.convertLinearToSRGB(),
  	  shnColorMap: g_texture(topic, 4),
  	  shnR: 0.5,
  	  ior: 1.4, //--X
  	  thick: 12.0, //
  	  reflect: 0.4, //--no effect when metalness is 1.0
  	  clearcoat: 0.4, //
  	  coatrough: 0.8, //.15
  	  envInt: 10.0,
  	  emissive: mat_1_emissive.convertLinearToSRGB(),
  	  emissiveIntensity: 2.45,
  	  displ: 0.1,
  	  displBias: 1.0,
  	  ao: 1.0,
  	  normal: 0.01,
  	  dither: true,
  	  transparent: false,
  	  combine: THREE.AddOperation,
  	},
  	mat_2: {
  	  sheen: 0.7,
  	  sheenRoughness: 0.3,
  	  sheenColor: shnColor_Mat2.convertLinearToSRGB(),
  	  envMapIntensity: 6,
  	  reflectivity: 0.5,
  	  specularColor: specColor_Mat2.convertLinearToSRGB(),
  	  specularIntensity: 0.2,
  	  displacementBias: 2,
  	  displacementScale: 0.1,
  	  ior: 1.2,
  	  transmission: 1.0,
  	  clearcoat: 0.5,
  	  clearcoatRoughness: 0.8,
  	  // Volume
  	  thickness: 1.5,
  	  thicknessMap: g_texture("neon", 4), // stores on the G channel
  	  dither: true,
  	  transparent: true,
  	  combine: THREE.AddOperation,
  	},
  	mat_3: {
  		opacity: 0.2,
  	}
  }, 
}

////////////////////////////////////
// ✧ CANVAS ✧ SCENES ✧ CONSTANTS///
//////////////////////////////////

const canvas = document.querySelector("canvas");

const scene = new THREE.Scene()

const sizes = { width: window.innerWidth, height: window.innerHeight }

const canvas_width = sizes.width
const canvas_height = sizes.height

const aspect = sizes.width / sizes.height

scene.background = PARAMS.scene.background

////////////////
// ✧ CAMERA  //
///////////////

const camera = new THREE.PerspectiveCamera(59, aspect, 0.01, 20000)
camera.position.x = -10
camera.position.y = 0
camera.position.z = 0
camera.lookAt(new THREE.Vector3(0, 0, 0))

///////////////////////
// ✧ RESPONSIVENESS //
//////////////////////

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

///   /////  ////// //
// ✧ RENDERER  /// //
///// ///   ///  //// 

let framebuffer1 = new THREE.WebGLRenderTarget(innerWidth, innerHeight)
let framebuffer2 = new THREE.WebGLRenderTarget(innerWidth, innerHeight)

const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: true,
});

renderer.setClearColor(0x111111)
// renderer.setRenderTarget(framebuffer1)
// renderer.clearColor()
// renderer.setRenderTarget(framebuffer2)
// renderer.clearColor()

renderer.setSize(sizes.width, sizes.height)
// renderer.setClearColor(PARAMS.rndr.bgCol)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
// renderer.xr.enabled = true
renderer.outputEncoding = sRGBEncoding
// renderer.shadowMap.type = THREE.VSMShadowMap
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2

 document.body.appendChild(renderer.domElement)

/////////////////
// ✧ CONTROLS ///
///////////////

const controls = new OrbitControls(camera, renderer.domElement)

controls.target.set(0, 0, 0)
controls.enabled = true
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.autoRotate = false
controls.enableZoom = true
controls.autoRotateSpeed = 1.2
controls.minDistance = 0.1
controls.maxDistance = 55
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1

/////////////////
// ✧ LIGHTS ////
///////////////

const hLight = new THREE.HemisphereLight(PARAMS.light.hLight.col1, PARAMS.light.hLight.col2, PARAMS.light.hLight.intensity)
// scene.add(hLight)


const pLight0 = new THREE.PointLight(PARAMS.light.pLight.color, PARAMS.light.pLight.intensity)
pLight0.castShadow = false
pLight0.shadow.mapSize.width = 1500
pLight0.shadow.mapSize.height = 1500
pLight0.position.set(7, 7, 12)

const spotLight = new THREE.SpotLight( 0x00ff00, 28.5 );
// spotLight.position.set( 0, 10, 0 );
// spotLight.angle = Math.PI /2;
// spotLight.castShadow = true;
// spotLight.penumbra = 0.3
// spotLight.decay = 0.4
// spotLight.distance = 20
// spotLight.shadow.camera.near = 0.1;
// spotLight.shadow.camera.far = 10000;
// spotLight.shadow.bias = 0.001;
// spotLight.shadow.blurSamples = 240
// spotLight.shadow.mapSize.width = 1024;
// spotLight.shadow.mapSize.height = 1024;
// scene.add(spotLight)

const dirLight = new THREE.DirectionalLight(PARAMS.light.dirLight.color, PARAMS.light.dirLight.intensity)
dirLight.position.x = 0
dirLight.position.y = 20
dirLight.position.z = 0
dirLight.castShadow = true
dirLight.shadow.mapSize.width = 1024 // default
dirLight.shadow.mapSize.height = 1024 // default
dirLight.shadow.camera.near = 0.1 // default
dirLight.shadow.camera.far = 10000 // default
scene.add(dirLight)


// const dirHelper = new THREE.DirectionalLightHelper( dirLight, 5 )
// scene.add( dirHelper )

// let splightHelp = new THREE.SpotLightHelper(spotLight)
// scene.add(spotLight)

// const helper = new THREE.CameraHelper( dirLight.shadow.camera );
// scene.add( helper );


////////////////////////////
// ✧ MeshPhysicalMaterial//
//////////////////////////

//=== MATERIAL #1

const mat_1A = new THREE.MeshPhysicalMaterial({
  map: g_texture(topic, 4),
  attenuationDistance: 2.0,

  // emissive: 0xF0E68C,
  emissiveMap: g_texture(topic, 4),
  emissiveIntensity: 1.0,

  aoMap: g_texture(topic, 4),
  aoMapIntensity: 1.0,

  envMap: g_texture("neon", 4),
  envMapIntensity: 6,

  reflectivity: 1.2,

  normalMap: g_texture(topic, 4),
  normalScale: new THREE.Vector2(4, 4),

  metalness: 0.05,
  metalnessMap: g_texture(topic, 4),

  roughness: 0.2,
  roughnessMap: g_texture(topic, 4),

  sheen: 1.0,
  sheenRoughness: 0.5,

  ior: 1.5,
  opacity: 1.0,

  clearcoat: 0.8,
  clearcoatRoughness: 0.5,
  clearcoatRoughnessMap: g_texture(topic, 4),
  clearcoatNormalMap: g_texture(topic, 4),
  clearcoatNormalScale: new THREE.Vector2(0.2, 0.2),

  displacementMap: g_texture(topic, 4),
  displacementScale: 0.3,
  displacementBias: 1.3,

  flatShading: false,
  side: THREE.FrontSide,
  precision: "highp",
});

mat_1A.sheenRoughnessMap = g_texture(topic, 4)
mat_1A.sheenColorMap = g_texture(topic, 4)

//===========================================================+

//=== MATERIAL #1B

const mat_2A = new THREE.MeshPhysicalMaterial({
  envMap: g_texture("neon", 4),
  map: g_texture("neon", 4),
  normalMap: g_texture("neon", 4),
  normalScale: new THREE.Vector2(1, 1),
  //--
  clearcoatMap: g_texture("neon", 4),
  clearcoatNormalMap: g_texture("neon", 4),
  clearcoatNormalScale: new THREE.Vector2(3, 3),
  // Refraction
  transmissionMap: g_texture("neon", 4),
  specularIntensityMap: g_texture("neon", 4),
  specularColorMap: g_texture("neon", 4),
  // Vertex
  displacementMap: g_texture("neon", 4),
  // Rendering
  side: THREE.DoubleSide,
  precision: "highp",
  flatShading: false,
});
mat_2A.sheenRoughnessMap = g_texture(topic, 4)
mat_2A.sheenColorMap = g_texture(topic, 4)

//===========================================================+

//=== MATERIAL #3
const lineBasicMat = new THREE.LineBasicMaterial( { color: 0xff0000 } );
let lineColorConvert = lineBasicMat.color.convertLinearToSRGB()

//=== MATERIAL #4
const shadowMat = new THREE.ShadowMaterial()
shadowMat.opacity = 0.1
shadowMat.color.set(0xF5F5F5)

//=== MATERIAL #5
const matFloor = new THREE.MeshPhongMaterial();
matFloor.color.set(0xffffff)

///////////////////////////////////////////
// EDGES - LINES - GEOMETRIES - MESH ////
///////////////////////////////////////

//--- EDGES
// const plEdges = new THREE.EdgesGeometry( geoFloor );
// const plLine = new THREE.LineSegments( plEdges, new THREE.LineBasicMaterial( { color: 0x0f0000 } ) );
// scene.add( plLine );

//--

//--- PLANE
const geoFloor = new THREE.PlaneGeometry( 2000, 2000 );
const planeMesh = new THREE.Mesh( geoFloor, shadowMat );
planeMesh.rotation.x = - Math.PI * 0.5;
planeMesh.receiveShadow = true;
planeMesh.position.set( 0, -5, 0)
scene.add(planeMesh)


//--- SPHERE
const sphereGeometry = new THREE.SphereGeometry()
const sphere = new THREE.Mesh(sphereGeometry, mat_1A)
sphere.receiveShadow = true
sphere.castShadow = true
scene.add(sphere)


//--- TORUS
const torusG = new THREE.TorusGeometry()
const torusMesh = new THREE.Mesh(torusG, mat_2A)
torusMesh.rotation.z = (90 * Math.PI) / 180
torusMesh.castShadow = true;
torusMesh.name = "TORUS#0";
torusMesh.receiveShadow = true
scene.add(torusMesh)


//--- TORUS_KNOT
const torusKGeo = new THREE.TorusKnotGeometry()
const torusKnot = new THREE.Mesh(torusKGeo, mat_2A)
torusKnot.receiveShadow = false
scene.add(torusKnot)


//✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧
//✧✧ GUI > TWEAKPANE - MENU
//✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧✧

//PARENT -> MENU




//===========USER PANES 
//--Time Pane
// const paneTime = new Pane({title: "CountDown ", container: document.getElementById('c--Count'), expanded: true })
// paneTime.addMonitor(20000000, 'time', { interval: 1000,})

//===========SCENE PANES

const paneScene = new Pane({ title: "Scene", container: document.getElementById('c--Scene'), expanded: false })

//--Background Tab
const bgTab = paneScene.addTab({
  pages: [
    { title: 'scene' },
    { title: 'Renderer'},
  ],
})
bgTab.pages[0].addInput(PARAMS.scene, "background", { view: 'color', color: { alpha: true }, label: "scene.background" })
bgTab.pages[1].addInput(PARAMS.rndr, "bgCol", { view: 'color', color: { alpha: true }, label: "renderer.setClearColor" })

//===========CAMERAS TAB
const camerasTab = paneScene.addTab({ 
	pages: [
	{ title: 'Perspective Camera' } 
	],
})
//--
camerasTab.pages[0].addInput(PARAMS.cam, "vfov")

//===========LIGHTS TAB
const lightsTab = paneScene.addTab({
  pages: [
    { title: 'Directional Light' },
    { title: 'Hemisphere  Light' },
    { title: 'Point Light' },
    { title: 'Spot Light' },
  ],
})
//--Directional Light
lightsTab.pages[0].addInput(PARAMS.light.dirLight, "castShadow", { options: { Yes:'toggle', No:'toggle'}})
lightsTab.pages[0].addInput(PARAMS.light.dirLight, "intensity", { min: 0.0, max: 20.0, label: ".intensity" })
lightsTab.pages[0].addInput(PARAMS.light.dirLight, "color", { view: 'color', color: { alpha: true }, label: ".color" })
lightsTab.pages[0].addInput(PARAMS.light.dirLight, "target")
//--Hemisphere Light
lightsTab.pages[1].addInput(PARAMS.light.hLight, "intensity", { min: 0.0, max: 20.0, label: ".intensity" })
lightsTab.pages[1].addInput(PARAMS.light.hLight, "col1", { view: 'col1', color: { type: 'float', alpha: true }, label: ".skyColor" })
lightsTab.pages[1].addInput(PARAMS.light.hLight, "col1", { view: 'col2', color: { type: 'float', alpha: true }, label: ".groundColor" })
//--Point Light
lightsTab.pages[2].addInput(PARAMS.light.pLight, "intensity", { min: 0.0, max: 30.0, label: ".intensity" })
lightsTab.pages[2].addInput(PARAMS.light.pLight, "color", { view: 'color', color: { type: 'float', alpha: true }, label: ".color" })
//--Spot Light
lightsTab.pages[3].addInput(PARAMS.light.spotLight, "castShadow", { options: { yes:'toggle', no:'toggle'}})
lightsTab.pages[3].addInput(PARAMS.light.spotLight, "intensity", { min: 0.0, max: 30.0, label: ".intensity" })
lightsTab.pages[3].addInput(PARAMS.light.spotLight, "col", { view: 'color', color: { type: 'float', alpha: true }, label: ".color" })
paneScene.addSeparator() //=======================


//===========PANE HELPERS
const paneHelpers = new Pane({ title: "Helpers", container: document.getElementById('c--Helpers'), expanded: false })

// NOT VALID for PANE but LOOK DOCS for correct method. Expanded doesnt cover the use case .
// if (window.innerWidth < 600) paneHelpers.close();

const gridF = paneHelpers.addFolder({ title: "Grid", expanded: false })
gridF.addInput(PARAMS.grid, "divisions", { min: 20, max: 500, label: ".divisions" })
gridF.addInput(PARAMS.grid, "size", { min: 40, max: 150, step: 1, label: ".size" })

paneHelpers.addSeparator(); //==========================

//===========PANE MESHES //===========================

//===========PANE GEOMETRIES
const paneGeometries = new Pane({ title: "Buffer Geometries", container: document.getElementById('c--Geometries'), expanded: false })

const sphereG_F = paneGeometries.addFolder({ title: "Sphere", expanded: false })
sphereG_F.addInput(PARAMS.geo.sphere, "radius", { step: 1, min: 1, max: 9, label: ".radius" })
sphereG_F.addInput(PARAMS.geo.sphere, "widthS", { step: 1, min: 1, max: 180, label: ".widthSegments" })
sphereG_F.addInput(PARAMS.geo.sphere, "heightS",{ step: 1,min: 1, max: 180, label: ".heightSegments" })
sphereG_F.addInput(PARAMS.geo.sphere, "rSh", { options: { Yes:'toggle', No:'toggle'}})
// sphereG_F.addInput(PARAMS.geo.sphere, "phiS", { min: 0.0, max: 5.0, label: ".phiStart" })
// sphereG_F.addInput(PARAMS.geo.sphere, "phiL", { min: 0.0, max: 5.0, label: ".phiLength" })
// sphereG_F.addInput(PARAMS.geo.sphere, "thetaS", { min: 0.0, max: 5.0, label: ".thetaStart" })
// sphereG_F.addInput(PARAMS.geo.sphere, "thetaL", { min: 0.0, max: 5.0, label: ".thetaLength" })

paneGeometries.addSeparator(); //===========================

const torusG_F = paneGeometries.addFolder({ title: "Torus", expanded: false })
torusG_F.addInput(PARAMS.geo.torus, "radius", { step: 1, min: 1, max: 9, label: ".radius" })
torusG_F.addInput(PARAMS.geo.torus, "tube", { step: 0.1, min: 0.1, max: 18, label: ".tube" })
torusG_F.addInput(PARAMS.geo.torus, "tubularSegments", { step: 10, min: 100, max: 200, label: ".tubularSegments" })
torusG_F.addInput(PARAMS.geo.torus, "arc", { step: 0.100, min: 6.0, max: 54.0, label: ".arc" })
torusG_F.addInput(PARAMS.geo.torus, "rSh", { options: { Yes:'toggle', No:'toggle'}})

paneGeometries.addSeparator(); //===========================

const torusKnotG_F = paneGeometries.addFolder({ title: "Torus Knot", expanded: false })
torusKnotG_F.addInput(PARAMS.geo.torusK, "radius", { step: 1, min: 1, max: 9, label: ".radius" })
torusKnotG_F.addInput(PARAMS.geo.torusK, "tube", { step: 0.1, min: 1, max: 9, label: ".radius" })
torusKnotG_F.addInput(PARAMS.geo.torusK, "tubularSegments", { step: 1, min: 1, max: 9, label: ".tubularSegments" })
torusKnotG_F.addInput(PARAMS.geo.torusK, "radialSegments", { step: 1, min: 1, max: 9, label: ".radialSegments" })
torusKnotG_F.addInput(PARAMS.geo.torusK, "p", { step: 1, min: 1, max: 9, label: ".phiL" })
torusKnotG_F.addInput(PARAMS.geo.torusK, "q", { step: 1, min: 1, max: 9, label: ".phiS" })
torusKnotG_F.addInput(PARAMS.geo.torusK, "rSh", { options: { Yes:'toggle', No:'toggle'}})

paneGeometries.addSeparator(); //===========================

const planeG_F = paneGeometries.addFolder({ title: "PlaneGeometry", expanded: false })
planeG_F.addInput(PARAMS.geo.plane, "w", { step: 1, min: 1, max: 60, label: ".radius" })
planeG_F.addInput(PARAMS.geo.plane, "h", { step: 1, min: 1, max: 60, label: ".radius" })
planeG_F.addInput(PARAMS.geo.plane, "wS",{ step: 1, min: 1, max: 60, label: ".radius" })
planeG_F.addInput(PARAMS.geo.plane, "hS",{ step: 1, min: 1, max: 60, label: ".rplane" })
planeG_F.addInput(PARAMS.geo.plane, "rSh",{ options: { Yes:'toggle', No:'toggle'}})
paneGeometries.addSeparator(); //===========================

//===========PANE PARAMS
const panePARAMS = new Pane({ title: "MATERIALS Parameters ", container: document.getElementById('c--PARAMS'), expanded: false })

const paramsMat_1F = panePARAMS.addFolder({ title: "Mat_1-PARAMS", expanded: false })
paramsMat_1F.addInput(PARAMS.material.mat_1, "color")
paramsMat_1F.addInput(PARAMS.material.mat_1, "emissive")
paramsMat_1F.addInput(PARAMS.material.mat_1, "emissiveIntensity", { min: 1.0, max: 20.0, label: ".emissiveIntensity" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "ao", { min: 0.1, max: 1.0, label: ".aoMapIntensity" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "envInt", { min: 0.1, max: 10.0, label: ".envIntensity" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "metal", { min: 0.0, max: 1.0, label: ".metalness" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "rough", { min: 0.0, max: 1.0, label: ".roughness" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "alpha", { min: 0.0, max: 1.0, label: ".opacity" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "displ", { min: 0.0, max: 8.0, label: ".displacementScale" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "displBias", { min: 0.0, max: 8.0, label: ".displacementBias" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "normal", { min: 0.01, max: 8.0, label: "Normal" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "clearcoat", { min: 0.0, max: 1.0, label: "Clearcoat" })
paramsMat_1F.addInput(PARAMS.material.mat_1, "coatrough", { min: 0.0, max: 1.0, label: "CCoatRoughness" })
//===========================
panePARAMS.addSeparator() //===========================
//===========================
const physicalMat_1F = panePARAMS.addFolder({ title: 'Physical Material', expanded: false })
physicalMat_1F.addInput(PARAMS.material.mat_1, "dither")
physicalMat_1F.addInput(PARAMS.material.mat_1, "transparent")
physicalMat_1F.addInput(PARAMS.material.mat_1, "transm", { min: 0.0, max: 1.0, label: ".transmission" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "attDist", { min: 0.0, max: 10.0, label: ".attenuationDistance" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "attColor", { view: 'color', color: { alpha: true }, label: ".attenuationColor" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "shn", { min: 0.0, max: 1.0, label: ".sheen" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "shnColor", { view: 'color', color: { alpha: true }, label: ".sheenColor" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "shnR", { min: 0.0, max: 1.0, label: ".sheenRoughness" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "ior", { min: 0.0, max: 2.33, label: ".ior" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "thick", { min: 0.0, max: 20.0, label: ".thickness" })
physicalMat_1F.addInput(PARAMS.material.mat_1, "reflect", { min: 0.0, max: 2.0, label: ".reflectivity" })
//===========================
panePARAMS.addSeparator() //===========================
//===========================
// const paramsMat_2F = panePARAMS.addFolder({ title: "Material 2", expanded: false })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "color")
// paramsMat_2F.addInput(PARAMS.material.mat_2, "emissive")
// paramsMat_2F.addInput(PARAMS.material.mat_2, "emissiveIntensity", { min: 1.0, max: 20.0, label: ".emissiveIntensity" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "ao", { min: 0.1, max: 1.0, label: ".aoMapIntensity" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "envInt", { min: 0.1, max: 10.0, label: ".envIntensity" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "metal", { min: 0.0, max: 1.0, label: ".metalness" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "rough", { min: 0.0, max: 1.0, label: ".roughness" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "alpha", { min: 0.0, max: 1.0, label: ".opacity" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "displ", { min: 0.0, max: 8.0, label: ".displacementScale" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "displBias", { min: 0.0, max: 8.0, label: ".displacementBias" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "normal", { min: 0.01, max: 8.0, label: "Normal" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "clearcoat", { min: 0.0, max: 1.0, label: "Clearcoat" })
// paramsMat_2F.addInput(PARAMS.material.mat_2, "coatrough", { min: 0.0, max: 1.0, label: "CCoatRoughness" })
// //===========================
// panePARAMS.addSeparator() //===========================
// //===========================
// const physicalMat_2F = panePARAMS.addFolder({ title: 'Physical Material', expanded: false })
// physical_1F.addInput(PARAMS.material.mat_1A, "dither")
// physical_1F.addInput(PARAMS.material.mat_1A, "transparent")
// physical_1F.addInput(PARAMS.material.mat_1A, "transm", { min: 0.0, max: 1.0, label: ".transmission" })
// physical_1F.addInput(PARAMS.material.mat_1A, "attDist", { min: 0.0, max: 10.0, label: ".attenuationDistance" })
// physical_1F.addInput(PARAMS.material.mat_1A, "attColor", { view: 'color', color: { alpha: true }, label: ".attenuationColor" })
// physical_1F.addInput(PARAMS.material.mat_1A, "shn", { min: 0.0, max: 1.0, label: ".sheen" })
// physical_1F.addInput(PARAMS.material.mat_1A, "shnColor", { view: 'color', color: { alpha: true }, label: ".sheenColor" })
// physical_1F.addInput(PARAMS.material.mat_1A, "shnR", { min: 0.0, max: 1.0, label: ".sheenRoughness" })
// physical_1F.addInput(PARAMS.material.mat_1A, "ior", { min: 0.0, max: 2.33, label: ".ior" })
// physical_1F.addInput(PARAMS.material.mat_1A, "thick", { min: 0.0, max: 20.0, label: ".thickness" })
// physical_1F.addInput(PARAMS.material.mat_1, "reflect", { min: 0.0, max: 2.0, label: ".reflectivity" })

// =============PANE SETTINGS
const paneSettings = new Pane({ title: "⚙️ Settings ", container: document.getElementById('c--Settings'), expanded: false })

const userSettingsTab = paneSettings.addTab({
  pages: [
    { title: 'User Settings' },
    { title: 'Accessibility' },
    { title: 'Notifications' },
  ],
})

userSettingsTab.pages[0].addButton({ title: "chickPox" }) //.on("click", () => {PARAMS.material.mat_1.emissiveIntensity = 1.0 })
userSettingsTab.pages[0].addButton({ title: "NWO" }) //.on("click", () => {PARAMS.material.mat_1.emissiveIntensity = 1.0 })
userSettingsTab.pages[0].addButton({ title: "the great reset" }) //.on("click", () => {PARAMS.material.mat_1.emissiveIntensity = 1.0 })
paneSettings.addSeparator(); //===========================

//================PANE SOCIAL NETWORKING

const paneSocial = new Pane({ title: "Find me on ", container: document.getElementById('c--Socials'), expanded: false  })
paneSocial.addButton({ title: "Twitter" })
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "Instagram" })
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "Are✧na" }) 
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "Medium" })
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "ClubHouse" })
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "SketchFab" })
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "Github" })
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "Email" }) 
paneSocial.addSeparator(); //===========================

////////////////////////////////////////////////////////////////////
// ✧ REGENERATORS
///////////////

function renderMaterials() {

  const element1A = mat_1A
  const element2A = dirLight
  const element3A = spotLight
  const element4A = camera
  const element5A = hLight
  const element6A = pLight0

  element1A.color = PARAMS.material.mat_1.color
  element1A.emissive.set(PARAMS.material.mat_1.emissive)
  element1A.attenuationColor.set(PARAMS.material.mat_1.attColor)
  element1A.emissiveIntensity = PARAMS.material.mat_1.emissiveIntensity
  element1A.sheen = PARAMS.material.mat_1.shn
  element1A.sheenColor = PARAMS.material.mat_1.shnColor
  element1A.sheenColorMap = PARAMS.material.mat_1.shnColorMap
  element1A.sheenRoughness = PARAMS.material.mat_1.shnR
  element1A.attenuationDistance = PARAMS.material.mat_1.attDist
  element1A.metalness = PARAMS.material.mat_1.metal
  element1A.roughness = PARAMS.material.mat_1.rough
  element1A.opacity = PARAMS.material.mat_1.alpha
  element1A.transmission = PARAMS.material.mat_1.transm
  element1A.ior = PARAMS.material.mat_1.ior
  element1A.thickness = PARAMS.material.mat_1.thick
  element1A.reflectivity = PARAMS.material.mat_1.reflect
  element1A.clearcoat = PARAMS.material.mat_1.clearcoat * 5
  element1A.clearcoatRoughness = PARAMS.material.mat_1.coatrough
  element1A.envMapIntensity = PARAMS.material.mat_1.envInt
  element1A.displacementScale = PARAMS.material.mat_1.displ * 0.1
  element1A.displacementBias = PARAMS.material.mat_1.displBias
  element1A.aoMapIntensity = PARAMS.material.mat_1.ao;
  element1A.normalScale.set(PARAMS.material.mat_1.normal, PARAMS.material.mat_1.normal)
  element1A.dithering = PARAMS.material.mat_1.dither
  element1A.transparent = PARAMS.material.mat_1.transparent
  element1A.needsUpdate = true;
  //--
  element2A.intensity = PARAMS.light.dirLight.intensity
  element2A.color = PARAMS.light.dirLight.color
  element2A.castShadow = PARAMS.light.dirLight.castShadow
  //--
  element3A.intensity = PARAMS.light.spotLight.intensity
  element3A.color = PARAMS.light.spotLight.col
  element3A.castShadow = PARAMS.light.spotLight.castShadow
  element3A.castShadow = PARAMS.light.spotLight.castShadow
  //--
  element4A.fov = PARAMS.cam.vfov
  element4A.updateProjectionMatrix()
  //--
  element5A.intensity = PARAMS.light.hLight.intensity
  //--
  element6A.intensity= PARAMS.light.pLight.intensity
  element6A.color = PARAMS.light.pLight.color

}

//------------
function regenerateGeometries() {
  const newSphGeo = new THREE.SphereGeometry (
    PARAMS.geo.sphere.radius,
    PARAMS.geo.sphere.widthS,
    PARAMS.geo.sphere.heightS,
    PARAMS.geo.sphere.phiS,
    PARAMS.geo.sphere.phiL,
    PARAMS.geo.sphere.thetaS,
    PARAMS.geo.sphere.thetaL
  )
  sphere.geometry.dispose()
  sphere.geometry = newSphGeo

  //--
  const newTorGeo = new THREE.TorusGeometry (
    PARAMS.geo.torus.radius,
    PARAMS.geo.torus.tube,
    PARAMS.geo.torus.tubularSegments,
    PARAMS.geo.torus.radialSegments
  )
  torusMesh.geometry.dispose()
  torusMesh.geometry = newTorGeo
  //--
  const newTorKnotGeo = new THREE.TorusKnotGeometry (
    PARAMS.geo.torusK.radius,
    PARAMS.geo.torusK.tube,
    PARAMS.geo.torusK.tubularSegments,//arSegments: 300,
    PARAMS.geo.torusK.radialSegments,//lSegments: 20,
    PARAMS.geo.torusK.p,
    PARAMS.geo.torusK.q
  )
  torusKnot.geometry.dispose()
  torusKnot.geometry = newTorKnotGeo
  //--
  const newPlaneGeo = new THREE.PlaneGeometry (
    PARAMS.geo.plane.w,
    PARAMS.geo.plane.h,
    PARAMS.geo.plane.wS,
    PARAMS.geo.plane.hS,
  )
  planeMesh.geometry.dispose()
  planeMesh.geometry = newPlaneGeo
  
}

////////////////////////////////////////////////////////////////////
// ✧ EFFECT COMPOSER - POSTPRODUCTION
///////////////
const noiseFX = new NoiseEffect()

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new EffectPass(camera, new SMAAEffect))
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new EffectPass(camera, noiseFX))

console.log(composer)

////////////////////////////////////////////////////////////////////
// ✧ STATS
///////////////

const stats = Stats()

document.body.appendChild(stats.dom)


const clock = new THREE.Clock()
let previousTime = 0

function render() {
  renderer.render(scene, camera)
}

function animate() {
  requestAnimationFrame(animate)

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  torusKnot.rotation.x += 0.01
  torusKnot.rotation.y += 0.01

  torusMesh.rotation.x += 0.01
  torusMesh.rotation.z += 0.01

  sphere.rotation.y += 0.005


  // plLine.rotation.y += 0.005
  // plLine.rotation.z += 0.005

  pLight0.rotation.y += Math.cos(elapsedTime * 0.3) * 30
  pLight0.rotation.x += Math.sin(elapsedTime * 0.3) * 30

  controls.update()

  paneScene.refresh()
  paneHelpers.refresh()
  panePARAMS.refresh()
  paneSocial.refresh()
  paneSettings.refresh()
  paneGeometries.refresh()

  scene.background = new THREE.Color(PARAMS.scene.background);

  regenerateGeometries()
  renderMaterials()

  requestAnimationFrame(render)

  composer.render()

  stats.update()

}
// -- Ω
animate()