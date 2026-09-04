# Podklady pro App Store a Google Play

Složka `store/` obsahuje texty a screenshoty pro oba obchody.

## Texty

- `store/listing.cs.md` – česká verze (název, podtitul, popis, klíčová slova, kategorie, poznámky
  k hodnocení obsahu a soukromí).
- `store/listing.en.md` – anglická verze.

Limity délek jsou uvedené u každé položky. Popisy jsou psané tak, aby se daly vložit beze změn.

## Screenshoty

Generují se z webového buildu skriptem `tools/make-store-shots.js`:

```bash
npm run web:export                                  # vytvoří dist/
node tools/make-store-shots.js dist store/screenshots
```

Vznikne:

```
store/screenshots/
  ios/cs/1-mine.png … 5-info.png      1290×2796 (iPhone 6,7"), orámované s titulkem
  ios/cs/raw/…                        čisté screenshoty bez rámu
  ios/en/…                            totéž anglicky
  android/cs/…, android/en/…          1080×2340
```

Obchody přijímají orámované obrázky jako marketingové screenshoty. Apple vyžaduje sadu pro
6,7" iPhone (další velikosti si odvodí), Google Play minimálně dva screenshoty telefonu a
volitelně 7" a 10" tablet. Pro tablety stačí pustit skript s upravenými rozměry v `TARGETS`.

Skript používá Playwright s Chromiem (instalace viz README, sekce Ikony). Emoji se vykreslují
fontem systému, na kterém skript běží; pro finální sadu ho spusť na macOS nebo Windows, kde
jsou barevné emoji stejné jako na telefonech.

## Co ještě obchody chtějí

| Položka | Kde vzít |
| --- | --- |
| Ikona 1024×1024 | `assets/icon.png` (generuje `npm run icons`) |
| Feature graphic 1024×500 (jen Google Play) | vytvoř z `store/screenshots/*/1-mine.png` a ikony, nebo přidej do skriptu další variantu |
| Zásady ochrany soukromí (URL) | povinné pro oba obchody; do napojení účtu stačí text „nesbíráme žádná data“ na GitHub Pages |
| Kontaktní e-mail a web | nastavení účtu vývojáře |
| Věkové hodnocení | dotazník v konzoli; odpovědi viz `listing.*.md`, sekce Hodnocení obsahu |
