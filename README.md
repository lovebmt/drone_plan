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

## Cach tao anh map o slide 3

Slide 3 (`Factory Master Plan`) dang dung 2 file PNG da bake san:

- `public/images/osm-south-vietnam-baked.png`
- `public/images/osm-asean-baked.png`

Hai file nay khong duoc tao boi `scripts/render-images.mjs`. Script do chi build Slidev va chup screenshot tung slide sau khi deck da render xong.

Pipeline tao map trong repo hien tai nhu sau:

1. Chuan bi base map dang raster, kich thuoc `2400 x 1800`
   - South Vietnam: `osm-south-vietnam-raw.png` -> `osm-south-vietnam-clean.png`
   - ASEAN: `osm-asean-clean.png` -> `osm-asean-wide-clean.png`
2. Dat base map vao SVG de ve annotation
   - `osm-south-vietnam-annotated.svg` nhung `osm-south-vietnam-clean.png` bang the `<image .../>`
   - `osm-asean-annotated.svg` nhung `osm-asean-wide-clean.png` bang the `<image .../>`
3. Ve phan overlay ngay trong SVG
   - vung highlight
   - cac route net dut
   - marker / circle
   - label box, title card, note card
   - gradient, shadow, glow
4. Export SVG da annotate thanh PNG cuoi cung
   - `osm-south-vietnam-baked.png`
   - `osm-asean-baked.png`
5. `slides.md` nhung truc tiep 2 file baked PNG do vao slide 3

Ghi chu:

- `public/images/osm-south-vietnam-annotated.png` co ve la file export trung gian, hien khong duoc `slides.md` su dung.
- Trong repo khong thay script tu dong bake rieng cho 2 map nay. Nghia la buoc `annotated.svg` -> `baked.png` dang la mot buoc export thu cong bang editor / renderer SVG ben ngoai roi commit file PNG vao repo.

Neu can sua lai map:

1. Sua base PNG neu can lam sach / crop lai ban do.
2. Sua file `*-annotated.svg` de doi label, marker, route, card.
3. Export lai SVG thanh PNG `2400 x 1800` va ghi de file `*-baked.png`.
4. Neu muon cap nhat anh render tung slide hoac PDF, chay them:

```bash
npm run render:images
npm run export:rendered
```
