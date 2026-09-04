# Hvězdný důl 💎

Idle / clicker hra pro iOS a Android postavená na [Expo](https://expo.dev) (React Native + TypeScript).
Klepáním těžíš krystaly, kupuješ zařízení, která těží sama (i když hru zavřeš), odemykáš vylepšení
a přes prestiž získáváš hvězdný prach s trvalým bonusem.

## Co hra umí

- **Klepání** – ruční těžba s animací, plovoucími čísly a haptickou odezvou.
- **10 generátorů** – od těžebního dronu po dimenzionální portál, cena roste geometricky (×1,15 za kus).
- **Hromadný nákup** – ×1 / ×10 / ×100 / MAX.
- **49 vylepšení** – násobiče generátorů (při 10/25/50/100 kusech), vylepšení klepnutí, globální bonusy,
  „synchronizace“ (klepnutí přidává % produkce).
- **Prestiž** – hvězdný prach = ⌊√(krystaly v běhu / 10 M)⌋, každý kus +10 % k produkci navždy.
- **Offline postup** – po návratu dostaneš 50 % produkce za dobu nepřítomnosti, max 8 h, s přehledným dialogem.
- **Automatické ukládání** – každých 10 s a při přechodu aplikace do pozadí (AsyncStorage).
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
| `npm test`          | jednotkové testy herního enginu (Jest)     |
| `npm run typecheck` | kontrola typů (`tsc --noEmit`)             |

## Sestavení do obchodů

Nejjednodušší cesta je [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build --platform android   # .aab pro Google Play (nebo --profile preview pro .apk)
eas build --platform ios       # .ipa pro App Store (vyžaduje Apple Developer účet)
```

Identifikátory aplikace jsou v `app.json` (`ios.bundleIdentifier`, `android.package`) – před publikováním
je uprav podle svého účtu. Ikony a splash v `assets/` jsou výchozí z Expo šablony, nahraď je vlastními.

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
src/hooks/useGame.ts    herní smyčka (tick 100 ms), autosave, offline detekce
src/ui/                 obrazovky a komponenty (Těžba, Vylepšení, Prestiž, Info)
__tests__/              Jest testy enginu
```

## Ladění balancu

Všechna čísla jsou v `src/engine/data.ts`: ceny a produkce generátorů, prahy a ceny vylepšení,
`PRESTIGE_BASE`, `STARDUST_BONUS`, `OFFLINE_CAP_SECONDS` a `OFFLINE_EFFICIENCY`. Po úpravě spusť `npm test`.
