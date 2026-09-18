# Claude Code instructions

## Project

Next.js personal-healthcare application.

## Verification

- Install with `npm ci` when needed.
- Run `npm run lint` and `npm run build` after application changes.
- Use `npm run dev` for UI changes and inspect the affected flow in a browser.
- Use only fake/seed data locally; never expose real health information.

## Workflow

- Read `README.md`, `.env.example`, and the relevant route/component before editing.
- Never commit `.env` files, tokens, credentials, or personal health data.
- Preserve server/client boundaries and validation behavior.
- Inspect `git diff` and report checks before committing.
