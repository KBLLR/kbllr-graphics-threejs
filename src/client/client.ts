console.clear()
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { Water } from 'three/examples/jsm/objects/Water2.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import { WebGLRenderer } from 'three'
import {
  EffectComposer,
  EffectPass,
  CopyMaterial,
  SMAAEffect,
  SMAAImageLoader,
  NoiseEffect,
  PredicationMode,
  RenderPass,
  ShaderPass,
  SMAAPreset,
  ACESFilmicToneMapping,
  ColorDepthEffect,
  TextureEffect,
  sRGBEncoding,
  MaskFunction,
  NoToneMapping,
  ToneMappingMode,
  VSMShadowMap,
  BloomEffect,
  ColorChannel,
  DepthTestStrategy,
  DepthOfFieldEffect,
  EdgeDetectionMode,
  kernelSize,
  LUTOperation,
  SelectiveBloomEffect,
  FXAAEffect,
  VignetteEffect,
  VignetteTechnique,
  WebGlExtension,
  BlendFunction,
  OverrideMaterialManager
} from '../../node_modules/postprocessing/build/postprocessing.esm.js'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { ButtonProps, TabParams } from '@tweakpane/core'
import { FolderParams } from 'tweakpane'
import { PaneConfig } from 'tweakpane/dist/types/pane/pane-config'
import { getProject } from "@theatre/core"
import studio from "@theatre/studio"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshBVH } from '../../node_modules/three-mesh-bvh/'
// import {
//  generateEdges,
//  isLineAbovePlane,
//  isYProjectedTriangleDegenerate,
//  isLineTriangleEdge,
//  trimToBeneathTriPlane,
//  edgesToGeometry,
//  overlapsToLines,
//  getProjectedOverlaps,
//  isYProjectedLineDegenerate,
//  compressEdgeOverlaps,
// } from '../../node_modules/three-mesh-bvh/example/utils/edgeUtils.js'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';



//===================================================
// ✧ CUSTOM CURSOR
//===================================================



//===================================================
// ✧ CANVAS ✧ SCENES ✧ CONSTANTS
//===================================================

const canvas = document.querySelector("canvas")

const scene = new THREE.Scene()

const sizes = { width: window.innerWidth, height: window.innerHeight }

const canvas_width = sizes.width

const canvas_height = sizes.height

const aspect = sizes.width / sizes.height


//===================================================
// EQUIRECTANGULAR HDR
//===================================================

const textureLoader = new THREE.TextureLoader()
const textureLoad = new RGBELoader()


//===================================================
// SCENE FOG & BACKGROUND
//===================================================

scene.fog = new THREE.Fog(0xffffff, 0.1, 2.9)
//scene.fog = new THREE.FogExp2( 0xffffff, 1.5 )

scene.background = new THREE.Color( 0xffffff)


//===================================================
// ✧ CAMERA  
//===================================================

const camera = new THREE.PerspectiveCamera(45, aspect, 0.001, 20000)

camera.position.x = -0.15
camera.position.y = 0
camera.position.z = 0
camera.lookAt(new THREE.Vector3(0, 0, 0))

scene.add(camera)

//===================================================
//-- ORTHOGRAPHIC CAMERA

// let orthoCamera {
//   const left = -5
//   const right = 5
//   const top = 5
//   const bottom = -5
//   const near = 0.5
//   const far = 500

//   orthoCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far)
//   orthoCamera.position.z = -1
//   orthoCamera.lookAt(new THREE.Vector3(0, 0, 0))
// }

//===================================================
// ✧ RESPONSIVENESS 
//===================================================


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


//===================================================
// ✧ RENDERER  
//===================================================

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  powerPreference: "high-performance",
  antialias: true,
  stencil: true,
  depth: true,
})


renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor(0x000000, 1)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.9

// document.body.appendChild(renderer.domElement)


//===================================================
// ✧ ORBIT CONTROLS 
//===================================================


const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
// controls.addEventListener('start', ()=> console.log("Controls start event"))
// controls.addEventListener('end', ()=> console.log("Controls end event"))
controls.enabled = true
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.autoRotate = false
controls.enableZoom = true
controls.autoRotateSpeed = 2
controls.zoomSpeed = 1.5
controls.panSpeed = 1
controls.minDistance = 0.05
controls.maxDistance = 1.2
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1


//===================================================
// ✧ LIGHTS 
//===================================================


const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 8.61)
hemiLight.position.set(0, 0, 0)
scene.add(hemiLight)

const light = new THREE.DirectionalLight( 0xffffff, 10.25 )
light.position.set( 2, 2, 2)

light.castShadow = true
light.shadow.mapSize.width = 1024
light.shadow.mapSize.height = 1024

// light.shadow.camera.near = 1
// light.shadow.camera.far = 12

// light.shadow.camera.left = - 10
// light.shadow.camera.right = 10
// light.shadow.camera.top = 0
// light.shadow.camera.bottom = 0

scene.add( light )
// scene.add( new THREE.CameraHelper( light.shadow.camera ) )


//===================================================
// ✧ GROUND 
//===================================================

const gGeometry = new THREE.PlaneGeometry( 512, 512)
 
const gMaterial = new THREE.MeshPhysicalMaterial({ 
  
  map: textureLoader.load( "/img/terrazzo/Terrazzo010_2K_Color.png" ),
  emissive: 0x000000,
  emissiveIntensity: 1,
  transmission: 1,
  // emissiveMap: textureLoader.load('/img/terrazzo/Terrazzo_2K_Emission.png'),
  displacementMap: textureLoader.load("/img/terrazzo/Terrazzo_2K_Displacement.png"),
  displacementScale: 1.2,
  roughnessMap:  textureLoader.load( "/img/terrazzo/Terrazzo010_2K_Roughness.png" ),
  roughness: 3.2,
  metalnessMap:  textureLoader.load( "/img/terrazzo/Terrazzo010_2K_Metalness.png" ),
  metalness:0.2,
  normalMap: textureLoader.load( "/img/terrazzo/Terrazzo010_2K_NormalGL.png" ),
  normalMapType: 1,
  normalScale: new THREE.Vector2( 1, 1),
  fog: true
})


const ground = new THREE.Mesh( gGeometry, gMaterial )
ground.rotation.x = - Math.PI / 2
// ground.material.map.repeat.set( 64, 64 )
// ground.material.map.wrapS = THREE.RepeatWrapping
// ground.material.map.wrapT = THREE.RepeatWrapping
// ground.material.map.encoding = THREE.sRGBEncoding
ground.receiveShadow = true

scene.add( ground )

//===================================================
// ✧ GRID HELPER 
//===================================================
//
// const gridHelper = new THREE.GridHelper(40, 400)
// gridHelper.position.y = 0.001
// scene.add(gridHelper)
//
//
//===================================================
// EVENTS
//===================================================

// window.addEventListener( 'resize', onWindowResize )
// document.addEventListener( 'keydown', onKeyDown )
// document.addEventListener( 'keyup', onKeyUp )


//===================================================
// TWEAKPANE CHARACTER ACTIONS
//===================================================


const pane = new Pane({ title: "Character Actions", container: document.getElementById('p--chActions'), expanded: false })
pane.addButton({ title: 'Offended Iddle' })
pane.addButton({ title: 'Neutral Iddle' })
pane.addButton({ title: 'Happy Iddle' })
pane.addButton({ title: 'Walking' })
pane.addButton({ title: 'Standard Walking' })
pane.addButton({ title: 'Running ' })
pane.addButton({ title: 'Running 2' })
pane.addButton({ title: 'Default' })

// animationsFolder.addInput(PARAMS, 'Animations', {options: { default,}})


/////////////////////////////////////////////////////////////////////////////
// Inner_KID 👦🏽    
/////////////////

const gltfLoader = new GLTFLoader()

let mixer = null
let allies

let allie_1, allie_2, allie_3, allie_4, allie_5, allie_6

gltfLoader.load('/models/theAllies/THE_ALLIES.glb', (gltf) => {

  allies = gltf.scene
  allies.position.set(0, 0, 0)
  console.log(allies.children)

  allie_1 = allies.children[0]
  allie_2 = allies.children[1]
  allie_3 = allies.children[2]
  allie_4 = allies.children[3]
  allie_5 = allies.children[4]
  allie_6 = allies.children[5]

  allie_1.position.set(0, 0, 0)
  // allie_1.scale.set(0.025, 0.025, 0.025)

  allie_2.position.set(0, 0, 0)
  allie_2.scale.set(0.025, 0.025, 0.025)

  allie_3.position.set(0, 0, -0.1)
  allie_3.scale.set(0.025, 0.025, 0.025)

  allie_4.position.set(0, 0, -0.05)
  allie_4.scale.set(0.025, 0.025, 0.025)

  allie_5.position.set(0, 0, 0.1)
  allie_5.scale.set(0.025, 0.025, 0.025)

  allie_6.position.set(0, 0, 0.05)
  allie_6.scale.set(0.025, 0.025, 0.025)

  allies.traverse(function(child) {
    if (
      child instanceof THREE.Mesh) {}
  })

  scene.add(allies)

  mixer = new THREE.AnimationMixer(allies)
  const action = mixer.clipAction(gltf.animations[0])
  action.play()

  const action1 = mixer.clipAction(gltf.animations[1])
  action1.play()

  const action2 = mixer.clipAction(gltf.animations[2])
  action2.play()

  const action3 = mixer.clipAction(gltf.animations[3])
  action3.play()

  const action4 = mixer.clipAction(gltf.animations[4])
  action4.play()

  const action5 = mixer.clipAction(gltf.animations[5])
  action5.play()

})


////////////////////////////////////////////////////////////////////
// ✧ CONTROLLER DRAG CHARACTER
///////////////


// const dragSphereGeo = new THREE.SphereGeometry()

// const materials = [
//     new THREE.MeshPhongMaterial({ color: 0xff0000, transparent: true }),
//     new THREE.MeshPhongMaterial({ color: 0x00ff00, transparent: true }),
//     new THREE.MeshPhongMaterial({ color: 0x0000ff, transparent: true })
// ]

// const dragSpheres = [
//     new THREE.Mesh(dragSphereGeo, materials[0]),
//     new THREE.Mesh(dragSphereGeo, materials[1]),
//     new THREE.Mesh(dragSphereGeo, materials[2])
// ]
// dragSpheres[0].position.x = -2
// dragSpheres[1].position.x = 0
// dragSpheres[2].position.x = 2
// dragSpheres.forEach((s) => scene.add(s))


// const dragControls = new DragControls(dragSpheres, camera, renderer.domElement)
// dragControls.addEventListener('dragstart', function (event) {
//   event.object.materials.opacity = 0.33
// })

// dragControls.addEventListener('dragend', function (event) {
//   event.object.materials.opacity = 1
// })



////////////////////////////////////////////////////////////////////
// ✧ CONTROLLER CHARACTER TRANSFORM
///////////////

const transformControls = new TransformControls(camera, renderer.domElement)
// controls.enabled = !event.value
// transformControls.attach(cube)
// transformControls.setMode('rotate')
// scene.add(transformControls)

window.addEventListener('keydown', function(event) {
  switch (event.code) {
    case 'KeyG':
      transformControls.setMode('translate')
      break
    case 'KeyR':
      transformControls.setMode('rotate')
      break
    case 'KeyT':
      transformControls.setMode('scale')
      break
  }
})


////////////////////////////////////////////////////////////////////
// ✧ STATS
///////////////

const stats = Stats()
document.body.appendChild(stats.dom)


// -- RENDERING

const clock = new THREE.Clock()
let previousTime = 0

function animate() {
  requestAnimationFrame(animate)

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime


  controls.update()


  if (mixer) { mixer.update(deltaTime) }

  render()


  stats.update()

}

function render() {
  renderer.render(scene, camera)
}

// -- Ω
animate()