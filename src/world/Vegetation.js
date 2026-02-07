import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class Vegetation {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.noise2D = createNoise2D();
        this.createTrees();
        this.createRocks();
    }

    createTrees() {
        // Trunk instanced mesh
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 3, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });
        const canopyGeo = new THREE.SphereGeometry(1.8, 8, 6);
        const count = 500;

        const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
        trunkMesh.castShadow = true;

        const canopyColors = [0x2d5a1e, 0x3a6b2a, 0x1e4a15, 0x4a7a32];
        const canopyMeshes = [];
        canopyColors.forEach(c => {
            const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
            const mesh = new THREE.InstancedMesh(canopyGeo, mat, Math.ceil(count / 4));
            mesh.castShadow = true;
            canopyMeshes.push({ mesh, index: 0 });
        });

        const dummy = new THREE.Object3D();
        let placed = 0;

        for (let i = 0; i < count * 3 && placed < count; i++) {
            const x = (Math.random() - 0.5) * 350;
            const z = (Math.random() - 0.5) * 350;
            const h = this.terrain.getHeightAt(x, z);

            // Only place on grass areas (not too high, not too low)
            if (h < -5 || h > 15) continue;

            // Use noise for clustering
            const density = this.noise2D(x * 0.02, z * 0.02);
            if (density < 0.1) continue;

            const scale = 0.8 + Math.random() * 0.8;

            // Trunk
            dummy.position.set(x, h + 1.5 * scale, z);
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.updateMatrix();
            trunkMesh.setMatrixAt(placed, dummy.matrix);

            // Canopy
            dummy.position.set(x, h + 3.5 * scale, z);
            dummy.scale.set(scale * (0.9 + Math.random() * 0.3), scale * (0.8 + Math.random() * 0.4), scale * (0.9 + Math.random() * 0.3));
            dummy.updateMatrix();
            const cGroup = canopyMeshes[placed % canopyColors.length];
            cGroup.mesh.setMatrixAt(cGroup.index, dummy.matrix);
            cGroup.index++;

            placed++;
        }

        trunkMesh.count = placed;
        this.scene.add(trunkMesh);
        canopyMeshes.forEach(c => { c.mesh.count = c.index; this.scene.add(c.mesh); });
    }

    createRocks() {
        const rockGeo = new THREE.DodecahedronGeometry(1, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95, flatShading: true });
        const count = 200;
        const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, count);
        rockMesh.castShadow = true;

        const dummy = new THREE.Object3D();
        let placed = 0;
        for (let i = 0; i < count * 2 && placed < count; i++) {
            const x = (Math.random() - 0.5) * 350;
            const z = (Math.random() - 0.5) * 350;
            const h = this.terrain.getHeightAt(x, z);
            const scale = 0.3 + Math.random() * 1.2;
            dummy.position.set(x, h - 0.2, z);
            dummy.scale.set(scale, scale * (0.5 + Math.random() * 0.5), scale);
            dummy.rotation.set(Math.random(), Math.random(), Math.random());
            dummy.updateMatrix();
            rockMesh.setMatrixAt(placed, dummy.matrix);
            placed++;
        }
        rockMesh.count = placed;
        this.scene.add(rockMesh);
    }
}
