# embodied-ml-lab
现代机器学习、生成模型与具身策略后训练的中文技术教材：数学推导、PyTorch 实现与编程练习。

## 网站迁移与 GitHub Pages

当前公开教材运行在 [ChatGPT Sites](https://embodied-ml-lab.noisynarwhal1.chatgpt.site/)。
本仓库正在迁移为可独立部署的网站。**当前仓库尚未包含站点源码，不能仅凭已发布网站的页面文本完成无损迁移。**

目标地址：`https://wxb1870.github.io/embodied-ml-lab/`

### 导入现有源码

1. 在原 ChatGPT Sites 项目中使用 Codex 的源码导出能力，获取**完整项目**（包括 `package.json`、前端源文件、公开资源、课程内容、图示及必要配置）。
2. 将源码提交到本仓库 `main` 分支，保留各章节的理论、代码、练习与路由。
3. 根据项目实际框架设置静态导出及 GitHub Pages 子路径 `/embodied-ml-lab/`。Vite 通常设置 `base: '/embodied-ml-lab/'`；Next.js 静态导出通常需要 `output: 'export'` 和 `basePath: '/embodied-ml-lab'`。这些只是参考，具体以导出的项目为准。
4. 在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
5. 推送源代码后检查 [Actions](https://github.com/WXB1870/embodied-ml-lab/actions) 构建结果和线上页面。

已有工作流：`.github/workflows/pages.yml`。当根目录尚无 `package.json` 时会跳过部署；静态构建完成后仅接受包含 `index.html` 的 `out/`、`dist/` 或 `build/` 目录。若项目并非这种结构，需要按实际源码修改工作流。

### 发布前检查

- 首页、课程列表及各模块的章节页可以直接刷新访问；
- 理论 / 代码 / 练习入口及查询参数正常；
- Math / KaTeX 公式、SVG 图示、图片、语法高亮及全文搜索正常；
- 站内绝对链接、资源路径和 GitHub Pages 子路径正确；
- 无需服务器运行的静态页面可以完整工作；若依赖服务端能力则需迁移至支持后端的托管服务。
