# 本轮图示与共享实现管线：只读集成审查

## 范围

审查 `dist/reader.js`、`dist/app.js`、`scripts/assemble.py`、`scripts/build_knowledge.py`、`scripts/validate_content.py`、`scripts/validate_site.py` 相对本轮基线的 diff，并阅读有关调用关系。没有编辑这些文件，没有运行全站装配、静态生成或全站验证。

## 核查通过的路径

- HTML：直接提取本轮 `renderSection` / `renderFigures` 运行小型纯函数夹具。`afterParagraph=0` 在导言后、`1` 在首段后、缺省在小节末尾，各图恰好出现一次。旧 `section.figure` 单图形态仍渲染一次；无前导斜杠的旧 assets 地址仍正确规范化。
- Markdown：仅导入无顶层装配副作用的 `build_knowledge` 辅助函数，验证与 HTML 一致的位置、顺序和单次输出；专题讲义使用 `../../assets/...`，普通课程使用 `../assets/...`，均与 ZIP 目录相符。
- 复制与单文件下载：提取 `app.js` 新增的 owner/source/filename 选择表达式，四组夹具分别验证普通课程额外实现、核心课程额外实现、旧 topic 按钮和普通基础demo。来源与文件名都正确；当前页与按钮所有者分离时 `data-lesson` 也有明确定位。
- 下载包：代码审查确认普通课程额外实现写到 `demos/<lesson-id>/<demo-id>.py`，Markdown引用使用同一位置；核心课程继续引用既有 `topics/<topic-id>/demos/...`。两类路径均不依赖未定义的 theoryTopic。
- 执行验证：普通课程额外实现纳入 `validate_content.py`，核心专题继续由既有专题验证器执行。新源没有可复用旧记录时会实际执行，源SHA复用逻辑沿用现有规则。
- 图资产：本轮当前数据共有15张图，10张使用整数插入位置、5张使用缺省位置；均为SVG，源文件均存在。旧Flow Matching实验图仍使用原 `assets/experiments` 路径，新图使用 `assets/figures`；两种路径均由原有/新增循环复制并纳入两个ZIP。
- `validate_site.py` 新增SVG与归档检查与上述路径一致；额外实现的ZIP源码对照含同一结尾换行。此审查未读取正在生成的归档文件，因此不代替主代理最终ZIP/站点验证。

## 一个可复现的非阻断校验缺口

审查时 `assemble.py` 用 `isinstance(value, int)` 检查 `afterParagraph`。Python把布尔值视作int，所以JSON的true/false会通过校验。浏览器使用严格比较 `f.afterParagraph === i`，布尔值不等于整数1/0，导致该图在HTML中遗漏；Markdown的Python比较却会把true/false解释为1/0。

已用纯函数夹具重现该差异。当前15张图的元数据没有布尔值，因此现有交付页面不受影响。建议父任务将此处校验改为 `type(value) is int`，使元数据合同与JS一致；无需改变正确的图示渲染逻辑。

未发现当前内容下会导致复制错误、额外实现丢失、Markdown/ZIP路径断裂或旧图片消失的阻断问题。
