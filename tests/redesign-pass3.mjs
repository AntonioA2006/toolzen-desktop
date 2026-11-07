import puppeteer from "/tmp/shot-runner/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const dir = "/opt/cursor/artifacts/redesign";
const fixtures = "/tmp/toolzen-qa-fixtures";
fs.mkdirSync(fixtures, { recursive: true });
execFileSync("python3", ["-c", `from PIL import Image\nImage.new('RGB',(32,24),(20,90,200)).save('${fixtures}/qa.png')\nImage.new('RGB',(16,16),(200,40,40)).save('${fixtures}/qa2.png')`]);

function lin(v) { return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }
function luminance(rgb) {
  const m = rgb.match(/\d+/g).map((n) => Number(n) / 255);
  return 0.2126 * lin(m[0]) + 0.7152 * lin(m[1]) + 0.0722 * lin(m[2]);
}
function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const browser = await puppeteer.launch({ executablePath: "/usr/local/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
const notes = { browser: true, native: false };
try {
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://127.0.0.1:1435/", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://127.0.0.1:1435/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.body.innerText.includes("Tools at hand") || document.body.innerText.includes("Tus herramientas"));

  notes.font = await page.evaluate(() => ({
    family: getComputedStyle(document.body).fontFamily,
    loaded: document.fonts.check('14px "Plus Jakarta Sans"'),
    body: getComputedStyle(document.body).fontSize,
    lineHeight: getComputedStyle(document.body).lineHeight,
    h1: getComputedStyle(document.querySelector("h1")).fontSize,
    section: getComputedStyle(document.querySelector("h2")).fontSize,
  }));
  notes.sidebarHit = await page.evaluate(() => Math.round([...document.querySelectorAll("aside button")].map((n) => n.getBoundingClientRect().height).sort((a, b) => a - b)[0]));

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  notes.focus = await page.evaluate(() => {
    const node = document.activeElement;
    const style = getComputedStyle(node);
    return { tag: node.tagName, text: (node.innerText || "").slice(0, 40), outline: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
  });

  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await page.waitForSelector("[role=dialog] input");
  await page.keyboard.press("Tab");
  notes.paletteTrap = await page.evaluate(() => Boolean(document.activeElement.closest("[role=dialog]")));
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  await page.keyboard.type("Privacy");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.body.innerText.includes("What this build stores"));
  notes.paletteEnter = true;
  notes.paletteClosed = await page.evaluate(() => !document.querySelector("[role=dialog]"));
  await page.screenshot({ path: `${dir}/browser-privacy-en-light.png` });

  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await page.waitForSelector("[role=dialog]");
  await page.screenshot({ path: `${dir}/browser-palette-en-light.png` });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"));

  const tokens = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const meta = getComputedStyle(document.querySelector(".type-meta"));
    return { ink: body.color, bg: body.backgroundColor, meta: meta.color };
  });
  notes.contrastBody = ratio(tokens.ink, tokens.bg);
  notes.contrastMeta = ratio(tokens.meta, tokens.bg);
  notes.tokens = tokens;

  for (const width of [960, 1280, 1680]) {
    await page.setViewport({ width, height: 800 });
    notes[`overflow${width}`] = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  }
  await page.setViewport({ width: 1280, height: 800 });

  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  notes.reducedMotion = await page.evaluate(() => getComputedStyle(document.body).transitionDuration);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  await page.click("button[aria-label='Collapse sidebar']");
  notes.collapsed = await page.evaluate(() => document.querySelector("aside").className.includes("w-16"));
  await page.click("button[aria-label='Expand sidebar']");
  notes.expanded = await page.evaluate(() => document.querySelector("aside").className.includes("w-60"));

  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Settings").click());
  await page.waitForSelector("select#language");
  await page.select("select#theme", "system");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  notes.systemDark = true;
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
  notes.systemLight = true;
  await page.select("select#language", "es");
  await page.select("select#theme", "light");
  await page.screenshot({ path: `${dir}/browser-settings-es-light.png` });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Inicio").click());
  await page.waitForFunction(() => document.body.innerText.includes("Tus herramientas, a mano"));
  const home = await page.$eval("main", (n) => n.innerText);
  notes.homeChecks = {
    heading: home.includes("Tus herramientas, a mano"),
    noOcrClaim: !home.includes("OCR") || home.includes("0 disponibles"),
    noDefensive: !home.includes("sí funciona"),
    conversion: home.includes("Conversión"),
    image: home.includes("Imagen"),
    singular: home.includes("1 parcial") && home.includes("1 no incluida") && !home.includes("1 listas") && !home.includes("1 parciales"),
  };
  if (home.includes("sí funciona") || home.includes("1 listas") || !home.includes("Conversión") || !home.includes("Imagen")) {
    throw new Error(home);
  }
  await page.screenshot({ path: `${dir}/browser-dashboard-es-light.png` });
  await page.click("button[aria-label^='Tema']");
  await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].find((n) => (n.textContent || "").includes("Oscuro")).click());
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.screenshot({ path: `${dir}/browser-dashboard-es-dark.png` });

  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Todas").click());
  await page.waitForSelector("button[aria-pressed]");
  await page.click("button[aria-pressed=false]");
  await page.screenshot({ path: `${dir}/browser-explorer-es-dark.png` });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Favoritos").click());
  await page.waitForFunction(() => !document.body.innerText.includes("Todavía no hay favoritos"));
  await page.screenshot({ path: `${dir}/browser-favorites-es-dark.png` });

  async function openTool(name) {
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");
    await page.waitForSelector("[role=dialog] input");
    await page.click("[role=dialog] input");
    await page.keyboard.type(name);
    await page.waitForFunction((label) => [...document.querySelectorAll("[role=option]")].some((n) => (n.textContent || "").includes(label)), {}, name);
    await page.evaluate((label) => {
      const options = [...document.querySelectorAll("[role=option]")].filter((n) => (n.textContent || "").includes(label));
      const tool = options.sort((a, b) => (b.textContent || "").length - (a.textContent || "").length)[0];
      tool.click();
    }, name);
    await page.waitForFunction((label) => document.querySelector("h1")?.textContent?.includes(label), {}, name);
  }
  await openTool("Redimensionar");
  const resize = await page.$eval("main", (n) => n.innerText);
  notes.resizeFields = resize.includes("Ancho") && resize.includes("Alto");
  await page.screenshot({ path: `${dir}/browser-resize-es-dark.png` });
  await page.type("input[type=number]", "0");
  notes.resizeError = await page.$eval("main", (n) => n.innerText.includes("al menos 1"));
  await openTool("Recortar imagen");
  notes.cropFields = await page.$eval("main", (n) => ["X", "Y", "Ancho", "Alto"].every((label) => n.innerText.includes(label)));
  await page.screenshot({ path: `${dir}/browser-crop-es-dark.png` });
  await openTool("Rotar PDF");
  notes.rotateFields = await page.$eval("main", (n) => n.innerText.includes("90") && n.innerText.includes("Páginas"));
  await page.screenshot({ path: `${dir}/browser-rotate-es-dark.png` });
  await openTool("JPG a PDF");
  const input = await page.$("input[type=file]");
  await input.uploadFile(`${fixtures}/qa.png`, `${fixtures}/qa2.png`);
  notes.jpgOrder = await page.$eval("main", (n) => n.innerText.includes("Subir") && n.innerText.includes("Bajar"));
  await page.screenshot({ path: `${dir}/browser-jpg-order-es-dark.png` });
  await openTool("Comprimir PDF");
  notes.compressPdfDisabled = await page.$eval("button[type=submit]", (n) => n.disabled);
  await page.screenshot({ path: `${dir}/browser-unavailable-es-dark.png` });
  await openTool("OCR");
  notes.ocrDisabled = await page.$eval("button[type=submit]", (n) => n.disabled);
  await openTool("Comprimir imagen");
  notes.fixedQuality = await page.evaluate(() => document.body.innerText.includes("0,75") && document.querySelectorAll("select").length === 0);
  await (await page.$("input[type=file]")).uploadFile(`${fixtures}/qa.png`);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.body.innerText.includes("Guardar como"));
  const result = await page.$eval("main", (n) => n.innerText);
  notes.resultHidesForm = !result.includes("Seleccionar archivo") && result.includes("Entrada") && result.includes("Salida") && result.includes("ms");
  notes.resultQuality = result.includes("0,75");
  await page.screenshot({ path: `${dir}/browser-result-es-dark.png` });
  await page.click("button[aria-label^='Tema']");
  await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].find((n) => (n.textContent || "").includes("Claro")).click());
  await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
  await page.screenshot({ path: `${dir}/browser-result-es-light.png` });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Recientes").click());
  const recent = await page.$eval("main", (n) => n.innerText);
  notes.recentNoAmPm = !recent.includes("AM") && !recent.includes("PM");
  await page.screenshot({ path: `${dir}/browser-recent-es-light.png` });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Privacidad").click());
  await page.screenshot({ path: `${dir}/browser-privacy-es-light.png` });
  await page.evaluate(() => [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Acerca de").click());
  await page.screenshot({ path: `${dir}/browser-about-es-light.png` });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await page.waitForSelector("[role=dialog]");
  await page.screenshot({ path: `${dir}/browser-palette-es-light.png` });
  await page.keyboard.press("Escape");

  fs.writeFileSync(`${dir}/pass3-notes.json`, JSON.stringify(notes, null, 2));
  console.log(JSON.stringify(notes, null, 2));
} catch (error) {
  await page.screenshot({ path: `${dir}/browser-pass3-failure.png` });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
