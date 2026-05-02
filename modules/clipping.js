import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let sceneGroup;
let isClipping = false;
let linesData = [];
const xmin = -1.5, xmax = 1.5, ymin = -1.5, ymax = 1.5;

// Cohen-Sutherland Region Codes
const INSIDE = 0; // 0000
const LEFT = 1;   // 0001
const RIGHT = 2;  // 0010
const BOTTOM = 4; // 0100
const TOP = 8;    // 1000

function computeCode(x, y) {
    let code = INSIDE;
    if (x < xmin) code |= LEFT;
    else if (x > xmax) code |= RIGHT;
    if (y < ymin) code |= BOTTOM;
    else if (y > ymax) code |= TOP;
    return code;
}

export default {
    info: {
        title: "Cohen-Sutherland Clipping",
        desc: "Divides 2D space into 9 regions using 4-bit codes. Efficiently accepts/rejects lines based on bitwise AND/OR operations on endpoints.",
        formula: "Region Codes: Top=8, Bottom=4, Right=2, Left=1"
    },

    init(scene, camera, renderer) {
        sceneGroup = new THREE.Group();

        // Draw Clipping Window (Bright Cyan)
        const winGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(xmax - xmin, ymax - ymin));
        const winMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, linewidth: 2 });
        const clipWindow = new THREE.LineSegments(winGeo, winMat);
        sceneGroup.add(clipWindow);

        scene.add(sceneGroup);
        this.generateLines();

        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
    },

    generateLines() {
        // Remove old lines
        sceneGroup.children = sceneGroup.children.filter(c => c.type !== 'Group');
        
        const lineGroup = new THREE.Group();
        linesData = [];

        // Generate 15 random lines
        for(let i=0; i<15; i++) {
            const x1 = (Math.random() - 0.5) * 8;
            const y1 = (Math.random() - 0.5) * 8;
            const x2 = (Math.random() - 0.5) * 8;
            const y2 = (Math.random() - 0.5) * 8;
            
            linesData.push({ x1, y1, x2, y2 });

            const points = [new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x7a5cff, transparent: true, opacity: 0.8 });
            const line = new THREE.Line(geometry, material);
            lineGroup.add(line);
        }
        sceneGroup.add(lineGroup);
        isClipping = false;
        if(document.getElementById('btn-clip')) {
            document.getElementById('btn-clip').textContent = "Start Clipping";
            document.getElementById('btn-clip').classList.add('btn-primary');
        }
    },

    performClipping() {
        const lineGroup = sceneGroup.children.find(c => c.type === 'Group');
        
        linesData.forEach((line, index) => {
            let { x1, y1, x2, y2 } = line;
            let code1 = computeCode(x1, y1);
            let code2 = computeCode(x2, y2);
            let accept = false;

            while (true) {
                if ((code1 == 0) && (code2 == 0)) {
                    // Both endpoints inside
                    accept = true;
                    break;
                } else if (code1 & code2) {
                    // Both endpoints outside in same region
                    break;
                } else {
                    // Line intersects window; clip it
                    let codeOut = code1 != 0 ? code1 : code2;
                    let x, y;

                    if (codeOut & TOP) {
                        x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
                        y = ymax;
                    } else if (codeOut & BOTTOM) {
                        x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
                        y = ymin;
                    } else if (codeOut & RIGHT) {
                        y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
                        x = xmax;
                    } else if (codeOut & LEFT) {
                        y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
                        x = xmin;
                    }

                    if (codeOut == code1) {
                        x1 = x; y1 = y; code1 = computeCode(x1, y1);
                    } else {
                        x2 = x; y2 = y; code2 = computeCode(x2, y2);
                    }
                }
            }

            // Update visual
            const mesh = lineGroup.children[index];
            if (accept) {
                // Draw clipped portion bright
                const points = [new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)];
                mesh.geometry.setFromPoints(points);
                mesh.material.color.setHex(0x00ffaa); // Bright Green
                mesh.material.opacity = 1.0;
            } else {
                // Reject: make very faint
                mesh.material.color.setHex(0xff3333); // Red
                mesh.material.opacity = 0.15;
            }
        });
        isClipping = true;
    },

    renderControls() {
        return `
            <div class="control-group">
                <button class="btn btn-primary" id="btn-clip">Start Clipping</button>
            </div>
            <div class="control-group">
                <button class="btn" id="btn-regen">Generate New Lines</button>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 15px;">
                <span style="color: #00ffaa;">■</span> Accepted / Clipped (Visible)<br>
                <span style="color: #ff3333;">■</span> Rejected (Hidden)
            </p>
        `;
    },

    bindEvents() {
        document.getElementById('btn-clip').addEventListener('click', (e) => {
            if(!isClipping) {
                this.performClipping();
                e.target.textContent = "Clipped";
                e.target.classList.remove('btn-primary');
            }
        });

        document.getElementById('btn-regen').addEventListener('click', () => {
            this.generateLines();
        });
    },

    animate() {
        // No continuous animation needed for static clipping
    }
};
