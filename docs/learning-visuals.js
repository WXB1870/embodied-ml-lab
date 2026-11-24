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
  const queries=[[1,.5],[.4,1],[-.5,.8],[1,-.4],[-1,.2]],keys=[[1,0],[.8,.2],[.1,1],[-.5,.3],[-1,-.5]],values=[[1,0],[.5,1],[.3,-.5],[-.5,.4],[-1,-1]];
  const query=queries[q],scores=keys.map(function(k){return (query[0]*k[0]+query[1]*k[1])/Math.sqrt(2);});
  const exps=scores.map(function(s){return Math.exp(s-Math.max.apply(null,scores));}),sum=exps.reduce(function(x,y){return x+y;},0),weights=exps.map(function(x){return x/sum;});
  const output=[0,1].map(function(d){return weights.reduce(function(total,w,i){return total+w*values[i][d];},0);});
  const shown=step>=3?weights:scores.map(function(s){return (s-Math.min.apply(null,scores))/(Math.max.apply(null,scores)-Math.min.apply(null,scores)+1e-8);});
  return '<div class="lv-bars">'+shown.map(function(w,i){return '<div><span>K'+(i+1)+'</span><b><i style="width:'+(w*100)+'%"></i></b><small>'+(step>=3?(w*100).toFixed(1)+'%':'s='+scores[i].toFixed(2))+'</small></div>';}).join('')+'</div><div class="lv-results"><div><span>Query</span><b>['+query.map(function(x){return x.toFixed(1);}).join(', ')+']</b></div><div><span>加权 Value 输出</span><b>['+output.map(function(x){return x.toFixed(2);}).join(', ')+']</b></div></div><p>'+(step<3?'当前显示 Q·K/√d 匹配分数；后续对这些分数做 Softmax。':'当前显示真实 Softmax 权重，并将 Value 向量按权重加权求和。')+'</p>';
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
  const steps=Number(root.querySelector('[data-lv-steps]')?.value||8),method=root.querySelector('[data-lv-method]')?.value||'euler',dt=1/steps;
  const velocity=function(t){return {x:540,y:-100*.75*Math.PI*Math.cos(.75*Math.PI*t)};};
  let x=55,y=175;const pts=[{x:x,y:y}];
  for(let i=0;i<steps;i++){const t=i*dt,v1=velocity(t);let dx=v1.x,dy=v1.y;if(method==='heun'){const v2=velocity(t+dt);dx=(v1.x+v2.x)/2;dy=(v1.y+v2.y)/2;}x+=dt*dx;y+=dt*dy;pts.push({x:x,y:y});}
  const exact=Array.from({length:101},function(_,i){const t=i/100;return {x:55+540*t,y:175-100*Math.sin(.75*Math.PI*t)};}),marker=Math.round(step/(LV[id].steps.length-1)*steps);
  return '<svg viewBox="0 0 650 220" role="img" aria-label="Euler 或 Heun 对时间变化速度场进行数值积分"><path d="M45 20 V185 H615" fill="none" stroke="#cbd5e1"/><polyline points="'+exact.map(function(p){return p.x+','+p.y;}).join(' ')+'" fill="none" stroke="#a8b4c6" stroke-width="2" stroke-dasharray="5 5"/><polyline points="'+pts.map(function(p){return p.x+','+p.y;}).join(' ')+'" fill="none" stroke="#3b82f6" stroke-width="3"/>'+pts.map(function(p,i){return '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+(i===marker?'8':'3')+'" fill="'+(i===marker?'#d97706':'#3b82f6')+'"/>';}).join('')+'<text x="50" y="210" font-size="12" fill="#64748b">噪声</text><text x="610" y="210" text-anchor="end" font-size="12" fill="#64748b">数据</text></svg><div class="lv-results"><div><span>积分器</span><b>'+method.toUpperCase()+'</b></div><div><span>速度求值次数</span><b>'+(method==='heun'?2*steps:steps)+'</b></div><div><span>数值终点偏差</span><b>'+Math.hypot(x-exact[100].x,y-exact[100].y).toFixed(3)+'</b></div></div><p>实线是数值积分，虚线是已知解析轨迹。速度场显式依赖时间；Euler 每步一次求值，Heun 用预测点再求一次并平均斜率。</p>';
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


function agentLabCard(id){
 const c=AGENT[id]; if(!c)return '';
 const controls={
  'agent-loop':'<label>执行分支 <select data-agent-mode><option value="normal">正常接近</option><option value="collision">接近时发生碰撞</option><option value="uncertain">把手位置不确定</option></select></label>',
  'skill-runtime':'<label>触发事件 <select data-agent-event><option value="checkpoint">到达检查点</option><option value="success">后置条件满足</option><option value="failure">接触失败</option><option value="timeout">执行超时</option><option value="cancel">Agent 取消</option></select></label>',
  'long-vla':'<label>VLA 执行进度 <input type="range" min="0" max="100" step="5" value="40" data-agent-progress><output>40%</output></label><label>执行事件 <select data-agent-incident><option value="none">正常执行</option><option value="slip">物体滑落</option><option value="obstacle">新障碍出现</option></select></label>',
  'world-model':'<label>风险权重 <input type="range" min="0" max="2" step=".1" value="1" data-agent-risk><output>1.0</output></label><label>预测可信度 <select data-agent-confidence><option value="high">较高</option><option value="low">较低</option></select></label>',
  'geometry':'<label>像素 u <input type="range" min="180" max="460" step="5" value="380" data-agent-u><output>380 px</output></label><label>深度 Z <input type="range" min=".4" max="1.2" step=".05" value=".8" data-agent-depth><output>0.80 m</output></label>',
  'code-policy':'<label>每次拉动增量 <input type="range" min=".01" max=".08" step=".01" value=".04" data-agent-pull><output>0.04 rad</output></label><label>接触状态 <select data-agent-contact><option value="stable">稳定接触</option><option value="slip">接触滑脱</option></select></label>',
  'evolution':'<label>候选版本成功率 <input type="range" min="50" max="100" step="5" value="90" data-agent-success><output>90%</output></label><label>未见场景回归率 <input type="range" min="0" max="30" step="1" value="4" data-agent-regression><output>4%</output></label>'
 };
 return '<section class="agent-lab-card" data-agent-lab="'+id+'"><header><div><span class="agent-lab-kicker">INTERACTIVE EXPERIMENT</span><h3>'+lvEsc(c.title)+'</h3><p>'+lvEsc(c.intro)+'</p></div></header><div class="agent-lab-controls">'+controls[id]+'</div><div class="agent-lab-stage" data-agent-stage></div><details class="lv-algorithm"><summary>查看对应伪代码</summary><div class="lv-algorithm-body"><pre>'+c.pseudo.map(function(line,i){return '<span class="lv-code-line"><i>'+(i+1)+'</i><code>'+lvEsc(line)+'</code></span>';}).join('')+'</pre></div></details></section>';
}
function agentLabStage(id,root){
 const val=function(sel,fallback){const el=root.querySelector(sel);return el?el.value:fallback;};
 if(id==='agent-loop'){
  const mode=val('[data-agent-mode]','normal');
  const states={
   normal:{skill:'approach_handle',result:'pregrasp_reached',next:'establish_contact',why:'把手定位可信且路径畅通，调用接近技能。'},
   collision:{skill:'recover_from_collision',result:'unexpected_contact',next:'reobserve_scene',why:'执行回执显示意外接触，旧场景状态可能失效；先重新观察，不继续拉门。'},
   uncertain:{skill:'localize_handle_again',result:'low_confidence_pose',next:'active_perception',why:'把手位姿置信度不足，先调用感知技能补充证据。'}
  }[mode];
  return '<div class="agent-lab-results"><div><span>当前子目标</span><b>建立把手接触</b></div><div><span>Agent 选择</span><b>'+states.skill+'</b></div><div><span>执行回执</span><b>'+states.result+'</b></div><div><span>下一步决策</span><b>'+states.next+'</b></div></div><p>'+states.why+' 关键点：执行结果改变 World State，下一轮决策读取更新后的状态，而不是继续使用旧计划。</p>';
 }
 if(id==='skill-runtime'){
  const event=val('[data-agent-event]','checkpoint');
  const paths={
   checkpoint:{state:'Yielded',route:'Accepted → Running → Yielded',detail:'技能到达预设检查点，提交进度与证据，把控制权交回 Agent。Agent 可以继续、切换技能或请求观测。',terminal:false},
   success:{state:'Succeeded',route:'Accepted → Running → Succeeded',detail:'后置条件由验证器确认成立，技能返回成功证据，Agent 更新任务状态。',terminal:true},
   failure:{state:'Failed',route:'Accepted → Running → Failed',detail:'接触建立失败，返回 failure_code 与 recovery_options；不能只返回一个模糊的 false。',terminal:true},
   timeout:{state:'Timed out',route:'Accepted → Running → Timeout',detail:'超过运行预算，Runtime 触发取消/停止流程并回传最后检查点，Agent 决定重试还是恢复。',terminal:true},
   cancel:{state:'Cancelled',route:'Accepted → Running → Cancelled',detail:'Agent 发出取消请求，Runtime 应确认底层执行已停止，再报告取消完成。',terminal:true}
  }[event];
  const nodes=['Accepted','Running','Yielded','Succeeded','Failed','Cancelled'];
  return '<div class="agent-lab-results"><div><span>当前状态</span><b>'+paths.state+'</b></div><div><span>状态路径</span><b>'+paths.route+'</b></div></div><div class="agent-lab-actions">'+nodes.map(function(n){return '<button type="button" '+(paths.state.toLowerCase()===n.toLowerCase()?'aria-pressed="true"':'')+' disabled>'+n+'</button>';}).join('')+'</div><p>'+paths.detail+'</p>';
 }
 if(id==='long-vla'){
  const p=Number(val('[data-agent-progress]','40')),incident=val('[data-agent-incident]','none');
  const agentEvent=incident==='none'?(p>=100?'子目标完成':'等待事件/检查点'):incident==='slip'?'物体滑落：上报异常':'新障碍：请求重规划';
  const vlaState=incident==='none'?(p>=100?'完成':'闭环执行 Chunk'):'暂停当前子任务并上报';
  return '<div class="agent-lab-results"><div><span>Task Agent</span><b>'+agentEvent+'</b></div><div><span>VLA Skill</span><b>'+vlaState+'</b></div><div><span>底层 MPC</span><b>持续控制 / 安全约束</b></div></div><div style="height:12px;background:#e7edf5;border-radius:8px;overflow:hidden;margin:14px 0 6px"><div style="height:100%;width:'+p+'%;background:#6e91bf;border-radius:8px"></div></div><div class="agent-lab-results"><div><span>已执行子任务</span><b>'+p+'%</b></div><div><span>Agent 介入时机</span><b>'+(incident==='none'?(p>=100?'子目标边界':'事件触发'):'异常事件')+'</b></div></div><p>VLA 在 Skill 内部完成多轮观测与动作 Chunk；Agent 不逐 Chunk 推理，只在子目标、异常或预算边界介入。滑块只改变教学模拟进度。</p>';
 }
 if(id==='world-model'){
  const w=Number(val('[data-agent-risk]','1')),conf=val('[data-agent-confidence]','high');
  const candidates=[{name:'法向拉动',goal:12,risk:.2,cost:.3},{name:'切向拉动',goal:4,risk:.9,cost:.2},{name:'先调整底盘',goal:8,risk:.15,cost:.7}];
  const rows=candidates.map(c=>({...c,score:Math.abs(10-c.goal)*.35+w*c.risk+c.cost}));
  rows.sort((a,b)=>a.score-b.score);
  const best=conf==='low'?'调用主动感知':rows[0].name;
  return '<div class="agent-lab-results">'+rows.map(c=>'<div><span>'+c.name+' · 代价</span><b>'+c.score.toFixed(2)+'</b><small style="display:block;color:#8491a3;font-size:10px">门角预测 '+c.goal+'° · 风险 '+c.risk.toFixed(2)+'</small></div>').join('')+'</div><p><strong>Agent 决策：'+best+'</strong>。'+(conf==='low'?'当前预测可信度低，先获取新观测，避免把不可靠预测直接转成物理动作。':'按目标误差、风险权重与执行成本综合评分。')+' 所有数值均为教学模拟量，不代表真实机器人测量。</p>';
 }
 if(id==='geometry'){
  const u=Number(val('[data-agent-u]','380')),z=Number(val('[data-agent-depth]','.8'));
  const fx=600,cx=320,cy=240,v=260,x=(u-cx)*z/fx,y=(v-cy)*z/fx;
  return '<svg viewBox="0 0 620 150" role="img" aria-label="图像像素反投影到相机坐标系"><rect x="18" y="12" width="250" height="126" rx="5" fill="#e8eef6" stroke="#cbd6e4"/><path d="M35 112 L90 48 L140 112 Z" fill="#b9c9dd"/><rect x="158" y="46" width="70" height="62" rx="4" fill="#c5d4e5"/><circle cx="'+(18+(u-180)/280*250)+'" cy="76" r="6" fill="#c45b4d"/><line x1="'+(18+(u-180)/280*250)+'" y1="76" x2="310" y2="76" stroke="#c45b4d" stroke-dasharray="4 4"/><path d="M310 76 L420 34 L420 118 Z" fill="#eef2f7" stroke="#cbd6e4"/><circle cx="420" cy="76" r="6" fill="#4779ba"/><text x="30" y="28" font-size="11" fill="#53677f">RGB / Mask 像素</text><text x="330" y="24" font-size="11" fill="#53677f">相机坐标系</text><text x="435" y="72" font-size="10" fill="#53677f">P₍camera₎</text><text x="435" y="88" font-size="10" fill="#53677f">('+x.toFixed(3)+', '+y.toFixed(3)+', '+z.toFixed(2)+') m</text></svg><div class="agent-lab-results"><div><span>输入像素</span><b>('+u+', '+v+')</b></div><div><span>深度 Z</span><b>'+z.toFixed(2)+' m</b></div><div><span>相机坐标 X</span><b>'+x.toFixed(3)+' m</b></div><div><span>相机坐标 Y</span><b>'+y.toFixed(3)+' m</b></div></div><p>针孔模型：X=(u−cx)Z/fx，Y=(v−cy)Z/fy。得到的仍是相机坐标；变换到世界坐标还需要外参 T_world_camera。</p>';
 }
 if(id==='code-policy'){
  const step=Number(val('[data-agent-pull]','.04')),contact=val('[data-agent-contact]','stable');
  const angle=contact==='stable'?Math.min(90,Math.round(90*step/.08)):Math.min(18,Math.round(18*step/.08));
  const lines=['handle = localize_handle()','move_to(pregrasp(handle))','if not verify_contact(): return recover()','while door_angle() < target:','    compliant_pull(step=delta)','verify_door_open()'];
  const active=contact==='slip'?2:angle>=90?5:4;
  return '<pre class="agent-lab-code">'+lines.map((line,i)=>'<span class="'+(i===active?'active':'')+'">'+(i+1)+'  '+line+'</span>').join('\n')+'</pre><div class="agent-lab-results"><div><span>模拟门角</span><b>'+angle+'°</b></div><div><span>接触状态</span><b>'+(contact==='stable'?'稳定':'滑脱')+'</b></div><div><span>程序结果</span><b>'+(contact==='slip'?'触发恢复':'继续执行')+'</b></div></div><p>改变拉动增量或接触状态，观察程序分支与结果。这里执行的是预设状态模拟，不会运行任意生成代码或控制真实机器人。</p>';
 }
 if(id==='evolution'){
  const success=Number(val('[data-agent-success]','90')),reg=Number(val('[data-agent-regression]','4'));
  const pass=success>=85&&reg<=8;
  return '<div class="agent-lab-results"><div><span>当前版本 v12</span><b>78% 成功率</b></div><div><span>候选版本 v13</span><b>'+success+'% 成功率</b></div><div><span>未见场景回归率</span><b>'+reg+'%</b></div><div><span>晋升判定</span><b style="color:'+(pass?'#2f7059':'#ad7440')+'">'+(pass?'通过，可晋升':'未通过，保留旧版本')+'</b></div></div><div class="agent-lab-actions"><button type="button" data-agent-set="promote" aria-pressed="'+(pass?'true':'false')+'" disabled>候选版本评估</button><button type="button" data-agent-set="rollback" disabled>回滚 v12</button></div><p>示例晋升门槛：成功率至少 85%，未见场景回归率不超过 8%。正式系统还应检查安全违规、完成时间和旧任务回归；评估未通过时不替换当前稳定版本。</p>';
 }
 return '';
}
function updateAgentLab(root){
 const id=root.dataset.agentLab,stage=root.querySelector('[data-agent-stage]');if(!stage)return;
 root.querySelectorAll('.agent-lab-controls input[type=range]').forEach(function(input){
  const out=input.parentElement.querySelector('output');if(!out)return;
  const suffix=input.dataset.agentProgress!==undefined?'%':input.dataset.agentU!==undefined?' px':input.dataset.agentDepth!==undefined?' m':input.dataset.agentPull!==undefined?' rad':'%';
  const n=Number(input.value),digits=input.step&&Number(input.step)<1?2:0;
  out.textContent=n.toFixed(digits)+suffix;
 });
 stage.innerHTML=agentLabStage(id,root);
}
function initAgentLearning(){
 // Route-validation runs this bundle in a minimal VM without a browser DOM.
 // Keep the page initializer inert in that environment; the real page has the DOM API.
 if(typeof document==='undefined'||typeof document.getElementById!=='function')return;
 const host=document.getElementById('agent-learning-extras');if(!host)return;
 const ids=['agent-loop','skill-runtime','long-vla','world-model','geometry','code-policy','evolution'];
 host.innerHTML='<div class="agent-learning-grid">'+ids.map(function(id){return '<div class="agent-learning-item">'+agentLabCard(id)+'</div>';}).join('')+'</div>';
 host.querySelectorAll('[data-agent-lab]').forEach(updateAgentLab);
 host.addEventListener('input',function(e){if(e.target.closest('[data-agent-lab]'))updateAgentLab(e.target.closest('[data-agent-lab]'));});
 host.addEventListener('change',function(e){if(e.target.closest('[data-agent-lab]'))updateAgentLab(e.target.closest('[data-agent-lab]'));});
 // 移动端点击目录后自动收起，桌面端保持常开。
 document.querySelectorAll('.agent-toc a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(){if(window.matchMedia('(max-width: 1100px)').matches){const toc=a.closest('.agent-toc');if(toc)toc.open=false;}});
 });
 if('IntersectionObserver' in window){
  const links=Array.from(document.querySelectorAll('.agent-toc a[href^="#"]'));
  const byId=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){links.forEach(a=>a.removeAttribute('aria-current'));const link=byId.get(entry.target.id);if(link)link.setAttribute('aria-current','location');}
  }),{rootMargin:'-18% 0px -72% 0px',threshold:0});
  document.querySelectorAll('.agent-page .article-section[id]').forEach(section=>observer.observe(section));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAgentLearning);
else initAgentLearning();
