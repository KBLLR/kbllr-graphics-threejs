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
	BloomEffect,
	VignetteEffect
} from '../../node_modules/postprocessing/build/postprocessing.esm.js';
import { Pane } from 'tweakpane'
import { ButtonProps, TabParams } from '@tweakpane/core'
import { FolderParams } from 'tweakpane'
import { PaneConfig } from 'tweakpane/dist/types/pane/pane-config'
import canvasScreenshot from 'canvas-screenshot';

////////////////////////////////////////////////////////////////////
// ✧ GENERATIVE DATA MATERIAL
///////////////

const Template = "https://unsplash.com/photos/QwoNAhbmLLo"
let arrayTop = [ "geometry","New York","Universe","aurora vorearis","northern lights","neon" ]
let topic = arrayTop[Math.floor(Math.random() * arrayTop.length)]
console.log(topic)

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


////////////////////////////////////////////////////////////////////
// ✧ RANDOMIZERS
////////////////

//--Random Color Generator
var rRGB = () => Math.random() * 256 >> 0
var randRGB = `rgb(${rRGB()}, ${rRGB()}, ${rRGB()})`
console.log(randRGB)

//--Random PARAM between 0.1 and 1.0
var rParam = () => Math.random() * 1.0 >> 0.1
var randPARAM = `rParam()`
console.log(randPARAM)

//--Random...


//--Parameters Scene + Materials

const PARAMS = {
	camera: 
	{ 
		speed: 0.1,
		wiggle: 5, 
	},
	scene: 
	{ 
		background: 0xe3f6ff,
	},
	gridHelper:
	{
		size: 40,
		divisions: 200,
		hidden: true,
	},
	light:
	{
		color: 0xF5F5F5, //--int
		intensity: 4.5, //--flt
	},
	dirLight:
	{
		castShadow: true, //--bool
		position: {x: 1, y: 6, z: -1}, //--Vector3
		target: {x: 0, y: 0, z: 0}, //--Object3D
	},
	material_1: 
	{ 
		color: "rgb(10, 10, 10, 1)",
		metal: 0.88,
		attColor: "rgb(255, 255, 255, 1)",
		attDist:0.2,
		rough: 0.66,
		alpha: 1.0, //opacity
		glass: 1.0,
		sheen: 1.0,
		sheenR: 0.5,
		ior: 1.5,				//--X
		thick: 8.0,      //
		reflect: 0.1,   //--It has no effect when metalness is 1.0
		clearcoat: 0.6, //
		coatrough: 0.85, //
		envInt: 0.21,
		emissive: "rgb(16, 10, 10, 1)", 
		emissiveIntensity: 2.45,
		displ: 0.1,
		displBias: 0.5,
		ao: 0.35,
		normal: 0.1,
		dither: true,
		transparent: true,
		combine: THREE.AddOperation,
	},
	material_2: 
	{
		map: g_texture("neon", 4),
		normalMap: g_texture("neon", 4),
		normalScale: new THREE.Vector2(1, 1),
		sheenColor: 0xD8BFD8,
		sheenRoughnessMap: g_texture("neon", 4),
		specularColor: 0xF5F5F5,
		// Volume
		thickness: 1.5,
		thicknessMap: g_texture("neon", 4), // stores on the G channel
	}
}

//============== Data Geometries
const sphereData = {
    radius: 2,
    widthSegments: 180,
    heightSegments: 140,
    phiStart: 0,
    phiLength: Math.PI * 2,
    thetaStart: 0,
    thetaLength: Math.PI * 2, 
}
//--
const torusKnotData = {
    radius: 1,
    tube: 0.1,
    tubularSegments: 300,
    radialSegments: 20,
//-- p = xtimes the geometry winds around its axis of rotational symmetry. Default is 2.
    p: 1,
//-- q = xtimes the geometry winds around a circle in the interior of the torus. Default is 3
    q: 3,
}


////////////////////////////////////////////////////////////////////
// ✧ CANVAS
///////////////

const canvas = document.querySelector("canvas");

////////////////////////////////////////////////////////////////////
// ✧ SCENE
///////////////

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xe3f6ff);

//=============Sizes

const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

const canvas_width = sizes.width
const canvas_height = sizes.height


////////////////////////////////////////////////////////////////////
// ✧ HELPERS 
///////////////

//===========================GRID

const gridHelper = new THREE.GridHelper(100, 100)
gridHelper.position.y = 0;
scene.add(gridHelper)


//=========================== POSITIONING
	
const axesHelper = new THREE.AxesHelper();
	//scene.add(axesHelper);


////////////////////////////////////////////////////////////////////
// ✧ CAMERA
///////////////
const aspect = sizes.width / sizes.height
const vFov = 59 //--calculateVerticalFoV(90, Math.max(aspect, 16 / 9));
const camera = new THREE.PerspectiveCamera(vFov, aspect, 0.01, 20000)

camera.position.z = -12 
camera.lookAt(new THREE.Vector3(0, 0, 0)) 

////////////////////////////////////////////////////////////////////
// ✧ RESPONSIVENESS 
///////////////

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

////////////////////////////////////////////////////////////////////
// ✧ RENDERER
///////////////

const renderer = new THREE.WebGLRenderer ({
	powerPreference: "high-performance",
	antialias: false,
	stencil: false,
	depth: true,
});

renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor( 0xf5f5f5 ,1)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
// renderer.xr.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.LinearEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2

document.body.appendChild(renderer.domElement)

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
controls.autoRotateSpeed = 1
controls.minDistance = 0.1
controls.maxDistance = 15
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1

////////////////////////////////////////////////////////////////////
// ✧ LIGHTS + group
///////////////

// const hemis_light = new THREE.HemisphereLight(0xF5FFFA, 0xFFDEAD, 7);
// scene.add(hemis_light)

const pLight0 = new THREE.PointLight(0xD2691E, 7);
pLight0.position.set(3, 3, 3)

const pLight1 = new THREE.PointLight(0xffffff, 7);
pLight1.position.set(-3, -3, -3)

scene.add(pLight0, pLight1)

const dirLight = new THREE.DirectionalLight(PARAMS.light.color, PARAMS.light.intensity)
dirLight.position.set(1,  2, -1)
dirLight.castShadow = true
scene.add( dirLight)

dirLight.shadow.mapSize.width = 1024; // default
dirLight.shadow.mapSize.height = 1024; // default
dirLight.shadow.camera.near = 0.1; // default
dirLight.shadow.camera.far = 10000; // default


////////////////////////////////////////////////////////////////////
// ✧ GEOMETRIES > THREE.BUFFERGEOMETRY after r125
/////////////////

const sphereGeometry = new THREE.SphereGeometry()

// const c_tor = new THREE.TorusGeometry(1.5, 0.2, 32, 100);

const toursKnotGeo = new THREE.TorusKnotGeometry()


////////////////////////////////////////////////////////////////////
// ✧ MATERIALS > THREE.MATERIAL 
///////////////

//=== MATERIAL #1

const material_1A = new THREE.MeshPhysicalMaterial({

	map: g_texture("geometry", 4),
	attenuationDistance: 1.0,

	emissive: 0xF0E68C,
	emissiveMap: g_texture("geometry", 4),
	emissiveIntensity: 1.0,

	aoMap: g_texture("geometry", 4),
	aoMapIntensity: 1.0,

	envMap: g_texture("neon", 4),
	envMapIntensity: 6,

	reflectivity: 1.2,

	normalMap: g_texture("geometry", 4),
	normalScale: new THREE.Vector2(4, 4),

	metalness:0.05,
	metalnessMap: g_texture("geometry", 4),

	roughness: 0.2,
	roughnessMap: g_texture("geometry", 4),

	sheen: 1.0,
	sheenRoughness: 0.5,
	ior: 1.5,
	opacity: 1.0,

	clearcoat: 0.8,
	clearcoatRoughness: 0.5,
	clearcoatRoughnessMap: g_texture("geometry", 4),
	clearcoatNormalMap: g_texture("geometry", 4),
	clearcoatNormalScale: new THREE.Vector2(0.2, 0.2),

	displacementMap: g_texture("geometry", 4),
	displacementScale: 0.3,
	displacementBias: 1.3,

	flatShading: false, 
	side: THREE.FrontSide,
	precision: "highp",
});

material_1A.sheenRoughnessMap = g_texture("geometry", 4)
material_1A.sheenColorMap = g_texture("geometry", 4)

//=== MATERIAL #2

const material_2 = new THREE.MeshPhysicalMaterial({
	envMap: g_texture("neon", 4),
	envMapIntensity: 6,
	reflectivity:0.5,
	sheen: 0.7,
	sheenRoughness: 0.3,
	clearcoat: 0.5,
	clearcoatMap: g_texture("neon", 4),
	clearcoatNormalMap: g_texture("neon", 4),
	clearcoatNormalScale: new THREE.Vector2(3, 3),
	clearcoatRoughness: 0.8,
	// Refraction
	ior: 1.2, //--max is 2.33
	transmission: 1.0,
	transmissionMap: g_texture("neon", 4), 
	specularIntensity: 0.2,
	specularIntensityMap: g_texture("neon", 4),
	specularColorMap: g_texture("neon", 4),
	// Form
	displacementMap: g_texture("neon", 4),
	displacementScale: 0.5,
	// Rendering
	side: THREE.DoubleSide,
	precision: "highp",
	flatShading: false, 
});


////////////////////////////////////////////////////////////////////
// ✧ MESHES + Group
///////////////

const meshGroup = new THREE.Group

//--- SPHERE

const sphere = new THREE.Mesh(sphereGeometry, material_1A)
scene.add(sphere)

//--- TORUS

// const c_mesh = new THREE.Mesh(c_tor, material_2);
// c_mesh.rotation.z = (90 * Math.PI) / 180;
// c_mesh.castShadow = true;
// c_mesh.name = "object3D";

// scene.add(c_mesh)

//--- TORUS_KNOT

const torusKnot = new THREE.Mesh(toursKnotGeo, material_2)
scene.add(torusKnot)


////////////////////////////////////////////////////////////////////
// ✧ GUI - TWEAKPANE
///////////////

//==========Panes

// const paneScene = new Pane({title: "Scene"})
// const paneHelpers = new Pane({title: "Helpers"})
// const paneMaterials = new Pane({title: "Materials"})
// const paneMeshes= new Pane({title: "Meshes"})
// const paneButtons = new Pane({title: "Buttons"})

//===========PANE SCENE
const paneScene = new Pane({title: "Scene",container: document.getElementById('c--Scene'), expanded: false})

//===========CAMERA FOLDER
const cameraF = paneScene.addFolder({title: "Camera" ,expanded: false })
cameraF.addInput(PARAMS.camera, "speed", {min: 0.05,max: 3,label: "Speed"})
cameraF.addSeparator(); //===========================

//===========LIGHTS TAB
const lightsTab = paneScene.addTab({ 
	pages:[
	{title:'Light'},
	{title:'Ambient Light'},
	{title:'Hemisphere Light'},
	{title:'Directional Light'},
	{title:'Point Light'},
	],
})
	lightsTab.pages[0].addInput(PARAMS.light,"color", {view: 'color', color:{alpha:true}, label: ".color"})
	lightsTab.pages[0].addInput(PARAMS.light,"intensity", {min: 0.0, max: 20.0, label: ".intensity"})
	lightsTab.pages[3].addInput(PARAMS.dirLight,"castShadow")
	lightsTab.pages[3].addInput(PARAMS.dirLight,"position")
	lightsTab.pages[3].addInput(PARAMS.dirLight,"target")

const environmentF = paneScene.addFolder({title: "Background", expanded: false})
environmentF.addInput(PARAMS.scene, "background", {view: 'color', color:{alpha:true}, label: ".background"})
environmentF.addSeparator(); //===========================

//===========PANE HELPERS
const paneHelpers = new Pane({title: "Helpers",container: document.getElementById('c--Helpers'),expanded: false})
const gridF = paneHelpers.addFolder({title: "Grid",expanded: false })
gridF.addInput(PARAMS.gridHelper, "divisions", {min: 20,max: 500, label: ".divisions"})
gridF.addInput(PARAMS.gridHelper, "size", {min: 40,max: 150, step: 1, label: ".size"})
gridF.addInput(PARAMS.gridHelper, "hidden")
gridF.addSeparator();//=======

//===========PANE MESHES
const paneMeshes= new Pane({title: "Meshes TP",container: document.getElementById('c--Meshes'), expanded: false})
const sphereF = paneMeshes.addFolder({ title: "Sphere",expanded: false});
sphereF.addSeparator(); //===========================

//===========PANE MATERIALS
const paneMaterials = new Pane({title: "Materials ",container: document.getElementById('c--Materials'),expanded: false})
const paramsF = paneMaterials.addFolder({title: "PARAMS", expanded: false})

paramsF.addInput(PARAMS.material_1, "color", {view:'color', color:{alpha: true}, label: ".color"})
paramsF.addInput(PARAMS.material_1, "emissive", {view:'color', color:{alpha: true}, label: ".emissive"})
paramsF.addInput(PARAMS.material_1, "emissiveIntensity", {min: 1.0, max: 20.0, label: ".emissiveIntensity"})
paramsF.addInput(PARAMS.material_1, "ao", {min: 0.1, max: 1.0, label: ".aoMapIntensity"})
paramsF.addInput(PARAMS.material_1, "envInt", {min: 0.1, max: 10.0, label: ".envIntensity"})
paramsF.addInput(PARAMS.material_1, "metal", {min: 0.0,max: 1.0,label: ".metalness"})
paramsF.addInput(PARAMS.material_1, "rough", {min: 0.0,max: 1.0,label: ".roughness"})
paramsF.addInput(PARAMS.material_1, "alpha", {min: 0.0,max: 1.0,label: ".opacity"})
paramsF.addInput(PARAMS.material_1, "displ", { min: 0.0, max: 8.0, label: ".displacementScale" })
paramsF.addInput(PARAMS.material_1, "displBias", { min: 0.0, max: 8.0, label: ".displacementBias" })
paramsF.addInput(PARAMS.material_1, "normal", { min: 0.01, max: 8.0, label: "Normal" })
paramsF.addInput(PARAMS.material_1, "clearcoat", {min: 0.0, max: 1.0, label: "Clearcoat"})
paramsF.addInput(PARAMS.material_1, "coatrough", {min: 0.0, max: 1.0, label: "CCoatRoughness"})
paramsF.addSeparator() //===========================

const physicalMaterialF = paneMaterials.addFolder({ title: 'Physical Material', expanded: false})

physicalMaterialF.addInput(PARAMS.material_1, "dither")
physicalMaterialF.addInput(PARAMS.material_1, "transparent")
physicalMaterialF.addInput(PARAMS.material_1, "glass", {min: 0.0,max: 1.0,label: ".transmission"})
physicalMaterialF.addInput(PARAMS.material_1, "sheen", {min: 0.0,max: 1.0,label: ".sheen"})
physicalMaterialF.addInput(PARAMS.material_1, "sheenR", {min: 0.0,max: 1.0,label: ".sheenRoughness"})
physicalMaterialF.addInput(PARAMS.material_1, "ior", { min: 1.0, max: 2.33, label: ".ior" })
physicalMaterialF.addInput(PARAMS.material_1, "thick", {min: 0.0,max: 20.0,label: ".thickness"})
physicalMaterialF.addInput(PARAMS.material_1, "reflect", {min: 0.0,max: 2.0,label: ".reflectivity"})
physicalMaterialF.addSeparator(); //===========================


////////////////////////////////////////////////////////////////////
// ✧ REGENERATORS
///////////////

	function renderMaterial() {
		const element = material_1A
		element.color.set(PARAMS.material_1.color)
		element.emissive.set(PARAMS.material_1.emissive)
		element.emissiveIntensity = PARAMS.material_1.emissiveIntensity
		element.attenuationColor.set(PARAMS.material_1.attColor)
		element.sheen = PARAMS.material_1.sheen
		element.sheenRoughness = PARAMS.material_1.sheenR
		element.attenuationDistance = PARAMS.material_1.attDist
		element.metalness = PARAMS.material_1.metal
		element.roughness = PARAMS.material_1.rough
		element.opacity = PARAMS.material_1.alpha
		element.transmission = PARAMS.material_1.glass
		element.ior = PARAMS.material_1.ior
		element.thickness = PARAMS.material_1.thick
		element.reflectivity = PARAMS.material_1.reflect
		element.clearcoat = PARAMS.material_1.clearcoat * 5
		element.clearcoatRoughness = PARAMS.material_1.coatrough
		element.envMapIntensity = PARAMS.material_1.envInt
		element.displacementScale = PARAMS.material_1.displ * 0.1
		element.displacementBias = PARAMS.material_1.displBias
		element.aoMapIntensity = PARAMS.material_1.ao;
		element.normalScale.set(PARAMS.material_1.normal, PARAMS.material_1.normal);
		element.dithering = PARAMS.material_1.dither
		element.transparent = PARAMS.material_1.transparent
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
	//------------
	function regenerateTorusKnotGeometry() {
	const newTorusKGeometry = new THREE.TorusKnotGeometry(
	    torusKnotData.radius,
	    torusKnotData.tube,
	    torusKnotData.tubularSegments,
	    torusKnotData.radialSegments,
	    torusKnotData.p,
	    torusKnotData.q,
	)
	torusKnot.geometry.dispose()
	torusKnot.geometry = newTorusKGeometry
	}
	//===========================

// const options = {
// 	filename: "Canvas-YYYY-MM-DD.png",
// 	quality: 1,
// 	useBlob: true,
// 	download: true,
// }
// 	// Create
// 	const contextC = canvas.getContext("2d", sizes)

// 	// Export
// 	const button = document.getElementById("screenshot");
// 	button.addEventListener("click", () => {
// 	  canvasScreenshot(canvas, options)
// 	});


	// const debug = document.getElementById('debug1') as HTMLDivElement 

	//===========================

////////////////////////////////////////////////////////////////////
// ✧ EFFECT COMPOSER - POSTPRODUCTION
///////////////

	const composer = new EffectComposer(renderer)
	composer.addPass(new RenderPass(scene, camera))
	composer.addPass(new EffectPass(camera, new BloomEffect()));

////////////////////////////////////////////////////////////////////
// ✧ ANIMATIONS
///////////////

// const clock = new THREE.Clock()
// let previousTime = 0  

// requestAnimationFrame(function render() {
// 	controls.update()
//   pane.refresh()
//   scene.background = new THREE.Color(PARAMS.scene.background);
//   regenerateSphereGeometry()

//   renderMaterial()

// 	requestAnimationFrame(render)
// 	composer.render()
// 	stats.update()

//   // debug.innerText =  'Matrix\n' + sphere.matrix.elements.toString().replace(/,/g, '\n') 

// });

////////////////////////////////////////////////////////////////////
// ✧ STATS
///////////////

const stats = Stats()  

document.body.appendChild(stats.dom) 

////////////////////////////////////////////////////////////////////
// ✧ SCREENSHOT BUTTON
///////////////


function animate() {
    requestAnimationFrame(animate)

    torusKnot.rotation.x += 0.01
    torusKnot.rotation.y += 0.01

    pLight0.rotation.y += 0.01
    pLight0.rotation.x -= 0.01
    pLight1.rotation.z += 0.01
    pLight1.rotation.y -= 0.01

    controls.update()

    paneScene.refresh()
		paneHelpers.refresh()
		paneMaterials.refresh()
		paneMeshes.refresh()
		// paneButtons.refresh()

    scene.background = new THREE.Color(PARAMS.scene.background);

    regenerateSphereGeometry()
    regenerateTorusKnotGeometry()

    renderMaterial()

    requestAnimationFrame(render)

    composer.render()

    stats.update()

}

function render() {
    renderer.render(scene, camera)
}

animate()

