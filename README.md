# Nester — Agency Website

A simple static site (plain HTML/CSS/JS, no build tools) for Nester, a paid media / media buying agency.

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
└── assets/images/         Put logos/photos here
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
- **Contact email / socials** — `hello@nesteragency.com` and the LinkedIn/Instagram/X links in the footer and `contact.html` are placeholders.
- **Client logos** — the "Trusted by" strip on the home page uses text placeholders; replace with real logo images once you can name clients (or remove the section until then).

## Making the contact form actually send emails

The form on `contact.html` currently only shows a "message received" confirmation locally — it doesn't send anywhere. Since this is a static site (no backend server), the easiest fix is a free form service:

1. Sign up at [Formspree](https://formspree.io) (or Netlify Forms if you deploy to Netlify).
2. Get your form endpoint URL.
3. In `contact.html`, change `<form id="contact-form">` to `<form id="contact-form" action="https://formspree.io/f/YOUR_ID" method="POST">`.
4. Remove or keep the JS success message as you prefer — Formspree can also redirect to a thank-you page.

## Publishing the site (free options)

- **GitHub Pages** — push this folder to a GitHub repo, then enable Pages in the repo settings.
- **Netlify** — drag and drop this folder into [netlify.com/drop](https://app.netlify.com/drop) for an instant live URL.

Both are free and give you a live link you can share or point a custom domain at.
