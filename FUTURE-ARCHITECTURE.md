# Architettura futura e idee aperte

Questo file raccoglie idee non ancora implementate, cose lasciate a metà e
decisioni esplicite di "non farlo" con la relativa motivazione, così una
sessione futura (umana o Claude Code) non deve ricostruire il contesto da zero.

## Idee dalla pagina "Note" del sito

La sezione **Note** (`src/app/(main)/notes/page.tsx`, dati in `Note`/`NoteCategory`
in `src/lib/types.ts`) è già pensata per raccogliere idee/bug/feature request
scritte da Alessio stesso mentre usa il sito. Vale la pena controllarla
periodicamente per idee non ancora trascritte qui.

## Dipendenze non aggiornate (major, rimandate)

`npm outdated` segnala diversi salti di **major version**, tutti rimandati
perché troppo rischiosi per un aggiornamento non supervisionato:

| Pacchetto | Attuale | Latest | Nota |
|---|---|---|---|
| `next` | 14.2.35 | 16.x | Next 15 e 16 hanno breaking change noti (API richieste async in App Router, cambi a `next.config`, ecc.). Next 14.2.35 è l'ultima 14.x stabile: **non esiste una patch 14.x** per le CVE elencate sotto. |
| `react` / `react-dom` | 18.3.1 | 19.x | Da aggiornare insieme a Next (Next 15+ richiede/consiglia React 19). |
| `eslint` / `eslint-config-next` | 8.x | 10.x / 16.x | ESLint 9+ usa flat config (`eslint.config.js`), non il formato `.eslintrc.json` legacy: migrazione non banale. |
| `tailwindcss` | 3.4.10 | 4.x | Tailwind 4 cambia il modello di configurazione (CSS-first, niente `tailwind.config.ts` nello stesso modo) — richiederebbe di rivedere `tailwind.config.ts` e `postcss.config.mjs`. |
| `typescript` | 5.5.4 | 7.x | Salto enorme, da fare solo insieme al resto (Next/React/ESLint spesso fissano un range di TS supportato). |
| `recharts` | 2.12.7 | 3.x | Usato nella dashboard (`src/app/(main)/page.tsx` e componenti grafico): la v3 ha breaking change nell'API dei componenti, da verificare grafico per grafico. |
| `react-markdown` | 9.0.1 | 10.x | Usato per il rendering della chat dell'assistente AI. |
| `@types/node`, `@types/react`, `@types/react-dom` | — | — | Vanno di pari passo con Node/React installati. |

**Aggiornati in questa sessione** (stessa major version, quindi a basso
rischio): `@tailwindcss/typography` 0.5.15 → 0.5.20, `postcss` 8.4.41 → 8.5.28,
`autoprefixer` 10.4.20 → 10.6.1, `remark-gfm` 4.0.0 → 4.0.1. Verificati con
`npm run build` (vedi sotto): nessuna rottura.

### Perché non ho fatto il salto di major

`npm audit` segnala 5 vulnerabilità (4 high, 1 critical) in `next`/`postcss`
risolte solo passando a `next@16.x` (nessuna riparte come patch 14.x). Next
14→16 è un aggiornamento con breaking change reali (routing, API async, ecc.)
che richiede di rivedere `src/app/**` con calma e testare manualmente login,
upload CSV, assistente AI e le pagine con `dynamic`/`revalidate`, non qualcosa
da fare alla cieca in una sessione di sola documentazione. Dato che questo sito
è pensato per **non essere esposto su Internet pubblico** (vedi README, sezione
"Perché è privato" — uso consigliato dietro Tailscale/VPN), l'urgenza di queste
CVE (perlopiù legate a server pubblici/edge) è bassa nell'uso previsto, ma
resta comunque da programmare: **prossima sessione dedicata** dovrebbe
aggiornare `next`/`react`/`react-dom`/`eslint`/`tailwindcss` insieme, in un
branch a parte, con test manuale di tutte le pagine.

## `npm run lint` richiede setup interattivo (gap pre-esistente)

Il repo non ha un file `.eslintrc.json`/`eslint.config.*` committato, quindi
`next lint` chiede interattivamente "How would you like to configure ESLint?"
(Strict/Base/Cancel) — non eseguibile in modo non presidiato così com'è. Non è
una regressione di questa sessione: la mancanza del file di config non è
legata alle dipendenze aggiornate. In questa sessione ho verificato solo con
`npm run build` (vedi CLAUDE.md). Da fare in una sessione di codice (non di
sola documentazione): aggiungere `.eslintrc.json` con
`{"extends": "next/core-web-vitals"}` (o l'equivalente flat config se si
aggiorna a ESLint 9+ nello stesso momento) così `npm run lint` funziona senza
prompt.

## Feedback pubblico / note utenti — intenzionalmente NON aggiunto

L'idea generale (usata come modello in altri repo) di aggiungere un
meccanismo di feedback pubblico — ad es. visitatori del sito che lasciano note
in un database condiviso fra siti — **non si applica a questo progetto e non
va aggiunta:**

- `personal-healthcare` è un'app **privata, mono-utente**, protetta da
  password (`APP_PASSWORD`, vedi `src/app/api/login`), pensata per girare su
  rete privata (Tailscale/VPN) e non indicizzata (`robots: noindex`). Non ha
  "visitatori pubblici" da cui raccogliere feedback: l'unico utente è Alessio
  stesso.
- Tutti i dati — inclusi quelli sanitari (peso, pressione, sintomi, visite,
  esami del sangue) — vivono in **un unico file JSON locale**
  (`data/db.json`, gestito da `src/lib/db.ts`), escluso da git ma comunque
  potenzialmente sensibile se il file o il processo venissero esposti.
- Il sito ha **già** una sezione "note" (`src/app/(main)/notes/page.tsx`,
  `NoteCategory` in `src/lib/types.ts`) per idee/bug/feature request sul sito
  stesso — salvata **nello stesso `db.json` locale**, insieme a tutti i dati
  sanitari. Questo è intenzionale: mescolare queste note personali con un
  eventuale database condiviso fra più siti pubblici (come farebbe un
  meccanismo di feedback generico) significherebbe far uscire dati che
  vivono accanto a informazioni sanitarie reali dal perimetro locale/privato
  del sito, un problema di privacy serio che vanifica tutte le precauzioni
  descritte sopra (password, rete privata, nessuna indicizzazione, nessun
  cloud di terze parti). Anche se in teoria si potesse isolare "solo le note
  non sanitarie", il rischio di errore (una nota scritta distrattamente
  mentre si guarda una pagina di sintomi, o un bug che invia più contesto del
  previsto) non vale il beneficio per un sito che ha un solo utente.
- **CLAUDE.md** del repo vieta già esplicitamente di esporre dati sanitari
  reali: un DB condiviso fra siti andrebbe contro lo spirito di quella regola.

Se in futuro servisse davvero un posto per lasciare feedback sul sito da
remoto, l'opzione più sensata resta quella già esistente — la pagina **Note**,
locale — non un servizio esterno condiviso.
