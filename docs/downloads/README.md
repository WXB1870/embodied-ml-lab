# Embodied × ML 学习代码包

课程按数学基础、神经网络、Transformer 与多模态、生成模型、动作策略与后训练、训练工程、执行评估七个章节组织。

## 使用顺序

1. 按文章中的推导阅读，结合短代码和完整实现核对结果。
2. 在 `exercises/python/` 找到本节标准库练习，独立完成 TODO。
3. 使用 `python 文件名.py` 执行，该文件末尾带断言测试。
4. 阅读 `demos/` 的完整 PyTorch 示例；改动输入，观察张量形状和输出。
5. 完成 `exercises/torch/` 中对应的 PyTorch 任务。
6. 需要时再打开 `solutions/`，答案与练习分开存放。

## 环境

建议 Python 3.11 或 3.12。Python 练习只用标准库，无需安装依赖。
PyTorch 演示与任务以 CPU 为默认环境。DDP 演示需要本地两进程 Gloo 通信；当前交付环境禁止通信 socket，此一项没有完成运行验证，详见 validation.json。AMP 提供 CPU BF16 教学路径，GPU 分支应在你的硬件上再核验。

```bash
python -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install torch
python demos/01_tensor_demo.py
python exercises/python/01_tensor_practice.py
```

GPU/CUDA 版本请按 https://pytorch.org/get-started/locally/ 选择安装命令。

## 目录

- `topics/`：四门核心课程的详细源讲义、附加实现与编程练习；与网站对应课程使用同一份理论来源。
- `demos/`：50 个完整带注释 PyTorch 教学演示。
- `exercises/python/`：50 个标准库练习，带 TODO 和测试。
- `exercises/torch/`：50 个 PyTorch 练习，带 TODO 和测试。
- `solutions/python/`、`solutions/torch/`：对应参考答案和同一套测试。
- `curriculum/`：完整中文课程内容 JSON，含原理、形状、逐段说明、开放问题和来源。
- `lessons/`：每节完整 Markdown 讲义，可直接阅读或放入 Obsidian；含推导、算例、代码说明、讨论与参考解。
- `validation.json`：基础课程的实际运行验证结果。
- `topics/validation.json`：四个详细专题的实际运行验证结果。
- `curriculum/curriculum.json`：研究补齐依据、开源可视化与进阶边界。
- `assets/experiments/`：Flow Matching 多峰实验的实际数据与图形。
- `assets/figures/`：可编辑的原创结构图、张量流向图与数学示意图。
- `demos/课程ID/`：由相关课程共同引用的完整训练或原理验证案例。
- `experiments/`：读取已记录数据重新绘图的脚本；绘图额外依赖 NumPy 与 Matplotlib。

## 运行说明

测试验证本节指定的最小行为，不证明任意输入下均正确，也不代表真实机器人效果。
浏览器练习、PyTorch 练习和完整机器人模型是不同层次的实现。Diffusion/Flow 示例是教学小模型。
浮点计算可能随硬件和库版本产生微小差异，断言中使用容差比较。

## 课程索引
- 01 张量与广播 (`tensor`)
- 02 线性代数与矩阵求导 (`matrix-grad`)
- 03 概率、统计与训练目标 (`probability`)
- 04 损失、掩码与归约 (`losses`)
- 05 PyTorch 自动微分与计算图 (`autograd`)
- 06 梯度下降、动量与 AdamW (`optimization`)
- 07 数值精度与标准化 (`numerical`)
- 08 泛化与验证 (`generalization`)
- 09 MLP：表达、梯度与优化 (`mlp`)
- 10 激活与初始化 (`activation-init`)
- 11 归一化：统计轴、梯度与不变性 (`normalization`)
- 12 残差连接与深层优化 (`residual`)
- 13 CNN：卷积、采样与空间表示 (`cnn-receptive-field`)
- 14 注意力：匹配、聚合与梯度 (`attention`)
- 15 Embedding 与位置编码 (`embeddings`)
- 16 Transformer：注意力、残差与序列建模 (`transformer`)
- 17 视觉预处理与坐标变换 (`vision-preprocessing`)
- 18 视觉编码器与多模态融合 (`multimodal`)
- 19 图文预训练：CLIP 与 SigLIP (`contrastive-pretraining`)
- 20 分词、自回归与标签对齐 (`tokenizer-autoregressive`)
- 21 条件注入：拼接、FiLM 与 AdaLN (`conditioning-fusion`)
- 22 KV Cache 与增量计算 (`kv-cache-inference`)
- 23 生成建模、潜变量与 VAE (`latent-variable-models`)
- 24 Diffusion：DDPM、目标参数化与 DDIM (`diffusion`)
- 25 Score、SDE 与概率流 ODE (`score-sde`)
- 26 Flow Matching (`flow-matching`)
- 27 行为克隆 (`behavior-cloning`)
- 28 状态与动作表示 (`action-representation`)
- 29 时间对齐与动作块 (`action-chunk`)
- 30 部分观测与记忆 (`partial-observability`)
- 31 生成式动作策略：ACT、Diffusion 与 Flow (`generative-policy`)
- 32 VLA：从视觉语言骨干到动作专家 (`vla-architecture`)
- 33 微调与 LoRA (`finetuning`)
- 34 回报与 Bellman 方程 (`returns-bellman`)
- 35 策略梯度 (`policy-gradient`)
- 36 PyTorch 模块、参数与状态 (`modules`)
- 37 数据采样与批处理 (`dataloader`)
- 38 训练循环与指标归约 (`training-loop`)
- 39 保存与恢复训练状态 (`checkpoint`)
- 40 示教数据与采样 (`data-quality`)
- 41 梯度累积 (`gradient-accumulation`)
- 42 混合精度训练 (`mixed-precision`)
- 43 训练显存与重计算 (`memory-checkpointing`)
- 44 DDP 与全局统计 (`distributed-training`)
- 45 训练诊断 (`training-diagnostics`)
- 46 多任务梯度 (`multitask-gradients`)
- 47 分布偏移与 DAgger (`distribution-shift`)
- 48 动作执行与延迟 (`execution-latency`)
- 49 闭环评估与统计 (`evaluation`)
- 50 训练与推理一致性 (`train-infer-contract`)
