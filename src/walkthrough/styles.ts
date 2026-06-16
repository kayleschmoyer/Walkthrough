/**
 * All widget styles, scoped under `.wt-*` and injected once at runtime so the
 * widget stays a true drop-in (no separate CSS file to ship). Host-page styles
 * are never touched.
 */
export const STYLES = /* css */ `
.wt-root {
  --wt-accent: #6c5ce7;
  --wt-accent-ink: #ffffff;
  --wt-bg: #ffffff;
  --wt-ink: #1f2430;
  --wt-muted: #6b7280;
  --wt-radius: 16px;
  --wt-shadow: 0 18px 50px rgba(17, 22, 41, 0.28);
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  pointer-events: none;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.wt-root * { box-sizing: border-box; }

/* ---- dim + spotlight ------------------------------------------------ */
.wt-spotlight {
  position: fixed;
  border-radius: 14px;
  box-shadow: 0 0 0 9999px rgba(15, 18, 34, 0.62);
  outline: 3px solid var(--wt-accent);
  outline-offset: 2px;
  transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}
.wt-spotlight::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 16px;
  outline: 3px solid var(--wt-accent);
  opacity: 0.55;
  animation: wt-pulse 1.6s ease-out infinite;
}
.wt-spotlight.wt-no-target {
  box-shadow: 0 0 0 9999px rgba(15, 18, 34, 0.72);
  outline: none;
}
.wt-spotlight.wt-no-target::after { display: none; }
@keyframes wt-pulse {
  0%   { transform: scale(1);    opacity: 0.55; }
  100% { transform: scale(1.08); opacity: 0;    }
}

/* ---- guide cluster (character + bubble) ----------------------------- */
.wt-cluster {
  position: fixed;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
  /* glide between steps; .glide controls left/top easing (toggled in JS) */
}
.wt-cluster.wt-glide {
  transition: left 0.62s cubic-bezier(0.5, 0, 0.2, 1),
              top 0.62s cubic-bezier(0.5, 0, 0.2, 1);
}
.wt-cluster.wt-pop { animation: wt-pop 0.5s cubic-bezier(0.18, 1.3, 0.4, 1); }
@keyframes wt-pop {
  0%   { transform: translateY(24px) scale(0.6); opacity: 0; }
  100% { transform: translateY(0) scale(1);      opacity: 1; }
}

/* ---- character ------------------------------------------------------ */
.wt-character {
  flex: 0 0 auto;
  width: 88px;
  height: 112px;
}
.wt-char-svg { width: 100%; height: 100%; overflow: visible; animation: wt-bob 3s ease-in-out infinite; }
.wt-skull, .wt-char-body rect, .wt-limb, .wt-hand, .wt-finger { fill: var(--wt-accent); }
.wt-foot { fill: color-mix(in srgb, var(--wt-accent) 72%, #000); }
.wt-char-belly { fill: rgba(255, 255, 255, 0.16); }
.wt-char-shadow { fill: rgba(15, 18, 34, 0.22); animation: wt-shadow 3s ease-in-out infinite; }
.wt-pupil { fill: #1f2430; transform-origin: center; animation: wt-look 5s ease-in-out infinite; }
.wt-cheek { fill: #ff7eb6; opacity: 0.5; }
.wt-smile { stroke: #1f2430; stroke-width: 3; stroke-linecap: round; }
.wt-antenna { stroke: var(--wt-accent); stroke-width: 3; stroke-linecap: round; }
.wt-antenna-tip { fill: var(--wt-accent); animation: wt-glow 2s ease-in-out infinite; }

/* eyes blink */
.wt-eyes { transform-origin: 60px 40px; animation: wt-blink 4.2s infinite; }

/* pointing arm */
.wt-char-arm {
  transform-origin: 84px 84px;
  transform: rotate(var(--wt-arm-angle, 35deg));
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.wt-character.wt-pointing .wt-char-arm { animation: wt-point-nudge 1.1s ease-in-out infinite; }
.wt-character.wt-waving  .wt-char-arm { animation: wt-wave 0.6s ease-in-out 3; }

/* left arm + legs */
.wt-arm-left { transform-origin: 30px 84px; }
.wt-leg-l { transform-origin: 50px 104px; }
.wt-leg-r { transform-origin: 70px 104px; }

/* hop: the whole character leaps + squashes on landing */
.wt-character.wt-hopping { animation: wt-hop 0.62s cubic-bezier(0.3, 0.7, 0.25, 1); }
.wt-character.wt-hopping .wt-legs     { animation: wt-legtuck 0.62s ease-in-out; }
.wt-character.wt-hopping .wt-arm-left { animation: wt-armswing 0.62s ease-in-out; }

@keyframes wt-bob    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes wt-shadow { 0%,100% { transform: scaleX(1); opacity: 0.22; } 50% { transform: scaleX(0.82); opacity: 0.14; } }
@keyframes wt-blink  { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
@keyframes wt-look   { 0%,40% { transform: translateX(0); } 50%,70% { transform: translateX(-2.5px); } 85%,100% { transform: translateX(0); } }
@keyframes wt-glow   { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes wt-point-nudge { 0%,100% { transform: rotate(var(--wt-arm-angle, 35deg)); } 50% { transform: rotate(calc(var(--wt-arm-angle, 35deg) - 8deg)); } }
@keyframes wt-wave   { 0%,100% { transform: rotate(-55deg); } 50% { transform: rotate(-90deg); } }
@keyframes wt-hop {
  0%   { transform: translateY(0) scale(1, 1); }
  18%  { transform: translateY(2px) scale(1.12, 0.86); }   /* crouch */
  42%  { transform: translateY(-30px) scale(0.92, 1.12); } /* launch */
  70%  { transform: translateY(0) scale(1, 1); }
  82%  { transform: translateY(0) scale(1.12, 0.86); }     /* land squash */
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes wt-legtuck {
  0%,100% { transform: translateY(0); }
  42%     { transform: translateY(-7px) scaleY(0.8); }
}
@keyframes wt-armswing {
  0%,100% { transform: rotate(0deg); }
  42%     { transform: rotate(-38deg); }
}

/* ---- speech bubble -------------------------------------------------- */
.wt-bubble {
  pointer-events: auto;
  position: relative;
  width: min(340px, calc(100vw - 40px));
  background: var(--wt-bg);
  color: var(--wt-ink);
  border-radius: var(--wt-radius);
  box-shadow: var(--wt-shadow);
  padding: 16px 18px 14px;
  margin-bottom: 8px;
}
.wt-bubble::before {
  content: "";
  position: absolute;
  bottom: 18px;
  left: -9px;
  width: 18px;
  height: 18px;
  background: var(--wt-bg);
  transform: rotate(45deg);
  border-radius: 3px;
}
.wt-cluster.wt-arrow-right .wt-bubble::before { left: auto; right: -9px; }
.wt-cluster.wt-arrow-down  .wt-bubble::before { bottom: -9px; left: 28px; }

.wt-name {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--wt-accent);
  margin-bottom: 6px;
}
.wt-name::before {
  content: "";
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--wt-accent);
}
.wt-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; line-height: 1.25; }
.wt-text  { font-size: 14.5px; line-height: 1.5; margin: 0; color: var(--wt-ink); min-height: 1.5em; }
.wt-caret { display: inline-block; width: 2px; margin-left: 1px; background: var(--wt-accent); animation: wt-caret 0.8s step-end infinite; }
@keyframes wt-caret { 50% { opacity: 0; } }

/* ---- controls ------------------------------------------------------- */
.wt-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}
.wt-progress { display: flex; gap: 5px; margin-right: auto; }
.wt-dot { width: 7px; height: 7px; border-radius: 50%; background: #d6d9e4; transition: all 0.3s; }
.wt-dot.wt-active { background: var(--wt-accent); transform: scale(1.25); }
.wt-dot.wt-done { background: var(--wt-accent); opacity: 0.45; }

.wt-btn {
  font: inherit;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s, background 0.15s;
}
.wt-btn:active { transform: translateY(1px); }
.wt-btn-primary { background: var(--wt-accent); color: var(--wt-accent-ink); }
.wt-btn-primary:hover { filter: brightness(1.07); }
.wt-btn-ghost { background: transparent; color: var(--wt-muted); padding: 8px 10px; }
.wt-btn-ghost:hover { background: rgba(108, 92, 231, 0.08); color: var(--wt-ink); }
.wt-btn-icon {
  background: transparent; color: var(--wt-muted);
  width: 34px; height: 34px; padding: 0;
  display: grid; place-items: center; border-radius: 9px;
}
.wt-btn-icon:hover { background: rgba(108, 92, 231, 0.08); color: var(--wt-ink); }
.wt-btn-icon svg { width: 18px; height: 18px; }

.wt-skip {
  position: absolute;
  top: 10px; right: 12px;
  font-size: 12px;
  color: var(--wt-muted);
  background: none; border: none; cursor: pointer;
  padding: 4px;
}
.wt-skip:hover { color: var(--wt-ink); text-decoration: underline; }

/* ---- launcher (re-open the tour) ------------------------------------ */
.wt-launcher {
  position: fixed;
  right: 22px; bottom: 22px;
  z-index: 2147483000;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--wt-accent, #6c5ce7);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 11px 17px 11px 13px;
  font: 600 14px ui-sans-serif, system-ui, sans-serif;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(108, 92, 231, 0.45);
  transition: transform 0.15s, box-shadow 0.15s;
}
.wt-launcher:hover { transform: translateY(-2px); box-shadow: 0 16px 38px rgba(108, 92, 231, 0.55); }
.wt-launcher svg { width: 22px; height: 22px; }

@media (prefers-reduced-motion: reduce) {
  .wt-root *, .wt-character, .wt-spotlight, .wt-cluster { animation: none !important; transition: none !important; }
}
`;

export function injectStyles(): void {
  if (document.getElementById("wt-styles")) return;
  const tag = document.createElement("style");
  tag.id = "wt-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}
