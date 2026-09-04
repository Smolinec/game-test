// Generuje screenshoty pro App Store a Google Play z webového buildu hry.
//
// 1. npm run web:export            (vytvoří dist/)
// 2. node tools/make-store-shots.js dist store/screenshots
//
// Vyžaduje globálně nainstalovaný Playwright s Chromiem (viz README, sekce Ikony).
// Pro každou platformu a jazyk vznikne pět orámovaných obrázků s titulkem
// a pod nimi „raw“ verze bez rámu.
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const distDir = path.resolve(process.argv[2] || 'dist');
const outDir = path.resolve(process.argv[3] || 'store/screenshots');

// Rozměry požadované obchody (šířka × výška v px).
const TARGETS = {
  ios: { width: 1290, height: 2796, label: 'iPhone 6.7"' },
  android: { width: 1080, height: 2340, label: 'Android' },
};

// Bohaté uložení, aby bylo na obrazovkách co ukázat.
const SAVE = {
  version: 6,
  crystals: 4.2e6,
  runCrystals: 2.6e7,
  allTimeCrystals: 9.1e8,
  generators: { drone: 120, drill: 75, refinery: 40, freighter: 25, asteroid: 12, station: 6, quantum: 2 },
  upgrades: ['gloves', 'laser_pick', 'drone_I', 'drone_II', 'drill_I', 'refinery_I', 'logistics'],
  entitlements: [],
  stardust: 14,
  stardustEarned: 22,
  stardustUpgrades: { quick_start: 1, stronger_click: 1 },
  achievements: ['clicks_100', 'clicks_1k', 'crystals_1k', 'crystals_1m', 'gens_10', 'gens_100', 'types_5', 'prestige_1', 'upgrades_10', 'stardust_10', 'time_1h'],
  daily: { lastClaimedAt: Date.now(), streak: 3 },
  boostSecondsLeft: 0,
  boostAdCooldownUntil: 0,
  adsWatched: 4,
  galaxies: 0,
  prestigeCount: 2,
  clicks: 3200,
  lastSeenAt: Date.now(),
  startedAt: Date.now() - 86400000 * 5,
  playTimeSeconds: 14000,
};

const SHOTS = {
  cs: [
    { key: 'mine', tab: /Těžba/, title: 'Vybuduj vesmírnou kolonii', subtitle: 'Klepej, těž krystaly a kupuj drony, lodě i černé díry.' },
    { key: 'upgrades', tab: /Vylepšení/, title: 'Desítky vylepšení', subtitle: 'Každé zařízení má čtyři stupně, klepnutí sílí s tebou.' },
    { key: 'prestige', tab: /Prestiž/, title: 'Prestiž a hvězdný prach', subtitle: 'Začni znovu silnější a utrať prach za trvalá vylepšení.' },
    { key: 'shop', tab: /Obchod/, title: 'Hraj svým tempem', subtitle: 'Kolonie těží, i když hru zavřeš. Boosty jen když chceš.' },
    { key: 'info', tab: /Info/, title: '28 úspěchů a denní odměny', subtitle: 'Každý úspěch trvale zrychlí těžbu.' },
  ],
  en: [
    { key: 'mine', tab: /Mine/, title: 'Build a space colony', subtitle: 'Tap, mine crystals and buy drones, freighters and black holes.' },
    { key: 'upgrades', tab: /Upgrades/, title: 'Dozens of upgrades', subtitle: 'Every device has four tiers and your tap grows with you.' },
    { key: 'prestige', tab: /Prestige/, title: 'Prestige and stardust', subtitle: 'Start over stronger and spend stardust on permanent perks.' },
    { key: 'shop', tab: /Shop/, title: 'Play at your own pace', subtitle: 'The colony mines while the app is closed. Boosts only if you want them.' },
    { key: 'info', tab: /Info/, title: '28 achievements and daily rewards', subtitle: 'Every achievement permanently speeds up mining.' },
  ],
};

function serve(root) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.wav': 'audio/wav', '.ico': 'image/x-icon', '.json': 'application/json' };
  return http.createServer((req, res) => {
    let p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) p = path.join(root, 'index.html');
    res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream');
    fs.createReadStream(p).pipe(res);
  });
}

function frameHtml({ width, height, title, subtitle, image }) {
  const pad = Math.round(width * 0.07);
  const titleSize = Math.round(width * 0.075);
  const subSize = Math.round(width * 0.036);
  return `<html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}
    body{background:radial-gradient(120% 70% at 50% 0%,#2A2F6B 0%,#0B0F1F 60%,#05070F 100%);font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#EEF1FF}
    .text{position:absolute;left:${pad}px;right:${pad}px;top:${pad * 1.4}px;text-align:center}
    h1{margin:0;font-size:${titleSize}px;font-weight:800;line-height:1.1;letter-spacing:-0.5px}
    p{margin:${Math.round(subSize * 0.6)}px 0 0;font-size:${subSize}px;color:#B8BFE0;line-height:1.35}
    .phone{position:absolute;left:50%;transform:translateX(-50%);bottom:-${Math.round(height * 0.06)}px;width:${Math.round(width * 0.84)}px;border-radius:${Math.round(width * 0.09)}px;border:${Math.round(width * 0.012)}px solid #1C2440;box-shadow:0 40px 120px rgba(0,0,0,0.6),0 0 0 2px #2A345A;overflow:hidden;background:#0B0F1F}
    .phone img{display:block;width:100%}
    .glow{position:absolute;left:50%;top:38%;width:${Math.round(width * 0.9)}px;height:${Math.round(width * 0.9)}px;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(124,92,255,0.35) 0%,rgba(124,92,255,0) 60%);}
  </style></head><body>
    <div class="glow"></div>
    <div class="text"><h1>${title}</h1><p>${subtitle}</p></div>
    <div class="phone"><img src="${image}"></div>
  </body></html>`;
}

(async () => {
  const server = serve(distDir);
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });

  for (const [platform, target] of Object.entries(TARGETS)) {
    for (const [lang, shots] of Object.entries(SHOTS)) {
      const dir = path.join(outDir, platform, lang);
      fs.mkdirSync(path.join(dir, 'raw'), { recursive: true });
      // Obrazovka telefonu: 390 pt široká, škálovaná tak, aby raw screenshot měl cílovou šířku.
      const scale = target.width / 390;
      const page = await browser.newPage({
        viewport: { width: 390, height: Math.round(target.height / scale) },
        deviceScaleFactor: scale,
        hasTouch: true,
        isMobile: true,
        locale: lang === 'cs' ? 'cs-CZ' : 'en-US',
      });
      await page.addInitScript(
        ({ save, language }) => {
          localStorage.setItem('hvezdny-dul.save', JSON.stringify(save));
          localStorage.setItem('hvezdny-dul.settings', JSON.stringify({ language, haptics: true, animations: false, sound: false }));
        },
        { save: SAVE, language: lang },
      );
      await page.goto(url);
      await page.waitForTimeout(1500);
      // Zavřít případné dialogy (denní odměna je už vyzvednutá, offline se nezobrazí).
      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i];
        await page.getByRole('tab', { name: shot.tab }).click();
        await page.waitForTimeout(500);
        const rawPath = path.join(dir, 'raw', `${i + 1}-${shot.key}.png`);
        await page.screenshot({ path: rawPath });
        const framed = await browser.newPage({ viewport: { width: target.width, height: target.height }, deviceScaleFactor: 1 });
        const image = 'data:image/png;base64,' + fs.readFileSync(rawPath).toString('base64');
        await framed.setContent(frameHtml({ width: target.width, height: target.height, title: shot.title, subtitle: shot.subtitle, image }));
        await framed.waitForTimeout(200);
        await framed.screenshot({ path: path.join(dir, `${i + 1}-${shot.key}.png`) });
        await framed.close();
        console.log('wrote', platform, lang, shot.key);
      }
      await page.close();
    }
  }
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
