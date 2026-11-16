# SADL project website

Live website: https://ctnkrl.github.io/SADLwebsite/

Website repository: https://github.com/ctnkrl/SADLwebsite

GitHub Pages publishes the repository's `main` branch from `/`. To update the public page, upload the changed files to that branch; GitHub will rebuild it automatically. This repository contains the website and paper, not the SADL training code.

Open `index.html` in a browser. The site is static and has no build step, external font dependency, analytics, or server requirement. Icons, figures, and the paper are included locally.

## Contents

- `index.html`, `styles.css`, `site.js`: page, responsive styles, and interactions.
- `assets/paper/SADL.pdf`: signed paper compiled from `SADL_arxiv_submission.zip`, without source edits.
- `assets/figures/`: rasterized original paper figures; the hero crops the glyph-target row from the original geometry figure.
- `assets/sadl.bib`: signed preprint citation. Replace with the official arXiv citation once an identifier exists.
- `assets/vendor/lucide.min.js`: Lucide icons, ISC license.

## Publishing

Upload the entire folder to a static host, or use the folder as the root of a GitHub Pages repository. No workflow or package installation is needed. Keep the relative asset paths intact.

The code entry is marked **Coming soon**, as requested. Once code is ready for public release, replace the disabled code button and status section with the confirmed repository URL. No arXiv identifier or conference acceptance is claimed. The anonymous CVPR-related manuscript is intentionally not included on this public website.

## Evidence

Control figures and numbers come from the signed paper, including the ten-seed mechanism audit and the separate three-seed matched-backend comparison. The gate sliders illustrate the scalar penalty, rather than measured training trajectories. No videos from other projects are included.

The page follows the title/authors/resources, overview, method, experiments, and citation structure used by embodied research project sites such as [ALOHA](https://tonyzhaozh.github.io/aloha/) and [Diffusion Policy](https://diffusion-policy.cs.columbia.edu/). Their content, branding, and video assets are not used.
