import * as THREE from 'three';

// Third Person Camera - Orbits around player
export class ThirdPersonCamera {
    constructor(camera) {
        this.camera = camera;
        this.target = new THREE.Vector3();
        this.distance = 8;
        this.minDistance = 3;
        this.maxDistance = 15;
        this.phi = 0.3; // vertical angle
        this.theta = 0; // horizontal angle
        this.sensitivity = 0.003;
        this.smoothing = 0.08;
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.offset = new THREE.Vector3(0, 2.5, 0); // look above player feet

        document.addEventListener('wheel', (e) => {
            this.distance += e.deltaY * 0.005;
            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        });
    }

    update(playerPos, mouseDelta, dt) {
        this.theta -= mouseDelta.dx * this.sensitivity;
        this.phi -= mouseDelta.dy * this.sensitivity;
        this.phi = Math.max(-0.5, Math.min(1.2, this.phi));

        this.target.copy(playerPos).add(this.offset);

        const idealX = this.target.x + this.distance * Math.cos(this.phi) * Math.sin(this.theta);
        const idealY = this.target.y + this.distance * Math.sin(this.phi);
        const idealZ = this.target.z + this.distance * Math.cos(this.phi) * Math.cos(this.theta);

        const idealPos = new THREE.Vector3(idealX, idealY, idealZ);

        this.currentPos.lerp(idealPos, this.smoothing);
        this.currentLookAt.lerp(this.target, this.smoothing * 2);

        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentLookAt);
    }

    getForward() {
        return new THREE.Vector3(-Math.sin(this.theta), 0, -Math.cos(this.theta)).normalize();
    }

    getRight() {
        return new THREE.Vector3(-Math.cos(this.theta), 0, Math.sin(this.theta)).normalize();
    }
}
