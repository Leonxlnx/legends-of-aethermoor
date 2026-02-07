import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);

        // Render pass
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        // Bloom — subtle glow on torches and emissives
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.3,   // strength — subtle
            0.5,   // radius
            0.85   // threshold — only bright things bloom
        );
        this.composer.addPass(bloomPass);
        this.bloomPass = bloomPass;

        // Light vignette + mild color grading (NO heavy darkening)
        const gradeShader = {
            uniforms: {
                tDiffuse: { value: null },
                uVignetteStrength: { value: 0.2 },  // Very subtle vignette
                uSaturation: { value: 0.95 },        // Almost no desaturation
                uContrast: { value: 1.04 },           // Minimal contrast boost
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uVignetteStrength;
        uniform float uSaturation;
        uniform float uContrast;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // Very light vignette — NOT crushing the edges
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = 1.0 - dist * dist * uVignetteStrength * 1.5;
          vignette = clamp(vignette, 0.3, 1.0);  // Never go below 30% brightness
          color.rgb *= vignette;
          
          // Mild saturation adjustment
          float grey = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(vec3(grey), color.rgb, uSaturation);
          
          // Gentle contrast
          color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
          
          // Tone shift: cool shadows, warm highlights (very subtle)
          float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb += vec3(-0.005, -0.002, 0.008) * (1.0 - luminance);
          color.rgb += vec3(0.005, 0.003, -0.005) * luminance;
          
          gl_FragColor = color;
        }
      `,
        };

        const gradePass = new ShaderPass(gradeShader);
        this.composer.addPass(gradePass);
    }

    render() {
        this.composer.render();
    }

    setSize(w, h) {
        this.composer.setSize(w, h);
    }
}
