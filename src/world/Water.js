import * as THREE from 'three';

export class Water {
    constructor(scene) {
        this.scene = scene;
        this.time = 0;
        this.create();
    }

    create() {
        const geo = new THREE.PlaneGeometry(500, 500, 64, 64);
        geo.rotateX(-Math.PI / 2);

        this.material = new THREE.MeshStandardMaterial({
            color: 0x1a6b8a,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.3,
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.Mesh(geo, this.material);
        this.mesh.position.y = -3;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Below-water plane for depth color
        const deepGeo = new THREE.PlaneGeometry(500, 500);
        deepGeo.rotateX(-Math.PI / 2);
        const deepMat = new THREE.MeshStandardMaterial({ color: 0x0a3040, roughness: 1.0 });
        const deepMesh = new THREE.Mesh(deepGeo, deepMat);
        deepMesh.position.y = -5;
        this.scene.add(deepMesh);
    }

    update(dt) {
        this.time += dt;
        const pos = this.mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const wave = Math.sin(x * 0.05 + this.time * 0.8) * 0.3 +
                Math.sin(z * 0.07 + this.time * 0.6) * 0.2 +
                Math.sin((x + z) * 0.03 + this.time * 1.2) * 0.15;
            pos.setY(i, -3 + wave);
        }
        pos.needsUpdate = true;
    }
}
