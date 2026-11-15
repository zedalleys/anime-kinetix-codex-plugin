---
name: anime-kinetix
description: Create, preview, or export editable web motion with Anime.js v4 or rigid-body simulations with Matter.js, including staggered animation, gravity, bounce, and collisions.
---

# Anime Kinetix

- Use `list_animation_presets` and `generate_animation_html` for scripted Anime.js motion, such as a staggered entrance, pulse, or orbit.
- Use `list_physics_presets` and `generate_physics_html` for rigid bodies interacting through gravity and collisions. Start from the listed settings and tune gravity, bounce, or the number of bodies.
- When the user asks for a file, save the returned HTML as an editable `.html` file and link it. The generated file loads its engine from a pinned CDN URL.
- For custom hybrid scenes, let Matter.js drive simulated positions and angles. Use Anime.js for independent properties such as opacity, interface transitions, or staged effects. Use fixed physics steps, cap catch-up after backgrounding, and clean up loops when the view unmounts.
- Preserve reduced-motion behavior. Start previews paused for users who prefer reduced motion, and keep playback controls keyboard accessible.
