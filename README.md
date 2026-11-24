# Embodied ML Lab

面向具身智能与大模型算法研发的学习网站：**学院派理论推导 + PyTorch 工程实现 + 面试手撕训练营**。

在线访问：[wxb1870.github.io/embodied-ml-lab](https://wxb1870.github.io/embodied-ml-lab/)

## 核心课程

1. 网络基础与视觉表征（3 节）
2. 现代 Transformer 与多模态骨干（6 节）
3. 生成模型与连续时间建模（5 节）
4. 具身策略架构与动作建模（4 节）
5. 高效微调与后训练对齐（4 节）

共 22 节核心课程。矩阵求导、激活与初始化、PyTorch 自动微分和训练工程内容收录在「附录：训练工程速查」。Robot Agent 作为独立专题维护。


## 技术架构

- 课程与知识内容：`content/`（唯一内容源）
- 页面外壳与浏览器运行时代码：`content/site-shell.html`、`docs/*.js`、`docs/styles.css`、`docs/robot-agent/`
- 构建输出：`dist/`（唯一发布产物；禁止手工编辑）
- 构建：Python 组装 + Node.js 静态预渲染
- 部署：GitHub Actions 将本次校验通过的 `dist/` 直接发布到 GitHub Pages
- `docs/` 不再作为 Pages 发布目录；其中仅保留构建所需的前端源码和 Robot Agent 页面源码

## 构建与验证

```bash
python scripts/assemble.py
node scripts/prerender.cjs
touch dist/.nojekyll
node scripts/validate_routes.cjs
python scripts/validate_site.py
```

每次推送 `main` 都会重新构建完整站点、验证全部课程路由及静态资源，并部署同一次构建生成的 `dist/`。不得单独更新主页 HTML 或手工修改 `dist/` 中的页面。

首次切换时，请在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。此后无需再手工选择 `docs/` 或分支目录。

课程旧版源数据保留在原始 `content/*.json` 文件中，迁移关系见 [课程归档说明](content/archive/README.md)。
