import { BM } from "~/helpers/core/utils"
import NoiseBackground from "../Components/NoiseBackground"
import Media from "../Components/Media"
import { RenderTarget, Program, Mesh, Triangle } from 'ogl'
import PostProcessor from "../PostProcessor"
import BloomPass from "../Passes/BloomPass"
import ComposerPass from "../Passes/ComposerPass"

export default class homeCanvas {
  constructor({ gl, scene, camera }) {
    this.gl = gl
    this.renderer = this.gl.renderer

    this.scene = scene
    this.camera = camera

    BM(this, ['render', 'resize'])
    const { $RafR, $ROR } = useNuxtApp()
    this.ro = new $ROR(this.resize)
    this.canvasSize = useCanvasSize(() => {
      this.ro.trigger()
    })
    this.ro.trigger()

    this.raf = new $RafR(this.render)

    const noiseBackground = new NoiseBackground(this.gl)
    // noiseBackground.backgroundMesh.setParent(this.scene)
    // noiseBackground.mesh.setParent(this.scene)
    this.noiseBackground = noiseBackground

    this.bloomPass = new BloomPass(this.gl, {
      bloomStrength: 1,
      threshold: 0.02,
      iteration: 5,
      // enabled: false,
      direction: {
        x: 6,
        y: 6
      }
    })

    this.target = new RenderTarget(this.gl, {
      color: 2
    })

    this.postProcessor = new PostProcessor(this.gl, {
    })
      .addPassEffect(this.bloomPass)
    this.postProcessor.addPass({
      fragment: fragmentComposer,
      uniforms: {
        tMap: { value: this.target.textures[0] },
        tAlpha: { value: this.target.textures[1] },
        tNoise: { value: null },
      },
      textureUniform: 'tNoise'
    })
  }
  init() {
    this.raf.run()

    // this.ro.on()
  }

  resize({ vh, vw, scale, breakpoint }) {
  }


  render(e) {

    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
      target: this.target
    })

    this.postProcessor.render(e, {
      scene: this.noiseBackground.scene,
      camera: this.camera
    })
  }

  destroy() {
    this.raf.stop()
    // this.ro.off()
    this.noiseBackground && this.noiseBackground.destroy()
    this.noiseBackground && (this.noiseBackground = null)

  }

  createComposer() {

    const geometry = new Triangle(this.gl);

    const program = new Program(this.gl, {
      vertex: vertexPost,
      fragment: fragmentComposer,
      uniforms: {
        tMap: { value: this.target.textures[0] },
        tAlpha: { value: this.target.textures[1] },
        tNoise: { value: null },
      },
    });
    this.post = new Mesh(this.gl, { geometry, program });
  }

  addMedia(el) {
    this.media = new Media(this.gl, { el, scene: this.scene })
  }
}
const vertexPost = /* glsl */ `#version 300 es
precision lowp float;
in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const fragmentComposer = /* glsl */ `#version 300 es
precision lowp float;
in vec2 vUv;

uniform sampler2D tMap;
uniform sampler2D tAlpha;
uniform sampler2D tNoise;

out vec4 FragColor;
void main() {

  vec4 color = texture(tMap, vUv);
  vec4 alpha = texture(tAlpha, vUv);
  vec4 noise = texture(tNoise, vUv);
  FragColor = color + noise * (1. - alpha);
}`;