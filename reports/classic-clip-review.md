# 图文预训练与视觉处理：代表工作补充

## 范围与阅读结论

基于公开第 10 版 `e484e552085dc1610291b10fa5a11bfbc5fa515f`，完整阅读 `contrastive-pretraining` 与 `vision-preprocessing` 的原理、主实现、标准库练习、PyTorch 练习、讨论题和参考来源。

这两课的机制推导与数值验证已经比较完整。实际缺口是读者难以从目标函数直接理解 CLIP、SigLIP、SigLIP 2 各自是什么、可拿来做什么，以及预处理为什么必须跟具体模型配套。因此只补一个代表工作小节和两个有实际接口意义的段落，没有扩写已有目标推导或增加模型目录页。

## 已修改

- `contrastive-pretraining` 保持课程 ID，显示标题改为“图文预训练：CLIP 与 SigLIP”，目录可直接发现。
- 新小节 `classic-works` 放在全局检索与下游表示之后、数值诊断之前。用三行比较表解释 CLIP 的双向匹配、SigLIP 的逐对二分类、SigLIP 2 的组合训练配方及变体。
- 正文区分“训练图文匹配模型”和“只取视觉塔做 VLM/动作策略编码”；补文本候选构造零样本分类的例子，以及全局向量、空间 Token、归一化阶段的区别。
- `vision-preprocessing` 的小节 `0` 用 OpenAI CLIP 的中心裁剪处理链说明真实 checkpoint 接口；小节 `5` 用 SigLIP 2 NaFlex 的 Patch 坐标和补齐 Mask 说明可变分辨率接口。
- 所有旧小节 ID、课程 ID、原代码、原练习与答案保持不变。文件内其他四条课程记录未修改。

## 需要明确保留的边界

- CLIP 是预训练方法及模型家族，不等同于 ViT；原论文也包含修改后的 ResNet。
- SigLIP 的目标不需要 Softmax 全局归一化，但全配对仍有平方数量的正负对，不能写成“无需负例”或“没有配对计算成本”。
- SigLIP 2 论文 v1 中，固定分辨率与 NaFlex 的训练分支不同；NaFlex 未采用标准分支的自蒸馏和掩码预测。描述解码器用于训练，没有随编码器发布。
- 这些工作提供可复用表征，不直接提供机器人动作或任务成功概率。本次没有写未经受控验证的模型排名或机器人效果保证。
- 原有 36 行图文示例已验证两个损失的核心计算；没有再加入模型下载脚本或重复实现。实测范围是本地数学/张量示例，未运行真实 checkpoint 的推理或预训练。

## 一手来源与版本

1. CLIP，论文 v1（2021）：https://arxiv.org/abs/2103.00020v1 。核对双编码器、修改后的 ResNet/ViT 和零样本文本分类器。
2. Sigmoid Loss for Language Image Pre-Training，论文 v4（2023）：https://arxiv.org/abs/2303.15343v4 。核对逐对目标、尺度/偏置和不需要全局 Softmax 归一化的性质。
3. SigLIP 2，论文 v1（2025）：https://arxiv.org/abs/2502.14786v1 ，全文 https://arxiv.org/html/2502.14786v1 。重点核对 §2.2 的训练解码器、§2.3 自蒸馏/掩码预测、§2.4.2 NaFlex 例外和输入协议、§2.5 部分小模型的数据筛选。
4. OpenAI CLIP 官方实现：https://github.com/openai/CLIP/blob/main/clip/model.py 。核对 encode_image/encode_text 返回投影特征，forward 才单位化并使用可学习尺度。
5. OpenAI CLIP 官方预处理：https://github.com/openai/CLIP/blob/main/clip/clip.py 。核对 load 返回 processor，缩放、中心裁剪、RGB 转换和通道标准化。
6. SigLIP 官方训练器：https://github.com/google-research/big_vision/blob/main/big_vision/trainers/proj/image_text/siglip.py 。核对成对符号、尺度/偏置和 log-sigmoid 实现。
7. SigLIP 2 官方说明：https://github.com/google-research/big_vision/blob/main/big_vision/configs/proj/image_text/README_siglip2.md 。核对标准/NaFlex 模型与处理器不同。
8. NaFlex 官方处理器：https://github.com/google-research/big_vision/blob/main/big_vision/pp/proj/image_text/ops_naflex.py 。作为实际接入入口，正文机制依据固定论文 v1；main 分支链接是可变的官方实现入口，不作为锁定软件环境的声明。

以上来源于 2026-11-06 查阅；未依据第三方榜单扩展结论。

## 验证

详见 `classic-clip-validation.json`，记录精确源代码 SHA-256 和真实 stdout。

- 两课各一个主程序、一个标准库参考答案、一个 PyTorch 参考答案：6/6 执行通过。
- 环境：Python 3.12.14，PyTorch 2.15.0+cpu。
- 两课全部 62 处公式按本站 math tokenizer 和 KaTeX 渲染通过；本次未新增公式。
- 两条新增内部正文链接的课程及小节存在。
- 对照基线确认所有旧 ID、代码、练习和原讨论答案保留；本文件其余课程未改。
- `git diff --check -- content/architecture_p0.json` 通过。

全站构建、浏览器视觉检查和发布由主代理统一进行；本次子任务未修改 dist、目录定义、构建脚本，也未提交或发布。
