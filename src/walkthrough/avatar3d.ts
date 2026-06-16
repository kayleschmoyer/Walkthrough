import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { CharacterHandle } from "./character.ts";

/**
 * A real-time 3D avatar that satisfies the same {@link CharacterHandle} contract
 * as the SVG mascot, so the walkthrough controller can drive it unchanged.
 *
 * It renders a rigged glTF character to a small transparent canvas, plays
 * skeletal animations (idle / wave / jump / gesture), and yaws to face whatever
 * element it's describing. Swap `url` for any rigged humanoid glb (e.g. a
 * Ready Player Me avatar) to change the character.
 */
export interface Avatar3DOptions {
  /** URL of a rigged .glb with named animation clips. */
  url?: string;
  /** Render width/height of the avatar canvas, in CSS px. */
  width?: number;
  height?: number;
}

// RobotExpressive's clip names.
const LOOPS = new Set(["Idle", "Walking", "Running"]);

export function createAvatar3D(opts: Avatar3DOptions = {}): CharacterHandle {
  const url = opts.url ?? "/avatar/RobotExpressive.glb";
  const W = opts.width ?? 170;
  const H = opts.height ?? 220;

  const el = document.createElement("div");
  el.className = "wt-character wt-character-3d";
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;

  // ---- three.js scene -------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearAlpha(0);
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 100);
  camera.position.set(0, 2.7, 10.6);
  camera.lookAt(0, 2.15, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5160, 2.6));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(3, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88bbff, 1.4);
  rim.position.set(-4, 3, -5);
  scene.add(rim);

  // ---- state ----------------------------------------------------------
  let model: THREE.Object3D | undefined;
  let mixer: THREE.AnimationMixer | undefined;
  const actions = new Map<string, THREE.AnimationAction>();
  let active: THREE.AnimationAction | undefined;
  let targetYaw = 0;
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
    fadeTo("Idle", 0.25);
  };

  function emote(name: string) {
    const a = actions.get(name);
    if (!a) return;
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = true;
    fadeTo(name, 0.2);
    mixer!.addEventListener("finished", restore);
  }

  // ---- load -----------------------------------------------------------
  new GLTFLoader().load(url, (gltf) => {
    model = gltf.scene;
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.castShadow = true;
    });
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      const a = mixer.clipAction(clip);
      if (!LOOPS.has(clip.name)) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
      actions.set(clip.name, a);
    }
    fadeTo("Idle", 0);
    pending?.();
    pending = undefined;
  });

  // ---- render loop ----------------------------------------------------
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    mixer?.update(dt);
    if (model) model.rotation.y += (targetYaw - model.rotation.y) * 0.12;
    renderer.render(scene, camera);
  };
  tick();

  // ---- CharacterHandle API -------------------------------------------
  function point(fromX: number, _fromY: number, toX: number, _toY: number) {
    // Yaw the avatar to turn toward the element it's describing.
    const dx = toX - fromX;
    targetYaw = THREE.MathUtils.clamp(dx / 900, -0.6, 0.6);
    const run = () => emote("ThumbsUp");
    if (model) run();
    else pending = run;
  }

  function rest() {
    targetYaw = 0;
    const run = () => fadeTo("Idle", 0.3);
    if (model) run();
    else pending = run;
  }

  function wave() {
    targetYaw = 0;
    const run = () => emote("Wave");
    if (model) run();
    else pending = run;
  }

  function hop() {
    const run = () => emote("Jump");
    if (model) run();
    else pending = run;
  }

  function dispose() {
    cancelAnimationFrame(raf);
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { el, point, rest, wave, hop, dispose };
}
