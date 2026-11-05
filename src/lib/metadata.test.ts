import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAppMetadataFromHtml } from "@/lib/metadata.server";

test("parseAppMetadataFromHtml extracts app title, tagline, description, icon, demo", () => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Shottr — The screenshot app for Mac</title>
      <meta name="description" content="Shottr is a tiny, fast screenshot tool for macOS. Take scrolling screenshots, OCR text, and annotate instantly.">
      <meta property="og:title" content="Shottr — The screenshot app for Mac">
      <meta property="og:description" content="Shottr is a tiny, fast screenshot tool for macOS. Take scrolling screenshots, OCR text, and annotate instantly.">
      <meta property="og:image" content="/images/shottr-demo.png">
      <meta property="og:site_name" content="Shottr">
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    </head>
    <body>
      <h1>Shottr</h1>
      <p>Download free. Pro license is $12 once. Menu bar utility for Mac.</p>
    </body>
    </html>
  `;

  const meta = parseAppMetadataFromHtml(html, "https://shottr.cc");

  assert.equal(meta.name, "Shottr");
  assert.equal(meta.tagline, "The screenshot app for Mac");
  assert.ok(meta.description.includes("Shottr is a tiny, fast screenshot tool"));
  assert.equal(meta.icon, "https://shottr.cc/icons/apple-touch-icon-180.png");
  assert.equal(meta.demo, "https://shottr.cc/images/shottr-demo.png");
  assert.equal(meta.pricing, "freemium"); // download free + pro license $12
  assert.equal(meta.category, "utility"); // screenshot, menu bar, utility
});

test("parseAppMetadataFromHtml detects developer tools and JSON-LD", () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DevHub - Git & Terminal Dashboard</title>
      <meta property="og:description" content="Developer tool for GitHub, Docker, and terminal logs in one place.">
      <link rel="apple-touch-icon" href="https://cdn.example.com/icon.png">
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "DevHub",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "macOS"
      }
      </script>
    </head>
    <body>
      <p>100% free and open source developer dashboard.</p>
    </body>
    </html>
  `;

  const meta = parseAppMetadataFromHtml(html, "https://devhub.app");

  assert.equal(meta.name, "DevHub");
  assert.equal(meta.tagline, "Git & Terminal Dashboard");
  assert.equal(meta.icon, "https://cdn.example.com/icon.png");
  assert.equal(meta.category, "dev");
  assert.equal(meta.pricing, "free");
});

test("parseAppMetadataFromHtml detects design apps and paid pricing", () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>VectorCraft | Mac Vector Illustration and Figma Companion</title>
      <meta property="og:description" content="Professional vector design canvas, icon palette, and SVG export studio.">
      <meta property="og:image" content="https://vectorcraft.io/hero-shot.jpg">
      <link rel="icon" href="/favicon.ico">
    </head>
    <body>
      <div>Lifetime license for $49. Buy now.</div>
    </body>
    </html>
  `;

  const meta = parseAppMetadataFromHtml(html, "https://vectorcraft.io");

  assert.equal(meta.name, "VectorCraft");
  assert.equal(meta.category, "design");
  assert.equal(meta.pricing, "paid");
  assert.equal(meta.demo, "https://vectorcraft.io/hero-shot.jpg");
  assert.equal(meta.icon, "https://vectorcraft.io/favicon.ico");
});

test("parseAppMetadataFromHtml detects productivity apps", () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>FocusNotes: Fast Markdown Notes and Daily Planner</title>
      <meta name="description" content="Organize your markdown notes, tasks, calendar, and daily focus in one private local app.">
      <link rel="apple-touch-icon" href="/icon.png">
    </head>
    <body>
      <p>Try free trial, then $29 license.</p>
    </body>
    </html>
  `;

  const meta = parseAppMetadataFromHtml(html, "https://focusnotes.app/mac");

  assert.equal(meta.name, "FocusNotes");
  assert.equal(meta.category, "productivity");
  assert.equal(meta.pricing, "freemium");
  assert.equal(meta.icon, "https://focusnotes.app/icon.png");
});

test("parseAppMetadataFromHtml extracts X handle from meta tags or social links", () => {
  const htmlWithMeta = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QuickClean Mac</title>
      <meta name="twitter:creator" content="@quickclean_app">
    </head>
    <body><p>Clean your Mac with ease.</p></body>
    </html>
  `;
  const meta1 = parseAppMetadataFromHtml(htmlWithMeta, "https://quickclean.app");
  assert.equal(meta1.xHandle, "@quickclean_app");

  const htmlWithLink = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ClipSnap</title>
    </head>
    <body>
      <footer>
        <a href="https://x.com/clipsnapmac">Follow on X</a>
      </footer>
    </body>
    </html>
  `;
  const meta2 = parseAppMetadataFromHtml(htmlWithLink, "https://clipsnap.app");
  assert.equal(meta2.xHandle, "@clipsnapmac");
});
