# French notes for a native speaker

These lines are the ones a French speaker should read before Yana uses them every day. Nothing below has been marked correct. The phrases Mochi says (`src/lib/phrases.ts`) read cleanly to a non-native ear and are not listed.

Please mark each line keep, or write the replacement.

## Buttons Yana sees

- **Partez** (`src/lib/i18n.ts`, French `go`). This is the Lagoon button. A child button is often "Vas-y" or "C'est parti".
- **Stop** (French `stop` in the same file). The usual kid word is "Arrête".
- **Danse, puis stop !** (`src/components/kid/break-gate.tsx`). Same English "stop" inside a French line.

## Stories

- **Il garde bien au chaud.** (`manteau-vert` in `src/lib/stories/library.ts`). The coat has no object here. "Il tient chaud" may be the intended line.
- **Une petite étoile a peur.** (`etoile-timide`). The title says "timide" and the English page says "shy". The French page says she is afraid.

## Story ending

- **Un parent peut dire que tu l'as lue.** (`src/components/kid/story-reader.tsx`). Shown after she finishes a story. Stars wait until a parent taps She read it.

## Ask-her questions on Progress

Parents read these aloud. They live in `src/lib/plan/outline.ts` and in `supabase/migrations/0010_plan.sql`.

- **Ecrire une phrase.** Missing accent: "Écrire".
- **C'est long de combien ?** A more usual question is "Ça mesure combien ?".
- **Comment tu dis chat ?** It does not say whether she should answer in French or in English.

## Short voice lines

In `src/lib/voice/packs.ts`, two tongue twisters are only the start of the traditional lines:

- Un chasseur sachant chasser.
- Les chaussettes de l'archiduchesse.

## Mochi lines

`src/lib/mochi/phrases.ts` is a new set of three French lines for each event. None of them has been marked correct.

## Story hub

- **Lectures à jouer** (`src/components/kid/StoryLibrary.tsx`, The Fable Cottage card). Please confirm this is the right short description for interactive read-alongs.
