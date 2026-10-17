# Search and AI discovery

The canonical production origin is https://interviewcrack.com. The homepage and guides are static HTML; the React app is served at `/app/`. Run `npm run build:pages` to build and validate the full artifact. The GitHub Pages workflow publishes `pages/`, including root crawler files. `npm run check:seo` validates an existing artifact.

## One-time owner steps

1. In GitHub repository Settings → Pages, confirm GitHub Actions is the publishing source, the custom domain is `interviewcrack.com`, and HTTPS is enforced. Keep the current working DNS records. If the custom domain is not already connected to this repository, follow GitHub's domain setup instructions before deploying this domain-specific build.
2. Open https://search.google.com/search-console and add the Domain property `interviewcrack.com`. Copy Google's unique TXT verification value into your domain DNS, then select Verify. Alternatively use a URL-prefix property and the exact HTML verification file Google supplies; include that file in the root deployment artifact. Never invent a verification token.
3. Submit `https://interviewcrack.com/sitemap.xml` in Search Console → Sitemaps.
4. Use URL Inspection on the homepage and each guide. Run Test live URL, check rendered content and the selected canonical, and request indexing where available. Submission does not guarantee indexing or a deadline.
5. Add the site to https://www.bing.com/webmasters/ and import the verified Search Console property or complete its verification. Submit the same sitemap.
6. Check https://interviewcrack.com/robots.txt and the sitemap after deployment. Search crawlers must be able to fetch the site without login or a challenge. If you use a CDN/firewall, check its crawler rules too.
7. Optionally validate the homepage with Google's Rich Results Test and the Schema.org validator. WebSite, Article, and SoftwareApplication descriptions are included, but rich results are not guaranteed. No invented reviews, ratings, or aggregate scores are supplied.
8. Review Search Console indexing and search performance regularly. If you want visitor/referral analytics, choose an analytics provider and configure your own property. No tracking ID or third-party tracking script has been added. Check mobile performance using PageSpeed Insights after deployment; the guides load no JavaScript or 3D bundle.

## Content maintenance

Add useful, original guides based on actual user questions. Link them from the guide index and relevant pages, add canonical URLs to the sitemap, and update article modification dates only when the content changes. Explain product limitations and key requirements accurately. Share useful guides in relevant communities where welcome; avoid purchased links or repetitive promotional posts.

`robots.txt` allows search access, including OAI-SearchBot, Claude-SearchBot, and Claude-User. It preserves general crawler access; training preferences are a separate owner decision. The optional `llms.txt` is an aid, not a guaranteed discovery or ranking mechanism. No submission makes a model learn the site or guarantees it will cite it.

## Official references

- Google SEO: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google AI search: https://developers.google.com/search/docs/appearance/ai-features
- OpenAI crawlers: https://developers.openai.com/api/docs/bots
- Anthropic crawlers: https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- GitHub custom domains: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
