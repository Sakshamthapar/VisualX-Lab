import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let sceneGroup, ghostMesh, activeMesh;
let history = [];
let redoStack = [];
let currentMatrix = new THREE.Matrix4(); // Identity by default

export default {
    info: {
        title: "2D Transformations",
        desc: "2D transformations alter coordinate descriptions. We use homogeneous coordinates to represent translations as matrix multiplications. The matrix below shows the accumulated composite transformation.",
        formula: "P' = M &middot; P"
    },

    init(scene, camera, renderer) {
        sceneGroup = new THREE.Group();

        // Geometry (A simple asymmetric house shape to easily see rotations/reflections)
        const shape = new THREE.Shape();
        shape.moveTo(-1, -1);
        shape.lineTo(1, -1);
        shape.lineTo(1, 0.5);
        shape.lineTo(0, 1.5);
        shape.lineTo(-1, 0.5);
        shape.lineTo(-1, -1);
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.center();

        // Ghost Mesh (Original)
        const ghostMat = new THREE.MeshBasicMaterial({ color: 0x444455, transparent: true, opacity: 0.3, wireframe: true });
        ghostMesh = new THREE.Mesh(geometry, ghostMat);
        sceneGroup.add(ghostMesh);

        // Active Mesh (Transformed)
        const activeMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.8 });
        activeMesh = new THREE.Mesh(geometry, activeMat);
        sceneGroup.add(activeMesh);

        // Grid for reference
        const grid = new THREE.GridHelper(10, 10, 0x333344, 0x11111a);
        grid.rotation.x = Math.PI / 2;
        sceneGroup.add(grid);

        scene.add(sceneGroup);

        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);

        this.resetState();
    },

    resetState() {
        currentMatrix.identity();
        history = [currentMatrix.clone()];
        redoStack = [];
        this.applyMatrixToMesh();
        this.updateMatrixDisplay();
    },

    applyTransformation(type, ...args) {
        const mat = new THREE.Matrix4();
        
        switch(type) {
            case 'translate':
                mat.makeTranslation(args[0], args[1], 0);
                break;
            case 'scale':
                mat.makeScale(args[0], args[1], 1);
                break;
            case 'rotate':
                mat.makeRotationZ(args[0] * Math.PI / 180);
                break;
            case 'shear':
                // Custom shear matrix
                mat.set(
                    1, args[0], 0, 0,
                    args[1], 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                );
                break;
            case 'reflectX':
                mat.makeScale(1, -1, 1);
                break;
            case 'reflectY':
                mat.makeScale(-1, 1, 1);
                break;
        }

        // Composite: currentMatrix = mat * currentMatrix
        currentMatrix.premultiply(mat);
        
        // Save to history
        history.push(currentMatrix.clone());
        redoStack = []; // Clear redo
        
        this.applyMatrixToMesh();
        this.updateMatrixDisplay();
    },

    undo() {
        if (history.length > 1) {
            redoStack.push(history.pop());
            currentMatrix.copy(history[history.length - 1]);
            this.applyMatrixToMesh();
            this.updateMatrixDisplay();
        }
    },

    redo() {
        if (redoStack.length > 0) {
            const nextMat = redoStack.pop();
            history.push(nextMat);
            currentMatrix.copy(nextMat);
            this.applyMatrixToMesh();
            this.updateMatrixDisplay();
        }
    },

    applyMatrixToMesh() {
        // Use GSAP to animate matrix elements smoothly if possible, but for matrices it's tricky.
        // We'll just set it directly to keep logic clean, maybe animate position/scale properties if decomposing, 
        // but direct matrix application is mathematically correct.
        activeMesh.matrixAutoUpdate = false;
        activeMesh.matrix.copy(currentMatrix);
    },

    updateMatrixDisplay() {
        const d = document.getElementById('matrix-display');
        if(!d) return;
        const e = currentMatrix.elements;
        // e is column-major: 0,4,8,12 is row 0. 1,5,9,13 is row 1
        d.innerHTML = `
            [ ${e[0].toFixed(2)} &nbsp;&nbsp; ${e[4].toFixed(2)} &nbsp;&nbsp; ${e[12].toFixed(2)} ]<br>
            [ ${e[1].toFixed(2)} &nbsp;&nbsp; ${e[5].toFixed(2)} &nbsp;&nbsp; ${e[13].toFixed(2)} ]<br>
            [ 0.00 &nbsp;&nbsp; 0.00 &nbsp;&nbsp; 1.00 ]
        `;
    },

    renderControls() {
        return `
            <div style="display:flex; gap:5px; margin-bottom: 15px;">
                <button class="btn" id="btn-undo" style="flex:1;">Undo</button>
                <button class="btn" id="btn-redo" style="flex:1;">Redo</button>
                <button class="btn" id="btn-reset" style="flex:1; border-color:#ff3333;">Reset</button>
            </div>

            <!-- Transformation Matrix Display -->
            <div class="control-group" style="margin-bottom: 15px;">
                <label>Current Transformation Matrix</label>
                <div class="formula-box" style="text-align:center; font-size:1.1em; letter-spacing:2px; line-height: 1.5;" id="matrix-display">
                    [ 1.00 &nbsp;&nbsp; 0.00 &nbsp;&nbsp; 0.00 ]<br>
                    [ 0.00 &nbsp;&nbsp; 1.00 &nbsp;&nbsp; 0.00 ]<br>
                    [ 0.00 &nbsp;&nbsp; 0.00 &nbsp;&nbsp; 1.00 ]
                </div>
            </div>

            <div class="control-group">
                <label>Translate <span class="val" id="val-t">X:0, Y:0</span></label>
                <div style="display:flex; gap:10px;">
                    <input type="range" id="tx" min="-5" max="5" step="0.5" value="0">
                    <input type="range" id="ty" min="-5" max="5" step="0.5" value="0">
                </div>
                <button class="btn btn-primary" id="btn-apply-t" style="margin-top:5px;">Apply Translate</button>
            </div>

            <hr style="border-color:var(--glass-border); margin:10px 0;">

            <div class="control-group">
                <label>Scale <span class="val" id="val-s">X:1, Y:1</span></label>
                <div style="display:flex; gap:10px;">
                    <input type="range" id="sx" min="-3" max="3" step="0.1" value="1">
                    <input type="range" id="sy" min="-3" max="3" step="0.1" value="1">
                </div>
                <button class="btn btn-primary" id="btn-apply-s" style="margin-top:5px;">Apply Scale</button>
            </div>

            <hr style="border-color:var(--glass-border); margin:10px 0;">

            <div class="control-group">
                <label>Rotate (deg) <span class="val" id="val-r">0</span></label>
                <input type="range" id="rot" min="-180" max="180" step="5" value="0">
                <button class="btn btn-primary" id="btn-apply-r" style="margin-top:5px;">Apply Rotation</button>
            </div>

            <hr style="border-color:var(--glass-border); margin:10px 0;">

            <div class="control-group">
                <label>Shear <span class="val" id="val-sh">X:0, Y:0</span></label>
                <div style="display:flex; gap:10px;">
                    <input type="range" id="shx" min="-2" max="2" step="0.1" value="0">
                    <input type="range" id="shy" min="-2" max="2" step="0.1" value="0">
                </div>
                <button class="btn btn-primary" id="btn-apply-sh" style="margin-top:5px;">Apply Shear</button>
            </div>

            <hr style="border-color:var(--glass-border); margin:10px 0;">
            
            <div class="control-group">
                <label>Reflection</label>
                <div style="display:flex; gap:5px;">
                    <button class="btn" id="btn-ref-x" style="flex:1;">X-Axis</button>
                    <button class="btn" id="btn-ref-y" style="flex:1;">Y-Axis</button>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const updateT = () => document.getElementById('val-t').textContent = `X:${document.getElementById('tx').value}, Y:${document.getElementById('ty').value}`;
        const updateS = () => document.getElementById('val-s').textContent = `X:${document.getElementById('sx').value}, Y:${document.getElementById('sy').value}`;
        const updateSh = () => document.getElementById('val-sh').textContent = `X:${document.getElementById('shx').value}, Y:${document.getElementById('shy').value}`;

        document.getElementById('tx').addEventListener('input', updateT);
        document.getElementById('ty').addEventListener('input', updateT);
        document.getElementById('sx').addEventListener('input', updateS);
        document.getElementById('sy').addEventListener('input', updateS);
        document.getElementById('shx').addEventListener('input', updateSh);
        document.getElementById('shy').addEventListener('input', updateSh);
        document.getElementById('rot').addEventListener('input', (e) => document.getElementById('val-r').textContent = e.target.value);

        // Apply Buttons
        document.getElementById('btn-apply-t').addEventListener('click', () => {
            this.applyTransformation('translate', parseFloat(document.getElementById('tx').value), parseFloat(document.getElementById('ty').value));
            document.getElementById('tx').value = 0; document.getElementById('ty').value = 0; updateT();
        });

        document.getElementById('btn-apply-s').addEventListener('click', () => {
            this.applyTransformation('scale', parseFloat(document.getElementById('sx').value), parseFloat(document.getElementById('sy').value));
            document.getElementById('sx').value = 1; document.getElementById('sy').value = 1; updateS();
        });

        document.getElementById('btn-apply-r').addEventListener('click', () => {
            this.applyTransformation('rotate', parseFloat(document.getElementById('rot').value));
            document.getElementById('rot').value = 0; document.getElementById('val-r').textContent = '0';
        });

        document.getElementById('btn-apply-sh').addEventListener('click', () => {
            this.applyTransformation('shear', parseFloat(document.getElementById('shx').value), parseFloat(document.getElementById('shy').value));
            document.getElementById('shx').value = 0; document.getElementById('shy').value = 0; updateSh();
        });

        document.getElementById('btn-ref-x').addEventListener('click', () => this.applyTransformation('reflectX'));
        document.getElementById('btn-ref-y').addEventListener('click', () => this.applyTransformation('reflectY'));

        // History Controls
        document.getElementById('btn-undo').addEventListener('click', () => this.undo());
        document.getElementById('btn-redo').addEventListener('click', () => this.redo());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetState());
    },

    animate() {
        // Matrix is applied instantly on button clicks, no continuous animation needed.
    }
};
