// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Section order follows resources/views/pages/home.blade.php at b600a8d.
// Service status, ads, guides, and the "processed on our servers" claim are not rendered.

import { toolCopy } from "@/lib/catalog-copy";
import { translate } from "@/lib/i18n";
import { WebToolCard } from "@/components/site/web-tool-card";
import { Glyph } from "@/components/site/glyph";
import { SiteIcon } from "@/components/site/icon";
import { usePreferencesStore } from "@/stores/preferences-store";
import { CATEGORIES } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";

const PILLARS = [
  { index: "01", icon: "layers", tone: "pdf", title: "pillarPdfTitle", text: "pillarPdfText", link: "pillarPdfLink", category: "pdf" },
  { index: "02", icon: "convert", tone: "conversion", title: "pillarConvertTitle", text: "pillarConvertText", link: "pillarConvertLink", category: "conversion" },
  { index: "03", icon: "archive", tone: "image", title: "pillarImageTitle", text: "pillarImageText", link: "pillarImageLink", category: "image" },
  { index: "04", icon: "scan-text", tone: "ocr", title: "pillarOcrTitle", text: "pillarOcrText", link: "pillarOcrLink", category: "ocr" },
] as const;

export function DashboardPage() {
  const locale = usePreferencesStore((state) => state.preferences.language);
  const navigate = usePreferencesStore((state) => state.navigate);
  const popular = ["merge-pdf", "compress-pdf", "word-to-pdf", "pdf-to-jpg", "compress-image", "image-to-text"]
    .flatMap((id) => {
      const tool = toolRegistry.get(id);
      return tool ? [tool] : [];
    });

  return (
    <>
      <section className="home-hero" aria-label={translate(locale, "heroLabel")}>
        <div className="deco" aria-hidden="true">
          <span className="deco-grid" />
          <span className="deco-blob deco-blob-1" />
          <span className="deco-blob deco-blob-2" />
          <span className="deco-blob deco-blob-3" />
          <span className="deco-ring deco-ring-1" />
          <span className="deco-ring deco-ring-2" />
        </div>
        <div className="home-hero-inner">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-on-dark">
              <SiteIcon name="bolt" className="size-4" />
              {translate(locale, "heroEyebrow")}
            </span>
            <h1>{translate(locale, "heroTitle")}</h1>
            <p className="hero-lead">{translate(locale, "heroLead")}</p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => void navigate({ name: "tool", toolId: "merge-pdf" })}>
                {translate(locale, "heroMerge")}
                <SiteIcon name="arrow-right" className="size-5 icon-arrow" />
              </button>
              <button type="button" className="btn btn-on-dark btn-lg" onClick={() => void navigate({ name: "tools" })}>
                {translate(locale, "heroCatalog")}
                <SiteIcon name="arrow-down" className="size-5" />
              </button>
            </div>
            <dl className="hero-stats">
              <div><dt>{translate(locale, "statTools")}</dt><dd>20</dd></div>
              <div><dt>{translate(locale, "statAccounts")}</dt><dd><em>{translate(locale, "statZero")}</em></dd></div>
              <div><dt>{translate(locale, "statFamilies")}</dt><dd>4</dd></div>
            </dl>
          </div>
        </div>
        <span className="deco-curve" aria-hidden="true" />
      </section>
      <div className="site-main">
        <section aria-label={translate(locale, "whyLabel")}>
          <div className="section-heading">
            <span className="heading-mark">{translate(locale, "whyLabel")}</span>
            <h2>{translate(locale, "whyTitle")} <span className="gradient-word">{translate(locale, "whyAccent")}</span></h2>
            <p>{translate(locale, "whyLead")}</p>
          </div>
          <div className="pillar-grid">
            {PILLARS.map((pillar) => (
              <article className={`pillar${pillar.index === "01" ? " pillar-feature" : ""}`} key={pillar.index}>
                <span className="pillar-index" aria-hidden="true">{pillar.index}</span>
                <Glyph icon={pillar.icon} tone={pillar.tone} size="lg" />
                <h3>{translate(locale, pillar.title)}</h3>
                <p>{translate(locale, pillar.text)}</p>
                <button type="button" className="pillar-link" onClick={() => void navigate({ name: "category", category: pillar.category })}>
                  {translate(locale, pillar.link)}
                  <SiteIcon name="arrow-right" className="size-4" />
                </button>
              </article>
            ))}
          </div>
        </section>
        <section aria-label={translate(locale, "popularTitle")}>
          <div className="section-heading">
            <span className="heading-mark">{translate(locale, "popularEyebrow")}</span>
            <h2>{translate(locale, "popularTitle")}</h2>
            <p>{translate(locale, "popularLead")}</p>
          </div>
          <div className="tool-grid cols-3">
            {popular.map((tool) => (
              <WebToolCard key={tool.meta.id} tool={tool} locale={locale} featured onOpen={() => void navigate({ name: "tool", toolId: tool.meta.id })} />
            ))}
          </div>
        </section>
        <section id="catalogo" aria-label={translate(locale, "catalogTitle")}>
          <div className="catalog">
            <div className="section-heading">
              <span className="heading-mark">{translate(locale, "catalogEyebrow")}</span>
              <h2>{translate(locale, "catalogTitle")} <span className="gradient-word">ToolZen</span></h2>
              <p>{translate(locale, "catalogLead")}</p>
            </div>
            {CATEGORIES.map((category) => {
              const tools = toolRegistry.list().filter((tool) => tool.meta.category === category.id);
              const tone = category.id === "conversion" ? "conversion" : category.id === "image" ? "image" : category.id === "ocr" ? "ocr" : "pdf";
              return (
                <div className="catalog-rail" id={`cat-${category.id}`} key={category.id}>
                  <div className="catalog-rail-head">
                    <Glyph icon={category.icon} tone={tone} />
                    <h3>{translate(locale, categoryTitleKey(category.id))}</h3>
                    <p>{translate(locale, categoryTextKey(category.id))}</p>
                  </div>
                  <div className="tool-grid cols-4">
                    {tools.map((tool) => (
                      <WebToolCard key={tool.meta.id} tool={tool} locale={locale} onOpen={() => void navigate({ name: "tool", toolId: tool.meta.id })} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <p className="sr-only">{toolCopy(locale, "merge-pdf").short}</p>
      </div>
    </>
  );
}

function categoryTitleKey(id: string): "pillarPdfTitle" | "pillarConvertTitle" | "pillarImageTitle" | "pillarOcrTitle" {
  if (id === "conversion") return "pillarConvertTitle";
  if (id === "image") return "pillarImageTitle";
  if (id === "ocr") return "pillarOcrTitle";
  return "pillarPdfTitle";
}

function categoryTextKey(id: string): "pillarPdfText" | "pillarConvertText" | "pillarImageText" | "pillarOcrText" {
  if (id === "conversion") return "pillarConvertText";
  if (id === "image") return "pillarImageText";
  if (id === "ocr") return "pillarOcrText";
  return "pillarPdfText";
}
