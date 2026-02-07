import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera) {
        this.camera = camera;

        // Orbital parameters
        this.distance = 6;
        this.minDistance = 3;
        this.maxDistance = 12;
        this.phi = 0.35;              // vertical angle (0 = level, positive = above)
        this.theta = 0;               // horizontal angle
        this.sensitivity = 0.002;
        this.minPhi = -0.1;
        this.maxPhi = 1.2;

        // Smooth follow
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.targetOffset = new THREE.Vector3(0, 1.6, 0); // Look at character upper body
        this.smoothSpeed = 6;

        // Collision
        this.raycaster = new THREE.Raycaster();

        // Cinematic mode
        this.cinematicTarget = null;
        this.cinematicPos = null;
        this.cinematicBlend = 0;
    }

    update(playerPos, mouseDelta, dt) {
        // Mouse rotation — FIXED: correct directions
        this.theta += mouseDelta.dx * this.sensitivity;  // FIXED: was -= (caused mirroring)
        this.phi += mouseDelta.dy * this.sensitivity;     // FIXED: was -= 
        this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));

        // Calculate ideal orbital position
        const lookTarget = playerPos.clone().add(this.targetOffset);

        const idealX = lookTarget.x + this.distance * Math.sin(this.theta) * Math.cos(this.phi);
        const idealY = lookTarget.y + this.distance * Math.sin(this.phi);
        const idealZ = lookTarget.z + this.distance * Math.cos(this.theta) * Math.cos(this.phi);
        const idealPos = new THREE.Vector3(idealX, idealY, idealZ);

        // Ensure camera doesn't go below ground
        idealPos.y = Math.max(idealPos.y, 1.0);

        // Smooth interpolation
        const lerpFactor = 1 - Math.exp(-this.smoothSpeed * dt);
        this.currentPos.lerp(idealPos, lerpFactor);
        this.currentLookAt.lerp(lookTarget, lerpFactor);

        // Cinematic override (for intro)
        if (this.cinematicTarget) {
            this.cinematicBlend = Math.min(1, this.cinematicBlend + dt * 0.8);
            const t = this.cinematicBlend;
            const smoothT = t * t * (3 - 2 * t); // smoothstep

            const finalPos = this.currentPos.clone().lerp(this.cinematicPos, smoothT);
            const finalLook = this.currentLookAt.clone().lerp(this.cinematicTarget, smoothT);

            this.camera.position.copy(finalPos);
            this.camera.lookAt(finalLook);
        } else {
            this.camera.position.copy(this.currentPos);
            this.camera.lookAt(this.currentLookAt);
        }
    }

    // Camera-relative movement directions
    getForward() {
        return new THREE.Vector3(
            -Math.sin(this.theta),
            0,
            -Math.cos(this.theta)
        ).normalize();
    }

    getRight() {
        return new THREE.Vector3(
            -Math.cos(this.theta),
            0,
            Math.sin(this.theta)
        ).normalize();
    }

    // Zoom
    handleScroll(deltaY) {
        this.distance += deltaY * 0.003;
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }

    // Cinematic: smoothly move camera to a fixed view
    setCinematic(position, lookAt) {
        this.cinematicPos = position.clone();
        this.cinematicTarget = lookAt.clone();
        this.cinematicBlend = 0;
    }

    clearCinematic() {
        this.cinematicTarget = null;
        this.cinematicPos = null;
        this.cinematicBlend = 0;
    }
}
