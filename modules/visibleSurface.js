import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let objects = [];

export default {
    info: {
        title: "Visible Surface Detection",
        desc: "Also known as Hidden Surface Removal. Algorithms like Z-Buffer or Painter's algorithm determine which surfaces are visible and which are hidden by others from a specific viewpoint.",
        formula: "if (z_new < z_buffer[x,y]) draw();"
    },

    init(scene, camera, renderer) {
        // Create overlapping objects
        const geom1 = new THREE.IcosahedronGeometry(1, 0);
        const mat1 = new THREE.MeshPhongMaterial({ color: 0xff0055, flatShading: true });
        const mesh1 = new THREE.Mesh(geom1, mat1);
        mesh1.position.set(-0.5, 0, 0);

        const geom2 = new THREE.IcosahedronGeometry(1, 0);
        const mat2 = new THREE.MeshPhongMaterial({ color: 0x00f5ff, flatShading: true });
        const mesh2 = new THREE.Mesh(geom2, mat2);
        mesh2.position.set(0.5, 0, -1);

        objects.push(mesh1, mesh2);
        scene.add(mesh1, mesh2);

        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
    },

    renderControls() {
        return `
            <div class="control-group">
                <label class="toggle-switch">
                    <span class="label">Depth Test (Z-Buffer)</span>
                    <input type="checkbox" id="depth-test" checked>
                    <div class="switch"></div>
                </label>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">Toggle depth testing. When disabled, objects are drawn in the order they were created, regardless of depth.</p>
        `;
    },

    bindEvents() {
        document.getElementById('depth-test').addEventListener('change', (e) => {
            const depthTest = e.target.checked;
            objects.forEach(obj => {
                obj.material.depthTest = depthTest;
                obj.material.needsUpdate = true;
            });
        });
    },

    animate() {
        objects.forEach((obj, i) => {
            obj.rotation.x += 0.01 * (i+1);
            obj.rotation.y += 0.01 * (i+1);
        });
    }
};
