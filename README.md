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

## Add new images

Place image files in one of these folders:

```text
assets/images/hero/
assets/images/city/
assets/images/still-life/
```

Then edit `data/works.json` and add an item to the matching `images` array:

```json
{
  "path": "assets/images/city/new-image.png",
  "title": "New Image Title",
  "alt": "Short meaningful description of the artwork."
}
```

## Update weekly images

1. Add the new image files to `assets/images/city/` or `assets/images/still-life/`.
2. Add or remove image entries in `data/works.json`.
3. Keep alt text specific and descriptive.
4. Replace `assets/images/hero/confetti-life-hero.png` when the hero image changes.

The Home works preview and the Works page both read from `data/works.json`.

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
