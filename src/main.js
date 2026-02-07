import * as THREE from 'three';
import './styles.css';

import { InputManager } from './engine/InputManager.js';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { Arena } from './world/Arena.js';
import { Sky } from './world/Sky.js';
import { Player } from './player/Player.js';
import { Enemy } from './enemies/Enemy.js';
import { Particles } from './effects/Particles.js';
import { PostProcessing } from './effects/PostProcessing.js';
import { HUD } from './ui/HUD.js';
import { Tutorial } from './ui/Tutorial.js';

class Game {
    constructor() {
        this.state = 'loading'; // loading, story, start, playing, dead
        this.clock = new THREE.Clock();
        this.enemies = [];
        this.screenShake = 0;
        this.prevHealth = 100;
        this.init();
    }

    async init() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.9;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        document.body.appendChild(this.renderer.domElement);

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            55, window.innerWidth / window.innerHeight, 0.1, 500
        );
        this.camera.position.set(0, 6, 10);

        // Input
        this.input = new InputManager();

        // Camera controller
        this.cameraController = new ThirdPersonCamera(this.camera);

        // World
        this.simulateLoading();
    }

    async simulateLoading() {
        const fill = document.getElementById('loading-fill');

        // Simulate loading with progress
        for (let i = 0; i <= 100; i += 5) {
            fill.style.width = `${i}%`;
            await this.delay(40);
        }

        // Build world
        this.arena = new Arena(this.scene);
        this.sky = new Sky(this.scene);
        this.particles = new Particles(this.scene);
        this.player = new Player(this.scene);
        this.hud = new HUD();
        this.tutorial = new Tutorial();

        // Post-processing
        this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);

        await this.delay(500);

        // Fade out loading
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        await this.delay(1500);
        loadingScreen.style.display = 'none';

        // Start story
        this.showStory();
        this.startGameLoop();
    }

    async showStory() {
        this.state = 'story';

        const overlay = document.getElementById('story-overlay');
        const textEl = document.getElementById('story-text');
        const continueEl = document.getElementById('story-continue');

        const storyLines = [
            'You were once a guardian of these halls.',
            'The corruption came silently,\nconsuming all who stood against it.',
            'Now you awaken on the altar stone,\nthe last ember of a dying age.',
            'Remember your training.\nRemember your purpose.',
        ];

        overlay.classList.add('visible');

        for (let i = 0; i < storyLines.length; i++) {
            textEl.textContent = storyLines[i];
            textEl.style.whiteSpace = 'pre-line';

            // Fade in
            await this.delay(300);
            textEl.classList.add('visible');

            // Wait
            await this.delay(3000);

            // Fade out
            textEl.classList.remove('visible');
            await this.delay(1200);
        }

        // Show continue prompt
        continueEl.style.opacity = '1';

        // Wait for any key
        await new Promise(resolve => {
            const handler = () => {
                document.removeEventListener('keydown', handler);
                document.removeEventListener('click', handler);
                resolve();
            };
            document.addEventListener('keydown', handler);
            document.addEventListener('click', handler);
        });

        // Fade out story
        overlay.classList.remove('visible');
        await this.delay(1500);
        overlay.style.display = 'none';

        // Show start prompt
        this.showStartPrompt();
    }

    async showStartPrompt() {
        this.state = 'start';
        const prompt = document.getElementById('start-prompt');
        prompt.classList.add('visible');

        // Wait for click to lock pointer
        await new Promise(resolve => {
            const handler = () => {
                this.renderer.domElement.requestPointerLock();
                prompt.classList.remove('visible');
                document.removeEventListener('click', handler);
                resolve();
            };
            document.addEventListener('click', handler);
        });

        await this.delay(800);
        prompt.style.display = 'none';

        // Begin gameplay
        this.state = 'playing';
        this.hud.show();
        this.tutorial.start();

        // Cinematic intro — camera pans from above
        this.cameraController.setCinematic(
            new THREE.Vector3(3, 8, 8),
            new THREE.Vector3(0, 1, 0)
        );
        await this.delay(2500);
        this.cameraController.clearCinematic();
    }

    startGameLoop() {
        const loop = () => {
            requestAnimationFrame(loop);
            const dt = Math.min(this.clock.getDelta(), 0.05);

            // Always update visuals
            this.arena?.update(dt);
            this.sky?.update(dt);
            this.particles?.update(dt);

            if (this.state === 'playing' && this.player) {
                // Mouse delta
                const mouseDelta = this.input.consumeMouse();

                // Player
                this.player.update(dt, this.input, this.cameraController);

                // Camera
                this.cameraController.update(this.player.position, mouseDelta, dt);

                // Tutorial
                if (this.tutorial && this.tutorial.active) {
                    const cmd = this.tutorial.update(dt, this.input, this.player);
                    if (cmd === 'spawnDummy') {
                        this.spawnDummy();
                    }
                }

                // Enemies
                for (const enemy of this.enemies) {
                    enemy.update(dt, this.player.position);
                }

                // Combat resolution
                this.resolveCombat();

                // HUD
                this.hud.update(this.player, this.enemies);

                // Damage flash
                if (this.player.health < this.prevHealth) {
                    this.flashDamage();
                    this.screenShake = 0.15;
                }
                this.prevHealth = this.player.health;

                // Screen shake
                if (this.screenShake > 0) {
                    this.screenShake -= dt;
                    const intensity = this.screenShake * 3;
                    this.camera.position.x += (Math.random() - 0.5) * intensity;
                    this.camera.position.y += (Math.random() - 0.5) * intensity * 0.5;
                }

                // Death
                if (!this.player.alive && this.state !== 'dead') {
                    this.showDeath();
                }

                // Scroll for zoom
                this.renderer.domElement.onwheel = (e) => {
                    this.cameraController.handleScroll(e.deltaY);
                };
            }

            // Render
            if (this.postProcessing) {
                this.postProcessing.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
        };

        loop();

        // Resize
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            this.postProcessing?.setSize(w, h);
        });
    }

    spawnDummy() {
        // Place dummy in front of player
        const dummy = new Enemy(this.scene, 0, -4, 'dummy');
        this.enemies.push(dummy);
    }

    resolveCombat() {
        const attackBounds = this.player.getAttackBounds();

        if (attackBounds && !this.player.hasHitThisSwing) {
            for (const enemy of this.enemies) {
                if (!enemy.alive && !enemy.isDummy) continue;
                if (enemy.removed) continue;

                const dist = attackBounds.center.distanceTo(enemy.position);
                if (dist < attackBounds.radius + 0.5) {
                    const damage = 15 + this.player.comboStep * 8;
                    const knockDir = enemy.position.clone().sub(this.player.position);
                    enemy.takeDamage(damage, knockDir);
                    this.player.hasHitThisSwing = true;

                    // Hit effects
                    const hitPos = enemy.position.clone();
                    hitPos.y += 1.0;
                    this.particles.hitSparks(hitPos);

                    // Screen shake on combo finisher
                    if (this.player.comboStep === 2) {
                        this.screenShake = 0.2;
                    } else {
                        this.screenShake = 0.08;
                    }
                }
            }
        }

        // Enemy attacks on player
        for (const enemy of this.enemies) {
            if (!enemy.alive || enemy.isDummy) continue;
            const eBounds = enemy.getAttackBounds();
            if (eBounds) {
                const dist = eBounds.center.distanceTo(this.player.position);
                if (dist < eBounds.radius) {
                    this.player.takeDamage(enemy.damage, enemy.position);
                }
            }
        }

        // Dodge dust
        if (this.player.dodging && this.player.dodgeTimer < 0.05) {
            this.particles.dodgeDust(this.player.position);
        }

        // Clean up removed enemies
        this.enemies = this.enemies.filter(e => !e.removed);
    }

    flashDamage() {
        const flash = document.getElementById('damage-flash');
        flash.style.opacity = '1';
        setTimeout(() => { flash.style.opacity = '0'; }, 150);
    }

    showDeath() {
        this.state = 'dead';
        const deathScreen = document.getElementById('death-screen');
        deathScreen.classList.add('visible');

        document.getElementById('respawn-btn').onclick = () => {
            deathScreen.classList.remove('visible');
            this.player.respawn();
            this.enemies.forEach(e => {
                if (!e.isDummy) {
                    this.scene.remove(e.group);
                }
            });
            this.enemies = this.enemies.filter(e => e.isDummy);
            this.state = 'playing';
            this.prevHealth = this.player.maxHealth;
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
