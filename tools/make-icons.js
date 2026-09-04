// Generuje sadu ikon pro Expo (iOS, Android adaptivní, favicon, splash) z jednoho SVG návrhu.
// Spuštění: npm run icons  (vyžaduje globálně nainstalovaný playwright a Chromium, viz README)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });

const BG_DARK = '#0B0F1F';
const BG_MID = '#1B1F4E';
const ACCENT = '#7C5CFF';
const GOLD = '#FFD166';

// Stars are deterministic so re-running gives identical files.
function stars(seed, count, bounds) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = bounds.x + rnd() * bounds.w;
    const y = bounds.y + rnd() * bounds.h;
    const r = 1.5 + rnd() * 3.5;
    const o = 0.35 + rnd() * 0.6;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

// Gem drawn in its own 600x560 box, centred at (0,0) after translate. Crown (upper part) + pavilion (lower part).
function gem({ mono = false, glow = true } = {}) {
  const facets = mono
    ? {
        table: '#FFFFFF', crownL: '#FFFFFF', crownR: '#FFFFFF', crownEdgeL: '#FFFFFF', crownEdgeR: '#FFFFFF',
        pavL: '#FFFFFF', pavC: '#FFFFFF', pavR: '#FFFFFF', pavEdgeL: '#FFFFFF', pavEdgeR: '#FFFFFF',
      }
    : {
        table: '#D6F6FF', crownL: '#9BE5FF', crownR: '#6FCBFF', crownEdgeL: '#5FB9F7', crownEdgeR: '#3E9BEA',
        pavL: '#3F8CF5', pavC: '#5FA9FF', pavR: '#2A6BE0', pavEdgeL: '#2559C7', pavEdgeR: '#1B46A8',
      };
  const stroke = mono ? 'none' : 'rgba(255,255,255,0.35)';
  const edge = mono ? '' : `stroke="${stroke}" stroke-width="3" stroke-linejoin="round"`;
  return `
    ${glow && !mono ? `<ellipse cx="0" cy="20" rx="360" ry="330" fill="url(#glow)"/>` : ''}
    <g ${edge}>
      <!-- crown -->
      <polygon points="-150,-250 150,-250 300,-110 -300,-110" fill="${facets.table}"/>
      <polygon points="-300,-110 -150,-250 -90,-110" fill="${facets.crownEdgeL}"/>
      <polygon points="-150,-250 0,-110 -90,-110" fill="${facets.crownL}"/>
      <polygon points="-150,-250 150,-250 0,-110" fill="${facets.table}"/>
      <polygon points="150,-250 90,-110 0,-110" fill="${facets.crownR}"/>
      <polygon points="150,-250 300,-110 90,-110" fill="${facets.crownEdgeR}"/>
      <!-- pavilion -->
      <polygon points="-300,-110 -90,-110 0,280" fill="${facets.pavEdgeL}"/>
      <polygon points="-90,-110 0,-110 0,280" fill="${facets.pavL}"/>
      <polygon points="0,-110 90,-110 0,280" fill="${facets.pavC}"/>
      <polygon points="90,-110 300,-110 0,280" fill="${facets.pavEdgeR}"/>
      <!-- girdle line -->
      <line x1="-300" y1="-110" x2="300" y2="-110" stroke="${mono ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}" stroke-width="${mono ? 0 : 5}"/>
    </g>
    ${
      mono
        ? ''
        : `
      <!-- highlights -->
      <polygon points="-120,-235 -40,-235 -150,-130 -230,-130" fill="#fff" opacity="0.45"/>
      <polygon points="-60,-90 -10,-90 -20,120" fill="#fff" opacity="0.25"/>
      <!-- sparkles -->
      <g fill="${GOLD}">
        <path d="M 250 -300 l 12 34 l 34 12 l -34 12 l -12 34 l -12 -34 l -34 -12 l 34 -12 z"/>
        <path d="M -310 60 l 8 22 l 22 8 l -22 8 l -8 22 l -8 -22 l -22 -8 l 22 -8 z" opacity="0.9"/>
        <path d="M 200 200 l 6 16 l 16 6 l -16 6 l -6 16 l -6 -16 l -16 -6 l 16 -6 z" opacity="0.8"/>
      </g>`
    }
  `;
}

const defs = `
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%">
      <stop offset="0%" stop-color="${BG_MID}"/>
      <stop offset="100%" stop-color="${BG_DARK}"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="${ACCENT}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

function svg(size, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}${inner}</svg>`;
}

const background = `<rect width="1024" height="1024" fill="url(#bg)"/>${stars(7, 70, { x: 0, y: 0, w: 1024, h: 1024 })}`;

const variants = [
  // Hlavní ikona (iOS/obchody): neprůhledná, gem přes ~62 % plochy.
  { file: 'icon.png', size: 1024, transparent: false, body: `${background}<g transform="translate(512 530) scale(1.05)">${gem()}</g>` },
  // Android adaptivní: pozadí samostatně, popředí v bezpečné zóně (vnitřních 66 %).
  { file: 'android-icon-background.png', size: 1024, transparent: false, body: background },
  { file: 'android-icon-foreground.png', size: 1024, transparent: true, body: `<g transform="translate(512 528) scale(0.82)">${gem()}</g>` },
  { file: 'android-icon-monochrome.png', size: 1024, transparent: true, body: `<g transform="translate(512 528) scale(0.82)">${gem({ mono: true })}</g>` },
  // Splash: průhledné logo, Expo ho zmenší na ~200 px.
  { file: 'splash-icon.png', size: 1024, transparent: true, body: `<g transform="translate(512 528) scale(1.0)">${gem()}</g>` },
  // Favicon: menší rozměr, bez hvězd (na 32 px by jen šuměly).
  { file: 'favicon.png', size: 196, transparent: false, body: `<rect width="1024" height="1024" rx="200" fill="url(#bg)"/><g transform="translate(512 530) scale(1.15)">${gem({ glow: false })}</g>` },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  for (const v of variants) {
    await page.setViewportSize({ width: v.size, height: v.size });
    const html = `<html><body style="margin:0;background:${v.transparent ? 'transparent' : BG_DARK}">${svg(v.size, v.body)}</body></html>`;
    await page.setContent(html);
    await page.screenshot({ path: path.join(outDir, v.file), omitBackground: v.transparent, clip: { x: 0, y: 0, width: v.size, height: v.size } });
    console.log('wrote', v.file);
  }
  // Náhledový list pro kontrolu.
  const preview = `<html><body style="margin:0;background:#333;display:flex;flex-wrap:wrap;gap:16px;padding:16px;align-items:center">
    ${variants.map((v) => `<div style="text-align:center;color:#fff;font:12px sans-serif"><img src="${v.file}" style="width:180px;height:180px;background:${v.transparent ? 'repeating-conic-gradient(#666 0 25%,#999 0 50%) 0 0/20px 20px' : 'none'};border-radius:${v.file === 'icon.png' ? '40px' : '0'}"/><br>${v.file}</div>`).join('')}
    <div style="text-align:center;color:#fff;font:12px sans-serif"><div style="width:180px;height:180px;border-radius:50%;overflow:hidden;position:relative"><img src="android-icon-background.png" style="position:absolute;inset:0;width:100%;height:100%"/><img src="android-icon-foreground.png" style="position:absolute;inset:0;width:100%;height:100%"/></div><br>adaptive (circle mask)</div>
    <div style="text-align:center;color:#fff;font:12px sans-serif"><img src="favicon.png" style="width:32px;height:32px"/><br>favicon 32px</div>
  </body></html>`;
  fs.writeFileSync(path.join(outDir, 'preview.html'), preview);
  await page.setViewportSize({ width: 1100, height: 500 });
  await page.goto('file://' + path.join(outDir, 'preview.html'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'preview.png'), fullPage: true });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
