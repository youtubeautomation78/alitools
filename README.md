# Ali Super Tools — New Website (Complete Package)

A complete, fast, modern static website. No database, no WordPress, no build step.
Just upload the files and the site works.

## What's inside

```
index.html                 → Homepage (hero + search + tools + FAQ)
tools.html                 → All tools, grouped by category
tools/                     → 8 working tool pages
  word-counter.html
  sentence-case-converter.html
  remove-extra-spaces.html
  comma-separator.html
  paragraph-counter.html
  alphabetical-text-organizer.html
  text-to-slug-generator.html
  youtube-thumbnail-downloader.html
about.html                 → About Us
contact.html               → Contact Us (form opens visitor's email app)
privacy-policy.html        → Privacy Policy (AdSense-ready)
terms.html                 → Terms & Conditions
assets/style.css           → All design (one file, fast)
assets/main.js             → Menu, search, FAQ accordion, copy buttons
assets/favicon.svg         → Logo icon
sitemap.xml / robots.txt   → For Google Search Console
ads.txt                    → Your AdSense publisher file (pub-4856164099586969)
```

## Before you publish — 3 things to change

1. **Contact email + form:** contact email is `shaheertariq31@gmail.com`; the contact form submits via FormSubmit (AJAX) straight to that inbox - no email app needed. One-time setup: the first submission triggers a FormSubmit activation email to that address; click its activation link once.
   (2 places: the visible text/link and the `var to = ...` line in the script)
   with your real email address.
2. **Domain in sitemap/canonicals:** If you publish on a new domain, replace
   `alisupertools.blogspot.com` inside `sitemap.xml`, `robots.txt`, and the
   `<link rel="canonical">` / `og:url` tags with your new domain.
3. **Social links:** Footer social icons currently point to `#` — replace them
   with your real Facebook / X / YouTube / Instagram page URLs (in every page's
   footer).

## How to publish (free options)

- **Netlify:** go to app.netlify.com → "Add new site" → drag this whole folder
  onto the deploy area. Done — you get a live URL in seconds.
- **Vercel:** vercel.com → New Project → upload/import the folder (framework: Other).
- **GitHub Pages:** put the files in a GitHub repo → Settings → Pages → deploy from branch.
- **Paid hosting (cPanel):** upload all files into `public_html`.

Then connect your custom domain in the hosting panel (strongly recommended
for AdSense and branding).

## AdSense checklist (after the site is live)

- [ ] Site live on your final domain with HTTPS
- [ ] `ads.txt` reachable at `yourdomain.com/ads.txt` (already filled with your pub ID)
- [ ] Add the AdSense verification `<script>` code from your AdSense account into
      the `<head>` of every page (or use Google Site Kit / your host's insert tool)
- [ ] Privacy Policy + Terms + About + Contact pages all linked in nav/footer ✔ (included)
- [ ] Submit `sitemap.xml` in Google Search Console
- [ ] Apply / re-apply for AdSense approval

## Notes

- All 8 tools run 100% in the visitor's browser — no server code needed.
- Design: Poppins + Inter fonts, indigo/violet brand gradient, fully responsive.
- Every page has a unique title + meta description; tool pages include FAQ schema
  and a Related Tools section for internal linking.

## Blog + Admin Panel (added 2026-10-23)

- **Admin:** https://www.hausamusics.com/admin (Decap CMS). Login = a GitHub account with write access to this repo.
- **How publishing works:** Decap saves each post as Markdown in `content/posts/`. Vercel runs `build-blog.js` as the build command (see `vercel.json`) on every deploy, which generates `blog/<slug>.html`, refreshes `blog.html`, `rss.xml` and the blog entries in `sitemap.xml`, in the deployment. A post goes live ~1-2 minutes after Publish.
- **By hand:** you can also add a `.md` file to `content/posts/` yourself (same frontmatter as the existing post) and push - the next deploy builds it the same way.
- **One-time owner setup (required for login to work):** create a GitHub OAuth App (callback URL `https://www.hausamusics.com/api/callback`), then add `OAUTH_GITHUB_CLIENT_ID` and `OAUTH_GITHUB_CLIENT_SECRET` as Vercel environment variables, and invite the client's GitHub account as a repo collaborator. Full steps: `alisupertools-admin-setup-guide.md` in the delivery folder.
- Uploaded post images are stored in `assets/uploads/`.
