# Search and AI discovery

The canonical site is https://product4u.github.io/interviewcrack-app/. The homepage and guides are static HTML; the React app is served at `/interviewcrack-app/app/`. Run `npm run build:pages` to build and validate the complete artifact. GitHub Actions publishes `pages/`. `npm run check:seo` validates an existing artifact, including project-prefixed URLs and app bundles. No custom domain or CNAME is used.

## One-time owner steps

1. Changes pushed to `main` trigger the publishing workflow. In repository Settings → Pages, confirm GitHub Actions is the source and the custom-domain field is empty. Check that the deployment workflow succeeds.
2. Open https://search.google.com/search-console and add the **URL-prefix** property `https://product4u.github.io/interviewcrack-app/`. Do not choose Domain verification: you do not control github.io DNS. Select HTML tag verification and paste Google's exact `google-site-verification` meta tag into the root `index.html` head. Commit and deploy it, then click Verify. Keep the tag afterward. Alternatively use Google's HTML verification file and explicitly include it in `scripts/package-pages.cjs` so it reaches the published root of this project.
3. Submit `https://product4u.github.io/interviewcrack-app/sitemap.xml` in Search Console → Sitemaps.
4. Use URL Inspection on the homepage and each guide. Test the live URL, check the rendered content and selected canonical, and request indexing where available. Submission does not guarantee indexing or a deadline.
5. Add the site to https://www.bing.com/webmasters/ and import the verified Search Console property, or complete its verification. Submit the same sitemap.
6. Check the host-level crawler policy at `https://product4u.github.io/robots.txt`. A file at `/interviewcrack-app/robots.txt` does NOT control crawling. If you manage the `product4u/product4u.github.io` user-site repository, publish or merge the supplied robots.txt rules at that site's root, preserving rules for other projects. If there is no host-root robots.txt and it returns 404, the missing file does not itself prohibit crawling. Submit the sitemap directly regardless. Do not replace another site's existing crawler policy blindly.
7. Optionally validate the homepage with Google's Rich Results Test and the Schema.org validator. WebSite, Article, and SoftwareApplication descriptions are included; rich results are not guaranteed. No invented reviews or ratings are supplied.
8. Review Search Console indexing and search performance regularly. If you want visitor/referral analytics, choose a provider and configure your own property. No tracking ID or tracking script has been added. Check mobile performance with PageSpeed Insights after deployment; the guides load no JavaScript or 3D bundle.

## Content maintenance

Add useful, original guides based on actual user questions. Link them from the guide index and relevant pages, add canonical URLs to the sitemap, and update modification dates when content changes. Explain product limitations and key requirements accurately. Share useful guides in relevant communities where welcome; avoid purchased links or repetitive promotional posts.

The robots.txt template allows search access, including OAI-SearchBot, Claude-SearchBot, and Claude-User, when installed at the host root. Training preferences are a separate owner decision. The optional project-level llms.txt is a reference aid with no guaranteed automatic discovery or ranking effect. No submission makes a model learn the site or guarantees citations.

The separately hosted interviewcrack.com is not changed by this deployment. If you later retire its duplicate content, configure redirects at that host only after confirming the intended migration.

## Official references

- Google SEO: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google verification: https://support.google.com/webmasters/answer/9008080
- Robots.txt location: https://developers.google.com/crawling/docs/robots-txt/create-robots-txt
- Google AI search: https://developers.google.com/search/docs/appearance/ai-features
- OpenAI crawlers: https://developers.openai.com/api/docs/bots
- Anthropic crawlers: https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
