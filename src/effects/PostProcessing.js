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

        // Bloom (torches, emissives, magic)
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4,   // strength
            0.6,   // radius
            0.8    // threshold
        );
        this.composer.addPass(bloomPass);
        this.bloomPass = bloomPass;

        // Vignette + Color Grading
        const vignetteShader = {
            uniforms: {
                tDiffuse: { value: null },
                uVignetteStrength: { value: 0.45 },
                uSaturation: { value: 0.85 },
                uContrast: { value: 1.08 },
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
          
          // Vignette
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = 1.0 - dist * dist * uVignetteStrength * 2.5;
          vignette = clamp(vignette, 0.0, 1.0);
          color.rgb *= vignette;
          
          // Desaturation (slightly)
          float grey = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(vec3(grey), color.rgb, uSaturation);
          
          // Contrast
          color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
          
          // Cool shadows, warm highlights
          float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb += vec3(-0.01, -0.005, 0.015) * (1.0 - luminance); // cool shadows
          color.rgb += vec3(0.01, 0.005, -0.01) * luminance; // warm highlights
          
          gl_FragColor = color;
        }
      `,
        };

        const vignettePass = new ShaderPass(vignetteShader);
        this.composer.addPass(vignettePass);
    }

    render() {
        this.composer.render();
    }

    setSize(w, h) {
        this.composer.setSize(w, h);
    }
}
