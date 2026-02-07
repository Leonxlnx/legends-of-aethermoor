import * as THREE from 'three';
import { InputManager } from './engine/InputManager.js';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { Terrain } from './world/Terrain.js';
import { Vegetation } from './world/Vegetation.js';
import { Water } from './world/Water.js';
import { Sky } from './world/Sky.js';
import { Player } from './player/Player.js';
import { EnemySpawner } from './enemies/Enemy.js';
import { Particles } from './effects/Particles.js';
import { HUD } from './ui/HUD.js';

// ========== STORY ==========
const STORY_LINES = [
    "In an age long forgotten...",
    "The realm of Aethermoor was consumed by shadow.",
    "An ancient corruption seeped from the Abyssal Rift,",
    "twisting creatures into mindless horrors.",
    "",
    "The last of the Aether Knights fell one by one.",
    "All hope was lost...",
    "",
    "Until you awoke.",
    "",
    "Rising from the Sacred Spring at the heart of the land,",
    "you are the final light against the darkness.",
    "",
    "Take up your blade. Reclaim Aethermoor.",
];

const OBJECTIVES = [
    { trigger: 'start', text: 'Explore Aethermoor and find the enemy camps' },
    { trigger: 'firstKill', text: 'Clear the corrupted creatures from the land' },
    { trigger: 'fiveKills', text: 'Seek out the remaining enemy camps' },
];

// ========== GAME ==========
class Game {
    constructor() {
        this.state = 'loading'; // loading, story, start, playing, dead
        this.canvas = document.getElementById('game-canvas');
        this.clock = new THREE.Clock();
        this.killCount = 0;
        this.lockedEnemy = null;
        this.storyShown = false;
        this.objectiveIndex = 0;
        this.screenShake = 0;
        this.init();
    }

    async init() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.updateLoading(10, 'Initializing renderer...');

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        this.cameraController = new ThirdPersonCamera(this.camera);
        this.updateLoading(20, 'Creating camera...');

        // Input
        this.input = new InputManager();

        // World
        this.updateLoading(30, 'Generating terrain...');
        this.terrain = new Terrain(this.scene);

        this.updateLoading(50, 'Planting forests...');
        this.vegetation = new Vegetation(this.scene, this.terrain);

        this.updateLoading(60, 'Filling oceans...');
        this.water = new Water(this.scene);

        this.updateLoading(70, 'Painting sky...');
        this.sky = new Sky(this.scene);

        // Player
        this.updateLoading(80, 'Awakening the knight...');
        this.player = new Player(this.scene, this.terrain);

        // Enemies
        this.updateLoading(85, 'Spawning creatures...');
        this.enemySpawner = new EnemySpawner(this.scene, this.terrain);

        // Particles
        this.particles = new Particles(this.scene);

        // HUD
        this.hud = new HUD();

        // Structures (campfires at enemy camps)
        this.createCampfires();

        this.updateLoading(95, 'Preparing the world...');

        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        document.getElementById('respawn-btn').addEventListener('click', () => this.respawn());

        // Finish loading
        await this.delay(500);
        this.updateLoading(100, 'Ready.');
        await this.delay(500);

        // Show story
        document.getElementById('loading-screen').classList.add('hidden');
        this.showStory();
    }

    createCampfires() {
        const campPositions = [
            [30, 20], [-40, 30], [50, -30], [-20, -50], [70, 50],
            [-60, -20], [80, -60], [-80, 60], [20, 70], [-50, -80]
        ];

        for (const [x, z] of campPositions) {
            const h = this.terrain.getHeightAt(x, z);

            // Fire light
            const light = new THREE.PointLight(0xff6622, 3, 15);
            light.position.set(x, h + 1.5, z);
            this.scene.add(light);

            // Log pile
            const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 5);
            const logMat = new THREE.MeshStandardMaterial({ color: 0x3a2510 });
            for (let i = 0; i < 4; i++) {
                const log = new THREE.Mesh(logGeo, logMat);
                log.position.set(x + (Math.random() - 0.5) * 0.3, h + 0.1, z + (Math.random() - 0.5) * 0.3);
                log.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.PI / 2 + Math.random() * 0.3);
                this.scene.add(log);
            }

            // Flame particles (simple cones)
            const flameGeo = new THREE.ConeGeometry(0.15, 0.5, 4);
            const flameMat = new THREE.MeshStandardMaterial({
                color: 0xff4400,
                emissive: 0xff4400,
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.8
            });
            const flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.set(x, h + 0.5, z);
            this.scene.add(flame);
        }
    }

    updateLoading(percent, text) {
        const bar = document.getElementById('loading-bar');
        const label = document.getElementById('loading-text');
        if (bar) bar.style.width = percent + '%';
        if (label) label.textContent = text;
    }

    async showStory() {
        this.state = 'story';
        const storyEl = document.getElementById('story-intro');
        const textEl = document.getElementById('story-text');
        storyEl.classList.remove('hidden');

        let skipRequested = false;
        const skipHandler = () => { skipRequested = true; };
        document.addEventListener('keydown', skipHandler);
        document.addEventListener('click', skipHandler);

        // Typewriter the story
        for (const line of STORY_LINES) {
            if (skipRequested) break;
            if (line === '') {
                textEl.innerHTML += '<br><br>';
                await this.delay(400);
                continue;
            }
            for (const char of line) {
                if (skipRequested) break;
                textEl.innerHTML += char;
                await this.delay(40);
            }
            textEl.innerHTML += '<br>';
            await this.delay(200);
        }

        document.removeEventListener('keydown', skipHandler);
        document.removeEventListener('click', skipHandler);

        if (!skipRequested) await this.delay(1500);

        // Fade to start screen
        storyEl.style.transition = 'opacity 1s ease';
        storyEl.style.opacity = '0';
        await this.delay(1000);
        storyEl.classList.add('hidden');

        this.showStartScreen();
    }

    showStartScreen() {
        this.state = 'start';
        const startScreen = document.getElementById('start-screen');
        startScreen.classList.remove('hidden');

        const handler = () => {
            this.canvas.requestPointerLock();
            startScreen.classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
            this.state = 'playing';
            this.hud.showObjective(OBJECTIVES[0].text);

            // Start dialogue after short delay
            setTimeout(async () => {
                await this.hud.showDialogue('Ancient Voice',
                    'Rise, Aether Knight. The corruption has spread across Aethermoor. Take your blade and purge the darkness from this land.');
                await this.hud.showDialogue('Ancient Voice',
                    'You will find the corrupted camps marked by their fires. Destroy the creatures to cleanse each camp.');
            }, 2000);

            document.removeEventListener('click', handler);
            this.startGameLoop();
        };

        document.addEventListener('click', handler);
    }

    startGameLoop() {
        this.clock.start();
        this.gameLoop();
    }

    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());

        const dt = Math.min(this.clock.getDelta(), 0.05);

        if (this.state !== 'playing') {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // Mouse input
        const mouseDelta = this.input.consumeMouse();

        // Update systems
        this.player.update(dt, this.input, this.cameraController);
        this.cameraController.update(this.player.position, mouseDelta, dt);
        this.sky.update(dt);
        this.water.update(dt);
        this.enemySpawner.update(dt, this.player.position);
        this.particles.update(dt);

        // Lock-on system
        if (this.input.isKey('KeyQ') && this.player.lockOnCooldown <= 0) {
            this.player.lockOnCooldown = 0.3;
            this.toggleLockOn();
        }

        // Combat resolution
        this.resolveCombat(dt);

        // Check player death
        if (!this.player.alive && this.state === 'playing') {
            this.state = 'dead';
            document.exitPointerLock();
            document.getElementById('death-screen').classList.remove('hidden');
        }

        // Update HUD
        this.hud.update(this.player, this.enemySpawner.enemies, this.lockedEnemy);

        // Screen shake
        if (this.screenShake > 0) {
            this.screenShake -= dt;
            const intensity = this.screenShake * 3;
            this.camera.position.x += (Math.random() - 0.5) * intensity;
            this.camera.position.y += (Math.random() - 0.5) * intensity;
        }

        // Move shadow camera to follow player
        this.sky.sunLight.target.position.copy(this.player.position);
        this.sky.sunLight.target.updateMatrixWorld();

        this.renderer.render(this.scene, this.camera);
    }

    resolveCombat(dt) {
        const player = this.player;
        const enemies = this.enemySpawner.enemies;

        // Player attacks hitting enemies
        if (player.attackHitbox) {
            const hb = player.attackHitbox;
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const dist = enemy.position.distanceTo(hb.position);
                if (dist < hb.radius) {
                    const knockDir = enemy.position.clone().sub(player.position).normalize();
                    const wasAlive = enemy.alive;
                    enemy.takeDamage(hb.damage, knockDir);
                    this.particles.hitSparks(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)));
                    this.screenShake = 0.15;

                    if (!enemy.alive && wasAlive) {
                        this.killCount++;
                        this.particles.deathBurst(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)));
                        this.checkObjectives();
                    }
                }
            }
            player.attackHitbox = null; // Only hit once per swing
        }

        // Enemy attacks hitting player
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const result = enemy.update ? null : null; // Already updated
            // Check if enemy is in attack state and close enough
            if (enemy.state === 'attack' && enemy.stateTimer > 0.3 && enemy.stateTimer < 0.4) {
                const dist = enemy.position.distanceTo(player.position);
                const range = enemy.config.ranged ? enemy.config.attackRange : enemy.config.attackRange + 0.5;
                if (dist < range) {
                    if (player.takeDamage(enemy.config.damage, enemy.position)) {
                        this.particles.bloodSplash(player.position.clone().add(new THREE.Vector3(0, 1, 0)));
                        this.screenShake = 0.1;
                    }
                }
            }
        }
    }

    toggleLockOn() {
        const enemies = this.enemySpawner.getAliveEnemies();
        if (this.lockedEnemy) {
            this.lockedEnemy = null;
            return;
        }

        let closest = null;
        let closestDist = 30;
        for (const enemy of enemies) {
            const dist = enemy.position.distanceTo(this.player.position);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        this.lockedEnemy = closest;
    }

    checkObjectives() {
        if (this.killCount === 1 && this.objectiveIndex === 0) {
            this.objectiveIndex = 1;
            this.hud.showObjective(OBJECTIVES[1].text);
        } else if (this.killCount >= 5 && this.objectiveIndex === 1) {
            this.objectiveIndex = 2;
            this.hud.showObjective(OBJECTIVES[2].text);
        }
    }

    respawn() {
        document.getElementById('death-screen').classList.add('hidden');
        this.player.respawn();
        this.state = 'playing';
        this.canvas.requestPointerLock();
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ========== START ==========
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
