import type { CharacterHandle } from "./character.ts";

/** A single stop on the guided tour. */
export interface WalkthroughStep {
  /**
   * CSS selector (or live element) for the thing the character points at.
   * If omitted, the step is delivered "to camera" with the character centered
   * — useful for the intro/outro.
   */
  target?: string | HTMLElement;

  /** Optional short heading shown above the narration. */
  title?: string;

  /** What the character says. Shown in the speech bubble and spoken aloud. */
  text: string;

  /**
   * A selector to click *before* this step is shown — e.g. the tab that
   * contains the button we're about to describe. The tour switches to it
   * automatically so the target is visible.
   */
  openTab?: string | HTMLElement;

  /** Preferred side to place the character relative to the target. */
  side?: "auto" | "left" | "right" | "top" | "bottom";

  /** Extra pixels of breathing room around the highlighted element. */
  padding?: number;

  /** Run when this step becomes active (after the target is in view). */
  onShow?: (step: WalkthroughStep, index: number) => void;
}

export interface WalkthroughOptions {
  /** The ordered list of stops. */
  steps: WalkthroughStep[];

  /**
   * Provide the guide character. Defaults to the built-in animated SVG mascot.
   * Pass `createAvatar3D` (or your own factory) for a real-time 3D avatar.
   */
  characterFactory?: () => CharacterHandle;

  /** The character's name, used in the intro and the bubble header. */
  characterName?: string;

  /** Accent color for the character, highlight ring, and buttons. */
  accentColor?: string;

  /** Speak each step aloud using the browser's built-in voice. Default: true. */
  speech?: boolean;

  /** Start narration muted (user can unmute). Default: false. */
  startMuted?: boolean;

  /** Allow Esc / arrow keys to control the tour. Default: true. */
  keyboard?: boolean;

  /** Persist "user finished/skipped this tour" under this key in localStorage. */
  storageKey?: string;

  /** Called when the tour finishes naturally (last step "Done"). */
  onFinish?: () => void;

  /** Called when the user skips the tour early. */
  onSkip?: () => void;

  /** Called on every step change. */
  onStep?: (step: WalkthroughStep, index: number) => void;
}
