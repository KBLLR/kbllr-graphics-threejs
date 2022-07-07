console.clear()
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { MD2CharacterComplex } from 'three/examples/misc/MD2CharacterComplex.js';
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

textureLoad.setPath('/img/')

const textureCube = textureLoad.load('photo_studio_01_1k.hdr', function(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping
})


//===================================================
// SCENE FOG & BACKGROUND
//===================================================

scene.fog = new THREE.Fog(0xffffff, 0.01, 1.5)
// scene.fog = new THREE.FogExp2( 0xffffff, 5.5 )

scene.background = new THREE.Color( 0xffffff )


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
renderer.setClearColor(0xffffff, 1)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
// renderer.xr.enabled = true
renderer.outputEncoding = sRGBEncoding
// renderer.shadowMap.type = THREE.VSMShadowMap
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2

// document.body.appendChild(renderer.domElement)


//===================================================
// ✧ ORBIT CONTROLS 
//===================================================


const controls = new OrbitControls(camera, renderer.domElement)
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
controls.maxDistance = 3
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1


//===================================================
// ✧ LIGHTS 
//===================================================


const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2.61)
hemiLight.position.set(0, 20, 0)
scene.add(hemiLight)

const light = new THREE.DirectionalLight( 0xffffff, 2.25 )
light.position.set( 20, 45, 50 )

light.castShadow = true
light.shadow.mapSize.width = 1024
light.shadow.mapSize.height = 512

light.shadow.camera.near = 1
light.shadow.camera.far = 1200

light.shadow.camera.left = - 1
light.shadow.camera.right = 1
light.shadow.camera.top = 3
light.shadow.camera.bottom = - 3

scene.add( light );
// scene.add( new THREE.CameraHelper( light.shadow.camera ) )


//===================================================
// ✧ GROUND 
//===================================================


const textureLoader = new THREE.TextureLoader()

const gGeometry = new THREE.PlaneGeometry( 16, 16)

const gMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, map: textureLoader.load( '/img/sciFi/base.png' )})
gMaterial.roughnessMap =  textureLoader.load( '/img/sciFi/roughness.png' )
gMaterial.metallicMap =  textureLoader.load( '/img/sciFi/metallic.png' )
gMaterial.normalMap =  textureLoader.load( '/img/sciFi/normal.png' )

const ground = new THREE.Mesh( gGeometry, gMaterial );
ground.rotation.x = - Math.PI / 2
ground.material.map.repeat.set( 64, 64 )
ground.material.map.wrapS = THREE.RepeatWrapping
ground.material.map.wrapT = THREE.RepeatWrapping
ground.material.map.encoding = THREE.sRGBEncoding
ground.receiveShadow = true;

scene.add( ground )


/////////////////////////////////////////////////////////////////////////////////////////
// ✧ GRID HELPER 
///////////////

const gridHelper = new THREE.GridHelper(40, 400)
gridHelper.position.y = 0.001
scene.add(gridHelper)

// TWEAKPANE CHARACTER ACTIONS

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
// ✧ CONTROLLER CHARACTER
///////////////

const params {
  decceleration: new THREE.Vector3(-0.0005, -0.0001, -5.0),
  acceleration: new THREE.Vector3(1, 0.25, 50.0),
  velocity: new THREE.Vector3(0, 0, 0),
}

const animations = []

const target = fbx
const mixer = new THREE.AnimationMixer(target)

const clip = target.animations[0]
const action = mixer.clipAction(clip)

const animationName = ''

animations[animationName] = {
    clip: clip,
    action: action,
  }


const _OnLoad = (string ='player@neutralIdle.fbx', animations =[]) => {
  const clip = animations[0]
  const action = mixer.clipAction(clip)

const input = new BasicCharacterControllerInput()
const loaderFBX = new FBXLoader()
const loader = loaderFBX.setPath('/models/player/')


loader.load('player@walking.fbx', (a) => { onLoad('walk', a); })
loader.load('player@standardWalk.fbx', (a) => { onLoad('standard walk', a); })
loader.load('player@running.fbx', (a) => { onLoad('run', a); })
loader.load('player@running2.fbx', (a) => { onLoad('run2', a); })
loader.load('player@happyIdle.fbx', (a) => { onLoad('happy idle', a); })
loader.load('player@neutralIdle.fbx', (a) => { onLoad('neutral idle', a); })
loader.load('player@offensiveIdle.fbx', (a) => { onLoad('offensive idle', a); })

const manager = new THREE.LoadingManager()

const onLoad 
const manager.onLoad = () => {stateMachine.SetState('neutral idle')}



const getAnimations() => { return animations }

const keys = [{
  forward: false,
  backward: false,
  left: false,
  right: false,
  space: false,
  shift: false,
}]

const stateMachine = new CharacterFSM(new BasicCharacterControllerProxy(animations))

loaderFBX.load(path, 'innerKid.fbx', (target) => {
    target.scale.setScalar(0.1)

    target.traverse(c => { c.castShadow = true })

    scene.add(target) 
})
  

  Update(timeInSeconds) {
    if (!this._target) {
      return;
    }

    this._stateMachine.Update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
      Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (this._stateMachine._currentState.Name == 'dance') {
      acc.multiplyScalar(0.0);
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R)

    const oldPosition = new THREE.Vector3()
    oldPosition.copy(controlObject.position)

    const forward = new THREE.Vector3(0, 0, 1)
    forward.applyQuaternion(controlObject.quaternion)
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0)
    sideways.applyQuaternion(controlObject.quaternion)
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds)
    forward.multiplyScalar(velocity.z * timeInSeconds)

    controlObject.position.add(forward)
    controlObject.position.add(sideways)

    oldPosition.copy(controlObject.position)

    if (this._mixer) {
      this._mixer.update(timeInSeconds)
    }
  }
}

const BasicCharacterControllerInput =>() {

   
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
    }
  }
}


class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
};


class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    AddState('idle', IdleState)
    AddState('walk', WalkState)
    AddState('run', RunState)
    AddState('dance', DanceState)
  }
};


class State {
  constructor(parent) {
    this._parent = parent
  }

  Enter() {}
  Exit() {}
  Update() {}
}


class DanceState extends State {
  constructor(parent) {
    super(parent)

    this._FinishedCallback = () => {
      this._Finished()
    }
  }

  get Name() {
    return 'happy idle';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['dance'].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState('idle');
  }

  _Cleanup() {
    const action = this._parent._proxy._animations['dance'].action;

    action.getMixer().removeEventListener('finished', this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {}
};


class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'walk';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['walk'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'run') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState('run');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};


class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'run';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['run'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'walk') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState('walk');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};


class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'idle';
  }

  Enter(prevState) {
    const idleAction = this._parent._proxy._animations['idle'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk')
    } else if (input._keys.space) {
      this._parent.SetState('dance')
    }
  }
}



const LoadAnimatedModel() => {
  const params = {
    camera: camera,
    scene: scene,
  }
  const controlsCharacter = new BasicCharacterController(params)
}


const loader = new FBXLoader()
const path = '/models/player/'
const LoadAnimatedModelAndPlay(path, modelFile, animFile, offset) => {
  loader.setPath(path)
  loader.load(modelFile, (fbx) => {
    fbx.scale.setScalar(0.1);
    fbx.traverse(c => {
      c.castShadow = true;
    })
    fbx.position.copy(offset);

    const anim = new FBXLoader();
    anim.setPath(path);
    anim.load(animFile, (anim) => {
      const m = new THREE.AnimationMixer(fbx);
      mixers.push(m);
      const idle = m.clipAction(anim.animations[0]);
      idle.play();
    })

    scene.add(fbx)
  })
}

const loader = new GLTFLoader()

loader.load('/models/player@twearking.glb', (gltf) => {
  gltf.scene.traverse(c => {
    c.castShadow = true
  })
  scene.add(gltf.scene)
})



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