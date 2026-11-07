# Third-party runtimes

- Pyodide 0.27.7: https://github.com/pyodide/pyodide (MPL-2.0). Bundled official npm runtime, including CPython standard library and WebAssembly artifacts.
- KaTeX 0.16.22: https://github.com/KaTeX/KaTeX (MIT). License is preserved in `dist/vendor/katex/LICENSE`.
- CPython: https://docs.python.org/3/license.html . Distributed as part of the official Pyodide runtime.

The course text and site application are independently authored. Reproduced educational figures are listed below. UI structure is inspired by https://rl-robotics.github.io/ .

## Reproduced educational figures

- `content/figures/conv-arithmetic-window.gif`: the unchanged `no_padding_no_strides.gif` by Vincent Dumoulin and Francesco Visin, from https://github.com/vdumoulin/conv_arithmetic . The repository explicitly makes its code and images reusable under the MIT license with attribution. The original license is preserved in `content/figures/conv-arithmetic-LICENSE.txt` and shipped beside the figure on the site and in the learning packs.
- `content/figures/attention-vaswani-figure2.png`: Figure 2 of Vaswani et al., *Attention Is All You Need* (2017), https://arxiv.org/pdf/1706.03762 . Page 1 grants attributed reproduction of tables and figures for journalistic or scholarly works. The two panels are cropped and rasterized together without changing their contents, and attributed beside the figure. The source and limited reproduction terms are also recorded in `content/figures/attention-figure2-LICENSE.txt`, shipped with the image. This is not an unrestricted reuse license.

The residual, normalization, VAE, diffusion, and LoRA definition diagrams are independently drawn teaching illustrations. Their captions cite the corresponding primary papers and explain adaptations to this site's notation; they are not reproduced paper figures.

## Linked educational projects

The site links to the following projects as optional further study. Their implementation or assets are not bundled or embedded:

- TensorFlow Playground: https://github.com/tensorflow/playground (Apache-2.0).
- CNN Explainer: https://github.com/poloclub/cnn-explainer (MIT).
- Transformer Explainer: https://github.com/poloclub/transformer-explainer (MIT).
- Diffusion Explainer: https://github.com/poloclub/diffusion-explainer (MIT).
- REINFORCEjs: https://github.com/karpathy/reinforcejs (MIT; GridWorld DP/TD demos only recommended).

Repository and license links were reviewed on 2026-11-06. The independently written built-in visualizations use small analytic examples; they are not replicas of these projects.
