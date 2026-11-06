# 视觉编码器与多模态融合：经典工作补充记录

## 范围与保留内容

本轮仅修改 `content/architecture.json` 的 `multimodal` 对象，课程 ID、原有 8 个小节 ID、主代码、Python 编程题和 PyTorch 编程题保持不变。课程改名为“视觉编码器与多模态融合”。没有新增课程、工具目录或页面功能，没有修改构建产物。

原课程已充分说明 Patch 投影、多相机来源、条件信息流、表示压缩和冻结边界。本轮补充的是经典方法及输出接口，不重复这些推导。

## 实际修改

1. 在原“Projector 与跨模态融合”节补充原始 LLaVA、LLaVA-1.5 与 BLIP-2。说明原始线性连接器与 1.5 的两层 MLP 区别；对照逐 token 投影与 32 个学习查询的 Q-Former 压缩。明确连接器本身不等于语言条件融合。
2. 扩展原“预训练目标与表示能力”节。用一个紧凑比较表解释 CLIP/SigLIP、DINOv2、MAE、第一代 SAM 的监督机制、实际输出和典型用途。ResNet/ConvNeXt/ViT/Swin 仅作为架构层定位，并回链已有 CNN 网络设计。
3. 增加一个有自然导入的“全局向量、Patch 与特殊 token 的读取约定”小节。区分空间重排与全局聚合、CLS 与均值、Register 与图像网格、LayerNorm 与 L2 归一化、隐藏特征与投影后的匹配向量。给出 261=1+4+256 的 DINOv2 数量算例，并限定到已声明的 token 排列。
4. 代码页增加 52 行离线 PyTorch 实验：验证 0/4 个 Register、2×3 非方形网格、明确行列位置、读取层梯度与错误元数据；不下载权重，不模拟模型训练。说明读取层的前缀零梯度不能推广为上游注意力网络的零梯度。
5. 练习页增加两项开放题：独立实现 token 切片/重排，以及设计视觉编码器的受控对照。未把课程变成型号记忆题库。

## 关键来源与版本

| 内容 | 核对的一手来源 |
| --- | --- |
| 原始 LLaVA 的线性投影和空间特征 | [Visual Instruction Tuning, 2304.08485v2](https://arxiv.org/abs/2304.08485v2), §4.1 |
| LLaVA-1.5 两层 MLP、336 输入 | [Improved Baselines, 2310.03744v2](https://arxiv.org/abs/2310.03744v2), §3.3 |
| BLIP-2 两阶段、查询和视觉前缀 | [BLIP-2, 2301.12597v3](https://arxiv.org/abs/2301.12597v3), §3.1–3.3 |
| 双编码器、匹配输出 | [CLIP, 2103.00020v1](https://arxiv.org/abs/2103.00020v1); [SigLIP, 2303.15343v4](https://arxiv.org/abs/2303.15343v4) |
| DINOv2 的图像级/遮挡 Patch 级目标 | [DINOv2, 2304.07193v2](https://arxiv.org/abs/2304.07193v2), §4 |
| DINOv2 空间 token 与特殊 token | [官方模型卡](https://github.com/facebookresearch/dinov2/blob/main/MODEL_CARD.md); [官方 forward_features](https://github.com/facebookresearch/dinov2/blob/main/dinov2/models/vision_transformer.py) |
| Register 的动机与变体 | [Vision Transformers Need Registers, 2309.16588v2](https://arxiv.org/abs/2309.16588v2) |
| MAE 编码器、解码器和遮挡位置损失 | [MAE, 2111.06377v3](https://arxiv.org/abs/2111.06377v3), §3 |
| SAM 结构、1024 输入和 256×64×64 特征 | [Segment Anything 第一代, 2304.02643v1](https://arxiv.org/abs/2304.02643v1), §3 / Appendix A |
| Swin 的窗口与分层结构 | [Swin Transformer, 2103.14030v2](https://arxiv.org/abs/2103.14030v2) |

官方仓库的 `main` 页面于 2026-11-06 核对，链接不固定为不可变提交；本文未提供依赖该分支执行的下载/API 调用。课程中的合成实验只依赖 PyTorch 基础张量操作。CLIP/SigLIP 的完整损失推导回链图文对比学习课程，不在此重复。

## 验证

- CPU / PyTorch `2.15.0+cpu` 实际运行 4 组代码：原主程序、原 Python 练习、原 PyTorch 练习、新 token 实验，全部通过。种子、代码 SHA256 和标准输出记录于 `classic-vision-validation.json`。
- 本课共 35 处公式通过现有 KaTeX 渲染器解析，无错误；记录于 `classic-vision-formulas.json`。
- 所有新代码说明的行号在 52 行源代码范围内。
- 本课 4 处内部课程链接均找到目标课程；原小节 ID 和练习保留。
- 与修改前 HEAD 对比，`architecture.json` 中只有 `multimodal` 对象变化；`git diff --check` 通过。

全站构建、浏览器阅读和移动端视觉验证由主任务统一完成，本子任务没有声称执行这些步骤。没有运行真实预训练权重的质量对比，没有新增或暗示模型性能排名；课堂实验只验证数学与接口约定。
