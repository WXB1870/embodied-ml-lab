# 代表工作补充：独立只读复核

复核日期：2026-11-06。只读检查三个目标小节、前后标题/导言和对应新增练习；未修改课程或 dist，未执行未改动代码。

## 结论

没有发现需要阻断合并的理论归类或事实错误。新增内容服务于原有知识链，未把模型名称当作效果保证，也没有把架构、训练目标、采样器、数据集和格式混为一类。发现一处题干表述过强，建议在发布前调整；另有一处可选的实现细节补全。

## 建议修订

### 1. 数据课练习：不应绝对禁止按文件划分

位置：`data-quality` 新增末题，原题干“将 RLDS 转成 LeRobotDataset v3 后，为什么不能按文件切分训练集……”。

问题：v3 一个文件可含多个 episode，说明文件边界不是 episode 语义边界，但不能推出按文件划分在任何情况下都错误。若生成文件时已经将完整、互不泄漏的目标分组分配到不相交文件，按文件读回这些分组可以实现合法划分。真正不可接受的是未检查分组关系便以文件名替代统计独立单位。

建议题干：“将 RLDS 转成 LeRobotDataset v3 后，为什么不能仅凭文件边界决定训练/验证划分，也不能把每行 action 都计入监督？”

建议在第一段答案末补：“只有预先确认分片与所需独立分组一致时，文件才能作为该划分的实现单位；隔离是否成立仍以 episode、session 或场景身份判断。”

这是对现有正确原则的条件补全，不影响格式介绍和主体答案。该建议已直接发给主代理。

### 2. 可选：T5 的目标序列末尾标记

T5 的介绍和比较准确，练习也正确地区分了源与目标。若希望答案可直接指导精确数据构造，可在“目标是由 sentinel 分隔的缺失片段”后补“并使用最终 sentinel 标记结束”。原论文 Figure 2 和 §3.1.4 明确给出最后一个 sentinel。当前文字不是错误，仅未细化这个实现边界，不必为此增加长段落。

## 已确认的内容

### Transformer：BERT / GPT-2 / T5

- BERT 的双向表示、被选中位置的 MLM、原版 NSP 正确；练习保留了遮蔽/替换/保持原词三种输入扰动，未把所有可见词计入 MLM。
- GPT-2 的因果下一 token 目标、Pre-LN、学习式绝对位置正确。官方 model.py 包含学习参数 wpe，并与 token embedding 相加；论文 §2.3 明确把 LayerNorm 移至子块入口。
- T5 的 Encoder–Decoder、源侧双向读取、目标侧因果生成缺失 span 与 sentinel 设计正确。
- 三者放在 Cross-Attention 之后、Teacher Forcing 之前合理；新增练习围绕可见信息、目标位置和标签移位，不是记忆名称。
- ACT 并行动作查询作为 decoder 不等于自回归的对照准确；原始 Transformer、GPT-2 和本站 Pre-LN/RoPE 实例已分开，不会让读者误认为代码复现了任一原架构。

一手核对：

- BERT 论文 §3.1、Figure 1：https://aclanthology.org/N19-1423.pdf
- GPT-2 论文 §2.3：https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
- GPT-2 官方实现：https://github.com/openai/gpt-2/blob/master/src/model.py
- T5 论文 Figure 2、§3.1.4：https://www.jmlr.org/papers/volume21/20-074/20-074.pdf

### Diffusion：DDPM / DDIM / LDM / DiT / DPM-Solver

- 四个层次“建模空间、路径/目标、骨干、采样更新”划分正确，且是这一补充的主要教学价值。
- LDM 在预训练自编码器的压缩空间中训练扩散，Cross-Attention 提供通用条件入口；低维动作不必机械照搬图像压缩的限定恰当。
- DiT 原论文以 Transformer 替换潜空间图像扩散的 U-Net，研究类别条件图像生成；AdaLN-Zero 的归属正确，没有把 DiT 名称等同于 Flow Matching。
- DPM-Solver 的半线性结构、解析线性部分、网络积分近似及无需额外训练正确。文字限定数值收敛与生成效果的区别，避免了“高阶一定更好”的泛化。
- DDIM 与相同前向边际/训练目标兼容、允许非相邻时间等级的概括正确；不能只删 DDPM 迭代索引的提醒有明确数学意义。
- 新练习检验组件归属和参数化一致性，答案正确。

一手核对：

- LDM v2：https://arxiv.org/abs/2112.10752v2
- DiT v2：https://arxiv.org/abs/2212.09748v2
- DPM-Solver v3：https://arxiv.org/abs/2206.00927v3
- DDIM v4：https://arxiv.org/abs/2010.02502v4

### 数据：Open X / DROID / RLDS / LeRobotDataset v3

- Open X 是跨来源、跨机器人数据集合；统一存储格式不保证动作单位、关节顺序和控制频率一致，表述准确。
- DROID 的统一 Franka 平台、多环境/多视角覆盖与 Open X 的多具身形态轴区分合理；官方提供 RLDS 和原始数据两种入口。
- RLDS 官方定义 is_last 的最后观测之后，action/reward/discount 等后续量无效；is_terminal 与截断意义分开。因此当前无效末动作的教学成立。正文要求核对具体转换器是否遵循规范应保留，不能退化成“见到任何机器人数据末行就删动作”。
- LeRobotDataset v3 的多 episode 文件分片、元数据边界、Parquet/MP4 典型布局与 PyTorch 时间窗口接口准确。使用“典型”也保留了非视频图像或其他后端的空间。
- 格式转换不改善覆盖、不自动修复时延或统一动作语义的结论准确。

一手核对：

- Open X 官方项目：https://robotics-transformer-x.github.io/
- DROID 官方平台：https://droid-dataset.github.io/
- DROID 官方数据说明：https://github.com/droid-dataset/droid/blob/main/docs/the-droid-dataset.md
- RLDS 官方 Dataset Format：https://github.com/google-research/rlds
- LeRobotDataset v3 官方 Format design：https://huggingface.co/docs/lerobot/en/lerobot-dataset-v3

## 审查对象快照

以下 SHA-256 为 `json.dumps(object, ensure_ascii=False, sort_keys=True)` 的 UTF-8 字节摘要，用于区分复核之后的主代理修改；不代表已执行代码或整站构建。

- `transformer/encoder-decoder-families`: `bbc57f12b230205e450eb35243dacdb0f18105ac6359ea1a7aa6d50a383ee0cd`
- `transformer/new-question`: `e1cc275a3c4d4a2d1775eec5e5bcb7ab5994af610752331a5f9a57ccb3b32f95`
- `diffusion/representative-diffusion-designs`: `db342302c49c1d8f2e6d82c7c8469c65c901cb8a2ae94af270e21e929eec5961`
- `diffusion/new-question`: `a1c1a743b035508e781513c09e796d3691ee5111dfb3729e18abaea6a04a4495`
- `data-quality/datasets-and-formats`: `8eb6720c7fb512c202f7b43a5db0e9fa15cc4a225b4b67c04d412973f3b26fa9`
- `data-quality/new-question`: `7e8d84351a28879718b990e2f6d80fa8d3db0e96d991e13df5efa45df5dd9275`
