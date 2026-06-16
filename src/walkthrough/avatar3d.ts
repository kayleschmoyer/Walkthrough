import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { CharacterHandle } from "./character.ts";

/**
 * A real-time 3D avatar that satisfies the same {@link CharacterHandle} contract
 * as the SVG mascot, so the walkthrough controller can drive it unchanged.
 *
 * Animations are referenced by *logical role* — `idle`, `greet`, `walk`,
 * `gesture` — so any rigged humanoid works. Either:
 *  - point `anims` at the clip names already inside the model's `.glb`, or
 *  - point `animations` at separate animation `.glb` files (e.g. the Ready
 *    Player Me animation library) to retarget onto a model that ships none.
 */
type Role = "idle" | "greet" | "walk" | "gesture" | "entrance" | "celebrate";

export interface Avatar3DOptions {
  /** URL of the rigged character `.glb`. */
  url?: string;
  width?: number;
  height?: number;
  camera?: { y?: number; z?: number; lookY?: number; fov?: number };
  /** Base yaw (radians) if the model faces away from camera by default. */
  modelYaw?: number;
  /** Map roles to clip names *embedded* in the model. */
  anims?: Partial<Record<Role, string>>;
  /** Map roles to *external* animation `.glb` URLs (retargeted onto the model). */
  animations?: Partial<Record<Role, string>>;
}

export function createAvatar3D(opts: Avatar3DOptions = {}): CharacterHandle {
  const url = opts.url ?? "/avatar/RobotExpressive.glb";
  const W = opts.width ?? 170;
  const H = opts.height ?? 220;
  const cam = { y: 2.7, z: 10.6, lookY: 2.15, fov: 36, ...opts.camera };
  const baseYaw = opts.modelYaw ?? 0;
  const embedded: Partial<Record<Role, string>> = {
    idle: "Idle", greet: "Wave", walk: "Walking", gesture: "ThumbsUp", ...opts.anims,
  };

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

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444a55, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc6ff, 1.1);
  rim.position.set(-4, 4, -5);
  scene.add(rim);

  // ---- state ----------------------------------------------------------
  let model: THREE.Object3D | undefined;
  let mixer: THREE.AnimationMixer | undefined;
  let head: THREE.Object3D | null = null;
  let neck: THREE.Object3D | null = null;
  const actions = new Map<Role, THREE.AnimationAction>();
  let active: THREE.AnimationAction | undefined;
  let targetYaw = baseYaw;
  let walkTimer = 0;
  let talking = false;
  let talkAmp = 0;
  let pending: (() => void) | undefined;
  const clock = new THREE.Clock();
  const loader = new GLTFLoader();

  function fadeTo(role: Role, dur = 0.3) {
    const next = actions.get(role);
    if (!next || next === active) return;
    active?.fadeOut(dur);
    next.reset().setEffectiveWeight(1).fadeIn(dur).play();
    active = next;
  }
  const restore = () => {
    mixer?.removeEventListener("finished", restore);
    fadeTo("idle", 0.3);
  };
  function emote(role: Role) {
    if (!actions.has(role)) return fadeTo("idle", 0.3);
    fadeTo(role, 0.2);
    mixer!.addEventListener("finished", restore);
  }

  function addClip(role: Role, clip: THREE.AnimationClip) {
    // Strip root translation so locomotion plays "in place" in the canvas.
    clip.tracks = clip.tracks.filter((t) => !/hips.*\.position$/i.test(t.name));
    const a = mixer!.clipAction(clip);
    if (role !== "idle" && role !== "walk") {
      a.setLoop(THREE.LoopOnce, 1);
      a.clampWhenFinished = true;
    }
    actions.set(role, a);
  }

  // ---- load -----------------------------------------------------------
  loader.load(url, async (gltf) => {
    model = gltf.scene;
    model.rotation.y = baseYaw;
    scene.add(model);
    head = model.getObjectByName("mixamorig:Head") ?? model.getObjectByName("Head") ?? null;
    neck = model.getObjectByName("mixamorig:Neck") ?? model.getObjectByName("Neck") ?? null;
    mixer = new THREE.AnimationMixer(model);

    if (opts.animations) {
      // Retarget external animation clips by bone name.
      await Promise.all(
        (Object.entries(opts.animations) as [Role, string][]).map(async ([role, u]) => {
          const g = await loader.loadAsync(u);
          if (g.animations[0]) addClip(role, g.animations[0]);
        }),
      );
    } else {
      for (const [role, name] of Object.entries(embedded) as [Role, string][]) {
        const clip = gltf.animations.find((a) => a.name === name);
        if (clip) addClip(role, clip);
      }
    }
    fadeTo("idle", 0);
    pending?.();
    pending = undefined;
  });

  // ---- render loop ----------------------------------------------------
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    mixer?.update(clock.getDelta());

    // Procedural "talking": additive head/neck motion with a speech-like
    // cadence, ramped in/out so it blends with the idle pose. (The mesh has no
    // mouth blendshapes, so this sells speaking via head movement.)
    talkAmp += ((talking ? 1 : 0) - talkAmp) * 0.12;
    if (talkAmp > 0.001 && head) {
      const t = performance.now() / 1000;
      const cadence = Math.sin(t * 11) * 0.5 + 0.5; // fast syllable-like beat
      head.rotation.x += talkAmp * (0.05 * Math.sin(t * 2.3) + 0.035 * cadence);
      head.rotation.z += talkAmp * (0.03 * Math.sin(t * 1.6));
      head.rotation.y += talkAmp * (0.025 * Math.sin(t * 0.9));
      if (neck) neck.rotation.x += talkAmp * 0.02 * Math.sin(t * 2.3);
    }

    if (model) model.rotation.y += (targetYaw - model.rotation.y) * 0.12;
    renderer.render(scene, camera);
  };
  tick();

  // ---- CharacterHandle API -------------------------------------------
  const run = (fn: () => void) => (model ? fn() : (pending = fn));

  return {
    el,
    point(fromX, _fromY, toX) {
      // Keep her facing the viewer, with only a subtle lean toward the target
      // (the pointing animation + spotlight convey direction).
      targetYaw = baseYaw + THREE.MathUtils.clamp((toX - fromX) / 2600, -0.16, 0.16);
    },
    rest() {
      targetYaw = baseYaw;
      run(() => fadeTo("idle", 0.3));
    },
    wave() {
      targetYaw = baseYaw;
      run(() => emote("greet"));
    },
    hop() {
      // Travel: stroll over, then gesture as if explaining, then settle.
      run(() => {
        fadeTo("walk", 0.25);
        window.clearTimeout(walkTimer);
        walkTimer = window.setTimeout(() => emote("gesture"), 700);
      });
    },
    entrance() {
      targetYaw = baseYaw;
      run(() => emote("entrance"));
    },
    celebrate() {
      targetYaw = baseYaw;
      run(() => emote("celebrate"));
    },
    startTalking() {
      talking = true;
    },
    stopTalking() {
      talking = false;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.clearTimeout(walkTimer);
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
