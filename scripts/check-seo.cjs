// Validate the deployable artifact, not just the source templates.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../pages');
const base = 'https://product4u.github.io/interviewcrack-app';
const origin = new URL(base).origin;
const prefix = new URL(base).pathname + '/';
const artifactPath = url => {
  assert.equal(url.origin, origin, 'Unexpected site origin');
  assert(url.pathname.startsWith(prefix), `Link outside project path: ${url}`);
  return decodeURIComponent(url.pathname.slice(prefix.length));
};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert(urls.length >= 7, 'Sitemap must contain the homepage, app, KBC, and guides');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
assert(read('robots.txt').includes(`Sitemap: ${base}/sitemap.xml`));
assert(!/^Disallow:\s*\//m.test(read('robots.txt')), 'Public crawlers unexpectedly blocked');
assert(!fs.existsSync(path.join(root, 'CNAME')), 'Project site must not set a custom domain');
const titles = new Set();
for (const address of urls) {
  const url = new URL(address);
  assert.equal(url.origin, origin, 'Unexpected sitemap origin');
  const file = artifactPath(url) + (url.pathname.endsWith('/') ? 'index.html' : '');
  const html = read(file);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title && !titles.has(title), `Missing or duplicate title: ${file}`);
  titles.add(title);
  assert(/<meta\s+name="description"\s+content="[^"]+"/s.test(html), `Description missing: ${file}`);
  assert(html.includes(`rel="canonical" href="${address}"`), `Canonical mismatch: ${file}`);
  assert(!/name="robots"[^>]*noindex/i.test(html), `Unexpected noindex: ${file}`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(match[1]);
    assert.equal(data['@context'], 'https://schema.org');
  }
  if (file.startsWith('guides/')) {
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `Guide needs one h1: ${file}`);
    assert(html.includes('application/ld+json'), `Guide schema missing: ${file}`);
  }
  // Check every locally hosted linked page and asset, including the React bundles.
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = new URL(match[1].replace(/&amp;/g, '&'), address);
    if (target.origin !== origin) continue;
    const relative = artifactPath(target);
    let disk = path.resolve(root, relative);
    assert(disk.startsWith(root + path.sep) || disk === root, 'Link leaves artifact');
    assert(fs.existsSync(disk), `Broken link in ${file}: ${match[1]}`);
    if (fs.statSync(disk).isDirectory()) disk = path.join(disk, 'index.html');
    assert(fs.existsSync(disk), `Missing directory index: ${match[1]}`);
  }
}
assert(read('index.html').includes('AI mock interviews and practice at your pace'));
assert(!read('index.html').includes('https://interviewcrack.com'), 'Old homepage origin');
assert(read('app/index.html').includes('/interviewcrack-app/app/static/'), 'App assets must use the project prefix');
console.log(`SEO checks passed: ${urls.length} published URLs, metadata, JSON-LD, crawler files, and local links.`);
