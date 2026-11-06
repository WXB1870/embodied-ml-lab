# 条件编码、Transformer 与后训练基础：本轮教学审查

覆盖 12 篇课程、104 个理论子节。逐节阅读正文和公式后添加自然导入，保持原课程与子节 ID；没有以新页面数量代替教学修订。

## 逐课处理

| 课程 | 本轮修改 | 保留与范围 |
|---|---|---|
| 图文对比学习 | 从向量范数的微分推导单位化 Jacobian；加入双向对比损失的 2×2 算例。 | 保留假负例、多正样本和冻结编码器的成熟分析。 |
| 分词、自回归与标签对齐 | 重写章节导入并为每节建立问题衔接。 | 保留动作离散化误差、自回归条件分解、标签右移与采样代码；未扩展成 tokenizer 百科。 |
| KV Cache 与增量计算 | 添加 P=3、Q=2 时非方形缓存 Mask 的显式允许矩阵，说明全局位置与局部 tril 的差别。 | 保留缓存有效性、GQA/MQA 内存估算及逐 token 对照实现。 |
| 视觉预处理与坐标变换 | 逐节补充几何变换、数值契约与训练部署一致性的引导。 | 保留已充分展开的 resize/crop 坐标变换、像素归一化与数据泄漏分析。 |
| 条件注入：拼接、FiLM 与 AdaLN | 在拼接、Cross-Attention 和调制之前建立条件输入的作用与比较依据。 | 保留多层动态条件、掩码与条件丢弃实验。 |
| 部分观测与记忆 | 先解释相同位置但速度不同的状态混叠，再介绍 belief；补充两状态 Bayes 更新、PyTorch GRU 门方程及逐参数梯度复核。 | 保留有限历史与完整 belief 的区别及 padding/reset 工程边界。 |
| 分布偏移与 DAgger | 以训练采样分布与闭环访问分布的差别串联各节。 | 保留 occupancy、误差累积与数据聚合条件的既有推导，未作机器人性能外推。 |
| 回报与 Bellman 方程 | 通过条件期望分解推导 Bellman 递推；两状态链的闭式解、线性求解和折扣和互相验证。 | 保留 TD、GAE 与终止/截断等成熟内容。 |
| 策略梯度 | 展开轨迹似然与 score-function 推导，解释删去过去奖励的条件；穷举两步轨迹验证 reward-to-go；加入 PPO 四种分支手算表。 | 保留基线无偏性、连续密度和重要性采样限制。 |
| 动作执行与延迟 | 建立规划时刻、观测时间戳、执行频率与延迟之间的连续叙事。 | 保留闭环对齐、异步执行与队列示例；没有把模拟时间误差包装成实机结果。 |
| 训练与推理一致性 | 以恢复训练目标对应的推理计算为主线补齐所有导入。 | 保留 checkpoint、统计量、接口契约与 fresh-process 恢复的既有验证。 |
| Transformer：注意力、残差与序列建模 | 从 QKV 匹配→缩放与手算→多头→FFN→Block 再到信息流；补齐 Block 前向和张量形状、重复层重新形成注意力的验证；Teacher Forcing 移到 Encoder/Decoder 后。 | 保留协方差缩放、Softmax Jacobian、多层泄漏、KV Cache 与完整手写练习。将 QK 的秩进阶分析后移并去重；LN Jacobian 通过正文链接复用。 |

## 实际验证

新增四个可独立运行的原理实验全部通过，源码 SHA 与 stdout 见 [quality-root-experiments.json](quality-root-experiments.json)：GRU 前向及输入/状态/参数梯度；两状态 Bellman 闭式、数值线性解及折扣和；两步策略梯度的完整回报与 reward-to-go；两层注意力权重重新计算。所有断言只证明代码指定的有限条件，没有使用未经执行的实验数值。

## 本轮核对的原始资料

- [PyTorch GRU](https://docs.pytorch.org/docs/2.15/generated/torch.nn.GRU.html)：门方程、参数分组和 PyTorch 特定 reset 位置。
- [PyTorch SDPA](https://docs.pytorch.org/docs/2.15/generated/torch.nn.functional.scaled_dot_product_attention.html)：Mask 与因果注意力约定。
- [Spinning Up: Deriving the Simplest Policy Gradient](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html)：轨迹对数导数、回报因果性及基线。
- [Attention Is All You Need](https://arxiv.org/html/1706.03762v7)：缩放点积、多头和 Block 的原始定义。

完整数学语义仍由逐项审阅负责；公式解析通过只说明语法可渲染。实际机器人闭环效果、CUDA 路径和完整强化学习训练系统不在这些实验的验证范围内。

## 交叉审查后的修正

另由独立审阅核对新推导后，移除了 Transformer 汇总式中已转由归一化章节解释、在本页失去局部符号定义的重复 LayerNorm Jacobian；保留 Pre/Post-Norm 的 Jacobian 比较。策略梯度明确改为参数无关的共同支持、允许交换求导与积分，以及初始分布独立于策略参数，避免将连续移动支持误当作可直接使用 score-function 推导的情形。
