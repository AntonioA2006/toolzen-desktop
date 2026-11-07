import puppeteer from "/tmp/shot-runner/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const dir = "/opt/cursor/artifacts/phase2";
const fixtures = "/tmp/toolzen-phase2/tests/fixtures";
fs.mkdirSync(fixtures, { recursive: true });
fs.writeFileSync(`${fixtures}/not-an-image.png`, "this is text, not an image\n");
fs.writeFileSync(`${fixtures}/empty.png`, Buffer.alloc(0));

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const results = [];

async function openTool(name) {
  await page.goto("http://127.0.0.1:1421/", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.body.innerText.includes("All tools"));
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").includes("All"));
    button.click();
  });
  await page.waitForFunction((tool) => document.body.innerText.includes(tool), {}, name);
  await page.evaluate((tool) => {
    const card = [...document.querySelectorAll("article")].find((node) => node.textContent?.includes(tool));
    const button = [...card.querySelectorAll("button")].find((node) => /Open|View status/.test(node.textContent || ""));
    if (!button) throw new Error(`no open control for ${tool}`);
    button.click();
  }, name);
  await page.waitForSelector("button[type=submit]");
}

async function errorText() {
  return page.evaluate(() => {
    const node = document.querySelector(".text-danger");
    return node ? node.textContent : "";
  });
}

try {
  await openTool("Compress image");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.querySelector(".text-danger"));
  const empty = await errorText();
  if (!empty.toLowerCase().includes("file")) throw new Error(`empty submit: ${empty}`);
  results.push({ case: "compress-no-file", actual: empty, ok: true });

  await openTool("Compress image");
  await (await page.$("input[type=file]")).uploadFile(`${fixtures}/not-an-image.png`);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => (document.querySelector(".text-danger")?.textContent || "").includes("readable"));
  const bad = await errorText();
  results.push({ case: "compress-not-image", actual: bad, ok: true });

  await openTool("Compress image");
  await (await page.$("input[type=file]")).uploadFile(`${fixtures}/empty.png`);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => (document.querySelector(".text-danger")?.textContent || "").length > 0);
  const emptyFile = await errorText();
  if (await page.$("a[download]")) throw new Error("empty file produced a download");
  results.push({ case: "compress-empty-file", actual: emptyFile, ok: true });

  await openTool("Resize image");
  await (await page.$("input[type=file]")).uploadFile(`${fixtures}/grid.png`);
  for (const id of ["width", "height"]) {
    const handle = await page.$(`input[id$='-${id}']`);
    await handle.click({ clickCount: 3 });
    await handle.type("0");
  }
  await page.click("button[type=submit]");
  await page.waitForFunction(() => (document.querySelector(".text-danger")?.textContent || "").includes("at least 1"));
  results.push({ case: "resize-zero", actual: await errorText(), ok: true });

  await openTool("Crop image");
  await (await page.$("input[type=file]")).uploadFile(`${fixtures}/grid.png`);
  for (const [id, value] of [["x", "0"], ["y", "0"], ["width", "100"], ["height", "100"]]) {
    const handle = await page.$(`input[id$='-${id}']`);
    await handle.click({ clickCount: 3 });
    await handle.type(value);
  }
  await page.click("button[type=submit]");
  await page.waitForFunction(() => (document.querySelector(".text-danger")?.textContent || "").includes("does not fit"));
  results.push({ case: "crop-outside", actual: await errorText(), ok: true });

  await openTool("Compress PDF");
  const disabled = await page.$eval("button[type=submit]", (node) => node.disabled);
  const body = await page.evaluate(() => document.body.innerText);
  if (!disabled) throw new Error("unavailable tool run button is enabled");
  if (!body.includes("not in this build") && !body.includes("Not in this build") && !body.toLowerCase().includes("unavailable")) {
    throw new Error(`unavailable copy missing: ${body.slice(0, 400)}`);
  }
  results.push({ case: "compress-pdf-unavailable", actual: `disabled=${disabled}`, ok: true });

  fs.writeFileSync(`${dir}/edge-results.json`, JSON.stringify({ ok: true, results }, null, 2));
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${dir}/edge-failure.png` });
  fs.writeFileSync(`${dir}/edge-results.json`, JSON.stringify({ ok: false, error: String(error), results }, null, 2));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
