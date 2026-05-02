import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let mesh, axesHelper;

export default {
    info: {
        title: "3D Transformations",
        desc: "Extends 2D transformations into three dimensions (x, y, z). You can translate, rotate, and scale along all three axes. Drag the canvas to rotate the camera view.",
        formula: "P' = T &middot; P (using 4x4 matrices)"
    },

    init(scene, camera, renderer) {
        // Wireframe Cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00f5ff, 
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Axes Helper
        axesHelper = new THREE.AxesHelper(3);
        scene.add(axesHelper);

        camera.position.set(4, 4, 6);
        camera.lookAt(0, 0, 0);
    },

    renderControls() {
        return `
            <div class="control-group" style="margin-bottom:15px;">
                <label class="toggle-switch">
                    <span class="label">Wireframe Mode</span>
                    <input type="checkbox" id="toggle-wireframe" checked>
                    <div class="switch"></div>
                </label>
            </div>

            <div class="control-group">
                <label>Translate <span class="val" id="val-t3">X:0, Y:0, Z:0</span></label>
                <div style="display:flex; gap:5px;">
                    <input type="range" id="t3x" min="-5" max="5" step="0.5" value="0">
                    <input type="range" id="t3y" min="-5" max="5" step="0.5" value="0">
                    <input type="range" id="t3z" min="-5" max="5" step="0.5" value="0">
                </div>
            </div>

            <div class="control-group" style="margin-top:15px;">
                <label>Rotate (deg) <span class="val" id="val-r3">X:0, Y:0, Z:0</span></label>
                <div style="display:flex; gap:5px;">
                    <input type="range" id="r3x" min="0" max="360" step="1" value="0">
                    <input type="range" id="r3y" min="0" max="360" step="1" value="0">
                    <input type="range" id="r3z" min="0" max="360" step="1" value="0">
                </div>
            </div>

            <div class="control-group" style="margin-top:15px;">
                <label>Scale <span class="val" id="val-s3">X:1, Y:1, Z:1</span></label>
                <div style="display:flex; gap:5px;">
                    <input type="range" id="s3x" min="0.1" max="3" step="0.1" value="1">
                    <input type="range" id="s3y" min="0.1" max="3" step="0.1" value="1">
                    <input type="range" id="s3z" min="0.1" max="3" step="0.1" value="1">
                </div>
            </div>

            <button class="btn btn-primary" id="btn-reset-3d" style="margin-top:20px;">Reset Cube</button>
        `;
    },

    bindEvents() {
        document.getElementById('toggle-wireframe').addEventListener('change', (e) => {
            if(mesh) mesh.material.wireframe = e.target.checked;
        });

        const updateT = () => {
            const x = parseFloat(document.getElementById('t3x').value);
            const y = parseFloat(document.getElementById('t3y').value);
            const z = parseFloat(document.getElementById('t3z').value);
            mesh.position.set(x, y, z);
            document.getElementById('val-t3').textContent = `X:${x}, Y:${y}, Z:${z}`;
        };

        const updateR = () => {
            const x = parseFloat(document.getElementById('r3x').value);
            const y = parseFloat(document.getElementById('r3y').value);
            const z = parseFloat(document.getElementById('r3z').value);
            mesh.rotation.set(x * Math.PI/180, y * Math.PI/180, z * Math.PI/180);
            document.getElementById('val-r3').textContent = `X:${x}, Y:${y}, Z:${z}`;
        };

        const updateS = () => {
            const x = parseFloat(document.getElementById('s3x').value);
            const y = parseFloat(document.getElementById('s3y').value);
            const z = parseFloat(document.getElementById('s3z').value);
            mesh.scale.set(x, y, z);
            document.getElementById('val-s3').textContent = `X:${x}, Y:${y}, Z:${z}`;
        };

        ['t3x', 't3y', 't3z'].forEach(id => document.getElementById(id).addEventListener('input', updateT));
        ['r3x', 'r3y', 'r3z'].forEach(id => document.getElementById(id).addEventListener('input', updateR));
        ['s3x', 's3y', 's3z'].forEach(id => document.getElementById(id).addEventListener('input', updateS));

        document.getElementById('btn-reset-3d').addEventListener('click', () => {
            ['t3x', 't3y', 't3z'].forEach(id => document.getElementById(id).value = 0);
            ['r3x', 'r3y', 'r3z'].forEach(id => document.getElementById(id).value = 0);
            ['s3x', 's3y', 's3z'].forEach(id => document.getElementById(id).value = 1);
            updateT(); updateR(); updateS();
        });
    },

    animate() {
        // Continuous animation if needed
    }
};
