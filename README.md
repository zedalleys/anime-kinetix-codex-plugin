# Anime Motion Playground

A private ChatGPT and Codex plugin for previewing web animations and generating editable HTML with Anime.js v4.5.0. The playground offers a slide entrance, pulse, staggered entrance, and orbit. Change the duration, easing, stagger delay, and looping, then copy or download the HTML.

## Use in ChatGPT or Codex

Open the [private playground](https://anime-motion-playground.fun-daisy-4563.chatgpt.site), or select Anime Motion Playground under Plugins → Created by you. Try “Generate a staggered entrance with 800 ms duration, 100 ms between tiles, and ease-out cubic.”

- **list_animation_presets** lists supported values and defaults.
- **generate_animation_html** returns a complete HTML document. Save it as an HTML file and open it in a browser. The file loads a pinned Anime.js bundle from jsDelivr.

## Run locally

With Node.js 22 or newer, run:

    node build.mjs
    node preview.mjs

Open http://127.0.0.1:4179. The preview serves the bundled Anime.js runtime and exposes the JSON-RPC tool endpoint at /mcp.

The Site worker is in dist/server/index.js. The playground is in page.html and the shared animation generator is in dist/server/motion.js. The build embeds the page and its assets in the worker. Sites provisions the private plugin when it deploys the worker with the MCP capability enabled in .openai/hosting.json.

The bundled [Anime.js release](https://github.com/juliangarnier/anime/releases/tag/v4.5.0) is by Julian Garnier and contributors. See its [MIT license](vendor/LICENSE.md).
