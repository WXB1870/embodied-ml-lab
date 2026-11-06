# 代表工作补充：微调与 CNN

## 本轮范围与结论

审查 `content/vla.json` 的 `finetuning` 与 `content/topics/cnn.json`：完整阅读原理、可执行示例、编程练习及讨论题。两课已经具备实质推导，采用定向补充，不重写成熟内容。未改路由、课程排序、页面功能、可执行源码或现有编程题。

### 微调与 LoRA

保留全部 10 个原理论小节，包括低秩矩阵形状、首步梯度、合并条件、显存组成、源域风险局部分析与受控迁移实验。

在原“参数高效与显存高效不是同一比例”之后增加 `lora-qlora-frameworks`：

- 区分 LoRA 更新参数化、QLoRA 量化适配组合、PEFT 方法族/软件框架与 bitsandbytes 量化算子库。
- 解释 NF4 编码、双重量化缩放元数据、分页优化器的不同对象，避免把它们合成一个没有机制含义的“省显存开关”。
- 明确 4 bit 存储与计算 dtype 不同，以及冻结权重仍可参与输入梯度传播。
- 给出量化基座加低秩增量的前向表达，推导零增量时与原浮点基座的差值；区分量化基座上的初始化等价和原始基座的函数保持。
- 将合并、重新量化、恢复与性能评价联系起来，不给无设备依据的节省比例或调用建议。

新增一道讨论题，要求分离量化误差、适配器增量与恢复/合并误差。该题不声称当前 CPU 示例实现了 NF4 或分页优化器。

### CNN

原 `architecture-design` 已有 VGG 小核堆叠、ResNet 瓶颈与旁路、MobileNet 分解及秩限制、ConvNeXt 空间/通道混合，并配有最小可运行结构验证。其余局部算子、几何、感受野、归一化、池化、采样和实现部分也已经形成完整教学链，全部保留。

只在这一节补充一张四行对照表，将 VGG、ResNet、MobileNet v1、ConvNeXt 的代表特点、设计问题和迁移关注点并列，并给出原论文链接。未扩展 LeNet/AlexNet 等历史家谱，未再创建架构章节。

## 一手依据

以下材料于 2026-11-07 核对。方法事实来自论文或官方实现；应用建议为基于已有机制的工程分析，不作为原论文的性能结论。

| 依据 | 本轮用途 |
| --- | --- |
| [LoRA 原论文](https://arxiv.org/abs/2106.09685) | 冻结基座与低秩增量的算法定位 |
| [QLoRA 原论文，第 3 节](https://arxiv.org/abs/2305.14314) | NF4、双重量化、分页优化器、存储/计算精度分工 |
| [PEFT 官方总览](https://huggingface.co/docs/peft/index) | 软件框架与方法族的区别 |
| [PEFT 量化指南](https://huggingface.co/docs/peft/developer_guides/quantization) | 量化与适配器组合、实际后端和版本约束 |
| [Transformers / bitsandbytes 集成](https://huggingface.co/docs/transformers/quantization/bitsandbytes) | 计算 dtype 与未量化模块 dtype 的区别 |
| [bitsandbytes Linear4bit](https://huggingface.co/docs/bitsandbytes/reference/nn/linear4bit) | 量化线性层属于实现层 |
| [VGG](https://arxiv.org/abs/1409.1556) | 连续小核与深度 |
| [ResNet](https://arxiv.org/abs/1512.03385) | 残差学习及深层骨干 |
| [MobileNet v1](https://arxiv.org/abs/1704.04861) | 深度可分离结构、宽度/分辨率与嵌入式场景 |
| [ConvNeXt](https://arxiv.org/abs/2201.03545)及[官方块实现](https://github.com/facebookresearch/ConvNeXt/blob/main/models/convnext.py) | 纯卷积骨干中的空间混合、通道 MLP 与 LayerNorm |

## 验证与边界

`reports/classic-adaptation-validation.json` 记录以下结果：

- 两课全部 271 处行内/独立公式经现有 KaTeX 路径解析通过，无游离 TeX 或未匹配分隔符。
- 新 QLoRA 正文经真实文章 inline 渲染器通过；CNN 四个新论文链接可渲染为链接。
- 与 HEAD 对照，微调原 10 小节逐项保持一致，代码、主练习和 PyTorch 手写题保持一致；CNN 除新增对照表外逐项保持一致。
- 所有旧 section ID 保留，新增 ID 唯一。

没有修改或新增可执行训练代码，因此本轮未为文案重跑随机训练或新增测试文件。QLoRA/PEFT 补充只完成机制、来源及公式渲染核对，没有下载量化权重或运行 QLoRA 设备实验，未给出量化后的策略质量、吞吐或显存测量结论。站点整体构建与桌面/移动页面检查由集成阶段统一执行。
