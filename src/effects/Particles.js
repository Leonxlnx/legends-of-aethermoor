import * as THREE from 'three';

export class Particles {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.dustParticles = [];
        this.createDust();
    }

    createDust() {
        // Ambient floating dust motes
        const count = 120;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            sizes[i] = 0.02 + Math.random() * 0.04;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.PointsMaterial({
            color: 0xccbb99,
            size: 0.06,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });

        this.dustMesh = new THREE.Points(geo, mat);
        this.scene.add(this.dustMesh);
    }

    // Spawn burst effect
    burst(position, color = 0xffaa44, count = 12, speed = 3) {
        for (let i = 0; i < count; i++) {
            const dir = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5 + 0.3,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(speed * (0.5 + Math.random() * 0.5));

            const geo = new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 4, 3);
            const mat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 2,
                transparent: true,
                opacity: 1,
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            this.scene.add(mesh);

            this.particles.push({
                mesh,
                velocity: dir,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.4 + Math.random() * 0.3,
                gravity: -8,
            });
        }
    }

    // Hit sparks
    hitSparks(position) {
        this.burst(position, 0xffcc66, 8, 4);
        // Small flash
        this.burst(position, 0xffffff, 3, 1);
    }

    // Dodge dust
    dodgeDust(position) {
        this.burst(
            new THREE.Vector3(position.x, 0.1, position.z),
            0x887766, 6, 1.5
        );
    }

    update(dt) {
        // Update active particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            p.velocity.y += p.gravity * dt;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
            p.mesh.material.opacity = (p.life / p.maxLife);

            // Scale down
            const scale = p.life / p.maxLife;
            p.mesh.scale.setScalar(scale);
        }

        // Animate ambient dust
        if (this.dustMesh) {
            const pos = this.dustMesh.geometry.attributes.position;
            const time = performance.now() * 0.001;

            for (let i = 0; i < pos.count; i++) {
                let y = pos.getY(i);
                y += Math.sin(time + i * 0.7) * 0.003;

                // Subtle drift
                let x = pos.getX(i) + Math.sin(time * 0.3 + i) * 0.002;

                // Reset if too high
                if (y > 8) y = 0;

                pos.setY(i, y);
                pos.setX(i, x);
            }
            pos.needsUpdate = true;
        }
    }
}
