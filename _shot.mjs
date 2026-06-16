import { chromium } from "playwright-core";
const exe = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browser = await chromium.launch({
  executablePath: exe,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type()==="error") errors.push(m.text()); });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(5000); // big GLB + 4 anim GLBs
const ch = await page.$(".wt-character-3d");
if (ch) await ch.screenshot({ path: "/tmp/fun-closeup.png" });
await page.screenshot({ path: "/tmp/fun-intro.png" });
const acts = await page.evaluate(() => window.tour ? "tour ok" : "no tour");
await page.click(".wt-next"); await page.waitForTimeout(1600);
await page.click(".wt-next"); await page.waitForTimeout(1600);
await page.screenshot({ path: "/tmp/fun-step.png" });
console.log(acts, "| ERRORS:", errors.length ? errors.slice(0,5) : "none");
await browser.close();
