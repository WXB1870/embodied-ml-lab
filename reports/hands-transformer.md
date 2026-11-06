# Transformer 手写练习与公式排版修复

本轮编辑范围为 `content/topics/transformer.json`；按主代理追加分工，对 `content/vla_p0.json` 的六篇课程仅修正正文、问答及题面中的数学与代码标识排版。没有修改路由、目录、构建脚本或部署产物。实际运行证据见 `reports/hands-transformer-validation.json`。

## 新增练习

新增题目追加在原三个练习之后，保持旧练习顺序、ID 和已有草稿键对应关系。

| Lab ID | 题目与实现范围 | 关键验证 |
|---|---|---|
| `multihead-self-attention` | 从 `[B,T,D]` 输入开始，手写带偏置的 packed QKV 投影、分头、缩放点积、Query/Key 有效位、因果 Mask、安全 Softmax、Value 读出、合头及输出投影。返回逐头权重与输出，保留计算图。 | 单头与三头分别覆盖双向及因果模式；复制同一组参数到官方 MHA，比较前向、权重、输入和四组参数梯度。独立检查单 Token 解析值、非连续输入、Batch 隔离、未来扰动、内部 Padding、全 Padding 的零输出和有限零梯度。 |
| `pre-ln-transformer-block` | 提供前题已经完成的手写 MHA 作为可独立运行的辅助类，学习者实现两次 Pre-LN、两个残差分支、精确 GELU FFN，以及最终有效位处理。 | 复制全部 12 组参数到 `TransformerEncoderLayer`，在非默认 LayerNorm 参数和 epsilon 下比较输出、输入与全部参数梯度。另检查整个 Block 的因果性和 Batch 隔离；将两个分支末端权重和偏置同时清零，验证有效位置上的恒等映射与恒等输入 Jacobian。 |

两题均包含输入／输出及边界约定、分步 TODO、提示、完整参考实现、可直接追加执行的断言、原理说明和追问。题目和参考说明已按语义分段，便于移动端阅读。新增两项正文讨论分别解释前向一致为何不能替代梯度验证，以及零分支如何诊断 Pre-LN 结构。

不把这些题目描述为频率排行榜或某公司未经核实的面试真题。原有 `visibility-mask`、`safe-masked-attention`、`cache-offset` 保持独立职责，未再新建空行 Mask 或缓存偏移的重复练习。

## 数值验证

环境为 Python 3.12.14、PyTorch 2.15.0+cpu，CPU；新题使用 float64、单线程和固定种子 71、73。所有 5 道 Transformer 练习均从当前 JSON 的 `solution + tests` 提取后真实执行通过；所有 starter、solution、tests 可解析。两道 starter 保持未完成状态，运行测试会遇到预期的 `NotImplementedError`。

| 验证项 | 实际结果 |
|---|---|
| MHA 官方对照 | 4 种配置，每种比较输入及 4 组参数梯度；最大输出绝对差约 `1.11e-16`，最大梯度绝对差约 `8.88e-16`。 |
| Pre-LN Block 官方对照 | 2 种配置，每种比较输入及 12 组参数梯度；最大输出绝对差约 `4.44e-16`，最大梯度绝对差约 `1.11e-15`。 |
| 信息边界 | 两题均通过未来扰动、未来输入零梯度、跨 Batch 零梯度和跨样本扰动检查。 |
| Padding 与空行 | 无效 Key/Query 和全 Padding 检查均通过；空行行为按本题约定独立验证，没有依赖官方算子的版本行为。 |
| 错误实现检出 | 四项受控变异均被测试拒绝：QKV `detach`、忽略因果分支、FFN 读取旧输入、额外末尾 LayerNorm。 |
| 禁止接口 | AST 检查确认参考实现没有调用 MHA、SDPA、Transformer 或 Encoder/Decoder Layer 封装；官方模块只存在于测试判据中。 |

官方数值对照的条件为标准等宽自注意力、相同参数、无 Dropout、无位置编码；参考调用中每个 Query 至少有一个可见 Key。Key Padding 并不自动清零官方模块的 Query 输出，测试显式对齐这一接口差异后才比较。固定种子和有限样例提供可复现的局部证据，不构成所有输入、所有精度或所有 Transformer 变体的等价证明，也没有从这些测试推断训练性能。

## Transformer 公式修复

修复既有 124 个文字字段中的裸表达、Unicode 上下标和混杂的代码记号，新增练习另用显式数学格式。重点包括：

- QKV 学习到的双线性匹配、转置、头宽与张量维度。
- 点积方差推导、Softmax Jacobian、三条反向路径；统一使用每头宽度 `d_h`，明确损失梯度简写和按行归约广播。
- 多头线性分块、参数量、低秩匹配与 Softmax 秩的区别。
- 多层布尔依赖的层编号：第 0 层是输入，`M^(ell)` 描述从该层到下一层；保持原有结构依赖论证。
- LayerNorm 标准化 Jacobian、沿中心化向量的方向导数，以及逐通道仿射参数对应的对角矩阵。
- FFN / SwiGLU 导数、RoPE 相对位置、缓存偏移与分块 Softmax。
- Teacher Forcing、词表维度及自回归概率分解。

伴随排版审查，明确了几个既有结论的成立范围：Value 的凸组合性质仅针对非空合法注意力行；RoPE 相对旋转恒等式采用固定频率、角度随位置线性变化的标准形式；常用 KV 容量的倍数 2 假设 Key 与 Value 头宽相同。没有更改已有可运行实现。

## 六篇策略课程的公式排版

`content/vla_p0.json` 共修复 182 个既有文字字段。原 `formula` 字段、全部代码、练习程序、章节与课程 ID 均逐字保留。

| 课程 | 修复范围 |
|---|---|
| `partial-observability` | 状态／观测时间下标、信念条件分布、历史速度、到达延迟、GRU 与 reset 的代码标识。 |
| `distribution-shift` | 专家／学生访问分布、离散闭环反例、最坏误差上界、DAgger 的逐轮分布与监督风险。 |
| `returns-bellman` | 折扣回报、Bellman 与 TD、终止／截断边界、GAE 两种 Mask、优势帽号、旧价值下标和有限片段递推。 |
| `policy-gradient` | 轨迹策略梯度、带符号的 logit 梯度、最优状态基线、同批均值偏差、Gaussian 联合密度、重参数化、tanh Jacobian、重要性比率和 PPO。 |
| `execution-latency` | 时间源与执行时刻、信息年龄、零阶保持区间、取整槽位、位置／参考变化率交集、实测速度导数。 |
| `train-infer-contract` | 动作增量与标准化逆变换、扩散 epsilon 解码、累计噪声系数及代码接口。 |

对复杂表达进行了逐段语义复核，保留原有条件与反例，没有借排版更换算法定义。代码变量以反引号显示；数学变量、上下标、求和、条件概率、分式和帽号进入明确的数学环境。

## 数学渲染与保留检查

使用本轮共享的 `dist/math.js` 和随站 KaTeX 渲染源文件中的全部显式公式：Transformer 为 264 个行内公式和 15 个独立公式，六篇策略课为 218 个行内公式和 21 个独立公式，合计 518 个，全部通过且无未闭合分隔符。

验证不仅检查编译成功，还检查生成 MathML 的实际结构：QKV 转置及头下标、LayerNorm 分式、RoPE 相对位置下标、基线最优值分式、GAE 帽号、扩散解码根号，以及 Bellman 下一状态的上标撇号。七项结构检查全部通过。完整页面视口、移动端滚动和最终部署检查由主代理负责；本报告不声称已经完成这些站点层面的验收。

保留断言同时确认：原三个 lab 的 starter／solution／tests、原三份完整演示、所有原 section 代码未改动；旧 section ID、旧 lab 顺序和旧问题顺序保留，只追加两个 lab 和两项讨论。六篇策略课的现有独立公式和全部可执行源码不变。

## 官方核验来源

- [PyTorch MultiheadAttention 2.15](https://docs.pytorch.org/docs/2.15/generated/torch.nn.MultiheadAttention.html)：核对参数、Batch 轴、逐头返回权重、布尔 Mask 的禁止语义及 Key Padding 约定。
- [PyTorch TransformerEncoderLayer 2.15](https://docs.pytorch.org/docs/2.15/generated/torch.nn.TransformerEncoderLayer.html)：核对 `norm_first`、激活、Dropout、Batch 轴及 LayerNorm epsilon 的比较条件。
- [PyTorch LayerNorm 2.15](https://docs.pytorch.org/docs/2.15/generated/torch.nn.LayerNorm.html)：核对最后归一化维度、仿射参数与方差估计。

题目不依赖官方高速接口完成学习者实现，官方模块只用于有限条件下的前向与梯度对照。最终机器可读报告保存了源码摘要、运行输出、数值误差、变异检出和公式结构验证，便于随后核查测试是否对应当前源文件。
