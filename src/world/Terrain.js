import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.size = 400;
        this.segments = 200;
        this.noise2D = createNoise2D();
        this.mesh = null;
        this.heightData = [];
        this.generate();
    }

    fbm(x, z, octaves = 6) {
        let value = 0, amp = 1, freq = 0.005, maxAmp = 0;
        for (let i = 0; i < octaves; i++) {
            value += this.noise2D(x * freq, z * freq) * amp;
            maxAmp += amp;
            amp *= 0.5;
            freq *= 2.0;
        }
        return value / maxAmp;
    }

    getHeight(x, z) {
        const h = this.fbm(x, z);
        // Create valleys and peaks
        const base = h * 35;
        // Flatten center area for spawn
        const distFromCenter = Math.sqrt(x * x + z * z);
        const flattenFactor = Math.max(0, 1 - distFromCenter / 30);
        return base * (1 - flattenFactor * 0.8);
    }

    generate() {
        const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const h = this.getHeight(x, z);
            pos.setY(i, h);
        }

        geo.computeVertexNormals();

        // Altitude-based vertex colors
        const colors = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            const n = (y + 35) / 70; // normalize 
            let r, g, b;
            if (n < 0.35) { // water level / sand
                r = 0.76; g = 0.7; b = 0.5;
            } else if (n < 0.5) { // grass
                const t = (n - 0.35) / 0.15;
                r = 0.2 + t * 0.1; g = 0.45 + t * 0.15; b = 0.15;
            } else if (n < 0.65) { // dark grass
                r = 0.25; g = 0.5; b = 0.18;
            } else if (n < 0.8) { // rock
                const t = (n - 0.65) / 0.15;
                r = 0.35 + t * 0.15; g = 0.33 + t * 0.12; b = 0.28 + t * 0.1;
            } else { // snow caps
                const t = (n - 0.8) / 0.2;
                r = 0.6 + t * 0.35; g = 0.6 + t * 0.35; b = 0.65 + t * 0.3;
            }
            // Add noise variation
            const nv = this.noise2D(pos.getX(i) * 0.1, pos.getZ(i) * 0.1) * 0.05;
            colors[i * 3] = Math.max(0, Math.min(1, r + nv));
            colors[i * 3 + 1] = Math.max(0, Math.min(1, g + nv));
            colors[i * 3 + 2] = Math.max(0, Math.min(1, b + nv));
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: false,
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    getHeightAt(x, z) {
        return this.getHeight(x, z);
    }

    getNormalAt(x, z) {
        const eps = 0.5;
        const hL = this.getHeightAt(x - eps, z);
        const hR = this.getHeightAt(x + eps, z);
        const hD = this.getHeightAt(x, z - eps);
        const hU = this.getHeightAt(x, z + eps);
        const normal = new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
        return normal;
    }
}
