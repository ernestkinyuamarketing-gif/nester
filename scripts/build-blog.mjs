// Pulls published posts from a Notion database and renders them as static
// HTML pages under /blog, matching the rest of the site's template. Also
// appends blog URLs to sitemap.xml. Run with: npm run build:blog
// Requires env vars NOTION_TOKEN and NOTION_DATABASE_ID.

import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { marked } from "marked";
import sharp from "sharp";
import { mkdir, writeFile, readdir, unlink, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import path from "node:path";

const SITE_URL = "https://nesteragency.com";
const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_AUTHOR = "Ernest Kinyua";
const IMG_MAX_WIDTH = 1600;

// No file cache: it keeps image files open, which blocks deleting stale ones on Windows.
sharp.cache(false);

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function richTextToPlain(richText) {
  return (richText || []).map((t) => t.plain_text).join("");
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function getCoverUrl(page) {
  if (!page.cover) return null;
  if (page.cover.type === "external") return page.cover.external.url;
  if (page.cover.type === "file") return page.cover.file.url;
  return null;
}

// Files uploaded to Notion come back as signed URLs that expire after about an
// hour, so they're downloaded, resized and served from /blog/images instead.
// Images linked from elsewhere on the web are left as they are.
export function isNotionHosted(url) {
  try {
    const host = new URL(url).hostname;
    return ["amazonaws.com", "notion.so", "notion-static.com", "notionusercontent.com"].some(
      (h) => host === h || host.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function localizeImage(url, imgDir, usedImages) {
  if (!isNotionHosted(url)) return { src: url };

  // Name the file after its stable location (not the expiring query string), so
  // re-runs reuse it and replacing the image in Notion produces a new file.
  const { origin, pathname } = new URL(url);
  const name = `${createHash("sha1").update(origin + pathname).digest("hex").slice(0, 16)}.webp`;
  const file = path.join(imgDir, name);
  usedImages.add(name);

  if (!(await fileExists(file))) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Image download failed (${res.status}): ${pathname}`);
    const input = Buffer.from(await res.arrayBuffer());
    await sharp(input, { animated: true })
      .rotate()
      .resize({ width: IMG_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(file);
  }

  const meta = await sharp(file).metadata();
  return { src: `/blog/images/${name}`, width: meta.width, height: meta.pageHeight || meta.height };
}

function imgSizeAttrs(img) {
  return img.width ? ` width="${img.width}" height="${img.height}"` : "";
}

function absoluteUrl(src) {
  return src.startsWith("/") ? `${SITE_URL}${src}` : src;
}

// Post body: the page title is the only <h1>, so Notion headings move down a level,
// and images are localized and lazy-loaded.
async function processContentHtml(html, imgDir, usedImages) {
  html = html.replace(/<(\/?)h([1-5])(?=[\s>])/g, (_, slash, level) => `<${slash}h${Number(level) + 1}`);

  for (const [tag, rawSrc, rest] of [...html.matchAll(/<img src="([^"]+)"([^>]*)>/g)]) {
    const img = await localizeImage(rawSrc.replace(/&amp;/g, "&"), imgDir, usedImages);
    html = html.replace(tag, `<img src="${escapeHtml(img.src)}"${rest}${imgSizeAttrs(img)} loading="lazy" decoding="async">`);
  }
  return html;
}

// Embeds JSON-LD safely inside a <script> tag.
function jsonLdScript(data) {
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, "\\u003c")}\n</script>`;
}

// Shared page shell — mirrors the head/header/footer markup used across the
// rest of the static site (nav links, GTM snippet, footer columns).
export function pageShell({ title, description, canonical, ogImage, bodyHtml, activeBlog = false, ogType = "article", jsonLd = [] }) {
  const cover = ogImage ? absoluteUrl(ogImage) : `${SITE_URL}/assets/images/og-image.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google Tag Manager — started once the page has finished loading so it never delays what visitors see -->
<script>window.dataLayer=window.dataLayer||[];
window.addEventListener('load',function(){var go=function(){(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TTD8J2LP');};
if('requestIdleCallback' in window){requestIdleCallback(go,{timeout:2000});}else{setTimeout(go,1000);}});</script>
<!-- End Google Tag Manager -->

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">

<link rel="icon" type="image/png" href="/assets/images/favicon-32.png" sizes="32x32">
<link rel="icon" type="image/png" href="/assets/images/favicon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Nester">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${cover}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@NesterMB">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${cover}">

<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/styles.css">
${jsonLd.map(jsonLdScript).join("\n")}
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TTD8J2LP"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

<div class="aurora-bg" aria-hidden="true"><span></span><span></span><span></span><span></span></div>

<a href="#main-content" class="skip-link">Skip to main content</a>

<header class="site-header">
  <nav class="nav">
    <a href="/index.html" class="logo"><img src="/assets/images/nester-icon-sm.png" alt="Nester Agency logo" class="logo-icon" width="95" height="68"><span class="logo-text">Nest<span>er</span></span></a>
    <ul class="nav-links" id="primary-navigation">
      <li><a href="/index.html">Home</a></li>
      <li><a href="/services.html">Services</a></li>
      <li><a href="/case-studies.html">Case Studies</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/blog/index.html"${activeBlog ? ' class="active"' : ""}>Blog</a></li>
      <li><a href="/contact.html">Contact</a></li>
    </ul>
    <div class="nav-cta">
      <a href="/contact.html" class="btn btn-secondary">Get a Proposal</a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="primary-navigation">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
</header>

<main>

${bodyHtml}

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/index.html" class="logo"><span class="logo-text">Nest<span>er</span></span></a>
        <p>A performance-driven media buying agency helping brands across Europe, the U.S., and Australia turn ad spend into predictable, measurable growth.</p>
        <div class="social-links">
          <a href="https://www.linkedin.com/in/ernest-mutwiri-5393003a9" aria-label="LinkedIn" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.114 20.452H3.558V9h3.556v11.452z"/></svg>
          </a>
          <a href="https://www.facebook.com/errne.nester/" aria-label="Facebook" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.878h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94z"/></svg>
          </a>
          <a href="https://x.com/NesterMB" aria-label="X (Twitter)" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.53 2.5h3.06l-6.69 7.64L21.75 21.5h-5.98l-4.68-6.13-5.36 6.13H2.66l7.16-8.18L2 2.5h6.13l4.23 5.6L17.53 2.5Zm-1.07 17.2h1.7L7.6 4.2H5.77l10.69 15.5Z"/></svg>
          </a>
          <a href="https://wa.me/254720262499" aria-label="WhatsApp" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.892.526 3.66 1.44 5.168L2 22l4.964-1.404A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.19a8.17 8.17 0 0 1-4.166-1.14l-.299-.178-3.09.876.86-3.02-.194-.31A8.164 8.164 0 1 1 20.164 12 8.173 8.173 0 0 1 12 20.19z"/><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-col">
        <h3>Site</h3>
        <ul>
          <li><a href="/index.html">Home</a></li>
          <li><a href="/services.html">Services</a></li>
          <li><a href="/case-studies.html">Case Studies</a></li>
          <li><a href="/about.html">About</a></li>
          <li><a href="/blog/index.html">Blog</a></li>
        </ul>
      </div>
      <div class="footer-col footer-col-services">
        <h3>Services</h3>
        <ul>
          <li><a href="/services.html">Paid Social</a></li>
          <li><a href="/services.html">Paid Search</a></li>
          <li><a href="/services.html">Programmatic</a></li>
          <li><a href="/services.html">ChatGPT Ads</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Contact</h3>
        <ul>
          <li><a href="mailto:contact@nesteragency.com">contact@nesteragency.com</a></li>
          <li><a href="/contact.html">Get a proposal</a></li>
          <li><a href="/privacy.html">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Nester. All rights reserved.</span>
      <span>Built with intent.</span>
    </div>
  </div>
</footer>

<div class="mobile-cta-bar">
  <a href="/contact.html" class="btn btn-primary">Book a Free Audit</a>
</div>

<button class="back-to-top" aria-label="Back to top">
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
</button>

<script src="/js/main.js"></script>
</body>
</html>
`;
}

export function postPageBody({ title, dateLabel, author, excerpt, cover, contentHtml }) {
  const byline = [dateLabel, author && `By ${escapeHtml(author)}`].filter(Boolean).join(" · ");
  return `<section class="hero" id="main-content" style="padding: 88px 0 56px;">
  <div class="container" style="grid-template-columns: 1fr; text-align:left;">
    <div>
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><a href="/index.html">Home</a></li>
          <li><a href="/blog/index.html">Blog</a></li>
          <li aria-current="page">${escapeHtml(title)}</li>
        </ol>
      </nav>
      <p class="eyebrow" style="color:#93c5fd;">${byline}</p>
      <h1>${escapeHtml(title)}</h1>
      ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ""}
    </div>
  </div>
</section>

<section>
  <div class="container" style="max-width: 760px;">
    ${cover ? `<img src="${escapeHtml(cover.src)}" alt="${escapeHtml(title)}"${imgSizeAttrs(cover)} style="width:100%; height:auto; border-radius:var(--radius); margin-bottom:32px;">` : ""}
    <div class="post-body">
      ${contentHtml}
    </div>
  </div>
</section>

<section style="padding-top: 0;">
  <div class="container reveal">
    <div class="cta-banner">
      <h2>Want results like this for your brand?</h2>
      <p>Book a free audit and we'll map out exactly how we'd approach your account.</p>
      <a href="/contact.html" class="btn btn-light">Book a Free Audit</a>
    </div>
  </div>
</section>`;
}

export function indexPageBody(posts) {
  const cards = posts
    .map(
      (p) => `      <a href="/blog/${p.slug}.html" class="card" style="display:block; text-decoration:none;">
        ${p.cover ? `<img src="${escapeHtml(p.cover.src)}" alt="${escapeHtml(p.title)}"${imgSizeAttrs(p.cover)} loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:16px;">` : ""}
        <p class="eyebrow" style="margin-bottom:8px;">${p.dateLabel}</p>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.excerpt)}</p>
      </a>`
    )
    .join("\n");

  return `<section class="hero" id="main-content" style="padding: 88px 0 56px;">
  <div class="container" style="grid-template-columns: 1fr; text-align:left;">
    <div>
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><a href="/index.html">Home</a></li>
          <li aria-current="page">Blog</li>
        </ol>
      </nav>
      <p class="eyebrow" style="color:#93c5fd;">Blog</p>
      <h1>Notes on paid media, from the accounts we run.</h1>
      <p>Practical breakdowns of what's working across Google, Meta, TikTok, and ChatGPT Ads, plus what we're seeing across client accounts.</p>
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="grid grid-3 reveal">
${cards || '      <p style="color:var(--color-text-muted);">No posts published yet — check back soon.</p>'}
    </div>
  </div>
</section>`;
}

async function updateSitemap(root, posts) {
  const staticUrls = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${SITE_URL}/services.html`, priority: "0.9", changefreq: "monthly" },
    { loc: `${SITE_URL}/case-studies.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${SITE_URL}/about.html`, priority: "0.7", changefreq: "monthly" },
    { loc: `${SITE_URL}/contact.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${SITE_URL}/privacy.html`, priority: "0.3", changefreq: "yearly" },
    { loc: `${SITE_URL}/blog/index.html`, priority: "0.8", changefreq: "weekly" },
  ];

  // Static pages carry no <lastmod>: stamping them with the build date would change
  // the sitemap (and trigger a commit + redeploy) on every sync even when nothing changed.
  const urlEntries = [
    ...staticUrls.map(
      (u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    ...posts.map(
      (p) => `  <url>\n    <loc>${SITE_URL}/blog/${p.slug}.html</loc>\n    <lastmod>${p.updated}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join("\n")}\n</urlset>\n`;

  await writeFile(path.join(root, "sitemap.xml"), xml, "utf-8");
}

async function queryPublishedPages(notion, databaseId) {
  const pages = [];
  let cursor;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: { property: "Published", checkbox: { equals: true } },
      sorts: [{ property: "Date", direction: "descending" }],
      start_cursor: cursor,
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return pages;
}

// Deletes generated files that no longer belong to a published post
// (unpublished, renamed slug, or replaced image).
async function removeStale(dir, keep, extension, root) {
  for (const name of await readdir(dir)) {
    if (name.endsWith(extension) && !keep.has(name)) {
      await unlink(path.join(dir, name));
      console.log(`Removed: /${path.relative(root, path.join(dir, name)).replaceAll(path.sep, "/")}`);
    }
  }
}

export async function build({ notion, n2m, databaseId, root = ROOT }) {
  const blogDir = path.join(root, "blog");
  const imgDir = path.join(blogDir, "images");
  await mkdir(imgDir, { recursive: true });

  const pages = await queryPublishedPages(notion, databaseId);
  const posts = [];
  const pageFiles = new Set(["index.html"]);
  const usedImages = new Set();

  for (const page of pages) {
    const props = page.properties;
    const title = richTextToPlain(props.Name?.title) || "Untitled";
    const slug = slugify(richTextToPlain(props.Slug?.rich_text) || title);
    const excerpt = richTextToPlain(props.Excerpt?.rich_text) || "";
    const author = richTextToPlain(props.Author?.rich_text) || DEFAULT_AUTHOR;
    const date = props.Date?.date?.start || page.created_time.slice(0, 10);
    const updated = page.last_edited_time.slice(0, 10);
    const canonical = `${SITE_URL}/blog/${slug}.html`;

    if (pageFiles.has(`${slug}.html`)) {
      throw new Error(`Two published posts share the slug "${slug}". Give one of them a different Slug in Notion.`);
    }

    const coverUrl = getCoverUrl(page);
    const cover = coverUrl ? await localizeImage(coverUrl, imgDir, usedImages) : null;

    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdBlocks);
    const contentHtml = await processContentHtml(marked.parse(mdString.parent || ""), imgDir, usedImages);

    const dateLabel = formatDate(date);
    const image = cover ? absoluteUrl(cover.src) : `${SITE_URL}/assets/images/og-image.png`;

    const html = pageShell({
      title: `${title} | Nester Blog`,
      description: excerpt || title,
      canonical,
      ogImage: cover?.src,
      activeBlog: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description: excerpt || title,
          image,
          datePublished: date,
          dateModified: page.last_edited_time,
          author: { "@type": "Person", name: author, url: `${SITE_URL}/about.html` },
          publisher: {
            "@type": "Organization",
            name: "Nester",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/images/nester-icon.png` },
          },
          mainEntityOfPage: canonical,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog/index.html` },
            { "@type": "ListItem", position: 3, name: title, item: canonical },
          ],
        },
      ],
      bodyHtml: postPageBody({ title, dateLabel, author, excerpt, cover, contentHtml }),
    });

    await writeFile(path.join(blogDir, `${slug}.html`), html, "utf-8");
    pageFiles.add(`${slug}.html`);
    posts.push({ title, slug, excerpt, date, updated, dateLabel, cover });

    console.log(`Built: /blog/${slug}.html`);
  }

  const indexHtml = pageShell({
    title: "Blog | Nester",
    description: "Practical paid media insights from Nester: Google, Meta, TikTok, and ChatGPT Ads breakdowns from the accounts we run.",
    canonical: `${SITE_URL}/blog/index.html`,
    activeBlog: true,
    ogType: "website",
    bodyHtml: indexPageBody(posts),
  });

  await writeFile(path.join(blogDir, "index.html"), indexHtml, "utf-8");
  console.log(`Built: /blog/index.html (${posts.length} posts)`);

  await removeStale(blogDir, pageFiles, ".html", root);
  await removeStale(imgDir, usedImages, ".webp", root);

  await updateSitemap(root, posts);
  console.log("Updated sitemap.xml");
  return posts;
}

async function main() {
  const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    throw new Error("Missing NOTION_TOKEN or NOTION_DATABASE_ID environment variables.");
  }
  const notion = new Client({ auth: NOTION_TOKEN });
  const n2m = new NotionToMarkdown({ notionClient: notion });
  await build({ notion, n2m, databaseId: NOTION_DATABASE_ID });
}

// Only sync when run directly (npm run build:blog), so the module can be imported for testing.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
