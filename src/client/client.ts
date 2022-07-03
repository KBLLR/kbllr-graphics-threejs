console.clear()
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
// import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {RectAreaLightHelper} from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
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
// 	generateEdges,
// 	isLineAbovePlane,
// 	isYProjectedTriangleDegenerate,
// 	isLineTriangleEdge,
// 	trimToBeneathTriPlane,
// 	edgesToGeometry,
// 	overlapsToLines,
// 	getProjectedOverlaps,
// 	isYProjectedLineDegenerate,
// 	compressEdgeOverlaps,
// } from '../../node_modules/three-mesh-bvh/example/utils/edgeUtils.js'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';


///////////////////////////////////////////////////
// ✧ MENU PANEL FOR POINTER LOCK CONTROLS MODE
///////////////////////////////////////////////


// const menuPanel = document.getElementById('menuPanel') as HTMLDivElement
// const startButton = document.getElementById('startButton') as HTMLInputElement
// startButton.addEventListener(
//     'click',
//     function () {
//         pointerControls.lock()
//     },
//     false
// )



////////////////////////////////////
// ✧ CANVAS ✧ SCENES ✧ CONSTANTS///
//////////////////////////////////


const canvas = document.querySelector("canvas");
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

textureLoad.setPath('img/')

const textureCube = textureLoad.load('photo_studio_01_1k.hdr', function(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
})


scene.fog = new THREE.FogExp2( 0x000000, 0.8 )

////////////////
// ✧ CAMERA  //
///////////////


const camera = new THREE.PerspectiveCamera(50, aspect, 0.01, 20000)
camera.position.x = 0
camera.position.y = 0.1
camera.position.z = 0.4
camera.lookAt(new THREE.Vector3(0, 0, 0))


//-- ORTHOGRAPHIC CAMERA

let orthoCamera
{
  const left = - 5
  const right = 5
  const top = 5
  const bottom = -5
  const near = 0.5
  const far = 500

  orthoCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far)
  orthoCamera.position.z = -1
  orthoCamera.lookAt(new THREE.Vector3(0, 0, 0))
}


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



const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
  powerPreference: "high-performance",
  antialias: true,
  stencil: true,
  depth: true,
})


renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor(0xf5f5f5)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
// renderer.xr.enabled = true
renderer.outputEncoding = sRGBEncoding
// renderer.shadowMap.type = THREE.VSMShadowMap
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1

// document.body.appendChild(renderer.domElement)


/////////////////
// ✧ CONTROLS ///
///////////////


const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0)
// controls.addEventListener('start', ()=> console.log("Controls start event"))
// controls.addEventListener('end', ()=> console.log("Controls end event"))
controls.enabled = true
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.autoRotate = false
controls.enableZoom = true
controls.autoRotateSpeed = 1.2
controls.zoomSpeed = 1.5
controls.panSpeed = 1
controls.minDistance = 0.1
controls.maxDistance = 55
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1


// / //// // ////////// ////
// ✧ POINTER LOCK CONTROLS - FIRST PERSON VIEW ///
///  ////////  /////// //

// const pointerControls = new PointerLockControls(camera, renderer.domElement)
// pointerControls.addEventListener('lock', () => (menuPanel.style.display = 'none'))
// pointerControls.addEventListener('unlock', () => (menuPanel.style.display = 'block'))

// const onKeyDown = function (event: KeyboardEvent) {
// switch (event.code) {
// case 'KeyW':
//     pointerControls.moveForward(0.25)
//     break
// case 'KeyA':
//     pointerControls.moveRight(-0.25)
//     break
// case 'KeyS':
//     pointerControls.moveForward(-0.25)
//     break
// case 'KeyD':
//     pointerControls.moveRight(0.25)
//     break
// }
// }
// document.addEventListener('keydown', onKeyDown, false)


// / //// // ////////// ////
// ✧ DRAG CONTROLS ///
///  ////////  /////// //


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


// / //// // ////////// ////
// ✧ TRANSFORM CONTROLS ///
///  ////////  /////// //


const transformControls = new TransformControls(camera, renderer.domElement)
// controls.enabled = !event.value
// transformControls.attach(cube)
// transformControls.setMode('rotate')
// scene.add(transformControls)

window.addEventListener('keydown', function (event) {
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


/////////////////
// ✧ LIGHTS ////
///////////////

RectAreaLightUniformsLib.init()


const color = 0xFFFFFF
const color2 = 0xFF0000
const intensity = 5
const width = 1
const height = 1
const light = new THREE.RectAreaLight(color, intensity, width, height);
const light2 = new THREE.RectAreaLight(color2, intensity, width, height);
light.position.set(0, 0, -0.25)
light2.position.set(0, 0, 0.26)
light.rotation.x = THREE.MathUtils.degToRad(-180)
light2.rotation.x = THREE.MathUtils.degToRad(-90)
light2.rotation.y = THREE.MathUtils.degToRad(-180)
scene.add(light, light2)
 
const helper = new RectAreaLightHelper(light);
const helper2 = new RectAreaLightHelper(light2);
light.add(helper, helper2);



/////////////////
// ✧ GRID HELPER ////
///////////////

// const gridHelper = new THREE.GridHelper(50, 400)
// gridHelper.position.y = 0.01
// scene.add(gridHelper)


/////////////////////////////////////////////////////////////////////////////
// LOADERS  
//

const fbxLoader = new FBXLoader()
const gltfLoader = new GLTFLoader()

/////////////////////////////////////////////////////////////////////////////
// Inner_KID 👦🏽 * Inner_KID 👦🏽 * Inner_KID 👦🏽 * Inner_KID 👦🏽   
////////////////////////////////////////////////////////////////////////////


let kidMixer;
let kid2Mixer;
let kidMaterial;
let kid;

fbxLoader.load(
  'models/innerKid/animations/walking.fbx', (object) => {
    kid = object
    kidMixer = new THREE.AnimationMixer(kid)
    const action = kidMixer.clipAction(kid.animations[0])
    action.play()

    kidMaterial = new THREE.MeshPhysicalMaterial({
      map: textureLoader.load("models/innerKid/tex/skin002/map.png"),
      metalness: 1.1,
      metalnessMap: textureLoader.load("models/fbx/curiousKid/tex/skin002/metalnessMap.png"),
      roughnessMap: textureLoader.load("models/fbx/curiousKid/tex/skin002/roughnessMap.png"),
      roughness: 4.5,
      // envMap: g_texture("neon", 4),
      envMapIntensity: 1,
      reflectivity: 0.2,
    })

    kid.traverse(function(object) {
      if (object.isMesh) {
        object.material = kidMaterial;
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

   	scene.add(kid)

    kid.scale.set(.0014, .0014, .0014)
    kid.position.set(0, -0.001, 0)
    kid.rotation.set(0, 0, 0)
    kid.addEventListener("click", (event) => {
      event.target.material.color.set(0xff0000);
      document.body.style.cursor = "pointer";
    });
  });


//--- PLANE ----------------------------------------

const geoFloor = new THREE.PlaneGeometry( 100, 100 )
const matFloor = new THREE.MeshPhongMaterial();
matFloor.color.set(0xf5f5f5)
matFloor.side =  THREE.DoubleSide
const planeMesh = new THREE.Mesh( geoFloor, matFloor );
planeMesh.rotation.x = - Math.PI * 0.5;
planeMesh.receiveShadow = false
planeMesh.position.set( 0, -0.01, 0)
scene.add(planeMesh)


////////////////////////////////////////////////////////////////////
// ✧ STATS
///////////////

// const stats = Stats()
// document.body.appendChild(stats.dom)


// -- RENDERING

function render() {
  renderer.render(scene, camera)
}

const clock = new THREE.Clock()
let previousTime = 0

function animate() {
  requestAnimationFrame(animate)

//   if (webcam.readyState === webcam.HAVE_ENOUGH_DATA) {
//   canvasCtx.drawImage(webcam as CanvasImageSource, 0, 0, webcamCanvas.width, webcamCanvas.height)
//   if (webcamTexture2D) webcamTexture2D.needsUpdate = true
// }

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime


  if (kidMixer) { kidMixer.update(deltaTime) }
  if (kid2Mixer) { kid2Mixer.update(deltaTime) }

  controls.update()

  scene.background = new THREE.Color(0x000000)

  requestAnimationFrame(render)

  // stats.update()

}

// -- Ω
animate()