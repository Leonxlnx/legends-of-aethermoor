import * as THREE from 'three';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 0.9, 3); // Start near altar
        this.velocity = new THREE.Vector3();
        this.rotation = 0; // Y-axis facing
        this.targetRotation = 0;

        // Physics
        this.grounded = true;
        this.gravity = -22;
        this.jumpForce = 9;
        this.moveSpeed = 5;
        this.sprintSpeed = 8;

        // Health & Stamina
        this.health = 100;
        this.maxHealth = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegen = 20;
        this.alive = true;

        // Combat
        this.attacking = false;
        this.attackTimer = 0;
        this.comboStep = 0;
        this.comboTimer = 0;
        this.comboWindow = 0.6;
        this.attackDuration = 0.35;
        this.attackCooldown = 0;
        this.hasHitThisSwing = false;

        // Dodge
        this.dodging = false;
        this.dodgeTimer = 0;
        this.dodgeDuration = 0.4;
        this.dodgeSpeed = 14;
        this.dodgeDir = new THREE.Vector3();
        this.iFrames = false;

        // Animation state
        this.animState = 'idle';
        this.animTime = 0;
        this.animBlend = 0;
        this.breathe = 0;
        this.stepTimer = 0;

        // Movement tracking
        this.isMoving = false;
        this.isSprinting = false;

        // Enabled (for tutorial gating)
        this.canMove = false;
        this.canAttack = false;
        this.canDodge = false;

        this.createModel();
    }

    createModel() {
        this.group = new THREE.Group();

        // Material palette — dark warrior aesthetic
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xc4a882, roughness: 0.7, metalness: 0.05
        });
        const armorMat = new THREE.MeshStandardMaterial({
            color: 0x2a2520, roughness: 0.5, metalness: 0.3
        });
        const clothMat = new THREE.MeshStandardMaterial({
            color: 0x1a1815, roughness: 0.8, metalness: 0.0
        });
        const leatherMat = new THREE.MeshStandardMaterial({
            color: 0x3a2e24, roughness: 0.6, metalness: 0.1
        });
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x5a5550, roughness: 0.3, metalness: 0.8
        });
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x8899aa, roughness: 0.15, metalness: 0.95,
        });
        const wrapMat = new THREE.MeshStandardMaterial({
            color: 0x554433, roughness: 0.85, metalness: 0.0
        });

        // ===== TORSO =====
        // Main body (slightly tapered)
        const torsoGeo = new THREE.BoxGeometry(0.55, 0.6, 0.28);
        const torso = new THREE.Mesh(torsoGeo, armorMat);
        torso.position.y = 1.0;
        torso.castShadow = true;
        this.group.add(torso);

        // Chest plate detail
        const chestGeo = new THREE.BoxGeometry(0.48, 0.35, 0.02);
        const chest = new THREE.Mesh(chestGeo, metalMat);
        chest.position.set(0, 1.1, 0.15);
        this.group.add(chest);

        // Belt
        const beltGeo = new THREE.BoxGeometry(0.56, 0.08, 0.30);
        const belt = new THREE.Mesh(beltGeo, leatherMat);
        belt.position.y = 0.69;
        belt.castShadow = true;
        this.group.add(belt);

        // Belt buckle
        const buckleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.02);
        const buckle = new THREE.Mesh(buckleGeo, metalMat);
        buckle.position.set(0, 0.69, 0.16);
        this.group.add(buckle);

        // ===== WAIST / SKIRT =====
        const skirtGeo = new THREE.BoxGeometry(0.5, 0.25, 0.26);
        const skirt = new THREE.Mesh(skirtGeo, clothMat);
        skirt.position.y = 0.54;
        skirt.castShadow = true;
        this.group.add(skirt);

        // ===== HEAD =====
        const headGeo = new THREE.BoxGeometry(0.22, 0.26, 0.22);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.55;
        head.castShadow = true;
        this.group.add(head);
        this.head = head;

        // Hair (dark, swept back)
        const hairGeo = new THREE.BoxGeometry(0.24, 0.12, 0.24);
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.9 });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.set(0, 1.68, -0.02);
        this.group.add(hair);

        // Eyes (subtle, dark)
        const eyeGeo = new THREE.BoxGeometry(0.04, 0.03, 0.01);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.06, 1.56, 0.12);
        this.group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.06, 1.56, 0.12);
        this.group.add(rightEye);

        // ===== SHOULDERS =====
        const shoulderGeo = new THREE.BoxGeometry(0.16, 0.1, 0.16);
        const lShoulder = new THREE.Mesh(shoulderGeo, armorMat);
        lShoulder.position.set(-0.36, 1.25, 0);
        lShoulder.castShadow = true;
        this.group.add(lShoulder);
        const rShoulder = new THREE.Mesh(shoulderGeo, armorMat);
        rShoulder.position.set(0.36, 1.25, 0);
        rShoulder.castShadow = true;
        this.group.add(rShoulder);

        // ===== ARMS =====
        // Right arm (sword arm) — pivotable
        this.rightArmPivot = new THREE.Group();
        this.rightArmPivot.position.set(0.36, 1.2, 0);

        const rUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), clothMat);
        rUpperArm.position.y = -0.15;
        rUpperArm.castShadow = true;
        this.rightArmPivot.add(rUpperArm);

        const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.25, 0.09), skinMat);
        rForearm.position.y = -0.38;
        rForearm.castShadow = true;
        this.rightArmPivot.add(rForearm);

        // Gauntlet
        const rGauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), metalMat);
        rGauntlet.position.y = -0.28;
        this.rightArmPivot.add(rGauntlet);

        // Hand
        const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.04), skinMat);
        rHand.position.y = -0.52;
        this.rightArmPivot.add(rHand);

        this.group.add(this.rightArmPivot);

        // Left arm
        this.leftArmPivot = new THREE.Group();
        this.leftArmPivot.position.set(-0.36, 1.2, 0);

        const lUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), clothMat);
        lUpperArm.position.y = -0.15;
        lUpperArm.castShadow = true;
        this.leftArmPivot.add(lUpperArm);

        const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.25, 0.09), skinMat);
        lForearm.position.y = -0.38;
        lForearm.castShadow = true;
        this.leftArmPivot.add(lForearm);

        const lGauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), metalMat);
        lGauntlet.position.y = -0.28;
        this.leftArmPivot.add(lGauntlet);

        this.group.add(this.leftArmPivot);

        // ===== SWORD (attached to right arm) =====
        this.swordPivot = new THREE.Group();
        this.swordPivot.position.y = -0.52;

        // Handle
        const handleGeo = new THREE.BoxGeometry(0.03, 0.22, 0.03);
        const handle = new THREE.Mesh(handleGeo, wrapMat);
        handle.position.y = -0.11;
        this.swordPivot.add(handle);

        // Guard (cross-guard)
        const guardGeo = new THREE.BoxGeometry(0.18, 0.03, 0.04);
        const guard = new THREE.Mesh(guardGeo, metalMat);
        guard.position.y = -0.01;
        this.swordPivot.add(guard);

        // Blade
        const bladeGeo = new THREE.BoxGeometry(0.045, 0.65, 0.015);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 0.34;
        blade.castShadow = true;
        this.swordPivot.add(blade);

        // Blade tip (tapered)
        const tipGeo = new THREE.ConeGeometry(0.023, 0.1, 4);
        const tip = new THREE.Mesh(tipGeo, bladeMat);
        tip.position.y = 0.72;
        this.swordPivot.add(tip);

        // Pommel
        const pommelGeo = new THREE.SphereGeometry(0.03, 6, 4);
        const pommel = new THREE.Mesh(pommelGeo, metalMat);
        pommel.position.y = -0.23;
        this.swordPivot.add(pommel);

        this.rightArmPivot.add(this.swordPivot);

        // ===== LEGS =====
        this.leftLegPivot = new THREE.Group();
        this.leftLegPivot.position.set(-0.12, 0.42, 0);

        const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), clothMat);
        lThigh.position.y = -0.15;
        lThigh.castShadow = true;
        this.leftLegPivot.add(lThigh);

        const lShin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), leatherMat);
        lShin.position.y = -0.38;
        lShin.castShadow = true;
        this.leftLegPivot.add(lShin);

        const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.18), leatherMat);
        lBoot.position.set(0, -0.53, 0.02);
        lBoot.castShadow = true;
        this.leftLegPivot.add(lBoot);

        this.group.add(this.leftLegPivot);

        this.rightLegPivot = new THREE.Group();
        this.rightLegPivot.position.set(0.12, 0.42, 0);

        const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), clothMat);
        rThigh.position.y = -0.15;
        rThigh.castShadow = true;
        this.rightLegPivot.add(rThigh);

        const rShin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), leatherMat);
        rShin.position.y = -0.38;
        rShin.castShadow = true;
        this.rightLegPivot.add(rShin);

        const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.18), leatherMat);
        rBoot.position.set(0, -0.53, 0.02);
        rBoot.castShadow = true;
        this.rightLegPivot.add(rBoot);

        this.group.add(this.rightLegPivot);

        // ===== CAPE =====
        this.capePivot = new THREE.Group();
        this.capePivot.position.set(0, 1.28, -0.16);

        const capeMat = new THREE.MeshStandardMaterial({
            color: 0x1a1815,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide,
        });

        const capeGeo = new THREE.PlaneGeometry(0.5, 0.8, 4, 6);
        const cape = new THREE.Mesh(capeGeo, capeMat);
        cape.position.y = -0.4;
        cape.castShadow = true;
        this.capePivot.add(cape);
        this.cape = cape;

        this.group.add(this.capePivot);

        // Set initial position
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(dt, input, camera) {
        if (!this.alive) return;

        this.animTime += dt;
        this.breathe += dt;

        // Stamina regen
        if (!this.attacking && !this.dodging) {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
        }

        // Combat cooldown
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.comboStep = 0;
        }

        this.updateDodge(dt, input, camera);
        this.updateCombat(dt, input);
        this.updateMovement(dt, input, camera);
        this.updateAnimation(dt);

        // Sync model
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        input.endFrame();
    }

    updateMovement(dt, input, camera) {
        if (this.dodging || this.attacking) {
            this.isMoving = false;
            return;
        }
        if (!this.canMove) {
            this.isMoving = false;
            return;
        }

        const forward = camera.getForward();
        const right = camera.getRight();
        const move = new THREE.Vector3();

        if (input.isKey('KeyW')) move.add(forward);
        if (input.isKey('KeyS')) move.sub(forward);
        if (input.isKey('KeyA')) move.add(right);
        if (input.isKey('KeyD')) move.sub(right);

        this.isMoving = move.lengthSq() > 0.01;
        this.isSprinting = this.isMoving && input.isKey('ShiftLeft') && this.stamina > 5;

        if (this.isMoving) {
            move.normalize();
            const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;

            if (this.isSprinting) this.stamina -= 15 * dt;

            this.position.x += move.x * speed * dt;
            this.position.z += move.z * speed * dt;

            // Smooth rotation toward movement direction
            this.targetRotation = Math.atan2(move.x, move.z);

            this.stepTimer += dt * (this.isSprinting ? 1.8 : 1.2);
        }

        // Smooth rotation interpolation
        let rotDiff = this.targetRotation - this.rotation;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        this.rotation += rotDiff * Math.min(1, 12 * dt);

        // Gravity + ground
        this.velocity.y += this.gravity * dt;
        this.position.y += this.velocity.y * dt;

        if (this.position.y <= 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.grounded = true;
        }

        // Arena boundary
        const maxDist = 24;
        const dist = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
        if (dist > maxDist) {
            const factor = maxDist / dist;
            this.position.x *= factor;
            this.position.z *= factor;
        }
    }

    updateCombat(dt, input) {
        if (!this.canAttack) return;

        // Attack
        if (this.attacking) {
            this.attackTimer += dt;
            if (this.attackTimer >= this.attackDuration) {
                this.attacking = false;
                this.comboTimer = this.comboWindow;
                this.attackCooldown = 0.08;
            }
            return;
        }

        if (input.consumeClick('left') && this.attackCooldown <= 0 && this.stamina >= 12) {
            this.attacking = true;
            this.attackTimer = 0;
            this.hasHitThisSwing = false;
            this.stamina -= 12;

            this.comboStep = (this.comboTimer > 0) ? (this.comboStep + 1) % 3 : 0;
            this.comboTimer = 0;

            // Forward lunge
            const fwd = new THREE.Vector3(
                Math.sin(this.rotation),
                0,
                Math.cos(this.rotation)
            );
            this.position.add(fwd.multiplyScalar(0.5 + this.comboStep * 0.2));
        }
    }

    updateDodge(dt, input, camera) {
        if (this.dodging) {
            this.dodgeTimer += dt;
            this.iFrames = this.dodgeTimer < this.dodgeDuration * 0.7;

            this.position.add(this.dodgeDir.clone().multiplyScalar(this.dodgeSpeed * dt));

            if (this.dodgeTimer >= this.dodgeDuration) {
                this.dodging = false;
                this.iFrames = false;
            }
            return;
        }

        if (!this.canDodge) return;

        if (input.consumeClick('right') && !this.attacking && this.stamina >= 20) {
            this.dodging = true;
            this.dodgeTimer = 0;
            this.stamina -= 20;
            this.attacking = false;

            // Dodge in movement direction, or backward if standing still
            const forward = camera.getForward();
            const right = camera.getRight();
            const move = new THREE.Vector3();

            if (input.isKey('KeyW')) move.add(forward);
            else if (input.isKey('KeyS')) move.sub(forward);
            else if (input.isKey('KeyA')) move.add(right);
            else if (input.isKey('KeyD')) move.sub(right);

            if (move.lengthSq() < 0.01) {
                // Dodge backward
                move.set(-Math.sin(this.rotation), 0, -Math.cos(this.rotation));
            }

            this.dodgeDir.copy(move.normalize());
            this.targetRotation = Math.atan2(this.dodgeDir.x, this.dodgeDir.z);
            this.rotation = this.targetRotation;
        }
    }

    updateAnimation(dt) {
        const breathAmt = Math.sin(this.breathe * 2.5) * 0.008;

        if (this.dodging) {
            // Roll animation
            const t = this.dodgeTimer / this.dodgeDuration;
            const rollAngle = Math.sin(t * Math.PI) * 1.5;

            this.group.position.y = this.position.y + Math.sin(t * Math.PI) * -0.3;
            this.leftLegPivot.rotation.x = rollAngle * 0.3;
            this.rightLegPivot.rotation.x = -rollAngle * 0.3;
            this.rightArmPivot.rotation.x = rollAngle * 0.5;
            this.leftArmPivot.rotation.x = rollAngle * 0.5;
            this.capePivot.rotation.x = rollAngle * 0.4;
            return;
        }

        if (this.attacking) {
            // Sword swing animation — varies per combo step
            const t = this.attackTimer / this.attackDuration;
            const swing = Math.sin(t * Math.PI); // 0 → 1 → 0

            if (this.comboStep === 0) {
                // Horizontal right slash
                this.rightArmPivot.rotation.x = -1.2 * swing;
                this.rightArmPivot.rotation.z = -0.8 * swing;
                this.swordPivot.rotation.x = -0.5 + swing * 2.5;
            } else if (this.comboStep === 1) {
                // Horizontal left slash (backswing)
                this.rightArmPivot.rotation.x = -1.0 * swing;
                this.rightArmPivot.rotation.z = 0.6 * swing;
                this.swordPivot.rotation.x = -0.3 + swing * 2.2;
            } else {
                // Overhead slam (powerful)
                this.rightArmPivot.rotation.x = -2.2 * swing;
                this.rightArmPivot.rotation.z = 0;
                this.swordPivot.rotation.x = -1.0 + swing * 3.0;
            }

            // Body rotation into swing
            this.group.rotation.y = this.rotation + (this.comboStep === 1 ? -0.2 : 0.2) * swing;

            // Left arm follow
            this.leftArmPivot.rotation.x = -0.3 * swing;

            // Cape reacts
            this.capePivot.rotation.x = -0.15 * swing;

            // Legs brace
            this.leftLegPivot.rotation.x = -0.15 * swing;
            this.rightLegPivot.rotation.x = 0.1 * swing;
            return;
        }

        if (this.isMoving) {
            // Walk/run cycle
            const freq = this.isSprinting ? 10 : 7;
            const amp = this.isSprinting ? 0.6 : 0.4;
            const t = this.stepTimer;

            this.leftLegPivot.rotation.x = Math.sin(t * freq) * amp;
            this.rightLegPivot.rotation.x = Math.sin(t * freq + Math.PI) * amp;

            // Arm swing (opposite to legs)
            this.leftArmPivot.rotation.x = Math.sin(t * freq + Math.PI) * amp * 0.5;
            this.rightArmPivot.rotation.x = Math.sin(t * freq) * amp * 0.4;
            this.rightArmPivot.rotation.z = 0;
            this.swordPivot.rotation.x = 0;

            // Body bob
            this.group.position.y = this.position.y + Math.abs(Math.sin(t * freq * 0.5)) * 0.04;

            // Cape swing
            this.capePivot.rotation.x = -Math.sin(t * freq * 0.5) * 0.12 - 0.05;

            // Cape wave (vertex deformation)
            this.animateCape(dt, true);
        } else {
            // Idle — subtle breathing
            this.leftLegPivot.rotation.x *= 0.9;
            this.rightLegPivot.rotation.x *= 0.9;
            this.leftArmPivot.rotation.x *= 0.9;
            this.rightArmPivot.rotation.x = this.rightArmPivot.rotation.x * 0.9;
            this.rightArmPivot.rotation.z = this.rightArmPivot.rotation.z * 0.9;
            this.swordPivot.rotation.x = this.swordPivot.rotation.x * 0.9;

            this.group.position.y = this.position.y + breathAmt;

            // Cape settles
            this.capePivot.rotation.x = this.capePivot.rotation.x * 0.95 + breathAmt * 2;

            this.animateCape(dt, false);
        }

        // Head subtle look
        this.head.position.y = 1.55 + breathAmt;
    }

    animateCape(dt, moving) {
        if (!this.cape) return;
        const geo = this.cape.geometry;
        const pos = geo.attributes.position;
        const time = this.animTime;

        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            // Only deform lower part of cape
            const influence = Math.max(0, -y) / 0.4;
            if (influence > 0) {
                const wave = Math.sin(time * 3 + i * 0.5) * 0.04 * influence;
                const wind = Math.sin(time * 1.5 + i * 0.3) * 0.03 * influence;
                pos.setZ(i, (moving ? -0.06 : 0) + wave + wind);
            }
        }
        pos.needsUpdate = true;
    }

    // Get sword tip world position for hit detection
    getSwordTip() {
        const worldPos = new THREE.Vector3();
        const swordDir = new THREE.Vector3(0, 0.7, 0);
        swordDir.applyQuaternion(this.swordPivot.getWorldQuaternion(new THREE.Quaternion()));
        swordDir.applyQuaternion(this.rightArmPivot.getWorldQuaternion(new THREE.Quaternion()));
        worldPos.copy(this.position).add(new THREE.Vector3(0.36, 1.2, 0));
        worldPos.add(swordDir);
        return worldPos;
    }

    getAttackBounds() {
        if (!this.attacking) return null;
        const center = this.position.clone();
        center.y += 0.8;
        const fwd = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
        center.add(fwd.multiplyScalar(1.0));
        return { center, radius: 1.5 };
    }

    takeDamage(amount, sourcePos) {
        if (this.iFrames || !this.alive) return;
        this.health -= amount;

        // Knockback
        if (sourcePos) {
            const kb = this.position.clone().sub(sourcePos).normalize().multiplyScalar(2);
            this.position.add(kb);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }

    respawn() {
        this.position.set(0, 0, 3);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
        this.stamina = this.maxStamina;
        this.alive = true;
        this.attacking = false;
        this.dodging = false;
        this.comboStep = 0;
    }
}
