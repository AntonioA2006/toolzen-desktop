import puppeteer from "/tmp/shot-runner/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const dir = "/opt/cursor/artifacts/phase2-ui";
fs.mkdirSync(dir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=es-ES"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1360, height: 900 });
try {
  await page.goto("http://127.0.0.1:1431/", { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://127.0.0.1:1431/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.body.innerText.includes("Unir un PDF") || document.body.innerText.includes("Merge a PDF"));
  const homeText = await page.evaluate(() => document.body.innerText.slice(0, 400));
  await page.screenshot({ path: `${dir}/home-en-light.png` });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").includes("Split PDF") || (node.textContent || "").includes("Dividir PDF"));
    if (!button) throw new Error("no split card");
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Arrastra") || document.body.innerText.includes("Drag your"));
  const toolHtml = await page.content();
  if (toolHtml.includes("download=")) throw new Error("anchor download attribute is still rendered");
  await page.screenshot({ path: `${dir}/split-en-light.png`, fullPage: true });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").trim() === "Español");
    if (!button) throw new Error("no Español switch");
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Arrastra tu PDF"));
  await page.screenshot({ path: `${dir}/split-es-light.png`, fullPage: true });
  await page.click("button.icon-btn");
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.screenshot({ path: `${dir}/split-es-dark.png`, fullPage: true });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").includes("All tools") || (node.textContent || "").includes("Todas"));
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Compress") || document.body.innerText.includes("Comprimir"));
  await page.screenshot({ path: `${dir}/explorer-en-dark.png` });
  fs.writeFileSync(`${dir}/notes.json`, JSON.stringify({ homeText, downloadAttribute: false }, null, 2));
  console.log("shots ok", homeText.slice(0, 180));
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png` });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
