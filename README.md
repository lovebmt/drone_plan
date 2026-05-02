# UAV Manufacturing Complex Slides

Project slide web duoc dung bang Slidev, toi uu cho pitch deck / landing-page presentation va co the export PDF.

## Chay local

```bash
npm install
npm run dev
```

Slide mac dinh doc noi dung tu `slides.md`.

## Build web

```bash
npm run build
```

Ban build se nam trong thu muc `dist/`.

## GitHub Pages

Project da duoc cau hinh de deploy len GitHub Pages voi repo `drone_plan`.

```bash
npm run build:pages
```

Output GitHub Pages nam trong `dist-pages/`.

Trong GitHub repo:

1. Vao `Settings > Pages`
2. O `Build and deployment`, chon `GitHub Actions`
3. Push len branch `main`

Workflow `.github/workflows/deploy-pages.yml` se tu build va deploy site len GitHub Pages.

## Export PDF

Neu may da co Google Chrome trong `/Applications`, dung:

```bash
npx slidev export --output dist/UAV-Manufacturing-Complex.pdf --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ban PDF da duoc export san tai `dist/UAV-Manufacturing-Complex.pdf`.

## File chinh

- `content.md`: noi dung goc
- `slides.md`: slide deck da bien tap lai cho nhac pitch deck
- `styles/index.css`: theme custom theo huong drone / aerospace / landing page
