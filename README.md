# Flipside

A calm puzzle game about rolling a ball across one-sided worlds. Each chapter is a new shape (a ring, a Möbius strip, a cube, a twisted square tube, a trefoil knot, a Klein bottle), and the shape itself is the puzzle: roll through a half-twist and "left" turns into "right".

The ball keeps rolling until something stops it, so every level is about planning where it will come to rest. There are 31 levels in 9 chapters, each with a par (the fewest moves possible). Hints cost 5 moves each.

## Controls

| | Phone / tablet | Computer |
|---|---|---|
| Roll | Arrow pad at the bottom | Arrow keys / WASD, or click an arrow by the ball |
| Look around | Drag with one finger | Drag with the mouse |
| Zoom | Pinch (double tap to reset) | Scroll wheel |
| Undo / restart / hint | Buttons | `Z` / `R` / `H` |
| Mute | Sound button | `M` |

## Running it

You need Node 18 or newer. There are no dependencies to install.

```bash
npm run build   # writes dist/index.html (one self-contained page)
npm run dev     # build, then serve dist/ on a local port
npm run check   # confirms every level is solvable and its par is the true minimum
```

Three.js and the fonts load from CDNs (jsDelivr and Google Fonts), so the page needs an internet connection.

## Deploying on Vercel

Import the repo in Vercel. `vercel.json` already sets everything up: it runs `npm run build` and serves the `dist` folder. You don't need to change any settings or add environment variables.

**Analytics.** The page loads Vercel Web Analytics from `/_vercel/insights/script.js`. Turn it on once in the Vercel dashboard (the project's **Analytics** tab, then **Enable**), then redeploy. Page views are counted on every plan. The game also sends two custom events, `level_start` and `level_complete` (with the level, chapter, moves, par and hints used), which show up only on a Pro plan.

## How the code is laid out

```
src/
  page.html    markup and styles (the HUD, the menus, the pad, the sound card)
  game.js      the game: rendering, camera, input, animation, audio, screens
  surf.js      the surfaces as maths (strips, torus, knot, square tube, Klein bottle)
  logic.js     the puzzle rules and the solver; shared with the level tools
public/        favicon, app icons and web manifest (copied into dist/ as they are)
brand/         the icon artwork as SVG
levels/
  levels.json  the 31 levels, with their par and a solution for each
  gen.js       random level generator, filtered by the solver
  pick.js      picks the best generated levels for a chapter
  build.js     combines tutorials and picks into levels.json
  generated/   the picks for each chapter
scripts/
  build.mjs    stitches src/ and levels.json into dist/index.html
  check.mjs    verifies every level
  make-icons.py  renders the icon PNGs and ICO from the SVGs (needs Python, Playwright, Pillow)
```

`game.js` has three markers (`/*SURF*/`, `/*LOGIC*/`, `/*LEVELS*/`) that the build replaces with `surf.js`, `logic.js` and the level data, so the finished game is a single file.

### Making new levels

```bash
node levels/pick.js twist   # regenerate one chapter's picks (takes about a minute)
npm run levels              # rebuild levels.json, then check it
npm run build
```

The chapter settings (shape, size, how many pillars, which mechanics) and the move range for each level slot are at the top of `levels/pick.js`. Chapter names, colours and tutorial tips are in `CH` near the top of `src/game.js`.
