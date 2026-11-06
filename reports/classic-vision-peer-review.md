# 视觉代表工作的独立复核

复核日期：2026-11-07。只读检查本轮 diff，未修改课程源码或 dist，也未重跑由内容作者负责的 token 布局实验。

## 范围与结论

覆盖 `content/architecture_p0.json` 中 `contrastive-pretraining/classic-works`、`vision-preprocessing` 的两段新增实例，以及 `content/architecture.json` 中 `multimodal` 新增原理、比较表与输出接口说明。

**未发现阻断集成的理论错误或能力泛化。** 训练目标、编码器输出与下游任务头之间的界限总体清楚；SigLIP 2 与 SAM 均限定具体版本，LLaVA 原始版和 1.5 也有区别。两个低优先级建议见下文，已发给主代理决定是否合并。

## 一手核对结果

| 检查对象 | 结论与依据 |
| --- | --- |
| CLIP 与 SigLIP 的目标 | 双编码器、Softmax 对比与逐对 Sigmoid 的差异成立。后者不需要全局 Softmax 分母，但全配对仍有平方数量的配对，正文没有将其表述为无负例成本。[CLIP v1](https://arxiv.org/abs/2103.00020v1)、[SigLIP v4](https://arxiv.org/abs/2303.15343v4) |
| CLIP 特征归一化 | `encode_image` / `encode_text` 返回特征，`forward` 再做单位化并构造相似度，正文准确；不能将缓存特征视为已单位化。[官方 model.py](https://github.com/openai/CLIP/blob/main/clip/model.py) |
| CLIP 预处理 | Resize、CenterCrop、RGB、ToTensor、通道标准化与官方顺序相符；中心裁剪和 Letterbox 的区分合理。[官方 clip.py](https://github.com/openai/CLIP/blob/main/clip/clip.py) |
| SigLIP 2 训练变体 | v1 第 2.2 节明确训练解码器不属于发布模型；第 2.4.2 节明确 NaFlex 没有自蒸馏/掩码预测；第 2.5 节的主动筛选针对小型固定分辨率模型。表格均有相应限定。[论文 v1](https://arxiv.org/html/2502.14786v1) |
| NaFlex 输出协议 | 预算限制、近似保持纵横比、Patch 坐标、补齐有效位以及 Attention/MAP 汇聚的 Mask 使用均由论文第 2.4.2 节支持。`ops_naflex.py` 的 `patchify` 输出 patches、yidx、xidx、type；完整补齐协议分布在预处理管线中，不能将该文件孤立当作全部实现。[论文](https://arxiv.org/html/2502.14786v1)、[预处理源码](https://github.com/google-research/big_vision/blob/main/big_vision/pp/proj/image_text/ops_naflex.py) |
| DINOv2 训练目标 | 图像级教师预测与被遮挡位置的 Patch 教师预测均成立。正文限定“基础自监督训练”的 EMA，避免将后续小模型固定教师蒸馏混同。[论文 v2，第 4、5 节](https://arxiv.org/html/2304.07193v2) |
| DINOv2 输出 | `forward_features` 对 CLS/Register/Patch 分别返回末端 Norm 输出；Register 位于 CLS 后。224/14=16、256 Patch、4 Register 时总数 261，切片正确。LayerNorm 不等于 L2 单位长度。[官方实现](https://github.com/facebookresearch/dinov2/blob/main/dinov2/models/vision_transformer.py) |
| MAE | 可见 Patch 进入编码器，Mask token 与潜在表征进入轻量解码器；迁移用编码器与任务头，与像素重建输出有别。无错误。[论文 v3](https://arxiv.org/abs/2111.06377v3) |
| SAM 第一代 | MAE 初始化、图像/提示编码器及 Mask 解码器的分工正确。附录 A 支持 1024×1024 输入、64×64 空间网格及 256 通道。正文未把基础特征直接称为分割结果，也未误称图文双编码器。[论文 v1](https://arxiv.org/html/2304.02643v1) |
| 原始 LLaVA 与 1.5 | 原始论文使用 CLIP ViT-L/14 空间特征加线性投影；1.5 改为两层 MLP 并使用 336 像素视觉版本。逐 token 通道投影与后续跨模态注意力的区分正确。[原始论文 §4.1](https://arxiv.org/html/2304.08485v2)、[1.5 §3.3](https://arxiv.org/html/2310.03744v2) |
| BLIP-2 | 两阶段、冻结图像/语言骨干、可学习查询、32×768 查询瓶颈均有原文依据；32 个查询不是预先指定空间区域。固定长度输出作为结构性质成立，正文没有声称因此保留全部细节。[论文 §3.1–3.3](https://arxiv.org/html/2301.12597v3) |

## 两项低优先级改进建议

1. `multimodal` 的代表工作表中，CLIP/SigLIP 行写“视觉骨干的 Patch 特征可供 VLM 连接器读取”。建议收紧为“ViT 版本的 Patch 特征可供 VLM 连接器读取”。CLIP 还包含修改后的 ResNet，当前表述在语境中可以理解，但加限定能防止读者将所有 CLIP 变体的接口统一成 Patch 序列。
2. `classic-works` 关于 OpenAI `encode_image` / `encode_text` 与 `forward` 的具体陈述正确，但正文目前没有直接连到支撑该实现细节的 `clip/model.py`。建议给这段或课程 sources 补上述官方源码链接，方便读者逐行核验。

这两项是边界与可追溯性改善，并非已确认的实质算法错误。复核没有对任何预训练权重的机器人表现、密集预测质量或推理速度作实测保证。
