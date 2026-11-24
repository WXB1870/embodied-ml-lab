'use strict';

const TOPIC_META={
 mlp:{name:'MLP',description:'函数表示、矩阵梯度与优化几何'},
 cnn:{name:'CNN',description:'卷积几何、感受野与空间信息'},
 transformer:{name:'Transformer',description:'注意力、信息流与训练推理接口'},
 'flow-matching':{name:'Flow Matching',description:'概率路径、条件期望与 ODE 生成'}
};
const CORE_LESSON_TOPIC={mlp:'mlp','cnn-receptive-field':'cnn',attention:'transformer','flow-matching':'flow-matching'};

const COURSE_STAGES=['基础与骨干','生成与策略','对齐与智能体'];
const COURSE_ROADMAP={
 'network-foundations':['Tensor & Backbone','M4 4h16v16H4zM4 12h16M12 4v16'],
 transformers:['Transformer / VLM','M5 5h4v4H5zM15 5h4v4h-4zM10 15h4v4h-4zM7 9v3l5 3 5-3V9'],
 generative:['Diffusion / Flow','M3 17c4 0 4-10 9-10s5 6 9 6M3 12c4 0 4-6 9-6s5 11 9 11'],
 policies:['Embodied Policy / VLA','M4 12h3l3-6 4 12 3-6h3'],
 posttraining:['Post-Training','M5 5v14h14M8 15l4-4 3 2 5-6M16 7h4v4'],
 'robot-agent':['Robot Agent','M5 8h14v11H5zM12 8V4m-3 8v2m6-2v2M2 12h3m14 0h3']
};
function catalogIcon(path){
 return `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
}
function renderRoadmap(modules){
 return `<nav class="roadmap" aria-labelledby="roadmap-heading">
  <h2 id="roadmap-heading">学习路线</h2>
  <div class="roadmap-layout">
   <svg class="roadmap-wires" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
    <path d="M93 34H307V120H93V206H307"/>
    <path class="wire-arrows" d="m198 30 4 4-4 4m105 34 4 4 4-4m-109 44-4 4 4 4m-113 37 4 4 4-4m101 41 4 4-4 4"/>
   </svg>
   <ol>${modules.filter(m=>Object.hasOwn(COURSE_ROADMAP,m.id)).map(m=>{
    const [label,path]=COURSE_ROADMAP[m.id];
    return `<li><a class="roadmap-node" href="#chapter-${m.id}">${catalogIcon(path)}<span>${esc(label)}</span></a></li>`;
   }).join('')}</ol>
  </div>
 </nav>`;
}
function renderCatalog(){
 const last=lastReading(),coreModules=MODULES.filter(m=>m.id!=='appendix'),appendix=MODULES.find(m=>m.id==='appendix');
 const coreCount=coreModules.reduce((count,m)=>count+m.lessons.length,0);
 const courseList=(ids,compact=false)=>`<ul class="${compact?'appendix-links':'course-links'}">${ids.map(id=>`<li><a href="${lessonHref(id)}"><span>${esc(curriculum.lessonTitles[id]??byId[id].title)}</span>${state.viewed[id]?'<span class="visited-mark" role="img" aria-label="已访问" title="已访问">✓</span>':''}<span class="course-arrow" aria-hidden="true">→</span></a></li>`).join('')}</ul>`;
 const chapters=coreModules.map((m,i)=>`<section class="chapter" data-stage="${Math.floor(i/2)}" id="chapter-${m.id}" tabindex="-1">
  <header class="chapter-heading"><span class="chapter-number" aria-hidden="true">${pad(i+1)}</span>
   <div><span class="chapter-stage">${COURSE_STAGES[Math.floor(i/2)]}</span><h3>${esc(m.name)}</h3></div>
   <span class="chapter-count">${m.lessons.length} 篇</span>
  </header>${courseList(m.lessons)}
 </section>`).join('');
 const appendixGroups=appendix.groups.map(group=>`<section class="appendix-group" id="chapter-${group.id}">
  <h3>${catalogIcon(group.id==='appendix-a'?'M18 4H6l6 8-6 8h12':'m13 2-9 12h7l-1 8 10-12h-7z')}${esc(group.name)}<span class="chapter-count">${group.lessons.length} 篇</span></h3>
  ${courseList(group.lessons,true)}
 </section>`).join('');
 return `<div class="page catalog-page">
  <header class="catalog-heading">
   <div class="hero-copy">
    <a class="announcement" href="#chapter-robot-agent"><span>NEW</span> 具身智能体与技能编排 <span class="announcement-arrow" aria-hidden="true">→</span></a>
    <h1>具身智能与<span>大模型算法研发</span></h1>
    <p>学院派公式推导 · PyTorch 算子手撕 · 机器人 Agent 系统设计</p>
    <div class="catalog-actions">
     <a class="button primary" href="/practice/">进入 PyTorch 手撕题库 <span aria-hidden="true">→</span></a>
     <a class="button" href="#catalog-heading">浏览全部课程目录</a>
    </div>
    <ul class="catalog-stats" aria-label="课程概览">
     <li><strong>${coreModules.length}</strong> 大核心模块</li>
     <li><strong>${coreCount}</strong> 篇课程精讲</li>
     <li><strong>${appendix.lessons.length}</strong> 份工程与数学速查</li>
    </ul>
   </div>
   ${renderRoadmap(coreModules)}
  </header>
  <section class="course-catalog" aria-labelledby="catalog-heading">
   <div class="section-heading"><h2 id="catalog-heading">课程目录</h2>
   ${last?`<a class="resume-line" href="${esc(last.href)}">继续阅读 <strong>${esc(last.title)}</strong> <span aria-hidden="true">→</span></a>`:''}</div>
   <div class="chapter-list">${chapters}</div>
  </section>
  <section class="appendix-toolbox" id="chapter-appendix" aria-labelledby="toolbox-heading">
   <h2 id="toolbox-heading">工程与数学速查工具箱</h2>
   <div class="appendix-groups">${appendixGroups}</div>
  </section>
 </div>`;
}

function sectionHref(kind,item,section,index){return kind==='topic'?topicHref(item.id,'guide','&section='+section.id):lessonHref(item.id)+'&section='+(section.id??index);}
function sectionId(kind,section,index){return kind==='topic'?'topic-section-'+section.id:'section-'+(section.id??index);}
function theoryLink(kind,item,anchor=''){return (kind==='topic'?topicHref(item.id):lessonHref(item.id))+(anchor?'&anchor='+anchor:'');}
function readerContents(kind,item,tab){
 const theory=tab==='guide'||tab==='theory';
 let entries=[];
 if(theory){
  entries=item.sections.map((section,i)=>({href:sectionHref(kind,item,section,i),id:sectionId(kind,section,i),title:cleanTitle(section.title)}));
  if(kind==='lesson'&&!item.theoryOnly)entries.push({href:theoryLink(kind,item,'chapter-review'),id:'chapter-review',title:'读后自测'});
  entries.push({href:theoryLink(kind,item,'sources'),id:'sources',title:'参考资料'});
 }else{
  const {params}=parseRoute();let base=kind==='topic'?topicHref(item.id,tab):lessonHref(item.id,tab,tab==='exercise'?(params.get('mode')==='torch'?'torch':'python'):undefined);
  if(kind==='lesson'&&params.has('lab'))base+='&lab='+encodeURIComponent(params.get('lab'));
  if(kind==='topic'&&tab==='labs'){const lab=item.labs.find(l=>l.id===params.get('lab'))||item.labs[0];base=topicHref(item.id,tab,'&lab='+lab.id);}
  const primary=kind==='lesson'?mainImplementation(item):null;
  const sections=tab==='code'?(kind==='topic'?item.implementations.map(d=>['demo-'+d.id,d.title]):[...(primary?[['demo-'+primary.id,'主案例：'+primary.title]]:[]),['code-result',primary?'补充演示的观察目标':'运行前的观察目标'],['code-implementation',item.code.title],['code-explanations','代码说明'],...(item.extraImplementations||[]).filter(d=>d!==primary).map(d=>['demo-'+d.id,d.title])]):[['exercise-task','题目'],['exercise-tests','测试用例'],['exercise-editor','编程区'],['exercise-hints','提示'],['exercise-solution','参考实现']];
  if(tab==='exercise'&&!params.has('lab'))sections.unshift(['discussion','推导与分析']);
  if(tab==='exercise'&&!params.has('lab'))sections.push(['mistakes','辨析与纠错']);
  entries=sections.map(([id,title])=>({href:base+'&anchor='+id,id,title}));
 }
 return entries.map((e,i)=>`<a href="${esc(e.href)}" data-section="${esc(e.id)}">${item.theoryOnly?'':`<span>${pad(i+1)}</span>`}${inline(e.title)}</a>`).join('');
}
function renderReader(kind,item,tab,body){
 const tabs=kind==='topic'?[['guide','原理'],['code','代码'],['labs','练习']]:item.theoryOnly?[]:[['theory','原理'],['code','代码'],['exercise','练习']];
 const contents=readerContents(kind,item,tab),module=kind==='lesson'?moduleFor(item):null;
 const context=module?`<a href="#/?chapter=${module.id}">${esc(module.name)}</a>`:'<a href="#/">核心专题</a>';
 const mobileToc=`<details class="mobile-toc"><summary>目录</summary><nav aria-label="本页目录">${contents}</nav></details>`;
 const tabBar=tabs.length?`<div class="reader-bar"><nav class="reader-tabs" aria-label="文章内容">${tabs.map(([id,label])=>`<a href="${kind==='topic'?topicHref(item.id,id):lessonHref(item.id,id)}" class="${id===tab?'active':''}" ${id===tab?'aria-current="page"':''}>${label}</a>`).join('')}</nav>${mobileToc}</div>`:'';
 markReading(kind,item,tab);
 return `<div class="reader-shell">
  <aside class="reader-sidebar"><a class="back-link" href="#/">← 课程目录</a><nav aria-label="本页目录">${contents}</nav></aside>
  <article class="reader-article">
   <header class="article-heading"><div class="article-context">${context}${tabs.length?'':mobileToc}</div><h1>${esc(item.title)}</h1></header>
   ${tabBar}<div class="reader-body">${body}</div>${renderRelated(kind,item)}
  </article>
 </div>`;
}

function renderLesson(l,tab,mode,params){
 if(l.theoryOnly)tab='theory';
 currentLesson=l;currentTab=tab;
 const body=tab==='code'?renderLessonCode(l):tab==='exercise'?renderLessonExercises(l,mode,params?.get('lab')):renderLessonTheory(l);
 return renderReader('lesson',l,tab,body);
}
function renderLessonExercises(l,mode,labId){
 const extra=l.extraLabs||[],advanced=l.advancedLabs||[],allLabs=[...extra,...advanced],lab=allLabs.find(x=>x.id===labId);
 const choices=extra.length?`<nav class="exercise-choices" aria-label="核心练习"><a href="${lessonHref(l.id,'exercise')}" ${!lab?'aria-current="page"':''}>推导与基础实现</a>${extra.map(x=>`<a href="${lessonHref(l.id,'exercise')+'&lab='+x.id}" ${lab?.id===x.id?'aria-current="page"':''}>${esc(x.title)}</a>`).join('')}</nav>`:'';
 const advancedChoices=advanced.length?`<details class="detail-box advanced-material"><summary>可选拓展练习（${advanced.length}）</summary><div class="detail-body"><nav class="exercise-choices" aria-label="可选拓展练习">${advanced.map(x=>`<a href="${lessonHref(l.id,'exercise')+'&lab='+x.id}" ${lab?.id===x.id?'aria-current="page"':''}>${esc(x.title)}</a>`).join('')}</nav></div></details>`:'';
 if(lab){currentLesson=byId['topic-'+l.theoryTopic+'-'+lab.id];return choices+advancedChoices+renderExercise(currentLesson,lab.runtime==='python'?'python':'torch',true);}
 const advancedChecks=l.advancedKnowledgeChecks||[],advancedPitfalls=l.advancedPitfalls||[];
 return choices+advancedChoices+renderDiscussion(l.knowledgeChecks,'lesson',l)+(advancedChecks.length?`<details class="detail-box advanced-material"><summary>可选拓展：深入推导题（${advancedChecks.length}）</summary><div class="detail-body">${renderDiscussion(advancedChecks,'lesson',l)}</div></details>`:'')+renderExercise(l,mode)+renderPitfalls(l.pitfalls)+(advancedPitfalls.length?`<details class="detail-box advanced-material"><summary>可选拓展：更多辨析与纠错（${advancedPitfalls.length}）</summary><div class="detail-body">${renderPitfalls(advancedPitfalls)}</div></details>`:'');
}
function renderTopic(t,params){
 const id=Object.keys(CORE_LESSON_TOPIC).find(k=>CORE_LESSON_TOPIC[k]===t.id);
 return renderLesson(byId[id],({guide:'theory',labs:'exercise'}[params.get('tab')]||params.get('tab')||'theory'),params.get('mode')==='torch'?'torch':'python',params);
}
function renderRelated(kind,item){
 const prerequisites=[...new Set(item.prerequisites||[])].filter(id=>byId[id]?.sections);
 const reading=prerequisites.length?`<nav class="prerequisite-reading" aria-label="前置阅读"><span>前置阅读</span>${prerequisites.map(id=>`<a href="${lessonHref(id)}">${esc(byId[id].title)}</a>`).join('')}</nav>`:'';
 const list=kind==='lesson'?lessons:topics,index=list.indexOf(item),previous=list[index-1],next=list[index+1];
 const href=entry=>kind==='lesson'?lessonHref(entry.id):topicHref(entry.id);
 return `<footer class="article-footer">${reading}<nav class="article-pagination" aria-label="文章翻页">${previous?`<a href="${href(previous)}"><span>← 上一篇</span><strong>${esc(previous.title)}</strong></a>`:'<span></span>'}${next?`<a class="next" href="${href(next)}"><span>下一篇 →</span><strong>${esc(next.title)}</strong></a>`:''}</nav></footer>`;
}
function renderEvolution(evolution){
 if(!evolution?.steps?.length)return '';
 return `<details class="detail-box evolution-details"><summary>方法演进 · ${inline(evolution.title||'技术路线')}</summary><div class="detail-body">${evolution.context?`<p class="evolution-context">${inline(evolution.context)}</p>`:''}<ol class="evolution-steps">${evolution.steps.map(step=>`<li><strong>${inline(step.name)}</strong><p>${inline(step.change)}</p></li>`).join('')}</ol>${evolution.takeaway?`<p class="evolution-takeaway"><strong>本节要抓住：</strong>${inline(evolution.takeaway)}</p>`:''}</div></details>`;
}
function proseParagraphs(value){return String(value??'').split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+inline(p)+'</p>').join('');}

function shapeMarkup(value){return EMLMath.tokens(value).some(t=>t.type==='math')?inline(value):'<code>'+esc(value)+'</code>';}

function renderWorkedExample(ex,afterParagraph){
 if(!ex||ex.afterParagraph!==afterParagraph)return '';
 return `<aside class="worked-example"><h3>例：${inline(ex.title)}</h3><ol>${ex.steps.map(step=>`<li>${inline(step)}</li>`).join('')}</ol><p class="example-conclusion">${inline(ex.conclusion)}</p></aside>`;
}
function renderFocus(f){
 if(!f)return '';
 return `<aside class="concept-focus ${f.kind==='易错'?'caution':''}"><h3>${inline(f.title)}</h3><p>${inline(f.explanation)}</p><p class="focus-check"><strong>检查：</strong>${inline(f.check)}</p></aside>`;
}
function renderComparison(c){
 if(!c)return '';
 return `<section class="comparison"><h3>${inline(c.title)}</h3><div class="table-wrap"><table><thead><tr>${c.columns.map(x=>`<th>${inline(x)}</th>`).join('')}</tr></thead><tbody>${c.rows.map(row=>`<tr>${row.map(x=>`<td>${inline(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function renderSection(s,index,kind,item){
 const scene=s.quote?.length?`<blockquote>${s.quote.map(p=>`<p>${inline(p)}</p>`).join('')}</blockquote>`:'';
 return `<section class="article-section" id="${sectionId(kind,s,index)}" data-reading-section><h2>${item.theoryOnly?'':`<span class="section-number">${pad(index+1)}</span>`}${inline(cleanTitle(s.title))}</h2>${s.lead?`<p class="section-lead">${inline(s.lead)}</p>`:''}${scene}${renderFigures(s,0)}${renderWorkedExample(s.example,0)}${s.body.map((p,i)=>`<p>${inline(p)}</p>${renderFigures(s,i+1)}${renderWorkedExample(s.example,i+1)}`).join('')}${s.formula?`<div class="formula">${mathMarkup(s.formula,true)}</div>`:''}${kind==='lesson'?renderCourseLab(item.id,s.id):''}${s.bullets?.length?`<ul${item.theoryOnly?' class="diagnostic-list"':''}>${s.bullets.map(b=>`<li>${inline(b)}</li>`).join('')}</ul>`:''}${s.code?codeBlock(s.code,s.codeKind==='fragment'?'Python · 实现片段':'Python')+(s.codeExplanation?`<p class="code-note">${inline(s.codeExplanation)}</p>`:''):''}${renderFigures(s)}${renderComparison(s.comparison)}${renderWorkedExample(s.example)}${renderFocus(s.focus)}${kind==='lesson'&&!item.theoryOnly?renderPseudocode(item.id,s.id):''}</section>`;
}
function renderFigures(section,afterParagraph){
 const figures=section.figures||(section.figure?[section.figure]:[]);
 return figures.filter(f=>f.afterParagraph===afterParagraph).map(f=>{const src=f.src.startsWith('/')?f.src:'/'+f.src;const dimensions=Number.isInteger(f.width)&&Number.isInteger(f.height)&&f.width>0&&f.height>0?` width="${f.width}" height="${f.height}"`:'';return `<figure class="research-figure"><p class="figure-reading-hint">${src.endsWith('.gif')?'点击图片可打开原动图。':'图片较宽时可横向滚动；点击可打开原图。'}</p><a href="${esc(src)}" target="_blank" rel="noopener" aria-label="${esc((f.alt||section.title)+'（打开原图）')}"><img${dimensions} src="${esc(src)}" alt="${esc(f.alt||section.title)}" loading="lazy"></a><figcaption>${inline(f.caption||'')}</figcaption></figure>`;}).join('');
}
const LESSON_PSEUDOCODE={
 "tensor": {section: "2", lines: [
  "X: [B,T,D]",
  "X = reshape(X, [B,T,H,d])",
  "X = transpose(X, (0,2,1,3))",
  "Y = X + bias[None,None,:,:]",
  "loss = sum(error*mask) / sum(mask)"
 ]},
 "mlp": {section: "affine-nonlinearity", lines: [
  "z1 = x @ W1 + b1",
  "h1 = activation(z1)",
  "y = h1 @ W2 + b2",
  "loss = criterion(y, target)",
  "loss.backward(); optimizer.step()"
 ]},
 "cnn-receptive-field": {section: "local-correlation", lines: [
  "for each output (i,j):",
  "    patch = X[..., i*s-p:i*s-p+k, j*s-p:j*s-p+k]",
  "    Y[...,i,j] = sum(patch * W)",
  "rf += (kernel-1) * jump",
  "jump *= stride"
 ]},
 "attention": {section: "0", lines: [
  "Q = X @ Wq; K = X @ Wk; V = X @ Wv",
  "S = Q @ K.transpose(-2,-1) / sqrt(d)",
  "A = softmax(S + mask, dim=-1)",
  "C = A @ V",
  "Y = merge_heads(C) @ Wo"
 ]},
 "rope": {section: "rope-complex", lines: [
  "for pair i in range(d/2):",
  "    theta = position * base**(-2*i/d)",
  "    q_pair = rotate(q_pair, theta)",
  "    k_pair = rotate(k_pair, theta)",
  "score = q_rot @ k_rot"
 ]},
 "norm-ffn": {section: "0", lines: [
  "mu = mean(x, dim=-1)",
  "rms = sqrt(mean(x*x, dim=-1) + eps)",
  "x_norm = (x-mu) / std  # LayerNorm",
  "gate = silu(x @ Wg); value = x @ Wv",
  "y = (gate * value) @ Wo"
 ]},
 "multimodal": {section: "1", lines: [
  "patches = patchify(images)",
  "vision_tokens = vision_encoder(patches)",
  "text_tokens = language_encoder(input_ids)",
  "vision_tokens = projector(vision_tokens)",
  "multimodal = pack(vision_tokens, text_tokens)"
 ]},
 "masking-autoregressive": {section: "4", lines: [
  "for q in query_positions:",
  "    for k in key_positions:",
  "        visible[q,k] = allowed(q.region, k.region)",
  "scores = scores.masked_fill(~visible, -inf)",
  "loss = masked_loss(logits, labels, loss_mask)"
 ]},
 "kv-cache": {section: "1", lines: [
  "K_cache, V_cache = prefill(prefix)",
  "for token in generated_tokens:",
  "    k_new, v_new = project(token)",
  "    K_cache = append(K_cache, k_new)",
  "    output = attention(q_new, K_cache, V_cache)"
 ]},
 "vae": {section: "reparameterization", lines: [
  "mu, logvar = encoder(x)",
  "eps = randn_like(mu)",
  "z = mu + exp(0.5*logvar) * eps",
  "x_hat = decoder(z)",
  "loss = recon(x_hat,x) + beta * KL"
 ]},
 "flow-matching": {section: "linear-path", lines: [
  "x0 ~ p_source; x1 ~ p_data; t ~ Uniform(0,1)",
  "xt = (1-t)*x0 + t*x1",
  "target_v = x1 - x0",
  "loss = mse(v_theta(xt,t,condition), target_v)",
  "x = ode_integrate(v_theta, x_init, 0, 1)"
 ]},
 "diffusion": {section: "0", lines: [
  "eps ~ Normal(0,I)",
  "xt = sqrt(alpha_bar[t])*x0 + sqrt(1-alpha_bar[t])*eps",
  "eps_hat = model(xt,t,condition)",
  "x0_hat = (xt-sqrt(1-alpha_bar[t])*eps_hat)/sqrt(alpha_bar[t])",
  "x_prev = scheduler.step(eps_hat,t,xt)"
 ]},
 "score-sde": {section: "forward-sde", lines: [
  "dx = f(x,t)dt + g(t)dW",
  "score = grad_x log p_t(x)",
  "reverse_drift = f - g(t)^2 * score",
  "probability_flow = f - 0.5*g(t)^2*score",
  "integrate reverse dynamics from noise to data"
 ]},
 "dit-adaln": {section: "5", lines: [
  "shift, scale, gate = cond_mlp(time, condition)",
  "h = norm(x) * (1 + scale) + shift",
  "x = x + gate * attention(h)",
  "x = x + gate_ffn * ffn(norm(x))",
  "prediction = output_head(x)"
 ]},
 "behavior-cloning": {section: "2", lines: [
  "obs, expert_action = dataset.sample()",
  "pred = policy(obs)",
  "loss = masked_mse(pred, expert_action)",
  "loss.backward(); optimizer.step()",
  "evaluate_closed_loop(policy, environment)"
 ]},
 "action-chunking": {section: "5", lines: [
  "old_chunk = active_plan",
  "new_chunk = await policy.predict(latest_obs)",
  "keep = committed_old_prefix",
  "transition = blend(old_overlap, new_overlap)",
  "plan = keep + transition + new_future"
 ]},
 "generative-policy": {section: "receding-horizon-protocol", lines: [
  "condition = encode(observation, instruction)",
  "ACT: action = decoder(condition, z)",
  "Diffusion: action = denoise_loop(noise, condition)",
  "Flow: action = ode_integrate(velocity, noise, condition)",
  "execute_prefix(action); observe_again()"
 ]},
 "vla-architecture": {section: "vlm-to-policy", lines: [
  "vision = vision_encoder(images)",
  "language = language_model(tokens)",
  "state = state_projector(robot_state)",
  "velocity = action_expert(noisy_actions, time, condition)",
  "actions = ode_solver(velocity)"
 ]},
 "lora": {section: "1", lines: [
  "base = x @ W  # W frozen",
  "low_rank = (x @ A) @ B",
  "y = base + (alpha / rank) * low_rank",
  "loss = task_loss(y, target)",
  "update(A, B); keep(W)"
 ]},
 "policy-gradient": {section: "0", lines: [
  "action ~ pi_theta(.|state)",
  "reward = env.step(action)",
  "advantage = return - baseline",
  "loss = -log_prob(action) * advantage",
  "optimizer.step()"
 ]},
 "ppo": {section: "ppo-2", lines: [
  "delta_t = r_t + gamma*(1-done)*V_next - V_t",
  "A_t = delta_t + gamma*lambda*(1-done)*A_next",
  "ratio = exp(new_logp - old_logp)",
  "objective = min(ratio*A, clip(ratio,1-eps,1+eps)*A)",
  "actor_loss = -mean(objective)"
 ]},
 "dpo-grpo": {section: "grpo-group", lines: [
  "DPO: ratio = logp(chosen)-logp(rejected)",
  "loss = -logsigmoid(beta*(ratio-ref_ratio))",
  "mean = group_mean(rewards)",
  "advantage = (rewards-mean)/(group_std+eps)",
  "update_policy_with_valid_log_prob(advantage)"
 ]}
};

function renderPseudocode(lessonId, sectionId){
 const block=LESSON_PSEUDOCODE[lessonId];
 if(!block || block.section!==sectionId)return '';
 return `<details class="detail-box"><summary>算法伪代码</summary><pre class="lesson-pseudocode" tabindex="0"><code>${esc(block.lines.join('\n'))}</code></pre></details>`;
}

function renderChapterGoals(l){
 return `<aside class="chapter-goals" aria-label="本章学习目标"><h2>本章学习目标</h2><ul>${l.objectives.map(goal=>`<li>${inline(goal)}</li>`).join('')}</ul></aside>`;
}
function renderChapterReview(l){
 return `<section class="article-section chapter-review" id="chapter-review" data-reading-section><h2>读后自测</h2><p>先不看正文，写下答案，并用算例、推导或代码说明理由，再核对练习页的分析。</p><ol>${l.knowledgeChecks.slice(0,2).map((q,i)=>`<li><p>${inline(q.question)}</p><a href="${lessonHref(l.id,'exercise')+'&anchor=question-'+i}">核对参考解 →</a></li>`).join('')}</ol></section>`;
}
const courseLabs={
 tensor:{'3':['tensor','广播与 einsum 轴对齐']},
 'cnn-receptive-field':{'receptive-field':['cnn','理论感受野与可达像素']},
 attention:{'1':['attention','点积缩放与 Softmax 饱和'],'mqa-gqa-kv-sharing':['kv-sharing','Query 与 KV 头共享']}
};
function renderCourseLab(lesson,section){
 const lab=courseLabs[lesson]?.[section];
 if(!lab)return '';
 const [name,title]=lab,anchor=name==='kv-sharing'?'kv-sharing-lab':'math-lab';
 const initial=typeof prerenderedLabs==='undefined'?'':prerenderedLabs[name];
 return `<section id="${anchor}" class="math-lab" aria-label="${title}" data-course-lab="${name}">${initial}</section>`;
}
function renderLessonTheory(l){
 if(l.theoryOnly){
  return `${l.lead?`<p class="article-intro">${inline(l.lead)}</p>`:''}${l.sections.map((s,i)=>renderSection(s,i,'lesson',l)).join('')}${renderSources(l.sources,l.id)}`;
 }
 const notation=`<details class="detail-box shape-details"><summary>符号与张量约定</summary><div class="detail-body table-wrap"><table><thead><tr><th>变量</th><th>形状</th><th>含义</th></tr></thead><tbody>${l.shapes.map(s=>`<tr><td>${inline(s.name)}</td><td>${shapeMarkup(s.shape)}</td><td>${inline(s.meaning)}</td></tr>`).join('')}</tbody></table></div></details>`;
 return `${l.lead?`<p class="article-intro">${inline(l.lead)}</p>`:''}${renderEvolution(l.evolution)}${renderChapterGoals(l)}${notation}${l.sections.map((s,i)=>renderSection(s,i,'lesson',l)).join('')}${l.advancedSections?.length?`<details class="detail-box advanced-material"><summary>可选拓展：深入理论与进阶分析（${l.advancedSections.length} 节）</summary><div class="detail-body">${l.advancedSections.map((s,i)=>renderSection(s,l.sections.length+i,'lesson',l)).join('')}</div></details>`:''}${renderChapterReview(l)}${renderSources(l.sources,l.id)}<p class="article-action"><a class="button primary" href="${lessonHref(l.id,'code')}">阅读代码实现 →</a><a href="${lessonHref(l.id,'exercise')}">开始练习 →</a></p>`;
}
function renderTopicTheory(t){
 return `<p class="article-intro">${inline(t.lead)}</p><details class="detail-box notation"><summary>符号与张量约定</summary><div class="detail-body table-wrap"><table><thead><tr><th>符号</th><th>形状</th><th>含义</th></tr></thead><tbody>${t.notation.map(n=>`<tr><td>${inline(n.symbol)}</td><td>${shapeMarkup(n.shape)}</td><td>${inline(n.meaning)}</td></tr>`).join('')}</tbody></table></div></details>${t.sections.map((s,i)=>renderSection(s,i,'topic',t)).join('')}${renderSources(t.sources,null,t.relatedLessons)}<p class="article-action"><a class="button primary" href="${topicHref(t.id,'code')}">阅读代码实现 →</a><a href="${topicHref(t.id,'labs')}">开始练习 →</a></p>`;
}
function renderDiscussion(questions,kind,item){
 return `<section class="article-section discussion" id="discussion" data-reading-section><h2>推导与分析</h2><p>先写出推导、计算或反例，再展开参考解核对假设与关键步骤。编程题位于下方，可从本页目录直接进入。</p>${questions.map((q,i)=>`<section class="reasoning-question" id="question-${i}"><h3>${inline(q.question)}</h3><details class="detail-box"><summary>参考解与分析</summary><div class="detail-body">${(Array.isArray(q.answer)?q.answer:[q.answer]).map(p=>`<p>${inline(p)}</p>`).join('')}${q.codeFocus?`<p class="code-note"><strong>代码对应：</strong>${inline(q.codeFocus)}</p>`:''}${q.acceptance?.length?`<ul class="discussion-checks">${(Array.isArray(q.acceptance)?q.acceptance:[q.acceptance]).map(x=>`<li>${inline(x)}</li>`).join('')}</ul>`:''}</div></details></section>`).join('')}</section>`;
}
function renderPitfalls(items){
 return `<section class="article-section" id="mistakes" data-reading-section><h2>辨析与纠错</h2><p>判断下面的说法或实现会在哪一步失效，并说明成立所需的条件，再展开分析核对。</p>${items.map((p,i)=>`<details class="detail-box" id="pitfall-${i}"><summary>${inline(p.title)}</summary><div class="detail-body"><p>${inline(p.detail)}</p>${p.fix?`<p>${inline(p.fix)}</p>`:''}</div></details>`).join('')}</section>`;
}
function renderSources(sources,lessonId,related=[]){
 const ids=lessonId?[lessonId]:related;
 const external=byId[lessonId]?.theoryOnly?[]:(curriculum.resources||[]).filter(r=>r.lessons.some(id=>ids.includes(id)));
 return `<section class="article-section sources" id="sources" data-reading-section><h2>参考资料</h2><ol>${sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${inline(s.title)} ↗</a>${s.note?`<p class="source-note">${inline(s.note)}</p>`:''}</li>`).join('')}</ol>${external.length?`<details class="detail-box"><summary>相关开源演示</summary><div class="detail-body">${external.map(r=>`<p><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a> <small>· ${esc(r.license)}</small></p><p>${inline(r.observe)}</p><p class="code-note">${inline(r.boundary)} <a href="${esc(r.repo)}" target="_blank" rel="noopener">源码</a></p>`).join('')}</div></details>`:''}</section>`;
}

function sourceExplanations(explanations,frame){
 return `<div class="source-explanations">${explanations.map(e=>`<button data-action="annotate" data-frame="${esc(frame)}" data-range="${esc(e.lines)}"><span>第 ${esc(e.lines)} 行</span><p>${inline(e.text)}</p></button>`).join('')}</div>`;
}
function mainImplementation(l){return (l.extraImplementations||[]).find(d=>d.id===l.mainImplementation);}
function renderLessonCode(l){
 const primary=mainImplementation(l),others=(l.extraImplementations||[]).filter(d=>d!==primary),advanced=l.advancedImplementations||[];
 return `<p class="code-reading-guide">运行前先预测关键输出，再对照断言和下方代码说明。核对通过后，尝试只改变一个输入或配置，解释输出为什么变化。</p>${primary?renderAdditionalCode(l,[primary]):''}${l.code.runtimeNote?`<p class="runtime-validation-note">${esc(l.code.runtimeNote)}</p>`:''}<section id="code-result" data-reading-section><h2 class="content-title">${primary?'补充演示的观察目标':'运行前的观察目标'}</h2><p>${inline(l.code.expected)}</p><p class="run-command"><code>python ${pad(l.number)}_${l.id}_demo.py</code><a href="#/guide">环境配置</a></p></section><section id="code-implementation" data-reading-section><h2 class="content-title">${primary?'补充演示：':''}${esc(l.code.title)}</h2>${codeBlock(l.code.source,pad(l.number)+'_'+l.id+'_demo.py','<button data-action="copy-demo">复制</button><button data-action="download-demo">下载 .py</button>','lesson-code')}</section><section id="code-explanations" data-reading-section><h3>代码说明</h3><p class="quiet">点击行号说明，高亮对应实现。</p>${sourceExplanations(l.code.explanations,'lesson-code')}</section>${renderAdditionalCode(l,others)}${advanced.length?`<details class="detail-box advanced-material"><summary>可选拓展实现（${advanced.length}）</summary><div class="detail-body">${renderAdditionalCode(l,advanced)}</div></details>`:''}<p class="article-action"><a class="button primary" href="${lessonHref(l.id,'exercise')}">开始练习 →</a></p>`;
}

function renderAdditionalCode(l,demos=l.extraImplementations||[]){return demos.map(d=>`<section class="implementation" id="demo-${d.id}" data-reading-section>${d.id===l.mainImplementation?'<p class="case-label">本章贯穿案例</p>':''}<h2>${inline(d.title)}</h2><p>${inline(d.description)}</p><div class="code-observation"><h3>运行时应核对</h3><p>${inline(d.expected)}</p></div>${codeBlock(d.source,(l.theoryTopic||l.id)+'_'+d.id+'.py',`<button data-action="copy-demo" data-lesson="${l.id}" data-demo="${d.id}">复制</button><button data-action="download-demo" data-lesson="${l.id}" data-demo="${d.id}">下载 .py</button>`,'code-'+d.id)}<h3>代码说明</h3>${sourceExplanations(d.explanations,'code-'+d.id)}</section>`).join('');}

function renderTopicCode(t){
 return t.implementations.map(d=>`<section class="implementation" id="demo-${d.id}" data-reading-section><h2>${inline(d.title)}</h2><p>${inline(d.description)}</p>${codeBlock(d.source,t.id+'_'+d.id+'.py',`<button data-action="copy-demo" data-topic="${t.id}" data-demo="${d.id}">复制</button><button data-action="download-demo" data-topic="${t.id}" data-demo="${d.id}">下载 .py</button>`,'code-'+d.id)}<h3>代码说明</h3>${sourceExplanations(d.explanations,'code-'+d.id)}<h3>预期结果</h3><p>${inline(d.expected)}</p></section>`).join('')+`<p class="article-action"><a class="button primary" href="${topicHref(t.id,'labs')}">开始练习 →</a><a href="#/guide">运行环境</a></p>`;
}
function renderTopicLabs(t,labId){
 const lab=t.labs.find(x=>x.id===labId)||t.labs[0];currentLesson=byId[topicExerciseId(t,lab)];currentTab='exercise';
 return `<nav class="lab-choices" aria-label="选择练习">${t.labs.map(l=>`<a href="${topicHref(t.id,'labs','&lab='+l.id)}" class="${lab.id===l.id?'active':''}" ${lab.id===l.id?'aria-current="page"':''}><strong>${esc(l.title)}</strong><small>${l.runtime==='python'?'Python · 在线运行':'PyTorch · 本地运行'}</small></a>`).join('')}</nav>${renderExercise(currentLesson,lab.runtime==='python'?'python':'torch',true)}`;
}
function renderExercise(l,mode,singleRuntime=false){
 const isTorch=mode==='torch',task=isTorch?l.pytorchTask:l.exercise;
 const draft=state.drafts[l.id+':'+mode]??task.starter;
 const filename=pad(l.number)+'_'+l.id+'_'+(isTorch?'torch':'practice')+'.py';
 return `${!singleRuntime?`<div class="runtime-tabs" aria-label="运行环境"><button class="${!isTorch?'active':''}" aria-pressed="${!isTorch}" data-action="runtime" data-mode="python">Python · 在线运行</button><button class="${isTorch?'active':''}" aria-pressed="${isTorch}" data-action="runtime" data-mode="torch">PyTorch · 本地运行</button></div>`:''}<div class="exercise-head" id="exercise-task" data-reading-section><h2>${inline(task.title||(isTorch?'PyTorch 实现':'Python 实现'))}</h2>${proseParagraphs(task.prompt)}</div><details class="detail-box" id="exercise-tests" data-reading-section><summary>测试用例</summary><div class="detail-body">${codeBlock(task.tests,'tests.py')}</div></details><p class="runtime-note" id="editor-help">Tab 缩进 · Shift+Tab 反缩进 · Enter 自动缩进 · Esc 后按 Tab 移出编辑器。可拖动编程区右下角调整高度。</p><div class="editor-shell" id="exercise-editor" data-reading-section data-mode="${mode}"><div class="editor-toolbar"><span>${pad(l.number)}_${l.id}_${isTorch?'torch':'practice'}.py</span><small>草稿自动保存</small></div><div class="editor-wrap"><pre class="editor-lines" aria-hidden="true">${draft.split('\n').map((_,i)=>i+1).join('\n')}</pre><textarea id="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-describedby="editor-help" aria-label="${isTorch?'PyTorch':'Python'} 代码编辑器">${esc(draft)}</textarea></div><div class="editor-controls">${isTorch?'<button class="button primary" data-action="download-exercise">下载代码与测试</button>':'<button class="button primary" id="run-tests" data-action="run-tests">运行测试</button><button class="button" data-action="run-code">仅运行代码</button><button class="button" data-action="stop-code" hidden>停止</button><button class="text-button" data-action="download-exercise">下载 .py</button>'}<button class="text-button" data-action="copy-exercise">复制代码</button><button class="text-button" data-action="reset-code">恢复题目</button>${!isTorch?'<small>⌘ / Ctrl + Enter 测试 · 加 Shift 仅运行</small>':''}</div></div>${isTorch?`<p class="runtime-note">下载后在文件所在目录运行 <code>python ${esc(filename)}</code>。可先在这里编辑和复制代码；测试需使用本地 Python + PyTorch。<a href="#/guide">环境配置 →</a></p>`:`<details class="detail-box"><summary>自定义试运行（可选）</summary><div class="detail-body"><p class="runtime-note">调用上方实现的函数，用 print(...) 查看结果或用 assert 检查自己的例子。“仅运行代码”会执行此区；“运行测试”使用题目测试，不执行此区。草稿自动保存。</p><textarea id="try-code" class="try-code" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="自定义 Python 试运行代码" placeholder="例如：print(你的函数(...))">${esc(state.drafts[l.id+':scratch']??'')}</textarea></div></details><div class="output-panel"><div class="output-title"><span>运行结果</span><span id="run-status">等待运行</span></div><pre class="output-console" id="code-output" aria-live="polite">补全 TODO 后运行测试；也可在自定义试运行区调用函数并 print(...)。测试失败时查看 your_code.py 或 tests.py 的行号与断言。</pre></div>`}${task.hints?.length?`<details class="detail-box" id="exercise-hints" data-reading-section><summary>提示</summary><div class="detail-body"><p class="runtime-note">每次只展开一个提示，回到编程区尝试后再继续。</p>${task.hints.map((h,i)=>`<details><summary>提示 ${i+1}</summary><p>${inline(h)}</p></details>`).join('')}</div></details>`:''}<details class="detail-box solution-box" id="exercise-solution" data-reading-section><summary>参考实现与说明</summary><div class="detail-body"><p class="runtime-note">核对思路后，试着收起答案、恢复题目并独立重写；通过测试只表示满足本题提供的检查。</p>${codeBlock(task.solution,'参考实现')}${proseParagraphs(task.explanation)}<button class="button" data-action="fill-solution">将参考实现填入编辑器</button></div></details>`;
}
function renderPractice(){
 const topicGroups=practiceFilter==='all'||practiceFilter==='topics'?topics:[];
 const groups=MODULES.map(module=>({module,entries:module.lessons.map(id=>byId[id]).filter(l=>!l.theoryOnly)})).filter(group=>group.entries.length);
 const visible=groups.filter(({module})=>practiceFilter==='all'||practiceFilter===module.id);
 return `<div class="page practice-page">
  <header class="page-heading"><h1>手撕题库</h1><p>练习公式推导、Python 编程与 PyTorch 算子实现。</p></header>
  <label class="practice-filter">按主题查看<select id="practice-module">
   <option value="all">全部主题</option>
   <option value="topics" ${practiceFilter==='topics'?'selected':''}>专题进阶练习</option>
   ${groups.map(({module:m})=>`<option value="${m.id}" ${practiceFilter===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}
  </select></label>
  ${visible.map(({module:m,entries})=>`<section class="practice-chapter">
   <header class="practice-section-heading"><h2>${esc(m.name)}</h2><span class="badge badge-practice">基础实现</span></header>
   <ul class="practice-rows">${entries.map(l=>`<li class="practice-row">
    <a class="practice-course" href="${lessonHref(l.id)}"><span>${esc(l.title)}</span>${l.tags[0]?`<small class="badge badge-neutral">${esc(l.tags[0])}</small>`:''}</a>
    <a class="practice-option" href="${lessonHref(l.id,'exercise')}">Python <span aria-hidden="true">→</span></a>
    <a class="practice-option" href="${lessonHref(l.id,'exercise','torch')}">PyTorch <span aria-hidden="true">→</span></a>
   </li>`).join('')}</ul>
  </section>`).join('')}
  ${topicGroups.length?`<section class="practice-advanced">
   <header class="practice-section-heading"><h2>专题进阶练习</h2><span class="badge badge-practice">进阶</span></header>
   <div class="practice-topic-grid">${topicGroups.map(t=>`<section class="practice-topic">
    <h3>${esc(TOPIC_META[t.id].name)}</h3><ul>${t.labs.map(l=>`<li><a href="${topicHref(t.id,'labs','&lab='+l.id)}"><span>${esc(l.title)}</span><small>${l.runtime==='python'?'Python':'PyTorch'} →</small></a></li>`).join('')}</ul>
   </section>`).join('')}</div>
  </section>`:''}
 </div>`;
}
function renderGuide(){
 return `<div class="page narrow guide-page"><header class="page-heading"><h1>下载与运行</h1><p>将讲义、代码和练习带到本地，或备份当前浏览器的练习草稿。</p></header><section class="guide-section"><h2>学习资料</h2><div class="guide-downloads"><div><h3>完整学习包</h3><p>课程讲义、PyTorch 示例及带测试的练习。</p><a class="button primary" href="downloads/embodied-ml-study-pack.zip" download>下载 ZIP <span aria-hidden="true">↓</span></a></div><div><h3>专题练习包</h3><p>MLP、CNN、Transformer 和 Flow Matching 专题。</p><a class="button" href="downloads/embodied-ml-topics.zip" download>下载 ZIP <span aria-hidden="true">↓</span></a></div></div></section><section class="guide-section"><h2>运行环境</h2><p>Python 3.11 / 3.12 · CPU PyTorch 默认</p>${codeBlock('python -m venv .venv\nsource .venv/bin/activate  # Windows: .venv\\\\Scripts\\\\Activate.ps1\npython -m pip install torch','终端')}<p>GPU 安装方式见 <a href="https://pytorch.org/get-started/locally/" target="_blank" rel="noopener">PyTorch 官方安装说明 ↗</a>。Python 练习可在线运行；PyTorch 练习需本地运行。</p></section><section class="guide-section" id="drafts"><details class="detail-box"><summary>草稿备份</summary><div class="detail-body"><p>草稿保存在当前浏览器；导出包含草稿、笔记与记录，导入会合并草稿和笔记。</p><div class="download-links"><button class="button" data-action="export-drafts">导出备份</button><button class="button" data-action="import-drafts">导入备份</button></div></div></details></section><section class="guide-section"><details class="detail-box"><summary>历史课程归档（${lessons.filter(l=>l.module==='legacy').length} 节）</summary><div class="detail-body"><p>旧版课程继续保留；已迁移主题会跳转至对应的新课程。</p><ul class="reading-routes">${lessons.filter(l=>l.module==='legacy').map(l=>`<li><a href="${lessonHref(l.id)}">${esc(l.title)}</a></li>`).join('')}</ul></div></details></section></div>`;
}

function buildSearchIndex(){
 searchIndex=[];
 function add(entry){const raw=String(entry.text||''),text=EMLMath.searchText(raw,katex),title=EMLMath.searchText(entry.title,katex);const category=['exercise','discussion','pitfall'].includes(entry.kind)?'practice':byId[entry.key]?.module==='appendix'?'appendix':'theory';searchIndex.push({...entry,text,title,category,normalized:normalize(entry.doc+' '+entry.title+' '+raw+' '+title+' '+text),normalizedTitle:normalize(title)});}
 function sectionText(s){const c=s.comparison;return sectionSearchText(s)+(c?' '+[c.title,...c.columns,...c.rows.flat()].join(' '):'');}
 for(const l of lessons){
  add({doc:moduleFor(l).name,title:l.title,href:lessonHref(l.id),text:[curriculum.lessonTitles[l.id],l.lead||'',l.subtitle,...l.tags].join(' '),kind:'article',key:l.id});
  l.sections.forEach((s,i)=>add({doc:l.title,title:cleanTitle(s.title),href:sectionHref('lesson',l,s,i),text:sectionText(s),kind:'section',key:l.id}));
  if(!l.theoryOnly){
  add({doc:l.title,title:l.code.title,href:lessonHref(l.id,'code'),text:l.code.source+' '+l.code.explanations.map(e=>e.text).join(' '),kind:'code',key:l.id});
  for(const d of l.extraImplementations||[])add({doc:l.title,title:d.title,href:lessonHref(l.id,'code')+'&anchor=demo-'+d.id,text:d.description+' '+d.source,kind:'code',key:l.id});
  for(const task of l.extraLabs||[])add({doc:l.title,title:task.title,href:lessonHref(l.id,'exercise')+'&lab='+task.id,text:task.prompt,kind:'exercise',key:l.id});
  for(const [mode,key] of [['python','exercise'],['torch','pytorchTask']]){const task=l[key];add({doc:l.title,title:task.title||l.title+' · '+(mode==='python'?'Python':'PyTorch')+' 练习',href:lessonHref(l.id,'exercise',mode),text:task.prompt,kind:'exercise',key:l.id});}
  for(const [i,q] of (l.knowledgeChecks||[]).entries())add({doc:l.title,title:q.question,href:lessonHref(l.id,'exercise')+'&anchor=question-'+i,text:q.answer.join(' '),kind:'discussion',key:l.id});
  for(const [i,p] of (l.pitfalls||[]).entries())add({doc:l.title,title:p.title,href:lessonHref(l.id,'exercise')+'&anchor=pitfall-'+i,text:[p.detail,p.fix].filter(Boolean).join(' '),kind:'pitfall',key:l.id});
  }
 }
}
function sectionSearchText(s){return [s.lead||'',...(s.quote||[]),...s.body,...(s.bullets||[]),s.code||'',s.codeExplanation||'',s.formula?'\\['+s.formula+'\\]':'',s.example?[s.example.title,...s.example.steps,s.example.conclusion].join(' '):'',s.focus?[s.focus.title,s.focus.explanation,s.focus.check].join(' '):''].join(' ');}
function searchHighlight(text,terms){
 const escaped=terms.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).filter(Boolean);if(!escaped.length)return esc(text);
 const re=new RegExp(escaped.join('|'),'gi');let out='',last=0;
 for(const m of text.matchAll(re)){out+=esc(text.slice(last,m.index))+'<mark>'+esc(m[0])+'</mark>';last=m.index+m[0].length;}
 return out+esc(text.slice(last));
}
function searchCategory(category){
 const label={theory:'理论',practice:'手撕',appendix:'附录'}[category];
 return `<span class="badge badge-${category}">${label}</span>`;
}
function renderSearch(query=''){
 const terms=query.trim().split(/\s+/).filter(Boolean),needles=terms.map(normalize);
 if(!terms.length){$('#search-results').innerHTML=`<p class="search-label">核心专题</p>${topics.map(t=>`<a class="search-result" data-search-result href="${topicHref(t.id)}"><span class="search-result-title"><strong>${esc(TOPIC_META[t.id].name)}</strong>${searchCategory('theory')}</span><p>${esc(TOPIC_META[t.id].description)}</p></a>`).join('')}`;return;}
 const ranked=searchIndex.filter(e=>needles.every(n=>e.normalized.includes(n))).map(e=>({...e,score:needles.reduce((n,term)=>n+(e.normalizedTitle===term?120:e.normalizedTitle.includes(term)?35:2),0)+(e.kind==='article'?10:0)})).sort((a,b)=>b.score-a.score);
 const seen=new Set(),perDoc={},matches=[];
 for(const e of ranked){if(seen.has(e.href))continue;const bucket=e.key+':'+e.kind;if((perDoc[bucket]||0)>=3)continue;seen.add(e.href);perDoc[bucket]=(perDoc[bucket]||0)+1;matches.push(e);if(matches.length===12)break;}
 $('#search-results').innerHTML=matches.length?matches.map(e=>{const raw=e.text.replace(/\s+/g,' '),position=Math.max(0,...terms.map(t=>raw.toLowerCase().indexOf(t.toLowerCase()))),start=Math.max(0,position-35),snippet=(start?'…':'')+raw.slice(start,start+140)+(raw.length>start+140?'…':'');return `<a class="search-result" data-search-result href="${esc(e.href)}"><small>${esc(e.doc)}${e.kind==='code'?' · 代码':e.kind==='exercise'?' · 练习':''}</small><span class="search-result-title"><strong>${searchHighlight(e.title,terms)}</strong>${searchCategory(e.category)}</span><p>${searchHighlight(snippet,terms)}</p></a>`;}).join(''):'<p class="empty-state">没有找到匹配内容。试试更短的关键词。</p>';
}
