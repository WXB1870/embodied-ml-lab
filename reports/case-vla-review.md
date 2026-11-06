# VLA 架构连续案例：研究、编写与验证记录

## 1. 实施范围与状态

本案例新增 `content/vla-architecture.json`，课程 ID 为 `vla-architecture`，置于生成式动作策略之后、微调之前。没有将原有 Flow Matching 推导、动作坐标、LoRA 或评价统计重新复制为一套教程。新课解决原站最明显的连接缺口：视觉语言主干、连续状态、动作专家、联合注意力、训练梯度和生成缓存如何组成同一个可运行的策略。

已完成：11 个连贯理论子节及各节总领段、完整 294 行 PyTorch 模型、2 道带独立断言的编程练习、6 道带代码观察点与验收标准的思考题、3 张原创可编辑 SVG、固定版本官方研究、CPU 数值验证、数学渲染与新课内链检查。

本子任务审查了下表 9 篇既有课程与新课，不能据此声称独立审查了全站所有课程。全站装配、移动端和公开网站验证由主任务统一进行。本子任务没有修改既有课程、目录、脚本或 `dist`，没有提交或发布。

## 2. 既有课程 A–E 审查与章节边界

分类用于描述本次审查结果：A 为已成熟、保留；B 为理论足够但需要连接或实例；C 为重要内容缺失或浅显；D 为多个片段缺少连续案例；E 为重复内容可合并。允许一课有两个标签，不据此机械扩写。

| 既有课程 | 分类 | 阅读发现与处理理由 |
| --- | --- | --- |
| `behavior-cloning` | A | 已从条件似然、MSE 的条件期望推导到条件缺失、协变量偏移和闭环限制。保留统计主线；新增 VLA 课引用其监督目标，不重新教授 BC。 |
| `action-representation` | A | 坐标与相对位姿、旋转参数化、归一化的误差几何和梯度、无效位、动作块锚点已有充分推导及算例。保留；新课将动作视为已统一语义和标准化的张量，并回链到此课。 |
| `action-chunk` | A | 已区分观测历史、预测长度、实际执行长度、锚点、时延与重规划。保留；新课只交代生成动作块到执行器的接口，不扩展控制理论。 |
| `generative-policy` | B、D | ACT/CVAE、Diffusion Policy 与 Flow Policy 的统计建模、训练推理接口及闭环限制较完整；尚缺真实 VLM 主干与多层 action expert 联合运算的完整案例。保留原课，新课承接其条件生成接口。 |
| `finetuning` | A | LoRA 参数化、梯度、训练状态和迁移风险已有详细解释。保留；新课补充 VLA 计算图里的冻结与断图，不重写 LoRA 推导。 |
| `data-quality` | A、E | Episode 独立单位、切分、统计量、采样权重和实际训练风险的机制清楚。发现最后一节两段逐字重复，已交由主任务删除；其余保持原有深度。 |
| `evaluation` | A | macro/micro、独立试验单位、Wilson 推导、配对 bootstrap、消融与选模偏差已有连贯论证。保留；新课实验不把小样本 loss 当机器人成功率。 |
| `conditioning-fusion` | B、D | 条件注入与 token 融合的机制充分，但读者仍需自行拼接到某一真实 VLA。由主任务加入新课链接；新课集中解释联合 softmax 与分别做 cross/self attention 的差别。 |
| `kv-cache-inference` | B、D | 因果缓存、padding、位置和计算图的成立条件已有论证。新增课把证明应用到同一次观测内的多次 ODE 评估，并区分理论上可缓存的状态与当前 OpenPI 实际缓存边界。 |

新增 `vla-architecture` 对应 C、D 缺口。采用单篇 11 子节，而没有拆出“VLA mask”“VLA cache”“VLA gradient”等重复页面。官方模型对比放在基础计算机制之后；知识前置为 Transformer、条件融合、动作表示与生成式策略。

## 3. 新课的连续教学结构

1. 从 VLM 到策略的接口问题：表征条件不等于产生连续控制命令。
2. 图像和语言怎样形成 prefix：patch、视角、词表与有效位。
3. state、noisy action、生成时间如何进入 suffix；对照 π₀ 与 π₀.₅。
4. 两组参数为何能共同注意力：不同隐藏宽度投影到共同 head 空间，沿 token 轴合并后一次 softmax。
5. 三块 Mask 与逐层信息流：prefix、state、action 的读写范围；用归纳说明 prefix 对 noisy action 的独立性。
6. RoPE、动作时间索引与生成时间是不同坐标；解释适应归一化和残差 gate。
7. 训练计算链：标签与噪声构造输入及速度目标、有效位损失、Value 与 softmax 梯度回到主干。
8. 生成计算链：固定前缀的逐层 K/V、变化的 noisy action 与时间、负步长 Euler；缓存失效条件。
9. `requires_grad`、`detach`、`no_grad`、`eval`、优化器参数组和缓存各自改变什么。
10. π₀、π₀.₅、π₀-FAST 的实际差异；区分论文混合训练、公开 flow-only 实现与 KI 的完整训练目的。
11. 将所有模块连成可运行模型，并用能隔离假设的实验验证。

这些子节都有独立导入与衔接。保留完整基本机制后再讨论缓存、冻结和模型族边界，避免在读者尚未理解数据流时先讲特殊情况。

## 4. 官方版本与来源证据

OpenPI 固定为官方提交 [`215abfb217dbac7d5f1273282331b9b1866c0479`](https://github.com/Physical-Intelligence/openpi/commit/215abfb217dbac7d5f1273282331b9b1866c0479)，提交时间为 2026-08-24 16:27:12 UTC。通过官方 GitHub commit 页面、API 与该 SHA 的 raw 文件交叉确认。实际读取的 7 个文件及 SHA-256 写入 `case-vla-sources.json`；没有把可变的 `main` 当成可复现版本证据。

| 官方材料 | 核对内容 |
| --- | --- |
| `src/openpi/models/pi0.py` | `embed_prefix`、`embed_suffix`、`compute_loss`、`sample_actions`：前后缀、状态/时间分支、FM 方向和实际缓存边界。 |
| `src/openpi/models/gemma.py` | 两组独立参数、共同 Q/K/V 空间、GQA 头数、RoPE、AdaRMSNorm、残差 gate 和逐层 cache。 |
| `src/openpi/models/pi0_config.py` | `pi05` 与 `discrete_state_input` 的默认联动；区分默认配置与可覆盖配置。 |
| `src/openpi/models/tokenizer.py` | π₀.₅ 离散状态 prompt、FAST action token 映射与 prefix/postfix。 |
| `src/openpi/models/pi0_fast.py` | 单主干自回归动作 token、错位监督和 CE；没有连续 flow expert。 |
| `src/openpi/training/config.py` | 数据变换与模型配置组合，防止仅从类名推断完整输入协议。 |
| `README.md` | 公开 π₀.₅ 的 flow-only 范围。 |
| [π₀ 官方论文](https://www.pi.website/download/pi0.pdf) | 视觉语言 backbone、action expert、分块 attention 和连续生成的设计。 |
| [π₀.₅ 论文 v1](https://arxiv.org/html/2504.16054v1) | 附录 A–E 的状态 token、AdaRMS、离散/连续混合训练与防止标签泄漏的 mask。 |
| [FAST 论文 v1](https://arxiv.org/html/2501.09747v1) | DCT、量化与 BPE 压缩，动作序列的离散自回归表示。 |
| [Knowledge Insulation 官方研究](https://www.pi.website/research/knowledge_insulation) | 动作专家梯度隔离与主干独立 token 目标的关系。 |

### 版本敏感的解释与修正

- π₀：连续 state 是 suffix 的独立 token；动作与时间编码拼接后经 MLP。π₀.₅ 的默认数据路径将 state 离散化写入 prompt，动作流没有同样的独立连续 state token，时间经 MLP 调制 expert 的 AdaRMSNorm。`discrete_state_input` 可以被具体配置覆盖，故正文使用“默认”，没有把可选配置描述为普遍定理。
- 双 expert 是按 token 类型使用的独立参数组，共同参与 attention，不是只在 VLM 输出后串接一个 action head，也不是学习 top-k 路由的稀疏 MoE。
- 在该源码的默认 Gemma 配置中，两个流宽度为 2048/1024，深度均为 18，query heads 为 8、KV heads 为 1、head dim 为 256。按实际代码说明，没有从论文配置表推断不同版本必然一致。
- OpenPI 使用 `x_t=t*noise+(1-t)*action`、目标 `noise-action`，采样从 `t=1` 积分到 `t=0`。与站内另一种“噪声在 0、数据在 1”的 FM 约定通过 `τ=1−t` 联系，速度符号同时翻转。
- π₀ 的 state token 在其 mask 下理论上不依赖 noisy action 或生成时间，但当前 `sample_actions` 实际只缓存图像/语言 prefix，仍重算 state suffix。图与正文均标明“实际实现”，没有把可能的优化画成已实施行为。
- π₀.₅ 论文含混合离散/连续目标；公开 `Pi0.compute_loss` 路径是 flow loss。论文中干净的 FAST action token 不能被连续 action expert 读取；课程图示限定为公开 flow-only 路径，没有把完整混合训练误画成可无条件互读。
- KI 的隔离不等于整个 backbone 不训练：专家损失可停止向主干回传，主干仍由独立 token 目标学习。公开 flow-only 入口不能因名称相似被声称包含完整 KI 混合训练。

## 5. 原创教学实现与验证

`content/experiments/vla-joint-attention.py` 与新课代码页逐字一致，SHA-256 为 `154767e762e3863559d2418578fd851b24e55d9f45168413fc2dcf7d11b55e6e`。

教学模型使用两层、前缀宽度 16、专家宽度 12、2 个 attention head、每头 4 维。输入为 `[4,2,3,8,8]` 小图像、3 个文字位置、4 维状态和 `[4,3,3]` 动作。它没有加载预训练权重，未声称复现任何发布 checkpoint。采用 π₀ 风格 state 路径，普通 RMSNorm 和拼接时间 MLP；前缀 patch projection 也只是教学图像算子。源码与正文明确列出这些简化。

主程序执行命令：

```sh
PYTHONPATH=/tmp/embodied-torch python content/experiments/vla-joint-attention.py
```

`PYTHONPATH` 只用于本工作环境的 CPU PyTorch 安装位置，下载后正常安装 PyTorch 即可运行。CPU、float64、单线程，固定种子 20261106；实际 PyTorch 版本为 2.15.0+cpu。完整 stdout 保存在 `case-vla-experiment.json`。

| 实际测量 | 结果与含义 |
| --- | --- |
| 固定小批训练前 loss | 1.287935188682425 |
| 固定小批 40 次更新后 loss | 0.08756648812250836；只验证可优化性，不衡量泛化。 |
| 首次视觉 / 语言 / 前缀 / 专家梯度范数 | 0.4264176962 / 0.0545125960 / 1.2979475041 / 3.9017216772；连接有效，不等于语义能力。 |
| full / cached velocity 最大差 | 4.440892098500626e-16 |
| full / cached 8 步 Euler 最终样本最大差 | 4.440892098500626e-16 |
| 改变真实图像但复用旧缓存的最大差 | 0.13542782422104205；独立验证缓存确实依赖当前条件。 |

程序还断言：视觉投影与速度输出权重均实际更新；缺失视角的内容改变不影响结果；无效动作标签含 NaN 时仍有限；空监督被拒绝；保留计算图的缓存梯度等于完整计算；冻结参数不自动切断对输入图像的梯度；`no_grad` 缓存会切断该输入梯度路径。末层 prefix FFN 不一定被纯 action loss 使用，正文没有强迫所有参数梯度非零。

有效 horizon mask 被定义为请求时已知的 padding，而非未来才知道的 episode 终止标签。所有无效 NaN 都在插值/误差的危险运算之前安全处理，不能用 `NaN*0` 假装排除。

编程练习的实际输出：

```text
block mask checks passed
joint attention reference and gradient checks passed
```

第一题手写累计分块 attention mask，并检查不规则输入和布尔类型。第二题手写双流 joint attention，使用独立的逐行有效 Key 参考计算核对输出，并验证不允许的信息路径梯度为零、允许路径梯度非零、全屏蔽 query 行有限。练习答案未只调用 `nn.MultiheadAttention`。

## 6. 图示与页面内验证

| 文件 | 教学目的与边界 |
| --- | --- |
| `vla-system.svg` | 多视角图像/文字 prefix 与 state/noisy-action suffix，各层独立参数、联合 attention、最终速度读出与 ODE 循环；不画成串联 VLM→专家黑盒。 |
| `vla-joint-mask.svg` | π₀ 的 P/S/A 三块、π₀.₅ 默认 flow-only 的 P′/A 两块，区分 Query 行与 Key 列；展示每层的双参数组共同运算。 |
| `vla-training-inference.svg` | 一次训练与一次观测内多步生成的不同数据流；准确标出 NaN 排除时机、负步长、缓存与重计算边界。 |

三图均为原创 SVG，包含可编辑文字与向量、无远程资源、无脚本，并有 title/desc 及网页 alt/caption。用 Inkscape 导出 1200 像素 PNG 后逐张检查，未见截断、文字覆盖或含义错误；最终调整了训练图，将“无效 NaN 在构造 Xₜ 前排除”移到正确阶段。

新课的 132 个数学表达式（含 7 个 display 公式）通过项目现有数学 tokenizer 与 KaTeX，未发现渲染错误或遗留 TeX 分隔符。9 个不同正文内链含指定 section 的路由均与当前内容源核对有效。7 个 Python 字符串代码块通过编译，两个练习实际运行通过，课程 schema、代码解释行号、题目验收字段及 SVG XML 检查通过。

对应机器可读记录：`case-vla-math.json`、`case-vla-validation.json`。全站构建、页面布局、移动端公式滚动和部署结果应引用主任务报告，不能由这里的静态检查替代。

## 7. 完成边界与后续研究

本案例没有运行官方 OpenPI 权重、真实机器人或大规模训练，也没有声称验证其论文成功率。教学模型只证明本章明确列出的数学与计算图机制。固定小批标签主要依赖状态，语言分支收到梯度并不能证明学会了语言控制，正文明确指出。

未在本次工作实现 π₀.₅ 完整混合数据训练、FAST tokenizer 权重或 KI 多目标训练；其架构与边界已按官方来源解释。实现这些会引入外部权重、数据协议和单独的研究复现实验，超出本课“从源码理解连接机制”的范围。现有成熟课程均保留，后续应由实际读者问题与真实失败案例决定是否继续深化，而非按篇幅统一重写。
