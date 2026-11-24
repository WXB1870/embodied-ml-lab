'use strict';
const LV = {
tensor:{section:'2',title:'张量轴与形状变换',intro:'逐步查看 [B,T,D] 的拆分、换轴、广播与归约。',steps:['原始张量 [B,T,D]','拆分 D=H×d','交换 T 与 H 轴','广播偏置','按有效位归约'],pseudo:['X: [B,T,D]','X = reshape(X, [B,T,H,d])','X = transpose(X, (0,2,1,3))','Y = X + bias[None,None,:,:]','loss = sum(error*mask) / sum(mask)']},
mlp:{section:'affine-nonlinearity',title:'MLP 前向与反向传播',intro:'前向传播生成预测，反向传播沿计算图传递梯度。',steps:['输入 x','Linear：z₁=xW₁+b₁','Activation：h=σ(z₁)','Linear：y=hW₂+b₂','Loss 与反向传播'],pseudo:['z1 = x @ W1 + b1','h1 = activation(z1)','y = h1 @ W2 + b2','loss = criterion(y, target)','loss.backward(); optimizer.step()']},
'cnn-receptive-field':{section:'local-correlation',title:'CNN 卷积窗口与感受野',intro:'选择卷积参数，观察局部窗口如何滑动以及多层感受野如何扩大。',steps:['输入特征图','卷积核覆盖局部窗口','窗口逐位置滑动','Stride 改变采样间隔','多层堆叠扩大感受野'],pseudo:['for each output (i,j):','    patch = X[..., i*s-p:i*s-p+k, j*s-p:j*s-p+k]','    Y[...,i,j] = sum(patch * W)','rf += (kernel-1) * jump','jump *= stride']},
attention:{section:'qkv-projections',title:'Attention：Q/K 匹配与 V 加权读取',intro:'选择 Query，观察它如何匹配 Key，并按权重聚合 Value。',steps:['输入 Token X','投影得到 Q、K、V','计算 QKᵀ/√d','Softmax 得到权重','权重乘 V 得到输出'],pseudo:['Q = X @ Wq; K = X @ Wk; V = X @ Wv','S = Q @ K.transpose(-2,-1) / sqrt(d)','A = softmax(S + mask, dim=-1)','C = A @ V','Y = merge_heads(C) @ Wo']},
rope:{section:'rope-complex',title:'RoPE：位置改变向量相位',intro:'拖动位置，观察二维通道对旋转角度的变化。',steps:['原始 Q/K 向量','读取位置 p','计算旋转角','旋转 Q 与 K','点积携带相对位置信息'],pseudo:['for pair i in range(d/2):','    theta = position * base**(-2*i/d)','    q_pair = rotate(q_pair, theta)','    k_pair = rotate(k_pair, theta)','score = q_rot @ k_rot']},
'norm-ffn':{section:'0',title:'RMSNorm / LayerNorm 与 SwiGLU',intro:'调整输入均值和尺度，观察归一化差异与门控前馈结构。',steps:['原始特征','计算均值与 RMS','归一化并乘权重','SwiGLU 两个分支','门控相乘并投影'],pseudo:['mu = mean(x, dim=-1)','rms = sqrt(mean(x*x, dim=-1) + eps)','x_norm = (x-mu) / std  # LayerNorm','gate = silu(x @ Wg); value = x @ Wv','y = (gate * value) @ Wo']},
multimodal:{section:'1',title:'图像 Patch 与多模态特征',intro:'选择图像 Patch，查看局部视觉区域如何变成 Token。',steps:['输入图像','切分 Patch','Patch Embedding','视觉编码器输出','Projector 对齐隐藏维'],pseudo:['patches = patchify(images)','vision_tokens = vision_encoder(patches)','text_tokens = language_encoder(input_ids)','vision_tokens = projector(vision_tokens)','multimodal = pack(vision_tokens, text_tokens)']},
'masking-autoregressive':{section:'4',title:'Attention Mask：谁能读取谁',intro:'切换因果、双向和 Prefix/Action Block 规则。行是 Query，列是 Key。',steps:['定义 Token 区域','构造可见性矩阵','屏蔽不允许区域','Softmax 只在可见 Key 上归一化','Loss Mask 单独决定监督'],pseudo:['for q in query_positions:','    for k in key_positions:','        visible[q,k] = allowed(q.region, k.region)','scores = scores.masked_fill(~visible, -inf)','loss = masked_loss(logits, labels, loss_mask)']},
'kv-cache':{section:'1',title:'KV Cache：Prefill 与增量 Decode',intro:'改变生成步数，观察缓存如何增长以及新 Token 如何追加。',steps:['Prefill 固定前缀','保存每层 K/V','接收新 Token','只计算新 K/V','Query 读取历史缓存'],pseudo:['K_cache, V_cache = prefill(prefix)','for token in generated_tokens:','    k_new, v_new = project(token)','    K_cache = append(K_cache, k_new)','    output = attention(q_new, K_cache, V_cache)']},
vae:{section:'reparameterization',title:'VAE：重参数化采样',intro:'固定噪声 ε，观察 z=μ+σε 如何变化。',steps:['Encoder 输出 μ、logσ²','采样标准高斯 ε','重参数化得到 z','Decoder 重建 x̂','重建项与 KL 共同训练'],pseudo:['mu, logvar = encoder(x)','eps = randn_like(mu)','z = mu + exp(0.5*logvar) * eps','x_hat = decoder(z)','loss = recon(x_hat,x) + beta * KL']},
'flow-matching':{section:'linear-path',title:'Flow Matching：概率路径与 ODE 积分',intro:'调整积分步数与方法，查看粒子如何从噪声端流向数据端。',steps:['采样噪声 x₀ 与数据 x₁','采样生成时间 t','构造 xₜ 与目标速度','网络预测速度场','ODE 积分生成样本'],pseudo:['x0 ~ p_source; x1 ~ p_data; t ~ Uniform(0,1)','xt = (1-t)*x0 + t*x1','target_v = x1 - x0','loss = mse(v_theta(xt,t,condition), target_v)','x = ode_integrate(v_theta, x_init, 0, 1)']},
diffusion:{section:'0',title:'Diffusion：逐步加噪与反向去噪',intro:'拖动时间步，查看信号和噪声比例如何变化。',steps:['干净样本 x₀','按噪声日程构造 xₜ','网络预测噪声 εθ','估计干净样本 x̂₀','调度器更新到 xₜ₋₁'],pseudo:['eps ~ Normal(0,I)','xt = sqrt(alpha_bar[t])*x0 + sqrt(1-alpha_bar[t])*eps','eps_hat = model(xt,t,condition)','x0_hat = (xt-sqrt(1-alpha_bar[t])*eps_hat)/sqrt(alpha_bar[t])','x_prev = scheduler.step(eps_hat,t,xt)']},
'score-sde':{section:'forward-sde',title:'SDE 与概率流 ODE',intro:'对比随机扩散路径与确定性概率流的差别。',steps:['初始样本','正向 SDE 加漂移与随机项','学习 Score','反向 SDE 恢复分布','概率流 ODE 确定性路径'],pseudo:['dx = f(x,t)dt + g(t)dW','score = grad_x log p_t(x)','reverse_drift = f - g(t)^2 * score','probability_flow = f - 0.5*g(t)^2*score','integrate reverse dynamics from noise to data']},
'dit-adaln':{section:'5',title:'DiT：条件调制与零初始化门控',intro:'拖动门控强度，观察条件分支如何逐渐影响原始表示。',steps:['输入隐藏状态','条件生成 shift/scale','归一化特征调制','门控控制残差分支','输出速度或噪声预测'],pseudo:['shift, scale, gate = cond_mlp(time, condition)','h = norm(x) * (1 + scale) + shift','x = x + gate * attention(h)','x = x + gate_ffn * ffn(norm(x))','prediction = output_head(x)']},
'behavior-cloning':{section:'2',title:'行为克隆：示教动作与多峰歧义',intro:'两种示教模式分别向左和向右，观察 MSE 均值可能落在两种模式之间。',steps:['采集观测与专家动作','策略预测动作','计算监督误差','多峰示教被均值回归','闭环访问状态发生偏移'],pseudo:['obs, expert_action = dataset.sample()','pred = policy(obs)','loss = masked_mse(pred, expert_action)','loss.backward(); optimizer.step()','evaluate_closed_loop(policy, environment)']},
'action-chunking':{section:'5',title:'RTC：旧 Chunk、过渡区与新预测',intro:'调整旧动作前缀与融合区长度，观察新旧预测在物理时间轴上的交接。',steps:['旧 Chunk 持续执行','新推理尚未完成','保留已提交旧动作','重叠区平滑过渡','后续动作切换为新预测'],pseudo:['old_chunk = active_plan','new_chunk = await policy.predict(latest_obs)','keep = committed_old_prefix','transition = blend(old_overlap, new_overlap)','plan = keep + transition + new_future']},
'generative-policy':{section:'receding-horizon-protocol',title:'ACT、Diffusion 与 Flow Policy',intro:'切换生成策略，比较三种动作块生成路径。',steps:['观测与任务条件','ACT：潜变量采样与解码','Diffusion：逐步去噪','Flow：速度场积分','Receding Horizon 执行'],pseudo:['condition = encode(observation, instruction)','ACT: action = decoder(condition, z)','Diffusion: action = denoise_loop(noise, condition)','Flow: action = ode_integrate(velocity, noise, condition)','execute_prefix(action); observe_again()']},
'vla-architecture':{section:'vlm-to-policy',title:'VLA：从观测 Token 到动作速度',intro:'点击流程步骤，查看图像、语言、状态与动作分别进入哪些模块。',steps:['图像与语言输入','视觉语言骨干编码','机器人状态投影','Action Expert 读取条件与噪声动作','输出速度并积分为动作块'],pseudo:['vision = vision_encoder(images)','language = language_model(tokens)','state = state_projector(robot_state)','velocity = action_expert(noisy_actions, time, condition)','actions = ode_solver(velocity)']},
lora:{section:'1',title:'LoRA：低秩参数更新',intro:'调整 Rank，观察新增参数量与原权重冻结后的低秩更新。',steps:['冻结预训练权重 W','输入经过低秩矩阵 A','再经过低秩矩阵 B','缩放后叠加原输出','只更新 A 与 B'],pseudo:['base = x @ W  # W frozen','low_rank = (x @ A) @ B','y = base + (alpha / rank) * low_rank','loss = task_loss(y, target)','update(A, B); keep(W)']},
'policy-gradient':{section:'0',title:'Policy Gradient：优势改变动作概率',intro:'调整 Advantage，观察目标动作的概率更新方向。',steps:['策略采样动作','环境返回回报','估计 Advantage','最大化 A × log π(a|s)','更新策略参数'],pseudo:['action ~ pi_theta(.|state)','reward = env.step(action)','advantage = return - baseline','loss = -log_prob(action) * advantage','optimizer.step()']},
ppo:{section:'ppo-2',title:'PPO：GAE 与 Clipped Objective',intro:'调整概率比和 Advantage，观察裁剪目标如何限制单个样本的更新激励。',steps:['采集 rollout 与 old_log_prob','计算 TD residual','反向递推 GAE','计算新旧策略概率比','裁剪 surrogate 并更新'],pseudo:['delta_t = r_t + gamma*(1-done)*V_next - V_t','A_t = delta_t + gamma*lambda*(1-done)*A_next','ratio = exp(new_logp - old_logp)','objective = min(ratio*A, clip(ratio,1-eps,1+eps)*A)','actor_loss = -mean(objective)']},
'dpo-grpo':{section:'grpo-group',title:'DPO / GRPO：偏好与组内优势',intro:'调整 β，观察组内奖励中心化和偏好目标的尺度。',steps:['同一任务生成候选','获得偏好或奖励','DPO 比较 chosen/rejected','GRPO 计算组内相对优势','按策略概率目标更新'],pseudo:['DPO: ratio = logp(chosen)-logp(rejected)','loss = -logsigmoid(beta*(ratio-ref_ratio))','mean = group_mean(rewards)','advantage = (rewards-mean)/(group_std+eps)','update_policy_with_valid_log_prob(advantage)']}
};
const AGENT = {
'agent-loop':{title:'Agent Loop：Observe → Decide → Act → Verify',intro:'改变执行结果，观察任务状态如何推进或触发重规划。',steps:['读取任务与 World State','选择一个 Skill','执行并接收事件','验证后置条件','成功结束或恢复重规划'],pseudo:['while not task.completed:','    state = observe_world()','    decision = agent.choose_skill(state, task)','    result = await runtime.execute(decision)','    task_state = verify(result, observe_world())']},
'skill-runtime':{title:'Skill Contract 与生命周期',intro:'沿状态机观察一个 Skill 从接收到完成的过程。',steps:['Accepted：参数校验通过','Running：正在执行','Yielded：等待外部决策','Succeeded：后置条件满足','Failed / Cancelled：失败或取消'],pseudo:['skill = registry.resolve(name)','validate_schema(inputs)','check_preconditions(world_state)','result = await skill.run(inputs, timeout)','verify_postconditions(result, world_state)']},
'long-vla':{title:'长时序 VLA Skill 执行',intro:'把 VLA 内部动作 Chunk 执行与 Agent 任务级检查分开。',steps:['Agent 启动子任务','VLA 内部观测与预测','执行动作块前缀','子目标或异常上报','Agent 决定继续或恢复'],pseudo:['handle = vla_skill.start(subgoal)','while handle.status == "running":','    event = handle.poll_event()','    if event.needs_replan: agent.replan()','    result = verify(event.evidence)']},
'world-model':{title:'World Model：候选动作预测',intro:'比较不同候选动作的预测未来和目标代价。',steps:['读取当前 World State','生成候选动作','预测各候选未来','计算目标与风险代价','选择执行或请求更多观测'],pseudo:['candidates = propose_actions(world_state)','predictions = world_model.predict(world_state, candidates)','scores = evaluate(predictions, goal, constraints)','best = argmin(scores)','execute(best)']},
geometry:{title:'感知几何：RGB → Mask → Depth → 3D',intro:'输入像素与深度，通过相机内参恢复相机坐标系三维点。',steps:['RGB 与目标检测','SAM 输出 Mask','深度图给出 Z','相机内参反投影','输出相机坐标系 3D 点'],pseudo:['mask = segment(image, prompt)','depth = estimate_depth(image)','u,v = selected_pixel(mask)','X = (u-cx)*Z/fx; Y = (v-cy)*Z/fy','point_camera = [X,Y,Z]']},
'code-policy':{title:'Code-as-Policy：生成、验证与执行',intro:'沿程序生成流水线推进，区分语法正确、接口正确与任务成功。',steps:['自然语言任务','生成程序 / AST','静态检查与 API 校验','沙箱执行','验证结果并反馈修订'],pseudo:['program = agent.generate(task, skill_api)','ast = parse(program)','validate_syntax(ast); validate_calls(ast, registry)','result = sandbox.execute(ast)','verify_result(result, world_state)']},
evolution:{title:'Code Policy Evolution：经验到版本晋升',intro:'改变候选策略的评估结果，观察晋升或回滚。',steps:['记录执行经验','检索相似失败案例','生成候选修改','仿真与回归评估','晋升或回滚版本'],pseudo:['experience = record(task, policy_version, outcome)','cases = memory.retrieve(experience)','candidate = revise(current_policy, cases)','metrics = evaluate(candidate, regression_suite)','promote(candidate) if passes(metrics) else rollback()']},
'meta-policy':{title:'Meta-policy：选择合适的 Skill',intro:'调整成功率、执行成本和风险权重，观察技能选择变化。',steps:['获取可用 Skill','估计成功率与成本','计算风险约束下效用','选择并执行 Skill','根据结果更新技能统计'],pseudo:['for skill in available_skills:','    utility[skill] = success*value - cost - risk_penalty','selected = argmax(utility)','result = runtime.execute(selected)','update_skill_statistics(selected, result)']}
};
function lvEsc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function renderAlgorithmPanel(c){return '<details class="lv-algorithm"><summary>算法伪代码 · '+lvEsc(c.title)+'</summary><div class="lv-algorithm-body"><pre>'+c.pseudo.map(function(line,i){return '<span class="lv-code-line"><i>'+(i+1)+'</i><code>'+lvEsc(line)+'</code><small>'+lvEsc((c.notes||[])[i]||'对应本步骤的核心计算。')+'</small></span>';}).join('')+'</pre><p>'+lvEsc(c.intro)+'</p></div></details>';}
function renderLVControls(id){
 const specs={
 attention:'<label>Query Token <select data-lv-query>'+[0,1,2,3,4].map(function(i){return '<option value="'+i+'">Token '+(i+1)+'</option>';}).join('')+'</select></label>',
 'masking-autoregressive':'<label>可见性规则 <select data-lv-mode><option value="causal">因果 Mask</option><option value="all">双向 Mask</option><option value="prefix">Prefix + Action Block</option></select></label>',
 'flow-matching':'<div class="lv-params"><label>积分步数 <input type="range" min="1" max="32" value="8" data-lv-steps><output>8</output></label><label>积分器 <select data-lv-method><option value="euler">Euler</option><option value="heun">Heun</option></select></label></div>',
 'action-chunking':'<div class="lv-params"><label>旧动作前缀 <input type="range" min="1" max="15" value="7" data-lv-old><output>7</output></label><label>融合区 <input type="range" min="1" max="20" value="9" data-lv-blend><output>9</output></label></div>',
 ppo:'<div class="lv-params"><label>Ratio <input type="range" min=".5" max="1.8" step=".01" value="1.35" data-lv-ratio><output>1.35</output></label><label>Advantage <select data-lv-adv><option value="1">正优势 +1</option><option value="-1">负优势 −1</option></select></label></div>',
 lora:'<label>LoRA Rank <input type="range" min="1" max="64" value="8" data-lv-rank><output>8</output></label>',
 'dit-adaln':'<label>残差门控强度 <input type="range" min="0" max="1" step=".01" value="0" data-lv-gate><output>0.00</output></label>',
 diffusion:'<label>归一化噪声时间 t <input type="range" min="0" max="1" step=".01" value=".5" data-lv-time><output>0.50</output></label>',
 rope:'<label>位置 p <input type="range" min="0" max="20" value="4" data-lv-position><output>4</output></label>',
 'norm-ffn':'<div class="lv-params"><label>输入均值 <input type="range" min="-3" max="3" step=".1" value="2" data-lv-mean><output>2.0</output></label><label>输入尺度 <input type="range" min=".5" max="3" step=".1" value="1.5" data-lv-scale><output>1.5</output></label></div>',
 multimodal:'<label>选择 Patch <input type="range" min="0" max="15" value="4" data-lv-patch><output>4</output></label>',
 'kv-cache':'<label>已生成 Token 数 <input type="range" min="1" max="16" value="6" data-lv-tokens><output>6</output></label>',
 'behavior-cloning':'<label>右侧示教样本比例 <input type="range" min="0" max="1" step=".05" value=".5" data-lv-mix><output>0.50</output></label>',
 'policy-gradient':'<label>Advantage <input type="range" min="-2" max="2" step=".1" value="1" data-lv-adv><output>1.0</output></label>',
 'dpo-grpo':'<label>β <input type="range" min=".01" max="1" step=".01" value=".1" data-lv-beta><output>0.10</output></label>',
 vae:'<label>KL 权重 β <input type="range" min="0" max="4" step=".1" value="1" data-lv-beta><output>1.0</output></label>'
 };
 return '<div class="lv-interactive-controls">'+(specs[id]||'')+'</div>';
}
function renderLearningVisual(id,c){return '<section class="lv-visual" data-learning-visual="'+lvEsc(id)+'"><header><div><span>算法可视化</span><h3>'+lvEsc(c.title)+'</h3></div><p>'+lvEsc(c.intro)+'</p></header>'+renderLVControls(id)+'<div class="lv-stage" data-lv-stage></div><nav class="lv-controls"><button type="button" data-lv-prev disabled>上一步</button><input type="range" min="0" max="'+(c.steps.length-1)+'" value="0" step="1" data-lv-range aria-label="演示步骤"><button type="button" data-lv-next>下一步</button><button type="button" data-lv-play>自动播放</button><button type="button" data-lv-reset>重置</button></nav><div class="lv-step-list">'+c.steps.map(function(s,i){return '<button type="button" class="lv-step '+(i===0?'active':'')+'" data-lv-step="'+i+'">'+(i+1)+'. '+lvEsc(s)+'</button>';}).join('')+'</div><p class="lv-explain" data-lv-explain></p></section>';}
function renderLessonLearning(id){const c=LV[id];return c?renderAlgorithmPanel(c)+renderLearningVisual(id,c):'';}
function renderAgentLearning(id){const c=AGENT[id];return c?renderAlgorithmPanel(c)+renderLearningVisual(id,c):'';}
function lvStage(id,step,root){
 const c=LV[id]||AGENT[id],n=c.steps.length;
 if(id==='attention'){
  const q=Number(root.querySelector('[data-lv-query]')?.value||2);
  return '<div class="lv-attn-controls">Query Token <select data-lv-query>'+[0,1,2,3,4].map(function(i){return '<option value="'+i+'" '+(i===q?'selected':'')+'>Token '+(i+1)+'</option>';}).join('')+'</select></div><div class="lv-bars">'+[0,1,2,3,4].map(function(i){const w=Math.exp(-Math.abs(i-q)*(step+1)*.55);return '<div><span>T'+(i+1)+'</span><b><i style="width:'+(w*100)+'%"></i></b><small>'+Math.round(w*100)+'*</small></div>';}).join('')+'</div><p>匹配权重为教学示意；真实权重由 QKᵀ、Mask 与 Softmax 共同决定。</p>';
 }
 if(id==='masking-autoregressive'){
  const mode=root.querySelector('[data-lv-mode]')?.value||'causal';
  return '<label>可见性规则 <select data-lv-mode><option value="causal">因果 Mask</option><option value="all">双向 Mask</option><option value="prefix">Prefix + Action Block</option></select></label><div class="lv-mask-grid">'+[0,1,2,3,4,5].map(function(i){return '<div class="lv-mask-row">'+[0,1,2,3,4,5].map(function(j){const yes=mode==='all'||(mode==='causal'?j<=i:(i<4?j<4:true));return '<span class="'+(yes?'on':'off')+'">'+(yes?'1':'0')+'</span>';}).join('')+'</div>';}).join('')+'</div><p>行是 Query，列是 Key。1 表示允许读取；不是 Softmax 后的权重。</p>';
 }
 if(id==='action-chunking'){
  const old=Number(root.querySelector('[data-lv-old]')?.value||7),blend=Number(root.querySelector('[data-lv-blend]')?.value||9),fresh=34;
  return '<div class="lv-params"><label>旧动作前缀 <input type="range" min="1" max="15" value="'+old+'" data-lv-old><output>'+old+'</output></label><label>融合区 <input type="range" min="1" max="20" value="'+blend+'" data-lv-blend><output>'+blend+'</output></label></div><div class="lv-timeline"><span class="old" style="flex:'+old+'">旧动作 '+old+'</span><span class="blend" style="flex:'+blend+'">融合 '+blend+'</span><span class="fresh" style="flex:'+fresh+'">新预测 '+fresh+'</span></div><p>总长 '+(old+blend+fresh)+' 步。必须按绝对物理时间对齐；长度只是可调示例，不是 RTC 固定常数。</p>';
 }
 if(id==='flow-matching'){
  const steps=Number(root.querySelector('[data-lv-steps]')?.value||8),method=root.querySelector('[data-lv-method]')?.value||'euler';
  const pts=Array.from({length:steps+1},function(_,i){const t=i/steps;return {x:55+540*t,y:175-100*Math.sin(Math.PI*t*.75)};});
  return '<div class="lv-params"><label>积分步数 <input type="range" min="1" max="32" value="'+steps+'" data-lv-steps><output>'+steps+'</output></label><label>积分器 <select data-lv-method><option value="euler" '+(method==='euler'?'selected':'')+'>Euler</option><option value="heun" '+(method==='heun'?'selected':'')+'>Heun</option></select></label></div><svg viewBox="0 0 650 220" role="img" aria-label="粒子沿生成路径移动"><path d="M45 20 V185 H615" fill="none" stroke="#cbd5e1"/><polyline points="'+pts.map(function(p){return p.x+','+p.y;}).join(' ')+'" fill="none" stroke="#3b82f6" stroke-width="3"/>'+pts.map(function(p,i){return '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+(i===step?'8':'3')+'" fill="'+(i===step?'#d97706':'#3b82f6')+'"/>';}).join('')+'<text x="50" y="210" font-size="12" fill="#64748b">噪声</text><text x="610" y="210" text-anchor="end" font-size="12" fill="#64748b">数据</text></svg><p>示意路径按步数采样；Euler 每步一次速度求值，Heun 通常每步两次。并未假装运行训练好的模型。</p>';
 }
 if(id==='vla-architecture'){
  const names=['Vision Encoder','Language Backbone','State Projection','Action Expert','Flow / ODE'];
  const desc=['Images → visual tokens','Text → language tokens','Robot state → embedding','Noisy actions + condition → velocity','Velocity → action chunk'];
  return '<div class="lv-pipeline">'+names.map(function(s,i){return '<div class="'+(i<=step?'active':'')+'"><b>'+s+'</b><small>'+desc[i]+'</small></div>';}).join('')+'</div>';
 }
 if(id==='ppo'){
  const ratio=Number(root.querySelector('[data-lv-ratio]')?.value||1.35),adv=Number(root.querySelector('[data-lv-adv]')?.value||1),eps=.2,raw=ratio*adv,clip=Math.max(1-eps,Math.min(1+eps,ratio))*adv,obj=Math.min(raw,clip);
  return '<div class="lv-params"><label>Ratio <input type="range" min=".5" max="1.8" step=".01" value="'+ratio+'" data-lv-ratio><output>'+ratio.toFixed(2)+'</output></label><label>Advantage <select data-lv-adv><option value="1">正优势 +1</option><option value="-1">负优势 −1</option></select></label></div><div class="lv-results"><div><span>未裁剪 r·A</span><b>'+raw.toFixed(3)+'</b></div><div><span>裁剪后目标</span><b>'+obj.toFixed(3)+'</b></div><div><span>裁剪区间</span><b>[0.80, 1.20]</b></div></div><p>这是单样本 surrogate 的 min 分支，不代表 PPO 对全局 KL 提供严格上界。</p>';
 }
 if(id==='lora'){
  const rank=Number(root.querySelector('[data-lv-rank]')?.value||8),base=1024*1024,added=rank*2048;
  return '<label>LoRA Rank <input type="range" min="1" max="64" value="'+rank+'" data-lv-rank><output>'+rank+'</output></label><div class="lv-results"><div><span>原矩阵参数</span><b>'+base.toLocaleString()+'</b></div><div><span>新增参数</span><b>'+added.toLocaleString()+'</b></div><div><span>新增占总参数</span><b>'+(100*added/(base+added)).toFixed(2)+'%</b></div></div><p>假设 Linear(1024,1024)，不含 bias。真实显存还取决于激活、梯度与优化器状态。</p>';
 }
 if(id==='dit-adaln'){
  const gate=Number(root.querySelector('[data-lv-gate]')?.value||0);
  return '<label>残差门控强度 <input type="range" min="0" max="1" step=".01" value="'+gate+'" data-lv-gate><output>'+gate.toFixed(2)+'</output></label><div class="lv-gate"><span>原始表示</span><b>+</b><span class="branch" style="opacity:'+gate+'">条件分支 × '+gate.toFixed(2)+'</span><b>=</b><strong>输出</strong></div><p>门控为 0 时新增残差分支不改变初始前向；真实 AdaLN-Zero 还会调制 Attention 与 MLP 子层。</p>';
 }
 if(id==='diffusion'){
  const t=Number(root.querySelector('[data-lv-time]')?.value||.5),sig=Math.sqrt(1-t),noise=Math.sqrt(t);
  return '<label>归一化噪声时间 t <input type="range" min="0" max="1" step=".01" value="'+t+'" data-lv-time><output>'+t.toFixed(2)+'</output></label><div class="lv-noise"><span style="width:'+(sig*100)+'%">信号 '+Math.round(sig*100)+'%</span><span style="width:'+(noise*100)+'%">噪声 '+Math.round(noise*100)+'%</span></div><p>简化线性方差示意，不代表任意 DDPM β schedule 的精确系数。</p>';
 }
 if(id==='rope'){
  const p=Number(root.querySelector('[data-lv-position]')?.value||4),a=p*.45,x=90+65*Math.cos(a),y=90-65*Math.sin(a);
  return '<label>位置 p <input type="range" min="0" max="20" value="'+p+'" data-lv-position><output>'+p+'</output></label><svg viewBox="0 0 220 180" role="img" aria-label="RoPE 二维向量旋转"><circle cx="90" cy="90" r="65" fill="none" stroke="#cbd5e1" stroke-dasharray="4 4"/><line x1="90" y1="90" x2="'+x+'" y2="'+y+'" stroke="#2563eb" stroke-width="4"/><circle cx="'+x+'" cy="'+y+'" r="6" fill="#2563eb"/><text x="125" y="160" font-size="11" fill="#64748b">θ='+a.toFixed(2)+' rad</text></svg>';
 }
 if(id==='norm-ffn'){
  const mean=Number(root.querySelector('[data-lv-mean]')?.value||2),scale=Number(root.querySelector('[data-lv-scale]')?.value||1.5);
  return '<div class="lv-params"><label>输入均值 <input type="range" min="-3" max="3" step=".1" value="'+mean+'" data-lv-mean><output>'+mean.toFixed(1)+'</output></label><label>输入尺度 <input type="range" min=".5" max="3" step=".1" value="'+scale+'" data-lv-scale><output>'+scale.toFixed(1)+'</output></label></div><div class="lv-results"><div><span>LayerNorm 均值</span><b>≈ 0</b></div><div><span>输入 RMS</span><b>'+Math.sqrt(mean*mean+scale*scale).toFixed(2)+'</b></div><div><span>RMSNorm 保留均值偏移</span><b>'+(mean/Math.sqrt(mean*mean+scale*scale)).toFixed(2)+'</b></div></div>';
 }
 if(id==='multimodal'){
  const selected=Number(root.querySelector('[data-lv-patch]')?.value||4);
  return '<label>选择 Patch <input type="range" min="0" max="15" value="'+selected+'" data-lv-patch><output>'+selected+'</output></label><div class="lv-patches">'+Array.from({length:16},function(_,i){return '<span class="'+(i===selected?'selected':'')+'">'+i+'</span>';}).join('')+'</div><p>Patch Token 对应图像局部区域；还需位置与视角身份信息。</p>';
 }
 if(id==='kv-cache'){
  const n=Number(root.querySelector('[data-lv-tokens]')?.value||6);
  return '<label>已生成 Token 数 <input type="range" min="1" max="16" value="'+n+'" data-lv-tokens><output>'+n+'</output></label><div class="lv-cache">'+Array.from({length:n},function(_,i){return '<span><b>T'+(i+1)+'</b><small>Kᵢ · Vᵢ</small></span>';}).join('')+'</div><p>每层缓存随已处理位置增长；新一步追加新 K/V。</p>';
 }
 if(id==='behavior-cloning'){
  const mix=Number(root.querySelector('[data-lv-mix]')?.value||.5),avg=-1*(1-mix)+mix;
  return '<label>右侧示教样本比例 <input type="range" min="0" max="1" step=".05" value="'+mix+'" data-lv-mix><output>'+mix.toFixed(2)+'</output></label><div class="lv-results"><div><span>左模式</span><b>−1</b></div><div><span>右模式</span><b>+1</b></div><div><span>均值回归示例</span><b>'+avg.toFixed(2)+'</b></div></div><p>同一条件下的多峰示教可能被 MSE 压成均值。</p>';
 }
 if(id==='policy-gradient'){
  const a=Number(root.querySelector('[data-lv-adv]')?.value||1);
  return '<label>Advantage <input type="range" min="-2" max="2" step=".1" value="'+a+'" data-lv-adv><output>'+a.toFixed(1)+'</output></label><div class="lv-results"><div><span>目标动作概率方向</span><b>'+(a>0?'提高概率':a<0?'降低概率':'无一阶推动')+'</b></div><div><span>Loss 系数 −A</span><b>'+(-a).toFixed(2)+'</b></div></div>';
 }
 if(id==='dpo-grpo'){
  const beta=Number(root.querySelector('[data-lv-beta]')?.value||.1);
  return '<label>β <input type="range" min=".01" max="1" step=".01" value="'+beta+'" data-lv-beta><output>'+beta.toFixed(2)+'</output></label><div class="lv-results"><div><span>候选 A 奖励</span><b>2.0</b></div><div><span>候选 B 奖励</span><b>0.0</b></div><div><span>组内相对优势</span><b>+1 / −1</b></div></div><p>这里只展示组内中心化；真实 GRPO 还需处理标准差、KL 和有效策略概率。</p>';
 }
 if(id==='vae'){
  const beta=Number(root.querySelector('[data-lv-beta]')?.value||1),z=.4+.55*.8;
  return '<label>KL 权重 β <input type="range" min="0" max="4" step=".1" value="'+beta+'" data-lv-beta><output>'+beta.toFixed(1)+'</output></label><div class="lv-results"><div><span>μ</span><b>0.40</b></div><div><span>σ</span><b>0.55</b></div><div><span>固定 ε 下的 z</span><b>'+z.toFixed(2)+'</b></div><div><span>KL 系数</span><b>'+beta.toFixed(1)+'</b></div></div><p>固定 ε 隔离重参数化计算；β 改变训练目标中的 KL 权重。</p>';
 }
 if(id==='agent-loop'||id==='skill-runtime'||id==='long-vla'||id==='world-model'||id==='geometry'||id==='code-policy'||id==='evolution'||id==='meta-policy'){
  return '<div class="lv-pipeline">'+c.steps.map(function(s,i){return '<div class="'+(i<=step?'active':'')+'"><b>'+(i+1)+'</b><span>'+lvEsc(s)+'</span></div>';}).join('')+'</div><p>'+lvEsc(c.steps[step])+'</p>';
 }
 return '<div class="lv-pipeline">'+c.steps.map(function(s,i){return '<div class="'+(i<=step?'active':'')+'"><b>'+(i+1)+'</b><span>'+lvEsc(s)+'</span></div>';}).join('')+'</div>';
}
function updateLearningVisual(root){
 const id=root.dataset.learningVisual,c=LV[id]||AGENT[id];if(!c)return;
 const range=root.querySelector('[data-lv-range]'),step=Number(range?.value||0);
 root.querySelectorAll('[data-lv-step]').forEach(function(b,i){b.classList.toggle('active',i===step);b.setAttribute('aria-pressed',String(i===step));});
 const prev=root.querySelector('[data-lv-prev]'),next=root.querySelector('[data-lv-next]');
 if(prev)prev.disabled=step===0;if(next)next.disabled=step===c.steps.length-1;
 const explain=root.querySelector('[data-lv-explain]');if(explain)explain.textContent=c.steps[step];
 root.querySelectorAll('.lv-interactive-controls input[type=range]').forEach(function(input){const output=input.parentElement.querySelector('output');if(output)output.textContent=Number(input.value).toFixed(input.step&&Number(input.step)<1?2:0);});
 const stage=root.querySelector('[data-lv-stage]');if(stage)stage.innerHTML=lvStage(id,step,root);
}
function initLearningVisuals(scope){
 (scope||document).querySelectorAll('[data-learning-visual]').forEach(function(root){if(root.dataset.lvReady)return;root.dataset.lvReady='1';updateLearningVisual(root);});
}
document.addEventListener('input',function(e){const root=e.target.closest('[data-learning-visual]');if(root)updateLearningVisual(root);});
document.addEventListener('change',function(e){const root=e.target.closest('[data-learning-visual]');if(root)updateLearningVisual(root);});
document.addEventListener('click',function(e){
 const root=e.target.closest('[data-learning-visual]');if(!root)return;
 const range=root.querySelector('[data-lv-range]');if(!range)return;
 if(e.target.matches('[data-lv-step]'))range.value=e.target.dataset.lvStep;
 else if(e.target.matches('[data-lv-prev]'))range.value=Math.max(0,Number(range.value)-1);
 else if(e.target.matches('[data-lv-next]'))range.value=Math.min(Number(range.max),Number(range.value)+1);
 else if(e.target.matches('[data-lv-reset]'))range.value=0;
 else if(e.target.matches('[data-lv-play]')){
  const button=e.target;
  if(root._lvTimer){clearInterval(root._lvTimer);root._lvTimer=null;button.textContent='自动播放';}
  else{button.textContent='暂停';root._lvTimer=setInterval(function(){if(!root.isConnected){clearInterval(root._lvTimer);return;}if(Number(range.value)>=Number(range.max)){clearInterval(root._lvTimer);root._lvTimer=null;button.textContent='自动播放';return;}range.value=Number(range.value)+1;updateLearningVisual(root);},850);}
 }else return;
 updateLearningVisual(root);
});
document.addEventListener('visibilitychange',function(){if(document.hidden)document.querySelectorAll('[data-learning-visual]').forEach(function(root){if(root._lvTimer){clearInterval(root._lvTimer);root._lvTimer=null;const b=root.querySelector('[data-lv-play]');if(b)b.textContent='自动播放';}});});
if(window.addEventListener)window.addEventListener('beforeunload',function(){document.querySelectorAll('[data-learning-visual]').forEach(function(root){if(root._lvTimer)clearInterval(root._lvTimer);});});

function initAgentLearning(){
 const host=document.getElementById('agent-learning-extras');
 if(!host)return;
 const ids=['agent-loop','skill-runtime','long-vla','world-model','geometry','code-policy','evolution','meta-policy'];
 host.innerHTML='<div class="agent-learning-grid">'+ids.map(function(id){return '<div class="agent-learning-item">'+renderAgentLearning(id)+'</div>';}).join('')+'</div>';
 initLearningVisuals(host);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAgentLearning);
else initAgentLearning();
