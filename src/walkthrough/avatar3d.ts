import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { CharacterHandle } from "./character.ts";

/**
 * A real-time 3D avatar that satisfies the same {@link CharacterHandle} contract
 * as the SVG mascot, so the walkthrough controller can drive it unchanged.
 *
 * It renders a rigged glTF character to a small transparent canvas, plays
 * skeletal animations (idle / greet / walk / gesture), and yaws to face the
 * element it's describing. Point `url` at any rigged humanoid `.glb` (Ready
 * Player Me, Avaturn, Mixamo…) and map its clip names via `anims`.
 */
export interface Avatar3DOptions {
  /** URL of a rigged .glb with named animation clips. */
  url?: string;
  /** Render width/height of the avatar canvas, in CSS px. */
  width?: number;
  height?: number;
  /** Camera framing. */
  camera?: { y?: number; z?: number; lookY?: number; fov?: number };
  /** Base yaw (radians) if the model faces away from camera by default. */
  modelYaw?: number;
  /** Map logical actions to the model's actual animation clip names. */
  anims?: { idle?: string; greet?: string; walk?: string; gesture?: string };
}

export function createAvatar3D(opts: Avatar3DOptions = {}): CharacterHandle {
  const url = opts.url ?? "/avatar/RobotExpressive.glb";
  const W = opts.width ?? 170;
  const H = opts.height ?? 220;
  const cam = { y: 2.7, z: 10.6, lookY: 2.15, fov: 36, ...opts.camera };
  const baseYaw = opts.modelYaw ?? 0;
  const A = { idle: "Idle", greet: "Wave", walk: "Walking", gesture: "ThumbsUp", ...opts.anims };
  const looping = new Set([A.idle, A.walk]);

  const el = document.createElement("div");
  el.className = "wt-character wt-character-3d";
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;

  // ---- renderer + scene ----------------------------------------------
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cam.fov, W / H, 0.1, 100);
  camera.position.set(0, cam.y, cam.z);
  camera.lookAt(0, cam.lookY, 0);

  // soft image-based lighting for realistic skin/cloth shading
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc6ff, 1.1);
  rim.position.set(-4, 4, -5);
  scene.add(rim);

  // ---- state ----------------------------------------------------------
  let model: THREE.Object3D | undefined;
  let mixer: THREE.AnimationMixer | undefined;
  const actions = new Map<string, THREE.AnimationAction>();
  let active: THREE.AnimationAction | undefined;
  let targetYaw = baseYaw;
  let walkTimer = 0;
  let pending: (() => void) | undefined;
  const clock = new THREE.Clock();

  function fadeTo(name: string, dur = 0.3) {
    const next = actions.get(name);
    if (!next || next === active) return;
    active?.fadeOut(dur);
    next.reset().setEffectiveWeight(1).fadeIn(dur).play();
    active = next;
  }

  const restore = () => {
    mixer?.removeEventListener("finished", restore);
    fadeTo(A.idle, 0.3);
  };

  function emote(name: string) {
    if (!actions.has(name)) return;
    fadeTo(name, 0.2);
    mixer!.addEventListener("finished", restore);
  }

  // ---- load -----------------------------------------------------------
  new GLTFLoader().load(url, (gltf) => {
    model = gltf.scene;
    model.rotation.y = baseYaw;
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      // Strip root translation so locomotion plays "in place" in the canvas.
      clip.tracks = clip.tracks.filter((t) => !/hips.*\.position$/i.test(t.name));
      const a = mixer.clipAction(clip);
      if (!looping.has(clip.name)) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
      actions.set(clip.name, a);
    }
    fadeTo(A.idle, 0);
    pending?.();
    pending = undefined;
  });

  // ---- render loop ----------------------------------------------------
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    mixer?.update(clock.getDelta());
    if (model) model.rotation.y += (targetYaw - model.rotation.y) * 0.12;
    renderer.render(scene, camera);
  };
  tick();

  // ---- CharacterHandle API -------------------------------------------
  const run = (fn: () => void) => (model ? fn() : (pending = fn));

  function point(fromX: number, _fromY: number, toX: number, _toY: number) {
    // Turn toward the element being described.
    targetYaw = baseYaw + THREE.MathUtils.clamp((toX - fromX) / 900, -0.6, 0.6);
  }
  function rest() {
    targetYaw = baseYaw;
    run(() => fadeTo(A.idle, 0.3));
  }
  function wave() {
    targetYaw = baseYaw;
    run(() => emote(A.greet));
  }
  function hop() {
    // Travel: walk for the glide window, then settle back to idle.
    run(() => {
      fadeTo(A.walk, 0.25);
      window.clearTimeout(walkTimer);
      walkTimer = window.setTimeout(() => fadeTo(A.idle, 0.3), 720);
    });
  }
  function dispose() {
    cancelAnimationFrame(raf);
    window.clearTimeout(walkTimer);
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { el, point, rest, wave, hop, dispose };
}
