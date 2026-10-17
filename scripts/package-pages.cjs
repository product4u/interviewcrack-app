const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'pages');
fs.mkdirSync(out, { recursive: true });
// A previous custom-domain build must not redirect the project site.
fs.rmSync(path.join(out, 'CNAME'), { force: true });
fs.cpSync(path.join(root, 'build'), path.join(out, 'app'), { recursive: true });
for (const item of ['index.html', 'kbc-practice.html', 'images', 'landing-assets', 'guides', 'robots.txt', 'sitemap.xml', 'llms.txt', 'google9623cb27f35849ed.html']) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('GitHub Pages artifact ready in pages/');
