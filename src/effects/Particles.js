import * as THREE from 'three';

export class Particles {
    constructor(scene) {
        this.scene = scene;
        this.systems = [];
    }

    emit(position, config) {
        const { count = 10, color = 0xffaa00, size = 0.15, speed = 3, life = 0.8, spread = 1, gravity = -5 } = config;

        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * spread * speed,
                Math.random() * speed,
                (Math.random() - 0.5) * spread * speed
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color,
            size,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.systems.push({ points, velocities, life, maxLife: life, gravity, geo });
    }

    hitSparks(position) {
        this.emit(position, { count: 15, color: 0xffdd44, size: 0.12, speed: 5, life: 0.5, spread: 0.8 });
        this.emit(position, { count: 8, color: 0xff6600, size: 0.2, speed: 3, life: 0.6, spread: 0.5 });
    }

    bloodSplash(position) {
        this.emit(position, { count: 12, color: 0x880000, size: 0.15, speed: 4, life: 0.7, spread: 1.0, gravity: -8 });
    }

    dodgeDust(position) {
        this.emit(position, { count: 8, color: 0xaa9966, size: 0.25, speed: 2, life: 0.5, spread: 1.5, gravity: -1 });
    }

    deathBurst(position) {
        this.emit(position, { count: 30, color: 0x440066, size: 0.2, speed: 6, life: 1.2, spread: 1.2 });
        this.emit(position, { count: 20, color: 0xff2200, size: 0.15, speed: 4, life: 0.8, spread: 0.8 });
    }

    update(dt) {
        for (let i = this.systems.length - 1; i >= 0; i--) {
            const sys = this.systems[i];
            sys.life -= dt;

            if (sys.life <= 0) {
                this.scene.remove(sys.points);
                sys.geo.dispose();
                sys.points.material.dispose();
                this.systems.splice(i, 1);
                continue;
            }

            const pos = sys.geo.attributes.position;
            for (let j = 0; j < sys.velocities.length; j++) {
                sys.velocities[j].y += sys.gravity * dt;
                pos.setX(j, pos.getX(j) + sys.velocities[j].x * dt);
                pos.setY(j, pos.getY(j) + sys.velocities[j].y * dt);
                pos.setZ(j, pos.getZ(j) + sys.velocities[j].z * dt);
            }
            pos.needsUpdate = true;

            sys.points.material.opacity = sys.life / sys.maxLife;
        }
    }
}
