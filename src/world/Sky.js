import * as THREE from 'three';

export class Sky {
    constructor(scene) {
        this.scene = scene;
        this.timeOfDay = 0.35; // start at morning
        this.daySpeed = 0.008;
        this.sunLight = null;
        this.ambientLight = null;
        this.create();
    }

    create() {
        // Hemisphere light for ambient
        this.ambientLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1a, 0.4);
        this.scene.add(this.ambientLight);

        // Directional sun light
        this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(2048, 2048);
        this.sunLight.shadow.camera.left = -80;
        this.sunLight.shadow.camera.right = 80;
        this.sunLight.shadow.camera.top = 80;
        this.sunLight.shadow.camera.bottom = -80;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.bias = -0.001;
        this.scene.add(this.sunLight);

        // Sky dome
        const skyGeo = new THREE.SphereGeometry(300, 32, 16);
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                sunDir: { value: new THREE.Vector3(0, 1, 0) },
                timeOfDay: { value: 0.35 }
            },
            vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 sunDir;
        uniform float timeOfDay;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float y = dir.y * 0.5 + 0.5;
          
          // Day colors
          vec3 dayTop = vec3(0.25, 0.55, 0.95);
          vec3 dayBottom = vec3(0.6, 0.8, 1.0);
          vec3 dayColor = mix(dayBottom, dayTop, y);
          
          // Sunset colors
          vec3 sunsetTop = vec3(0.15, 0.15, 0.35);
          vec3 sunsetBottom = vec3(0.9, 0.4, 0.15);
          vec3 sunsetColor = mix(sunsetBottom, sunsetTop, y);
          
          // Night colors
          vec3 nightTop = vec3(0.02, 0.02, 0.08);
          vec3 nightBottom = vec3(0.05, 0.05, 0.12);
          vec3 nightColor = mix(nightBottom, nightTop, y);
          
          // Blend based on time
          float t = timeOfDay;
          vec3 color;
          if (t < 0.25) { // night to dawn
            color = mix(nightColor, sunsetColor, t / 0.25);
          } else if (t < 0.35) { // dawn to day
            color = mix(sunsetColor, dayColor, (t - 0.25) / 0.1);
          } else if (t < 0.65) { // day
            color = dayColor;
          } else if (t < 0.75) { // day to sunset
            color = mix(dayColor, sunsetColor, (t - 0.65) / 0.1);
          } else if (t < 0.85) { // sunset to night
            color = mix(sunsetColor, nightColor, (t - 0.75) / 0.1);
          } else { // night
            color = nightColor;
          }
          
          // Sun glow
          float sunDot = max(0.0, dot(dir, normalize(sunDir)));
          float sunGlow = pow(sunDot, 32.0) * 0.8;
          float sunDisc = pow(sunDot, 256.0) * 2.0;
          color += vec3(1.0, 0.9, 0.7) * (sunGlow + sunDisc);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
        });

        this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.skyMesh);

        // Fog
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.003);
    }

    update(dt) {
        this.timeOfDay += this.daySpeed * dt;
        if (this.timeOfDay > 1) this.timeOfDay = 0;

        // Sun position
        const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
        const sunX = Math.cos(angle) * 100;
        const sunY = Math.sin(angle) * 100;
        const sunZ = 50;

        this.sunLight.position.set(sunX, Math.max(5, sunY), sunZ);

        // Adjust light intensity based on time
        const dayFactor = Math.max(0, Math.sin(this.timeOfDay * Math.PI));
        this.sunLight.intensity = dayFactor * 1.5;
        this.ambientLight.intensity = 0.15 + dayFactor * 0.4;

        // Sunset warmth
        const sunsetFactor = Math.max(0, 1 - Math.abs(this.timeOfDay - 0.7) * 10);
        const r = 1.0, g = 1.0 - sunsetFactor * 0.3, b = 0.9 - sunsetFactor * 0.4;
        this.sunLight.color.setRGB(r, g, b);

        // Update sky shader
        this.skyMesh.material.uniforms.sunDir.value.set(sunX, sunY, sunZ).normalize();
        this.skyMesh.material.uniforms.timeOfDay.value = this.timeOfDay;

        // Update fog color
        const fogDay = new THREE.Color(0x87ceeb);
        const fogNight = new THREE.Color(0x0a0a15);
        const fogColor = fogDay.clone().lerp(fogNight, 1 - dayFactor);
        this.scene.fog.color.copy(fogColor);
    }
}
