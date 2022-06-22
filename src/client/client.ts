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
	// console.log(preload);
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
	},
	scene: 
	{ 
		background: 0xA9A9A9,
	},
	gridHelper:
	{
		size: 20,
		divisions: 200,
	},
	material_1: 
	{ 
		color: 0xF4A460,
		metal: 0.1,
		attColor: 0xFFFFFF,
		attDist:0.2,
		rough: 0.4,
		alpha: 1.0, //opacity
		glass: 1.0,
		sheen: 1.0,
		ior: 1.5,
		thick: 10.1,
		reflect: 0.1, //--It has no effect when metalness is 1.0
		clearcoat: 0.1,
		coatrough: 0.1,
		envInt: 0.1,
		emissive:0xFFEBCD, 
		emissiveIntensity: 1,
		displ: 0.1,
		ao: 1.0,
		normal: 0.1,
		dither: true,
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
    radius: 1.5,
    widthSegments: 64,
    heightSegments: 32,
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
const environment = 
scene.background = new THREE.Color('rgba(210,210,210,0.01');

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

const gridHelper = new THREE.GridHelper()
gridHelper.position.y = -1;
scene.add(gridHelper)

// const gridHelper = new THREE.GridHelper()
// gridHelper.position.y = -1;
// gridHelper.size = 20;
// gridHelper.distance = 20;
// scene.add(gridHelper)

//=========================== POSITIONING
	
	const axesHelper = new THREE.AxesHelper();
	//scene.add(axesHelper);

////////////////////////////////////////////////////////////////////
// ✧ RESPONSIVENESS 
///////////////

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

const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.01, 1000)

camera.position.z = -7 
camera.lookAt(new THREE.Vector3(0, 0, 0)) 

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

document.body.appendChild(renderer.domElement)

////////////////////////////////////////////////////////////////////
// ✧ LIGHTS + group
///////////////

// const hemis_light = new THREE.HemisphereLight(0xF5FFFA, 0xFFDEAD, 7);
// scene.add(hemis_light)

const pLight0 = new THREE.PointLight(0xD2691E, 7);
pLight0.position.set(3, 3, 3)
const pLight1 = new THREE.PointLight(0xffffff, 7);
pLight1.position.set(-3, -3, -3)

const lightsGroup = new THREE.Group();

lightsGroup.add(pLight0)
lightsGroup.add(pLight1)
lightsGroup.position.set(0, 0, 0);

scene.add(lightsGroup)

//--**********************************************************
//-- CALC - GET THE WORLD TRANSFORMS OF AN OBJECT
//--**********************************************************

//-- Position

// const objectsWorldPosition = new THREE.Vector3()  
// object.getWorldPosition(objectsWorldPosition)  
// console.log(objectsWorldPosition) 

//-- Direction

// const objectsWorldDirection = new THREE.Vector3()  
// object.getWorldDirection(objectsWorldDirection)  
// console.log(objectsWorldDirection)  

//-- Quaternion

// const objectsWorldQuaternion = new THREE.Quaternion()  
// object.getWorldQuaternion(objectsWorldQuaternion)  
// console.log(objectsWorldQuaternion)  

//-- Scale

// const objectsWorldScale = new THREE.Vector3()  
// object.getWorldScale(objectsWorldScale)  
// console.log(objectsWorldScale) 

//--**********************************************************
//-- CALC - COLOR LIGHT ATTENUATION
//--**********************************************************

//-- Calculate a vector from the fragment’s location to the light source.

// const to_light = u_Light_position - v_Vertex;

//-- Calculate the length of the vector, which is the distance to the light source.

// let d = length( to_light );

//-- Calculate the amount of attenuation. (For this example, the function 10.0 / d is used.)

// let attenuation = clamp( 10.0 / d, 0.0, 1.0);

//-- Clamps the attenuation to be a percentage between 0% and 100%. 
// (For the equation 10.0 / d, any object closer than 10 units will receive 
// full light, while objects more than 10 units away will receive less than full light.
// The value of 10 is arbitrary and would change based on a specific application’s needs.)

// const attColor = attenuation * (ambient_color + diffuse_color + specular_color);


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
controls.maxDistance = 7
controls.minPolarAngle = 0
controls.maxPolarAngle = Math.PI / 2.1

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
	envMap: g_texture("neon", 4),
	envMapIntensity: 6,

	reflectivity: 1.2,

	normalMap: g_texture("geometry", 4),
	normalScale: new THREE.Vector2(2, 2),

	metalness:0.05,
	metalnessMap: g_texture("geometry", 4),

	roughness: 0.2,
	roughnessMap: g_texture("geometry", 4),

	sheen: 1.0,
	ior: 1.5,
	opacity: 1.0,

	clearcoat: 0.5,
	clearcoatRoughness: 0.3,
	clearcoatRoughnessMap: g_texture("geometry", 4),

	displacementMap: g_texture("geometry", 4),
	displacementScale: 0.03,

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
const paneScene = new Pane({title: "Scene TP",container: document.getElementById('c--Scene')})
const cameraF = paneScene.addFolder({title: "Camera" ,expanded: true })
cameraF.addInput(PARAMS.camera, "speed", {min: 0.05,max: 3,label: "Speed"})
cameraF.addSeparator(); //===========================

const environmentF = paneScene.addFolder({title: "Background", expanded: true})
environmentF.addInput(PARAMS.scene, "background", {color: 0xFAEBD7,label: ".background"})
environmentF.addSeparator(); //===========================

//===========PANE HELPERS
const paneHelpers = new Pane({title: "Helpers TP",container: document.getElementById('c--Helpers')})
const gridF = paneHelpers.addFolder({title: "Grid" ,expanded: true })
gridF.addInput(PARAMS.gridHelper, "divisions", {min: 20,max: 500, label: ".divisions"})
gridF.addInput(PARAMS.gridHelper, "size", {min: 20,max: 50, step: 1, label: ".size"})
gridF.addSeparator();//===========================

//===========PANE MESHES
const paneMeshes= new Pane({title: "Meshes TP",container: document.getElementById('c--Meshes')})
const sphereF = paneMeshes.addFolder({ title: "Sphere" });
sphereF.addSeparator(); //===========================

//===========PANE MATERIALS
const paneMaterials = new Pane({title: "Materials TP",container: document.getElementById('c--Materials')})
const paramsF = paneMaterials.addFolder({title: "PARAMS", expanded: true})
paramsF.addInput(PARAMS.material_1, "color", {color:0xEE82EE, label: ".color"});
paramsF.addInput(PARAMS.material_1, "emissiveIntensity", {color:0xF5F5F5,label: ".emissiveIntensity"})
paramsF.addInput(PARAMS.material_1, "envInt", {min: 0.1, max: 10.0, label: ".envIntensity"})
paramsF.addInput(PARAMS.material_1, "metal", {min: 0.01,max: 1.0,label: "Metalness"})
paramsF.addInput(PARAMS.material_1, "rough", {min: 0.01,max: 1.0,label: "Roughness"})
paramsF.addInput(PARAMS.material_1, "alpha", {min: 0.01,max: 1.0,label: "Opacity"})
paramsF.addInput(PARAMS.material_1, "displ", { min: 0.0, max: 8.0, label: "Disp Scale" })
paramsF.addInput(PARAMS.material_1, "normal", { min: 0.01, max: 8.0, label: "Normal" })
paramsF.addInput(PARAMS.material_1, "clearcoat", {min: 0.0, max: 1.0, label: "Clearcoat"})
paramsF.addInput(PARAMS.material_1, "coatrough", {min: 0.0, max: 1.0, label: "CCoatRoughness"})
paramsF.addSeparator(); //===========================

const physicalMaterialF = paneMaterials.addFolder({ title: 'Physical Material', expanded: true})
physicalMaterialF.addInput(PARAMS.material_1, "dither", { label: "Dithering" })
physicalMaterialF.addInput(PARAMS.material_1, "glass", {min: 0.01,max: 1.0,label: "transmission"})
physicalMaterialF.addInput(PARAMS.material_1, "ior", { min: 1.0, max: 2.33, label: "Ior" })
physicalMaterialF.addInput(PARAMS.material_1, "thick", {min: 0.01,max: 20.0,label: "Thickness"})
physicalMaterialF.addInput(PARAMS.material_1, "reflect", {min: 0.01,max: 2.0,label: "Reflectivity"})
physicalMaterialF.addSeparator(); //===========================


////////////////////////////////////////////////////////////////////
// ✧ REGENERATORS
///////////////

	function renderMaterial() {
		const element = material_1A
		//element.color.set(PARAMS.material_1.color)
		element.attenuationColor.set(PARAMS.material_1.attColor)
		element.sheen = PARAMS.material_1.sheen
		element.attenuationDistance = PARAMS.material_1.attDist
		element.dithering = PARAMS.material_1.dither
		element.metalness = PARAMS.material_1.metal
		element.roughness = PARAMS.material_1.rough
		element.opacity = PARAMS.material_1.alpha
		element.transmission = PARAMS.material_1.glass;
		element.ior = PARAMS.material_1.ior;
		element.thickness = PARAMS.material_1.thick;
		element.reflectivity = PARAMS.material_1.reflect;
		element.clearcoat = PARAMS.material_1.clearcoat * 5;
		element.clearcoatRoughness = PARAMS.material_1.coatrough;
		element.envMapIntensity = PARAMS.material_1.envInt;
		element.displacementScale = PARAMS.material_1.displ * 0.2;
		element.aoMapIntensity = PARAMS.material_1.ao;
		element.normalScale.set(PARAMS.material_1.normal, PARAMS.material_1.normal);
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

const options = {
	filename: "Canvas-YYYY-MM-DD.png",
	quality: 1,
	useBlob: true,
	download: true,
}

	// Create
	const contextC = canvas.getContext("2d", sizes)

	// Export
	const button = document.createElement("button");
	button.addEventListener("click", () => {
	  canvasScreenshot(canvas, options)
	});


	// const debug = document.getElementById('debug1') as HTMLDivElement 

	//===========================

	//=============PANE BUTTONS
	// const paneButtons = new Pane({title: "Buttons TP",container: document.getElementById('c--Buttons')})
	// paneButtons.addButton({ title: "Reset PARAMS" }).on("click", () => {
	// 	PARAMS.material_1.emissiveIntensity = 1.0
	// 	PARAMS.material_1.alpha = 1.0
	// 	PARAMS.material_1.metal = 0.2
	// 	PARAMS.material_1.rough = 0.1
	// 	PARAMS.material_1.transm = 1.0
	// 	PARAMS.material_1.ior = 1.5
	// 	PARAMS.material_1.thick = 0.3
	// 	PARAMS.material_1.reflect = 0.5
	// 	PARAMS.material_1.coatrough = 0.0
	// 	PARAMS.material_1.clearcoat = 0.0
	// 	PARAMS.material_1.ao = 0.0
	// 	PARAMS.material_1.dither = false
	// 	PARAMS.material_1.displ = 0.1
	// 	PARAMS.material_1.envInt = 2.0
	// })
	// paneButtons.addSeparator(); //===========================
	// paneButtons.addButton({ title: "Random PARAMS", }).on("click", () => {
	// 	PARAMS.material_1.emissiveIntensity = Math.random()
	// 	PARAMS.material_1.alpha = 0.3 + Math.random()
	// 	PARAMS.material_1.metal = 0.3 + Math.random()
	// 	PARAMS.material_1.rough = 0.3 + Math.random()
	// 	PARAMS.material_1.transm = 0.3 + Math.random()
	// 	PARAMS.material_1.ior = 0.3 + Math.random()
	// 	PARAMS.material_1.thick = 1.2 + Math.random()
	// 	PARAMS.material_1.ao = 0.9 + Math.random()
	// 	PARAMS.material_1.reflect = Math.random();
	// 	PARAMS.material_1.coatrough = Math.random();
	// 	PARAMS.material_1.clearcoat = Math.random();
	// 	PARAMS.material_1.displ = Math.random()
	// 	PARAMS.material_1.envInt = Math.random()
	// 	PARAMS.material_1.normal = Math.random()
	// 	PARAMS.material_1.reflect = Math.random()
	// })

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

    lightsGroup.rotation.y -= 0.01
    lightsGroup.rotation.x -= 0.01

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

