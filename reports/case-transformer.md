# Transformer：差异化教材改进与验证报告

## 范围与结果

基线：`0035390787417ffcd51de4ec0ec5636579853082`。只修改 `content/topics/transformer.json`，新增六张 `content/figures/transformer-*.svg` 和本报告/验证记录。未修改共享渲染器、目录装配、dist、发布配置，也未执行提交或发布。

完整阅读了本专题 16 节理论、3 个实现、5 个原练习和全部问答/易错点。现有 `tiny-causal-lm` 已经包含训练闭环，因此没有另建平行模型，而是在同一 ID 下贯通 RoPE、手写注意力和整网缓存。16 个 section ID 及顺序、所有 section lead、原 5 个练习、`manual-mha`、`layerwise-information-flow`、问答和易错点均保持原值。新增 1 个 RoPE 实现练习，不增加新路由。

## A / B / C / D / E 逐节审查

A：机制与推导成熟，保留。B：内容较深，补图或具体例子降低理解断点。C：基础机制相对简略，定向深化。D：已存在零散实现，将正文与同一个完整案例串联。E：控制主题边界，使用已有课程/实现而不重复扩张。

| 小节 ID | 分类 | 实施情况 |
|---|---|---|
| tokens-and-axes | D | 保留轴定义；将零散尺寸统一为 B=2,T=4,D=8，并建立完整案例函数入口。 |
| qkv-projections | A/B/D | 保留双线性匹配与 reshape 限制；加入 packed QKV 的精确尺寸和多头流程图。 |
| scaled-attention | A/D | 保留方差、Softmax 与 QKV 反向推导；补全 Z、δ 的局部定义，把主案例 scores/weights/Z 轴对应起来。 |
| heads-and-output | A/D | 保留多头表达式、参数量及 Softmax 秩反例；手算拆头/合头统一到 T=4。 |
| ffn-and-gating | A/D | 保留 ReLU 局部秩、SwiGLU Jacobian 与验证；先明确主案例 GELU 的 8→32→8，再讨论门控变体。 |
| block-and-normalization | A/B/D | 保留 Pre/Post Jacobian 与恒等路径限制；加入两层整体图、Block 内两次残差、最终 Norm 和读出定位。 |
| position-and-rope | B/C | 从二维旋转推到相对点积与多频率配对；给出可手算例、共同平移、非单调反例、缓存偏移及独立代码。 |
| mask-contract | A/D | 保留 API 布尔语义/形状对照；对应案例的因果、Key有效位、Query有效位三项交集及 Dropout前权重。 |
| visibility-patterns | A/B | 保留完整布尔递推、间接泄漏与多层权重变化；增加与既有反例一致的两层路径图。 |
| padding-and-empty | A/D | 保留空行有限反向约定；明确完整前向右补齐与缓存全有效两类输入合同，拒绝返回带 Padding 的可复用缓存。 |
| cross-attention | B/C/E | 保留一般结构及单条件退化分析；增加两 Query、S=3/2/1 数值读出、Mask对照、梯度验证与矩阵图；不向主案例强加交叉子层。 |
| encoder-decoder-families | A/B/E | 保留结构与概率分解区分；增加原论文 Post-LN/正弦位置 Encoder–Decoder 图，与两层 Pre-LN/RoPE 案例分开。 |
| teacher-forcing-and-loss | A/D | 保留标签移位与 Loss Mask；明确两条五符号序列、八个监督、[2,4,7] 输出及 CE Logit 梯度。 |
| kv-cache | A/D | 保留不变性、非方形偏移与变化条件限制；同一整网验证三种分块、28组参数梯度与模型输出反馈解码。 |
| cost-and-inference | A/D | 保留分块Softmax及缓存复杂度；给出主案例256个缓存元素/2048字节的可核查算例，限定内存口径。 |
| reading-vla-code | A/E | 审查后原样保留：继续使用实际条件/动作路径分析；动作策略详解留在对应课程，无重复架构实现。 |

## 贯穿全章的可执行案例

固定 `B=2,T=4,D=8,H=2,d_h=4,N_layer=2,D_ff=32,vocab=7`。两条序列是 `[0,1,2,3,4]` 与 `[3,4,5,6,0]`，前四项作为输入、后四项为标签。

`TinyLM.forward` 完成 Token Embedding、两层独立参数的 Pre-LN Block、最终 LayerNorm 与 Linear 词表头。`CausalAttention.forward` 展开 packed QKV、通道分头、相邻对 RoPE、因果与有效位 Mask、安全 Softmax、Value 读取和输出投影；`Block.forward` 先执行注意力残差，再读取更新后的 h 进入 GELU FFN。RoPE 在每层 Q/K 投影后使用全局位置，不在输入处再加绝对位置向量。

完整训练包含 CE、清梯度、backward、全部参数梯度有限性、裁剪与 AdamW。整网缓存仅用于等长无 Padding Batch；带 Padding 的完整前向返回 `cache=None`，避免隐含缺失的有效位元数据。每层缓存保存已旋转 K 与未旋转 V，代码不重复旋转历史 Key。缓存等价实验在 eval 下关闭 Dropout并保留计算图；自回归生成在 no_grad 下把模型输出反馈为新输入。

### 实测（CPU / Python 3.12.14 / PyTorch 2.15.0+cpu）

- 三种分块 `(1,1,1,1)`、`(2,2)`、`(1,3)` 对比整段前向，最大 Logit 误差 `6.661338147750939e-16`。
- 全部 `28` 组参数梯度最大误差 `2.220446049250313e-15`。
- 较早输出对未来 Embedding 的梯度最大值 `0.0`；未来扰动和 Batch 隔离通过。
- 训练 120 步：合成 CE `2.2914662557 → 0.0074922990`；这是实现检查，不能解释为真实语言或机器人泛化结果。
- 贪心续写得到 `[[0, 1, 2, 3, 4], [3, 4, 5, 6, 0]]`；每次新增 Token 的缓存 Logit 都与全前缀重算一致。

## 数学与实现深化

RoPE 新增从二维旋转矩阵、正交性、相对点积到多维频率配对的连续解释。图使用 ω=π/6 便于手算，实际案例使用基数10000与频率1、0.01，二者在正文和图注中明确区分。数值实验验证相同内容向量的共同位置平移；距离0、2、6、12的点积为1、1/2、−1、1，用来限制“距离越大匹配越小”的泛化。

Cross-Attention 固定两个 Query，按 S=3、2、1 改变可读取条件。S=3 权重分别为 (1/2,1/4,1/4)、(1/4,1/2,1/4)，输出为 (1.5,1.5)、(1,2.5)；S=2 重新归一化后输出变为 (4/3,4/3)、(2/3,8/3)。代码对照实际删 Key 与 Softmax前 Mask，并用 Autograd验证 S=1 时 Q/K 该路径梯度为零、Value梯度不为零。

注意力协方差推导、Q/K/V矩阵反向、多头表达式与Softmax秩反例、SwiGLU两路Jacobian、Pre/Post-LN梯度差异、布尔可达性递推、分块Softmax归约均保留。只补充关键变量定义、同一案例的张量定位和必要图示，不用新的高级术语替代原有机制讲解。

## 六张原创可编辑图

所有图为原创 SVG，带 viewBox、title、desc、正文 alt/caption 与来源链接；图源位于 content/figures，引用地址为 /assets/figures。每张图使用 afterParagraph 放在对应解释之后，不为加图拆分章节。

| 文件 | 教学问题 | 对应关系与限制 |
|---|---|---|
| transformer-attention-flow.svg | Attention 投影、头轴与读出形状 | 本章原创数据流图，按 [Attention Is All You Need §3.2](https://arxiv.org/abs/1706.03762) 的核心计算绘制，并标出本案例新增的 RoPE。图为完整前向；缓存时 Query 长度与 Key 长度需分别代入。 |
| transformer-preln-case.svg | 两层教学模型与单层 Pre-LN 数据流 | 本章原创结构图。图中的位置、形状与代码页 TinyLM 一致；为保持可读性省略 Dropout 和 Padding 清零，源码保留二者。Pre-LN 的归一化位置参照 [Xiong et al.](https://proceedings.mlr.press/v119/xiong20b.html)，不是原论文 Encoder–Decoder 的复刻。 |
| transformer-rope-pairs.svg | RoPE 的二维旋转与相对位置 | 本章原创数值示意，机制参照 [RoFormer §3.2](https://arxiv.org/abs/2104.09864)。π/6 是便于手算的单频率，完整模型采用 1、0.01 两组频率；图不表示任意上下文或长距离点积具有单调不变性质。 |
| transformer-two-layer-reachability.svg | 两层 Mask 的间接泄漏路径 | 本章原创布尔可达性示意，与现有 layerwise-information-flow 实现中的反例逐项对应；灰色虚线只示意恒等边，其他合法连接为清晰起见未全部画出。有路径不保证当前 Jacobian 非零；具体数值由代码同时以导数、有限差分与输入扰动检查。基本因果约束来源：[Attention Is All You Need §3.1](https://arxiv.org/abs/1706.03762)。 |
| transformer-cross-attention.svg | 不同 Query 如何读取同一组条件 | 本章原创矩阵算例，数值由本节 PyTorch 代码逐项验证。机制参照 [Attention Is All You Need §3.2.3](https://arxiv.org/abs/1706.03762)。图省略 Batch、Head 和输出投影，只隔离非方形读出及上下文长度的影响。 |
| transformer-original-encoder-decoder.svg | 原论文 Encoder–Decoder：Post-LN | 依据 [Vaswani et al. §3.1–3.5](https://arxiv.org/abs/1706.03762) 原创重绘。图采用原论文 Post-LN、正弦位置相加与两组六层堆叠；与本章两层 Pre-LN/RoPE 的 decoder-only 实例分开。为突出结构省略 Dropout 和具体 FFN 宽度。 |

六图已通过 XML 解析、Inkscape 渲染与联系表目视检查；两条 Pre-LN 残差路径还进行了原尺寸复核。浏览器桌面/移动端阅读由主代理的全站 QA 完成，此子任务未声称浏览器页面已验收。

## 代码与公式验证

实际执行全部 7 个标为 runnable 的正文示例、3 个完整实现和6个练习答案+测试，共 **16/16 通过**。未独立执行的局部片段显式标注 codeKind=fragment，并在 codeExplanation 写明依赖及完整实现位置。原有手写MHA/Pre-LN题的官方前向与全部梯度对照仍通过。

全专题 **320** 个独立或内联数学表达式经与站点相同的 KaTeX 严格解析，错误0。此项检查证明 TeX 可渲染，不替代人工数学审查；数值例子的数学结论另由对应代码验证。

课程 JSON SHA256：`adbd231ec69c8e66e47c1097a3d0833161456ffee4582428b43dde0e1500ab9a`。

| 可执行对象 | 退出码 | 秒 | 被执行源码 SHA256 |
|---|---:|---:|---|
| section-tokens-and-axes | 0 | 1.136 | `dbef94d79671747f9a56f4efb5dff7af6fb7fe3ea283286ea6e92d56b74f919b` |
| section-scaled-attention | 0 | 1.622 | `cff3a58a51b17e964e82f47c4c271012e44a77dc1f5d630d8e92707e19405e72` |
| section-ffn-and-gating | 0 | 1.679 | `d6e08eaf3499875294dea5bdf46d2bd6b0a75c23ae1a222e0c4a7cbe61071abd` |
| section-position-and-rope | 0 | 1.668 | `9b138a156f8cf8a7bca5d1c31a150996f3c0f95c3443aa3da91ec7f62cc99774` |
| section-visibility-patterns | 0 | 1.622 | `d213511d3c4156b13f6d779bcd97840b2ea6ba656ca6ad420019be1a51f46ae1` |
| section-cross-attention | 0 | 1.501 | `c04a28baa6ae29c7a663c32d35aaa282b6da60bee4347235776b4acb9ad2a2c0` |
| section-cost-and-inference | 0 | 1.62 | `d9a7a2a49d28fd915bc69c61b77fb871de02b6f825a38f598e400ca8dcf73ccf` |
| implementation-manual-mha | 0 | 1.715 | `3df66264bd55d13dabef6108751cc81c58a0b61972c272203f4d499cea26a8e3` |
| implementation-tiny-causal-lm | 0 | 2.527 | `0da3dcab68271f8533b41f2e94c9f0ca03b5644044e5d93a1c8a4ca99ed5f4d6` |
| implementation-layerwise-information-flow | 0 | 1.553 | `ea1e80a9a9b3aefdd0936a803f2399ba24bacd50b494cfcada7baf1e75c109f2` |
| lab-visibility-mask | 0 | 0.011 | `172de7e6942ed70a16f5460780368b227dbcd6a126dbec38325d34de0043eeb4` |
| lab-safe-masked-attention | 0 | 1.527 | `7e452098ea72dfb34bc45adbeb4feead073282ebd6b4ced3698acd985ee915b3` |
| lab-cache-offset | 0 | 1.675 | `10a03b2192177b2e5b65a4e13155b8cd578cf0967e30dcab3cb84e9254cc85de` |
| lab-multihead-self-attention | 0 | 1.555 | `c1aaf3df2de14a20cbc86998aef69605ba1f901b18f8675478ab36ef0e0499ab` |
| lab-pre-ln-transformer-block | 0 | 1.556 | `e436bf9b00e8f16fee55881aa44d33d5e4d1c38d624dbcd9d26c0b18c58a0ad0` |
| lab-rotary-position-offset | 0 | 1.665 | `09e45e32e6cf2a164e7a5b2356e1bba5f436ae6f33d2dfca2a55bcef974575f5` |

原始 stdout、实际运行版本、每张SVG的SHA与尺寸保存在 `reports/case-transformer-validation.json`。

## 一手资料核对

- Vaswani et al., [Attention Is All You Need](https://arxiv.org/html/1706.03762v7)，§3.1–3.5：原论文子层顺序、Post-LN、Encoder–Decoder Cross-Attention、正弦位置编码。原图未复制，按这些机制重新绘图。
- Su et al., [RoFormer](https://arxiv.org/html/2104.09864v5)，§3.2.1–3.2.2：二维旋转、多频率配对与相对点积。未把论文总体距离性质扩大为逐样本单调保证。
- [PyTorch 2.15 SDPA官方文档](https://docs.pytorch.org/docs/2.15/generated/torch.nn.functional.scaled_dot_product_attention.html)：True为允许、显式Dropout参数、非方形is_causal的左上角对齐；与本文缓存偏移分析一致。
- [Xiong et al.](https://proceedings.mlr.press/v119/xiong20b.html) 用于Pre-LN结构来源，与原论文Post-LN分开。

## 尚未覆盖与边界

本次没有新增生产级GQA、分页缓存、变长连续批处理、EOS策略或长上下文RoPE缩放；它们不属于本附件要求的同一最小机制验证。未删除成熟问答与练习，不把新案例扩展为另一个题库。未新建重复Mask交互；已有交互/既有可达性代码与新静态图承担不同职责。资产复制、下载打包、文章图形插入渲染和站点发布由主代理集成。
