# Embodied ML Lab

网站：**https://wxb1870.github.io/embodied-ml-lab/**

本仓库保留从 Sites v11 恢复的完整教材源码。GitHub Pages 从 `main` 分支的 `docs/` 目录发布，无需运行服务器。GitHub Actions 负责验证教材构建和页面链接。

更新教材后，依次运行 `python3 scripts/assemble.py`、`node scripts/prerender.cjs`，再用 `cp -R dist/. docs/` 同步发布目录并推送到 `main`。部署地址由 `SITE_URL` 指定，默认使用上述 GitHub Pages 地址。

A public Chinese technical textbook connecting modern machine learning, generative action policies and embodied-model post-training. The emphasis is on derivations, assumptions, counterexamples and executable checks.

## Reading structure

The two-level catalog contains 50 lessons in seven chapters: mathematics and ML; neural networks; Transformer and multimodal models; generative models and continuous time; imitation, action policies and VLA post-training; data and training engineering; execution and evaluation. The four prominent MLP, CNN, Transformer and Flow Matching entries lead to the same canonical articles as the catalog. Their former short theory pages have been merged into these articles, while complementary experiments and exercises remain available.

Articles have three views: theory, code and exercises. The sidebar follows the selected view; on narrow screens the same contents are accessible from a sticky menu. Previous/next links follow the current course order. Existing lesson IDs, topic exercise draft keys and legacy section bookmarks are preserved through explicit mappings. Full-text search is generated directly from the articles and code; there is no separately maintained reference index.

Every canonical course has a chapter introduction, and every substantive theory section has an authored `lead` that motivates its next derivation. These are part of the source content, search index, static HTML and downloadable lectures. They are not generated from headings at render time. Theory pages no longer begin with a separate list of conclusions or repeat a discussion/FAQ appendix: derivation questions and misconception analysis belong to the existing exercise view, with stable legacy links. Short introductions do not replace the mathematical argument that follows them.

Each course view has a real URL and pre-rendered HTML, including article text, references, code and KaTeX MathML. The browser enhances the same renderer with navigation, search, interactive explanations and exercises. A sitemap, per-page canonical URL and description support discovery. The delivered HTML does not require JavaScript to expose the textbook content; this does not guarantee inclusion in any search engine.

Derivations state their assumptions and include worked examples, counterexamples and short numerical checks. Interactive explanations appear inside the corresponding article. Complete implementations have line annotations. Standard-library Python exercises run in the browser using bundled Pyodide; PyTorch exercises run locally. Downloadable study packs include the complete articles, implementations, starter exercises, solutions, assertions and primary sources.

The curriculum covers the common foundation and supervised post-training path. VAE, score matching, SDE/ODE and the ACT/Diffusion/Flow policy interface connect the mathematical chain. A trained conditional two-mode Flow Matching experiment separates field-estimation and numerical-integration errors. An integrated synthetic policy example connects episode splitting, training-only statistics, policy optimization, fresh-process restoration and closed-loop evaluation. A controlled domain-transfer experiment compares the unchanged base, training from scratch, a frozen backbone, LoRA and full fine-tuning while measuring source retention.

Reinforcement learning covers returns, Bellman equations, GAE, value estimation, policy gradients and the PPO surrogate; a complete on-policy or off-policy training project is outside this release. Synthetic experiments do not establish performance on robots or across embodiments. See `reports/textbook-audit.md` and `reports/curriculum-coverage.md` for the actual coverage, evidence and limits.

The previous reference page, knowledge graph, scope checklist, progress dashboard and multiple-choice quizzes have been removed. Old routes redirect to the corresponding content. Existing browser drafts and notes remain readable/exportable; the storage key and course IDs are preserved.

## Handwritten implementations and formula authoring

The Transformer exercises now include a complete multi-head self-attention module and a Pre-LN block, with explicit tensor contracts, TODOs, reference implementations, gradient comparisons and causality/padding checks. Flow Matching includes a complete conditional training step and an affine-path/Gaussian-marginal exercise. Existing manual MLP gradients, grouped convolution, safe attention, cache offsets and Heun integration remain in their corresponding courses. There is no separate interview-preparation section.

Write mathematical expressions explicitly as `\( ... \)` for inline notation or `\[ ... \]` for a displayed derivation. Use backticks for code and tensor layout strings. Render math before Markdown processing so brackets, asterisks, subscripts and HTML escapes are not reinterpreted. The same renderer generates both static and browser output; long displays use an accessible horizontal scroll area. Marked mathematics in table cells and headings is rendered consistently.

`validate_formulas.cjs` checks marked expressions and reports unmarked candidates; `validate_math_rendering.cjs` checks actual prose/Markdown/code/MathML interactions; `validate_site.py` rejects leftover TeX and error markup in generated HTML. Browser inspection remains necessary: syntax validation alone cannot establish mathematical meaning or readable layout. See `reports/hands-and-math-update.md` for this revision's evidence and remaining scope.

The subsequent teaching-quality review is recorded in `reports/textbook-quality-update.md`, with per-course reports and actual numerical evidence. `validate_theory.py` enforces chapter/section introductions, rejects exact duplicate introductions and checks prerequisite order. Sentence counts are only editorial signals, not a measure of depth. `validate_routes.cjs` also checks that theory and exercise content are separated without breaking old question links or drafts.

## Source layout

- `content/`: course articles and catalog.
- `content/topics/`: the single theory source for four canonical core lessons, plus their supplementary implementations and labs. Course metadata and base exercises refer to these using `theoryTopic`.
- `content/experiments/`: recorded numerical evidence, SVG figures and the reproducible plotting script.
- `content/site-shell.html`: common HTML shell for generated pages.
- `dist/app.js`: routing, search dialog, exercise runtime and browser drafts.
- `dist/reader.js`: catalog, article and exercise rendering; search index derived from article content.
- `dist/math.js`: shared math tokenization and KaTeX rendering for browser and static HTML; mathematical structure is preserved in search snippets.
- `dist/styles.css`: shared responsive layout.
- `dist/*explorers.js`: interactive mathematical explanations.
- `scripts/assemble.py`, `scripts/build_knowledge.py`: validate source structure and generate JSON and study packs.
- `scripts/prerender.cjs`: generate native course pages, legacy topic aliases, the sitemap and robots file from the same browser renderer.
- `scripts/validate_content.py`, `scripts/validate_topics.py`: execute complete demonstrations and exercise solutions; reuse verified results only when source hashes are unchanged.
- `scripts/validate_site.py`, `scripts/validate_routes.cjs`: check static HTML/assets/anchors, migration semantics, mathematical text preservation and exercise draft compatibility.
- `reports/`: bounded content audits and actual validation evidence. Historical subtask counts overlap; use the final audit for non-duplicated totals.

## Build and verify

```bash
python scripts/assemble.py
python scripts/validate_theory.py
node scripts/validate_formulas.cjs
node scripts/validate_math_rendering.cjs
python scripts/validate_content.py
python scripts/validate_topics.py
python scripts/assemble.py
node scripts/prerender.cjs
python scripts/validate_site.py
node scripts/validate_routes.cjs
node --check dist/app.js
node --check dist/reader.js
node --check dist/math.js
node --check scripts/prerender.cjs
node scripts/validate_explorers.cjs
node scripts/validate_deep_explorers.cjs
```

The two-process Gloo demonstration remains environment-blocked because this delivery environment prohibits communication sockets; its separate mathematical exercises have been verified. CUDA paths require hardware validation. Browser Python uses CPython through Pyodide 0.27.7.

The site uses plain JavaScript rather than TypeScript and has no package-manager lint configuration. Source compilation, JavaScript syntax checks, formula rendering, isolated Python execution and targeted route/static-content checks are the applicable gates. Authors should run assembly and pre-rendering after changing content, then validate the generated deliverables.

For local preview, serve the repository parent and expose `dist/` at `/embodied-ml-lab/` so links use the same prefix as GitHub Pages. UI structure was originally inspired by https://rl-robotics.github.io/ . External visualization resources link to their original sites and licenses.
