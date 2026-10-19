# Kid audit (K0)

Captured on 19 October 2026 from the local app, in Chromium, at a 390 by 844 phone viewport. Screenshots are in `docs/kid-audit/`. No app code was changed.

`docs/KIDMODE.md` and `docs/MOCHI_BLUEPRINT.md` are not in the repo. This pass follows K0: every kid route, the choices on each screen, the length of the button text, whether Mochi and the friends are on screen, and every browser console error.

A new family was opened only so the kid pages would render, then removed. `/kid/games/stories/chat-lune` is the one story opened. The other story addresses use that same reader.

The top bar is on every screen: **Parent**, **Kid** (already selected, so it is a label), **EN**, **FR**. Kid pages also have a bottom bar of three: **Accueil**, **Devoirs**, **Jeux**. Those four top controls and three tabs sit on top of the counts below. A Next.js "2 Issues" badge from the dev server sat over the bottom bar after Home.

## What showed

| Route | Status | Page choices | Longest button text | Mochi | Friends | Scrolls at 844 | Console |
|---|---|---|---|---|---|---|---|
| `/kid` | 404 | 0 | none | No | No | No | 404 |
| `/kid/home` | 200 | 15 | Canapé, Mochi fait dodo (23 letters, 4 words) | Yes | Biscuit bubble only | 855 px, a few pixels | Hydration error |
| `/kid/homework` | 200 | 1 | Photographier (15 letters, 1 word) | No | No | No | None |
| `/kid/games` | 200 | 6 | Crique line, 38 letters, 6 words | No | No | 905 px | None |
| `/kid/games/bay` | 200 | 3 | Bulles line, 31 letters, 6 words | No | No | No | None |
| `/kid/games/bay/bulles` | 200 | 3 | one digit each | No | No | No | None |
| `/kid/games/bay/fruit` | 200 | 3 | Facile, Moyen, Retour (6 letters) | No | No | No | None |
| `/kid/games/bay/more` | 200 | 3 | Cuisine line, 29 letters, 4 words | No | No | No | None |
| `/kid/games/bay/kitchen` | 200 | 3 | one emoji each | No | No | No | None |
| `/kid/games/bay/safari` | 200 | 3 | one emoji each | No | No | No | None |
| `/kid/games/lagoon` | 200 | 6 | Partez and Retour (6 letters) plus four arrows | No | No | No | None |
| `/kid/games/cove` | 200 | 3 | Dessiner line, 40 letters, 6 words | No | No | No | None |
| `/kid/games/cove/draw` | 200 | 25 | Dessiner (8 letters, 1 word) | No | No | 1013 px | None |
| `/kid/games/cove/music` | 200 | 9 | Retour (6 letters); notes are 2 or 3 letters | No | No | No | None |
| `/kid/games/stories` | 200 | 7 | Il était une histoire line, 35 letters, 6 words | No | No | 905 px | None |
| `/kid/games/stories/chat-lune` | 200 | 3 | Suivant (7 letters, 1 word) | No | No | No | None |
| `/kid/games/friends` | 200 | 1 button, 5 locked rows | Retour (6 letters) | No | No names. Five rows of "..." | No | None |
| `/kid/games/voice` | 200 | 3 | Quoi de neuf ? (14 letters, 4 words) | No | No | No | None |
| `/kid/games/voice/practice` | 200 | 3 | Suivant (7 letters) | No | No | No | None |
| `/kid/games/voice/new` | 200 | 3 | Enregistrer (11 letters, 1 word) | No | No | No | None |
| `/kid/games/voice/album` | 200 | 1 | Retour (6 letters) | No | No | No | None |
| `/kid/town` | 200 | 15 | Acheter and Suivant (7 letters, 1 word) | No | No | No | None |
| `/kid/store` | 200 | 2 | Retour (6 letters) | No | No | No | None |

Page choices are the tappable things in the page, not the top bar or the bottom tabs. Home was watched for 10 seconds so a friend bubble had time to appear. The other routes were shot about a second and a half after load.

## Home

Mochi the white cat is in the salon, with the label "Mochi le chat", the line "Bonjour Yana !", and the pose "Mochi attend". The room controls are Fenêtre, Horloge, Livres, Lampe, Plante, Bocal, Canapé, Pelote, Caresse Mochi, and the speaker button. Horloge is 25 by 25 px. Pelote is 27 by 19 px.

One friend bubble was on screen: **Biscuit**, 64 by 64. Praline, Bambou, Roux, and Noisette were not on screen. No friend was standing beside the cat.

The rest of Home is "Je suis là", "Mes devoirs", "Boutique", and "Parents". A pink bar said "C'est la pause !". The mission card said there is no homework yet. The star count was 0.

## Friends

`/kid/games/friends` is titled "Mes amis". Five rows show "..." and none of them is a button. Retour is the only button. Mochi is not on this page. The bunny on the Games card is an icon, not a friend in the room.

## Homework

The page says "Pas de devoir pour l'instant." The pink control says **Photographier**. It is a file label, so it did not count as a button in the DOM, but it is the one choice on the screen. Mochi is not on this page.

## Games and words

The Games hub has six cards, and the last one, Ville, is cut off at 844 px. Each card is a title plus a sentence, about 5 to 7 words. Baie then offers three cards (Bulles, Fruits, Plus). Plus offers Cuisine, Safari, and Dire. Cove offers Dessiner, Musique, and Histoires. Draw adds 25 controls (tools, nine colours, stickers, Effacer, Retour) and the page is 1013 px tall. Music is eight notes plus Retour.

Stories shows Écoute, Suivant, and Retour for a story already on the page, then four outside names: Lumni, The Fable Cottage, Il était une histoire, and Boukili. Those four are on the page before a PIN is typed. The page is 905 px tall.

Town shows plots 1 through 12, then Acheter, Suivant, and Retour. The store has Ville and Retour, and no prize button, because this family had no prizes.

## Console errors

`/kid` (there is no page at that address):

- Failed to load resource: the server responded with a status of 404 (Not Found).

`/kid/home`:

- Encountered a script tag while rendering a React component. Scripts inside React components are never executed when rendering on the client.
- Hydration failed because the server rendered text didn't match the client. The tree was regenerated on the client. The message names a server/client branch, `Date.now()` or `Math.random()`, or date formatting that does not match the server. The text was cut at 500 characters in the capture.

No other kid route logged a console error or a page error. This was the dev server, so the "2 Issues" badge is the Next.js overlay for those two Home messages.
