# Embodied ML Lab

面向具身智能与大模型算法研发的学习网站：**学院派理论推导 + PyTorch 工程实现 + 面试手撕训练营**。

在线访问：[wxb1870.github.io/embodied-ml-lab](https://wxb1870.github.io/embodied-ml-lab/)

## 核心课程

1. 现代 Transformer 与多模态骨干（7 节）
2. 生成模型与连续时间建模（5 节）
3. 具身策略架构与动作建模（4 节）
4. 高效微调与后训练对齐（4 节）

共 20 节核心课程。矩阵求导、经典神经网络、PyTorch 基础和训练工程内容收录在「附录：训练工程速查」。

## 技术架构

- 前端：原生 HTML、CSS、JavaScript
- 课程源数据：`content/*.json`
- 构建：Python + Node.js 静态预渲染
- 部署：GitHub Pages
- 阅读器、公式渲染、代码编辑与练习交互沿用现有实现

## 构建与验证

```bash
python scripts/assemble.py
node scripts/prerender.cjs
touch dist/.nojekyll
node scripts/validate_routes.cjs
python scripts/validate_site.py
```

课程旧版源数据保留在原始 `content/*.json` 文件中，迁移关系见 [课程归档说明](content/archive/README.md)。
