import puppeteer from "/tmp/shot-runner/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const dir = "/opt/cursor/artifacts/redesign";
const fixtures = "/tmp/toolzen-qa-fixtures";
fs.mkdirSync(fixtures, { recursive: true });
execFileSync("python3", ["-c", `from PIL import Image\nImage.new('RGB',(8,8),(0,128,255)).save('${fixtures}/qa.png')`]);

function contrast(a, b) {
  const parse = (hex) => {
    const c = hex.replace("#", "");
    const n = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  };
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const L = (hex) => {
    const [r, g, b2] = parse(hex).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [l1, l2] = [L(a), L(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const browser = await puppeteer.launch({ executablePath: "/usr/local/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const notes = {};
try {
  await page.goto("http://127.0.0.1:1435/", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://127.0.0.1:1435/", { waitUntil: "networkidle0" });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const node = document.activeElement;
    const style = getComputedStyle(node);
    return { tag: node.tagName, outline: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
  });
  notes.focus = focus;
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await page.waitForSelector("[role=dialog]", { timeout: 3000 });
  notes.palette = true;
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"));
  notes.escape = true;
  await page.click("button[aria-label='Collapse sidebar'], button[aria-label='Expand sidebar']");
  notes.collapsed = await page.evaluate(() => document.querySelector("aside").className.includes("w-16"));
  await page.setViewport({ width: 960, height: 700 });
  notes.overflowNarrow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  await page.setViewport({ width: 1440, height: 900 });
  notes.overflowWide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  const colors = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    return { color: body.color, background: body.backgroundColor };
  });
  notes.colors = colors;
  notes.contrastLight = contrast("#1a1d24", "#f4f5f7");
  notes.contrastMuted = contrast("#4c5361", "#f4f5f7");
  notes.contrastMeta = contrast("#6d7484", "#ffffff");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  notes.reduced = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("animation-duration") || "set");
  await page.screenshot({ path: `${dir}/a11y-home-light.png` });
  await page.evaluate(() => {
    const select = document.querySelector("select#language");
    if (!select) {
      [...document.querySelectorAll("button")].find((n) => (n.textContent || "").trim() === "Settings").click();
    }
  });
  await page.waitForSelector("select#language");
  await page.select("select#language", "es");
  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => (n.textContent || "").trim() === "Inicio").click());
  await page.waitForFunction(() => document.body.innerText.includes("Tus herramientas, a mano"));
  const spanish = await page.$eval("main", (node) => node.innerText);
  if (spanish.includes("Convert") && !spanish.includes("Conversión")) throw new Error("Convert untranslated");
  if (spanish.includes("sí funciona")) throw new Error("defensive heading remains");
  if (!spanish.includes("1 parcial")) throw new Error(spanish);
  await page.screenshot({ path: `${dir}/dashboard-es-light.png` });
  await page.click("button[aria-label^='Theme'], button[aria-label^='Tema']");
  await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].find((n) => /Dark|Oscuro/.test(n.textContent || "")).click());
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.screenshot({ path: `${dir}/dashboard-es-dark.png` });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => (n.textContent || "").includes("Comprimir imagen")).click());
  await page.waitForSelector("input[type=file]");
  await (await page.$("input[type=file]")).uploadFile(`${fixtures}/qa.png`);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.body.innerText.includes("Guardar como"));
  const resultText = await page.$eval("main", (node) => node.innerText);
  if (resultText.includes("Seleccionar archivo")) throw new Error("drop zone still shown on result");
  await page.screenshot({ path: `${dir}/tool-result-es-dark.png` });
  fs.writeFileSync(`${dir}/a11y-notes.json`, JSON.stringify(notes, null, 2));
  console.log(JSON.stringify(notes, null, 2));
} catch (error) {
  await page.screenshot({ path: `${dir}/a11y-failure.png` });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
