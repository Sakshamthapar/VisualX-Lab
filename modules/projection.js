import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let sceneGroup;
let isPerspective = true;

export default {
    info: {
        title: "Projection & Viewing",
        desc: "Transforms 3D coordinates into 2D view planes. Perspective projection mimics human vision (objects further away appear smaller), while Orthographic maintains parallel lines.",
        formula: "x' = x / (1 - z/d) <br> (Perspective Divide)"
    },

    init(scene, camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;

        sceneGroup = new THREE.Group();

        // Add Grid & Axes Helper
        const gridHelper = new THREE.GridHelper(10, 10, 0x00f5ff, 0x333344);
        const axesHelper = new THREE.AxesHelper(5);
        sceneGroup.add(gridHelper);
        sceneGroup.add(axesHelper);

        // Add multiple objects at different depths
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x7a5cff, transparent: true, opacity: 0.8 });
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00f5ff, linewidth: 2 });

        for (let i = 0; i < 5; i++) {
            const cube = new THREE.Mesh(geometry, material);
            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgesMaterial);
            cube.add(edges);

            // Stagger them along the Z axis
            cube.position.set(-2 + i, 0.5, -i * 2);
            sceneGroup.add(cube);
        }

        scene.add(sceneGroup);

        // Setup Cameras
        this.aspect = window.innerWidth / window.innerHeight;
        this.perspCam = new THREE.PerspectiveCamera(75, this.aspect, 0.1, 1000);
        this.perspCam.position.set(2, 3, 5);
        this.perspCam.lookAt(0, 0, -2);

        const d = 3;
        this.orthoCam = new THREE.OrthographicCamera(-d * this.aspect, d * this.aspect, d, -d, 0.1, 1000);
        this.orthoCam.position.set(2, 3, 5);
        this.orthoCam.lookAt(0, 0, -2);

        this.activeCam = this.perspCam;
    },

    renderControls() {
        return `
            <div class="control-group">
                <label>Projection Type</label>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn btn-primary" id="btn-persp" style="flex:1;">Perspective</button>
                    <button class="btn" id="btn-ortho" style="flex:1;">Orthographic</button>
                </div>
            </div>
            <div class="control-group" style="margin-top:20px;">
                <label>Camera Distance (Z) <span class="val" id="val-z">5.0</span></label>
                <input type="range" id="cam-z" min="2" max="15" step="0.1" value="5">
            </div>
            <div class="control-group" id="fov-group">
                <label>Field of View (FOV) <span class="val" id="val-fov">75</span></label>
                <input type="range" id="cam-fov" min="30" max="120" step="1" value="75">
            </div>
        `;
    },

    bindEvents() {
        const btnPersp = document.getElementById('btn-persp');
        const btnOrtho = document.getElementById('btn-ortho');
        const fovGroup = document.getElementById('fov-group');

        btnPersp.addEventListener('click', () => {
            isPerspective = true;
            btnPersp.classList.add('btn-primary');
            btnOrtho.classList.remove('btn-primary');
            this.activeCam = this.perspCam;
            fovGroup.style.opacity = '1';
            fovGroup.style.pointerEvents = 'auto';
        });

        btnOrtho.addEventListener('click', () => {
            isPerspective = false;
            btnOrtho.classList.add('btn-primary');
            btnPersp.classList.remove('btn-primary');
            this.activeCam = this.orthoCam;
            fovGroup.style.opacity = '0.3';
            fovGroup.style.pointerEvents = 'none';
        });

        document.getElementById('cam-z').addEventListener('input', (e) => {
            const z = parseFloat(e.target.value);
            this.perspCam.position.z = z;
            this.orthoCam.position.z = z;
            document.getElementById('val-z').textContent = z;
        });

        document.getElementById('cam-fov').addEventListener('input', (e) => {
            const fov = parseFloat(e.target.value);
            this.perspCam.fov = fov;
            this.perspCam.updateProjectionMatrix();
            document.getElementById('val-fov').textContent = fov;
        });
    },

    animate() {
        if(sceneGroup) {
            // Optional: slight rotation to show 3D nature
            // sceneGroup.rotation.y += 0.002;
        }
        if(this.renderer && this.scene && this.activeCam) {
            this.renderer.render(this.scene, this.activeCam);
        }
    }
};
