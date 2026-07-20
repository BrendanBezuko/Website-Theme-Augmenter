# DOOM YouTube

> Same YouTube. Different cockpit.

A Chrome extension that restyles [youtube.com](https://www.youtube.com) as a neon phosphor HUD — dark void, electric green, glass panels — and can optionally wipe Shorts out of the UI entirely.

![YouTube homepage restyled with a neon green tactical HUD theme](preview.png)

---

## Why this exists

Most of the web is a rented apartment. You get the landlord’s paint job.

Browser extensions were always the escape hatch — Stylish themes, userscripts, blockers — but a *full* interface rewrite used to mean days of CSS archaeology. YouTube alone is a moving target: shadow DOM-ish custom elements, SPA navigations, class names that vanish overnight. Want it to feel like a 2020s DOOM terminal instead of a blue-and-white content farm? That’s taste + engineering + patience.

**LLMs collapse that loop.**

You don’t start from a blank `content.css`. You start from a sentence:

> *“Make YouTube look like the DOOM Eternal HUD — neon green, future realistic, but don’t plaster fake health bars over the feed.”*

Then you look at the result, send a screenshot, and steer:

| You say | The mod changes |
| --- | --- |
| “Too red / too gamey” | Palette shifts to phosphor green |
| “No fake HUD chrome” | Reticle, vitals, label renames get cut |
| “Also kill Shorts” | A second mode lands in the popup |

The site stays YouTube. The *interface* becomes yours.

---

## LLMs as interface modders

Think of an LLM less as “write my extension” and more as a **live UI workshop**:

1. **Vibe first** — Point at a world (DOOM, cyberpunk, a cockpit MFD). Skip the design-system lecture.
2. **Generate the skin** — Manifest V3, CSS variables, content scripts, storage-backed toggles.
3. **Ground it in reality** — Paste a screenshot. Point at what’s wrong. Iterate in minutes, not weekends.
4. **Separate look from behavior** — Theme is one switch; Hide Shorts is another. Same mod surface, different jobs.
5. **Keep it personal** — Load unpacked. No store review. No one else’s brand guidelines.

This works well because interface modding is mostly:

- **Structure** — “what’s a shelf / chip / masthead on this site?”
- **Taste** — “glow here, silence there”
- **Tight feedback** — eyes on glass → words → patch

That’s the generate → look → adjust loop LLMs are built for.

This repo is a small receipt: a theme built by describing how YouTube *should* feel, then deleting everything that got in the way of watching.

---

## What’s in the mod

| Control | What it does |
| --- | --- |
| **Theme** | Neon green restyle — masthead, sidebar, chips, cards, player accents, scrollbars |
| **Hide Shorts** | Removes Shorts shelves, nav entries, feed items; blocks `/shorts` clicks; bounces Shorts pages home |

Theme and Shorts hiding are independent. Run one, both, or neither.

### Stack

| File | Role |
| --- | --- |
| `manifest.json` | MV3 extension config |
| `content.css` | The skin |
| `content.js` | Theme class + Shorts scrubber (SPA-aware) |
| `popup.*` | On/off controls |
| `icons/` | Extension icons |
| `preview.png` | What it looks like in the wild |

---

## Install (unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → select this folder
4. Open (or reload) YouTube
5. Click the extension icon → flip **Theme** / **Hide Shorts**

If a page looks half-transformed after a toggle, reload the tab. YouTube’s SPA is moody; a refresh always wins.

---

## Steal this workflow

Want a different site, different mood?

1. Fork the shape: content CSS + tiny content script + storage toggle.
2. Tell an LLM the aesthetic in plain language.
3. Feed it screenshots until it feels right.
4. Cut anything that isn’t essential information.

The point isn’t DOOM specifically. It’s **reclaiming the glass** — treating the browser as a place you dress, not just a place you visit.
