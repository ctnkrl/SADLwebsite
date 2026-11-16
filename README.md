# SADL project website

Live website: https://ctnkrl.github.io/SADLwebsite/

Website repository: https://github.com/ctnkrl/SADLwebsite

GitHub Pages publishes the repository's `main` branch from `/`. To update the public page, upload the changed files to that branch; GitHub will rebuild it automatically. This repository contains the website and paper, not the SADL training code.

The site is static and has no build step, external font dependency, or analytics. Icons, the Three.js library, figures, and the paper are included locally. Use the public URL or a local HTTP server for the WebGL animation. Opening `index.html` directly still shows the paper-figure fallback, since browsers restrict local JavaScript modules.

## Contents

- `index.html`, `styles.css`, `site.js`: page, responsive styles, and interactions.
- `motion.css`, `representation.js`: dark research presentation, entry animations, and interactive Three.js point cloud. The cloud is a conceptual illustration, not an experimental trajectory. It supports drag, collapse/expand, pause, reduced motion, and offscreen suspension.
- `assets/paper/SADL.pdf`: signed paper compiled from `SADL_arxiv_submission.zip`, without source edits.
- `assets/figures/`: rasterized original paper figures; the glyph-target crop is retained as the WebGL fallback.
- `assets/sadl.bib`: signed preprint citation. Replace with the official arXiv citation once an identifier exists.
- `assets/vendor/lucide.min.js`: Lucide icons, ISC license.
- `assets/vendor/three.module.js`: Three.js, MIT license.

## Publishing

Upload the entire folder to a static host, or use the folder as the root of a GitHub Pages repository. No workflow or package installation is needed. Keep the relative asset paths intact.

The code entry is marked **Coming soon**, as requested. Once code is ready for public release, replace the disabled code button and status section with the confirmed repository URL. No arXiv identifier or conference acceptance is claimed. The anonymous CVPR-related manuscript is intentionally not included on this public website.

## Evidence

Control figures and numbers come from the signed paper, including the ten-seed mechanism audit and the separate three-seed matched-backend comparison. The gate sliders illustrate the scalar penalty, rather than measured training trajectories. No videos from other projects are included.

The research content follows problem, method, and evidence: an overview of SADL; the BN mechanism and fixed-probe measurements; the total training loss and one-sided correction; matched-backend control results and a five-weight encoder-regularization comparison; image learning curves and updates-to-target; and learned output geometries. The English and Chinese text cover the same evidence. Source links identify the paper tables used for the control and ablation results. The video placeholder sits immediately after the opening metrics, before the research overview.

The SADL video section is a deliberate placeholder with no fake playback control. When the real video is available, replace `.video-placeholder` with a responsive video element; keep the `#video` section anchor.

The page follows the title/authors/resources, overview, method, experiments, and citation structure used by embodied research project sites such as [ALOHA](https://tonyzhaozh.github.io/aloha/) and [Diffusion Policy](https://diffusion-policy.cs.columbia.edu/). Their content, branding, and video assets are not used.

The motion revision also references the research-first structure of [H-JEPA](https://h-jepa.com/) and the spatial presentation of [World Labs](https://worldlabs.ai/). The geometry animation and visual styling are implemented for SADL.
