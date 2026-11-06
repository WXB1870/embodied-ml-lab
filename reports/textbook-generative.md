# 生成模型课程审查与深化

> 集成记录：编写阶段的 `content/revisions/generative.json` 已合并到最终作者源文件，临时替换文件已移除。以 `content/curriculum.json` 及其 sourceFiles / theoryTopic 指向的内容为准。以下保留分工审查时的过程记录；最终整站结果见 `textbook-audit.md`。

## 审查结论

原有 Flow Matching 专题在连续性方程、条件期望、Gaussian 边际场、端点耦合、时间重参数化、数值稳定性与动作单位方面已经较深入，应保留。主要缺口是：

- 缺少潜变量、边缘似然与 ELBO 的完整入口，Diffusion 的变分目标因此缺少前置论证。
- DDPM 有前向边际和最终反向公式，但没有完整推导 Gaussian 后验，也未实际核对变分 KL 到加权噪声 MSE 的转换。
- Score、SDE、probability-flow ODE 仅在比较段落出现，没有从密度方程建立数学桥梁。
- 原有二维 FM 训练每个条件只有一个 Gaussian 簇；它不能验证同一个条件下的多峰生成，也未用学习场与解析场分别测量积分误差。

## 实际交付

| 文件 | 内容 |
|---|---|
| content/generative.json | 两个完整新课：latent-variable-models、score-sde，各 8 小节，完整示例、两类编程练习、测试、参考答案和原始来源 |
| content/revisions/generative.json | diffusion 和 flow-matching 基础课的完整替换对象；供主代理按 ID 合并 |
| content/topics/flow-matching.json | 保留已有推导，深化 Diffusion/Rectified Flow 联系；新增多峰实验小节和 conditional-mixture 完整实现 |
| content/experiments/fm-mixture-evidence.json | 固定种子真实 CPU 实验的数据、训练曲线、速度网格、路径、样本和误差 |
| content/experiments/fm-mixture-distributions.svg | 初始噪声、目标数据、生成样本 |
| content/experiments/fm-mixture-dynamics.svg | 训练直线、速度场切片、ODE 路径、NFE 与误差 |
| content/experiments/plot_fm_mixture.py | 从同一份实验 JSON 生成标准 Matplotlib 图；没有手工填写点云或曲线 |
| reports/generative-code-validation.json | 本轮 9 个代码验证对象的结果、源码哈希与输出 |
| reports/generative-formulas-validation.json | 对本代理负责的新课、替换课和 FM 专题的 45 个公式块进行严格 KaTeX 渲染，0 错误 |

图的 PNG 是本地视觉核验用输出；建议公开页面使用 SVG。实验小节的 figures 数组使用 assets/experiments/ 下的路径，含中文 alt 与说明。主代理可将 SVG 与原始 JSON 复制到站点目录，也可将原始数据放入下载包。新实验代码默认生成 fm_mixture_results.json；JSON、图和训练代码来自同一轮运行。

## 课程与依赖

- latent-variable-models：依赖 probability、autograd。
- diffusion：依赖 probability、latent-variable-models；解除 action-chunk 和训练工程章节的强制前置，先给通用生成推导，再联系动作。
- score-sde：依赖 probability、diffusion。
- flow-matching 基础：依赖 probability、autograd、score-sde。
- Flow Matching 专题：依赖 probability、mlp、autograd、losses、score-sde；移除对自身基础路由和 action-chunk 的依赖，便于合成权威文章。

新课不使用个人项目或私人案例。

## 重点深化

### VAE / ELBO

从边缘积分写成 q 下期望，逐步使用 Jensen 得到 ELBO；再由后验 KL 推导 log evidence = ELBO + posterior KL，区分先验 KL 与下界间隙。对角高斯 KL 从对数密度和二阶矩计算，而不是直接给最终公式。明确观察维、Monte Carlo 维和 Batch 维的归约顺序。

重参数化解释的是固定基础噪声下的路径导数，示例将 Autograd 与解析期望梯度对照。线性高斯生成模型被有意固定，只训练共享编码器并检查恢复解析后验；不将它描述为高维 VAE 的性能实验。互信息与聚合后验分解用于解释 posterior collapse 的含义与诊断边界。条件 VAE 部分区分训练后验所见的目标与部署时的先验生成路径。

### DDPM / DDIM

从两个 Gaussian 核的乘积展开二次项，得到后验精度、均值和方差；进一步代入前向噪声解释 epsilon 参数化。新增代码核对自然参数、高斯后验和 epsilon 均值三个表达。

从轨迹 ELBO 分解出终端 KL、反向 KL 和重建项，再写出固定反向方差下的时间权重。代码使用与真实后验不同的固定方差，核对 KL = 加权 epsilon MSE + 常数，并比较对预测噪声的梯度。解释 k=0 的退化边界、学习方差时不能删除的项，以及非均匀时间采样的权重。

原有确定性 DDIM 非相邻步实现保留；正文补充 η 参数和 η=1 相邻步与 DDPM 的联系，并明确带噪起点和不裁剪等假设。

### Score / SDE / ODE

Score Matching 从平方目标的交叉项逐步分部积分；DSM 从边际密度求导得到条件 score 的后验期望。噪声回归与 score 回归的 σ² 权重明确列出。

从 Itô 测试函数形式推导 Fokker–Planck，再将扩散项写成散度，得到概率流 ODE 的 1/2 系数。反向 SDE 与 ODE 使用同一前向时间和明确的正反向时钟，避免两次变号。只讨论 g(t) 的各向同性加性噪声特例，不把公式直接推广到状态相关扩散矩阵。

Gaussian 路径的噪声、干净样本、score 和 velocity 从条件均值推导互相转换，说明端点奇异、时间导数和 VP v 参数化的区别。经交叉复核，正文进一步区分了同一 Gaussian 条件核的线性前向扩散与仅要求相同边际的 SDE：g² 非负限制只针对前一种指定结构，不能据此断言一般 SDE 不存在。完整代码在解析 Gaussian 混合密度上验证 score、条件均值、Fokker–Planck 与连续性方程。

### Flow Matching

原有高质量推导保持。扩展 Rectified Flow 的重新耦合定义，并在声明精确场、边际匹配和有限二阶矩的条件后，用两次 Jensen 解释平方运输代价不增；同时说明这不等于最优运输或一步采样保证。

新增实验使用同一个条件下的双峰分布；解析混合边际场通过后验分量责任加权计算。训练直线、实际 ODE 轨迹与瞬时速度网格分开呈现。

## FM 基础课与专题的合并建议

基础课的八节理论均能落到专题已有章节；没有需要保留为独立文章的独有长推导：

| 基础课旧 section | 专题归属 |
|---|---|
| 0 样本路径与分布 | what-flows / probability-path |
| 1 插值与速度监督 | linear-path |
| 2 边际条件期望 | conditional-expectation |
| 3 端点耦合 | endpoint-coupling |
| 4 条件输入和有效监督 | network-conditioning / training-objective / chunk-masking |
| 5 时间方向 | reverse-time |
| 6 Euler 与 Heun | ode-solvers |
| 7 Diffusion 联系与排错 | diffusion-rectified / debugging-workflow |

应保留原基础课的 300 步二维条件 MLP/Euler 演示、标准库 Euler 练习与 PyTorch 练习作为不同实验入口；它们不重复完整理论，但能提供较短的练习难度。所有原专题 section ID 保留，新增条件混合实验使用 conditional-mixture-experiment。旧基础 section 的路由映射由主代理统一处理。

## 实际验证结果

- 两个新课各自的完整示例、标准库参考答案+测试、PyTorch 参考答案+测试：6 项全部通过。
- 两个 DDPM 新增数值片段：Gaussian 配方和 epsilon 均值一致；加权 MSE 与 KL 的值/梯度一致。
- FM 条件混合完整训练：固定种子 20261106，CPU 单线程，1800 更新，约 4.90 秒。
- 图由实际 JSON 生成，并已目视检查两张 PNG：没有遮挡和裁切；网页采用可缩放 SVG。
- 45 处公式块使用本地 KaTeX 的 throwOnError 与 strict=error 检查通过。这个数量包括本代理负责的保留公式，不代表新增了 45 个公式。

FM 一次运行观测：

| 指标 | 数值 |
|---|---:|
| 固定独立探针 MSE，训练前 | 2.493094 |
| 固定独立探针 MSE，训练后 | 1.264147 |
| 解析边际场对随机目标的 MSE | 1.217353 |
| 学习场与解析边际场的 MSE | 0.039038 |
| 学习场 512→1024 步 Heun 的 RMS 差 | 0.000004986 |
| 解析场 1024→2048 步 Heun 的 RMS 差 | 0.000002611 |
| 64 步 Heun 相对学习场细网格的 RMS | 0.000395810 |
| 学习场与解析场细网格终点的 RMS | 0.146887 |

这组结果显示数值误差和场估计误差可以处在不同量级。有限样本分布指标并不随积分步数严格单调，因此课程没有给出“步数越多，生成质量必然越高”的结论。

## 参考核验

- Kingma & Welling, Auto-Encoding Variational Bayes: https://arxiv.org/abs/1312.6114；正文 https://arxiv.org/html/1312.6114v11
- Hoffman & Johnson, ELBO Surgery: https://www.cs.columbia.edu/~blei/fogm/2020F/readings/HoffmanJohnson2016.pdf
- Hyvärinen, Score Matching: https://jmlr.org/papers/v6/hyvarinen05a.html
- Vincent, Denoising Score Matching: https://doi.org/10.1162/NECO_a_00142
- Ho et al., DDPM: https://arxiv.org/abs/2006.11239；正文 https://arxiv.org/html/2006.11239v2
- Song et al., DDIM: https://arxiv.org/abs/2010.02502
- Song et al., Score-Based Generative Modeling through SDEs: https://arxiv.org/html/2011.13456v2
- Lipman et al., Flow Matching: https://arxiv.org/html/2210.02747v2
- Liu et al., Rectified Flow: https://arxiv.org/abs/2209.03003
- PyTorch Distributions: https://docs.pytorch.org/docs/stable/distributions.html

## 边界

本轮没有新增整套通用 SDE 求解器、工业 VAE、Diffusion Policy 或真实机器人性能实验。SDE 使用解析密度恒等式与最小一步练习验证；FM 多峰实验是真正训练的小型模型，结果不外推到真实动作策略。所有一般结论在正文中声明了相应条件；代码断言验证指定行为，不替代完整数学证明或任意输入的系统验证。

## 补充：工程章节只读交叉审查

按主代理要求，逐段阅读 `architecture.json` 中的 modules、dataloader、training-loop、checkpoint，以及 `foundations_p0.json` 中的 gradient-accumulation、mixed-precision、memory-checkpointing、distributed-training；同时检查各课主示例、标准库练习和 PyTorch 练习。未修改这些源文件，避免与主代理的工程课程工作重叠。

未发现需要纠正的核心推导或 PyTorch 主路径错误。现有正文对参数注册与优化器对象、深拷贝快照、有效元素归约、随机状态恢复、AMP 累积边界、非重入重计算以及 DDP 全局分母均给出了必要条件；保留这些内容优于重复扩写。DDP 主示例已明确标记本机通信受限，本轮没有重复尝试被限制的通信，也没有把数学模拟声称为真实双进程运行。

发现一个低优先级标准库数值边界，已交主代理处理：`mixed-precision.exercise.solution` 的 `unscale_and_clip([1e308], 1e-308, 1.0)` 在本环境实际返回 `(inf, [nan])`。输入虽然全部有限，但除以极小 scale 后溢出，随后裁剪产生 `inf * 0`。建议在反缩放后及范数计算后检查有限性并拒绝超出 Python 浮点表示范围的实例，同时明确练习的可表示范围。该问题不影响课程中正常尺度的 AMP 顺序验证；无需增加新章节或重写示例。

另以官方文档复核了容易随 API 演进误写的边界：

- AMP：完整有效批次内保持同一缩放因子；完成累积后才 unscale，且每个优化器每次更新仅一次。https://docs.pytorch.org/docs/stable/notes/amp_examples.html
- Activation checkpoint：显式 `use_reentrant=False`；非重入版本允许输入不需要梯度；默认一致性检查覆盖 shape/dtype/device，不是完整数值相等。https://docs.pytorch.org/docs/stable/checkpoint.html
- DDP：`no_sync` 必须包含前向；默认梯度平均与自定义通信 hook 的归约语义需区分。https://docs.pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html

主代理集成后已修复上文反缩放溢出边界：检查反缩放值与范数的有限性，新增极端输入拒绝测试，`mixed-precision/python` 已实际执行通过。
