console.clear()
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { WebGLRenderer } from 'three'
import {
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  sRGBEncoding,
  VSMShadowMap,
  BloomEffect,
  VignetteEffect
} from '../../node_modules/postprocessing/build/postprocessing.esm.js';
import { Pane } from 'tweakpane'
import { ButtonProps, TabParams } from '@tweakpane/core'
import { FolderParams } from 'tweakpane'
import { PaneConfig } from 'tweakpane/dist/types/pane/pane-config'

//==========================

////////////////////////////////////////////////////////////////////
// ✧ SCREENSHOT FUNCTION 📸
///////////////


//==========================


////////////////////////////////////////////////////////////////////
// ✧ GENERATIVE Data Texture
///////////////

const Template = "https://unsplash.com/photos/QwoNAhbmLLo"

let arrayTop = [
"diamonds", 
"minerals", 
"eye", "eyes",
"geometry", 
"New York", 
"Universe", 
"aurora vorearis", 
"northern lights", 
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

//--Random Color Generator
var rRGB = () => Math.random() * 256 >> 0
var randRGB = `rgb(${rRGB()}, ${rRGB()}, ${rRGB()})`
console.log(randRGB)

//--Random PARAM between 0.1 and 1.0
var rParam = () => Math.random() * 1.0 >> 0.1
var randPARAM = `rParam()`
console.log(randPARAM)

///////////////////////////////
// ✧ Experience Constants Declarations /// 
/////////////////////////////

const sizes = { width: window.innerWidth, height: window.innerHeight }
const canvas_width = sizes.width
const canvas_height = sizes.height
const aspect = sizes.width / sizes.height

///////////////////////////////
// ✧ DEVELOPER GUI HELPERS /// 
/////////////////////////////

//--GRID
const gridHelper = new THREE.GridHelper(100, 100)
gridHelper.position.y = 0;
// scene.add(gridHelper)

//--POSITIONING
const axesHelper = new THREE.AxesHelper();
//scene.add(axesHelper);

//--Most Classes share properties with Object 3D
//--A Layers object assigns an Object3D to 1 or more of 32 layers numbered 0 to 31
//--internally the layers are stored as a bit mask
//--by default all Object3Ds are a member of layer 0.

//--Parameters for Abstract Base Classes

const clearBgColor = new THREE.Color(0xf5f5f5)
const background = new THREE.Color(0x000000)

const lightCol = new THREE.Color(0xffffff)

const hLightCol_1_1 = new THREE.Color(0xffffff)
const hLightCol_1_2 = new THREE.Color(0x000000)

const pLight_1 = new THREE.Color(0xffffff)
const pLight_2 = new THREE.Color(0xF5F5F5)

const material_1_color = new THREE.Color(0x708090)
const material_1_emissive = new THREE.Color(0x000000)

const attenuationColor_Mat1 = new THREE.Color(0xF5F5F5)
const shnColor_Mat1 = new THREE.Color(0xffffff/1.0)

//=====================================================

const PARAMS = {
  camera: {},
  scene: {
    background: background.convertLinearToSRGB(),
  },
  gridHelper: {
    size: 40,
    divisions: 40,
    hidden: true,
  },
  light: {
    color: lightCol.convertLinearToSRGB(), //--int
    intensity: 2.5, //--flt
  },
  dirLight: {
    castShadow: true,
    position: { x: 1, y: 2, z: 1 }, //--Vector3
    target: { x: 0, y: 0, z: 0 }, //--Object3D
  },
  pLight_1: {
  	color: pLight_1.convertLinearToSRGB(),
  	intensity: 10,
  },
  pLight_2: {
  	color: pLight_2.convertLinearToSRGB(),
  	intensity: 10,
  },
  hLight: {
  	color1: hLightCol_1_1.convertLinearToSRGB(),
  	color2: hLightCol_1_2.convertLinearToSRGB(),
  	intensity: 10,
  },
  geo:{
  	baseSphere: {
  		radius: 4,
  		widthS: 4,
  		heightS:4,
  		phiS: 0,
  		phiL: Math.PI * 2,
  		thetaS: 10,
  		thetaL: Math.PI * 2,
  	},
  },
  material_1: {
    color: material_1_color.convertLinearToSRGB(),
    metal: 0.4,
    attColor: attenuationColor_Mat1.convertLinearToSRGB(),
    attDist: 2.0,
    rough: 0.05,
    alpha: 1.0, //opacity
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
    emissive: material_1_emissive.convertLinearToSRGB(),
    emissiveIntensity: 2.45,
    displ: 0.1,
    displBias: 1.0,
    ao: 1.0,
    normal: 0.01,
    dither: true,
    transparent: false,
    combine: THREE.AddOperation,
  },
  material_2: {
    sheen: 0.7,
    sheenRoughness: 0.3,
    sheenColor: 0xD8BFD8,
    envMapIntensity: 6,
    reflectivity: 0.5,
    specularColor: 0xF5F5F5,
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
  }
}

//==GEOMETRIES DATA

const sphereData = {
  radius: 2,
  widthSegments: 80,
  heightSegments: 80,
  phiStart: 0,
  phiLength: Math.PI * 2,
  thetaStart: 0,
  thetaLength: Math.PI * 2,
}
//--
const torusData = {
  radius: 1,
  tube: 0.1,
  tubularSegments: 200,
  radialSegments: 30,
  arc: 6.283,
}
//--
const torusKnotData = {
  radius: 1,
  tube: 0.1,
  tubularSegments: 300,
  radialSegments: 20,
  p: 1,
  q: 3,
}

////////////////////////////////////
// ✧ CANVAS ✧ SCENES ✧ CONSTANTS///
//////////////////////////////////

const canvas = document.querySelector("canvas");

const scene = new THREE.Scene()

scene.background = PARAMS.scene.background

////////////////
// ✧ CAMERA  //
///////////////

//--calculateVerticalFoV(90, Math.max(aspect, 16 / 9));
const vFov = 59
const camera = new THREE.PerspectiveCamera(vFov, aspect, 0.01, 20000)

camera.position.z = -10
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

////////////////////////////////////////////////////////////////////
// ✧ RENDERER
///////////////

const renderer = new THREE.WebGLRenderer({
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: true,
});

renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor(clearBgColor.convertLinearToSRGB())
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
// renderer.xr.enabled = true
renderer.outputEncoding = sRGBEncoding;
renderer.shadowMap.type = VSMShadowMap;
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
controls.autoRotate = true
controls.enableZoom = true
controls.autoRotateSpeed = 1.2
controls.minDistance = 0.1
controls.maxDistance = 25
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1

////////////////////////////////////////////////////////////////////
// ✧ LIGHTS + group
///////////////

const hemis_light = new THREE.HemisphereLight(PARAMS.hLight.color1, PARAMS.hLight.color2, PARAMS.hLight.intensity)
scene.add(hemis_light)

const pLight0 = new THREE.PointLight(PARAMS.pLight_1.color, PARAMS.pLight_1.intensity)
pLight0.position.set(7, 7, 12)

const pLight1 = new THREE.PointLight(PARAMS.pLight_2.color, PARAMS.pLight_2.intensity)
pLight1.position.set(-7, -7, -12)

scene.add(pLight0, pLight1)

const dirLight = new THREE.DirectionalLight(PARAMS.light.color, PARAMS.light.intensity)
dirLight.position.x = 8
dirLight.position.y = 8
dirLight.position.z = -8
dirLight.castShadow = true
scene.add(dirLight)

dirLight.shadow.mapSize.width = 1024; // default
dirLight.shadow.mapSize.height = 1024; // default
dirLight.shadow.camera.near = 0.1; // default
dirLight.shadow.camera.far = 10000; // default

////////////////////////////
// ✧ MeshPhysicalMaterial//
//////////////////////////

//=== MATERIAL #1

const material_1A = new THREE.MeshPhysicalMaterial({
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

material_1A.sheenRoughnessMap = g_texture(topic, 4)
material_1A.sheenColorMap = g_texture(topic, 4)

//===========================================================+

//=== MATERIAL #2

const material_2A = new THREE.MeshPhysicalMaterial({
  envMap: g_texture("neon", 4),
  //--

  //--
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

material_2A.sheenRoughnessMap = g_texture(topic, 4)
material_2A.sheenColorMap = g_texture(topic, 4)
//===========================================================+

////////////////////////////////////////////////////////////////////
// ✧ GEOMETRIES > THREE.BUFFERGEOMETRY after r125
/////////////////
////////////////////
// ✧ MESH OBJECTS /
//////////////////


//--- SPHERE
const sphereGeometry = new THREE.SphereGeometry()
const sphere = new THREE.Mesh(sphereGeometry, material_1A)
scene.add(sphere)


//--- TORUS
const torusG = new THREE.TorusGeometry()
const torusMesh = new THREE.Mesh(torusG, material_2A)
torusMesh.rotation.z = (90 * Math.PI) / 180
torusMesh.castShadow = true;
torusMesh.name = "TORUS#0";
scene.add(torusMesh)


//--- TORUS_KNOT
const torusKGeo = new THREE.TorusKnotGeometry()
const torusKnot = new THREE.Mesh(torusKGeo, material_2A)
scene.add(torusKnot)



///   ///////////////////////
////////// ✧ GUI - TWEAKPANE //// ///////
//     ///////////////////////

//===========PANE SCENE
const paneScene = new Pane({ title: "Scene", container: document.getElementById('c--Scene'), expanded: false })

//========BACKGROUND FOLDER
const experienceF = paneScene.addFolder({ title: "Background Options", expanded: false })
experienceF.addInput(PARAMS.scene, "background", { view: 'color', color: { alpha: true }, label: ".color" })
experienceF.addSeparator(); //===========================

//========CAMERA FOLDER
const cameraF = paneScene.addFolder({ title: "Cameras Directory", expanded: false })
const lightsF = paneScene.addFolder({ title: "Lights directory", expanded: false })
cameraF.addSeparator(); //===========================

//===========LIGHTS TAB
const lightsTab = lightsF.addTab({
  pages: [
    { title: 'Base Class Light' },
    { title: 'Ambient Light' },
    { title: 'Hemisphere Light' },
    { title: 'Directional Light' },
    { title: 'Point Light' },
  ],
})
lightsTab.pages[0].addInput(PARAMS.light, "color", { view: 'color', color: { alpha: true }, label: ".color" })
lightsTab.pages[0].addInput(PARAMS.light, "intensity", { min: 0.0, max: 20.0, label: ".intensity" })
lightsTab.pages[3].addInput(PARAMS.dirLight, "castShadow")
lightsTab.pages[3].addInput(PARAMS.dirLight, "position")
lightsTab.pages[3].addInput(PARAMS.dirLight, "target")


//===========PANE HELPERS
const paneHelpers = new Pane({ title: "Helpers", container: document.getElementById('c--Helpers'), expanded: false })
const gridF = paneHelpers.addFolder({ title: "Grid", expanded: false })
gridF.addInput(PARAMS.gridHelper, "divisions", { min: 20, max: 500, label: ".divisions" })
gridF.addInput(PARAMS.gridHelper, "size", { min: 40, max: 150, step: 1, label: ".size" })
gridF.addInput(PARAMS.gridHelper, "hidden")
paneHelpers.addSeparator(); //=======

//===========PANE MESHES
const paneMeshes = new Pane({ title: "Meshes", container: document.getElementById('c--Meshes'), expanded: false })
const sphereF = paneMeshes.addFolder({ title: "Sphere", expanded: false });
const torusF = paneMeshes.addFolder({ title: "Torus", expanded: false });
const torusKnotF = paneMeshes.addFolder({ title: "Torus Knot", expanded: false });
paneMeshes.addSeparator(); //===========================

//===========PANE GEOMETRIES
const paneGeometries = new Pane({ title: "BufferGeometries", container: document.getElementById('c--Geometries'), expanded: false })
const sphereG_F = paneGeometries.addFolder({ title: "SphereBufferGeometry", expanded: false });
sphereG_F.addInput(PARAMS.geo.baseSphere, "radius", { step: 1, min: 1, max: 9, label: ".radius" })
sphereG_F.addInput(PARAMS.geo.baseSphere, "widthS", { step: 1, min: 1, max: 180, label: ".widthSegments" })
sphereG_F.addInput(PARAMS.geo.baseSphere, "heightS",{ step: 1,min: 1, max: 180, label: ".heightSegments" })
sphereG_F.addInput(PARAMS.geo.baseSphere, "phiS", { min: 0.0, max: 5.0, label: ".phiStart" })
sphereG_F.addInput(PARAMS.geo.baseSphere, "phiL", { min: 0.0, max: 5.0, label: ".phiLength" })
sphereG_F.addInput(PARAMS.geo.baseSphere, "thetaS", { min: 0.0, max: 5.0, label: ".thetaStart" })
sphereG_F.addInput(PARAMS.geo.baseSphere, "thetaL", { min: 0.0, max: 5.0, label: ".thetaLength" })
paneGeometries.addSeparator(); //===========================
const torusG_F = paneGeometries.addFolder({ title: "TorusBufferGeometry", expanded: false });
paneGeometries.addSeparator(); //===========================
const torusKnotG_F = paneGeometries.addFolder({ title: "TorusKnotGeometry", expanded: false });
paneGeometries.addSeparator(); //===========================

//===========PANE PARAMS
const panePARAMS = new Pane({ title: "PARAMS ", container: document.getElementById('c--PARAMS'), expanded: false })
const paramsMat_1_F = panePARAMS.addFolder({ title: "Material_1", expanded: false })
const paramsMat_2_F = panePARAMS.addFolder({ title: "Material_2", expanded: false })
paramsMat_1_F.addInput(PARAMS.material_1, "color")
paramsMat_1_F.addInput(PARAMS.material_1, "emissive")
paramsMat_1_F.addInput(PARAMS.material_1, "emissiveIntensity", { min: 1.0, max: 20.0, label: ".emissiveIntensity" })
paramsMat_1_F.addInput(PARAMS.material_1, "ao", { min: 0.1, max: 1.0, label: ".aoMapIntensity" })
paramsMat_1_F.addInput(PARAMS.material_1, "envInt", { min: 0.1, max: 10.0, label: ".envIntensity" })
paramsMat_1_F.addInput(PARAMS.material_1, "metal", { min: 0.0, max: 1.0, label: ".metalness" })
paramsMat_1_F.addInput(PARAMS.material_1, "rough", { min: 0.0, max: 1.0, label: ".roughness" })
paramsMat_1_F.addInput(PARAMS.material_1, "alpha", { min: 0.0, max: 1.0, label: ".opacity" })
paramsMat_1_F.addInput(PARAMS.material_1, "displ", { min: 0.0, max: 8.0, label: ".displacementScale" })
paramsMat_1_F.addInput(PARAMS.material_1, "displBias", { min: 0.0, max: 8.0, label: ".displacementBias" })
paramsMat_1_F.addInput(PARAMS.material_1, "normal", { min: 0.01, max: 8.0, label: "Normal" })
paramsMat_1_F.addInput(PARAMS.material_1, "clearcoat", { min: 0.0, max: 1.0, label: "Clearcoat" })
paramsMat_1_F.addInput(PARAMS.material_1, "coatrough", { min: 0.0, max: 1.0, label: "CCoatRoughness" })
paramsMat_1_F.addSeparator() //===========================

//===========PANE MATERIALS
const paneMaterials = new Pane({ title: "Materials ", container: document.getElementById('c--Materials'), expanded: false })
const physicalMaterialF = paneMaterials.addFolder({ title: 'Physical Material', expanded: false })

physicalMaterialF.addInput(PARAMS.material_1, "dither")
physicalMaterialF.addInput(PARAMS.material_1, "transparent")
physicalMaterialF.addInput(PARAMS.material_1, "transm", { min: 0.0, max: 1.0, label: ".transmission" })
physicalMaterialF.addInput(PARAMS.material_1, "attDist", { min: 0.0, max: 10.0, label: ".attenuationDistance" })
physicalMaterialF.addInput(PARAMS.material_1, "attColor", { view: 'color', color: { alpha: true }, label: ".attenuationColor" })
physicalMaterialF.addInput(PARAMS.material_1, "shn", { min: 0.0, max: 1.0, label: ".sheen" })
physicalMaterialF.addInput(PARAMS.material_1, "shnColor", { view: 'color', color: { alpha: true }, label: ".sheenColor" })
physicalMaterialF.addInput(PARAMS.material_1, "shnR", { min: 0.0, max: 1.0, label: ".sheenRoughness" })
physicalMaterialF.addInput(PARAMS.material_1, "ior", { min: 0.0, max: 2.33, label: ".ior" })
physicalMaterialF.addInput(PARAMS.material_1, "thick", { min: 0.0, max: 20.0, label: ".thickness" })
physicalMaterialF.addInput(PARAMS.material_1, "reflect", { min: 0.0, max: 2.0, label: ".reflectivity" })
physicalMaterialF.addSeparator(); //===========================

// =============PANE BUTTONS
const paneButtons = new Pane({ title: "Buttons ", container: document.getElementById('c--Buttons'), expanded: false })
paneButtons.addButton({ title: "Reset" })
// .on("click", () => {
// 	PARAMS.material_1.emissiveIntensity = 1.0
// })
paneButtons.addSeparator(); //===========================
paneButtons.addButton({ title: "Random", })
// .on("click", () => {
// 	PARAMS.material_1.emissiveIntensity = Math.random()
// 	PARAMS.material_1.alpha = 0.3 + Math.random()
// })
paneButtons.addSeparator(); //===========================

//================PANE SOCIAL NETWORKING
const paneSocial = new Pane({ title: "Find me on ", container: document.getElementById('c--Socials'), expanded: false  })
paneSocial.addButton({ title: "Twitter" })
paneSocial.addSeparator(); //===========================
paneSocial.addButton({ title: "Instagram" })
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

function renderMaterial() {

  const element1A = material_1A
  const element2A = dirLight
  const element3A = sphereData

  element1A.color = PARAMS.material_1.color
  element1A.emissive.set(PARAMS.material_1.emissive)
  element1A.attenuationColor.set(PARAMS.material_1.attColor)
  element1A.emissiveIntensity = PARAMS.material_1.emissiveIntensity
  element1A.sheen = PARAMS.material_1.shn
  element1A.sheenColor = PARAMS.material_1.shnColor
  element1A.sheenColorMap = PARAMS.material_1.shnColorMap
  element1A.sheenRoughness = PARAMS.material_1.shnR
  element1A.attenuationDistance = PARAMS.material_1.attDist
  element1A.metalness = PARAMS.material_1.metal
  element1A.roughness = PARAMS.material_1.rough
  element1A.opacity = PARAMS.material_1.alpha
  element1A.transmission = PARAMS.material_1.transm
  element1A.ior = PARAMS.material_1.ior
  element1A.thickness = PARAMS.material_1.thick
  element1A.reflectivity = PARAMS.material_1.reflect
  element1A.clearcoat = PARAMS.material_1.clearcoat * 5
  element1A.clearcoatRoughness = PARAMS.material_1.coatrough
  element1A.envMapIntensity = PARAMS.material_1.envInt
  element1A.displacementScale = PARAMS.material_1.displ * 0.1
  element1A.displacementBias = PARAMS.material_1.displBias
  element1A.aoMapIntensity = PARAMS.material_1.ao;
  element1A.normalScale.set(PARAMS.material_1.normal, PARAMS.material_1.normal)
  element1A.dithering = PARAMS.material_1.dither
  element1A.transparent = PARAMS.material_1.transparent
  element1A.needsUpdate = true;
  //--
  element2A.intensity = PARAMS.light.intensity
  element2A.color = PARAMS.light.color
  element2A.castShadow = PARAMS.dirLight.castShadow
  //--
  element3A.radius = PARAMS.geo.baseSphere.radius
  element3A.widthSegments = PARAMS.geo.baseSphere.widthS
  element3A.heightSegments = PARAMS.geo.baseSphere.heightS
}

//------------
function regenerateSphereGeometry() {
  const newGeometry = new THREE.SphereGeometry(
    sphereData.radius,
    sphereData.widthSegments,
    sphereData.heightSegments,
    sphereData.phiStart,
    sphereData.phiLength,
    sphereData.thetaStart,
    sphereData.thetaLength
  )
  sphere.geometry.dispose()
  sphere.geometry = newGeometry
}

//------------
function regenerateTorusKnotGeometry() {
  const newTorusKnotG = new THREE.TorusKnotGeometry(
    torusKnotData.radius,
    torusKnotData.tube,
    torusKnotData.tubularSegments,
    torusKnotData.radialSegments,
    torusKnotData.p,
    torusKnotData.q,
  )
  torusKnot.geometry.dispose()
  torusKnot.geometry = newTorusKnotG
}

//------------
function regenerateTorusGeometry() {
  const newTorusG = new THREE.TorusGeometry(
    torusData.radius,
    torusData.tube,
    torusData.tubularSegments,
    torusData.radialSegments,
    torusData.arc
  )
  torusMesh.geometry.dispose()
  torusMesh.geometry = newTorusG
}

////////////////////////////////////////////////////////////////////
// ✧ EFFECT COMPOSER - POSTPRODUCTION
///////////////

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new EffectPass(camera, new BloomEffect()));


////////////////////////////////////////////////////////////////////
// ✧ STATS
///////////////

const stats = Stats()

document.body.appendChild(stats.dom)

////////////////////////////////////////////////////////////////////
// ✧ SCREENSHOT BUTTON
///////////////

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


  pLight0.rotation.y += Math.cos(elapsedTime * 0.3) * 30
  pLight0.rotation.x += Math.sin(elapsedTime * 0.3) * 30

  pLight1.rotation.x += Math.sin(elapsedTime * 0.3) * 30
  pLight1.rotation.y += Math.cos(elapsedTime * 0.3) * 30

  controls.update()

  paneScene.refresh()
  paneHelpers.refresh()
  paneMaterials.refresh()
  paneMeshes.refresh()
  panePARAMS.refresh()
  paneSocial.refresh()
  paneButtons.refresh()
  paneGeometries.refresh()

  scene.background = new THREE.Color(PARAMS.scene.background);

  regenerateSphereGeometry()
  regenerateTorusKnotGeometry()
  regenerateTorusGeometry()

  renderMaterial()

  requestAnimationFrame(render)

  composer.render()

  stats.update()

}

animate()