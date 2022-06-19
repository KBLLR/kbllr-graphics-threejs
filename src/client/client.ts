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
	
},
material: 
{
	color: "#2F4F4F",
	metal: 0.66,
	rough: 0.3,
	alpha: 1.0,
	glass: 1.0,
	thick: 2.8,
	reflex: 1.0,
	clearcoat: 0.4,
	coatrough: 0.08,
	normal: 1.43,
	envInt: 5,
	ior: 1.4,
	disc: 0.04,
	ao: 0.3,
	specIntensity: 0.01,
	sheen: 0.5,
	dispScale: new THREE.Vector2(2, 2),
	normalScale: new THREE.Vector2(1, 1),
	dither: true,
},
	background: "#000000",
}

//--

const sphereData = {
    radius: 1,
    widthSegments: 280,
    heightSegments: 280,
    phiStart: 0,
    phiLength: Math.PI * 4,
    thetaStart: 100,
    thetaLength: Math.PI * 4, 
}

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
scene.background = new THREE.Color(0xFFFFF0);

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

const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 1000)

camera.position.z = -4 
camera.lookAt(new THREE.Vector3(0, 0, 0)) 

////////////////////////////////////////////////////////////////////
// ✧ RENDERER
///////////////

let background = 0x6B8E23
let backgroundAlpha = 1

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true} )

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

const sphereGeometry = new THREE.SphereGeometry()

const c_tor = new THREE.TorusGeometry(1.5, 0.2, 32, 100);


//==================

////////////////////////////////////////////////////////////////////
// ✧ MATERIALS > THREE.MATERIAL 
///////////////

const wallMaterial = new THREE.MeshPhysicalMaterial({
	side: THREE.DoubleSide,
	map: g_texture("neon", 4),
	normalMap: g_texture("neon", 4),
	normalScale: new THREE.Vector2(3, 3),
	transmissionMap: g_texture("neon", 4),
	envMap: g_texture("neon", 4),
	envMapIntensity: 10,
	clearcoatMap: g_texture("neon", 4),
	displacementMap: g_texture("neon", 4),
	displacementScale: 0.16,
	precision: "highp",
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
	//---"Reset" > RANDOM > needsUpdate = true;
	side: THREE.DoubleSide,
	precision: "highp",
	map: g_texture("New York", 4),
	alphaMap: g_texture("New York", 4),
	normalMap: g_texture("New York", 4),
	normalScale: new THREE.Vector2(3, 3),
	transmissionMap: g_texture("New York", 4), 
	envMap: g_texture("New York", 4),
	metalnessMap: g_texture("New York", 4),
	roughnessMap: g_texture("New York", 4),
	clearcoatMap: g_texture("New York", 4),
	clearcoatNormalScale: new THREE.Vector2(3, 3),
	displacementMap: g_texture("New York", 4),
});

glassMaterial.sheenRoughnessMap= g_texture("New York", 4)
glassMaterial.sheenColorMap= g_texture("New York", 4)

////////////////////////////////////////////////////////////////////
// ✧ MESHES
///////////////

const sphere = new THREE.Mesh(sphereGeometry, glassMaterial)
scene.add(sphere)

const c_mesh = new THREE.Mesh(c_tor, wallMaterial);
c_mesh.rotation.z = (90 * Math.PI) / 180;
c_mesh.name = "object3D";

scene.add(c_mesh)

////////////////////////////////////////////////////////////////////
// ✧ STATS
///////////////

const stats = Stats()  
document.body.appendChild(stats.dom) 

////////////////////////////////////////////////////////////////////
// ✧ GUI - TWEAKPANE
///////////////

const pane = new Pane({title: "Configuration"})

const c_folder = pane.addFolder({title: "Camera" ,expanded: true });
c_folder.addInput(PARAMS.camera, "speed", {min: 0.05,max: 3,label: "Speed"});

const s_folder = pane.addFolder({ title: "Scene", expanded: true });
s_folder.addInput(PARAMS, "background", { label: "BG" });

const fl = pane.addFolder({ title: "Object" });

fl.addInput(PARAMS.material, "color", { label: "Color" });
fl.addButton({ title: "Reset" }).on("click", () => {
	PARAMS.material.metal = 0.0
	PARAMS.material.rough = 0.4
	PARAMS.material.glass = 1.0
	PARAMS.material.thick = 0.18
	PARAMS.material.reflex = 0.5
	PARAMS.material.coatrough = 0.0
	PARAMS.material.clearcoat = 0.0
	PARAMS.material.ior = 1
	PARAMS.material.ao = 0.5
	PARAMS.material.normal = 1.4
	PARAMS.material.dither = false
	PARAMS.material.disc = 0.1
	PARAMS.material.envInt = 2.0
	PARAMS.material.specIntensity = 0.3
	PARAMS.material.sheen = 1.0
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
});

fl.addInput(PARAMS.material, "metal", {min: 0.01,max: 1.0,label: "Metalness"});
fl.addInput(PARAMS.material, "rough", {min: 0.01,max: 1.0,label: "Roughness"});
fl.addInput(PARAMS.material, "alpha", {min: 0.01,max: 5.0,label: "Opacity"});
fl.addInput(PARAMS.material, "glass", {min: 0.01,max: 2.0,label: "Glass"});
fl.addInput(PARAMS.material, "thick", {min: 0.01,max: 1.0,label: "Thickness"});
fl.addInput(PARAMS.material, "reflex", {min: 0.01,max: 2.0,label: "Reflectivity"});
//===========================
fl.addSeparator();
//===========================
fl.addInput(PARAMS.material, "clearcoat", {min: 0.01, max: 2.0, label: "Clearcoat"});
fl.addInput(PARAMS.material, "coatrough", {min: 0.01, max: 2.0, label: "CCoatRoughness"});
//===========================
fl.addSeparator();
//===========================
const ft = pane.addFolder({ title: 'Advanced', expanded: true})

ft.addInput(PARAMS.material, "dither", { label: "Dithering" })
ft.addInput(PARAMS.material, "ior", { min: 0.01, max: 2.0, label: "Ior" })
ft.addInput(PARAMS.material, "ao", { min: 0.01, max: 2.0, label: "Ambient Oc" })
ft.addInput(PARAMS.material, "disc", { min: 0.0, max: 1.0, label: "Disp Scale" })
ft.addInput(PARAMS.material, "normal", { min: 0.01, max: 4.0, label: "Normal" })
ft.addInput(PARAMS.material, "envInt", { label: "Intensity", step: 10 })

//===========================

//--

	const hemis_light = new THREE.HemisphereLight(0xeeeeff, 0xaaaacc, 2);
	const point_light = new THREE.PointLight(0xFAF0E6, 5);

	const lights = new THREE.Group();

	lights.add(hemis_light)
	lights.add(point_light)
	lights.position.set(2, 2, 2);

	scene.add(lights)

//--

////////////////////////////////////////////////////////////////////
// ✧ HELPERS
///////////////


	// const gridHelper = new THREE.GridHelper(40, 40, PARAMS.lines, PARAMS.lines);
	// gridHelper.position.y = -1; 

	const axesHelper = new THREE.AxesHelper();
	const helpers = new THREE.Group();

	// helpers.add(gridHelper);
	// helpers.add(axesHelper);
	// scene.add(helpers)

//--

const debug = document.getElementById('debug1') as HTMLDivElement 

const clock = new THREE.Clock();

	function renderMaterial() {
		const element = glassMaterial;
		element.color.set(PARAMS.material.color);
		element.sheen = PARAMS.material.sheen;
		element.sheenRoughness = PARAMS.material.sheen;
		element.dithering = PARAMS.material.dither;
		element.metalness = PARAMS.material.metal;
		element.roughness = PARAMS.material.rough;
		element.opacity = PARAMS.material.alpha;
		element.transmission = PARAMS.material.glass;
		element.ior = PARAMS.material.ior;
		element.thickness = PARAMS.material.thick;
		element.reflectivity = PARAMS.material.reflex;
		element.clearcoat = PARAMS.material.clearcoat * 5;
		element.clearcoatRoughness = PARAMS.material.coatrough;
		element.envMapIntensity = PARAMS.material.envInt;
		element.displacementScale = PARAMS.material.disc * 0.1;
		element.aoMapIntensity = PARAMS.material.ao;
		element.normalScale.set(PARAMS.material.normal, PARAMS.material.normal);
		element.needsUpdate = true;
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

	//===========================
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
	pane.refresh()
	scene.background = new THREE.Color(PARAMS.background);
	renderMaterial()
	regenerateSphereGeometry()

    renderer.render(scene, camera)

}
animate()

