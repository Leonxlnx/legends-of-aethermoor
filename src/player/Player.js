import * as THREE from 'three';

export class Player {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;

        // Position & Physics
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = 0; // Y rotation facing direction
        this.targetRotation = 0;
        this.gravity = -30;
        this.onGround = false;

        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxStamina = 100;
        this.stamina = 100;
        this.staminaRegen = 15;
        this.speed = 8;
        this.sprintSpeed = 14;
        this.jumpForce = 12;
        this.alive = true;

        // Combat
        this.attackState = 'idle'; // idle, attack1, attack2, attack3, dodge
        this.attackTimer = 0;
        this.comboWindow = false;
        this.comboNext = false;
        this.comboCount = 0;
        this.dodgeTimer = 0;
        this.dodgeDir = new THREE.Vector3();
        this.invincible = false;
        this.invincibleTimer = 0;
        this.hitCooldown = 0;
        this.attackHitbox = null;
        this.lastDamageTime = 0;

        // Lock-on
        this.lockedEnemy = null;
        this.lockOnCooldown = 0;

        // Animation
        this.animState = 'idle';
        this.animTimer = 0;
        this.bobOffset = 0;
        this.swingAngle = 0;

        this.createModel();
    }

    createModel() {
        this.group = new THREE.Group();

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        this.group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xe8c39e, roughness: 0.6 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.85;
        head.castShadow = true;
        this.group.add(head);

        // Helmet
        const helmetGeo = new THREE.SphereGeometry(0.28, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0x555570, metalness: 0.6, roughness: 0.3 });
        const helmet = new THREE.Mesh(helmetGeo, helmetMat);
        helmet.position.y = 1.9;
        helmet.castShadow = true;
        this.group.add(helmet);

        // Cape
        const capeGeo = new THREE.PlaneGeometry(0.7, 1.0);
        const capeMat = new THREE.MeshStandardMaterial({ color: 0x8b1a1a, side: THREE.DoubleSide, roughness: 0.8 });
        this.cape = new THREE.Mesh(capeGeo, capeMat);
        this.cape.position.set(0, 1.0, 0.3);
        this.cape.rotation.x = 0.1;
        this.group.add(this.cape);

        // Left arm
        const armGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.7, 6);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7 });
        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.45, 1.1, 0);
        this.group.add(this.leftArm);

        // Right arm (sword arm)
        this.rightArmGroup = new THREE.Group();
        this.rightArmGroup.position.set(0.45, 1.1, 0);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArmGroup.add(rightArm);

        // Sword
        this.swordGroup = new THREE.Group();
        this.swordGroup.position.y = -0.35;

        const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.5 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        this.swordGroup.add(handle);

        const guardGeo = new THREE.BoxGeometry(0.25, 0.04, 0.06);
        const guardMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.position.y = -0.15;
        this.swordGroup.add(guard);

        const bladeGeo = new THREE.BoxGeometry(0.06, 0.9, 0.02);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.9, roughness: 0.1 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = -0.65;
        blade.castShadow = true;
        this.swordGroup.add(blade);

        this.rightArmGroup.add(this.swordGroup);
        this.group.add(this.rightArmGroup);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.8 });
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.15, 0.35, 0);
        this.group.add(this.rightLeg);

        // Boots
        const bootGeo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
        const leftBoot = new THREE.Mesh(bootGeo, bootMat);
        leftBoot.position.set(-0.15, 0.05, -0.03);
        this.group.add(leftBoot);
        const rightBoot = new THREE.Mesh(bootGeo, bootMat);
        rightBoot.position.set(0.15, 0.05, -0.03);
        this.group.add(rightBoot);

        this.group.castShadow = true;
        this.scene.add(this.group);
    }

    update(dt, input, camera) {
        if (!this.alive) return;

        // Stamina regen
        this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);

        // Cooldowns
        if (this.hitCooldown > 0) this.hitCooldown -= dt;
        if (this.lockOnCooldown > 0) this.lockOnCooldown -= dt;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Lock-on toggle
        if (input.isKey('KeyQ') && this.lockOnCooldown <= 0) {
            this.lockOnCooldown = 0.3;
            // Toggle handled externally
        }

        // Handle attacks
        this.updateCombat(dt, input);

        // Movement (disabled during attack/dodge)
        if (this.attackState === 'idle') {
            this.updateMovement(dt, input, camera);
        } else if (this.attackState === 'dodge') {
            this.updateDodge(dt);
        }

        // Gravity
        this.velocity.y += this.gravity * dt;
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Terrain collision
        const terrainH = this.terrain.getHeightAt(this.position.x, this.position.z);
        if (this.position.y <= terrainH) {
            this.position.y = terrainH;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // World bounds
        const bound = 190;
        this.position.x = Math.max(-bound, Math.min(bound, this.position.x));
        this.position.z = Math.max(-bound, Math.min(bound, this.position.z));

        // Smooth rotation
        const rotDiff = this.targetRotation - this.rotation;
        const wrappedDiff = ((rotDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
        this.rotation += wrappedDiff * 0.15;

        // Update mesh
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        // Animate
        this.updateAnimation(dt);
    }

    updateMovement(dt, input, camera) {
        const forward = camera.getForward();
        const right = camera.getRight();
        const moveDir = new THREE.Vector3();

        if (input.isKey('KeyW')) moveDir.add(forward);
        if (input.isKey('KeyS')) moveDir.sub(forward);
        if (input.isKey('KeyA')) moveDir.sub(right);
        if (input.isKey('KeyD')) moveDir.add(right);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            const sprinting = input.isKey('ShiftLeft') && this.stamina > 1;
            const spd = sprinting ? this.sprintSpeed : this.speed;

            if (sprinting) this.stamina -= 20 * dt;

            this.velocity.x = moveDir.x * spd;
            this.velocity.z = moveDir.z * spd;

            // Face movement direction
            this.targetRotation = Math.atan2(moveDir.x, moveDir.z);
            this.animState = sprinting ? 'run' : 'walk';
        } else {
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
            this.animState = 'idle';
        }

        // Jump
        if (input.isKey('Space') && this.onGround && this.stamina > 10) {
            this.velocity.y = this.jumpForce;
            this.stamina -= 10;
            this.onGround = false;
        }
    }

    updateCombat(dt, input) {
        // Attack timer
        if (this.attackTimer > 0) {
            this.attackTimer -= dt;

            if (this.attackTimer <= 0) {
                if (this.comboNext && this.comboCount < 3) {
                    this.startAttack(this.comboCount + 1);
                } else {
                    this.attackState = 'idle';
                    this.comboCount = 0;
                    this.comboWindow = false;
                    this.comboNext = false;
                    this.attackHitbox = null;
                }
            }
        }

        // Check for attack input
        if (input.consumeClick('left')) {
            if (this.attackState === 'idle' && this.stamina > 15) {
                this.startAttack(1);
            } else if (this.comboWindow) {
                this.comboNext = true;
            }
        }

        // Dodge
        if (input.consumeClick('right') && this.attackState === 'idle' && this.stamina > 20 && this.onGround) {
            this.startDodge(input);
        }
    }

    startAttack(comboNum) {
        this.attackState = `attack${comboNum}`;
        this.comboCount = comboNum;
        this.comboWindow = false;
        this.comboNext = false;
        this.stamina -= 15;

        const durations = { 1: 0.4, 2: 0.35, 3: 0.5 };
        this.attackTimer = durations[comboNum] || 0.4;

        // Enable combo window during last portion
        setTimeout(() => { this.comboWindow = true; }, (this.attackTimer * 0.5) * 1000);

        // Create hitbox
        const hitboxOffset = new THREE.Vector3(
            -Math.sin(this.rotation) * 1.5,
            1.0,
            -Math.cos(this.rotation) * 1.5
        );
        this.attackHitbox = {
            position: this.position.clone().add(hitboxOffset),
            radius: comboNum === 3 ? 2.5 : 1.8,
            damage: comboNum === 3 ? 35 : comboNum === 2 ? 25 : 20,
            knockback: comboNum === 3 ? 8 : 4,
        };

        this.velocity.x = -Math.sin(this.rotation) * 3;
        this.velocity.z = -Math.cos(this.rotation) * 3;
    }

    startDodge(input) {
        this.attackState = 'dodge';
        this.dodgeTimer = 0.4;
        this.stamina -= 20;
        this.invincible = true;
        this.invincibleTimer = 0.35;

        this.dodgeDir.set(
            -Math.sin(this.rotation),
            0,
            -Math.cos(this.rotation)
        ).normalize();

        this.animState = 'dodge';
    }

    updateDodge(dt) {
        this.dodgeTimer -= dt;
        const dodgeSpeed = 18;
        this.velocity.x = this.dodgeDir.x * dodgeSpeed;
        this.velocity.z = this.dodgeDir.z * dodgeSpeed;

        if (this.dodgeTimer <= 0) {
            this.attackState = 'idle';
            this.velocity.x *= 0.3;
            this.velocity.z *= 0.3;
        }
    }

    takeDamage(amount, sourcePos) {
        if (this.invincible || !this.alive) return false;
        if (this.hitCooldown > 0) return false;

        this.health -= amount;
        this.hitCooldown = 0.5;
        this.lastDamageTime = performance.now();

        // Knockback
        if (sourcePos) {
            const kb = this.position.clone().sub(sourcePos).normalize().multiplyScalar(5);
            this.velocity.x += kb.x;
            this.velocity.z += kb.z;
        }

        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
        return true;
    }

    respawn() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
        this.stamina = this.maxStamina;
        this.alive = true;
        this.attackState = 'idle';
        this.comboCount = 0;
    }

    updateAnimation(dt) {
        this.animTimer += dt;

        // Leg & arm bob
        let legSwing = 0, armSwing = 0, bob = 0;

        if (this.animState === 'walk') {
            legSwing = Math.sin(this.animTimer * 8) * 0.4;
            armSwing = Math.sin(this.animTimer * 8) * 0.3;
            bob = Math.abs(Math.sin(this.animTimer * 8)) * 0.05;
        } else if (this.animState === 'run') {
            legSwing = Math.sin(this.animTimer * 12) * 0.6;
            armSwing = Math.sin(this.animTimer * 12) * 0.5;
            bob = Math.abs(Math.sin(this.animTimer * 12)) * 0.1;
        } else if (this.animState === 'idle') {
            bob = Math.sin(this.animTimer * 2) * 0.02;
        }

        this.leftLeg.rotation.x = legSwing;
        this.rightLeg.rotation.x = -legSwing;
        this.leftArm.rotation.x = -armSwing;
        this.group.position.y = this.position.y + bob;

        // Sword attack animation
        if (this.attackState.startsWith('attack')) {
            const progress = 1 - (this.attackTimer / 0.4);
            const swings = { attack1: 1.5, attack2: -1.8, attack3: 2.2 };
            const targetSwing = swings[this.attackState] || 1.5;

            if (progress < 0.3) {
                // Wind up
                this.swingAngle = -0.5 * (progress / 0.3);
            } else if (progress < 0.6) {
                // Swing
                const t = (progress - 0.3) / 0.3;
                this.swingAngle = -0.5 + (targetSwing + 0.5) * t;
            } else {
                // Follow through
                const t = (progress - 0.6) / 0.4;
                this.swingAngle = targetSwing * (1 - t);
            }
            this.rightArmGroup.rotation.x = this.swingAngle;
            this.rightArmGroup.rotation.z = Math.sin(progress * Math.PI) * 0.3;
        } else {
            this.swingAngle *= 0.85;
            this.rightArmGroup.rotation.x = this.swingAngle;
            this.rightArmGroup.rotation.z *= 0.85;
        }

        // Cape flutter
        const capeFlutter = Math.sin(this.animTimer * 3) * 0.1;
        const moveSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        this.cape.rotation.x = 0.1 + moveSpeed * 0.03 + capeFlutter;

        // Dodge roll animation
        if (this.attackState === 'dodge') {
            const progress = 1 - (this.dodgeTimer / 0.4);
            this.group.rotation.x = Math.sin(progress * Math.PI) * Math.PI;
        } else {
            this.group.rotation.x *= 0.8;
        }

        // Damage flash (blinking red)
        if (this.hitCooldown > 0) {
            const blink = Math.sin(this.hitCooldown * 30) > 0;
            this.group.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissive = child.material.emissive || new THREE.Color();
                    child.material.emissive.setRGB(blink ? 0.5 : 0, 0, 0);
                }
            });
        } else {
            this.group.traverse(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setRGB(0, 0, 0);
                }
            });
        }
    }
}
