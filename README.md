# InterviewCrack

Free, open-source interview practice, created by Sameer Bahad (https://www.linkedin.com/in/sameerbahad/) ([@product4u](https://github.com/product4u)). Explore a virtual interview room, practise answers, and learn how a browser-based React application works.

**[Open the website](https://product4u.github.io/interviewcrack-app/)** · **[Try the sample interview](https://product4u.github.io/interviewcrack-app/app/?preview=1)**

## Use it

1. Open the website and choose **Start my practice**. The sample interview requires no account or API key.
2. Practise with the sample questions, interviewer, and buddy hints. Allow microphone or camera access only if you want recording features.
3. For AI-generated questions and feedback, provide your own Gemini API key through the app. API availability, quotas, terms, and any charges belong to your Google account. This project does not provide free AI credits.
4. Review your practice and download anything you want to keep. Saved sessions belong to this browser/device; clearing browser storage can erase them.

AI answers and scores may be wrong. Use this as a practice aid, not an assessment of hiring readiness or a guarantee of employment.

## Privacy and API keys

There is no InterviewCrack account server. The app calls Google's Gemini API directly when you use AI features. Your prompts and submitted answer content are sent to Google for those requests. Browser speech services may process audio externally depending on your browser. GitHub hosts the website and external CDN resources may also receive ordinary web requests.

API keys are supplied by each user and stored in this tab session by default; users may choose persistent browser storage. Browser storage is not an encrypted secrets vault. Avoid shared devices, use a dedicated restricted key with appropriate quotas, and remove it after use. Never commit a real key, embed one in the build, or put it in a public issue. Recordings and session history are stored locally by the app; browser storage is not a backup. See [SECURITY.md](SECURITY.md).

## Run locally

Requires Node.js 22 and npm.

```sh
npm ci
npm start
```

Open the local address printed by the development server. This serves the React app. For the full landing page and app layout:

```sh
npm run build:pages
```

Serve the `pages` folder under `/interviewcrack-app/` to match the production URL, or change `homepage` in `package.json` to your deployment's app URL before building. The landing page is `pages/index.html`; the app is `pages/app/index.html`.

## Learn from the code

| Location | Purpose |
| --- | --- |
| `src/App.tsx` | Main practice flows and application state |
| `src/components/` | Interface, 3D room, recording, and results |
| `src/hooks/` | API key handling, AI generation, voice, and saved sessions |
| `src/utils/` | Parsing, question generation, scoring, and browser storage |
| `src/constants/` | Shared themes and experience copy |
| `src/landing.tsx`, `index.html` | Interactive public landing page |
| `scripts/` | Landing build and Pages artifact assembly |

```sh
npm test -- --watchAll=false --runInBand
npm run build:pages
```

## Deployment and maintenance

The GitHub Actions workflow tests and builds pushes to `main`, then publishes to GitHub Pages. Pull requests run the same checks without deploying. Repository Settings → Pages must use **GitHub Actions** as its source. No deployment API keys are required.

This is a community/portfolio project, maintained on a best-effort basis. Browser capabilities and external AI services can change; permanent availability is not promised. Static hosting does not fund AI usage. The project currently uses Create React App and the Google Generative AI SDK; contributors should assess dependency updates carefully.

## Contribute and reuse

Read [CONTRIBUTING.md](CONTRIBUTING.md). The MIT license permits learning, use, modification, and redistribution, including commercial use, provided the copyright and license notice are retained. Third-party libraries and assets remain subject to their own licenses. No endorsement by Google or GitHub is implied.
