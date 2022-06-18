console.clear();
import './css/style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { Pane } from 'tweakpane'
import { ButtonProps, TabParams } from '@tweakpane/core';
import { FolderParams } from 'tweakpane';
import { PaneConfig } from 'tweakpane/dist/types/pane/pane-config';


////////////////////////////////////////////////////////////////////
// ✧ GROUPS
///////////////

const s_group = new THREE.Group();
const b_group = new THREE.Group();
const t_group = new THREE.Group();

////////////////////////////////////////////////////////////////////
// ✧ BUTTON SCREENSHOT
///////////////

const buttonStyles = `
  .button {
    background: chocolate;
    box-shadow: 0px 5px 0px 0px #c71e1e;
    cursor: pointer;
    padding: 12px 16px;
    margin: 12px;
    border-radius: 5px;
    color: white;
    font-size: 24px;
    position: fixed;
    z-index: 5;
    bottom: 0, 
    right:0;
  }

  .button:active {
    transform: translateY(4px);
    box-shadow: none;
  }

  .button[disabled] {
    pointer-events: none;
    opacity: 0.7;
  }
`


////////////////////////////////////////////////////////////////////
// ✧ GENERATIVE DATA MATERIAL
///////////////

const Template = "https://i.ibb.co/jbWcDxb/Frame-15.png"

const g_texture = (src, repeat: 4) => {
	const path = `https://source.unsplash.com/random/?${src}`;
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
	return preload;
};

////////////////////////////////////////////////////////////////////
// ✧ PARAMS
////////////////

const PARAMS = {
camera: 
{
	speed: 0.1,
	wiggle: 5
},
material: 
{
	color: "#CCCCDD",
	metal: 0.0,
	rough: 0.4,
	alpha: 1.0,
	glass: 1.15,
	thick: 0.58,
	reflex: 0.5,
	clearcoat: 0.0,
	coatrough: 0.08,
	normal: 1.43,
	envInt: 10,
	ior: 1.0,
	disc: 0.0,
	ao: 1.0,
	dither: true
},
	background: "#e3f6ff",
	lines: "#202030",
}

//--

const sphereData = {
    radius: 1,
    widthSegments: 180,
    heightSegments: 180,
    phiStart: 0,
    phiLength: Math.PI * 4,
    thetaStart: 0,
    thetaLength: Math.PI * 4, 
}

//--

// const cubeData = {
//     width: 2,
//     height: 2,
//     depth: 2,
//     widthSegments:  2,
//     heightSegments:  2,
//     depthSegments:  2
// }

//--


// To GET THE WORLD TRANSFORMS OF AN OBJECT

// const objectsWorldPosition = new THREE.Vector3()  
// object.getWorldPosition(objectsWorldPosition)  
// console.log(objectsWorldPosition)  

// const objectsWorldDirection = new THREE.Vector3()  
// object.getWorldDirection(objectsWorldDirection)  
// console.log(objectsWorldDirection)  

// const objectsWorldQuaternion = new THREE.Quaternion()  
// object.getWorldQuaternion(objectsWorldQuaternion)  
// console.log(objectsWorldQuaternion)  

// const objectsWorldScale = new THREE.Vector3()  
// object.getWorldScale(objectsWorldScale)  
// console.log(objectsWorldScale) 


////////////////////////////////////////////////////////////////////
// ✧ CANVAS
///////////////

const canvas = document.querySelector("canvas");

////////////////////////////////////////////////////////////////////
// ✧ SCENE
///////////////

const scene = new THREE.Scene()
// scene.add(new THREE.AxesHelper(5))
scene.background = new THREE.Color(0xe3f6ff);

////////////////////////////////////////////////////////////////////
// ✧ RESPONSIVENESS 
///////////////

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

//--

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
// ✧ CAMERA
///////////////

const camera = new THREE.PerspectiveCamera(120, sizes.width / sizes.height, 0.1, 1000)

camera.position.z = -3 
camera.lookAt(new THREE.Vector3(0, 0, 0)) 

////////////////////////////////////////////////////////////////////
// ✧ RENDERER
///////////////

let background = 0xe3f6ff
let backgroundAlpha = 1


const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false } )

renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor(background, backgroundAlpha)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
// renderer.xr.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping

document.body.appendChild(renderer.domElement)

////////////////////////////////////////////////////////////////////
// ✧ SCREENSHOT BUTTON
///////////////

export function addScreenshotButton(webgl) {
  document.head.innerHTML = `${document.head.innerHTML}<style>${buttonStyles}</style>`

  const screenshotButton = document.createElement('div')
  screenshotButton.classList.add('button')

  screenshotButton.textContent = '📸 Save screenshot'
  screenshotButton.addEventListener('click', () => webgl.saveScreenshot())

  document.body.appendChild(screenshotButton)
}

////////////////////////////////////////////////////////////////////
// ✧ CONTROLS
///////////////

const controls = new OrbitControls(camera, renderer.domElement)

controls.target.set(0, 0, 0)
controls.enabled = true
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.autoRotate = true
controls.enableZoom = true
controls.autoRotateSpeed = 0.9
controls.minDistance = 0.1
controls.maxDistance = 6
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1

////////////////////////////////////////////////////////////////////
// ✧ GEOMETRIES > THREE.BUFFERGEOMETRY after r125
/////////////////

const boxGeometry = new THREE.BoxGeometry()
const sphereGeometry = new THREE.SphereGeometry()
const icosahedronGeometry = new THREE.IcosahedronGeometry()
const circleGeometry = new THREE.CircleGeometry( 5, 32 );

//==================

//-- EDGES GEOMETRY
const geometry = new THREE.BoxGeometry( 100, 100, 100 );
const edges = new THREE.EdgesGeometry( geometry );
const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) );

//==================

//-- THREE.BufferGeometry -- Create a line with points.

const points = []

points.push(new THREE.Vector3(-5, 0, 0))
points.push(new THREE.Vector3(5, 0, 0))
points.push(new THREE.Vector3(0, 3, 2))
points.push(new THREE.Vector3(-5, 13, 0))

let bufferGeometry = new THREE.BufferGeometry().setFromPoints( points )
let lineBG = new THREE.Line(bufferGeometry, new THREE.LineBasicMaterial({ color: 0x888888 }))
// scene.add(lineBG)

////////////////////////////////////////////////////////////////////
// ✧ MATERIALS > THREE.MATERIAL 
///////////////

const wallMaterial = new THREE.MeshPhysicalMaterial({
	map: g_texture("neon", 4),
	alphaMap: g_texture("neon", 4),
	normalMap: g_texture("neon", 4),
	normalScale: new THREE.Vector2(3, 3),
	transmissionMap: g_texture("neon", 4),
	envMap: g_texture("neon", 4),
	envMapIntensity: 10,
	clearcoatMap: g_texture("neon", 4),
	displacementMap: g_texture("neon", 4),
	displacementScale: 0.16,
	displacementBias: 0.16,
	precision: "highp",
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
	map: g_texture("waves", 4),
	side: THREE.DoubleSide,
	alphaMap: g_texture("waves", 4),
	normalMap: g_texture("waves", 4),
	normalScale: new THREE.Vector2(1, 2),
	aoMap: g_texture("waves", 4),
	aoMapIntensity: 2.4,
	ior: 0.5,
	reflectivity: 0.05,
	transmission: 1, 
	transmissionMap: g_texture("waves", 4), 
	envMap: g_texture("waves", 4),
	envMapIntensity: 4.5,
	metalnessMap: g_texture("waves", 4),
	roughness: 0.01,
	roughnessMap: g_texture("waves", 4),
	clearcoat: 0.5,
	clearcoatMap: g_texture("waves", 4),
	clearcoatNormalMap: g_texture("waves", 4),
	clearcoatNormalScale: new THREE.Vector2(3, 2),
	displacementMap: g_texture("waves", 4),
	displacementScale: 0.04,
	displacementBias: 0.3,
	precision: "highp",
	color: 0x000000,
	emissive: 0xF5F5F5,
	emissiveMap: g_texture("waves", 4),
	emissiveIntensity: 0.5,
	dithering: true,
	sheen: 1.0,
	sheenRoughness: 0.1,
	specularIntensity: 0.3,
	specularIntensityMap: g_texture("waves", 4),
	// flatShading: false,
	// combine: THREE.AddOperation,
});

glassMaterial.sheenRoughnessMap= g_texture("waves", 4)
glassMaterial.sheenColorMap= g_texture("waves", 4)
glassMaterial.thicknessMap= g_texture("waves", 4)
glassMaterial.thickness= 1.2
////////////////////////////////////////////////////////////////////
// ✧ MESHES
///////////////

// const cube = new THREE.Mesh(geometry, material)
// scene.add(cube)

const sphere = new THREE.Mesh(sphereGeometry, wallMaterial)
sphere.rotation.x = Math.PI * -0.5
sphere.rotation.z = Math.PI * -0.5
scene.add(sphere)

// const cube = new THREE.Mesh(boxGeometry, glassMaterial)
// cube.scale.set(2, 2, 2)
// scene.add(cube)


////////////////////////////////////////////////////////////////////
// ✧ ANIMATIONS
///////////////

const stats = Stats()  
document.body.appendChild(stats.dom) 

////////////////////////////////////////////////////////////////////
// ✧ GUI - TWEAKPANE
///////////////

const pane = new Pane({
	title: "Configuration"
})

const c_folder = pane.addFolder({
	title: "Camera" ,expanded: false
});

c_folder.addInput(PARAMS.camera, "speed", {
	min: 0.05,
	max: 3,
	label: "Speed"
});

c_folder.addInput(PARAMS.camera, "wiggle", {
	min: 0,
	max: 5,
	label: "Wiggle"
});

const s_folder = pane.addFolder({ 
	title: "Scene", 
	expanded: false 
});

s_folder.addInput(PARAMS, "background", { 
	label: "BG" 
});

const fl = pane.addFolder({ title: "Object" });

fl.addInput(PARAMS.material, "color", { label: "Color" });
fl.addButton({ title: "Reset" }).on("click", () => {
	PARAMS.material.metal = 0.0;
	PARAMS.material.rough = 0.4;
	PARAMS.material.glass = 1.15;
	PARAMS.material.thick = 0.18;
	PARAMS.material.reflex = 0.5;
	PARAMS.material.coatrough = 0.08;
	PARAMS.material.clearcoat = 0.01;
	PARAMS.material.ior = 1.0;
	PARAMS.material.ao = 1.0;
	PARAMS.material.normal = 1.43;
	PARAMS.material.dither = false;
	PARAMS.material.disc = 0.0;
	PARAMS.material.envInt = 2.0;
	pane.refresh();
});

fl.addButton({ title: "Random" }).on("click", () => {
	PARAMS.material.metal = Math.random();
	PARAMS.material.rough = Math.random();
	PARAMS.material.glass = 0.5 + Math.random();
	PARAMS.material.thick = Math.random();
	PARAMS.material.reflex = Math.random();
	PARAMS.material.coatrough = Math.random();
	PARAMS.material.clearcoat = Math.random();
	PARAMS.material.ior = Math.random();
	PARAMS.material.ao = Math.random();
	PARAMS.material.normal = Math.random();
	PARAMS.material.envInt = 2.0;
	pane.refresh();
});

fl.addInput(PARAMS.material, "metal", {
	min: 0.01,
	max: 1.0,
	label: "Metalness"
});

fl.addInput(PARAMS.material, "rough", {
	min: 0.01,
	max: 1.0,
	label: "Roughness"
});

fl.addInput(PARAMS.material, "alpha", {
	min: 0.01,
	max: 5.0,
	label: "Opacity"
});

fl.addInput(PARAMS.material, "glass", {
	min: 0.01,
	max: 2.0,
	label: "Glass"
});

fl.addInput(PARAMS.material, "thick", {
	min: 0.01,
	max: 1.0,
	label: "Thickness"
});

fl.addInput(PARAMS.material, "reflex", {
	min: 0.01,
	max: 2.0,
	label: "Reflectivity"
});

//===========================
fl.addSeparator();
//===========================

fl.addInput(PARAMS.material, "clearcoat", {
	min: 0.01,
	max: 2.0,
	label: "Clearcoat"
});

fl.addInput(PARAMS.material, "coatrough", {
	min: 0.01,
	max: 2.0,
	label: "CCoatRoughness"
});

//===========================
fl.addSeparator();
//===========================

const ft = fl.addFolder({ title: 'Advanced', expanded: false})

ft.addInput(PARAMS.material, "dither", { label: "Dithering" });

ft.addInput(PARAMS.material, "ior", { min: 0.01, max: 2.0, label: "Ior" });

ft.addInput(PARAMS.material, "ao", {
	min: 0.01,
	max: 2.0,
	label: "Ambient Oc"
});

ft.addInput(PARAMS.material, "disc", {
	min: 0.0,
	max: 1.0,
	label: "Disp Scale"
});

ft.addInput(PARAMS.material, "normal", {
	min: 0.01,
	max: 4.0,
	label: "Normal"
});

ft.addInput(PARAMS.material, "envInt", {
	label: "Intensity",
	step: 10
});

//===========================

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

// function regenerateCubeGeometry() {
// const newCubeGeometry = new THREE.BoxGeometry(
//     cubeData.width,
//     cubeData.height,
//     cubeData.depth,
//     cubeData.widthSegments,
//     cubeData.heightSegments,
//     cubeData.depthSegments,
// )
// cube.geometry.dispose()
// cube.geometry = newCubeGeometry
// }

//===========================

let floor_geo;
let floor_mat;
let floor_mesh;

const createFloor = () => {
	floor_geo = new THREE.BoxGeometry(1, 1, 0.5);
	floor_mat = new THREE.MeshNormalMaterial();
	floor_mesh = new THREE.Mesh(floor_geo, floor_mat);
	floor_mesh.position.z = -1;
	return floor_mesh;
};

//--

let wall_geo;
let wall_mat;
let wall_mesh;

const createWall = () => {
	wall_geo = new THREE.PlaneGeometry(4, 4);
	wall_mat = new THREE.MeshBasicMaterial( { map: g_texture("neon", 4) });
	wall_mesh = new THREE.Mesh(wall_geo, glassMaterial);
	wall_mesh.position.z = -3;
	wall_mesh.name = "wallpaper";
	//--
	return wall_mesh;
};

//--

let ball_geo;
let ball_mat;
let ball_mesh;

const createBall = () => {
	ball_geo = new THREE.SphereGeometry(0.3, 2);
	ball_mat = new THREE.MeshBasicMaterial();
	ball_mesh = new THREE.Mesh(ball_geo, ball_mat);
	//--
	return ball_mesh;
};

//--

let c_geo;
let c_tor;
let c_tog;
let c_mesh;

const createElements = () => {
	c_geo = new THREE.IcosahedronGeometry(1, 6);
	c_tor = new THREE.TorusGeometry(1, 0.4, 32, 100);
	c_tog = new THREE.TorusKnotGeometry(0.8, 0.3, 200, 16,4,3);

	c_mesh = new THREE.Mesh(c_tor, wallMaterial);
	c_mesh.rotation.z = (90 * Math.PI) / 180;
	c_mesh.name = "object3D";
	//--
	return c_mesh;
};

//--

let hemis_light;
let point_light;
let lights;

const createLights = () => {
	hemis_light = new THREE.HemisphereLight(0xeeeeff, 0xaaaacc, 8);
	point_light = new THREE.PointLight(0xFAF0E6, 5);
	point_light.position.set(2, 2, 2);
	lights = new THREE.Group();
	lights.add(hemis_light);
	lights.add(point_light);
	return lights;
};

//--

let gridHelper;
let axesHelper;
let helpers;

const createHelpers = () => {
	gridHelper = new THREE.GridHelper(20, 20, PARAMS.lines, PARAMS.lines);
	gridHelper.position.y = -1;
	axesHelper = new THREE.AxesHelper();
	helpers = new THREE.Group();
	helpers.add(gridHelper);
	helpers.add(axesHelper);
	return helpers;
};

//--

const debug = document.getElementById('debug1') as HTMLDivElement 

////////////////////////////////////////////////////////////////////
// ✧ ANIMATIONS
///////////////

function animate() {
    requestAnimationFrame(animate)


    controls.update()

    render()

    debug.innerText =  'Matrix\n' + sphere.matrix.elements.toString().replace(/,/g, '\n') 

    stats.update()
}

////////////////////////////////////////////////////////////////////
// ✧ RENDER
///////////////

function render() {

	regenerateSphereGeometry()

    renderer.render(scene, camera)

}
animate()

