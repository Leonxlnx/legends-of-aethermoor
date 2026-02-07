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
            this.maxHealth = 80;
            this.health = 80;
            this.damage = 12;
            this.speed = 3.2;
            this.attackRange = 2.2;
            this.aggroRange = 16;
            this.name = 'Shadow Warrior';
            this.bodyColor = 0x1a1518;
            this.height = 1.8;
            this.isDummy = false;
        }

        this.alive = true;
        this.state = 'idle'; // idle, chase, circle, windup, attack, recover, stagger, dead
        this.stateTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 2.2;       // Time between attacks
        this.windupDuration = 0.55;      // Telegraph before strike
        this.strikeDuration = 0.2;       // Actual strike window
        this.recoverDuration = 0.7;      // Recovery after attack
        this.staggerTimer = 0;
        this.staggerDuration = 0.6;
        this.deathTimer = 0;
        this.hitFlash = 0;
        this.circleDir = Math.random() > 0.5 ? 1 : -1; // Strafe direction
        this.circleTime = 0;
        this.hasDealtDamageThisAttack = false;

        // Visual telegraph
        this.windupGlow = 0;

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
        this.darkMat = darkMat;

        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 2,
        });
        const clothMat = new THREE.MeshStandardMaterial({
            color: 0x151012, roughness: 0.85, metalness: 0.0,
        });
        const armorMat = new THREE.MeshStandardMaterial({
            color: 0x22201e, roughness: 0.4, metalness: 0.5,
        });

        // Torso — broader, more armored
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.58, 0.28),
            armorMat
        );
        torso.position.y = 1.05;
        torso.castShadow = true;
        this.group.add(torso);
        this.enemyTorso = torso;

        // Chest detail plate
        const chestPlate = new THREE.Mesh(
            new THREE.BoxGeometry(0.46, 0.3, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x181618, roughness: 0.3, metalness: 0.7 })
        );
        chestPlate.position.set(0, 1.1, 0.15);
        this.group.add(chestPlate);

        // Belt
        const belt = new THREE.Mesh(
            new THREE.BoxGeometry(0.56, 0.06, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.7, metalness: 0.1 })
        );
        belt.position.y = 0.74;
        this.group.add(belt);

        // Head
        const headGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
        const head = new THREE.Mesh(headGeo, darkMat);
        head.position.y = 1.55;
        head.castShadow = true;
        this.group.add(head);
        this.enemyHead = head;

        // Hood — sharper, more menacing
        const hood = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.22, 0.3),
            clothMat
        );
        hood.position.y = 1.63;
        this.group.add(hood);

        // Hood brim (forward overhang)
        const brim = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.04, 0.1),
            clothMat
        );
        brim.position.set(0, 1.58, 0.18);
        this.group.add(brim);

        // Glowing eyes
        const leftEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.025, 0.01),
            eyeMat
        );
        leftEye.position.set(-0.06, 1.55, 0.125);
        this.group.add(leftEye);
        this.leftEye = leftEye;

        const rightEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.025, 0.01),
            eyeMat
        );
        rightEye.position.set(0.06, 1.55, 0.125);
        this.group.add(rightEye);
        this.rightEye = rightEye;

        // Shoulders — pauldrons
        const pauldronGeo = new THREE.BoxGeometry(0.16, 0.1, 0.16);
        const lPauldron = new THREE.Mesh(pauldronGeo, armorMat);
        lPauldron.position.set(-0.34, 1.28, 0);
        lPauldron.rotation.z = 0.15;
        this.group.add(lPauldron);
        const rPauldron = new THREE.Mesh(pauldronGeo, armorMat);
        rPauldron.position.set(0.34, 1.28, 0);
        rPauldron.rotation.z = -0.15;
        this.group.add(rPauldron);

        // Arms
        this.enemyRightArm = new THREE.Group();
        this.enemyRightArm.position.set(0.34, 1.2, 0);
        const rUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.11), darkMat);
        rUpperArm.position.y = -0.15;
        rUpperArm.castShadow = true;
        this.enemyRightArm.add(rUpperArm);
        const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.1), darkMat);
        rForearm.position.y = -0.38;
        rForearm.castShadow = true;
        this.enemyRightArm.add(rForearm);

        // Enemy sword — dark, menacing
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x442222, roughness: 0.25, metalness: 0.8,
            emissive: 0x220000, emissiveIntensity: 0.2,
        });
        this.enemySwordMat = bladeMat;

        const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.6, 0.015), bladeMat);
        swordBlade.position.y = -0.72;
        this.enemyRightArm.add(swordBlade);

        // Sword guard
        const guardMat = new THREE.MeshStandardMaterial({ color: 0x333030, metalness: 0.6, roughness: 0.3 });
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.04), guardMat);
        guard.position.y = -0.42;
        this.enemyRightArm.add(guard);

        this.group.add(this.enemyRightArm);

        this.enemyLeftArm = new THREE.Group();
        this.enemyLeftArm.position.set(-0.34, 1.2, 0);
        const lUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.11), darkMat);
        lUpperArm.position.y = -0.15;
        lUpperArm.castShadow = true;
        this.enemyLeftArm.add(lUpperArm);
        const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.1), darkMat);
        lForearm.position.y = -0.38;
        lForearm.castShadow = true;
        this.enemyLeftArm.add(lForearm);
        this.group.add(this.enemyLeftArm);

        // Legs
        this.enemyLeftLeg = new THREE.Group();
        this.enemyLeftLeg.position.set(-0.12, 0.5, 0);
        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), clothMat);
        lLeg.position.y = -0.25;
        lLeg.castShadow = true;
        this.enemyLeftLeg.add(lLeg);
        // Boot
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1515, roughness: 0.7, metalness: 0.1 });
        const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.18), bootMat);
        lBoot.position.set(0, -0.52, 0.02);
        this.enemyLeftLeg.add(lBoot);
        this.group.add(this.enemyLeftLeg);

        this.enemyRightLeg = new THREE.Group();
        this.enemyRightLeg.position.set(0.12, 0.5, 0);
        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), clothMat);
        rLeg.position.y = -0.25;
        rLeg.castShadow = true;
        this.enemyRightLeg.add(rLeg);
        const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.18), bootMat);
        rBoot.position.set(0, -0.52, 0.02);
        this.enemyRightLeg.add(rBoot);
        this.group.add(this.enemyRightLeg);

        // Glow aura — reacts to state
        const auraLight = new THREE.PointLight(0xff3300, 0.4, 5);
        auraLight.position.y = 1.2;
        this.group.add(auraLight);
        this.auraLight = auraLight;
    }

    update(dt, playerPos) {
        if (!this.alive) {
            this.deathTimer += dt;
            // Sink into ground + topple
            this.group.position.y = -this.deathTimer * 0.6;
            this.group.rotation.z = this.deathTimer * 0.6;
            this.group.rotation.x = this.deathTimer * 0.2;
            // Fade aura
            if (this.auraLight) this.auraLight.intensity *= 0.95;
            if (this.deathTimer > 2.5) {
                this.scene.remove(this.group);
                this.removed = true;
            }
            return;
        }

        // Hit flash decay
        if (this.hitFlash > 0) {
            this.hitFlash -= dt * 4;
            if (this.darkMat) {
                const flash = Math.max(0, this.hitFlash);
                this.darkMat.emissive.setRGB(flash * 0.8, flash * 0.1, flash * 0.1);
                this.darkMat.emissiveIntensity = flash * 2;
            }
        } else if (this.darkMat) {
            this.darkMat.emissive.setRGB(0, 0, 0);
            this.darkMat.emissiveIntensity = 0;
        }

        this.stateTimer += dt;

        if (this.isDummy) {
            this.updateDummy(dt);
            return;
        }

        this.updateWarrior(dt, playerPos);
    }

    updateDummy(dt) {
        // Dummy wobbles when hit
        if (this.hitFlash > 0) {
            this.group.rotation.z = Math.sin(this.stateTimer * 18) * 0.12 * this.hitFlash;
        } else {
            this.group.rotation.z *= 0.93;
        }
    }

    updateWarrior(dt, playerPos) {
        if (!playerPos) return;

        const dist = this.position.distanceTo(playerPos);
        const toPlayer = playerPos.clone().sub(this.position).normalize();

        // Always face player (except during stagger)
        if (this.state !== 'stagger') {
            this.targetRotation = Math.atan2(toPlayer.x, toPlayer.z);
            let rotDiff = this.targetRotation - this.rotation;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            const rotSpeed = this.state === 'windup' ? 2 : 6;
            this.rotation += rotDiff * Math.min(1, rotSpeed * dt);
            this.group.rotation.y = this.rotation;
        }

        // Attack cooldown
        if (this.attackTimer > 0) this.attackTimer -= dt;

        // ===== STATE MACHINE =====

        // STAGGER — can't act
        if (this.state === 'stagger') {
            this.staggerTimer -= dt;
            // Recoil animation
            const recoil = Math.sin(this.stateTimer * 20) * 0.1 * (this.staggerTimer / this.staggerDuration);
            this.group.rotation.z = recoil;
            if (this.enemyTorso) this.enemyTorso.rotation.x = -0.1 * (this.staggerTimer / this.staggerDuration);

            if (this.staggerTimer <= 0) {
                this.state = 'chase';
                this.group.rotation.z = 0;
                if (this.enemyTorso) this.enemyTorso.rotation.x = 0;
                this.attackTimer = 0.8; // Brief cooldown after stagger
            }
            this.animateIdle(dt);
            return;
        }

        // WINDUP — telegraphed attack
        if (this.state === 'windup') {
            this.windupTimer -= dt;
            this.windupGlow = 1 - (this.windupTimer / this.windupDuration);

            // Raise sword slowly — clear telegraph
            if (this.enemyRightArm) {
                const raise = this.windupGlow;
                this.enemyRightArm.rotation.x = -2.2 * raise;
                this.enemyRightArm.rotation.z = -0.3 * raise;
            }
            // Lean back
            if (this.enemyTorso) {
                this.enemyTorso.rotation.x = -0.1 * this.windupGlow;
            }
            // Eyes flare during windup
            if (this.auraLight) {
                this.auraLight.intensity = 0.4 + this.windupGlow * 1.2;
                this.auraLight.color.setHex(0xff4400);
            }

            // Sword glows during windup
            if (this.enemySwordMat) {
                this.enemySwordMat.emissiveIntensity = 0.2 + this.windupGlow * 1.5;
            }

            if (this.windupTimer <= 0) {
                this.state = 'attack';
                this.stateTimer = 0;
                this.hasDealtDamageThisAttack = false;
            }
            return;
        }

        // ATTACK — fast strike
        if (this.state === 'attack') {
            this.stateTimer += 0; // already incremented above
            const t = Math.min(this.stateTimer / this.strikeDuration, 1);

            // Fast downward swing
            if (this.enemyRightArm) {
                this.enemyRightArm.rotation.x = -2.2 + t * 3.0; // -2.2 → +0.8
                this.enemyRightArm.rotation.z = -0.3 + t * 0.3;
            }
            // Lunge forward slightly
            if (t < 0.5) {
                const fwd = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
                this.position.add(fwd.multiplyScalar(4 * dt));
                this.group.position.copy(this.position);
            }
            // Body follows through
            if (this.enemyTorso) {
                this.enemyTorso.rotation.x = 0.15 * t;
            }

            if (this.stateTimer >= this.strikeDuration) {
                this.state = 'recover';
                this.stateTimer = 0;
                // Reset sword glow
                if (this.enemySwordMat) {
                    this.enemySwordMat.emissiveIntensity = 0.2;
                }
                if (this.auraLight) {
                    this.auraLight.color.setHex(0xff3300);
                }
            }
            return;
        }

        // RECOVER — vulnerable after attack
        if (this.state === 'recover') {
            const t = Math.min(this.stateTimer / this.recoverDuration, 1);

            // Return arm to rest
            if (this.enemyRightArm) {
                this.enemyRightArm.rotation.x = 0.8 * (1 - t);
                this.enemyRightArm.rotation.z *= 0.9;
            }
            if (this.enemyTorso) {
                this.enemyTorso.rotation.x = 0.15 * (1 - t);
            }

            if (this.stateTimer >= this.recoverDuration) {
                this.state = 'chase';
                this.attackTimer = this.attackCooldown * (0.7 + Math.random() * 0.6); // Slight randomness
            }
            return;
        }

        // CHASE / CIRCLE / IDLE
        if (dist < this.attackRange && this.attackTimer <= 0) {
            // Start windup (telegraphed attack)
            this.state = 'windup';
            this.windupTimer = this.windupDuration;
            this.windupGlow = 0;
            this.stateTimer = 0;
        } else if (dist < this.attackRange * 1.5 && this.attackTimer > 0) {
            // Circle strafe while on cooldown — looks smarter
            this.state = 'circle';
            this.circleTime += dt;
            if (this.circleTime > 2 + Math.random() * 2) {
                this.circleDir *= -1;
                this.circleTime = 0;
            }

            const perpendicular = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
            this.position.add(perpendicular.multiplyScalar(this.speed * 0.6 * this.circleDir * dt));
            this.group.position.copy(this.position);

            this.animateWalk(dt, 6);
        } else if (dist < this.aggroRange) {
            this.state = 'chase';
            this.position.add(toPlayer.multiplyScalar(this.speed * dt));
            this.group.position.copy(this.position);

            this.animateWalk(dt, 8);
        } else {
            this.state = 'idle';
            this.animateIdle(dt);
        }

        // Eye flicker (subtle in idle/chase, intense during aggro)
        if (this.auraLight && this.state !== 'windup') {
            const baseIntensity = dist < this.aggroRange ? 0.5 : 0.25;
            this.auraLight.intensity = baseIntensity + Math.sin(this.stateTimer * 4) * 0.1;
        }
    }

    animateWalk(dt, freq) {
        const walkT = this.stateTimer * freq;
        if (this.enemyLeftLeg) {
            this.enemyLeftLeg.rotation.x = Math.sin(walkT) * 0.5;
            this.enemyRightLeg.rotation.x = Math.sin(walkT + Math.PI) * 0.5;
            this.enemyLeftArm.rotation.x = Math.sin(walkT + Math.PI) * 0.3;
            this.enemyRightArm.rotation.x = Math.sin(walkT) * 0.2;
            this.enemyRightArm.rotation.z = 0;
        }
        // Subtle body bob
        this.group.position.y = Math.abs(Math.sin(walkT * 0.5)) * 0.02;
    }

    animateIdle(dt) {
        this.group.position.y = Math.sin(this.stateTimer * 2) * 0.015;
        if (this.enemyLeftLeg) {
            this.enemyLeftLeg.rotation.x *= 0.92;
            this.enemyRightLeg.rotation.x *= 0.92;
            this.enemyLeftArm.rotation.x *= 0.92;
            this.enemyRightArm.rotation.x *= 0.92;
            this.enemyRightArm.rotation.z *= 0.92;
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
                const kbStrength = this.state === 'windup' ? 2.5 : 1.2; // Interrupted windup = bigger knockback
                this.position.add(knockbackDir.clone().normalize().multiplyScalar(kbStrength));
                this.group.position.copy(this.position);
            }

            // Stagger — interrupts any state including windup
            this.state = 'stagger';
            this.staggerTimer = this.staggerDuration;

            // Reset visual telegraph
            this.windupGlow = 0;
            if (this.enemySwordMat) {
                this.enemySwordMat.emissiveIntensity = 0.2;
            }
            if (this.auraLight) {
                this.auraLight.color.setHex(0xff3300);
                this.auraLight.intensity = 0.4;
            }
        }

        if (this.health <= 0 && !this.isDummy) {
            this.alive = false;
            this.state = 'dead';
        }
    }

    isAttacking() {
        if (!this.alive || this.isDummy) return false;
        // Only deal damage during the fast strike phase
        return this.state === 'attack' && !this.hasDealtDamageThisAttack;
    }

    markDamageDealt() {
        this.hasDealtDamageThisAttack = true;
    }

    getAttackBounds() {
        if (!this.isAttacking()) return null;
        const fwd = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
        const center = this.position.clone().add(fwd.multiplyScalar(0.8));
        center.y += 0.8;
        return { center, radius: 1.8 };
    }
}
