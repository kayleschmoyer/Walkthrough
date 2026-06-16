import { Walkthrough, createAvatar3D } from "../walkthrough/index.ts";

// --- portal behavior: expandable sidebar groups -----------------------
document.querySelectorAll<HTMLButtonElement>(".nav-group").forEach((group) => {
  group.addEventListener("click", () => {
    const name = group.dataset.group!;
    const sub = document.querySelector<HTMLElement>(`.nav-sub[data-sub="${name}"]`);
    const open = group.classList.toggle("open");
    sub?.classList.toggle("open", open);
  });
});

// --- the guided tour --------------------------------------------------
const tour = new Walkthrough({
  characterName: "Pip",
  accentColor: "#33a7e0", // EnSight blue
  speech: true,
  storageKey: "ensight-tour",
  // Real-time 3D avatar — custom character (3D AI Studio mesh, Mixamo-rigged),
  // animated with her own Mixamo clips. Swap `url` to change the character.
  characterFactory: () =>
    createAvatar3D({
      url: "/avatar/character.glb",
      width: 240,
      height: 360,
      camera: { y: 0.12, z: 1.85, lookY: 0.08, fov: 31 },
      animations: {
        idle: "/avatar/anims/idle.glb",
        greet: "/avatar/anims/greet.glb",
        walk: "/avatar/anims/walk.glb",
        gesture: "/avatar/anims/gesture.glb",
        celebrate: "/avatar/anims/celebrate.glb", // Excited on the final step
      },
    }),
  steps: [
    {
      title: "Hi, I'm Pip! 👋",
      text: "Welcome to the EnSight portal! In about a minute I'll show you around your admin dashboard and point out what everything does. Let's dive in.",
    },
    {
      target: "#nav-dashboard",
      title: "Main navigation",
      text: "This sidebar is how you move around the portal — Dashboard, Signage, reports, user management, alerts, and admin tools all live here.",
      side: "right",
      padding: 4,
    },
    {
      target: "#site-picker",
      title: "Pick your site",
      text: "Up here you choose which garage you're viewing. Right now we're looking at 2075 Broadway — switch sites any time from this menu.",
      side: "bottom",
    },
    {
      target: "#stat-cards",
      title: "Today at a glance",
      text: "These four cards give you the day's headline numbers: total traffic in and out, current occupancy, the last detected vehicle move, and your latest system check-in.",
      side: "bottom",
    },
    {
      target: "#card-occupancy",
      title: "Live occupancy",
      text: "This one's key — it shows how full the garage is right now. 65 of 150 spaces are taken, so you're at 43% capacity.",
      side: "bottom",
    },
    {
      target: "#occupancy-table",
      title: "Occupancy breakdown",
      text: "The table breaks occupancy down by location with a live capacity bar. The little pencil icons let you adjust the available and maximum counts inline.",
      side: "top",
    },
    {
      target: "#daily-traffic",
      title: "Daily traffic trends",
      text: "Here you can chart traffic across a date range — inbound in green, outbound in red, against the prior 7 days. Set the dates and hit Go to refresh.",
      side: "right",
    },
    {
      target: "#daily-export",
      title: "Export your data",
      text: "Need the raw numbers? The Export button downloads this report so you can share it or open it in a spreadsheet.",
      side: "left",
    },
    {
      target: "#hourly-traffic",
      title: "Hour-by-hour view",
      text: "This panel zooms into a single day so you can spot your busy and quiet hours at a glance.",
      side: "left",
    },
    {
      openTab: "#nav-signage",
      target: '.nav-sub[data-sub="signage"]',
      title: "Expandable menus",
      text: "Some sections expand for more options. Signage, for example, opens up Designable Signs and Level Sign Overrides. Most menu groups work the same way.",
      side: "right",
      padding: 4,
    },
    {
      target: "#nav-site-alerts",
      title: "Stay on top of issues",
      text: "Site Alerts and User Alerts flag anything that needs your attention — like a camera going offline or an unusual reading.",
      side: "right",
      padding: 4,
    },
    {
      target: "#account-menu",
      title: "Your account",
      text: "Finally, your profile, preferences, and sign-out all live up here under your name.",
      side: "left",
    },
    {
      title: "You're all set! 🎉",
      text: "That's the EnSight dashboard! Click the 'Show me around' button any time to run this tour again. Happy monitoring!",
    },
  ],
});

// Floating launcher + auto-start for first-time visitors.
tour.mountLauncher("Show me around");
if (!tour.completed) setTimeout(() => tour.start(), 700);

// expose for console tinkering
(window as unknown as { tour: Walkthrough }).tour = tour;
