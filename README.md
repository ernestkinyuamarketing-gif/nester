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
├── css/styles.css        All styling (colors, fonts, layout)
├── js/main.js             Mobile nav, scroll animations, form demo
├── robots.txt             Search engine crawl rules
├── sitemap.xml            Page listing for search engines
└── assets/images/         Logo, favicon, and OG/social share images
    ├── nester-logo-full.png    Master brand image (icon + wordmark + tagline + platform strip)
    ├── nester-icon.png         Cropped icon mark, used in the nav bar
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

Search each file for these placeholders and replace them with real content:

- **Client names & results** — `case-studies.html` and the "Recent client wins" section of `index.html` use `Client Name` and sample metrics (ROAS, CPA, etc.). Replace with real campaign results once you have them, or keep believable placeholders clearly marked until then.
- **Founder bio & photo** — `about.html` has a placeholder bio and photo box. Add your name, background, and a real photo in `assets/images/`.
- **Testimonial** — `index.html` has one placeholder quote; swap in a real client quote when available.
- **Client logos** — the "Trusted by" strip on the home page uses text placeholders; replace with real logo images once you can name clients (or remove the section until then).

Already set: contact email (`ernestkinyua.marketing@gmail.com`), LinkedIn, Facebook, and X links across the footer and `contact.html`.

## Making the contact form actually send emails

The form on `contact.html` currently only shows a "message received" confirmation locally — it doesn't send anywhere. Since this is a static site (no backend server), the easiest fix is a free form service:

1. Sign up at [Formspree](https://formspree.io) (or Netlify Forms if you deploy to Netlify).
2. Get your form endpoint URL.
3. In `contact.html`, change `<form id="contact-form">` to `<form id="contact-form" action="https://formspree.io/f/YOUR_ID" method="POST">`.
4. Remove or keep the JS success message as you prefer — Formspree can also redirect to a thank-you page.

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
