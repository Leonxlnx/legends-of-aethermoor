import * as THREE from 'three';

const ENEMY_TYPES = {
    goblin: { color: 0x4a8a2a, bodyHeight: 0.8, speed: 6, health: 40, damage: 10, attackRange: 1.8, aggroRange: 20, bodyScale: 0.7, name: 'Forest Goblin' },
    orc: { color: 0x5a4a3a, bodyHeight: 1.4, speed: 3.5, health: 100, damage: 25, attackRange: 2.5, aggroRange: 18, bodyScale: 1.2, name: 'Corrupted Orc' },
    skeleton: { color: 0xccccaa, bodyHeight: 1.1, speed: 4, health: 50, damage: 15, attackRange: 12, aggroRange: 25, bodyScale: 0.85, name: 'Shadow Archer', ranged: true },
};

export class Enemy {
    constructor(scene, terrain, x, z, type = 'goblin') {
        this.scene = scene;
        this.terrain = terrain;
        this.config = ENEMY_TYPES[type];
        this.type = type;
        this.name = this.config.name;

        const h = terrain.getHeightAt(x, z);
        this.position = new THREE.Vector3(x, h, z);
        this.spawnPos = this.position.clone();
        this.velocity = new THREE.Vector3();
        this.rotation = Math.random() * Math.PI * 2;

        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.alive = true;
        this.state = 'patrol'; // patrol, chase, attack, stagger, dead
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.patrolTarget = this.getRandomPatrolPoint();
        this.hitFlash = 0;
        this.deathTimer = 0;
        this.animTimer = Math.random() * 10;

        this.createModel();
    }

    getRandomPatrolPoint() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 10;
        return new THREE.Vector3(
            this.spawnPos.x + Math.cos(angle) * dist,
            0,
            this.spawnPos.z + Math.sin(angle) * dist
        );
    }

    createModel() {
        this.group = new THREE.Group();
        const c = this.config;
        const s = c.bodyScale;

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.25 * s, 0.3 * s, c.bodyHeight, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = c.bodyHeight / 2 + 0.3;
        body.castShadow = true;
        this.group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.2 * s, 6, 4);
        const headMat = new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.7 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = c.bodyHeight + 0.5;
        this.group.add(head);

        // Eyes (red glowing)
        const eyeGeo = new THREE.SphereGeometry(0.04 * s, 4, 4);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08 * s, c.bodyHeight + 0.52, -0.15 * s);
        this.group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.08 * s, c.bodyHeight + 0.52, -0.15 * s);
        this.group.add(rightEye);

        // Weapon
        if (this.config.ranged) {
            // Bow
            const bowGeo = new THREE.TorusGeometry(0.3 * s, 0.02, 4, 8, Math.PI);
            const bowMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
            const bow = new THREE.Mesh(bowGeo, bowMat);
            bow.position.set(0.35 * s, c.bodyHeight * 0.7, 0);
            bow.rotation.z = Math.PI / 2;
            this.group.add(bow);
        } else {
            // Club/Axe
            const weapGeo = new THREE.CylinderGeometry(0.06 * s, 0.04 * s, 0.8 * s, 5);
            const weapMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
            this.weapon = new THREE.Mesh(weapGeo, weapMat);
            this.weapon.position.set(0.35 * s, c.bodyHeight * 0.5, 0);
            this.weapon.rotation.z = 0.3;
            this.group.add(this.weapon);
        }

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 0.4, 5);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.12 * s, 0.2, 0);
        this.group.add(this.leftLeg);
        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.12 * s, 0.2, 0);
        this.group.add(this.rightLeg);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
        this.bodyMat = bodyMat;
    }

    update(dt, playerPos) {
        if (!this.alive) {
            this.deathTimer += dt;
            this.group.position.y -= dt * 2;
            this.group.scale.multiplyScalar(0.97);
            if (this.deathTimer > 2) {
                this.scene.remove(this.group);
                return 'remove';
            }
            return;
        }

        this.animTimer += dt;
        this.stateTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        const distToPlayer = this.position.distanceTo(playerPos);

        // State machine
        switch (this.state) {
            case 'patrol':
                this.doPatrol(dt, distToPlayer);
                break;
            case 'chase':
                this.doChase(dt, playerPos, distToPlayer);
                break;
            case 'attack':
                this.doAttack(dt, playerPos);
                break;
            case 'stagger':
                this.stateTimer += dt;
                if (this.stateTimer > 0.5) this.state = 'chase';
                break;
        }

        // Gravity & terrain
        const terrainH = this.terrain.getHeightAt(this.position.x, this.position.z);
        this.position.y = terrainH;

        // Update mesh
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        // Leg animation
        const moveSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        if (moveSpeed > 0.5) {
            this.leftLeg.rotation.x = Math.sin(this.animTimer * 8) * 0.4;
            this.rightLeg.rotation.x = -Math.sin(this.animTimer * 8) * 0.4;
        } else {
            this.leftLeg.rotation.x *= 0.9;
            this.rightLeg.rotation.x *= 0.9;
        }

        // Hit flash
        if (this.hitFlash > 0) {
            this.bodyMat.emissive.setRGB(0.8, 0.2, 0.2);
        } else {
            this.bodyMat.emissive.setRGB(0, 0, 0);
        }
    }

    doPatrol(dt, distToPlayer) {
        if (distToPlayer < this.config.aggroRange) {
            this.state = 'chase';
            return;
        }
        const dir = this.patrolTarget.clone().sub(this.position);
        dir.y = 0;
        if (dir.length() < 1) {
            this.patrolTarget = this.getRandomPatrolPoint();
            return;
        }
        dir.normalize();
        this.velocity.set(dir.x * 2, 0, dir.z * 2);
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        this.rotation = Math.atan2(dir.x, dir.z);
    }

    doChase(dt, playerPos, distToPlayer) {
        if (distToPlayer > this.config.aggroRange * 1.5) {
            this.state = 'patrol';
            return;
        }
        if (distToPlayer < this.config.attackRange) {
            if (this.attackCooldown <= 0) {
                this.state = 'attack';
                this.stateTimer = 0;
            }
            return;
        }
        const dir = playerPos.clone().sub(this.position);
        dir.y = 0;
        dir.normalize();
        const spd = this.config.speed;
        this.velocity.set(dir.x * spd, 0, dir.z * spd);
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        this.rotation = Math.atan2(dir.x, dir.z);
    }

    doAttack(dt, playerPos) {
        // Face player
        const dir = playerPos.clone().sub(this.position);
        dir.y = 0;
        this.rotation = Math.atan2(dir.x, dir.z);

        if (this.stateTimer > 0.5) {
            this.state = 'chase';
            this.attackCooldown = this.config.ranged ? 2.0 : 1.5;
            return 'attack'; // signal to deal damage
        }

        // Wind up animation
        if (this.weapon) {
            this.weapon.rotation.z = 0.3 + Math.sin(this.stateTimer * 10) * 1.5;
        }
    }

    takeDamage(amount, knockbackDir) {
        this.health -= amount;
        this.hitFlash = 0.15;
        this.state = 'stagger';
        this.stateTimer = 0;

        if (knockbackDir) {
            this.position.x += knockbackDir.x * 2;
            this.position.z += knockbackDir.z * 2;
        }

        if (this.health <= 0) {
            this.alive = false;
            this.health = 0;
        }
    }
}

export class EnemySpawner {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.enemies = [];
        this.spawnCamps();
    }

    spawnCamps() {
        const camps = [
            { x: 30, z: 20, types: ['goblin', 'goblin', 'goblin'] },
            { x: -40, z: 30, types: ['orc', 'goblin'] },
            { x: 50, z: -30, types: ['skeleton', 'skeleton', 'goblin'] },
            { x: -20, z: -50, types: ['orc', 'orc'] },
            { x: 70, z: 50, types: ['goblin', 'goblin', 'goblin', 'goblin'] },
            { x: -60, z: -20, types: ['skeleton', 'orc', 'goblin'] },
            { x: 80, z: -60, types: ['orc', 'skeleton', 'skeleton'] },
            { x: -80, z: 60, types: ['goblin', 'goblin', 'orc', 'skeleton'] },
            { x: 20, z: 70, types: ['orc', 'orc', 'orc'] },
            { x: -50, z: -80, types: ['skeleton', 'skeleton', 'skeleton'] },
        ];

        for (const camp of camps) {
            for (const type of camp.types) {
                const offsetX = camp.x + (Math.random() - 0.5) * 8;
                const offsetZ = camp.z + (Math.random() - 0.5) * 8;
                const enemy = new Enemy(this.scene, this.terrain, offsetX, offsetZ, type);
                this.enemies.push(enemy);
            }
        }
    }

    update(dt, playerPos) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const result = this.enemies[i].update(dt, playerPos);
            if (result === 'remove') {
                this.enemies.splice(i, 1);
            }
        }
    }

    getAliveEnemies() {
        return this.enemies.filter(e => e.alive);
    }
}

export { ENEMY_TYPES };
