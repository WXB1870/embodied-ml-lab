# 神经网络基础与 MLP / CNN 教材审查及修改报告

> 集成记录：编写阶段的 `content/revisions/neural.json` 已合并到最终作者源文件，临时替换文件已移除。以 `content/curriculum.json` 及其 sourceFiles / theoryTopic 指向的内容为准。以下保留分工审查时的过程记录；最终整站结果见 `textbook-audit.md`。

## 交付范围与状态

本次实际修改 `content/topics/mlp.json`、`content/topics/cnn.json`，并在 `content/revisions/neural.json` 提供 5 个完整 lesson 替换对象：`residual`、`normalization`、`activation-init`、`mlp`、`cnn-receptive-field`。未直接修改共享的 foundations / architecture 文件，未修改目录、构建脚本、dist、部署或提交。

保留全部旧 topic 小节 ID；已有基础课的数字 ID 保持不变。新增小节为 Residual 的 `jacobian-product`、MLP 的 `constructive-approximation`、CNN 的 `architecture-design`。MLP 和 CNN 专题均从 10 个小节调整为 11 个。它们分别集中承载一条完整证明或设计分析，没有拆为额外浅层课程。

正文、数学定义、问答、完整示例、练习参考答案及测试均已审查。所有相关完整示例与参考答案，以及新改的可独立执行片段，共 **37 / 37 项**通过实际 CPU 执行。**36 / 36 条显示公式**通过本地 KaTeX 严格渲染；10 组完整示例的注释行范围全部有效。详情见 `neural-validation.json` 与 `neural-formulas.json`。

## 逐篇审查与实际修改

### Residual

原内容已有较好的反例、尺度讨论、Pre/Post Norm、投影旁路、detach 与冻结的区别，不应重写成浅层概述。本次保留了这些有效内容，补齐以下缺口：

- 从输入微分推导 `dx_next=(I+J_F)dx`，再由损失内积解释反向转置的来源；区分输入梯度与 `J_F,theta` 产生的参数梯度，说明旁路并不直接给每个参数增加一个恒等项。
- 分析多层 Jacobian 的乘积顺序与不交换性，展开两层的恒等项、单分支项与交叉项；明确这一代数展开不等于训练独立模型集合。
- 在每层分支算子范数小于 1 的条件下推导整体奇异值上下界；说明固定小扰动仍可能随深度指数累积。保留非正规矩阵的反例，避免用特征值替代奇异值。
- 显式写出 Pre-Norm 的 `I+J_F J_N` 与 Post-Norm 的 `J_N(I+J_F)`，说明求值点及最终 Norm 的影响；不把 Pre-Norm 当成任意任务的稳定保证。
- 区分 `1/sqrt(L)` 的不相关增量方差动机与 `1/L` 的最坏情形算子控制。统一算子界使用有限 L 的正确界，没有将极限 `exp(-C)` 当作每个有限 L 的下界。
- 说明投影旁路是矩形矩阵时，基于恒等方阵的界不能直接套用，降维还有秩的限制。
- 用共享分支权重、共享读出头及相同前缀层初值的普通/残差对照替换原完整演示。原 Pre/Post Norm 演示保留为该正文小节内的独立实验，没有丢弃。
- PyTorch 练习增加非零线性分支的完整输入 Jacobian 对照，能识别 Norm 位置、矩阵顺序或 detach 的错误；原 Python 有限差分练习保留。

受控实验固定 width=12、深度 2/8/24、tanh 激活、两种 alpha、同一数据、同一输出 VJP 探针、同一 AdamW 配置和 100 次更新。传播指标与任务损失分别测量，避免不同初始误差混淆 Jacobian 比较。正文报告实际观察，而不把它们包装为普遍保证。

### Normalization

原内容已经覆盖统计轴、有偏/无偏方差、LN/RMS 不变方向、BN Buffer、train/eval 与冻结边界。本次主要补全推导链条与验证强度：

- 用去均值投影 P，逐步微分均值、中心化向量、总体方差、标准差与归一化输出，解释分子和分母两条导数路径。
- 给出含仿射参数的 VJP，区分最后一维 mean 与共享 gamma/beta 在批次及 token 轴上的 sum。
- 保留并解释共同平移严格消失、尺度方向只在 epsilon 可忽略时近似消失；常量行输出为零，但 Jacobian 为 `P/sqrt(eps)`，不是零矩阵。
- 对 RMSNorm 同样推导分母的导数；明确正缩放带来的 `eps/a^2` 修正、负缩放的方向翻转、仿射前后结论边界。
- 明确 BN 训练时在同一通道内跨样本/时间耦合的 Jacobian，以及固定运行统计下 eval 的对角 Jacobian；`track_running_stats=False` 不适用固定统计结论。
- 完整代码独立核对 LN 前向及 x/gamma/beta 三组梯度、RMS 的 VJP、常量行 Jacobian、BN 前向总体方差与运行统计无偏方差、批次干预响应。
- 练习测试覆盖普通行、小方差行、常量行及不同批次干预，能够抓住“前向一样但统计量被 detach”的实现。

### 激活与初始化

原 He 推导已正确保持二阶矩，而非错误宣称方差严格保持；原 ReLU/SiLU/GELU、fan 朝向和零分支分析保留。

新增 Xavier 的前向、反向尺度需求及二者的折中推导，进一步从均匀分布方差求出初始化边界。解释小信号、独立性、宽度和增益条件，避免将它与 He 常数混为一谈。

修正“相同入边必定获得相同更新”的潜在误解：完全的参数交换对称性还需出边与其余计算保持对称。仅入边相同、出边不同，反向上游信号仍可能打破对称。

新演示先比较三种解析导数与 Autograd，再用相同标准正态权重方向比较两种尺度。无偏置 ReLU 的正齐次性提供精确可检验关系；初始化后的二阶矩则是随机有限宽观察。二者的结论强度在正文中明确区分。

### MLP

原专题的批量反向传播、手算前向、完整 Autograd / 有限差分核验、参数化影响优化、输出损失语义、Mask 池化、训练恢复与诊断内容质量较高，予以保留。

新增一条有限宽构造性证明：

1. 给定区间及递增节点，计算相邻线性插值斜率。
2. 用斜率差乘 ReLU hinge，使导数跨节点发生指定变化。
3. 显式写出 1→K→1 网络的全部参数，说明仅在指定区间内使用第一段 ReLU 代替线性项。
4. 从三零点函数与两次 Rolle 定理得到插值余项，再推导 C² 函数的最大误差界 `M h^2/8`。
5. 对 x² 的均匀节点，推导精确最大误差 `1/(4K^2)`，同时核对节点值和区间导数。
6. 说明一维紧区间、光滑性和准确节点值的条件，以及存在性、SGD、有限数据和外推之间的区别。

新增完整实现 `constructive-spline` 和练习 `relu-spline`。练习使用非等距节点、负坐标、独立线性插值参考、区间内部导数、参数量和无效输入，服务于上述证明而非堆积 API 示例。

另将基础课中关于普通 Python 列表、ModuleList、在 forward 里重复建层的具体解释补入专题训练链路；基础课只修正文案，不删代码与练习，由主代理统一并入权威文章。

### CNN

原专题包含有价值的内容：跨通道互相关、分组卷积秩限制、稀疏支持及路径计数、混叠反例、Patch 投影可逆性、空间期望双峰歧义、转置卷积是伴随而非逆。全部保留。

新增或深化：

- 从第 q 个窗口最右采样点必须落在补边输入内的不等式推导输出尺寸，覆盖左右不对称 padding、floor 与有效核跨度。
- 从上一层覆盖区间的两端与间距推导感受野递推，解释为什么必须先使用旧 j 再更新 stride。
- 将基础课独有的采样中心 a 纳入专题，与 r/j 同时定义，规定原图像素中心从 1/2 开始。用左右补边分配不同、输出形状完全相同的例子验证一像素中心偏移。
- 修正基础课旧表述：“偶数核或非对称 padding 会产生半像素偏移”过于笼统。现在分别说明偶数有效跨度可能出现半像素中心，不对称补边改变原点，偏移应由公式确定。
- 用 VGG 小核堆叠、ResNet 瓶颈、MobileNet 空间/通道分离和 ConvNeXt 模块解释设计选择；推导参数量，不罗列榜单或未经验证的性能结论。
- 分析 stage 内高宽减半、通道加倍时参数、激活和主要乘加量为何不同步变化；说明量级估计的假设。
- 通过 904 参数的教学模块检验 NCHW/NHWC、逐位置 Linear 与 1×1 Conv 等价、梯度及零末端投影恒等关系。明确其省略 LayerScale、stochastic depth、偏置和 Norm 仿射，不能冒充完整 ConvNeXt。

## 基础课与专题去重映射：建议主代理整合方式

建议 MLP 和 CNN 各保留单一权威文章。以下基础课正文已有对应的较完整专题段落，不应再整段附加一遍。

| 原基础课主题 | 权威专题已有/新增位置 | 实际应保留的独立材料 |
|---|---|---|
| MLP 仿射/非线性与参数化 | `affine-nonlinearity`、新增 `constructive-approximation` | 不保留重复正文 |
| MLP 前向、形状、参数量 | `shapes-parameters`、`forward-by-hand` | 基础的 8→32→2 SiLU 合成回归，作为另外一个训练实验 |
| MLP 反向与参数注册 | `backpropagation`、`training-loop` | 参数注册具体解释已补进专题，无需再次附加 |
| MLP 输出激活与损失 | `objectives` | 原手写 ReLU MLP 前向 Python 练习保留为起步练习 |
| MLP 池化、顺序和信息瓶颈 | `tokens-readout` | 基础等长全有效序列分类练习与专题 Mask 读出练习条件不同，可同时保留并说明适用输入 |
| MLP 初始化、拟合、泛化 | `initialization-scaling`、`diagnosis` | 无须再复制整段概述 |
| CNN 互相关、尺寸、groups | `local-correlation`、`spatial-shape`、`groups-depthwise` | 原手写单卷积循环演示便于理解索引，可保留作为起步实验 |
| CNN r/j/a、跨度与支持集 | `receptive-field` | a 的独有推导及错位反例已正式补入专题；基础 7×7 梯度支持实验仍有独立教学用途 |
| CNN 理论/局部梯度、混叠 | `receptive-field`、`equivariance` | 不重复理论文字 |
| CNN 空间表示与 patch | `activation-pooling`、`patch-embedding`、`spatial-readout`、新增 `architecture-design` | 不重复理论文字 |
| CNN 实现与梯度 | `implementation-checks` | 基础无 groups / dilation 的 Unfold 练习可作引导，专题完整分组实现作进阶；原 Python 逐层几何练习可保留或与专题二维版本统一展示 |

基础代码与练习的任务范围不同，不建议删除有效代码；但文章主体不应维护“基础版”和“专题版”两份重复说明。旧路由和数字锚点由主代理统一兼容。

## 实际验证记录

执行环境为 Python 3、PyTorch 2.15.0+cpu，`PYTHONPATH=/tmp/embodied-torch`，CPU 单线程。

- 5 篇基础课完整演示及各自两个参考答案：15 项通过。
- MLP/CNN 的全部完整实现与练习参考答案：12 项通过。
- 自包含的理论片段：10 项通过，包括旧 Pre/Post Norm、LN Jacobian、MLP 参数化、卷积形状、感受野与中心、混叠、现代模块、Patch 可逆性、空间期望、卷积伴随。
- 其他依赖上下文的短 API 说明仅做语法检查，未虚报为独立运行脚本。
- 37 项总 CPU 执行约 50 秒；每项原始 stdout、耗时、通过状态保存在 `neural-validation.json`。
- 36 条显示公式均以 `throwOnError=true, strict='error'` 经本地 KaTeX 验证，结果保存于 `neural-formulas.json`。
- 10 个完整示例的说明行范围均落在真实源码内。
- 两个专题原 20 个 section ID 全部保留；新增 ID 无重复。正文新增内部链接均使用已存在的 lesson ID，由主代理规范化路由。

### 可以引用的本次实验结果及边界

| 实验 | 实测/严格检查结果 | 允许作出的结论 |
|---|---|---|
| 深度 2、alpha=1 的普通/残差配对训练 | 100 步后 MSE 约 0.0585 / 0.0813 | 本配置中残差并非必胜，不能推广为性能排名 |
| 深度 24、alpha=1 的残差输入 VJP | 约 10.47 | 残差仍可放大这一个探针方向的梯度 |
| 深度 24、alpha=1/sqrt(24) | 残差 VJP 约 1.264；配对普通网络约 2.22e−17 | 深度、结构与尺度共同影响传播，不是对全部奇异方向的界 |
| F=−x / 12 层 F=x | 输入梯度为 0 / 放大 4096 倍 | 精确线性反例，反驳任意残差都稳定的断言 |
| LN/RMS/BN | 所有前向、梯度与状态断言通过 | 这些具体数学定义和实现条件一致 |
| x² 的 ReLU 构造宽度 4/8/16 | 最大误差 0.015625 / 0.00390625 / 0.0009765625 | 一维显式插值误差关系，不是优化收敛率 |
| 教学空间/通道模块 C=8 | 904 参数，布局/梯度/恒等断言通过 | 所声明简化结构计算正确，不代表完整模型性能 |

## 主要来源核验

使用原论文、作者官方实现与 PyTorch 官方文档；没有采用私人博客作为理论依据。新增推导均在正文声明假设，单次实验不外推。

- [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)：残差参数化与瓶颈结构。
- [Identity Mappings in Deep Residual Networks](https://arxiv.org/abs/1603.05027)：恒等旁路、直接路径与块内位置。
- [On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)：Pre/Post Norm 的初始化分析范围；不转述为普遍收敛保证。
- [Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467)：RMS 的定义与相对尺度性质。
- [PyTorch LayerNorm](https://docs.pytorch.org/docs/2.15/generated/torch.nn.LayerNorm.html)：统计轴、总体方差、仿射参数和 train/eval 行为。
- [PyTorch BatchNorm1d](https://docs.pytorch.org/docs/2.15/generated/torch.nn.BatchNorm1d.html)：前向有偏方差、运行方差无偏估计、momentum 与 track_running_stats。
- [Glorot 与 Bengio](https://proceedings.mlr.press/v9/glorot10a.html)：前向/反向信号尺度的初始化动机。
- [Error bounds for approximations with deep ReLU networks](https://arxiv.org/abs/1610.01145)：逼近理论的进一步阅读；正文一维线性插值的余项证明已独立展开，不把它冒充论文全部结论。
- [VGG](https://arxiv.org/abs/1409.1556)：连续小卷积核的深层结构。
- [MobileNets](https://arxiv.org/abs/1704.04861)：深度可分离卷积的空间/通道分工。
- [A ConvNet for the 2020s](https://arxiv.org/abs/2201.03545) 与 [官方 Block 源码](https://github.com/facebookresearch/ConvNeXt/blob/main/models/convnext.py)：7×7 depthwise、通道 LayerNorm、4C MLP、LayerScale、stochastic depth 与残差。
- [Understanding the Effective Receptive Field](https://arxiv.org/abs/1701.04128)：理论覆盖与实际贡献的区分；正文不将高斯状有效感受野包装为任意网络的保证。

## 附加只读审查：Score / SDE / Gaussian velocity

根据主代理要求，只读核验 `content/generative.json` 的 `score-sde`，未修改该文件。

核验通过：

- 前向 `dX=f dt+g(t)dW` 的状态无关标量扩散假设明确；Fokker–Planck 的 `g²/2` 系数正确。
- 递减 t 的反向漂移 `f−g²s` 与正向反时钟 tau 的 `−f+g²s` 正确；随机增量协方差使用绝对时长。
- PF ODE 前向为 `f−g²s/2`，反时钟为 `−f+g²s/2`，不能只删除反向 SDE 的噪声项。
- Gaussian 路径的 score、条件 clean/noise 均值和速度公式正确，alpha=0 / sigma=0 的边界与时间转换得到说明。
- VP 的系数化简与平稳标准高斯反例正确；相同边际和相同路径已区分。

发现一处需主代理或生成模型负责人调整的范围表述：`parameterization-bridge` 第三段“任意指定 alpha、sigma 不必对应某个具有非负扩散系数的前向 SDE”过宽。应限定为具有相同 Gaussian 条件加噪核、漂移 `f=(alpha_dot/alpha)x` 的线性前向扩散，此时需要 `g²=2 sigma sigma_dot−2(alpha_dot/alpha)sigma²>=0`。若允许分布相关的状态漂移，在适当正则条件下可取 `f=v+g²s/2` 构造相同边际的 SDE，所以不能否定所有 SDE 的可能性。已即时通知主代理，未越权改写。

核验来源：[Song 等原论文](https://arxiv.org/html/2011.13456v2)，尤其反向 SDE、Eq.13 与 Appendix D；[官方 sde_lib.py](https://github.com/yang-song/score_sde_pytorch/blob/main/sde_lib.py) 中 SDE/ODE 的 1 与 1/2 分支；[Flow Matching 原论文](https://arxiv.org/abs/2210.02747)。

## 尚需主代理集成与验证

- 将 revision 对象按 ID 替换，并把 MLP/CNN 基础代码及练习放入单一文章的不同实验层级；不整段复制重复基础正文。
- 保留旧链接与锚点，统一新增 Markdown 正文交叉引用的渲染与真实路径。
- 对统一 build 后的页面做桌面/移动视觉、搜索、内部链接及抓取正文验证。本代理未执行部署，不宣称公开网站已更新。
- 残差训练表是单个固定合成配置；未测试真实机器人任务，也不需要为本次数学教材修改引入昂贵模型性能基准。
