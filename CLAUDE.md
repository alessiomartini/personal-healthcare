# Claude Code instructions

## Project

Next.js (App Router) personal-healthcare application ("Health Log"). Private,
single-user, self-hosted. See `README.md` for features and deployment, and
`FUTURE-ARCHITECTURE.md` for open ideas, deferred dependency upgrades, and
things intentionally not built.

## Verification

- Install with `npm ci` when needed.
- Run `npm run lint` and `npm run build` after application changes.
  - `npm run lint` currently prompts interactively ("How would you like to
    configure ESLint?") because the repo has no `.eslintrc.json`/
    `eslint.config.*` committed — a pre-existing gap, not caused by dependency
    updates. It cannot run unattended as-is; see `FUTURE-ARCHITECTURE.md` for
    the fix. Until then, prefer `npm run build` (which also type-checks) for
    non-interactive verification.
  - On Windows, `next build`/`next lint` may fail with
    `EXDEV: cross-device link not permitted` when writing Next's telemetry
    config under `%APPDATA%`. If that happens, run with
    `NEXT_TELEMETRY_DISABLED=1` set, or retry — it's an environment quirk
    (cross-device rename), not an application bug.
- Use `npm run dev` for UI changes and inspect the affected flow in a browser.
- Use only fake/seed data locally; never expose real health information.
- Before bumping any dependency to a new **major** version (Next, React,
  ESLint, Tailwind, TypeScript, Recharts, react-markdown are all currently
  pinned behind a major — see `FUTURE-ARCHITECTURE.md`), do it in a dedicated
  session/branch with manual testing of login, CSV import, the AI assistant,
  and charts — not as a drive-by change.

## Workflow

- Read `README.md`, `.env.example`, and the relevant route/component before editing.
- Never commit `.env` files, tokens, credentials, or personal health data.
- Preserve server/client boundaries and validation behavior.
- Inspect `git diff` and report checks before committing.
- The `notes` feature (`src/app/(main)/notes/page.tsx`) stores personal notes
  in the same local `data/db.json` as health data, by design — see
  `FUTURE-ARCHITECTURE.md` for why this must stay local/private and must not
  become a shared/external feedback mechanism.

## Roadmap e progressi

Questo progetto è tracciato in https://alessiomartini.github.io/projects-overview/ tramite il file `ROADMAP.md`
nella root del repo. Mantienilo aggiornato:

- Alla fine di ogni sessione di lavoro (prima del commit finale), aggiorna `ROADMAP.md`:
  - spunta (`- [x]`) i punti completati in questa sessione;
  - aggiungi come `- [ ]` i nuovi compiti emersi, nella fase giusta (titoli `##`);
  - aggiungi in cima alla sezione `## Log` una riga `- AAAA-MM-GG: <cosa è stato fatto, in una frase>`
    (se esiste già una riga con la data di oggi, estendila invece di crearne un'altra).
- Non riscrivere né riordinare le voci esistenti senza motivo; non cancellare le voci completate.
- Se `ROADMAP.md` non esiste, crealo con le fasi `## ...`, le checkbox e una sezione `## Log`.
- Includi l'aggiornamento di `ROADMAP.md` nello stesso commit del lavoro.
