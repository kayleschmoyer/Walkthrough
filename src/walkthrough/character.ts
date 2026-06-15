/**
 * Builds the guide character as an inline SVG.
 *
 * The character is intentionally simple (a friendly rounded mascot) and is
 * driven entirely by CSS variables + a single rotatable arm, so it's easy to
 * restyle or swap for your own brand art later.
 */
export interface CharacterHandle {
  /** Root element to drop into the overlay. */
  el: HTMLElement;
  /** Aim the pointing arm at a point in viewport coordinates. */
  point(fromX: number, fromY: number, toX: number, toY: number): void;
  /** Relax the arm to a neutral resting pose (used on "to camera" steps). */
  rest(): void;
  /** Play a quick wave (used on the intro step). */
  wave(): void;
}

const SVG = `
<svg class="wt-char-svg" viewBox="0 0 120 120" role="img" aria-hidden="true">
  <!-- soft shadow -->
  <ellipse class="wt-char-shadow" cx="60" cy="110" rx="30" ry="6" />

  <!-- back (pointing) arm — rotates from the shoulder -->
  <g class="wt-char-arm">
    <rect x="56" y="58" width="40" height="13" rx="6.5" />
    <circle class="wt-char-hand" cx="98" cy="64" r="9" />
    <!-- pointing finger -->
    <rect class="wt-char-finger" x="104" y="61" width="11" height="6" rx="3" />
  </g>

  <!-- body -->
  <g class="wt-char-body">
    <path d="M60 18
             C82 18 96 34 96 60
             C96 86 82 102 60 102
             C38 102 24 86 24 60
             C24 34 38 18 60 18 Z" />
    <!-- belly highlight -->
    <ellipse class="wt-char-belly" cx="60" cy="66" rx="20" ry="22" />
  </g>

  <!-- front (resting) arm -->
  <rect class="wt-char-arm-front" x="24" y="60" width="16" height="12" rx="6" />

  <!-- face -->
  <g class="wt-char-face">
    <g class="wt-eyes">
      <circle cx="49" cy="56" r="8" fill="#ffffff" />
      <circle cx="71" cy="56" r="8" fill="#ffffff" />
      <circle class="wt-pupil" cx="50" cy="57" r="4" />
      <circle class="wt-pupil" cx="72" cy="57" r="4" />
    </g>
    <!-- cheeks -->
    <circle class="wt-cheek" cx="42" cy="70" r="5" />
    <circle class="wt-cheek" cx="78" cy="70" r="5" />
    <!-- smile -->
    <path class="wt-smile" d="M50 74 Q60 84 70 74" fill="none" />
  </g>

  <!-- antenna -->
  <line class="wt-antenna" x1="60" y1="18" x2="60" y2="6" />
  <circle class="wt-antenna-tip" cx="60" cy="5" r="4" />
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

  rest();
  return { el, point, rest, wave };
}
