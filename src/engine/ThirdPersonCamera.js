import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera) {
        this.camera = camera;

        // Orbital parameters
        this.distance = 6;
        this.minDistance = 3;
        this.maxDistance = 12;
        this.phi = 0.35;     // Vertical angle (radians above horizontal)
        this.theta = 0;      // Horizontal angle
        this.sensitivity = 0.002;
        this.minPhi = -0.1;
        this.maxPhi = 1.2;

        // Smooth follow
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.targetOffset = new THREE.Vector3(0, 1.6, 0);
        this.smoothSpeed = 6;

        // Cinematic mode
        this.cinematicTarget = null;
        this.cinematicPos = null;
        this.cinematicBlend = 0;
    }

    update(playerPos, mouseDelta, dt) {
        // Horizontal: mouse right (positive dx) → theta decreases → view pans right ✓
        this.theta -= mouseDelta.dx * this.sensitivity;

        // Vertical: mouse up (negative dy) → phi decreases → camera lower → looks UP ✓
        // mouse down (positive dy) → phi increases → camera higher → looks DOWN ✓
        this.phi += mouseDelta.dy * this.sensitivity;
        this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));

        // Spherical to cartesian: camera position relative to target
        const lookTarget = playerPos.clone().add(this.targetOffset);

        const idealX = lookTarget.x + this.distance * Math.cos(this.phi) * Math.sin(this.theta);
        const idealY = lookTarget.y + this.distance * Math.sin(this.phi);
        const idealZ = lookTarget.z + this.distance * Math.cos(this.phi) * Math.cos(this.theta);
        const idealPos = new THREE.Vector3(idealX, idealY, idealZ);

        // Clamp above ground
        idealPos.y = Math.max(idealPos.y, 1.0);

        // Smooth interpolation
        const lerpFactor = 1 - Math.exp(-this.smoothSpeed * dt);
        this.currentPos.lerp(idealPos, lerpFactor);
        this.currentLookAt.lerp(lookTarget, lerpFactor);

        // Cinematic override
        if (this.cinematicTarget) {
            this.cinematicBlend = Math.min(1, this.cinematicBlend + dt * 0.8);
            const t = this.cinematicBlend;
            const smoothT = t * t * (3 - 2 * t);

            const finalPos = this.currentPos.clone().lerp(this.cinematicPos, smoothT);
            const finalLook = this.currentLookAt.clone().lerp(this.cinematicTarget, smoothT);

            this.camera.position.copy(finalPos);
            this.camera.lookAt(finalLook);
        } else {
            this.camera.position.copy(this.currentPos);
            this.camera.lookAt(this.currentLookAt);
        }
    }

    // Camera-relative forward (XZ only)
    getForward() {
        return new THREE.Vector3(
            -Math.sin(this.theta),
            0,
            -Math.cos(this.theta)
        ).normalize();
    }

    // Camera-relative right
    getRight() {
        return new THREE.Vector3(
            Math.cos(this.theta),
            0,
            -Math.sin(this.theta)
        ).normalize();
    }

    handleScroll(deltaY) {
        this.distance += deltaY * 0.003;
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }

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
