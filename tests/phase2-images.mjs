import puppeteer from "/tmp/shot-runner/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const dir = "/opt/cursor/artifacts/phase2";
fs.mkdirSync(dir, { recursive: true });
const fixtures = "/tmp/toolzen-phase2/tests/fixtures";
fs.mkdirSync(fixtures, { recursive: true });
execFileSync("python3", ["-c", `
from PIL import Image
im = Image.new("RGB", (8, 8), (255, 255, 255))
im.putpixel((0, 0), (255, 0, 0))
im.putpixel((7, 7), (0, 0, 255))
im.save("${fixtures}/grid.png")
im.save("${fixtures}/grid.jpg", quality=95)
im.save("${fixtures}/exif.jpg", quality=95, exif=b"Exif\\x00\\x00" + b"A"*32)
`]);

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
const client = await page.createCDPSession();
await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dir });
await page.setViewport({ width: 1280, height: 900 });
const results = [];

async function openTool(name) {
  await page.goto("http://127.0.0.1:1421/", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.body.innerText.includes("All tools") || document.body.innerText.includes("Todas"));
  await page.evaluate((label) => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").includes(label));
    button.click();
  }, "All");
  await page.waitForFunction((tool) => document.body.innerText.includes(tool), {}, name);
  await page.evaluate((tool) => {
    const card = [...document.querySelectorAll("article")].find((node) => node.textContent?.includes(tool));
    [...card.querySelectorAll("button")].find((button) => (button.textContent || "").includes("Open")).click();
  }, name);
  await page.waitForSelector("input[type=file]");
}

async function run(name, file, fields = {}) {
  await openTool(name);
  const input = await page.$("input[type=file]");
  await input.uploadFile(file);
  for (const [idPart, value] of Object.entries(fields)) {
    const handle = await page.$(`input[id$='-${idPart}']`);
    if (!handle) throw new Error(`missing field ${idPart} on ${name}`);
    await handle.click({ clickCount: 3 });
    await handle.type(String(value));
  }
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.body.innerText.includes("Download") || document.body.innerText.includes("Descargar"), { timeout: 10000 });
  const href = await page.$eval("a[download]", (node) => node.getAttribute("href"));
  const filename = await page.$eval("a[download]", (node) => node.getAttribute("download"));
  const base64 = href.split(",")[1];
  const bytes = Buffer.from(base64, "base64");
  const out = `${dir}/${filename}`;
  fs.writeFileSync(out, bytes);
  return { name, filename, bytes, out };
}

try {
  const compressed = await run("Compress image", `${fixtures}/grid.png`);
  const meta = execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open("${compressed.out}")
print(im.size[0], im.size[1], im.mode)
`]).toString().trim();
  if (!meta.startsWith("8 8")) throw new Error(`compress size ${meta}`);
  results.push({ tool: "compress-image", actual: `png ${meta} bytes ${compressed.bytes.length}`, ok: true });

  const resized = await run("Resize image", `${fixtures}/grid.png`, { width: "4", height: "4" });
  const rmeta = execFileSync("python3", ["-c", `from PIL import Image; im=Image.open("${resized.out}"); print(im.size[0], im.size[1])`]).toString().trim();
  if (rmeta !== "4 4") throw new Error(`resize ${rmeta}`);
  results.push({ tool: "resize-image", actual: rmeta, ok: true });

  const cropped = await run("Crop image", `${fixtures}/grid.png`, { x: "0", y: "0", width: "2", height: "2" });
  const cmeta = execFileSync("python3", ["-c", `
from PIL import Image
im=Image.open("${cropped.out}")
px=im.getpixel((0,0))
print(im.size[0], im.size[1], px[0], px[1], px[2])
`]).toString().trim();
  if (!cmeta.startsWith("2 2 255 0 0")) throw new Error(`crop ${cmeta}`);
  results.push({ tool: "crop-image", actual: cmeta, ok: true });

  const webp = await run("WebP converter", `${fixtures}/grid.png`);
  if (!webp.filename.endsWith(".webp") || webp.bytes.subarray(0, 4).toString() !== "RIFF") throw new Error("webp header");
  results.push({ tool: "webp-converter", actual: `RIFF ${webp.bytes.length} bytes`, ok: true });

  const clean = await run("Remove image metadata", `${fixtures}/exif.jpg`);
  const exif = clean.bytes.includes(Buffer.from("Exif"));
  if (exif) throw new Error("exif survived re-encode");
  results.push({ tool: "remove-image-metadata", actual: "no Exif marker", ok: true });

  const pdf = await run("JPG to PDF", `${fixtures}/grid.jpg`);
  if (!pdf.bytes.subarray(0, 5).toString().startsWith("%PDF")) throw new Error("not pdf");
  if (!pdf.bytes.includes(Buffer.from([0xff, 0xd8]))) throw new Error("jpeg missing inside pdf");
  results.push({ tool: "jpg-to-pdf", actual: `pdf ${pdf.bytes.length} with jpeg`, ok: true });

  fs.writeFileSync(`${dir}/image-results.json`, JSON.stringify({ ok: true, results }, null, 2));
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${dir}/image-failure.png` });
  fs.writeFileSync(`${dir}/image-results.json`, JSON.stringify({ ok: false, error: String(error), results }, null, 2));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
