# Sestavení na telefon a do obchodů

Hra běží v **Expo Go** bez jakéhokoli buildu (`npm start` a naskenovat QR kód). Expo Go ale
neobsahuje nativní moduly pro platby, reklamy a přihlášení, takže na skutečné testování
těchto částí je potřeba **development build** přes EAS. Tento návod popisuje, co spustit
a co je potřeba mít založené.

## Co potřebuješ jednou

| Krok | Kde | Poznámka |
| --- | --- | --- |
| Účet Expo | https://expo.dev | zdarma; EAS Build má bezplatnou kvótu buildů měsíčně |
| Apple Developer Program | https://developer.apple.com | 99 USD ročně; nutné pro build na iPhone i pro App Store |
| Google Play Console | https://play.google.com/console | 25 USD jednorázově; pro Android stačí i bez něj (APK se nainstaluje ručně) |
| EAS CLI | `npm install -g eas-cli` a `eas login` | |

Poté v repozitáři jednorázově:

```bash
eas init            # propojí projekt s účtem Expo a doplní projectId do app.json
```

## Profily v `eas.json`

| Profil | Použití | Výstup |
| --- | --- | --- |
| `development` | vývoj s nativními moduly, hot reload přes `npx expo start --dev-client` | iOS .ipa pro registrovaná zařízení, Android .apk |
| `preview` | testovací build pro kolegy a testery bez obchodu | .ipa (ad hoc) / .apk |
| `production` | build do App Store a Google Play, verze se sama zvyšuje | .ipa / .aab |

## Development build

```bash
eas build --profile development --platform android   # .apk, nainstaluj z odkazu na telefon
eas build --profile development --platform ios       # vyžaduje Apple účet; zařízení přidáš přes `eas device:create`
npx expo start --dev-client                          # pak stačí naskenovat QR kód v dev buildu
```

Development build stačí sestavit jednou a používat ho, dokud se nezmění nativní závislosti
(nový balíček s nativním kódem, změna v `app.json`). JavaScript se načítá z Metro serveru.

## Testovací build pro testery

```bash
eas build --profile preview --platform all
```

Android tester dostane odkaz na .apk. Na iOS je potřeba nejdřív zaregistrovat UDID
testerů (`eas device:create`) nebo použít TestFlight z produkčního buildu.

## Vydání

```bash
eas build --profile production --platform all
eas submit --platform ios       # nahraje do App Store Connect (TestFlight)
eas submit --platform android   # nahraje na interní track Google Play
```

Před prvním vydáním:

- V `app.json` uprav `ios.bundleIdentifier` a `android.package` podle svého účtu. Změna
  identifikátoru po vydání není možná.
- Ikony a splash jsou v `assets/`, generují se přes `npm run icons`.
- Screenshoty a texty pro obchody jsou v `store/` (viz `docs/STORE.md`).
- Po napojení AdMobu bude potřeba do `app.json` doplnit plugin `react-native-google-mobile-ads`
  s ID aplikací, po napojení plateb `react-native-purchases`.

## Co ověřit na skutečném zařízení

Web a Expo Go ukázaly, že hra funguje, ale tyto věci jdou spolehlivě ověřit jen na telefonu:

- haptická odezva při klepnutí a při Zlaté žíle,
- návrat z pozadí po delší době (offline dialog, uložení při přechodu do pozadí),
- výřezy displeje a spodní lišta (bezpečné okraje),
- zvuky v tichém režimu iOS a spolu s hudbou z jiné aplikace,
- výkon scény kolonie a konfet na slabším Androidu.
