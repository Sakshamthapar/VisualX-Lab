// Central State Management
const appState = {
    activeModule: 'transform2d',
    modules: {}
};

// DOM Elements
const loader = document.getElementById('loader');
const appContainer = document.querySelector('.app-container');
const navItems = document.querySelectorAll('.nav-item');
const dynamicControls = document.getElementById('dynamic-controls');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');
const infoFormula = document.getElementById('info-formula');

// Three.js Global Setup
let scene, camera, renderer;

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-canvas'), alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Global lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00f5ff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    camera.position.z = 5;

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    // Call active module animation loop if it exists
    const activeMod = appState.modules[appState.activeModule];
    if(activeMod && activeMod.animate) {
        activeMod.animate();
    }
    
    // Use module's custom camera if defined, otherwise use global camera
    const currentCamera = (activeMod && activeMod.activeCam) ? activeMod.activeCam : camera;
    renderer.render(scene, currentCamera);
}

// Module Loading System
async function loadModule(moduleName) {
    // Clear current controls
    gsap.to(dynamicControls, { opacity: 0, duration: 0.2, onComplete: async () => {
        dynamicControls.innerHTML = '';
        
        try {
            // Dynamically import module if not already loaded
            if (!appState.modules[moduleName]) {
                const module = await import(`./modules/${moduleName}.js`);
                appState.modules[moduleName] = module.default;
            }

            const mod = appState.modules[moduleName];
            
            // Clean up previous scene objects (simplified)
            while(scene.children.length > 2){ 
                scene.remove(scene.children[2]); 
            }

            // Initialize new module
            if(mod.init) mod.init(scene, camera, renderer);
            
            // Render UI
            if(mod.renderControls) {
                dynamicControls.innerHTML = mod.renderControls();
                if(mod.bindEvents) mod.bindEvents();
            }

            // Update Info Panel
            if(mod.info) {
                gsap.to('.info-content', {opacity: 0, y: 10, duration: 0.2, onComplete: () => {
                    infoTitle.textContent = mod.info.title;
                    infoDesc.textContent = mod.info.desc;
                    infoFormula.innerHTML = `<code>${mod.info.formula}</code>`;
                    gsap.to('.info-content', {opacity: 1, y: 0, duration: 0.3});
                }});
            }
            
            gsap.to(dynamicControls, { opacity: 1, duration: 0.3 });

        } catch (error) {
            console.error(`Failed to load module: ${moduleName}`, error);
            dynamicControls.innerHTML = `<p class="text-muted">Module not found or under construction.</p>`;
            gsap.to(dynamicControls, { opacity: 1, duration: 0.3 });
        }
    }});
}

// Navigation Logic
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if(item.classList.contains('active')) return;

        // Update active class
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');

        const moduleName = item.dataset.module;
        appState.activeModule = moduleName;
        
        loadModule(moduleName);
    });
});

// App Initialization
window.addEventListener('load', () => {
    // Simulate Loading Screen
    setTimeout(() => {
        // Animate Loader Out
        gsap.to(loader, { opacity: 0, duration: 1, onComplete: () => {
            loader.style.display = 'none';
            
            // Initialize App
            initThreeJS();
            loadModule(appState.activeModule);

            // Stagger reveal of main components
            gsap.to(appContainer, { opacity: 1, duration: 0.5 });
            gsap.from('.glass-panel', { 
                y: 30, 
                opacity: 0, 
                duration: 0.8, 
                stagger: 0.1, 
                ease: 'power3.out' 
            });
        }});
    }, 2000); // 2 second mock loading
});
