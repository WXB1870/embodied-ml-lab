# Embodied ML Lab：建议范围与最终课程的覆盖映射

审查日期：2026-11-06。组织依据为 `content/curriculum.json`。本报告按用户七部分的 **63 项建议范围**逐条映射，不把 63 项机械改成 63 个网页，也不把章节数量当作深度证据。

## 一、口径与当前判断

- **已充分覆盖**：在本教材定位内，定义、主要机制/推导、成立条件或常错点有实际正文，且能够联系代码或数值验证；不表示覆盖该领域所有研究分支。
- **边界内合并覆盖**：范围已经由一篇综合课或多篇相邻课共同承担，或按用户明确的教材边界有意收敛；不需要仅为目录名称再建页面。
- **仍有限**：已有相关原理，但用户要求中的一部分尚缺能够支撑完整理解或实验主张的内容，不能靠相关标题视为完成。

初审发现的 **源域到目标域迁移实验缺口已经补齐到可验证的机制层面**：`finetuning` 新增风险与梯度推导，以及从零训练、冻结、LoRA、全量适配和未适配基座的完整受控实验。复核确认正文代码与实际运行记录的 SHA-256 一致，因此第五编第 11 项已调整为“边界内合并覆盖”。实验覆盖单一合成函数下的输入分布偏移与少样本适配，跨机器人、真实 VLA、系统性 OOD 基准和完整强化学习系统仍不在已经验证的范围内。具体证据与限制见第四、六节。

审查使用当前作者源文件；四个核心课程使用 `theoryTopic` 指向的 `content/topics/*.json` 作为唯一权威正文。原基础文件中对应课程只保留代码、练习、课程元数据等，不能用已经移除的基础 sections 代替最终正文。覆盖评价基于正文、小节内公式与对应实现，不代表本报告重新执行了全部代码；运行验证以仓库中的最终验证记录为准。

## 二、从 46 课到 49 课的组织理由

基线提交 `9b78b8dc91e0d0c68c2ebb02498cc3df81752342` 的目录为 **9 编、46 课，另有 4 个与基础课并行的详细专题入口**。当前为 **7 编、49 课，其中 4 课直接采用详细专题的单一正文**。四个专题不是在 49 课以外再增加四套教材。

新增的三个课程 ID 恰为 `latent-variable-models`、`score-sde`、`generative-policy`；原有 46 个课程 ID 没有删除。这三个新增分别补齐生成模型的变分起点、Diffusion/Score/Flow 的连续时间桥梁、以及生成理论到动作策略执行的接口。它们补的是链条断点，其他调整主要是已有内容深化与合并。

| 当前编 | 课数 | 组织依据 |
|---|---:|---|
| 数学与机器学习基础 | 8 | 概率、损失、微分、优化、数值与验证共同构成训练语言；概率的四类建议条目合并讲解。 |
| 神经网络与表示学习 | 5 | MLP、激活初始化、Norm、Residual、CNN 各自具有合理粒度；CNN 架构演进保留在同一权威文章。 |
| Transformer 与多模态模型 | 9 | Attention 到 Transformer，再接 Embedding、视觉与条件、离散接口和缓存。Embedding 与位置编码同章，因此放在本编而非另开第二编重复入口。 |
| 生成模型与连续时间建模 | 4 | VAE、Diffusion、Score/SDE、Flow 四条连续正文覆盖九项建议；保留联系推导，避免按算法名切成浅页。 |
| 模仿学习、策略模型与 VLA 后训练 | 8 | 行为克隆、动作语义/窗口、部分观测、生成式策略、微调与必要 RL 基础衔接。 |
| 数据处理与训练工程 | 11 | 模块状态、数据、循环、恢复与精度/显存/分布式共同解释实际更新；多任务梯度留在此编，但也承担第五编的建议范围。 |
| 策略执行、评估与泛化 | 4 | 四篇综合文章覆盖八项建议；预测/执行窗口的定义前移到动作和策略课，末编集中分布偏移、时序、统计证据及训练部署一致性。 |

四个统一正文的映射为 `mlp → topics/mlp.json`、`cnn-receptive-field → topics/cnn.json`、`transformer → topics/transformer.json`、`flow-matching → topics/flow-matching.json`。原基础演示/练习与专题实现/练习在同一课程的代码或练习页提供；这保留不同难度的验证价值，同时消除双正文维护和两个“原理入口”的竞争。

“泛化”在第一编与末编出现并非两份相同内容：第一编讲数据划分、正则化和验证逻辑；末编讲策略诱导分布、反馈误差、闭环试验与统计结论。工程课程可由正文链接提前调用，不应为使用某个 PyTorch API 而破坏概念前置顺序。

## 三、逐条覆盖映射

下表的反引号先给课程 ID，再给稳定小节 ID；小节 ID 可直接在作者 JSON 中定位。`0`–`7` 等表示该课的相应编号小节，并非跨文件页码。作者文件索引见第五节。

### 01. 数学与机器学习基础

| 建议范围 | 当前权威课程与小节 | 覆盖判断 | 依据与边界 |
|---|---|---|---|
| 张量、矩阵运算与维度分析 | `tensor`：`0`–`7`；`matrix-grad`：`added-0` | 已充分覆盖 | 轴语义、Linear 的最后一维、转置/重排、广播、归约与反向散射均有具体代码。 |
| 矩阵微分、Jacobian 与链式法则 | `matrix-grad`：`0`–`7`；`autograd`：`0`–`1` | 已充分覆盖 | 从逐元素微分到矩阵梯度，包含 JVP/VJP、分支相加、有限差分和更新检查。 |
| 概率分布、条件概率与贝叶斯公式 | `probability`：`0`、`bayes-conditioning`、`added-0` | 已充分覆盖 | 联合/边缘/条件与贝叶斯分母有具体算例；区分概率质量、连续密度和张量轴。 |
| 期望、方差、协方差与高斯分布 | `probability`：`moments-total-variance`、`gaussian-geometry` | 已充分覆盖 | 覆盖总方差分解、多元 Gaussian、Cholesky 白化及联合高斯条件分布；不扩展为完整概率论。 |
| 最大似然估计与常见损失函数 | `probability`：`1`–`2`；`losses`：`0`–`1`；`behavior-cloning`：`1` | 已充分覆盖 | NLL 与固定/可学习方差、条件均值、MSE/L1/Huber 的误差几何及归约联系清楚。 |
| 熵、交叉熵、KL 与信息论 | `probability`：`3`–`5`；`latent-variable-models`：`elbo-derivation`、`gaussian-kl` | 边界内合并覆盖 | 训练所需的信息量、交叉熵、KL 方向与变分下界已连通；不包含编码定理或信道理论，不影响本教材主线。 |
| 梯度下降、SGD、Momentum、Adam、AdamW | `optimization`：`0`–`7`；`matrix-grad`：`added-1` | 已充分覆盖 | 并非只有 AdamW 名词：SGD 方向、动量历史、自适应矩、偏置修正、解耦衰减及实际位移均有解释，AdamW 有手算对照。 |
| 自动微分、计算图与反向传播 | `autograd`：`0`–`7`；`mlp`：`backpropagation` | 已充分覆盖 | 包括冻结与断图、叶子梯度、累积、原地操作、计算图寿命及逐项手算/Autograd 核对。 |

### 02. 神经网络与表示学习

| 建议范围 | 当前权威课程与小节 | 覆盖判断 | 依据与边界 |
|---|---|---|---|
| MLP：结构、表示能力与反向传播 | `mlp`：`affine-nonlinearity`、`constructive-approximation`、`backpropagation`、`training-loop` | 已充分覆盖 | 用 ReLU 构造函数说明表示能力，展开矩阵反传、优化几何与可运行训练；不是只引用通用逼近结论。 |
| 激活函数、非线性与梯度传播 | `activation-init`：`0`–`3`；`mlp`：`activations` | 已充分覆盖 | 解释饱和、失活、平滑门控与导数，不将一种激活的经验表现写成普遍保证。 |
| 参数初始化与训练稳定性 | `activation-init`：`4`–`7`；`mlp`：`initialization-scaling` | 已充分覆盖 | fan-in/fan-out、对称性、零分支与信号尺度相连，并说明统计假设。 |
| 残差连接、梯度传播与深层网络 | `residual`：`0`、`1`、`jacobian-product`、`2`–`4`、`7` | 已充分覆盖 | 包含局部 Jacobian、多层乘积顺序与奇异值界、缩放/初始化、投影旁路及受控网络对照。 |
| BatchNorm、LayerNorm、RMSNorm | `normalization`：`0`–`7`；`transformer`：`block-and-normalization` | 已充分覆盖 | 统计轴、输入依赖、LN/RMS Jacobian、不变方向、BN 运行统计与 train/eval 均有机制解释和数值核验。 |
| CNN：卷积、感受野与特征提取 | `cnn-receptive-field`：`local-correlation`、`spatial-shape`、`receptive-field`、`equivariance` | 已充分覆盖 | 输出尺寸、跨度/支持集/路径数、stride 相位、padding 边界、dilation 与平移等变条件均展开。 |
| CNN 架构演进与视觉特征表示 | `cnn-receptive-field`：`architecture-design`、`groups-depthwise`、`patch-embedding`、`spatial-readout` | 边界内合并覆盖 | 以 VGG、ResNet、MobileNet、ConvNeXt 比较空间/通道混合、参数量和梯度路径；不单独编写模型家族史。 |
| Embedding、特征空间与表示学习 | `embeddings`：`0`–`7`；`contrastive-pretraining`：`0`–`6`；`multimodal`：`4`–`5` | 边界内合并覆盖 | 查表梯度、位置身份、图文对齐与压缩信息保留合并到第三编。此处改变目录归属，没有删去建议范围。 |

### 03. Transformer 与多模态模型

| 建议范围 | 当前权威课程与小节 | 覆盖判断 | 依据与边界 |
|---|---|---|---|
| Attention：数学推导与计算机制 | `attention`：`0`–`2`；`transformer`：`qkv-projections`、`scaled-attention` | 已充分覆盖 | Q/K/V 双线性匹配、协方差缩放假设、Softmax Jacobian 与 Q/K/V 反向路径都有推导和对照。 |
| Self-Attention、Cross-Attention 与 Mask | `transformer`：`mask-contract`、`visibility-patterns`、`padding-and-empty`、`cross-attention` | 已充分覆盖 | 区分输入可见位、Loss Mask、全遮蔽行和不同 API 布尔语义；两层反例验证间接泄漏。 |
| Multi-Head Attention 的结构和作用 | `transformer`：`heads-and-output`；`attention`：`3` | 已充分覆盖 | 不仅拆分轴：用多个输入相关读取矩阵解释多头作用，说明固定宽度下的容量交换与非保证。 |
| 位置编码、RoPE 与相对位置信息 | `embeddings`：`2`–`6`；`transformer`：`position-and-rope` | 已充分覆盖 | 置换等变性、多频编码、相对旋转、缓存偏移及不同时间轴明确分开。 |
| Transformer Block、残差与归一化 | `transformer`：`block-and-normalization`、`ffn-and-gating` | 已充分覆盖 | Pre/Post Norm Jacobian、FFN 输入顺序、ReLU 局部映射与门控路径形成完整计算链。 |
| Encoder、Decoder 与自回归建模 | `transformer`：`encoder-decoder-families`、`teacher-forcing-and-loss`；`tokenizer-autoregressive`：`1`–`6` | 已充分覆盖 | 区分模块名称与条件概率分解，并行动作查询/去噪不被错误描述为语言式自回归。 |
| KV Cache、推理机制与计算复杂度 | `kv-cache-inference`：`0`–`7`；`transformer`：`kv-cache`、`cost-and-inference` | 已充分覆盖 | 历史表示不变条件、非方形 Mask、逻辑位置、GQA/MQA 容量、整段/增量等价及分块 Softmax 已覆盖。 |
| ViT 与视觉 Token 表示 | `multimodal`：`1`–`5`；`cnn-receptive-field`：`patch-embedding` | 边界内合并覆盖 | patch 投影、二维位置/视角身份与压缩限制充分连接；没有重复建立只罗列 ViT 架构的页面。 |
| 视觉、语言和状态融合 | `multimodal`：`3`；`conditioning-fusion`：`0`–`7`；`transformer`：`reading-vla-code` | 已充分覆盖 | 特征/token 拼接、Cross-Attention、FiLM/AdaLN、时间条件与梯度干预都有具体机制和边界。 |

### 04. 生成模型与连续时间建模

| 建议范围 | 当前权威课程与小节 | 覆盖判断 | 依据与边界 |
|---|---|---|---|
| 生成建模的目标与概率表示 | `latent-variable-models`：`generative-objectives`、`latent-marginal` | 已充分覆盖 | 先定义分布、密度、采样和条件变量，再进入不同训练目标。 |
| VAE、潜变量与变分推断 | `latent-variable-models`：`elbo-derivation` 至 `conditional-latents` | 已充分覆盖 | ELBO 间隙、Gaussian KL、观测模型、重参数化与后验坍缩形成连续链条。 |
| Diffusion 前向、反向与 DDPM | `diffusion`：`0`、`1`、`posterior-derivation`、`variational-objective`、`5` | 已充分覆盖 | 一步加噪、后验配方、轨迹 ELBO 到带权噪声目标、反向均值方差与最后一步都展开。 |
| DDIM、噪声预测与采样机制 | `diffusion`：`2`–`6`、`added-0` | 已充分覆盖 | 明确非相邻时间更新、输出参数化换算和损失权重不自动等价，避免把 DDIM 写成任意删步 DDPM。 |
| Score Matching 与分数函数 | `score-sde`：`score-definition`、`score-matching`、`denoising-identity` | 已充分覆盖 | 区分状态梯度与参数梯度，推导分部积分及边际 Score/条件噪声恒等式。 |
| Flow Matching：概率路径与速度场 | `flow-matching`：`what-flows`、`probability-path`、`linear-path`、`conditional-expectation` | 已充分覆盖 | 从样本路径、连续性方程到平方回归条件期望和边缘速度场，不止直觉描述。 |
| Conditional Flow Matching 与 Rectified Flow | `flow-matching`：`conditional-expectation`、`endpoint-coupling`、`diffusion-rectified` | 已充分覆盖 | 条件监督、端点耦合、直线路径与 Reflow 的作用及条件明确区分；不把所有 Flow 等同于同一实现。 |
| ODE、SDE 与数值采样 | `score-sde`：`forward-sde`、`reverse-sde`、`probability-flow-ode`；`flow-matching`：`ode-solvers`、`conditional-mixture-experiment` | 已充分覆盖 | Fokker–Planck、反向漂移与 1/2 系数，以及 Euler/Heun、NFE 和学习误差/积分误差分离均有推导或实验。 |
| Diffusion、Score 与 Flow 的联系和区别 | `score-sde`：`parameterization-bridge`、`what-is-equivalent`；`flow-matching`：`diffusion-rectified` | 已充分覆盖 | 区分相同边际、不同样本耦合、训练权重、模型估计误差及有限步算法，不宣称方法无条件等价。 |

### 05. 模仿学习、策略模型与 VLA 后训练

| 建议范围 | 当前权威课程与小节 | 覆盖判断 | 依据与边界 |
|---|---|---|---|
| MDP、策略表示与行为克隆 | `partial-observability`：`0`–`1`；`returns-bellman`：`0`–`1`；`behavior-cloning`：`0`–`1` | 边界内合并覆盖 | Markov 性、观测与状态、策略条件、转移后的奖励与 Bellman 关系分布在三课；无需另建重复 MDP 术语页。 |
| Behavior Cloning 的目标及局限 | `behavior-cloning`：`1`–`7`；`distribution-shift`：`0`–`3` | 已充分覆盖 | 似然、条件均值/多峰退化、条件使用、访问分布偏移及最坏误差累积的假设均解释。 |
| 动作空间、坐标系与动作表示 | `action-representation`：`0`–`6`、`added-0` | 已充分覆盖 | 命令/状态、SE(3) 组合、旋转、归一化几何、分箱和恢复锚点配套解释。 |
| Action Chunking 与 ACT | `action-chunk`：`0`–`6`；`generative-policy`：`act-conditional-latent-model` | 边界内合并覆盖 | 窗口/执行协议与 CVAE 模型分别讲解；L1、KL、z=0 和 Temporal Ensembling 的边界已补足。 |
| Diffusion Policy 训练与推理 | `generative-policy`：`diffusion-policy-objective`、`receding-horizon-protocol`；`diffusion` | 边界内合并覆盖 | 理论由生成课程负责，策略课明确条件、[B,H,D] 目标、有效位、调度器与执行切片；不声称复现完整官方机器人基准。 |
| Flow-based Action Policy | `generative-policy`：`flow-policy-time-conventions`、`oracle-experiment-derivation`；`flow-matching`：`chunk-masking`、`action-units` | 边界内合并覆盖 | 目标符号、反向时间、条件缓存、动作尺度与有限步数接口齐全；解析策略实验有明确边界。 |
| VLA 整体架构 | `behavior-cloning`：`added-0`；`generative-policy`：`conditional-action-distribution`；`transformer`：`reading-vla-code` | 边界内合并覆盖 | 将条件组织、共享/独立模块和动作生成家族分开；不把 π₀、ACT 或某个离散 VLA 当通用架构。 |
| VLA 条件编码与动作生成 | `conditioning-fusion`：`0`–`7`；`generative-policy`：`conditional-action-distribution` 至 `flow-policy-time-conventions` | 已充分覆盖 | 前缀、Cross-Attention、调制与动作输出的张量及梯度路径可追踪。 |
| SFT、LoRA、PEFT 与参数高效微调 | `finetuning`：`objective-and-parameterization`、`0`–`6` | 已充分覆盖 | 监督目标与参数化区分；低秩形状、首步梯度、冻结、合并、保存恢复与显存解释充分。PEFT 其他家族仅作范围说明。 |
| 强化学习基础及后训练作用 | `returns-bellman`：`0`–`6`、`added-0`；`policy-gradient`：`0`–`9` | 边界内合并覆盖 | 回报/价值、终止/截断、GAE、策略梯度与 PPO 目标提供所需基础；完整 PPO/SAC/IQL/CQL 系统被明确列为后续范围。 |
| 多任务训练、迁移与泛化 | `multitask-gradients`：`0`–`7`；`finetuning`：`5`、`transfer-risk-and-gradients`、`controlled-transfer`、`6`；`generalization`：`0`、`6`–`7` | 边界内合并覆盖 | 共享梯度与任务采样之外，现有完整源域预训练→目标域适配对照，分别测量训练拟合、目标探针和源保持，并验证固定特征下的精确二次风险变化。范围限于单函数输入偏移；不据此声称跨机器人迁移或真实 VLA 泛化。 |

### 06. 数据处理与训练工程

| 建议范围 | 当前权威课程与小节 | 覆盖判断 | 依据与边界 |
|---|---|---|---|
| 机器人数据集结构与 Episode 表示 | `data-quality`：`0`–`3`；`dataloader`：`0`、`2`–`3`；`train-infer-contract`：`end-to-end-experiment` | 边界内合并覆盖 | 记录/回合/会话身份、时间、有效位与窗口有实际代码，综合例真正从 Episode 构建训练样本；未穷举 RLDS/LeRobot 等格式转换。 |
| 多模态时间同步、采样率与对齐 | `action-chunk`：`0`–`2`；`vision-preprocessing`：`6`；`execution-latency`：`0`–`1` | 边界内合并覆盖 | 因果截止、源时间、传感器不同频率与实际命令时间分开，归入动作语义与执行时序避免重写。 |
| 状态/动作归一化与反归一化 | `action-representation`：`4`–`6`；`numerical`：`1`–`2`、`7`；`data-quality`：`4` | 已充分覆盖 | 损失/梯度几何、单位变化、有效统计、常量维、异构机器人维度、往返和部署恢复均有解释。 |
| 清洗、数据质量与分布偏差 | `data-quality`：`1`–`4`、`6`；`generalization`：`1` | 已充分覆盖 | 重复来源、时间错位、缺失、离群/恢复行为、监督冲突与过滤后分布联系起来，而非经验规则列表。 |
| 采样、混合策略与数据增强 | `dataloader`：`1`、`3`–`5`；`data-quality`：`5`–`6`；`generalization`：`4`；`vision-preprocessing`：`2`–`7` | 边界内合并覆盖 | 已有 p/q 无偏条件、自归一化偏差反例、逐记录任务权重、Worker 随机性和图像/标签/多视角几何；核心没有实质空白，物理增强库与完整增强策略搜索不在首期。 |
| Loss 设计、权重分配与梯度行为 | `losses`：`0`–`7`；`multitask-gradients`：`0`–`7`；`probability`：`6` | 已充分覆盖 | 固定/可学习权重、商法则、分母、参数共享坐标、真实更新与局部夹角边界都有数学和数值证据。 |
| 混合精度、梯度累积与显存优化 | `mixed-precision`、`gradient-accumulation`、`memory-checkpointing`：各完整课程；`distributed-training`：`1`、`4`–`5` | 已充分覆盖 | 按正确全局目标、AMP 缩放顺序、裁剪、重计算与资源组成组织；CUDA/多进程验证限制单独披露。 |
| LoRA 与全量微调的计算和显存 | `finetuning`：`1`、`4`；`memory-checkpointing`：`0`–`4` | 边界内合并覆盖 | 参数量、优化器状态、激活与冻结反传分开，不宣称可训练比例等于总显存比例；未冒充硬件吞吐 benchmark。 |
| NaN、梯度、欠拟合、过拟合诊断 | `training-diagnostics`：`0`–`7`；`numerical`：`3`–`6`；`generalization`：`2`–`3` | 已充分覆盖 | 从样本/Mask 到数量级、None/零/非有限梯度、参数未更新、小数据拟合，再到训练验证差异形成排除假设的流程。 |
| 实验配置、随机性与可复现性 | `checkpoint`：`0`–`7`、`added-0`；`training-loop`；`modules`；`dataloader`：`4`–`5`；`train-infer-contract`：`end-to-end-experiment` | 已充分覆盖 | 模型/优化器/统计量/RNG/游标/配置身份与更新边界均覆盖，综合例包含实际新进程恢复；不把单个 seed 当作全环境可复现保证。 |

### 07. 策略执行、评估与泛化

| 建议范围 | 当前权威课程与小节 | 覆盖判断 | 依据与边界 |
|---|---|---|---|
| 动作序列生成与闭环执行 | `generative-policy`：`receding-horizon-protocol`；`train-infer-contract`：`end-to-end-experiment` | 边界内合并覆盖 | 生成、反归一化、消费动作和重新观测在合成系统中完整连通；不包含机器人低层控制百科。 |
| Receding Horizon 与动作重规划 | `action-chunk`：`3`–`5`；`generative-policy`：`receding-horizon-protocol`、完整实验 | 已充分覆盖 | H/K 区别、时间原点、锚点和更新条件有解释；受扰动 K=1/K=4 例隔离反馈时机。 |
| 推理频率、执行频率与系统延迟 | `execution-latency`：`0`–`6` | 已充分覆盖 | 源时间、ready/execute、队列、时钟、过期/乱序/任务版本和耗尽故障注入均有具体机制。 |
| 推理步数、质量与计算成本 | `flow-matching`：`ode-solvers`、`conditional-mixture-experiment`；`generative-policy`：`oracle-experiment-derivation`；`execution-latency`：`0`–`2` | 边界内合并覆盖 | 区分 N、NFE、离散化误差与学习场偏差；闭环质量须结合时延/成功率测量，不由二维生成距离直接推断。 |
| 离线评估与在线任务成功率 | `evaluation`：`0`–`4`；`generalization`：`6` | 已充分覆盖 | 评价分布、成功判据、分母、macro/micro、独立单位、Wilson 与配对差值均明确。 |
| 分布外泛化、鲁棒性与误差累积 | `generalization`：`0`–`1`、`4`、`6`–`7`；`distribution-shift`：`0`–`7`；`partial-observability`：`6` | 边界内合并覆盖 | 新条件/组隔离、捷径、扰动恢复、BC 最坏累积界及 DAgger 已解释并有合成反例；未完成真实或仿真多因素 OOD 基准，也无跨机器人泛化实证。 |
| 消融、对照与结果分析 | `evaluation`：`4`–`6`；`distribution-shift`：`6`；`generalization`：`7` | 已充分覆盖 | 配对抽样、预算/调参范围、控制变化、失败清单、重复测试与选模偏差均有实质讨论。 |
| 训练目标、验证指标与部署表现的差异 | `evaluation`：`0`；`generalization`：`2`、`6`；`train-infer-contract`：`0`、`4`–`6`、`end-to-end-experiment` | 已充分覆盖 | 同时解释不同单位/目标、训练-验证模式、采样与执行协议以及策略改变访问分布；不把更低训练 MSE 等同于更高成功率。 |

## 四、重点区域复核：实际缺口与有意边界

### 1. 评估与泛化：课程数量少，核心范围并不缺失

`evaluation` 七个小节不仅介绍成功率，还明确试验总体、失败分母、macro/micro、独立试验单位、训练与评估随机性、Wilson 区间、保留配对的 bootstrap、预算与调参范围、重复测试和选择偏差。配套代码实际计算成功率区间和配对差值，练习实现 Wilson 与多任务汇总。

`distribution-shift` 从零示教误差但反馈漂移的反例出发，推导 O(T²ε) 上界所需的离散动作/代价条件，说明不能直接把连续 MSE 代入；再介绍 DAgger 的采集分布、专家标签、聚合目标及保证边界，并给出保留扰动下的数据聚合训练实验。`generalization` 已解释新场景/物体/指令/机器人的主张、按组隔离、捷径、增强语义与验证选择偏差。

因此，不应把“末编只有四课”列为需要再建八个页面的缺陷。**仍然有限的是经验覆盖的广度**：目前没有真实或仿真机器人中的系统性物体×场景×指令组合留出评估，没有跨机器人迁移或接触动力学泛化实证，也没有用于支持大范围鲁棒性保证的数据。这些不能从二维积分器或一维 DAgger 例外推。

若继续深化，最有价值的小规模补充是在现有 `evaluation` / `generalization` 内给出一个明确的因素划分表和分层重采样算例，区分“新取值”与“已见取值的新组合”。不必因此新增 OOD 算法百科或独立实验管理功能。样本量/功效设计、等效性检验、多重比较校正等也只做到了原则层面，属于后续统计深挖，而非本轮所有条目的空白。

### 2. 多任务、迁移与能力保持：受控迁移实验已补齐

`multitask-gradients` 已完整解释共享坐标、固定 λ 的梯度叠加、一阶任务关系、零范数、Adam 预条件、缺失标签、采样概率与权重的共同作用。代码验证真实双头梯度和确定性抵消，正文明确负余弦不是长期负迁移的证明。这部分不是浅层术语清单。

初审时，`finetuning` 的主要实现用于初始化、首步 A/B 梯度、参数量与合并等价，尚不能支持完整迁移训练的覆盖判断。当前新增 `transfer-risk-and-gradients` 与 `controlled-transfer`，保留原有实现，另提供完整实验：同一回归真函数、两个高斯输入域、相同标签噪声，512 条源样本预训练 900 步，再用同一份 48 条目标样本分别适配 600 步；两域各有独立的 2,048 条干净探针。

从零、冻结骨干、LoRA r=1 加读出、全量适配的可训练参数分别为 1185、33、131、1185。三条预训练适配路线从相同函数起步；从零路线有意使用预训练前的随机初始化。实验同时保留未适配基座，实际目标探针 MSE 约为 0.001519；四条适配/训练路线依次为 0.008821、0.001861、0.003059、0.003689。这一次观测中预训练路线优于从零，但继续适配没有优于基座，正文没有删除这一不利于“微调必然有益”的结果。

三条预训练适配路线的源探针误差均高于基座。代码检查冻结权重逐位不变、LoRA 首步/第二步梯度、实际增量秩与参数变化；风险分析使用 Adam 真正执行的位移。固定特征、线性读出的源 MSE 变化进一步验证为“一阶项 + 非负二次项”，首步等式误差约 3.7×10⁻⁹。这些证据把参数不变、低秩更新、训练拟合、目标泛化与旧域保持区分开，补足了局部梯度诊断之外的训练链条。因此 **第五编第 11 项改为“边界内合并覆盖”**。

限制继续保留：两个域共用同一条件真函数，只改变输入分布；这不是跨机器人或不同动作语义之间的迁移。源保持指标包含读出变化，不能全部解释为骨干表征遗忘。固定一个种子、相同目标步数与学习率也不等于各方法最优调参、等 FLOPs 或相同总训练成本，预训练另有 900 步预算。探针只用于诊断与报告，没有据此早停选模；真实项目仍需独立目标验证与事先约定的源保持规则。完整证据见 `reports/transfer-experiment.md` 和 `reports/transfer-experiment-validation.json`。

### 3. 采样、增强和 Loss 权重：已有可验证机制，无需重复建课

`dataloader/1` 已推导 p/q 重要性加权的支撑条件和无偏目标，并用 Batch=1 的例子解释“除以当前权重和”一般不是同一无偏估计。`data-quality/5` 把任务目标概率转换为逐记录权重 p_k/n_k，并讨论轨迹/窗口层级、放回抽样和稀少任务曝光不等于新数据。`multitask-gradients/5` 将采样与任务权重联系起来。

`losses/4` 不仅讲固定权重，也展开可学习归一化权重的商法则，指出降低难例权重可以改变目标而非改善原任务；`losses/1`、`2`、`7` 和累积/分布式课程共同说明有效分母与全局统计。这里没有“缺少 Loss 权重讲解”的实质空白。

增强由 `generalization/4` 的标签保持假设、`vision-preprocessing/2`–`7` 的坐标/内参/多视角与多帧一致性、`dataloader/5` 的随机性组成，并有几何变换与关键点往返代码。**没有完整实现随机多模态增强管线，也没有增强策略搜索或仿真域随机化基准**，这些是实现广度的限制，不能写成已完成；但用户要求的基础机制与常错点已经在合理粒度内覆盖。后续若补，优先做共享随机几何参数的多帧/标签一致性小实验，而不是再列几十种增强名称。

### 4. 其他有意边界与验证限制

- RL 当前覆盖回报、价值、GAE、策略梯度与 PPO 目标，未交付完整 PPO/SAC/IQL/CQL 训练系统；这是目录已声明的边界，不应为了“全面”无差别扩展。
- 生成式策略课没有复现完整 ACT/DP/VLA 机器人 benchmark；解析场和一次参数更新的用途已写清。Flow Matching 专题的二维多峰学习实验确实训练网络，并区分学习场误差与数值积分误差，两种证据不能混用。
- 数据集记录语义已经覆盖，但没有逐格式实现 RLDS、LeRobot 和不同设备日志的导入器。教材不是机器人数据转换工具箱。
- 混合精度/DDP/资源分析有代码与原理，但 CPU 验证不能替代所有 CUDA 内核、分布式通信或硬件性能测量。环境阻塞项应在最终运行报告中保留，不能被覆盖矩阵抹去。
- CNN 架构史、复杂记忆/世界模型、分片训练内部机制及完整机器人控制理论保持后续范围，与用户“不追求百科和额外交互功能”的要求一致。

## 五、当前作者文件与 49 课索引

目录总表：`content/curriculum.json`。最终输出的课程数据为 `dist/data/lessons.json`；其中四个 `theoryTopic` 课程的 sections、附加代码和练习由下述专题源在组装时注入。此处列作者路径，便于下一次维护时修改真正的来源。

| 作者路径 | 当前课程 ID |
|---|---|
| `content/foundations.json` | `tensor`, `matrix-grad`, `probability`, `mlp`, `activation-init`, `autograd`, `losses`, `optimization`, `numerical`, `generalization` |
| `content/architecture.json` | `normalization`, `residual`, `attention`, `transformer`, `embeddings`, `multimodal`, `modules`, `dataloader`, `training-loop`, `checkpoint` |
| `content/vla.json` | `behavior-cloning`, `action-representation`, `action-chunk`, `diffusion`, `flow-matching`, `finetuning`, `data-quality`, `evaluation` |
| `content/foundations_p0.json` | `gradient-accumulation`, `mixed-precision`, `training-diagnostics`, `memory-checkpointing`, `distributed-training`, `multitask-gradients` |
| `content/architecture_p0.json` | `cnn-receptive-field`, `contrastive-pretraining`, `tokenizer-autoregressive`, `kv-cache-inference`, `vision-preprocessing`, `conditioning-fusion` |
| `content/vla_p0.json` | `partial-observability`, `distribution-shift`, `returns-bellman`, `policy-gradient`, `execution-latency`, `train-infer-contract` |
| `content/generative.json` | `latent-variable-models`, `score-sde` |
| `content/policy-models.json` | `generative-policy` |

四个权威正文源：

| 统一课程 ID | 权威正文路径 | 保留的基础课程来源 |
|---|---|---|
| `mlp` | `content/topics/mlp.json` | `content/foundations.json` 中的代码、基础练习与元数据 |
| `cnn-receptive-field` | `content/topics/cnn.json` | `content/architecture_p0.json` 中的代码、基础练习与元数据 |
| `transformer` | `content/topics/transformer.json` | `content/architecture.json` 中的代码、基础练习与元数据 |
| `flow-matching` | `content/topics/flow-matching.json` | `content/vla.json` 中的代码、基础练习与元数据 |

相关审查与执行证据：

- `reports/textbook-transformer-policy.md`、`reports/textbook-generative.md`：深化内容、来源与实验边界。
- `reports/textbook-transformer-policy-validation.json`、`reports/generative-code-validation.json`、`reports/neural-validation.json`：相应实现的实际运行记录。
- `reports/root-inline-validation.json`：基础概率、标准化及综合训练执行等新增代码验证；最终应结合 `validation.json` 核对源码版本。
- `reports/transfer-experiment.md`、`reports/transfer-experiment-validation.json`：源→目标受控迁移的协议、全部路线曲线、机制断言、实际输出和正文源码哈希。
- `reports/prerender-validation.json`：正文静态生成结果；内容覆盖和页面可索引性是不同的验收维度。

## 六、补齐记录与最终状态

### 迁移实验补齐的复核记录

已阅读 `content/vla.json` 中 `finetuning` 的两个新增小节、完整实验代码以及两份迁移实验报告。正文 `controlled-transfer.code` 的 SHA-256 为 `f43bf5cc45b3cc446ec660fcb203112b320e3d13ba200a900f365ef18701155f`，与 `transfer-experiment-validation.json` 的成功记录完全一致。该记录使用 PyTorch 2.15.0+cpu、FP32、单线程，数据/模型构建、源预训练、四条目标训练及机制检查合计约 2.36 秒，不含导入时间；本次覆盖复核没有重复运行训练。

复核确认：实验没有把源探针梯度交给优化器，没有按探针选取最优 checkpoint，也没有断言某种微调方法必胜；保留了“未适配基座更好”和“冻结/低秩仍可能源域退化”的结果。第五编第 11 项不再保留“尚无完整受控迁移实验”的待办，63 项建议在已经声明的教材范围内均有明确落点。

这一完成状态表示内容与可验证机制链条得到覆盖，不表示 63 项各有独立完整研究基准，更不表示真实机器人、跨机器人泛化、所有 OOD 条件或全部强化学习算法已经复现。第四节列出的经验覆盖、工程平台与验证环境边界继续有效。

本文件只记录审查结果，不新增课程、改变路由或为潜在扩展作额外功能设计。
