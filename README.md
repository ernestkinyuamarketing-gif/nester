# Nester — Agency Website

A simple static site (plain HTML/CSS/JS, no build tools) for Nester, a paid media / media buying agency.

- **Live site:** https://nester-agency.netlify.app
- **GitHub repo:** https://github.com/ernestkinyuamarketing-gif/nester

## Structure

```
Nester/
├── index.html          Home page
├── services.html        Services detail page
├── case-studies.html    Case studies / results page
├── about.html            About / founder page
├── contact.html          Contact form page
├── 404.html               Custom "page not found" page
├── css/styles.css        All styling (colors, fonts, layout)
├── js/main.js             Nav, scroll reveal, counters, FAQ/testimonial UI, contact form
├── robots.txt             Search engine crawl rules
├── sitemap.xml            Page listing for search engines
├── site.webmanifest       "Add to home screen" icon/name config
├── netlify.toml           Security headers, caching rules, publish settings
└── assets/images/         Logo, favicon, and OG/social share images
    ├── nester-logo-full.png    Master brand image (icon + wordmark + tagline + platform strip)
    ├── nester-icon.png         Cropped icon mark, used in the nav bar
    ├── platforms-strip.png     Cropped "platforms we advertise on" row, used on the home page
    ├── favicon.png / favicon-32.png / apple-touch-icon.png   Browser tab & home-screen icons
    └── og-image.png            1200×630 image shown when the site is shared on social media
```

## How to preview it

No install needed — just open `index.html` in a browser by double-clicking it.

For a closer-to-live preview (recommended before publishing), run a local server from this folder:

```
npx serve .
```

then open the URL it prints (usually `http://localhost:3000`).

## What to customize before launch

- **Case study metrics** — `case-studies.html` and the "Recent client wins" section of `index.html` use illustrative sample numbers (ROAS, CPA, etc.), not real results. Replace with your actual campaign results when ready.
- **Client naming** — since client names usually can't be disclosed, each case study is labeled with an anonymized descriptor instead of a real or fake company name (e.g. "European Fashion Retailer" with a "Name withheld under NDA" note). This is intentional — don't invent fictional company names to fill these in; presenting a made-up company as if it's real risks looking deceptive if a prospect tries to verify it. Feel free to adjust the descriptors (industry/size/region) to match your real client work as long as they stay non-identifying.
- **Founder bio & photo** — `about.html` has a placeholder bio and photo box. Add your name, background, and a real photo in `assets/images/`.
- **Testimonials** — `index.html` has three testimonial quotes attributed by role + anonymized company type (e.g. "Head of Growth, DTC Skincare Brand"), not real quotes yet. Swap in real client quotes when available, keeping names anonymized the same way if needed.

Already set: contact email (`ernestkinyua.marketing@gmail.com`), LinkedIn, Facebook, and X links across the footer and `contact.html`; the "platforms we advertise on" marquee on the home page (real, not placeholder).

## The contact form works — here's how to see submissions

The form on `contact.html` is wired up to **Netlify Forms** (`data-netlify="true"` plus a hidden honeypot field for spam protection) and submits over AJAX so visitors never leave the page. To see and manage submissions:

1. Log into Netlify and open the `nester-agency` site.
2. Go to **Site settings → Forms** — every submission appears there automatically once the form has been part of a deploy (already done).
3. Turn on **email notifications** under Forms → Notifications so each submission also lands in your inbox.

No third-party service (Formspree etc.) is needed — this is built into Netlify's free tier.

## Extra features already built in

- **Accessibility:** a "skip to main content" link, visible focus outlines, ARIA labels on the mobile menu button, and a native `<details>`-based FAQ accordion that works without JavaScript.
- **Animated stats & FAQ:** the hero numbers count up when scrolled into view; the homepage FAQ section also carries `FAQPage` structured data for Google's rich-result snippets.
- **Breadcrumbs:** every inner page shows a Home / [Page] trail, with matching `BreadcrumbList` structured data.
- **404 page:** a branded "page not found" page (`404.html`) instead of a generic browser error.
- **Back-to-top button & mobile "Book a Free Audit" bar:** small conversion/usability aids that appear on scroll and on mobile.
- **Security headers & caching:** `netlify.toml` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, plus sensible cache lifetimes for images/CSS/JS.
- **Honest platform strip:** the old "fake client logos" placeholder on the home page was replaced with a real "platforms we advertise across" row (Google, Meta, Bing, TikTok, YouTube, LinkedIn) cropped from your logo artwork — no fabricated trust signals.

## SEO — what's been done, and what still matters

Every page now has EU-targeted, keyword-optimized titles and descriptions, Open Graph/Twitter share previews, a favicon, canonical tags, and `ProfessionalService` structured data (schema.org) listing your service area as the EU and linking to your LinkedIn, Facebook, and X profiles. `robots.txt` and `sitemap.xml` are in place so search engines can find and index every page.

Keywords were chosen around real search intent for this niche and region: things like *media buying agency Europe*, *paid media agency EU*, *PPC agency Europe*, *performance marketing agency*, plus platform-specific terms (*Google Ads agency*, *Meta ads agency*, *TikTok ads agency*) pulled straight from the services you actually offer. They're woven into titles, descriptions, and page copy — not stuffed in unnaturally, which Google penalizes.

**Important — what on-page SEO can't do alone:** no amount of code changes will make a site "appear on top" by itself. That also depends on things outside the code:

- **A custom domain.** `nester-agency.netlify.app` works, but a real domain (e.g. `nesteragency.com` or `.eu`) is far more trustworthy to both users and Google, and lets you use Google Search Console's country-targeting properly.
- **Backlinks.** Sites linking to yours (directories, partner sites, press, guest posts) are one of the strongest ranking factors.
- **Google Search Console + Google Business Profile.** Submitting the sitemap to Search Console and setting up a Business Profile (with EU country targeting) helps Google understand and rank the site faster.
- **Real content over time.** Real case studies, a blog/insights section, and fresh updates outperform placeholder content — both for rankings and for visitor trust.
- **Page speed & Core Web Vitals** — this site is lightweight (no framework, no heavy JS), which already helps here.

None of this can be faked from inside the code — it's ongoing work once the site is live with real content.

## Publishing the site (free options)

- **GitHub Pages** — push this folder to a GitHub repo, then enable Pages in the repo settings.
- **Netlify** — drag and drop this folder into [netlify.com/drop](https://app.netlify.com/drop) for an instant live URL.

Both are free and give you a live link you can share or point a custom domain at.
