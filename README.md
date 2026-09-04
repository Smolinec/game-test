# Hvězdný důl 💎

Idle / clicker hra pro iOS a Android postavená na [Expo](https://expo.dev) (React Native + TypeScript).
Klepáním těžíš krystaly, kupuješ zařízení, která těží sama (i když hru zavřeš), odemykáš vylepšení
a přes prestiž získáváš hvězdný prach s trvalým bonusem.

## Co hra umí

- **Klepání** – ruční těžba s animací, plovoucími čísly a haptickou odezvou.
- **13 generátorů** – od těžebního dronu po multiverzální důl, cena roste geometricky (×1,15 za kus).
- **Hromadný nákup** – ×1 / ×10 / ×100 / MAX.
- **61 vylepšení** – násobiče generátorů (při 10/25/50/100 kusech), vylepšení klepnutí, globální bonusy,
  „synchronizace“ (klepnutí přidává % produkce).
- **Prestiž** – hvězdný prach = ⌊√(krystaly v běhu / 10 M)⌋, každý neutracený kus +10 % k produkci.
- **Galaxie** – druhá vrstva prestiže: za 1 000 neutraceného prachu reset včetně hvězdných vylepšení, výměnou
  za trvalé ×3 produkce a +100 % zisku prachu za každou galaxii.
- **Hvězdná vylepšení** – prach jde utratit za trvalá vylepšení (rychlý start po prestiži, levnější zařízení,
  silnější klepnutí, efektivnější offline, Zlatá žíla, katalyzátor). Utracený prach přestane dávat pasivní bonus.
- **Odměněná videa (testovací režim)** – ×2 produkce na hodinu (cooldown 4 h) a zdvojnásobení offline výdělku.
  Místo reklamy běží odpočet; skutečný AdMob se napojí přes stejné rozhraní v `src/services/ads.ts`.
- **Denní odměna** – 7denní řada (10 až 180 minut produkce, 7. den hvězdný prach), počítá se podle místního dne.
- **Úspěchy** – 28 úspěchů za klepání, těžbu, zařízení, prestiže a čas; každý dává trvale +1 % produkce.
- **Offline postup** – po návratu dostaneš 50 % produkce za dobu nepřítomnosti, max 8 h, s přehledným dialogem.
- **Automatické ukládání** – každých 10 s a při přechodu aplikace do pozadí (AsyncStorage).
- **Obchod v testovacím režimu** – balíčky hvězdného prachu, časový skok a trvalé nároky (Dvojitý výkon,
  Noční směna). Nákupy se zatím jen simulují, efekt se ale ve hře projeví.
- **Účet (již brzy)** – tlačítka pro přihlášení přes Apple a Google jsou připravená, ale zatím nejsou napojená.
- **Zvuky** – šest syntetizovaných efektů (klepnutí, nákup, vylepšení, prestiž, Zlatá žíla, úspěch) bez licence,
  generované skriptem `tools/make-sounds.py`; vypínají se v nastavení.
- **Nastavení** – jazyk (čeština / angličtina podle jazyka zařízení), vibrace, animace, zvuky. Texty rozhraní
  jsou v `src/i18n/strings.ts`, anglické názvy herních dat v `src/i18n/data.ts`.
- **Statistiky** a možnost smazat postup.

## Spuštění

```bash
npm install
npm start
```

Pak naskenuj QR kód aplikací **Expo Go** (iOS: App Store, Android: Google Play). Hra běží na obou
platformách bez nutnosti nativního buildu.

Další příkazy:

| Příkaz              | Co dělá                                   |
| ------------------- | ----------------------------------------- |
| `npm run android`   | spustí v Android emulátoru / zařízení      |
| `npm run ios`       | spustí v iOS simulátoru (jen na macOS)     |
| `npm run web`       | spustí webovou verzi v prohlížeči          |
| `npm run web:export`| statický webový build do složky `dist/`    |
| `npm test`          | jednotkové testy herního enginu (Jest)     |
| `npm run typecheck` | kontrola typů (`tsc --noEmit`)             |
| `npm run icons`     | přegeneruje ikony v `assets/` z SVG návrhu |
| `npm run sounds`    | přegeneruje zvuky v `assets/sounds/` (Python 3) |

## Webová verze na vyzkoušení

- **Lokálně:** `npm run web` otevře hru v prohlížeči (React Native Web). Postup se ukládá do `localStorage`.
- **Statický build:** `npm run web:export` vytvoří `dist/`, který jde nahrát na libovolný statický hosting.
- **GitHub Pages:** workflow `.github/workflows/web.yml` po každém pushi do `main` sestaví web a nasadí ho
  na Pages. V nastavení repozitáře (Settings → Pages) je potřeba jednou zvolit zdroj **GitHub Actions**.
  Hra pak poběží na `https://<uživatel>.github.io/game-test/`.

## Sestavení do obchodů

Nejjednodušší cesta je [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build --platform android   # .aab pro Google Play (nebo --profile preview pro .apk)
eas build --platform ios       # .ipa pro App Store (vyžaduje Apple Developer účet)
```

Identifikátory aplikace jsou v `app.json` (`ios.bundleIdentifier`, `android.package`) – před publikováním
je uprav podle svého účtu.

## Ikony

Všechny ikony v `assets/` (ikona aplikace, adaptivní ikona pro Android včetně monochromatické varianty,
splash a favicon) se generují z jednoho SVG návrhu v `tools/make-icons.js`. Barvy a tvar krystalu uprav tam
a spusť `npm run icons`. Skript vykresluje SVG přes Playwright, takže potřebuje:

```bash
npm install -g playwright
npx playwright install chromium
```

## Struktura projektu

```
App.tsx                 kořenová komponenta, záložky, načítání
src/engine/             čistý TypeScript bez React Native – testovatelné jádro hry
  types.ts              datové typy
  data.ts               definice generátorů, vylepšení a herních konstant (balanc)
  engine.ts             výpočty produkce, cen, nákupy, prestiž, offline postup
  format.ts             formátování čísel (1,5K, 2,3M…) a času
  save.ts               serializace a bezpečné načtení uložených dat
  storage.ts            napojení na AsyncStorage
  stardust.ts           definice hvězdných vylepšení (za prach)
  achievements.ts       definice úspěchů, kontrola a bonus
  daily.ts              denní odměna a řada
  ads.ts                herní efekty odměněných videí (boost, zdvojnásobení offline)
src/services/ads.ts     vrstva pro reklamy; dnes MockRewardedAdProvider, později AdMob
src/services/sound.ts   přehrávání efektů přes expo-audio
tools/make-sounds.py    generátor zvukových efektů
  migrations.ts         verze formátu uložení a migrační kroky
  signing.ts            podpis uložení (SHA-256 v čistém JS)
  shop.ts               definice placených položek a aplikace jejich efektu
src/services/purchases.ts vrstva pro nákupy; dnes MockPurchaseProvider, později RevenueCat
src/i18n/               překlady (cs/en), nastavení a jejich ukládání
src/hooks/useGame.ts    herní smyčka (tick 100 ms), autosave, offline detekce, nákupy
src/ui/                 obrazovky a komponenty (Těžba, Vylepšení, Prestiž, Info)
tools/make-icons.js     generátor ikon
.github/workflows/      nasazení webové verze na GitHub Pages
__tests__/              Jest testy enginu
```

## Ochrana uložení

Uložený stav je zabalený do obálky s podpisem SHA-256 (`src/engine/signing.ts`). Ručně upravené uložení
se nenačte a hra začne znovu. Starší nepodepsaná uložení se ještě načtou a při dalším uložení dostanou podpis.
Tajný řetězec je součástí aplikace, takže jde o ochranu proti běžné manipulaci, ne o bezpečnost; nároky z nákupů
se po napojení musí ověřovat na serveru.

## Napojení plateb a přihlášení

- **Nákupy:** `src/services/purchases.ts` exportuje `purchaseProvider`. Dnes je to `MockPurchaseProvider`
  (nic se neúčtuje, obchod to hlásí). Skutečný poskytovatel (např. RevenueCat) implementuje stejné rozhraní
  `PurchaseProvider`; UI ani engine se nemění. Id produktů v `src/engine/shop.ts` musí odpovídat id
  v App Store Connect a Google Play Console.
- **Trvalé nároky** se drží v `state.entitlements`, přežijí prestiž a po napojení se mají obnovovat z obchodu
  (`restore()`), ne jen z lokálního uložení.
- **Přihlášení:** blok Účet v záložce Info (`src/ui/AccountCard.tsx`) je zatím jen vizuální. Po založení účtů
  se napojí na Firebase Auth (Apple + Google) a synchronizaci uložení.

## Ladění balancu

Všechna čísla jsou v `src/engine/data.ts`: ceny a produkce generátorů, prahy a ceny vylepšení,
`PRESTIGE_BASE`, `STARDUST_BONUS`, `OFFLINE_CAP_SECONDS` a `OFFLINE_EFFICIENCY`. Po úpravě spusť `npm test`.
