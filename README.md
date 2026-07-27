# seori.studio

Minimal responsive artist portfolio website for Lee Seori and the ongoing project, Confetti Life.

Production URL:

```text
https://seori.studio
```

## Run locally

Because the Works section loads `data/works.json`, run a small local server instead of opening `index.html` directly.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Site structure

```text
index.html
about.html
works.html
styles.css
script.js
data/works.json
assets/images/
```

## Update weekly Works

Use the semi-automatic updater when adding one weekly row of Works collections.
The script uses ZIP files, keeps each collection detail page in image order
`1, 2, 3...`, and uses image `1` as the collection cover.

Start from the example manifest:

```bash
cp tools/weekly-works.example.json tools/weekly-works.json
```

Edit `tools/weekly-works.json` and replace the four `zip` paths with the new
weekly ZIP files. For city-style titles, commas in the input are normalized to
an em dash in the site display, so `Bergen, After the Rain` becomes
`Bergen — After the Rain`. Add the items in the exact homepage display order:
item 1 appears at the left as the newest work, followed by items 2, 3, and 4.
Keep `"displayOrder": "normal"` for this workflow.

Preview the changes without writing files:

```bash
python3 tools/update_weekly_works.py tools/weekly-works.json
```

When the dry run looks correct, apply the update:

```bash
python3 tools/update_weekly_works.py tools/weekly-works.json --apply
```

The updater will:

- copy original images into `assets/images/<collection-id>/`
- create thumbnail JPGs in `assets/images/thumbs/<collection-id>/`
- prepend the new collections to `data/works.json`
- bump the Works JSON cache key in `script.js`
- title-case collection names, for example `Lucca — The slow yellow afternoon`
  becomes `Lucca — The Slow Yellow Afternoon`

Then preview locally:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`, review the site, then publish only after the
preview is approved.

The Home selected works and the Works page both read from `data/works.json`.

## Deploy

This is a static site, so it can be deployed to GitHub Pages, Vercel, Netlify, or Cloudflare Pages.

- Build command: none
- Output directory: project root
- Required backend: none

To keep the site accessible after the local computer is turned off, deploy it to one of these hosting services. A local `python3 -m http.server` preview only works while this computer is awake and connected.

## Custom domain

After deployment, add `seori.studio` in the hosting provider dashboard and enable HTTPS.

Important: `seori.studio` must be connected at the domain registrar or DNS provider before it will open in a browser.

### GitHub Pages

The `CNAME` file is already set to:

```text
seori.studio
```

In the DNS provider, add the records required by GitHub Pages for the custom domain, then turn on "Enforce HTTPS" in repository Pages settings.

### Vercel

Import the repository, set the framework preset to "Other", and keep:

```text
Build command: none
Output directory: .
```

Then add `seori.studio` under Project Settings > Domains and follow Vercel's DNS instructions. `vercel.json` contains the security headers.

### Netlify or Cloudflare Pages

Deploy the project root as a static site, then add `seori.studio` in the domain settings. `_headers` contains the security headers for hosts that support it.

## Security notes

The site has no forms, login, database, analytics, or third-party scripts. `_headers` and `vercel.json` include a basic security policy.
