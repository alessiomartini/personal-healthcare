# Health Log

Un sito web **privato e personale** per tenere traccia dei tuoi dati sanitari: peso, pressione,
altezza e altri parametri (anche importati da Google Fit), sintomi, visite mediche, esami del
sangue, note per migliorare il sito, e un **assistente AI specializzato in salute** che propone
opzioni (con pro/contro), spiega i farmaci che nomina e suggerisce automisurazioni/test fai da te.

⚠️ **Non è un dispositivo medico né un servizio sanitario.** È uno strumento personale di
organizzazione dati e supporto informativo. Non sostituisce mai il parere di un medico. In caso
di emergenza chiama sempre il numero di emergenza locale (in Italia: 112).

## Funzionalità

- **Dashboard**: andamento nel tempo di peso, pressione, battito, temperatura, con grafici.
- **Parametri vitali**: inserimento manuale + importazione CSV da Google Fit (Google Takeout).
- **Sintomi**: registro con intensità, possibili cause, stato (in corso/risolto).
- **Visite mediche**: medico, specializzazione, esito, prossimo controllo.
- **Esami del sangue**: pannelli con singoli valori, unità, range di riferimento ed esito.
- **Note**: idee, bug o funzioni da aggiungere al sito.
- **Assistente AI**: chat basata su Gemini (Google, ha un livello gratuito) che, dati i sintomi e i tuoi dati recenti:
  - propone 2-4 opzioni concrete (es. riposo, farmaco da banco, automonitoraggio, contattare il
    medico) con **pro e contro** per ciascuna;
  - spiega il meccanismo d'azione dei farmaci che nomina;
  - suggerisce test fai-da-te utili (es. misurare la pressione mattina/sera per alcuni giorni,
    temperatura, un test approssimativo di capacità respiratoria, saturazione, ecc.);
  - indica sempre i segnali d'allarme che richiedono attenzione medica urgente.

## Perché è privato

- L'intero sito è protetto da **password** (nessuna registrazione pubblica, nessun account
  di terzi). Dopo il login viene impostato un cookie di sessione firmato.
- Tutti i dati sono salvati **in un unico file locale** (`data/db.json`), non su un database
  cloud di terze parti. `data/db.json` è escluso da git (vedi `.gitignore`): non finirà mai in
  un repository pubblico.
- Il motore di ricerca non indicizzerà le pagine (`robots: noindex`).
- **Consiglio più forte**: non esporre affatto il sito su Internet pubblico. Il modo più privato
  di usarlo è farlo girare su una rete privata (es. tramite [Tailscale](https://tailscale.com/)
  o una VPN), così è raggiungibile solo dai tuoi dispositivi. La password è una seconda linea di
  difesa nel caso tu debba comunque esporlo (es. su un piccolo VPS) — in quel caso mettilo
  **sempre dietro HTTPS** (es. con [Caddy](https://caddyserver.com/) o un reverse proxy che
  gestisce i certificati automaticamente).

## Requisiti

- Node.js 20+
- Una chiave API Gemini gratuita (solo se vuoi usare l'assistente AI) — creala su
  [Google AI Studio](https://aistudio.google.com/apikey) con un account Google, senza carta di
  credito, poi incollala in `GEMINI_API_KEY`

## Avvio in locale

```bash
npm install
cp .env.example .env
# apri .env e imposta APP_PASSWORD, AUTH_SECRET (es. `openssl rand -hex 32`) e GEMINI_API_KEY
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000): verrai reindirizzato alla pagina di login.

## Build di produzione

```bash
npm run build
npm start
```

## Deploy con Docker

```bash
cp .env.example .env   # imposta le variabili
docker compose up -d --build
```

I dati vengono salvati in un volume Docker persistente (`health-data`), non nell'immagine.

## Variabili d'ambiente

| Variabile           | Obbligatoria | Descrizione                                                        |
| ------------------- | ------------ | ------------------------------------------------------------------- |
| `APP_PASSWORD`      | sì           | Password per accedere al sito.                                      |
| `AUTH_SECRET`       | sì           | Segreto usato per firmare il cookie di sessione. Generalo random.    |
| `GEMINI_API_KEY`    | solo per l'assistente AI | Chiave API Gemini (gratuita), usata dall'assistente sanitario. |
| `GEMINI_MODEL`      | no           | Modello Gemini da usare (default `gemini-2.5-flash`).               |
| `DATA_DIR`          | no           | Cartella dove salvare `db.json` (default `./data`).                  |
| `COOKIE_SECURE`     | no           | Imposta `true` solo se il sito è servito via HTTPS. Lascialo `false`/non impostato per un uso su rete privata via HTTP (es. Tailscale), altrimenti il cookie di login non verrà mai inviato dal browser. |

## Importare dati da Google Fit

Google non offre una sincronizzazione live "chiavi in mano" senza registrare un'app OAuth su
Google Cloud, quindi l'importazione qui è basata su **file CSV**, più semplice e comunque privata:

1. Vai su [Google Takeout](https://takeout.google.com/), seleziona solo "Fit" ed esporta i dati
   (scegli il formato CSV se disponibile per i dati aggregati giornalieri, oppure esporta da
   un'app che tiene traccia di peso/passi/battito in CSV).
2. Nella pagina **Parametri → Importa da Google Fit (CSV)**, carica il file.
3. Scegli quale colonna contiene la data e a quali parametri (peso, passi, battito, ecc.)
   corrispondono le altre colonne: il formato esatto dei CSV di Google Takeout cambia nel tempo
   ed è diverso in base alle unità di misura impostate sull'account, quindi la mappatura manuale
   evita di importare dati sbagliati.
4. Conferma: le misurazioni vengono aggiunte allo storico con l'origine "Google Fit".

Puoi anche continuare a inserire tutto manualmente dalla pagina Parametri, senza mai collegare
Google.

## Note su costi e limiti dell'assistente AI

Ogni messaggio inviato all'assistente chiama l'API Gemini con la tua chiave personale. Il livello
gratuito di Gemini (modello `gemini-2.5-flash`) è pensato per un uso come questo: nessuna carta
di credito richiesta, con un limite di richieste al minuto/al giorno più che sufficiente per un
uso personale (i limiti esatti sono indicati nella tua [Google AI Studio](https://aistudio.google.com/)
e possono cambiare nel tempo). Se non imposti `GEMINI_API_KEY`, tutto il resto del sito funziona
normalmente: solo la pagina Assistente mostrerà un errore.

## Backup dei tuoi dati

Tutti i tuoi dati sanitari vivono in `data/db.json` (o nel volume Docker). È un file di testo
in JSON: puoi copiarlo per fare un backup, o scriverti uno script di backup automatico verso
uno storage cifrato di tua fiducia. Trattalo come dato sensibile.

## Stack tecnico

Next.js (App Router) + TypeScript + Tailwind CSS, storage su file JSON (nessun database esterno
da configurare), grafici con Recharts, assistente AI via API Google Gemini.
