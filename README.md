# DOOM YouTube

A Chrome extension that restyles [youtube.com](https://www.youtube.com) with a neon, DOOM-inspired HUD look — and optionally strips Shorts from the feed.

![YouTube homepage restyled with a neon green tactical HUD theme](preview.png)

## The idea: LLMs as interface modders

Websites ship one UI for everyone. Browser extensions have always been a way to push back — custom CSS, userscripts, ad blockers — but writing a full visual overhaul by hand is slow: YouTube’s DOM is deep, class names churn, and “make it feel like a game HUD” is a design problem as much as a coding one.

**LLMs change that workflow.** Instead of starting from a blank stylesheet, you describe the aesthetic you want (“neon phosphor, future tactical HUD, no fake game overlays”) and iterate in chat:

1. **Describe the vibe** — reference a game, era, or mood instead of hex codes.
2. **Generate the skin** — CSS variables, content scripts, popup toggles, Manifest V3 wiring.
3. **Critique with screenshots** — drop a capture back into the conversation (“too gamey,” “hide Shorts,” “keep essential info only”) and refine.
4. **Ship a local mod** — load unpacked, tweak, repeat.

The result isn’t a new product competing with YouTube. It’s a personal interface layer: same site, different skin, optional behavior (like hiding Shorts). LLMs are good at this because UI modding is mostly pattern-matching over HTML structure plus taste — exactly the loop of “generate → look → adjust.”

This repo is a small proof of that loop: a theme extension built by describing what YouTube *should* feel like, then cutting anything that got in the way of actually watching videos.

## Features

- Neon green / phosphor restyle of the YouTube chrome
- Popup toggle for the theme
- Optional **Hide Shorts** mode (shelves, nav, feed items, `/shorts` redirects)

## Load unpacked

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder
5. Open YouTube (reload if it was already open)

Use the extension popup to turn **Theme** and **Hide Shorts** on or off.
