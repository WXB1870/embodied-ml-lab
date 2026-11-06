# MLP、CNN 与训练工程：审查及实施记录

## 范围与结论

以 `0035390787417ffcd51de4ec0ec5636579853082` 为审查基线。本分工覆盖 27 门既有 canonical 课程（不重复计算 MLP/Transformer 的 topic 与代理），合计 238 个理论小节。Transformer 正文的独立审查与改写由对应分工负责，本报告只计一次其课程身份。所有既有课程与理论小节导言仍完整。

主要缺口为 B/D：成熟局部推导较多，但缺少同一组参数、数据和训练状态的连续追踪。本轮没有将所有课程统一扩写；成熟的 Residual、Normalization、卷积秩、感受野支持与反向证明均保留。

## 27 门课程逐项分类

| Canonical ID | 分类 | 处置与理由 |
| --- | --- | --- |
| tensor | A | 维度语义、广播、视图/复制及有效池化已有独立数值与梯度检查；无需再造端到端模型。 正文、代码、练习保持。 |
| matrix-grad | A | VJP/JVP、链式法则、秩/零空间与有限差分连接完整，具有可执行参照。 正文保留；独立片段标记 runnable 并复验。 |
| probability | A | 条件分布、全期望/全方差、高斯条件化及条件均值的成立条件已展开。 理论、例题与练习保留；独立片段标记 runnable 并复验。 |
| mlp | A/B/D | 通用反向、样条表达能力与初始化已成熟，但正文的 2→2→1 手算与 manual-backprop 的 2→3→2 不同，数值链被打断。 统一现有 17 参数模型的前向、损失、五组梯度、SGD；增加计算图和数值表，保留成熟推导、其余实现和练习 ID。 |
| activation-init | A/B | 激活导数、二阶矩与方差区别、对称性和初始化假设已成熟，需明确与完整 MLP 的对应。 保留推导；链接同一 MLP 的 ReLU 门与偏置扰动，避免另造案例。 |
| autograd | A/B | 计算图、冻结与 no_grad、VJP 和高阶梯度已有有效对照；需要把局部求导放回完整更新。 链接 MLP 的前向—VJP—梯度—更新链；保留原实验。 |
| losses | A/D | MSE/NLL、有效集合、加权分母和 NaN 梯度均已解释，工程分母需要与数据与累积共用。 正文指向共同项目 masked_error_sum；成熟目标与安全选择推导保留。 |
| optimization | A/B | SGD 方差、Momentum、Adam 偏差修正、AdamW 与裁剪边界已充分，不宜平均扩写。 引用同一 MLP 的旧参数点梯度与 SGD 数值更新；其余原理与实验保留。 |
| numerical | A | 尺度改变目标权重与 Hessian 的解释充分，包含数值稳定边界。 保留归一化与条件数实验；独立片段标记 runnable 并复验。 |
| generalization | A | 划分单位、选择偏差、增强等变关系与评估分母已形成连续解释。 不新增模型与图示，保留。 |
| normalization | A | LN/RMSNorm Jacobian、epsilon 条件、BN 状态与跨样本依赖已深入且有导数核对。 保留；现有独立公式验证标记 runnable 并复验，CNN 仅连接 GAP/BN 边界。 |
| residual | A | Jacobian 乘积、奇异值/非正规例子、零初始化与 Pre/Post-Norm 的假设清楚。 保留成熟推导及公平梯度对照，不用贯穿案例取代它们；独立片段复验。 |
| attention | A/B | QKV 双线性匹配、方差缩放、Softmax 梯度、矩形 Mask 的推导成熟；完整模型位置交由 Transformer。 保留 Attention 专章；数值片段复验。连续多层模型与图示由 Transformer 分工补足，不复制专章。 |
| transformer | A/B/D | 已有 QKV、SwiGLU Jacobian 与多层 Mask 理论成熟；完整两层案例、RoPE 与 Cross-Attention 图示由专门分工审查改写。 本分工核对代理实现/练习，添加 embeddings 前置；完整 topic 变更与核验见 case-transformer 报告，仅计一个 canonical course。 |
| embeddings | A/B/E | Embedding 梯度、位置/生成时间区别及 RoPE 恒等式已有完整机制；原前置引用 Transformer 与教学顺序相反。 前置改为 attention、tensor；缓存作为后续应用链接，Transformer 再以前置 embeddings 连接。 |
| multimodal | A/E | 多模态接口、条件路径与表示瓶颈已成熟；视觉预处理应先于本课。 增加 vision-preprocessing 前置与正文链接；保留接口内容，不复制 CNN 的 Patch 秩分析。 |
| modules | A/D | 注册、Buffer、梯度与优化器成员的区分充分，需对应完整训练对象。 定位共享 TokenRegressor 的四组统计 Buffer 与参数；修正已有示例说明为 8 维输入/4 维输出。 |
| dataloader | A/D | 采样分布、collate、有效数和泄漏已有完整解释，组批后的实际更新仍需贯通。 链接同一 ToyEpisodes/collate_episodes，说明 190 个有效标量与尾批更新；旧练习保留。 |
| training-loop | A/D | 原有更新边界、归约与评估机制成熟，但各节工程实验相对独立。 复用 Linear(4,2) 建立单一 full source；Dataset→累积→CPU BF16→更新→评估→epoch 恢复→故障诊断，新增流程图与函数定位表。 |
| checkpoint | A/D | 模型/优化器/RNG/EMA/数据游标论述成熟，已有单步恢复需与真实 DataLoader 状态连接。 保留旧案例，链接共同项目下一整轮顺序、梯度路径、指标和状态逐项恢复；明确 epoch_end、workers=0 范围。 |
| gradient-accumulation | A/D | 同一参数点、共同分母、裁剪与随机前向等价条件解释完整。 保留原对照；链接同一七条 episode 的 10/30 有效计数控制组和 SGD 梯度/参数等价。 |
| mixed-precision | A/D | 指数/有效数字、autocast、scaler 单位与局部高精度位置的推导充分。 链接同模型 FP32/CPU BF16 梯度与实际更新；不宣称 CUDA、性能或通用误差界已验证。 |
| training-diagnostics | A/D | 已有推理式证据链、小样本冲突标签下界及参数身份诊断成熟。 同一共享模型构造漏 bias 优化器、Padding/有效 NaN 两类单因素干预；保留成熟诊断论证。 |
| memory-checkpointing | A | 状态与激活内存分账、逻辑保存量与实际峰值区别、重算副作用已充分。 不添加第二个共享模型或 GPU 估算结论；原代码/练习保留。 |
| distributed-training | A/D | 全局分母推导、Sampler、no_sync、日志归约和控制流已有完整说明。 连接共享 S_r/N_r 到默认 DDP 的 R*S_r/N，明确真实 Gloo 仍 environment_blocked，单进程数学对照不能替代通信测试。 |
| multitask-gradients | A | 任务梯度叠加、局部点积与长期效果区别成熟；审查发现有限坐标的直接点积/范数乘积可溢出。 两种语言的原练习改为独立尺度化求余弦，拒绝非有限合成，加入 1e200/1.7e308 反例，保持题目索引及核心目的。 |
| cnn-receptive-field | A/B/D/E | 分组秩、感受野支持集、BN/激活/池化已有深度；几何、参数与梯度未在同网串起，Patch/空间头边界可更明确。 沿现有 SmallCNN 追踪形状、参数、MAC、r/j、GAP 梯度和局部支持集；增加结构图，保留高级推导，Patch/空间读出用跨课链接定位。 |

## 三个贯穿案例

### MLP：同一 2→3→2 模型的完整计算

复用 `manual-backprop` 的 B=3、17 参数模型，统一正文、手算、Autograd 与一次 SGD。输入梯度与四组参数梯度逐元素核对；隐藏矩阵使用 Z/A，隐藏宽度使用 H，避免符号冲突。半均方损失为误差平方和除以 12；实际从 0.09279166666666665 下降到 0.08276880316466285（学习率 0.1，固定本例）。所有四组参数由同一旧参数点的梯度同时更新，输入 X 不更新。该案例通过正文链接连接自动微分、激活/初始化和优化器，不重复复制实现。

### CNN：现有 SmallCNN 的空间与梯度链

保留已有 Conv(3→8)→ReLU→Conv(8→12)→ReLU→GAP→Linear(12→2) 网络。逐层表格和代码核对 1126 参数、每样本 155544 MAC，明确 MAC 不含偏置、激活、池化和反向，不能据此推断实际延迟。两个卷积保持 12×12，理论感受野依次 3、5，累计 stride 都为 1。对第二层内部位置验证 5×5 窗外输入梯度严格为零；分类损失经 GAP 则联系整张图，各位置得到通道梯度的 1/144。网络没有 BN，局部支持验证不被训练统计的全局依赖改变。原 100 步训练与 Patch 投影数值等价检查继续保留。

Patch 投影和空间期望章节不删 ID：说明它们是后续视觉表示/空间读出的边界，链接相应课程；SmallCNN 的 GAP 分类路径不被错误画成空间坐标头。

### 训练工程：单一源码的最小训练项目

完整源码只在 `training-loop.extraImplementations[shared-training-project].source` 保存，仓库 runner 读取执行这一字段。复用 Linear(4,2) 的 10 参数模型；变长 ToyEpisodes、NaN Padding、训练集拟合统计 Buffer、有效集合选择、DataLoader、累积、CPU BF16、完整更新、验证和 epoch 恢复共享相同契约。原独立练习保留，用于检验各个局部机制。

| 检验 | 实际结果与含义 |
| --- | --- |
| 不等有效计数累积 | 10/30 共用分母 40；梯度最大误差 2.22e−16，参数最大误差 2.78e−17；错误地平均局部 mean 产生 0.5084 梯度偏差。 |
| CPU BF16 | 输出 BF16、参数/梯度与 Loss 归约 FP32；相对梯度误差约 0.00230；真实执行了一步 BF16 路径更新。只对应固定模型。 |
| 完整恢复 | 第 3 epoch、12 update 保存；不中断与恢复后的下一整轮样本顺序、指标、模型、优化器、调度器完全一致，均到 16 update。 |
| 数据与更新边界 | 每轮 190 个有效标量；7 个微批组成 4 次更新，最后一个不满累积窗口被正确处理。 |
| 诊断 | bias 有非零梯度却未进 optimizer，实际位移为零；无效区 NaN 安全且输入梯度为零，有效标签 NaN 主动拒绝。 |
| 独立合成验证 | 固定协议训练 96 update，归一化验证 MSE 从 1.9309675886824325 降至 0.00014952807120878147；只说明当前合成线性任务可学习。 |

## 数值修正与代码类型

审查发现多任务余弦练习直接使用 dot/(norm×norm) 时，有限坐标也可在中间运算溢出；标准库的边界截断可能掩盖 NaN。现改为分别按最大绝对值缩放两个向量，再计算单位方向点积，并拒绝非有限合成。新增 1e200 相反方向、1.7e308 方向保持与合成溢出反例。题目 ID、索引和原本的梯度合成目的保持。

29 段正文独立片段经过隔离进程执行并明确标记 `runnable`。MLP 两段依赖外部变量的示意代码标记 `fragment`，列出所需导入或张量；未把局部伪代码冒充完整脚本。

## 三张原创 SVG

- `content/figures/mlp-computation-chain.svg`：把同一 17 参数模型的前向、Loss、五组反向量与同步 SGD 更新连接；形状/参数/数值对应 manual-backprop。
- `content/figures/cnn-small-network.svg`：同一 SmallCNN 每层形状、参数/MAC、r/j 与局部 5×5 梯度支持；区分局部感受野和 GAP 后全图依赖。
- `content/figures/training-state-lifecycle.svg`：同一数据/有效集合的 S,N 如何穿过累积、精度、更新、评估及 epoch 边界恢复。

SVG 已通过 XML 解析、Inkscape 渲染和逐张目视检查，训练图两处过长标签已缩短。图中的参数、形状、感受野、分母与代码一致；没有使用外部论文原图或装饰图片。

## 验证与兼容性

- 本分工独立代码验证：34/34 通过（29 段正文代码、3 个贯穿实现、2 个修正练习）。逐项 SHA256、标准输出、耗时及环境写入 `case-networks-training-validation.json`。
- 公式：1353 次渲染检查、1132 个不同公式；错误 0，未标记候选 0。两处新增表格公式已使用显式 inline TeX。
- 所有原 section ID、topic implementation ID、lab ID 及问题数量/索引均保留；没有移除已有课程路由。
- 前置调整：embeddings 依赖 attention/tensor；Transformer 增加 embeddings；multimodal 增加 vision-preprocessing。实际目录排序由主分工统一处理。
- 框架行为核对来源为 PyTorch 官方 AMP、AMP Examples、DataLoader 和 Randomness 文档。

## 验证范围与待外部环境验证

- 真实 DDP/Gloo 通信仍为 environment_blocked；未用单进程对照冒充通过。
- CPU BF16 只证明当前固定模型的数值路径，不代表 CUDA FP16/GradScaler 跳步、GPU 吞吐或显存验证。
- 共同 checkpoint 验证限定同环境、epoch_end、num_workers=0、无数据增强/预取，不能声称任意中途或跨环境逐比特恢复。
- 本分工只完成 SVG 桌面图像目视检查；移动/桌面网页、内部路由、全站回归由主分工整合验证。
- CNN 的合成条纹成功率仅检查学习链路，不代表实际视觉/机器人泛化；MLP 单步降损不是对任意学习率的保证。

本分工内容已完成；上述硬件/通信与跨环境恢复边界不会写作已验证结果。网页渲染、链接和完整回归由主分工统一生成报告。
