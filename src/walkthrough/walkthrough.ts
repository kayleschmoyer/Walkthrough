import type { WalkthroughOptions, WalkthroughStep } from "./types.ts";
import { createCharacter, type CharacterHandle } from "./character.ts";
import { injectStyles } from "./styles.ts";

const ICONS = {
  sound: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  muted: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
  replay: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2z"/></svg>`,
};

const GAP = 22;

export class Walkthrough {
  private opts: Required<
    Pick<WalkthroughOptions, "characterName" | "accentColor" | "speech" | "keyboard">
  > &
    WalkthroughOptions;
  private steps: WalkthroughStep[];
  private index = -1;
  private muted: boolean;

  private root?: HTMLElement;
  private spotlight?: HTMLElement;
  private cluster?: HTMLElement;
  private titleEl?: HTMLElement;
  private textEl?: HTMLElement;
  private progressEl?: HTMLElement;
  private nextBtn?: HTMLButtonElement;
  private prevBtn?: HTMLButtonElement;
  private soundBtn?: HTMLButtonElement;
  private character?: CharacterHandle;
  private launcher?: HTMLButtonElement;

  private typeTimer?: number;
  private glideTimer?: number;
  private fullText = "";
  private active = false;
  private shown = false;
  private gliding = false;

  constructor(options: WalkthroughOptions) {
    this.opts = {
      characterName: "Pip",
      accentColor: "#6c5ce7",
      speech: true,
      keyboard: true,
      ...options,
    };
    this.steps = options.steps;
    this.muted = options.startMuted ?? false;
  }

  /** Has the user already finished/skipped this tour before? */
  get completed(): boolean {
    const key = this.opts.storageKey;
    return key ? localStorage.getItem(key) === "done" : false;
  }

  /** Start the tour. Pass false to resume at the last position. */
  start(fromBeginning = true): void {
    if (this.active) return;
    injectStyles();
    this.build();
    this.active = true;
    this.launcher?.style.setProperty("display", "none");
    this.goTo(fromBeginning ? 0 : Math.max(0, this.index));
  }

  next = (): void => {
    if (this.index >= this.steps.length - 1) return this.finish();
    this.goTo(this.index + 1);
  };

  prev = (): void => {
    if (this.index <= 0) return;
    this.goTo(this.index - 1);
  };

  goTo(index: number): void {
    this.index = Math.max(0, Math.min(index, this.steps.length - 1));
    void this.show(this.steps[this.index]);
  }

  finish = (): void => {
    this.markDone();
    this.opts.onFinish?.();
    this.teardown();
  };

  skip = (): void => {
    this.markDone();
    this.opts.onSkip?.();
    this.teardown();
  };

  /** Remove everything and free listeners. */
  destroy(): void {
    this.teardown();
    this.launcher?.remove();
    this.launcher = undefined;
  }

  /** Show a floating button so users can replay the tour any time. */
  mountLauncher(label = "Show me around"): void {
    injectStyles();
    if (this.launcher) return;
    const btn = document.createElement("button");
    btn.className = "wt-launcher";
    btn.style.setProperty("--wt-accent", this.opts.accentColor);
    btn.innerHTML = `${ICONS.spark}<span>${label}</span>`;
    btn.addEventListener("click", () => this.start(true));
    document.body.appendChild(btn);
    this.launcher = btn;
  }

  // ---- internals ----------------------------------------------------

  private build(): void {
    const root = document.createElement("div");
    root.className = "wt-root";
    root.style.setProperty("--wt-accent", this.opts.accentColor);

    const spotlight = document.createElement("div");
    spotlight.className = "wt-spotlight";

    const cluster = document.createElement("div");
    cluster.className = "wt-cluster";

    this.character = (this.opts.characterFactory ?? createCharacter)();

    const bubble = document.createElement("div");
    bubble.className = "wt-bubble";
    bubble.setAttribute("role", "dialog");
    bubble.setAttribute("aria-live", "polite");
    bubble.innerHTML = `
      <button class="wt-skip" type="button">Skip tour</button>
      <div class="wt-name">${this.escape(this.opts.characterName)}</div>
      <h3 class="wt-title"></h3>
      <p class="wt-text"></p>
      <div class="wt-controls">
        <div class="wt-progress"></div>
        <button class="wt-btn-icon wt-sound" type="button" aria-label="Toggle narration">${
          this.muted ? ICONS.muted : ICONS.sound
        }</button>
        <button class="wt-btn wt-btn-ghost wt-prev" type="button">Back</button>
        <button class="wt-btn wt-btn-primary wt-next" type="button">Next</button>
      </div>`;

    cluster.append(this.character.el, bubble);
    root.append(spotlight, cluster);
    document.body.appendChild(root);

    this.root = root;
    this.spotlight = spotlight;
    this.cluster = cluster;
    this.titleEl = bubble.querySelector(".wt-title")!;
    this.textEl = bubble.querySelector(".wt-text")!;
    this.progressEl = bubble.querySelector(".wt-progress")!;
    this.nextBtn = bubble.querySelector(".wt-next")!;
    this.prevBtn = bubble.querySelector(".wt-prev")!;
    this.soundBtn = bubble.querySelector(".wt-sound")!;

    this.nextBtn.addEventListener("click", this.next);
    this.prevBtn.addEventListener("click", this.prev);
    this.soundBtn.addEventListener("click", this.toggleSound);
    bubble.querySelector(".wt-skip")!.addEventListener("click", this.skip);
    this.textEl.addEventListener("click", () => this.isTyping() && this.finishTyping());

    window.addEventListener("scroll", this.relayout, true);
    window.addEventListener("resize", this.relayout);
    if (this.opts.keyboard) window.addEventListener("keydown", this.onKey);
  }

  private async show(step: WalkthroughStep): Promise<void> {
    // Open the containing tab/section first, if any.
    if (step.openTab) {
      this.resolve(step.openTab)?.click();
      await raf();
      await raf();
    }

    const target = step.target ? this.resolve(step.target) : null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      await wait(260);
    }

    this.renderStep(step, target);

    if (!this.shown) {
      // First appearance: drop into place instantly, then pop in.
      this.shown = true;
      this.layout(step, target, false);
      this.cluster?.classList.remove("wt-pop");
      void this.cluster?.offsetWidth;
      this.cluster?.classList.add("wt-pop");
    } else {
      // Every step after: physically hop + glide across to the new spot.
      this.gliding = true;
      window.clearTimeout(this.glideTimer);
      this.glideTimer = window.setTimeout(() => (this.gliding = false), 660);
      this.layout(step, target, true);
      if (target) this.character?.hop();
    }

    step.onShow?.(step, this.index);
    this.opts.onStep?.(step, this.index);
  }

  private renderStep(step: WalkthroughStep, target: HTMLElement | null): void {
    this.titleEl!.textContent = step.title ?? "";
    this.titleEl!.style.display = step.title ? "" : "none";

    this.prevBtn!.style.visibility = this.index === 0 ? "hidden" : "visible";
    this.nextBtn!.textContent =
      this.index === this.steps.length - 1 ? "Done ✓" : "Next →";

    // progress dots
    this.progressEl!.innerHTML = "";
    this.steps.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className =
        "wt-dot" + (i === this.index ? " wt-active" : i < this.index ? " wt-done" : "");
      this.progressEl!.appendChild(dot);
    });

    if (!target) {
      // "To camera" steps: celebrate on the last step, make an entrance on the
      // first, otherwise just wave. Falls back to wave if the character has no
      // entrance/celebrate (e.g. the SVG mascot).
      const c = this.character!;
      const isLast = this.index === this.steps.length - 1;
      const isFirst = this.index === 0;
      if (isLast && c.celebrate) c.celebrate();
      else if (isFirst && c.entrance) c.entrance();
      else c.wave();
      this.spotlight!.classList.add("wt-no-target");
    } else {
      this.spotlight!.classList.remove("wt-no-target");
    }

    this.typeText(step.text);
    this.speak(step.text);
  }

  /** Position the spotlight + character cluster relative to the target. */
  private layout(step: WalkthroughStep, target: HTMLElement | null, animate: boolean): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cluster = this.cluster!;
    const spot = this.spotlight!;

    if (!target) {
      // "To camera": dim the whole screen, center the guide. The spotlight is
      // a zero-size point at screen center so its huge box-shadow covers all.
      spot.style.width = "0px";
      spot.style.height = "0px";
      spot.style.left = `${vw / 2}px`;
      spot.style.top = `${vh / 2}px`;
      cluster.classList.remove("wt-arrow-right", "wt-arrow-down");
      cluster.style.flexDirection = "row";
      const cw = cluster.offsetWidth;
      const ch = cluster.offsetHeight;
      this.setClusterPos((vw - cw) / 2, (vh - ch) / 2, animate);
      return;
    }

    const pad = step.padding ?? 8;
    const r = target.getBoundingClientRect();
    spot.style.left = `${r.left - pad}px`;
    spot.style.top = `${r.top - pad}px`;
    spot.style.width = `${r.width + pad * 2}px`;
    spot.style.height = `${r.height + pad * 2}px`;

    const cw = cluster.offsetWidth || 460;
    const ch = cluster.offsetHeight || 160;
    const roomRight = vw - r.right;
    const roomLeft = r.left;

    let placement: "right" | "left" | "bottom";
    const pref = step.side ?? "auto";
    if (pref === "right" && roomRight >= cw + GAP) placement = "right";
    else if (pref === "left" && roomLeft >= cw + GAP) placement = "left";
    else if (pref === "bottom") placement = "bottom";
    else if (roomRight >= cw + GAP) placement = "right";
    else if (roomLeft >= cw + GAP) placement = "left";
    else placement = "bottom";

    cluster.classList.remove("wt-arrow-right", "wt-arrow-down");
    let left: number;
    let top: number;

    if (placement === "right") {
      cluster.style.flexDirection = "row"; // character nearest target (left edge)
      left = r.right + GAP;
      top = clamp(r.top + r.height / 2 - ch / 2, 12, vh - ch - 12);
    } else if (placement === "left") {
      cluster.style.flexDirection = "row-reverse"; // character nearest target (right edge)
      cluster.classList.add("wt-arrow-right");
      left = r.left - cw - GAP;
      top = clamp(r.top + r.height / 2 - ch / 2, 12, vh - ch - 12);
    } else {
      cluster.style.flexDirection = "row";
      cluster.classList.add("wt-arrow-down");
      left = clamp(r.left + r.width / 2 - cw / 2, 12, vw - cw - 12);
      top = r.bottom + GAP;
    }

    this.setClusterPos(clamp(left, 12, vw - cw - 12), top, animate);

    // Aim the arm at the target's center from the character's actual position.
    requestAnimationFrame(() => {
      const cr = this.character!.el.getBoundingClientRect();
      this.character!.point(
        cr.left + cr.width / 2,
        cr.top + cr.height / 2,
        r.left + r.width / 2,
        r.top + r.height / 2,
      );
    });
  }

  private relayout = (): void => {
    if (!this.active || this.index < 0) return;
    const step = this.steps[this.index];
    const target = step.target ? this.resolve(step.target) : null;
    // Track scroll/resize instantly, except during the brief glide window
    // after a step change, where we keep it smooth.
    this.layout(step, target, this.gliding);
  };

  /** Move the guide cluster, gliding when `animate` is set, else instantly. */
  private setClusterPos(left: number, top: number, animate: boolean): void {
    const c = this.cluster!;
    c.classList.toggle("wt-glide", animate);
    c.style.left = `${left}px`;
    c.style.top = `${top}px`;
  }

  // ---- narration ----------------------------------------------------

  private typeText(text: string): void {
    this.finishTyping();
    this.fullText = text;
    this.textEl!.textContent = "";
    const caret = document.createElement("span");
    caret.className = "wt-caret";
    caret.innerHTML = "&nbsp;";
    this.textEl!.appendChild(caret);

    let i = 0;
    this.typeTimer = window.setInterval(() => {
      i++;
      this.textEl!.textContent = text.slice(0, i);
      this.textEl!.appendChild(caret);
      if (i >= text.length) this.finishTyping();
    }, 16);
  }

  private isTyping(): boolean {
    return this.typeTimer !== undefined;
  }

  private finishTyping(): void {
    if (this.typeTimer !== undefined) {
      clearInterval(this.typeTimer);
      this.typeTimer = undefined;
    }
    if (this.textEl) this.textEl.textContent = this.fullText;
  }

  private speak(text: string): void {
    if (!this.opts.speech || this.muted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  }

  private toggleSound = (): void => {
    this.muted = !this.muted;
    this.soundBtn!.innerHTML = this.muted ? ICONS.muted : ICONS.sound;
    if (this.muted) window.speechSynthesis?.cancel();
    else this.speak(this.fullText);
  };

  private onKey = (e: KeyboardEvent): void => {
    if (!this.active) return;
    if (e.key === "Escape") this.skip();
    else if (e.key === "ArrowRight" || e.key === "Enter") this.next();
    else if (e.key === "ArrowLeft") this.prev();
  };

  // ---- lifecycle helpers -------------------------------------------

  private teardown(): void {
    this.active = false;
    this.shown = false;
    this.gliding = false;
    window.clearTimeout(this.glideTimer);
    this.finishTyping();
    window.speechSynthesis?.cancel();
    window.removeEventListener("scroll", this.relayout, true);
    window.removeEventListener("resize", this.relayout);
    window.removeEventListener("keydown", this.onKey);
    this.character?.dispose?.();
    this.character = undefined;
    this.root?.remove();
    this.root = undefined;
    this.launcher?.style.removeProperty("display");
  }

  private markDone(): void {
    if (this.opts.storageKey) localStorage.setItem(this.opts.storageKey, "done");
  }

  private resolve(t: string | HTMLElement): HTMLElement | null {
    return typeof t === "string" ? document.querySelector<HTMLElement>(t) : t;
  }

  private escape(s: string): string {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
}

// ---- tiny utils -----------------------------------------------------
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
