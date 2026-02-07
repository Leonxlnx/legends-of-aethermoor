import * as THREE from 'three';

export class Enemy {
    constructor(scene, x, z, type = 'dummy') {
        this.scene = scene;
        this.type = type;
        this.position = new THREE.Vector3(x, 0, z);
        this.rotation = 0;
        this.targetRotation = 0;

        // Stats based on type
        if (type === 'dummy') {
            this.maxHealth = 999;
            this.health = 999;
            this.damage = 0;
            this.speed = 0;
            this.attackRange = 0;
            this.aggroRange = 0;
            this.name = 'Training Dummy';
            this.bodyColor = 0x5a4a38;
            this.height = 1.6;
            this.isDummy = true;
        } else {
            this.maxHealth = 60;
            this.health = 60;
            this.damage = 15;
            this.speed = 3.5;
            this.attackRange = 2.0;
            this.aggroRange = 15;
            this.name = 'Shadow Warrior';
            this.bodyColor = 0x1a1518;
            this.height = 1.8;
            this.isDummy = false;
        }

        this.alive = true;
        this.state = 'idle'; // idle, chase, attack, stagger, dead
        this.stateTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 1.5;
        this.staggerTimer = 0;
        this.staggerDuration = 0.5;
        this.deathTimer = 0;
        this.hitFlash = 0;

        this.createModel();
    }

    createModel() {
        this.group = new THREE.Group();

        if (this.isDummy) {
            this.createDummyModel();
        } else {
            this.createWarriorModel();
        }

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    createDummyModel() {
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x5a4a38, roughness: 0.85, metalness: 0.05,
        });
        const strawMat = new THREE.MeshStandardMaterial({
            color: 0x8a7a55, roughness: 0.95, metalness: 0,
        });

        // Post
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 2.0, 6),
            woodMat
        );
        post.position.y = 1.0;
        post.castShadow = true;
        this.group.add(post);

        // Cross beam (arms)
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.08, 0.08),
            woodMat
        );
        beam.position.y = 1.4;
        beam.castShadow = true;
        this.group.add(beam);
        this.dummyBeam = beam;

        // Straw body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8),
            strawMat
        );
        body.position.y = 1.1;
        body.castShadow = true;
        this.group.add(body);
        this.dummyBody = body;

        // Straw head (sack)
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 8, 6),
            strawMat
        );
        head.position.y = 1.75;
        head.castShadow = true;
        this.group.add(head);
        this.dummyHead = head;

        // X marks on sack (eyes)
        const markMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
        const mark1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), markMat);
        mark1.position.set(-0.05, 1.76, 0.13);
        this.group.add(mark1);
        const mark2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), markMat);
        mark2.position.set(0.05, 1.76, 0.13);
        this.group.add(mark2);

        // Base (wooden disc)
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.35, 0.08, 8),
            woodMat
        );
        base.position.y = 0.04;
        base.receiveShadow = true;
        this.group.add(base);
    }

    createWarriorModel() {
        const darkMat = new THREE.MeshStandardMaterial({
            color: this.bodyColor, roughness: 0.6, metalness: 0.2,
        });
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 2,
        });
        const clothMat = new THREE.MeshStandardMaterial({
            color: 0x151012, roughness: 0.85, metalness: 0.0,
        });

        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.55, 0.25),
            darkMat
        );
        torso.position.y = 1.05;
        torso.castShadow = true;
        this.group.add(torso);
        this.enemyTorso = torso;

        // Head
        const headGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
        const head = new THREE.Mesh(headGeo, darkMat);
        head.position.y = 1.55;
        head.castShadow = true;
        this.group.add(head);

        // Hood
        const hood = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.2, 0.28),
            clothMat
        );
        hood.position.y = 1.62;
        this.group.add(hood);

        // Glowing eyes
        const leftEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.01),
            eyeMat
        );
        leftEye.position.set(-0.06, 1.55, 0.125);
        this.group.add(leftEye);
        this.leftEye = leftEye;

        const rightEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.01),
            eyeMat
        );
        rightEye.position.set(0.06, 1.55, 0.125);
        this.group.add(rightEye);
        this.rightEye = rightEye;

        // Arms
        this.enemyRightArm = new THREE.Group();
        this.enemyRightArm.position.set(0.32, 1.2, 0);
        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), darkMat);
        rArm.position.y = -0.25;
        rArm.castShadow = true;
        this.enemyRightArm.add(rArm);

        // Enemy sword
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x332222, roughness: 0.3, metalness: 0.7,
            emissive: 0x220000, emissiveIntensity: 0.3,
        });
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.015), bladeMat);
        sword.position.y = -0.7;
        this.enemyRightArm.add(sword);

        this.group.add(this.enemyRightArm);

        this.enemyLeftArm = new THREE.Group();
        this.enemyLeftArm.position.set(-0.32, 1.2, 0);
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), darkMat);
        lArm.position.y = -0.25;
        lArm.castShadow = true;
        this.enemyLeftArm.add(lArm);
        this.group.add(this.enemyLeftArm);

        // Legs
        this.enemyLeftLeg = new THREE.Group();
        this.enemyLeftLeg.position.set(-0.11, 0.5, 0);
        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), clothMat);
        lLeg.position.y = -0.25;
        lLeg.castShadow = true;
        this.enemyLeftLeg.add(lLeg);
        this.group.add(this.enemyLeftLeg);

        this.enemyRightLeg = new THREE.Group();
        this.enemyRightLeg.position.set(0.11, 0.5, 0);
        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), clothMat);
        rLeg.position.y = -0.25;
        rLeg.castShadow = true;
        this.enemyRightLeg.add(rLeg);
        this.group.add(this.enemyRightLeg);

        // Glow aura
        const auraLight = new THREE.PointLight(0xff3300, 0.5, 5);
        auraLight.position.y = 1.2;
        this.group.add(auraLight);
        this.auraLight = auraLight;
    }

    update(dt, playerPos) {
        if (!this.alive) {
            this.deathTimer += dt;
            // Sink into ground
            this.group.position.y = -this.deathTimer * 0.5;
            this.group.rotation.z = this.deathTimer * 0.5;
            if (this.deathTimer > 2) {
                this.scene.remove(this.group);
                this.removed = true;
            }
            return;
        }

        // Hit flash decay
        if (this.hitFlash > 0) {
            this.hitFlash -= dt * 5;
        }

        this.stateTimer += dt;

        if (this.isDummy) {
            this.updateDummy(dt);
            return;
        }

        this.updateWarrior(dt, playerPos);
    }

    updateDummy(dt) {
        // Dummy just wobbles when hit
        if (this.hitFlash > 0) {
            this.group.rotation.z = Math.sin(this.stateTimer * 20) * 0.1 * this.hitFlash;
        } else {
            this.group.rotation.z *= 0.95;
        }
    }

    updateWarrior(dt, playerPos) {
        if (!playerPos) return;

        const dist = this.position.distanceTo(playerPos);
        const toPlayer = playerPos.clone().sub(this.position).normalize();

        // Face player smoothly
        this.targetRotation = Math.atan2(toPlayer.x, toPlayer.z);
        let rotDiff = this.targetRotation - this.rotation;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        this.rotation += rotDiff * Math.min(1, 5 * dt);
        this.group.rotation.y = this.rotation;

        // Stagger
        if (this.state === 'stagger') {
            this.staggerTimer -= dt;
            this.group.rotation.z = Math.sin(this.stateTimer * 15) * 0.08;
            if (this.staggerTimer <= 0) {
                this.state = 'chase';
                this.group.rotation.z = 0;
            }
            return;
        }

        // AI state machine
        if (dist < this.attackRange && this.attackTimer <= 0) {
            this.state = 'attack';
        } else if (dist < this.aggroRange) {
            this.state = 'chase';
        } else {
            this.state = 'idle';
        }

        if (this.state === 'chase') {
            // Walk toward player with animation
            this.position.add(toPlayer.multiplyScalar(this.speed * dt));
            this.group.position.copy(this.position);

            // Walk animation
            const walkT = this.stateTimer * 8;
            if (this.enemyLeftLeg) {
                this.enemyLeftLeg.rotation.x = Math.sin(walkT) * 0.5;
                this.enemyRightLeg.rotation.x = Math.sin(walkT + Math.PI) * 0.5;
                this.enemyLeftArm.rotation.x = Math.sin(walkT + Math.PI) * 0.3;
                this.enemyRightArm.rotation.x = Math.sin(walkT) * 0.25;
            }
        } else if (this.state === 'attack') {
            this.attackTimer = this.attackCooldown;

            // Attack animation
            if (this.enemyRightArm) {
                this.enemyRightArm.rotation.x = -2.0;
            }
        }

        // Attack cooldown
        if (this.attackTimer > 0) {
            this.attackTimer -= dt;

            // Attack swing animation
            const t = 1 - (this.attackTimer / this.attackCooldown);
            if (t < 0.3 && this.enemyRightArm) {
                this.enemyRightArm.rotation.x = -2.0 + t / 0.3 * 2.0;
            }
        }

        // Eye flicker
        if (this.auraLight) {
            this.auraLight.intensity = 0.4 + Math.sin(this.stateTimer * 5) * 0.15;
        }

        // Idle sway
        if (this.state === 'idle') {
            this.group.position.y = Math.sin(this.stateTimer * 2) * 0.02;
            if (this.enemyLeftLeg) {
                this.enemyLeftLeg.rotation.x *= 0.95;
                this.enemyRightLeg.rotation.x *= 0.95;
                this.enemyLeftArm.rotation.x *= 0.95;
                this.enemyRightArm.rotation.x *= 0.95;
            }
        }
    }

    takeDamage(amount, knockbackDir) {
        if (!this.alive) return;

        this.health -= amount;
        this.hitFlash = 1;
        this.stateTimer = 0;

        if (!this.isDummy) {
            // Knockback
            if (knockbackDir) {
                this.position.add(knockbackDir.clone().normalize().multiplyScalar(1.5));
                this.group.position.copy(this.position);
            }

            // Stagger
            this.state = 'stagger';
            this.staggerTimer = this.staggerDuration;
        }

        if (this.health <= 0 && !this.isDummy) {
            this.alive = false;
            this.state = 'dead';
        }
    }

    isAttacking() {
        if (!this.alive || this.isDummy) return false;
        const t = 1 - (this.attackTimer / this.attackCooldown);
        return this.attackTimer > 0 && t >= 0.2 && t <= 0.35;
    }

    getAttackBounds() {
        if (!this.isAttacking()) return null;
        const fwd = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
        const center = this.position.clone().add(fwd.multiplyScalar(1.0));
        center.y += 0.8;
        return { center, radius: 1.5 };
    }
}
