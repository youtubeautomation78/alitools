/* Ali Super Tools blog builder (zero dependencies).
   Reads Markdown posts from content/posts/*.md (written by the Decap CMS admin or by hand)
   and generates: blog/<slug>.html article pages, blog.html index, rss.xml, and blog
   entries in sitemap.xml. Runs locally and as the Vercel build command on every deploy (see vercel.json). */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://www.hausamusics.com';
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const BLOG_DIR = path.join(ROOT, 'blog');

/* ---------- frontmatter (tiny YAML subset) ---------- */
function parsePost(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const meta = {};
  m[1].split(/\r?\n/).forEach(line => {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) return;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (v === 'true') v = true;
    if (v === 'false') v = false;
    meta[kv[1]] = v;
  });
  return { meta, body: m[2] };
}

/* ---------- markdown -> html (safe subset) ---------- */
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function safeUrl(u) {
  u = String(u || '').trim();
  if (/^(https?:\/\/|mailto:|\/|#|\.\.\/)/i.test(u)) return u.replace(/"/g, '%22');
  return '#';
}
function inline(s) {
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, alt, src) => '<img src="' + safeUrl(src) + '" alt="' + alt + '" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, t, href) => '<a href="' + safeUrl(href) + '">' + t + '</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^\w*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0, list = null, para = [];
  function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
  function closeList() { if (list) { out.push(list === 'ul' ? '</ul>' : '</ol>'); list = null; } }
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flushPara(); closeList();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      i++;
      out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushPara(); closeList(); const lvl = h[1].length; out.push('<h' + lvl + ' id="' + slugify(h[2]) + '">' + inline(h[2]) + '</h' + lvl + '>'); i++; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flushPara(); closeList(); out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      flushPara(); closeList();
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push('<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>');
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const type = ul ? 'ul' : 'ol';
      if (list !== type) { closeList(); out.push('<' + type + '>'); list = type; }
      out.push('<li>' + inline((ul || ol)[1]) + '</li>');
      i++; continue;
    }
    if (/^\s*$/.test(line)) { flushPara(); closeList(); i++; continue; }
    para.push(line.trim()); i++;
  }
  flushPara(); closeList();
  return out.join('\n');
}

/* ---------- ADSTERRA ads (client ad units, added 2026-10-26; same codes as the static pages) ---------- */
const AD_SOCIAL = '<!-- ADSTERRA SOCIAL BAR (client ad unit, added 2026-10-26) -->\n<script src="https://pl32037781.profitableratecpmnetwork.com/ce/9b/45/ce9b45552ae7d2736efe5e2d33a180ff.js"></script>\n';
const AD_BANNER = '<!-- ADSTERRA BANNER 728x90 (client ad unit, added 2026-10-26) -->\n<div class="ad-banner" style="text-align:center;margin:28px auto;max-width:100%;overflow:hidden;min-height:90px" aria-hidden="true">\n<script>\natOptions = {\n\t\t\'key\' : \'d54b39179c7ae5d1958f27393deaca08\',\n\t\t\'format\' : \'iframe\',\n\t\t\'height\' : 90,\n\t\t\'width\' : 728,\n\t\t\'params\' : {}\n\t};\n</script>\n<script src="https://www.highrevenueformat.com/d54b39179c7ae5d1958f27393deaca08/invoke.js"></script>\n</div>\n';
const AD_BANNER_468 = '<!-- ADSTERRA BANNER 468x60 (client ad unit, added 2026-10-26) -->\n<div class="ad-banner" style="text-align:center;margin:18px auto 6px;max-width:100%;overflow:hidden;min-height:60px" aria-hidden="true">\n<script>\natOptions = {\n\t\t\'key\' : \'eac475e0194723052adb5c5c36fa8f5b\',\n\t\t\'format\' : \'iframe\',\n\t\t\'height\' : 60,\n\t\t\'width\' : 468,\n\t\t\'params\' : {}\n\t};\n</script>\n<script src="https://www.highrevenueformat.com/eac475e0194723052adb5c5c36fa8f5b/invoke.js"></script>\n</div>\n';

/* ---------- site chrome (header / footer / ticker taken from index.html so blog pages always match) ---------- */
function chrome(prefix) {
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let header = idx.slice(idx.indexOf('<header'), idx.indexOf('</header>') + '</header>'.length);
  let footer = idx.slice(idx.indexOf('<footer'), idx.indexOf('</footer>') + '</footer>'.length);
  const fix = html => (prefix === '../'
    ? html.replace(/(href|src)="(?!https?:|#|mailto:|data:|\/)([^"]*)"/g, '$1="../$2"')
          .replace(' class="active"', '')
          .replace('<a href="../blog.html">', '<a href="../blog.html" class="active">')
    : html.replace(' class="active"', '')
          .replace('<a href="blog.html">', '<a href="blog.html" class="active">'));
  const TICK_PHRASES = ['FREE ONLINE TOOLS', 'NO SIGN-UP', 'WORD COUNTER', 'SENTENCE CASE', 'YOUTUBE THUMBNAILS', 'TEXT TOOLS', '100% FREE', 'FAST &amp; PRIVATE'];
  const tickGroup = '<div class="ticker-group">' + TICK_PHRASES.map(function (p) { return '<span class="tick-item">' + p + '</span><span class="tick-dot">&#10022;</span>'; }).join('') + '</div>';
  const ticker = '<div class="ticker" aria-hidden="true"><div class="ticker-track">' + tickGroup + tickGroup + '</div></div>';
  return { header: fix(header), footer: fix(footer), ticker };
}

function head(o) {
  const P = (o.prefix !== undefined ? o.prefix : '../');
  const desc = esc(o.description || '');
  return '<meta charset="UTF-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '<title>' + esc(o.title) + '</title>\n' +
  '<meta name="description" content="' + desc + '">\n' +
  '<link rel="canonical" href="' + o.url + '">\n' +
  '<meta property="og:type" content="' + (o.type || 'website') + '">\n' +
  '<meta property="og:site_name" content="Ali Super Tools">\n' +
  '<meta property="og:title" content="' + esc(o.title) + '">\n' +
  '<meta property="og:description" content="' + desc + '">\n' +
  '<meta property="og:url" content="' + o.url + '">\n' +
  '<meta property="og:image" content="' + SITE + (o.image || '/assets/og-image.png') + '">\n' +
  '<meta name="twitter:card" content="summary_large_image">\n' +
  '<meta name="twitter:title" content="' + esc(o.title) + '">\n' +
  '<meta name="twitter:description" content="' + desc + '">\n' +
  '<meta name="twitter:image" content="' + SITE + (o.image || '/assets/og-image.png') + '">\n' +
  '<link rel="icon" href="' + P + 'assets/favicon.svg" type="image/svg+xml">\n' +
  '<link rel="icon" type="image/png" sizes="32x32" href="' + P + 'assets/favicon-32.png">\n' +
  '<link rel="apple-touch-icon" sizes="180x180" href="' + P + 'assets/apple-touch-icon.png">\n' +
  '<link rel="manifest" href="' + P + 'site.webmanifest">\n' +
  '<meta name="theme-color" content="#2563EB">\n' +
  '<meta name="robots" content="' + (o.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large') + '">\n' +
  '<link rel="alternate" type="application/rss+xml" title="Ali Super Tools Blog" href="' + SITE + '/rss.xml">\n' +
  '<script>(function(){try{var t=localStorage.getItem("ast-theme");if(!t&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="preconnect" href="https://googleads.g.doubleclick.net">\n' +
  '<link rel="dns-prefetch" href="https://googleads.g.doubleclick.net">\n' +
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">\n' +
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2">\n' +
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2">\n' +
  '<link rel="stylesheet" href="' + P + 'assets/style.css">\n' +
  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4856164099586969" crossorigin="anonymous"></script>\n' +
  (o.schema ? '<script type="application/ld+json">' + JSON.stringify(o.schema) + '</script>\n' : '');
}

function fmtDate(iso) {
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  return isNaN(d) ? String(iso).slice(0, 10) : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function readingTime(text) { return Math.max(1, Math.round(text.split(/\s+/).length / 200)); }

function articlePage(post, c) {
  const url = SITE + '/blog/' + post.slug + '.html';
  const bodyHtml = mdToHtml(post.body);
  const schema = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: post.meta.title, description: post.meta.description || '',
      image: SITE + (post.meta.image || '/assets/og-image.png'),
      datePublished: String(post.meta.date).slice(0, 10), dateModified: String(post.meta.date).slice(0, 10),
      author: { '@type': 'Organization', name: 'Ali Super Tools', url: SITE + '/' },
      publisher: { '@type': 'Organization', name: 'Ali Super Tools', url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/assets/icon-512.png' } },
      mainEntityOfPage: url },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog.html' },
      { '@type': 'ListItem', position: 3, name: post.meta.title, item: url } ] }
  ];
  const cover = post.meta.image ? '<img class="article-cover" src="' + safeUrl(post.meta.image) + '" alt="' + esc(post.meta.title) + '">' : '';
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + head({ title: post.meta.title + ' | Ali Super Tools', description: post.meta.description, url, type: 'article', image: post.meta.image, schema, prefix: '../', noindex: post.meta.noindex === true }) + '</head>\n<body>\n' +
  '<a class="skip-link" href="#main">Skip to content</a>\n' + c.header + '\n' + c.ticker + '\n' +
  AD_BANNER_468 + '<main id="main">\n<section class="section"><div class="container"><div class="article-wrap">\n' +
  '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a> &rsaquo; <a href="../blog.html">Blog</a> &rsaquo; <span>' + esc(post.meta.title) + '</span></nav>\n' +
  '<h1 class="article-title">' + esc(post.meta.title) + '</h1>\n' +
  '<p class="blog-meta"><span class="chip">' + esc(post.meta.category || 'General') + '</span> ' + fmtDate(post.meta.date) + ' &middot; ' + readingTime(post.body) + ' min read</p>\n' +
  cover + '\n<div class="article-body">\n' + bodyHtml + '\n</div>\n' +
  '<div class="article-cta"><h2>Try Our Free Online Tools</h2><p>Word counter, sentence case converter, comma separator, slug generator and more - free, private and no sign-up.</p><a class="btn btn-primary" href="../tools.html">Use Free Tools &#8594;</a></div>\n' +
  '</div></div></section>\n</main>\n' + AD_BANNER + c.footer + '\n<div class="toast" id="toast" role="status" aria-live="polite"></div>\n' +
  '<script src="../assets/main.js" defer></script>\n' + AD_SOCIAL + '</body>\n</html>\n';
}

function indexPage(posts, c) {
  const url = SITE + '/blog.html';
  const cards = posts.map(p =>
    '<article class="post-card">' +
    (p.meta.image ? '<a href="blog/' + p.slug + '.html"><img class="post-thumb" src="' + safeUrl(p.meta.image) + '" alt="' + esc(p.meta.title) + '" loading="lazy"></a>' : '') +
    '<p class="blog-meta"><span class="chip">' + esc(p.meta.category || 'General') + '</span> ' + fmtDate(p.meta.date) + '</p>' +
    '<h2 class="post-title"><a href="blog/' + p.slug + '.html">' + esc(p.meta.title) + '</a></h2>' +
    '<p class="post-excerpt">' + esc(p.meta.description || '') + '</p>' +
    '<a class="post-more" href="blog/' + p.slug + '.html">Read article &#8594;</a></article>'
  ).join('\n');
  const grid = posts.length ? '<div class="post-grid">' + cards + '</div>'
    : '<div class="post-card"><h2 class="post-title">Articles are coming soon</h2><p class="post-excerpt">We are preparing helpful guides about our free online tools. Please check back soon!</p></div>';
  const schema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog.html' } ] };
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + head({ title: 'Blog - Guides & Tips | Ali Super Tools', description: 'Guides, tips and updates from Ali Super Tools - learn how to write faster, fix text in seconds and get more from our free online tools.', url, schema, prefix: '', noindex: posts.every(p => p.meta.noindex === true) }) + '</head>\n<body>\n' +
  '<a class="skip-link" href="#main">Skip to content</a>\n' + c.header + '\n' + c.ticker + '\n' +
  AD_BANNER_468 + '<main id="main">\n<section class="page-hero"><div class="container"><h1>Blog</h1><p>Guides, tips and updates to help you write better and work faster with our free online tools.</p></div></section>\n' +
  '<section class="section"><div class="container">' + grid + '</div></section>\n</main>\n' + AD_BANNER + c.footer + '\n<div class="toast" id="toast" role="status" aria-live="polite"></div>\n' +
  '<script src="assets/main.js" defer></script>\n' + AD_SOCIAL + '</body>\n</html>\n';
}

/* ---------- main ---------- */
function main() {
  const cA = chrome('../');
  const cI = chrome('');
  let files = [];
  try { files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')); } catch (e) {}
  const posts = [];
  for (const f of files) {
    const parsed = parsePost(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'));
    if (!parsed || !parsed.meta.title || parsed.meta.draft === true) continue;
    posts.push({ slug: f.replace(/\.md$/, ''), meta: parsed.meta, body: parsed.body });
  }
  posts.sort((a, b) => String(b.meta.date).localeCompare(String(a.meta.date)));

  fs.mkdirSync(BLOG_DIR, { recursive: true });
  const wanted = new Set(posts.map(p => p.slug + '.html'));
  for (const f of fs.readdirSync(BLOG_DIR)) {
    if (f.endsWith('.html') && !wanted.has(f)) fs.unlinkSync(path.join(BLOG_DIR, f));
  }
  for (const p of posts) fs.writeFileSync(path.join(BLOG_DIR, p.slug + '.html'), articlePage(p, cA));
  fs.writeFileSync(path.join(ROOT, 'blog.html'), indexPage(posts, cI));

  /* rss */
  const items = posts.map(p => {
    const link = SITE + '/blog/' + p.slug + '.html';
    return '<item><title>' + esc(p.meta.title) + '</title><link>' + link + '</link><guid>' + link + '</guid>' +
      '<pubDate>' + new Date(String(p.meta.date).slice(0, 10) + 'T00:00:00Z').toUTCString() + '</pubDate>' +
      '<description>' + esc(p.meta.description || '') + '</description></item>';
  }).join('\n');
  fs.writeFileSync(path.join(ROOT, 'rss.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>Ali Super Tools Blog</title>\n<link>' + SITE + '/blog.html</link>\n' +
    '<description>Guides, tips and updates from Ali Super Tools.</description>\n' + items + '\n</channel></rss>\n');

  /* sitemap: keep non-blog entries, re-add fresh blog entries */
  const smPath = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smPath, 'utf8');
  sm = sm.replace(/<url>(?:(?!<\/url>)[\s\S])*?<loc>https:\/\/www\.hausamusics\.com\/(blog\.html|blog\/[^<]*)<\/loc>[\s\S]*?<\/url>\n?/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const indexable = posts.filter(p => p.meta.noindex !== true);
  let blogUrls = '';
  if (indexable.length) {
    const latest = indexable.map(p => String(p.meta.date).slice(0, 10)).sort().pop();
    blogUrls += '<url><loc>' + SITE + '/blog.html</loc><lastmod>' + latest + '</lastmod></url>\n';
  }
  for (const p of indexable) {
    blogUrls += '<url><loc>' + SITE + '/blog/' + p.slug + '.html</loc><lastmod>' + String(p.meta.date).slice(0, 10) + '</lastmod></url>\n';
  }
  sm = sm.replace('</urlset>', blogUrls + '</urlset>');
  fs.writeFileSync(smPath, sm);

  console.log('Blog built: ' + posts.length + ' post(s) -> blog.html, blog/, rss.xml, sitemap.xml');
}
main();
