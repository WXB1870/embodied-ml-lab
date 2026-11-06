# Transformer 与生成式策略：审查、改动和验证

> 集成记录：编写阶段的 `content/revisions/transformer-policy.json` 已合并到最终作者源文件，临时替换文件已移除。以 `content/curriculum.json` 及其 sourceFiles / theoryTopic 指向的内容为准。以下保留分工审查时的过程记录；最终整站结果见 `textbook-audit.md`。

本报告对应 `content/topics/transformer.json`、`content/revisions/transformer-policy.json` 和 `content/policy-models.json`。未修改目录、构建脚本、发布产物或部署设置。现有基础课的三个完整替换对象放在 revisions 文件中，由主代理统一整合。

## 1. 审查结论

原 Transformer 专题已经具有相当深度：Q/K/V 学到的双线性匹配、逐项注意力反传、安全 Mask、Pre/Post Norm Jacobian、FFN 门控、RoPE、Teacher Forcing、缓存偏移和分块 Softmax 都有实质内容。两份完整实现与三项练习具备有效断言，不应整体重写。需要修补的是统计假设的推导步骤、多头建模范围的边界、架构名称与生成机制的区别，以及多层信息依赖的可运行反例。

原策略课程对动作窗口、行为克隆、LoRA、部分可观测性和策略梯度已有完整内容。缺口位于生成理论与策略执行之间：ACT 的 CVAE 机制没有作为一个完整模型讲清，Diffusion/Flow 的目标、时间方向、条件编码和闭环切片也缺少一个统一对照。新增一篇生成式策略课可以连接这些内容，无需为每个算法再建浅层页面。

| 审查对象 | 处理决定与依据 |
|---|---|
| `attention` | 保留。投影、缩放、反传与维度约定已有基础；更完整统计推导集中到权威 Transformer 正文。 |
| `transformer` 基础课 | 建议与专题合并正文。保留最小 Block 演示、Prefix Mask 标准库练习和 PyTorch Block 练习。 |
| Transformer 专题 | 保留原 15 个小节 ID、2 份实现与 3 项练习；定点扩展，增加 1 个架构小节和 1 个多层信息流实现。 |
| `embeddings` | 保留。离散索引、嵌入梯度与表示空间已有实质内容；不重复创建 Token 入门页。 |
| `multimodal` | 保留 ViT patch、位置/视角身份、跨模态投影、压缩与冻结分析；修复池化练习的 NaN Padding 边界。 |
| `tokenizer-autoregressive` | 保留。词表、移位与动作 Token 接口应继续承担离散动作分解的解释。 |
| `conditioning-fusion` | 保留。条件路由、拼接/Cross-Attention/调制和梯度路径已有深度，新课引用。 |
| `kv-cache-inference` | 保留。缓存条件、历史偏移与推理边界已有内容；专题新实验提供第二层前缀缓存反例。 |
| `behavior-cloning` | 保留似然推导、均值退化、条件方差和闭环偏移；修复 PyTorch 练习先计算平方再屏蔽的问题。 |
| `action-chunk` | 保留。窗口起点、边界、参考锚点与重叠预测的物理时间对齐已有完整解释。新课引用并连接具体算法。 |
| `action-representation` | 审查后交由主代理继续扩展；本代理没有替换或编辑。 |
| `finetuning` | 保留 LoRA 梯度初始化、权重合并、显存与恢复验证；补 SFT/BC 与 PEFT/LoRA 所属层面的区别。 |
| `partial-observability` | 保留。历史条件和不可观测性已经解释动作多模态的来源，不再另建重复页面。 |
| `policy-gradient` | 保留。明确 Flow/Diffusion 的回归 MSE 不是动作 log-prob，这个边界不能在新策略课中丢失。 |

## 2. Transformer 具体深化

### 缩放与反向传播

将“点积方差随维度增长”展开为独立零均值向量的协方差推导：`Var(qᵀk)=tr(ΣqΣk)`。单位协方差只是得到 `d` 的特例；Self-Attention 中相关的 Q/K 和训练后的分布不必满足独立假设。同时补商法则推导 Softmax Jacobian、共同平移零方向和 one-hot 极限。原矩阵反传与手写 Autograd 对照保留。

### 多头的建模范围

将输出写为 `Σh Ah X Bh`，说明不同头提供不同输入相关的读取矩阵；所有 `Ah` 相同时可以合并位置混合。明确固定总宽度时增加头数会缩小单头维度，未归一化 `QKᵀ` 的低秩不能直接推到 Softmax 后矩阵，也不保证每头学到独立语义或头数增加必然改善效果。

### 架构、信息路径与缓存

新增 `encoder-decoder-families`，区分 Encoder、Decoder-only 自回归、Encoder–Decoder 自回归与并行动作查询/去噪。说明“Decoder”名称不等同于自回归；源序列双向与目标端因果并不冲突。ViT 的空间身份和多模态融合引用现有专门课程。

`visibility-patterns` 加入带残差自边的布尔可达性递推，解释“没有路径”与“有路径但当前梯度为零”的不同证据强度。新实现 `layerwise-information-flow` 使用两层手写注意力、逐 token LayerNorm、残差和 FFN，检查完整 token Jacobian、有限差分和输入扰动；随后比较第二层前缀 K/V，而不只比较容易保持固定的第一层原始投影。

基础 `transformer` 课唯一值得补到权威正文的细节是：FFN 必须读取已经完成注意力残差更新的表示，两个分支不能无意中都读取同一个旧 x。此句已补入专题 `block-and-normalization`。基础演示和练习仍有独立教学价值，建议按主代理的合并方案保留。其余基础数学机制均被专题覆盖。

## 3. 新增 `generative-policy`

课程标题为“生成式动作策略：ACT、Diffusion 与 Flow”，包含七个连续小节，而不是三个重复生成模型推导的页面：

1. 条件动作分布、VLA 模型家族及 O/H/K/N 的不同含义。
2. ACT 的 CVAE、对角高斯 KL、重参数化、L1 似然解释和推理 z=0 的边界。
3. Diffusion Policy 的联合动作去噪、条件信息、有效监督位和采样参数化。
4. Flow Policy 的时间方向、速度 target、ODE 接口、缓存与策略密度限制。
5. Receding Horizon、窗口切片、动作参考语义和反馈时机。
6. 条件高斯解析速度/后验均值的推导，以及采样误差的独立参照。
7. 通过解析替换、学习模型和受扰动闭环逐项诊断训练/执行问题。

原理前置使用 `behavior-cloning`、`action-chunk`、`latent-variable-models`、`diffusion`、`flow-matching`。`latent-variable-models` 由生成模型代理提供。目录位置、编号、module 和必要前置的最终精简交由主代理统一处理。

完整 CPU 实验先对 Flow/Diffusion 两个小模型分别进行一次优化，验证条件梯度、有效输出梯度与参数变化；后续明确切换到解析高斯场，分别测试 Heun 和确定性 DDIM，再在受扰动二维积分器中比较不同执行 K。没有将一次参数更新包装为已学会机器人策略。

标准库练习计算 ACT 对角高斯 KL，检查 log-variance 与 log-standard-deviation 的区别；PyTorch 练习构建两种训练对并实现 NaN 安全的有效标量损失，使用端点、内部数值例和手算梯度验证。

## 4. 实际发现并修复的代码问题

`behavior-cloning` 原练习在平方后乘 Mask，无效目标含 NaN 时仍会污染损失，与正文边界解释不一致。改为先对有效标量做布尔索引，再减法和平方；拒绝空监督与有效位置非有限值。测试验证精确导数 `2error/M`，无效预测和标签同时为 NaN 时其梯度仍为零。

`multimodal` 原 masked_pool 使用 token 乘零 Mask，无法排除 NaN Padding。改为求和前 `where` 替换无效位置，按每个样本的有效数量归一化；测试使用不同有效长度，检验 `1/n_valid` 的解析梯度。两处都明确：输出层 Mask 不负责修复上游网络已经受到无效输入污染的问题。

## 5. 论文与官方实现核验

核验日：2026-11-06。实现链接指向上游 main，后续版本可能变化；教材中的一般机制与具体实现惯例分别表述。

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)：缩放点积、多头与 Encoder–Decoder 结构。
- [Vision Transformer](https://arxiv.org/abs/2010.11929)：图像 patch 序列与位置身份。
- [ACT 论文](https://arxiv.org/abs/2304.13705)、[detr_vae.py](https://github.com/tonyzhaozh/act/blob/main/detr/models/detr_vae.py)：确认训练后验编码动作与 qpos，推理分支实际使用零潜变量。不能将某段注释中“sample prior”的措辞误写成实际随机采样。
- [ACT policy.py](https://github.com/tonyzhaozh/act/blob/main/policy.py)：L1、KL 以及在完整张量上平均的 Mask 归约。教材的有效标量均值被明确标为不同归约约定。
- [Diffusion Policy 论文](https://arxiv.org/abs/2303.04137)、[官方图像策略](https://github.com/real-stanford/diffusion_policy/blob/main/diffusion_policy/policy/diffusion_unet_image_policy.py)：核验条件机制、生成整段动作及 `start=To−1` 切片。代码原本不接受通用 valid_mask，本课的有效监督接口是教学实现，并非原仓库逐行复刻。
- [OpenPI π₀](https://github.com/Physical-Intelligence/openpi/blob/main/src/openpi/models/pi0.py)：确认 `t*noise+(1-t)*actions`、`noise-actions`、负时间步长和前缀缓存，避免把论文与代码时间方向混为一谈。
- [LoRA](https://arxiv.org/abs/2106.09685)、[PEFT 官方文档](https://huggingface.co/docs/peft/main/en/index)：核验参数更新机制和 PEFT 上位范围。

## 6. 验证结果

详细可审计结果位于 `reports/textbook-transformer-policy-validation.json`，保存每段执行源码的 SHA-256、退出码、耗时和 stdout；公式检查位于 `reports/textbook-transformer-policy-formulas.json`。

- 11/11 代码运行通过，CPU，`PYTHONPATH=/tmp/embodied-torch`，随机实验固定种子。范围包括 Transformer 三份完整实现、三项练习、新策略实验与两个练习、两项修复后的 Mask 练习。
- 原手写 MHA：前向、六组梯度、禁止位置扰动和 Batch 隔离均通过。
- 原两层语言模型：固定合成任务 CE 由 2.1159 降到 0.0009；因果性、无效 Query 和 Batch 隔离断言通过。
- 新信息流实验：安全未来导数为 0；间接泄漏导数最大绝对分量约 0.0233523；有限差分误差约 1.9×10⁻¹²；前缀 K/V 不变性与反例通过。
- 新策略解析实验：Flow-Heun 的末端 RMSE 为 0.0031192 / 0.0002315（16 / 64 步）；DDIM 为 0.0425212 / 0.0114388。Heun 每步两次评估，不能将这组数值用作同等预算模型比较。
- 受扰动闭环：12 个控制周期，K=1 / K=4 分别重规划 12 / 3 次；扰动后下一命令的目标误差约 0.859409 / 1.063493。仅验证该已声明二维系统的反馈机制。
- 29 个展示公式通过 KaTeX `throwOnError:true, strict:error`；所写文件的字段、唯一 section ID、练习编译和代码说明行号通过检查。

## 7. 保留的边界与后续工作

本子任务没有声称完成真实 ACT、Diffusion Policy 或 VLA 的完整训练复现，也没有报告机器人任务成功率。小网络的一步更新用于接口验证，采样与闭环使用解析场。真实策略的训练规模、网络近似、时延、执行器动力学和泛化需要另行评估。

全站类型/Lint/构建、跨页链接、正文合并后的搜索与可索引性、页面视觉检查和部署由主代理统一完成；本子任务不重复改动这些共享文件。新增正文的内链保留 `#/learn/id` 写法，供统一路由转换。
