/**
 * Three.js Interactive 3D World for Shivani's 19th Birthday
 * Includes:
 * - 3D Tiered Birthday Cake with Golden "19" Toppers
 * - 19 Decorative Candles + Main Interactive Flame with Blow-out Physics & Smoke
 * - Interactive 3D Floating Metallic Balloons (Tap to pop & reveal compliments)
 * - Interactive 3D Gift Box with unwrapping & lid pop animation
 * - Interactive 3D Sky Lanterns for making wishes
 * - Dreamy Floating Stardust & Fireflies
 * - Full Mobile Touch & Desktop Mouse Support with OrbitControls
 */

class BirthdayScene {
    constructor(canvasContainerId) {
        this.container = document.getElementById(canvasContainerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        // 3D Scene Elements
        this.cakeGroup = new THREE.Group();
        this.balloons = [];
        this.lanterns = [];
        this.stardustParticles = null;
        this.smokeParticles = [];

        // Candle state
        this.candleFlame = null;
        this.candleLight = null;
        this.isCandleBlown = false;

        // Gift Box state
        this.giftGroup = new THREE.Group();
        this.giftLid = null;
        this.isGiftOpened = false;

        // Interaction
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.clickableObjects = [];

        // Animation handles
        this.animFrameId = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0b0914, 0.035);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        // Adjust camera for mobile (taller view) vs desktop
        const isMobile = width < 768;
        if (isMobile) {
            this.camera.position.set(0, 4.5, 13.5);
        } else {
            this.camera.position.set(0, 4.0, 10.5);
        }

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.6;
            this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // Don't go below floor
            this.controls.minPolarAngle = Math.PI / 6;
            this.controls.minDistance = 4.5;
            this.controls.maxDistance = 18;
            this.controls.target.set(0, 1.2, 0);
        }

        // 5. Lighting
        this.setupLighting();

        // 6. Build 3D Objects
        this.buildFloorAndPedestal();
        this.buildBirthdayCake();
        this.buildGiftBox();
        this.buildBalloons();
        this.buildStardustUniverse();

        // 7. Event Listeners
        window.addEventListener('resize', this.onResize.bind(this));
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));

        // 8. Start Loop
        this.animate();
    }

    setupLighting() {
        // Soft romantic ambient
        const ambientLight = new THREE.AmbientLight(0xffe6f0, 0.7);
        this.scene.add(ambientLight);

        // Warm main spotlight over cake
        const spotLight = new THREE.SpotLight(0xfff5ea, 1.6);
        spotLight.position.set(4, 9, 5);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.8;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.bias = -0.001;
        this.scene.add(spotLight);

        // Delicate backlight/rim light with lilac pink tone
        const rimLight = new THREE.DirectionalLight(0xe9d5ff, 0.9);
        rimLight.position.set(-5, 6, -4);
        this.scene.add(rimLight);

        // Front fill light
        const fillLight = new THREE.DirectionalLight(0xfce7f3, 0.4);
        fillLight.position.set(0, 3, 6);
        this.scene.add(fillLight);
    }

    buildFloorAndPedestal() {
        // Mirrored round pedestal
        const pedestalGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.22, 64);
        const pedestalMat = new THREE.MeshStandardMaterial({
            color: 0x1f1635,
            metalness: 0.85,
            roughness: 0.25,
            envMapIntensity: 1.0
        });
        const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
        pedestal.position.y = -0.11;
        pedestal.receiveShadow = true;
        this.scene.add(pedestal);

        // Golden rim ring on pedestal
        const rimGeo = new THREE.TorusGeometry(3.7, 0.06, 16, 64);
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.9,
            roughness: 0.18
        });
        const rim = new THREE.Mesh(rimGeo, goldMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.02;
        this.scene.add(rim);

        // Faint glowing ring on floor
        const ringGeo = new THREE.RingGeometry(3.8, 4.3, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xec4899,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const glowRing = new THREE.Mesh(ringGeo, ringMat);
        glowRing.rotation.x = Math.PI / 2;
        glowRing.position.y = -0.08;
        this.scene.add(glowRing);
    }

    buildBirthdayCake() {
        this.cakeGroup.position.set(0, 0, 0);

        // Cake Stand: Elegant Gold Pedestal
        const standBaseGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.15, 48);
        const standStemGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.5, 32);
        const standPlateGeo = new THREE.CylinderGeometry(2.5, 2.3, 0.1, 48);

        const goldStandMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37, // Rich metallic gold
            metalness: 0.92,
            roughness: 0.15
        });

        const standBase = new THREE.Mesh(standBaseGeo, goldStandMat);
        standBase.position.y = 0.08;
        standBase.receiveShadow = true;
        this.cakeGroup.add(standBase);

        const standStem = new THREE.Mesh(standStemGeo, goldStandMat);
        standStem.position.y = 0.4;
        this.cakeGroup.add(standStem);

        const standPlate = new THREE.Mesh(standPlateGeo, goldStandMat);
        standPlate.position.y = 0.7;
        standPlate.receiveShadow = true;
        this.cakeGroup.add(standPlate);

        // --- CAKE TIERS ---
        // Tier 1 (Bottom Tier: Soft Pastel Rose Velvet Cream)
        const tier1Geo = new THREE.CylinderGeometry(2.0, 2.0, 0.85, 48);
        const tier1Mat = new THREE.MeshStandardMaterial({
            color: 0xfce7f3, // Soft rose cream
            roughness: 0.45,
            metalness: 0.05
        });
        const tier1 = new THREE.Mesh(tier1Geo, tier1Mat);
        tier1.position.y = 0.7 + 0.425;
        tier1.castShadow = true;
        tier1.receiveShadow = true;
        this.cakeGroup.add(tier1);

        // Gold Trim Ring between stand & Tier 1
        const trim1 = new THREE.Mesh(
            new THREE.TorusGeometry(2.02, 0.04, 16, 48),
            goldStandMat
        );
        trim1.rotation.x = Math.PI / 2;
        trim1.position.y = 0.75;
        this.cakeGroup.add(trim1);

        // Delicate pearl beads around Tier 1 rim
        const pearlCount = 28;
        const pearlGeo = new THREE.SphereGeometry(0.065, 16, 16);
        const pearlMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.7,
            roughness: 0.2
        });
        for (let i = 0; i < pearlCount; i++) {
            const angle = (i / pearlCount) * Math.PI * 2;
            const px = Math.cos(angle) * 1.98;
            const pz = Math.sin(angle) * 1.98;
            const pearl = new THREE.Mesh(pearlGeo, pearlMat);
            pearl.position.set(px, 1.13, pz);
            this.cakeGroup.add(pearl);
        }

        // Tier 2 (Middle Tier: Lavender Fondant)
        const tier2Geo = new THREE.CylinderGeometry(1.4, 1.4, 0.75, 48);
        const tier2Mat = new THREE.MeshStandardMaterial({
            color: 0xf3e8ff, // Pastel lavender
            roughness: 0.4,
            metalness: 0.08
        });
        const tier2 = new THREE.Mesh(tier2Geo, tier2Mat);
        tier2.position.y = 1.125 + 0.375;
        tier2.castShadow = true;
        tier2.receiveShadow = true;
        this.cakeGroup.add(tier2);

        // Dripping Cream Overlay on Tier 2
        const dripGeo = new THREE.CylinderGeometry(1.43, 1.43, 0.2, 48);
        const dripMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1
        });
        const drip = new THREE.Mesh(dripGeo, dripMat);
        drip.position.y = 1.78;
        this.cakeGroup.add(drip);

        // Tier 3 (Top Tier: Champagne Silk Cream)
        const tier3Geo = new THREE.CylinderGeometry(0.85, 0.85, 0.65, 36);
        const tier3Mat = new THREE.MeshStandardMaterial({
            color: 0xfffbeb,
            roughness: 0.35,
            metalness: 0.05
        });
        const tier3 = new THREE.Mesh(tier3Geo, tier3Mat);
        tier3.position.y = 1.875 + 0.325;
        tier3.castShadow = true;
        tier3.receiveShadow = true;
        this.cakeGroup.add(tier3);

        // Top Tier Gold Piping
        const topTrim = new THREE.Mesh(
            new THREE.TorusGeometry(0.86, 0.035, 16, 36),
            goldStandMat
        );
        topTrim.rotation.x = Math.PI / 2;
        topTrim.position.y = 2.2;
        this.cakeGroup.add(topTrim);

        // --- 19 MINI CANDLES AROUND TIER 1 & TIER 2 ---
        // (Representing her 19 precious years!)
        const miniCandleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 12);
        const miniCandleMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });
        const miniFlameGeo = new THREE.SphereGeometry(0.035, 12, 12);
        const miniFlameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

        for (let i = 0; i < 19; i++) {
            // Place on the shoulder of tier 1
            const angle = (i / 19) * Math.PI * 2;
            const r = 1.68;
            const cx = Math.cos(angle) * r;
            const cz = Math.sin(angle) * r;

            const mc = new THREE.Mesh(miniCandleGeo, miniCandleMat);
            mc.position.set(cx, 1.25, cz);
            this.cakeGroup.add(mc);

            const mf = new THREE.Mesh(miniFlameGeo, miniFlameMat);
            mf.position.set(cx, 1.4, cz);
            mf.scale.set(0.8, 1.5, 0.8);
            this.cakeGroup.add(mf);
        }

        // --- GLORIOUS 3D "19" GOLDEN TOPPER ---
        this.build19NumberTopper();

        // --- MAIN CENTER CANDLE & FLICKERING FLAME ---
        this.buildMainCandle();

        this.scene.add(this.cakeGroup);
    }

    build19NumberTopper() {
        const topperGroup = new THREE.Group();
        topperGroup.position.set(0, 2.25, 0);

        const goldMetalMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.95,
            roughness: 0.12,
            envMapIntensity: 1.5
        });

        // Digit '1':
        const digit1Group = new THREE.Group();
        // Vertical stem of '1'
        const stem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 24), goldMetalMat);
        stem1.position.set(0, 0.45, 0);
        stem1.castShadow = true;
        digit1Group.add(stem1);

        // Top beak of '1'
        const beak1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 24), goldMetalMat);
        beak1.rotation.z = Math.PI / 3.5;
        beak1.position.set(-0.12, 0.76, 0);
        digit1Group.add(beak1);

        // Base foot of '1'
        const foot1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 24), goldMetalMat);
        foot1.rotation.z = Math.PI / 2;
        foot1.position.set(0, 0.03, 0);
        digit1Group.add(foot1);

        digit1Group.position.set(-0.4, 0, 0.2);
        topperGroup.add(digit1Group);

        // Digit '9':
        const digit9Group = new THREE.Group();
        // Upper loop (Torus)
        const loop9 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 16, 32), goldMetalMat);
        loop9.position.set(0, 0.65, 0);
        loop9.castShadow = true;
        digit9Group.add(loop9);

        // Right curving spine & hook
        const spine9 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.65, 24), goldMetalMat);
        spine9.position.set(0.24, 0.45, 0);
        spine9.castShadow = true;
        digit9Group.add(spine9);

        // Bottom tail curve
        const tail9 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 16, 24, Math.PI), goldMetalMat);
        tail9.rotation.z = Math.PI;
        tail9.position.set(0.06, 0.12, 0);
        digit9Group.add(tail9);

        digit9Group.position.set(0.4, 0, 0.2);
        topperGroup.add(digit9Group);

        // Little sparkling star between 1 and 9
        const starGeo = new THREE.OctahedronGeometry(0.12, 0);
        const starMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(0, 0.85, 0.22);
        topperGroup.add(star);

        this.cakeGroup.add(topperGroup);
    }

    buildMainCandle() {
        const candleGroup = new THREE.Group();
        candleGroup.position.set(0, 2.2, -0.25);

        // Candle wax body: Spiral pastel pink/gold
        const candleBodyGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 24);
        const candleBodyMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.1
        });
        const candleBody = new THREE.Mesh(candleBodyGeo, candleBodyMat);
        candleBody.position.y = 0.35;
        candleBody.castShadow = true;
        candleGroup.add(candleBody);

        // Spiral stripe
        const stripeGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.1, 24);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
        const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe1.position.y = 0.25;
        candleGroup.add(stripe1);
        const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe2.position.y = 0.5;
        candleGroup.add(stripe2);

        // Wick
        const wickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
        const wickMat = new THREE.MeshBasicMaterial({ color: 0x1f1f1f });
        const wick = new THREE.Mesh(wickGeo, wickMat);
        wick.position.y = 0.74;
        candleGroup.add(wick);

        // Realistic Flame: Teardrop layered mesh
        const flameGroup = new THREE.Group();
        flameGroup.position.set(0, 0.84, 0);

        // Outer warm orange/red flame
        const outerFlameGeo = new THREE.ConeGeometry(0.08, 0.24, 16);
        outerFlameGeo.translate(0, 0.12, 0);
        const outerFlameMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.85
        });
        const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
        flameGroup.add(outerFlame);

        // Inner glowing core
        const innerFlameGeo = new THREE.ConeGeometry(0.045, 0.16, 16);
        innerFlameGeo.translate(0, 0.08, 0);
        const innerFlameMat = new THREE.MeshBasicMaterial({
            color: 0xfffb88
        });
        const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
        flameGroup.add(innerFlame);

        // Point Light from candle flame
        this.candleLight = new THREE.PointLight(0xffaa33, 2.2, 7.0);
        this.candleLight.position.set(0, 0.9, 0);
        this.candleLight.castShadow = true;
        this.candleLight.shadow.bias = -0.002;
        candleGroup.add(this.candleLight);

        candleGroup.add(flameGroup);
        this.candleFlame = flameGroup;

        // Make candle clickable
        candleBody.userData = { type: 'candle' };
        outerFlame.userData = { type: 'candle' };
        this.clickableObjects.push(candleBody, outerFlame);

        this.cakeGroup.add(candleGroup);
    }

    buildGiftBox() {
        this.giftGroup.position.set(2.4, 0, 1.2);
        this.giftGroup.rotation.y = -Math.PI / 5;

        const boxSize = 1.0;
        // Box Body
        const boxGeo = new THREE.BoxGeometry(boxSize, boxSize * 0.7, boxSize);
        const boxMat = new THREE.MeshStandardMaterial({
            color: 0x8b5cf6, // Elegant royal violet
            roughness: 0.35,
            metalness: 0.25
        });
        const boxBody = new THREE.Mesh(boxGeo, boxMat);
        boxBody.position.y = (boxSize * 0.7) / 2;
        boxBody.castShadow = true;
        boxBody.receiveShadow = true;
        this.giftGroup.add(boxBody);

        // Ribbon on box body
        const ribbonMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b, // Shimmering Gold Ribbon
            metalness: 0.8,
            roughness: 0.2
        });
        const ribHGeo = new THREE.BoxGeometry(boxSize * 1.01, boxSize * 0.71, 0.18);
        const ribH = new THREE.Mesh(ribHGeo, ribbonMat);
        ribH.position.y = (boxSize * 0.7) / 2;
        this.giftGroup.add(ribH);

        const ribVGeo = new THREE.BoxGeometry(0.18, boxSize * 0.71, boxSize * 1.01);
        const ribV = new THREE.Mesh(ribVGeo, ribbonMat);
        ribV.position.y = (boxSize * 0.7) / 2;
        this.giftGroup.add(ribV);

        // Lid Group (Animates open!)
        this.giftLid = new THREE.Group();
        this.giftLid.position.set(0, boxSize * 0.7, 0);

        const lidGeo = new THREE.BoxGeometry(boxSize * 1.06, 0.22, boxSize * 1.06);
        const lidMesh = new THREE.Mesh(lidGeo, boxMat);
        lidMesh.position.y = 0.11;
        lidMesh.castShadow = true;
        this.giftLid.add(lidMesh);

        // Lid Ribbon
        const lidRibH = new THREE.Mesh(new THREE.BoxGeometry(boxSize * 1.08, 0.23, 0.19), ribbonMat);
        lidRibH.position.y = 0.11;
        this.giftLid.add(lidRibH);

        const lidRibV = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.23, boxSize * 1.08), ribbonMat);
        lidRibV.position.y = 0.11;
        this.giftLid.add(lidRibV);

        // Bow Loops
        const bowGeo = new THREE.TorusGeometry(0.16, 0.05, 12, 24);
        const bow1 = new THREE.Mesh(bowGeo, ribbonMat);
        bow1.rotation.y = Math.PI / 4;
        bow1.rotation.x = Math.PI / 3;
        bow1.position.set(-0.1, 0.28, -0.1);
        this.giftLid.add(bow1);

        const bow2 = new THREE.Mesh(bowGeo, ribbonMat);
        bow2.rotation.y = -Math.PI / 4;
        bow2.rotation.x = Math.PI / 3;
        bow2.position.set(0.1, 0.28, 0.1);
        this.giftLid.add(bow2);

        this.giftGroup.add(this.giftLid);

        // Register for click
        boxBody.userData = { type: 'gift' };
        lidMesh.userData = { type: 'gift' };
        this.clickableObjects.push(boxBody, lidMesh);

        this.scene.add(this.giftGroup);
    }

    buildBalloons() {
        // Vibrant, metallic pastel colors
        const balloonColors = [
            0xf472b6, // Rose pink
            0xc084fc, // Soft violet
            0xfcd34d, // Champagne gold
            0x6ee7b7, // Mint frost
            0xfb7185, // Radiant coral
            0x93c5fd, // Sky shimmer
            0xf43f5e  // Deep rose
        ];

        const balloonConfigs = [
            { x: -2.8, y: 3.5, z: -1.2, scale: 0.9, speed: 1.1, offset: 0.0, colorIdx: 0 },
            { x: -3.2, y: 4.8, z: 1.5, scale: 1.05, speed: 0.9, offset: 1.2, colorIdx: 1 },
            { x: -1.8, y: 5.5, z: -2.2, scale: 0.85, speed: 1.3, offset: 2.1, colorIdx: 2 },
            { x: 2.8, y: 4.0, z: -1.8, scale: 0.95, speed: 1.0, offset: 0.5, colorIdx: 3 },
            { x: 3.4, y: 5.2, z: 0.8, scale: 1.1, speed: 0.85, offset: 1.8, colorIdx: 4 },
            { x: 1.9, y: 5.8, z: -2.0, scale: 0.9, speed: 1.15, offset: 2.7, colorIdx: 5 },
            { x: 0.0, y: 6.2, z: -3.0, scale: 1.0, speed: 0.75, offset: 3.3, colorIdx: 6 }
        ];

        balloonConfigs.forEach((cfg, idx) => {
            const balloonGroup = new THREE.Group();
            balloonGroup.position.set(cfg.x, cfg.y, cfg.z);

            // Balloon Geometry: Stretched Sphere
            const geo = new THREE.SphereGeometry(0.7, 32, 32);
            // Non-uniform scale gives authentic balloon shape
            geo.scale(1.0, 1.25, 1.0);

            const mat = new THREE.MeshStandardMaterial({
                color: balloonColors[cfg.colorIdx],
                metalness: 0.65,
                roughness: 0.22,
                envMapIntensity: 1.2
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            balloonGroup.add(mesh);

            // Tie knot at bottom
            const knotGeo = new THREE.ConeGeometry(0.08, 0.12, 12);
            const knot = new THREE.Mesh(knotGeo, mat);
            knot.position.y = -0.9;
            balloonGroup.add(knot);

            // Curving String
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, -0.9, 0),
                new THREE.Vector3(0.08, -1.8, 0.05),
                new THREE.Vector3(-0.06, -2.8, -0.05),
                new THREE.Vector3(0.02, -3.8, 0)
            ]);
            const points = curve.getPoints(24);
            const stringGeo = new THREE.BufferGeometry().setFromPoints(points);
            const stringMat = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.35
            });
            const stringLine = new THREE.Line(stringGeo, stringMat);
            balloonGroup.add(stringLine);

            balloonGroup.userData = {
                type: 'balloon',
                index: idx,
                initialY: cfg.y,
                initialX: cfg.x,
                speed: cfg.speed,
                offset: cfg.offset,
                popped: false,
                meshRef: mesh
            };

            mesh.userData = { type: 'balloon', parentGroup: balloonGroup, index: idx };
            this.clickableObjects.push(mesh);

            this.scene.add(balloonGroup);
            this.balloons.push(balloonGroup);
        });
    }

    buildStardustUniverse() {
        const particleCount = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);

        const palette = [
            new THREE.Color(0xfbcfe8), // rose
            new THREE.Color(0xfde047), // gold
            new THREE.Color(0xe9d5ff), // purple
            new THREE.Color(0xffffff)  // diamond
        ];

        for (let i = 0; i < particleCount; i++) {
            // Spread across 3D sphere radius 18
            const r = 3.5 + Math.random() * 16;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) + 2.0;
            positions[i * 3 + 2] = r * Math.cos(phi);

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;

            scales[i] = Math.random() * 0.08 + 0.03;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Soft circular particle shader/material
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,240,200,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
            size: 0.18,
            map: texture,
            transparent: true,
            opacity: 0.85,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.stardustParticles = new THREE.Points(geometry, material);
        this.scene.add(this.stardustParticles);
    }

    // --- INTERACTIVE ACTIONS ---

    /**
     * Blow out the birthday candle
     */
    blowCandle() {
        if (this.isCandleBlown) return;
        this.isCandleBlown = true;

        if (window.soundEngine) {
            window.soundEngine.sfxCandleBlow();
        }

        // Spawn wispy smoke particles
        this.spawnSmokeParticles(new THREE.Vector3(0, 3.1, -0.25));

        // Animate flame shrinking and light fading
        const startTime = performance.now();
        const duration = 600;

        const shrinkFlame = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1.0);

            if (this.candleFlame) {
                const s = 1.0 - progress;
                this.candleFlame.scale.set(s, s, s);
            }
            if (this.candleLight) {
                this.candleLight.intensity = 2.2 * (1.0 - progress);
            }

            if (progress < 1.0) {
                requestAnimationFrame(shrinkFlame);
            } else {
                if (this.candleFlame) this.candleFlame.visible = false;
                if (this.candleLight) this.candleLight.intensity = 0;
            }
        };
        shrinkFlame();

        // Trigger celebratory fireworks/confetti
        if (window.triggerCelebration) {
            window.triggerCelebration();
        }
    }

    /**
     * Re-light candle if user wants to celebrate again
     */
    relightCandle() {
        this.isCandleBlown = false;
        if (this.candleFlame) {
            this.candleFlame.visible = true;
            this.candleFlame.scale.set(1, 1, 1);
        }
        if (this.candleLight) {
            this.candleLight.intensity = 2.2;
        }
    }

    spawnSmokeParticles(origin) {
        for (let i = 0; i < 18; i++) {
            const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.6
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(origin);
            p.userData = {
                vx: (Math.random() - 0.5) * 0.02,
                vy: 0.04 + Math.random() * 0.04,
                vz: (Math.random() - 0.5) * 0.02,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.01
            };
            this.scene.add(p);
            this.smokeParticles.push(p);
        }
    }

    /**
     * Open the 3D Gift Box
     */
    openGiftBox() {
        if (this.isGiftOpened) return;
        this.isGiftOpened = true;

        if (window.soundEngine) {
            window.soundEngine.sfxGiftOpen();
        }

        // Animate lid flying up and tipping
        const startY = this.giftLid.position.y;
        const targetY = startY + 1.6;
        const startTime = performance.now();
        const duration = 800;

        const animateLid = () => {
            const elapsed = performance.now() - startTime;
            const t = Math.min(elapsed / duration, 1.0);
            // Ease out back
            const ease = 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

            this.giftLid.position.y = THREE.MathUtils.lerp(startY, targetY, ease);
            this.giftLid.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 4, t);
            this.giftLid.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 6, t);

            if (t < 1.0) {
                requestAnimationFrame(animateLid);
            }
        };
        animateLid();

        // Open letter modal in UI
        if (window.openGiftLetterModal) {
            setTimeout(() => {
                window.openGiftLetterModal();
            }, 500);
        }
    }

    /**
     * Release a 3D Glowing Sky Lantern
     */
    releaseSkyLantern(customWishText = "") {
        const lanternGroup = new THREE.Group();
        // Start near pedestal
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.5 + Math.random() * 1.5;
        lanternGroup.position.set(
            Math.cos(angle) * radius,
            0.5,
            Math.sin(angle) * radius
        );

        // Lantern Body
        const geo = new THREE.CylinderGeometry(0.35, 0.28, 0.75, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffedd5,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.9,
            roughness: 0.4,
            transparent: true,
            opacity: 0.92
        });
        const mesh = new THREE.Mesh(geo, mat);
        lanternGroup.add(mesh);

        // Warm internal light
        const light = new THREE.PointLight(0xff9900, 1.2, 5.0);
        light.position.y = 0.1;
        lanternGroup.add(light);

        lanternGroup.userData = {
            vy: 0.035 + Math.random() * 0.02,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            driftX: (Math.random() - 0.5) * 0.015,
            driftZ: (Math.random() - 0.5) * 0.015,
            wishText: customWishText
        };

        this.scene.add(lanternGroup);
        this.lanterns.push(lanternGroup);

        if (window.soundEngine) {
            window.soundEngine.sfxLanternRelease();
        }
    }

    /**
     * Pop a specific balloon by index
     */
    popBalloon(balloonGroup) {
        if (!balloonGroup || balloonGroup.userData.popped) return;
        balloonGroup.userData.popped = true;

        if (window.soundEngine) {
            window.soundEngine.sfxBalloonPop();
        }

        // Hide mesh
        balloonGroup.userData.meshRef.visible = false;

        // Reveal compliment modal/card
        if (window.showBalloonNote) {
            window.showBalloonNote(balloonGroup.userData.index);
        }

        // Respawn balloon after 7 seconds
        setTimeout(() => {
            balloonGroup.userData.popped = false;
            balloonGroup.userData.meshRef.visible = true;
            balloonGroup.position.y = -1.5; // Rise up smoothly
        }, 7000);
    }

    // --- POINTER / TOUCH HANDLER ---
    onPointerDown(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.clickableObjects, true);

        if (intersects.length > 0) {
            let hit = intersects[0].object;
            // Climb up hierarchy to find type
            while (hit && !hit.userData.type && hit.parent) {
                hit = hit.parent;
            }

            if (hit && hit.userData) {
                if (hit.userData.type === 'candle') {
                    if (this.isCandleBlown) {
                        this.relightCandle();
                    } else {
                        this.blowCandle();
                    }
                } else if (hit.userData.type === 'gift') {
                    this.openGiftBox();
                } else if (hit.userData.type === 'balloon') {
                    const group = hit.userData.parentGroup || hit;
                    this.popBalloon(group);
                }
            }
        }
    }

    onResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Adjust camera position on resize for mobile responsiveness
        const isMobile = width < 768;
        if (isMobile) {
            this.camera.position.setLength(13.5);
        }
    }

    // --- MAIN RENDER LOOP ---
    animate() {
        this.animFrameId = requestAnimationFrame(this.animate.bind(this));

        const time = this.clock.getElapsedTime();

        // 1. Controls update
        if (this.controls) {
            this.controls.update();
        }

        // 2. Candle flame flicker
        if (this.candleFlame && !this.isCandleBlown) {
            const flicker = Math.sin(time * 18) * 0.08 + Math.cos(time * 26) * 0.05;
            this.candleFlame.scale.set(1.0 + flicker, 1.0 + flicker * 1.5, 1.0 + flicker);
            this.candleFlame.rotation.z = Math.sin(time * 12) * 0.06;
            if (this.candleLight) {
                this.candleLight.intensity = 2.2 + flicker * 2.0;
            }
        }

        // 3. Float & Bob Balloons
        this.balloons.forEach((b) => {
            if (!b.userData.popped) {
                const u = b.userData;
                const bob = Math.sin(time * u.speed + u.offset) * 0.25;
                const sway = Math.cos(time * 0.8 + u.offset) * 0.12;
                b.position.y = u.initialY + bob;
                b.position.x = u.initialX + sway;
                b.rotation.z = Math.sin(time * 0.5 + u.offset) * 0.08;
            }
        });

        // 4. Sky Lanterns rising upwards
        for (let i = this.lanterns.length - 1; i >= 0; i--) {
            const l = this.lanterns[i];
            l.position.y += l.userData.vy;
            l.position.x += l.userData.driftX;
            l.position.z += l.userData.driftZ;
            l.rotation.y += l.userData.rotSpeed;

            // Remove when high in the sky
            if (l.position.y > 25) {
                this.scene.remove(l);
                this.lanterns.splice(i, 1);
            }
        }

        // 5. Smoke particles update
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.position.x += p.userData.vx;
            p.position.y += p.userData.vy;
            p.position.z += p.userData.vz;
            p.userData.life -= p.userData.decay;
            p.material.opacity = p.userData.life * 0.5;
            p.scale.multiplyScalar(1.025);

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.smokeParticles.splice(i, 1);
            }
        }

        // 6. Slowly rotate stardust universe
        if (this.stardustParticles) {
            this.stardustParticles.rotation.y = time * 0.025;
        }

        // 7. Render
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
        }
        window.removeEventListener('resize', this.onResize);
    }
}

// Global scene instance initialization helper
window.initBirthdayScene = function(containerId) {
    return new BirthdayScene(containerId);
};
