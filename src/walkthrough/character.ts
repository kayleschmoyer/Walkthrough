/**
 * Builds the guide character as an inline SVG — a full-body mascot with a head,
 * body, two arms, and legs/feet so it reads as a little character that hops
 * around the screen (rather than a floating head).
 *
 * It's driven by CSS variables + a single rotatable pointing arm, so it's easy
 * to restyle (via `accentColor`) or swap for your own brand art.
 */
export interface CharacterHandle {
  /** Root element to drop into the overlay. */
  el: HTMLElement;
  /** Aim the pointing arm at a point in viewport coordinates. */
  point(fromX: number, fromY: number, toX: number, toY: number): void;
  /** Relax to a neutral resting pose (used on "to camera" steps). */
  rest(): void;
  /** Play a quick wave (used on the intro/outro). */
  wave(): void;
  /** Play a hop — used when the character travels to a new step. */
  hop(): void;
  /** Optional: a one-time entrance, played the first time the guide appears. */
  entrance?(): void;
  /** Optional: a celebration, played on the final step. */
  celebrate?(): void;
  /** Optional: begin a "speaking" animation while narration plays. */
  startTalking?(): void;
  /** Optional: stop the "speaking" animation. */
  stopTalking?(): void;
  /** Optional cleanup hook (e.g. tear down a WebGL context). */
  dispose?(): void;
}

const SVG = `
<svg class="wt-char-svg" viewBox="0 0 120 152" role="img" aria-hidden="true">
  <ellipse class="wt-char-shadow" cx="60" cy="146" rx="30" ry="6" />

  <!-- legs -->
  <g class="wt-legs">
    <g class="wt-leg wt-leg-l">
      <rect class="wt-limb" x="46" y="104" width="9" height="24" rx="4.5" />
      <ellipse class="wt-foot" cx="47" cy="130" rx="11" ry="6" />
    </g>
    <g class="wt-leg wt-leg-r">
      <rect class="wt-limb" x="65" y="104" width="9" height="24" rx="4.5" />
      <ellipse class="wt-foot" cx="73" cy="130" rx="11" ry="6" />
    </g>
  </g>

  <!-- left arm (swings while hopping) -->
  <g class="wt-arm-left">
    <rect class="wt-limb" x="20" y="78" width="18" height="12" rx="6" />
    <circle class="wt-hand" cx="22" cy="84" r="7.5" />
  </g>

  <!-- right arm — the pointer; rotates from the shoulder -->
  <g class="wt-char-arm">
    <rect class="wt-limb" x="80" y="78" width="34" height="12" rx="6" />
    <circle class="wt-hand" cx="113" cy="84" r="8.5" />
    <rect class="wt-finger" x="119" y="81" width="10" height="6" rx="3" />
  </g>

  <!-- body -->
  <g class="wt-char-body">
    <rect x="33" y="62" width="54" height="52" rx="21" />
    <ellipse class="wt-char-belly" cx="60" cy="90" rx="16" ry="17" />
  </g>

  <!-- head -->
  <g class="wt-char-head">
    <line class="wt-antenna" x1="60" y1="10" x2="60" y2="0" />
    <circle class="wt-antenna-tip" cx="60" cy="-2" r="4.5" />
    <circle class="wt-skull" cx="60" cy="40" r="32" />
    <g class="wt-face">
      <g class="wt-eyes">
        <circle cx="49" cy="40" r="9" fill="#ffffff" />
        <circle cx="71" cy="40" r="9" fill="#ffffff" />
        <circle class="wt-pupil" cx="50" cy="41" r="4.5" />
        <circle class="wt-pupil" cx="72" cy="41" r="4.5" />
      </g>
      <circle class="wt-cheek" cx="41" cy="52" r="5" />
      <circle class="wt-cheek" cx="79" cy="52" r="5" />
      <path class="wt-smile" d="M51 54 Q60 64 69 54" fill="none" />
    </g>
  </g>
</svg>
`;

export function createCharacter(): CharacterHandle {
  const el = document.createElement("div");
  el.className = "wt-character";
  el.innerHTML = SVG;

  const arm = el.querySelector<SVGGElement>(".wt-char-arm")!;

  function point(fromX: number, fromY: number, toX: number, toY: number) {
    // The arm art rests pointing right (0deg); rotating to the full screen
    // angle lets it aim in any direction, including left (±180°).
    const angle = (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;
    arm.style.setProperty("--wt-arm-angle", `${angle}deg`);
    el.classList.add("wt-pointing");
    el.classList.remove("wt-waving");
  }

  function rest() {
    arm.style.setProperty("--wt-arm-angle", `35deg`);
    el.classList.remove("wt-pointing", "wt-waving");
  }

  function wave() {
    el.classList.remove("wt-pointing");
    el.classList.add("wt-waving");
  }

  function hop() {
    el.classList.remove("wt-hopping");
    void el.offsetWidth; // restart the animation
    el.classList.add("wt-hopping");
    el.addEventListener(
      "animationend",
      () => el.classList.remove("wt-hopping"),
      { once: true },
    );
  }

  rest();
  return { el, point, rest, wave, hop };
}
