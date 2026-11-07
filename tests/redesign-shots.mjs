import puppeteer from "/tmp/shot-runner/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const dir = "/opt/cursor/artifacts/redesign";
fs.mkdirSync(dir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
async function shot(name) {
  await page.screenshot({ path: `${dir}/${name}.png` });
}
try {
  await page.goto("http://127.0.0.1:1435/", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://127.0.0.1:1435/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.body.innerText.includes("ToolZen"));
  await shot("dashboard-light");
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").includes("All tools"));
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Merge PDF") || document.body.innerText.includes("Unir PDF"));
  await shot("explorer-light");
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").includes("Split PDF") || (node.textContent || "").includes("Dividir PDF"));
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Drag") || document.body.innerText.includes("Arrastra"));
  const html = await page.content();
  if (html.includes("download=")) throw new Error("download attribute returned");
  await shot("tool-light");
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").trim() === "Privacy" || (node.textContent || "").trim() === "Privacidad");
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("SQLite"));
  await shot("privacy-light");
  await page.click("button[aria-label^='Theme']");
  await page.evaluate(() => {
    const item = [...document.querySelectorAll("[role='menuitem']")].find((node) => (node.textContent || "").includes("Dark"));
    item.click();
  });
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await shot("privacy-dark");
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").trim() === "Settings" || (node.textContent || "").trim() === "Ajustes");
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Appearance") || document.body.innerText.includes("Apariencia") || document.body.innerText.includes("Theme") || document.body.innerText.includes("Tema"));
  await shot("settings-dark");
  console.log("shots ok");
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png` });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
