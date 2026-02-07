import * as THREE from 'three';

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.create();
  }

  create() {
    // Epic blue twilight sky dome — frozen at golden/blue hour
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
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        void main() {
          vec3 dir = normalize(vWorldPos);
          float y = dir.y;
          
          // Rich blue twilight gradient — bright enough to see!
          vec3 horizonColor = vec3(0.55, 0.35, 0.20);  // warm orange horizon
          vec3 lowColor = vec3(0.25, 0.18, 0.35);       // purple transition
          vec3 midColor = vec3(0.10, 0.12, 0.30);       // deep blue
          vec3 zenithColor = vec3(0.04, 0.05, 0.18);    // dark blue zenith
          
          vec3 sky;
          if (y < 0.0) {
            // Below horizon — subtle dark gradient (not pure black)
            float t = clamp(-y * 3.0, 0.0, 1.0);
            sky = mix(horizonColor * 0.4, vec3(0.08, 0.06, 0.05), t);
          } else if (y < 0.1) {
            // Horizon glow band
            float t = y / 0.1;
            sky = mix(horizonColor, lowColor, t);
            // Extra warmth at the horizon line
            sky += vec3(0.20, 0.08, 0.02) * (1.0 - t) * (1.0 - t);
          } else if (y < 0.3) {
            float t = (y - 0.1) / 0.2;
            sky = mix(lowColor, midColor, t);
          } else if (y < 0.6) {
            float t = (y - 0.3) / 0.3;
            sky = mix(midColor, zenithColor, t);
          } else {
            sky = zenithColor;
          }
          
          // Stars (above horizon)
          if (y > 0.15) {
            vec2 starUV = dir.xz / (dir.y + 0.01) * 80.0;
            float star = hash(floor(starUV));
            float brightness = step(0.994, star);
            brightness *= 0.5 + 0.5 * sin(uTime * (2.0 + star * 4.0) + star * 100.0);
            float fade = smoothstep(0.15, 0.5, y);
            sky += vec3(brightness * fade * 1.0);
          }
          
          // Moon glow
          vec3 moonDir = normalize(vec3(0.5, 0.7, -0.3));
          float moonDist = length(dir - moonDir);
          float moonGlow = exp(-moonDist * 3.5) * 0.25;
          sky += vec3(0.6, 0.65, 0.9) * moonGlow;
          
          // Moon disc
          float moonDisc = smoothstep(0.03, 0.025, moonDist);
          sky += vec3(0.9, 0.92, 1.0) * moonDisc * 0.8;
          
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });

    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh = skyMesh;
    this.scene.add(skyMesh);

    // Let sky dome handle background
    this.scene.background = null;
  }

  update(dt) {
    if (this.skyMesh) {
      this.skyMesh.material.uniforms.uTime.value += dt;
    }
  }
}
