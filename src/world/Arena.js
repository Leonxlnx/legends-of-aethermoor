import * as THREE from 'three';

export class Arena {
    constructor(scene) {
        this.scene = scene;
        this.torchLights = [];
        this.time = 0;
        this.build();
    }

    build() {
        // ===== GROUND: Large stone floor =====
        const floorRadius = 25;
        const floorGeo = new THREE.CircleGeometry(floorRadius, 64);
        floorGeo.rotateX(-Math.PI / 2);

        // Create stone-like texture with canvas
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 1024;
        floorCanvas.height = 1024;
        const fCtx = floorCanvas.getContext('2d');

        // Base stone — bright and visible
        fCtx.fillStyle = '#a09888';
        fCtx.fillRect(0, 0, 1024, 1024);

        // Stone tile pattern
        const tileSize = 64;
        for (let x = 0; x < 1024; x += tileSize) {
            for (let y = 0; y < 1024; y += tileSize) {
                const brightness = 140 + Math.random() * 30;
                const offset = Math.random() * 10;
                fCtx.fillStyle = `rgb(${brightness + offset}, ${brightness - 4}, ${brightness - 10})`;
                fCtx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

                // Subtle cracks
                if (Math.random() > 0.7) {
                    fCtx.strokeStyle = `rgba(20, 18, 16, ${0.3 + Math.random() * 0.3})`;
                    fCtx.lineWidth = 1;
                    fCtx.beginPath();
                    fCtx.moveTo(x + Math.random() * tileSize, y + Math.random() * tileSize);
                    fCtx.lineTo(x + Math.random() * tileSize, y + Math.random() * tileSize);
                    fCtx.stroke();
                }
            }
        }

        // Circular center marking
        fCtx.strokeStyle = 'rgba(80, 70, 55, 0.3)';
        fCtx.lineWidth = 3;
        fCtx.beginPath();
        fCtx.arc(512, 512, 200, 0, Math.PI * 2);
        fCtx.stroke();
        fCtx.beginPath();
        fCtx.arc(512, 512, 280, 0, Math.PI * 2);
        fCtx.stroke();

        const floorTex = new THREE.CanvasTexture(floorCanvas);
        floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;

        // Normal map from height canvas
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = 512;
        normalCanvas.height = 512;
        const nCtx = normalCanvas.getContext('2d');
        nCtx.fillStyle = '#8080ff'; // flat normal
        nCtx.fillRect(0, 0, 512, 512);
        for (let x = 0; x < 512; x += 32) {
            for (let y = 0; y < 512; y += 32) {
                // Tile edges as normal bumps
                nCtx.fillStyle = `rgb(${128 + (Math.random() - 0.5) * 30}, ${128 + (Math.random() - 0.5) * 30}, 255)`;
                nCtx.fillRect(x + 1, y + 1, 30, 30);
                nCtx.fillStyle = `rgb(${128 - 15}, ${128 - 15}, 230)`;
                nCtx.fillRect(x, y, 32, 1);
                nCtx.fillRect(x, y, 1, 32);
            }
        }
        const normalTex = new THREE.CanvasTexture(normalCanvas);
        normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;

        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTex,
            normalMap: normalTex,
            normalScale: new THREE.Vector2(0.3, 0.3),
            roughness: 0.85,
            metalness: 0.05,
            color: 0xc0b8ae,
        });

        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // ===== OUTER RING: Rough ground beyond the arena =====
        const outerGeo = new THREE.RingGeometry(floorRadius, floorRadius + 30, 64);
        outerGeo.rotateX(-Math.PI / 2);
        const outerMat = new THREE.MeshStandardMaterial({
            color: 0x6a6458,
            roughness: 1.0,
            metalness: 0,
        });
        const outer = new THREE.Mesh(outerGeo, outerMat);
        outer.position.y = -0.1;
        outer.receiveShadow = true;
        this.scene.add(outer);

        // ===== PILLARS: 8 stone columns around the arena =====
        const pillarCount = 8;
        for (let i = 0; i < pillarCount; i++) {
            const angle = (i / pillarCount) * Math.PI * 2;
            const px = Math.cos(angle) * (floorRadius - 1.5);
            const pz = Math.sin(angle) * (floorRadius - 1.5);
            this.createPillar(px, pz, angle);

            // Torch on every other pillar
            if (i % 2 === 0) {
                this.createTorch(px, 4.5, pz, angle);
            }
        }

        // ===== CENTRAL ALTAR =====
        this.createAltar();

        // ===== AMBIENT ELEMENTS =====
        this.createBrokenPillars();
        this.createSteps();

        // ===== LIGHTING =====
        this.setupLighting();
    }

    createPillar(x, z, angle) {
        const pillarGroup = new THREE.Group();

        // Base
        const baseGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.4, 8);
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0xa09890,
            roughness: 0.9,
            metalness: 0.02,
        });
        const base = new THREE.Mesh(baseGeo, stoneMat);
        base.position.y = 0.2;
        base.castShadow = true;
        base.receiveShadow = true;
        pillarGroup.add(base);

        // Main column (fluted)
        const colGeo = new THREE.CylinderGeometry(0.4, 0.5, 5, 12);
        const column = new THREE.Mesh(colGeo, stoneMat);
        column.position.y = 2.9;
        column.castShadow = true;
        column.receiveShadow = true;
        pillarGroup.add(column);

        // Capital (ornamental top)
        const capGeo = new THREE.CylinderGeometry(0.65, 0.4, 0.5, 8);
        const cap = new THREE.Mesh(capGeo, stoneMat);
        cap.position.y = 5.65;
        cap.castShadow = true;
        pillarGroup.add(cap);

        // Top slab
        const slabGeo = new THREE.BoxGeometry(1.4, 0.15, 1.4);
        const slab = new THREE.Mesh(slabGeo, stoneMat);
        slab.position.y = 6.0;
        slab.castShadow = true;
        pillarGroup.add(slab);

        pillarGroup.position.set(x, 0, z);
        this.scene.add(pillarGroup);
    }

    createTorch(x, y, z, angle) {
        const torchGroup = new THREE.Group();

        // Bracket
        const bracketGeo = new THREE.BoxGeometry(0.06, 0.06, 0.5);
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x2a2218,
            roughness: 0.4,
            metalness: 0.7,
        });
        const bracket = new THREE.Mesh(bracketGeo, metalMat);
        torchGroup.add(bracket);

        // Torch head
        const headGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x3a2a15, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.15, -0.2);
        torchGroup.add(head);

        // Flame (emissive cone)
        const flameGeo = new THREE.ConeGeometry(0.08, 0.25, 5);
        const flameMat = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 3,
            transparent: true,
            opacity: 0.9,
        });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(0, 0.42, -0.2);
        torchGroup.add(flame);

        // Inner bright flame
        const innerGeo = new THREE.ConeGeometry(0.04, 0.15, 4);
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0xffcc44,
            emissive: 0xffaa22,
            emissiveIntensity: 5,
            transparent: true,
            opacity: 0.8,
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.set(0, 0.42, -0.2);
        torchGroup.add(inner);

        // Point light
        const light = new THREE.PointLight(0xff7722, 2.5, 18, 1.5);
        light.position.set(0, 0.5, -0.2);
        light.castShadow = true;
        light.shadow.mapSize.set(512, 512);
        light.shadow.bias = -0.005;
        torchGroup.add(light);

        this.torchLights.push({ light, flame, inner, baseIntensity: 2.5 });

        // Aim outward from pillar center
        torchGroup.position.set(x, y, z);
        torchGroup.rotation.y = angle + Math.PI;
        this.scene.add(torchGroup);
    }

    createAltar() {
        const altarGroup = new THREE.Group();
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x504a42,
            roughness: 0.85,
            metalness: 0.05,
        });

        // Base platform (2 levels)
        const base1 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.3, 8), stoneMat);
        base1.position.y = 0.15;
        base1.receiveShadow = true;
        base1.castShadow = true;
        altarGroup.add(base1);

        const base2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 0.25, 8), stoneMat);
        base2.position.y = 0.42;
        base2.receiveShadow = true;
        base2.castShadow = true;
        altarGroup.add(base2);

        // Central stone (where player "awakens")
        const centralGeo = new THREE.BoxGeometry(1.8, 0.35, 0.9);
        const centralMat = new THREE.MeshStandardMaterial({
            color: 0x5a544c,
            roughness: 0.7,
            metalness: 0.1,
        });
        const central = new THREE.Mesh(centralGeo, centralMat);
        central.position.y = 0.72;
        central.castShadow = true;
        central.receiveShadow = true;
        altarGroup.add(central);

        // Rune glow on altar
        const runeLight = new THREE.PointLight(0x4488aa, 1.5, 8);
        runeLight.position.y = 1.2;
        altarGroup.add(runeLight);
        this.runeLight = runeLight;

        this.scene.add(altarGroup);
    }

    createBrokenPillars() {
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x4a4540,
            roughness: 0.95,
            metalness: 0.02,
        });

        const positions = [
            { x: -10, z: 8, h: 1.5, r: 0.3 },
            { x: 12, z: -6, h: 2.2, r: 0.25 },
            { x: -8, z: -12, h: 0.8, r: 0.35 },
            { x: 15, z: 10, h: 1.8, r: 0.28 },
        ];

        for (const p of positions) {
            const geo = new THREE.CylinderGeometry(p.r * 0.8, p.r, p.h, 8);
            const pillar = new THREE.Mesh(geo, stoneMat);
            pillar.position.set(p.x, p.h / 2, p.z);
            pillar.rotation.set(Math.random() * 0.15, 0, Math.random() * 0.1);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);

            // Fallen debris
            const debrisGeo = new THREE.CylinderGeometry(p.r * 0.6, p.r * 0.7, p.h * 0.6, 6);
            const debris = new THREE.Mesh(debrisGeo, stoneMat);
            debris.position.set(p.x + 1.2, 0.15, p.z + 0.8);
            debris.rotation.z = Math.PI / 2;
            debris.rotation.y = Math.random() * Math.PI;
            debris.castShadow = true;
            this.scene.add(debris);
        }
    }

    createSteps() {
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x4a4540,
            roughness: 0.9,
            metalness: 0.03,
        });

        // 4 sets of steps leading into the arena
        for (let dir = 0; dir < 4; dir++) {
            const angle = (dir / 4) * Math.PI * 2 + Math.PI / 4;
            for (let s = 0; s < 3; s++) {
                const dist = 22 + s * 1.5;
                const sx = Math.cos(angle) * dist;
                const sz = Math.sin(angle) * dist;
                const step = new THREE.Mesh(
                    new THREE.BoxGeometry(3, 0.2 + s * 0.08, 1.2),
                    stoneMat
                );
                step.position.set(sx, -0.05 - s * 0.12, sz);
                step.rotation.y = angle;
                step.receiveShadow = true;
                step.castShadow = true;
                this.scene.add(step);
            }
        }
    }

    setupLighting() {
        // Main directional — bright dramatic key light
        const dirLight = new THREE.DirectionalLight(0xffeedd, 2.5);
        dirLight.position.set(30, 40, -20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        dirLight.shadow.camera.left = -35;
        dirLight.shadow.camera.right = 35;
        dirLight.shadow.camera.top = 35;
        dirLight.shadow.camera.bottom = -35;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.bias = -0.001;
        this.scene.add(dirLight);

        // Strong fill from opposite side
        const fillLight = new THREE.DirectionalLight(0x99aacc, 0.8);
        fillLight.position.set(-20, 15, 15);
        this.scene.add(fillLight);

        // Bright hemisphere ambient
        const hemi = new THREE.HemisphereLight(0x6688aa, 0x443830, 1.0);
        this.scene.add(hemi);

        // Ground-level illumination for character readability
        const ground = new THREE.PointLight(0xaa9988, 1.2, 50);
        ground.position.set(0, 0.5, 0);
        this.scene.add(ground);

        // Very light atmospheric fog — matches sky horizon, not pitch black
        this.scene.fog = new THREE.FogExp2(0x352820, 0.008);
    }

    update(dt) {
        this.time += dt;

        // Flicker torches
        for (const torch of this.torchLights) {
            const flicker = 1 + Math.sin(this.time * 8 + Math.random() * 0.5) * 0.15 +
                Math.sin(this.time * 13) * 0.08 +
                Math.random() * 0.05;
            torch.light.intensity = torch.baseIntensity * flicker;
            torch.flame.scale.y = 0.9 + Math.sin(this.time * 10) * 0.15;
            torch.flame.rotation.z = Math.sin(this.time * 7) * 0.1;
            torch.inner.scale.y = 0.85 + Math.sin(this.time * 14) * 0.2;
        }

        // Pulse rune light
        if (this.runeLight) {
            this.runeLight.intensity = 1.0 + Math.sin(this.time * 1.5) * 0.5;
        }
    }

    getHeightAt(x, z) {
        return 0; // Flat arena
    }
}
