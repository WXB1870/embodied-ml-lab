# 经典工作补充范围复核：策略、生成模型与后训练

## 范围与结论

本轮对 7 门相关课程的目录、理论正文中代表工作所在段落、代码/练习定位及参考来源做只读检查。重点判断“已有机制是否缺少一个对应的典型工作”，不重新验收全部数学或执行代码，也不将型号数量作为覆盖指标。审查阶段保持课程只读；随后按主任务指示，仅实施下述一处 DPPO 连接案例。

结论：已有内容中的 ACT、Diffusion Policy、π₀、DAgger、GAE、PPO、Rectified Flow/Reflow 不是仅列名字，已经解释关键机制和工程约定。应保留。仅发现一处值得补充的连接：把生成式动作策略接到奖励驱动后训练的具体代表路线。

## 覆盖与判断

| 课程 | 已有代表工作及实质内容 | 判断 |
| --- | --- | --- |
| `behavior-cloning`（`content/vla.json`） | 从条件似然推导回归、条件多峰的均值问题、访问分布变化；正文指出 DAgger 的作用，随后建立回归/动作 token/连续生成三类接口，来源含 Diffusion Policy、OpenPI、OpenVLA。 | 保留其监督学习基础定位。具体策略实例已由生成式策略和 VLA 课程承担，无需在这里再建型号表。 |
| `distribution-shift`（`content/vla_p0.json`） | DAgger 的采集、专家查询、聚合、重训练流程；零示教误差仍漂移的反馈反例；与同数量普通示教的对照；说明标签质量与查询分布限制。 | 已有成熟代表工作和机制实验，不建议增加新名字。 |
| `returns-bellman`（同上） | Monte Carlo / TD 的取舍；GAE 递推、bootstrap 和跨回合两个 Mask、终止/截断边界；附 GAE 原论文。 | 代表方法与教材机制已匹配，保留。 |
| `policy-gradient`（同上） | Score-function / REINFORCE、基线、联合动作密度、sample/rsample；PPO 有独立小节，讲旧策略快照、正负优势裁剪分支及其局限。末节指出生成式策略需要另外定义密度或目标。 | PPO 介绍已充分；末节从概率障碍到具体生成策略后训练方法的连接仍可补一个短例。 |
| `generative-policy`（`content/policy-models.json`） | ACT 的 CVAE、L1+KL、训练后验与部署 z=0；Diffusion Policy 的动作联合去噪、U-Net/Transformer、历史窗口和执行切片；π₀ 官方实现的反向时间约定和前缀缓存条件。 | 已达到“代表工作解释方法”的要求。不要重复新增 ACT/DP/π₀ 简介。 |
| `flow-matching`（`content/topics/flow-matching.json`） | 端点耦合、条件期望、边缘场、ODE；小批次 OT 与全局 OT 的区别；Rectified Flow/Reflow 的重新耦合，区别于更换积分器；OpenPI 时间约定。参考明确指向 Lipman、Liu、Tong 及官方 FM 文档。 | 理论—代表工作联系充分，不需要再罗列图像生成模型。 |
| `finetuning`（`content/vla.json`） | LoRA 的低秩增量、初始化、合并、显存与迁移；当前新增 QLoRA 的 NF4/双重量化/分页优化器，区分算法与 PEFT/bitsandbytes 实现。 | 已覆盖这一章真正有教学作用的经典工作及工具，不再扩列适配器变体。 |

## 唯一补充：策略梯度末节的 DPPO 连接案例（已实施）

实际位置：`content/vla_p0.json` → `policy-gradient` → `sections[id="9"]`，“从单步检查到完整后训练”。仅在原正文之后追加两段说明，并在该课程添加两条一手来源。保留原推导与所有代码、练习；没有新增课程、完整训练框架或页面功能。

现有教材已经在多处正确说明“去噪或 Flow MSE 不是动作 log-prob，不能直接用于 PPO 比率”，但读者还可能不知道真实研究如何跨过这一步。DPPO（2024 arXiv，ICLR 2025）恰好与已学的 Diffusion Policy、MDP、Gaussian log-prob、PPO 相接：将环境决策和内部随机去噪组织为两层扩展 MDP，在包含噪声动作的状态下对逐次高斯转移使用策略梯度/PPO。它用的是去噪链的条件概率，不能改写成“把负去噪 MSE 当作最终动作的边缘 log-prob”；也不能直接将这条随机转移推导移植到确定性 Flow ODE。

新增两段已经交代“生成链内部决策如何接受环境奖励”、新旧去噪概率、采样记录、正方差前提、最终动作边缘密度和确定性 Flow 的区别；未罗列性能数字，也未暗示任何 VLA 都能直接替换为该方法。

核对的一手来源：

- [Ren et al., Diffusion Policy Policy Optimization，2409.00588v3](https://arxiv.org/html/2409.00588v3)，§4.1–4.2。
- [作者项目页](https://diffusion-ppo.github.io/)，Approach overview。
- [ICLR 2025 正式论文](https://proceedings.iclr.cc/paper_files/paper/2025/file/c0749c39aaff9e9e4c91f7118bf21b1e-Paper-Conference.pdf)。

## 无需扩展的部分

不建议为满足“不同领域都有经典工作”而批量加入 SAC、IQL、CQL、DPO、GRPO 等名称。`content/curriculum.json` 已将完整 PPO/SAC/IQL/CQL 训练系统列为按实际路线选学的后续范围；已有基础章节也没有分别建立这些算法所需的全部目标。DPPO 的建议仅作为现有理论的一个连接案例，不能被描述为已经交付完整算法课程。

本次后续实施仅改变 `policy-gradient` 对象中的上述两段正文与参考来源，其他课程和原有小节未改。该课程 77 处公式经现有 KaTeX 渲染器解析，错误 0，记录于 `classic-scope-formulas.json`。新增内容没有运行代码，因此没有新增训练实验或声称复现 DPPO；原代码和练习完全保留。`git diff --check` 通过。课程修改已冻结，构建与上线由主任务统一执行。
