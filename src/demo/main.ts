import { Walkthrough } from "../walkthrough/index.ts";

// --- demo page behavior: simple tab switching -------------------------
const tabs = document.querySelectorAll<HTMLButtonElement>(".tab");
const panels = document.querySelectorAll<HTMLElement>(".panel");

function activateTab(name: string) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  panels.forEach((p) => {
    const match = p.dataset.panel === name;
    p.classList.toggle("active", match);
    p.hidden = !match;
  });
}
tabs.forEach((tab) =>
  tab.addEventListener("click", () => activateTab(tab.dataset.tab!)),
);

// --- the guided tour --------------------------------------------------
const tour = new Walkthrough({
  characterName: "Pip",
  accentColor: "#6c5ce7",
  speech: true,
  storageKey: "cocoaworks-tour",
  steps: [
    {
      // intro — no target, character "to camera"
      title: "Hi, I'm Pip! 👋",
      text: "Welcome to CocoaWorks! I'll give you a quick tour of your production dashboard and show you what every part does. Ready? Let's go!",
    },
    {
      target: ".tabs",
      title: "Your main tabs",
      text: "These four tabs organize everything: Overview, Production, Inventory, and Reports. Click any one to switch sections — I'll walk you through each.",
      side: "bottom",
    },
    {
      openTab: '.tab[data-tab="overview"]',
      target: ".cards",
      title: "Overview at a glance",
      text: "On the Overview tab, these cards show your live numbers — bars made today, quality pass rate, and how many lines are running.",
      side: "bottom",
    },
    {
      target: "#new-batch",
      title: "Start a new batch",
      text: "This button kicks off a brand-new production batch. It's the fastest way to begin making candy.",
    },
    {
      openTab: '.tab[data-tab="production"]',
      target: "#start-line",
      title: "Start the line",
      text: "Now we're on the Production tab. The green Start Line button powers up a production line and begins making bars.",
    },
    {
      target: "#pause-line",
      title: "Pause when you need to",
      text: "Need to stop for maintenance? The Pause button safely halts the line without losing your batch.",
    },
    {
      openTab: '.tab[data-tab="inventory"]',
      target: "#add-stock",
      title: "Keep stock topped up",
      text: "On the Inventory tab, Add Stock lets you log new cocoa, sugar, and packaging as deliveries arrive.",
    },
    {
      openTab: '.tab[data-tab="reports"]',
      target: "#generate-report",
      title: "Generate reports",
      text: "Finally, the Reports tab. Generate Report builds a full production summary you can share or export to CSV.",
    },
    {
      target: "#account-btn",
      title: "Your account",
      text: "Up here is your account menu — settings, profile, and sign-out all live behind this button.",
      side: "left",
    },
    {
      title: "You're all set! 🎉",
      text: "That's the whole dashboard! Click the 'Show me around' button any time you want me to run the tour again. Happy candy-making!",
    },
  ],
  onFinish: () => activateTab("overview"),
  onSkip: () => activateTab("overview"),
});

// Show a floating launcher, and auto-start for first-time visitors.
tour.mountLauncher("Show me around");
if (!tour.completed) {
  setTimeout(() => tour.start(), 600);
}

// expose for tinkering in the console
(window as unknown as { tour: Walkthrough }).tour = tour;
