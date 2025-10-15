import * as THREE from 'three';
import { Sketch } from '../src/core/Sketch.js';

// Mock the dependencies
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(() => ({
    dispose: vi.fn(),
  })),
}));

vi.mock('tweakpane', () => ({
  Pane: vi.fn(() => ({
    dispose: vi.fn(),
    addFolder: vi.fn(() => ({
      addButton: vi.fn(() => ({
        on: vi.fn(),
      })),
    })),
  })),
}));

vi.mock('../src/debug/PerformanceMonitor.js', () => ({
  PerformanceMonitor: vi.fn(() => ({
    dispose: vi.fn(),
    setPosition: vi.fn(),
    update: vi.fn(),
  })),
}));

vi.mock('three', async () => {
  const three = await vi.importActual('three');
  return {
    ...three,
    WebGLRenderer: vi.fn(() => ({
      dispose: vi.fn(),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
      shadowMap: {
        enabled: false,
      },
    })),
  };
});

// Add a dispose method to the Object3D prototype for testing purposes
THREE.Object3D.prototype.dispose = vi.fn();

describe('Sketch', () => {
  let sketch;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    sketch = new Sketch({ container });
    sketch.init();
  });

  afterEach(() => {
    sketch.dispose();
    document.body.removeChild(container);
  });

  test('disposeSceneObject should recursively dispose of scene objects', () => {
    const scene = new THREE.Scene();

    // Create a nested structure
    const parent = new THREE.Object3D();
    const child = new THREE.Object3D();
    const grandchild = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());

    child.add(grandchild);
    parent.add(child);
    scene.add(parent);

    // Spy on the dispose methods
    const parentDisposeSpy = vi.spyOn(parent, 'dispose');
    const childDisposeSpy = vi.spyOn(child, 'dispose');
    const grandchildDisposeSpy = vi.spyOn(grandchild, 'dispose');
    const grandchildGeometryDisposeSpy = vi.spyOn(grandchild.geometry, 'dispose');
    const grandchildMaterialDisposeSpy = vi.spyOn(grandchild.material, 'dispose');

    // Call the method to be tested
    sketch.disposeSceneObject(scene);

    // Assert that the dispose methods were called
    expect(parentDisposeSpy).toHaveBeenCalled();
    expect(childDisposeSpy).toHaveBeenCalled();
    expect(grandchildDisposeSpy).toHaveBeenCalled();
    expect(grandchildGeometryDisposeSpy).toHaveBeenCalled();
    expect(grandchildMaterialDisposeSpy).toHaveBeenCalled();

    // Assert that the objects were removed from their parents
    expect(parent.children.length).toBe(0);
    expect(child.children.length).toBe(0);
    expect(scene.children.length).toBe(0);
  });
});
