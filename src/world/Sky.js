import * as THREE from 'three';

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.create();
  }

  create() {
    // Dramatic twilight sky dome — frozen at dusk
    const skyGeo = new THREE.SphereGeometry(200, 32, 16);

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        
        // Simple hash for stars
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        void main() {
          vec3 dir = normalize(vWorldPos);
          float y = dir.y;
          
          // Horizon to zenith gradient — deep dusk
          vec3 horizonColor = vec3(0.22, 0.12, 0.08); // warm amber horizon
          vec3 midColor = vec3(0.08, 0.06, 0.12);     // deep purple mid
          vec3 zenithColor = vec3(0.02, 0.02, 0.06);  // near-black zenith
          
          vec3 sky;
          if (y < 0.0) {
            // Below horizon — dark ground fog
            sky = vec3(0.05, 0.04, 0.03);
          } else if (y < 0.15) {
            // Horizon glow
            float t = y / 0.15;
            sky = mix(horizonColor, midColor, t);
            // Warm glow at horizon
            sky += vec3(0.12, 0.04, 0.01) * (1.0 - t) * (1.0 - t);
          } else if (y < 0.5) {
            float t = (y - 0.15) / 0.35;
            sky = mix(midColor, zenithColor, t);
          } else {
            sky = zenithColor;
          }
          
          // Stars (only above mid-sky)
          if (y > 0.2) {
            vec2 starUV = dir.xz / (dir.y + 0.01) * 80.0;
            float star = hash(floor(starUV));
            float brightness = step(0.995, star);
            // Twinkle
            brightness *= 0.5 + 0.5 * sin(uTime * (2.0 + star * 4.0) + star * 100.0);
            float fade = smoothstep(0.2, 0.5, y);
            sky += vec3(brightness * fade * 0.8);
          }
          
          // Subtle moon glow (fixed position)
          vec3 moonDir = normalize(vec3(0.5, 0.7, -0.3));
          float moonDist = length(dir - moonDir);
          float moonGlow = exp(-moonDist * 4.0) * 0.15;
          sky += vec3(0.7, 0.75, 0.9) * moonGlow;
          
          // Tiny moon disc
          float moonDisc = smoothstep(0.025, 0.02, moonDist);
          sky += vec3(0.9, 0.92, 1.0) * moonDisc * 0.6;
          
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });

    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh = skyMesh;
    this.scene.add(skyMesh);

    // Background color for renderer
    this.scene.background = null; // Let sky dome handle it
  }

  update(dt) {
    if (this.skyMesh) {
      this.skyMesh.material.uniforms.uTime.value += dt;
    }
  }
}
