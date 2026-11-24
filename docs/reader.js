'use strict';

const TOPIC_META={
 mlp:{name:'MLP',description:'函数表示、矩阵梯度与优化几何'},
 cnn:{name:'CNN',description:'卷积几何、感受野与空间信息'},
 transformer:{name:'Transformer',description:'注意力、信息流与训练推理接口'},
 'flow-matching':{name:'Flow Matching',description:'概率路径、条件期望与 ODE 生成'}
};
const CORE_LESSON_TOPIC={mlp:'mlp','cnn-receptive-field':'cnn',attention:'transformer','flow-matching':'flow-matching'};
const TOPIC_VISUAL_SECTION={
 mlp:{id:'mlp',section:'shapes-parameters'},
 cnn:{id:'cnn',section:'spatial-shape'},
 transformer:{id:'attention',section:'visibility-patterns'},
 'flow-matching':{id:'flow-ode',section:'ode-solvers'}
};

function topicIllustration(id){
 let shapes='';
 if(id==='mlp'){
  const columns=[[14,[12,32,52]],[52,[6,23,40,57]],[90,[19,45]]];
  for(let c=0;c<2;c++)for(const y of columns[c][1])for(const ny of columns[c+1][1])shapes+=`<path d="M${columns[c][0]},${y} L${columns[c+1][0]},${ny}" opacity=".2"/>`;
  for(const [x,ys] of columns)for(const y of ys)shapes+=`<circle cx="${x}" cy="${y}" r="3.6" fill="currentColor" stroke="none"/>`;
 }else if(id==='cnn'){
  for(let y=0;y<5;y++)for(let x=0;x<5;x++)shapes+=`<rect x="${7+x*10}" y="${7+y*10}" width="7" height="7" rx="1.2" fill="currentColor" stroke="none" opacity="${x<3&&y<3?.7:.15}"/>`;
  shapes+='<path d="M65 25 L78 32 L65 39" fill="none" opacity=".45"/>';
  for(let y=0;y<3;y++)for(let x=0;x<3;x++)shapes+=`<rect x="${82+x*8}" y="${22+y*8}" width="5" height="5" rx="1" fill="currentColor" stroke="none" opacity=".65"/>`;
 }else if(id==='transformer'){
  for(let y=0;y<5;y++)for(let x=0;x<7;x++)shapes+=`<rect x="${8+x*13}" y="${6+y*11}" width="10" height="8" rx="1.5" fill="currentColor" stroke="none" opacity="${.12+(((x*3+y*5)%9)/11)}"/>`;
 }else if(id==='policy'){
  shapes+='<path d="M8 48 C24 48 24 18 43 18 S63 49 80 38 S94 18 105 18" fill="none" stroke-width="2.2"/><circle cx="8" cy="48" r="3.5" fill="currentColor"/><circle cx="43" cy="18" r="3.5" fill="currentColor"/><circle cx="80" cy="38" r="3.5" fill="currentColor"/><path d="M96 12 L105 18 L96 24" fill="none" stroke-width="2"/>';
 }else if(id==='posttraining'){
  for(let i=0;i<4;i++){const x=8+i*25;shapes+=`<rect x="${x}" y="${15+(i%2)*8}" width="17" height="32" rx="3" fill="currentColor" stroke="none" opacity="${.16+i*.12}"/>`;}
  shapes+='<path d="M10 54 H103 M28 49 V54 M53 49 V54 M78 49 V54" fill="none" opacity=".55"/><path d="M89 9 L103 16 L89 23" fill="none" stroke-width="2"/>';
 }else{
  for(let i=0;i<5;i++){const a=7+i*12,b=16+i*7;shapes+=`<path d="M7 ${a} C34 ${a},47 ${64-b},103 ${b}" fill="none" opacity="${.35+i*.12}"/><circle cx="7" cy="${a}" r="2" fill="currentColor" stroke="none"/><circle cx="103" cy="${b}" r="2" fill="currentColor" stroke="none"/>`;}
 }
 return `<svg class="topic-illustration" viewBox="0 0 112 64" aria-hidden="true" stroke="currentColor" stroke-width="1.2">${shapes}</svg>`;
}
function renderCatalog(){
 const last=lastReading(),coreModules=MODULES.filter(m=>m.id!=='appendix'),appendix=MODULES.find(m=>m.id==='appendix');
 const coreLessonCount=coreModules.reduce((sum,m)=>sum+lessons.filter(l=>l.module===m.id).length,0);
 const visualByModule={'network-foundations':'mlp','transformers':'transformer','generative':'flow-matching','policies':'policy','posttraining':'posttraining'};
 const cards=coreModules.map(m=>{const visual=visualByModule[m.id]||'policy',first=lessons.find(l=>l.module===m.id);return `<a class="topic-card topic-${visual}" href="${first?lessonHref(first.id):'/practice/'}"><div class="topic-card-copy"><h3>${esc(m.name)}</h3></div>${topicIllustration(visual)}<span class="topic-card-arrow" aria-hidden="true">↗</span></a>`;}).join('');
 const chapter=m=>`<section class="chapter" id="chapter-${m.id}"><header class="chapter-heading"><span class="chapter-number">${pad(MODULES.indexOf(m)+1)}</span><h3>${esc(m.name)}</h3></header><ul>${lessons.filter(l=>l.module===m.id).map(l=>`<li><a href="${lessonHref(l.id)}">${esc(l.title)}<span aria-hidden="true">→</span></a></li>`).join('')}</ul></section>`;
 return `<div class="page catalog-page"><header class="catalog-heading"><h1>具身智能与大模型算法研发</h1></header>${last?`<p class="resume-line">继续阅读 <a href="${esc(last.href)}">${esc(last.title)} →</a></p>`:''}<section class="core-topics" aria-labelledby="core-heading"><h2 id="core-heading">核心课程</h2><div class="topic-grid">${cards}</div></section><section class="course-catalog" aria-labelledby="catalog-heading"><div class="section-heading"><h2 id="catalog-heading">课程目录</h2><a href="/practice/">课程练习 →</a></div><div class="chapter-list">${coreModules.map(chapter).join('')}</div></section><section class="course-catalog" aria-labelledby="special-topics-heading"><div class="section-heading"><h2 id="special-topics-heading">专题学习</h2></div><div class="chapter-list"><section class="chapter" id="chapter-special-robot-agent"><header class="chapter-heading"><h3>Robot Agent：自主决策、技能组合与持续进化</h3></header><ul><li><a href="/embodied-ml-lab/robot-agent/" aria-label="开始学习 Robot Agent 专题">开始学习<span aria-hidden="true">→</span></a></li></ul></section></div></section>${appendix?`<details class="detail-box appendix-details"><summary>附录 · 训练工程</summary><div class="detail-body"><div class="chapter-list">${chapter(appendix)}</div></div></details>`:''}</div>`;
}

function sectionHref(kind,item,section,index){return kind==='topic'?topicHref(item.id,'guide','&section='+section.id):lessonHref(item.id)+'&section='+(section.id??index);}
function sectionId(kind,section,index){return kind==='topic'?'topic-section-'+section.id:'section-'+(section.id??index);}
function theoryLink(kind,item,anchor=''){return (kind==='topic'?topicHref(item.id):lessonHref(item.id))+(anchor?'&anchor='+anchor:'');}
function readerContents(kind,item,tab){
 const theory=tab==='guide'||tab==='theory';
 let entries=[];
 if(theory){
  entries=item.sections.map((section,i)=>({href:sectionHref(kind,item,section,i),id:sectionId(kind,section,i),title:cleanTitle(section.title)}));
  if(kind==='lesson')entries.push({href:theoryLink(kind,item,'chapter-review'),id:'chapter-review',title:'读后自测'});
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
 return entries.map((e,i)=>`<a href="${esc(e.href)}" data-section="${esc(e.id)}"><span>${pad(i+1)}</span>${inline(e.title)}</a>`).join('');
}
function renderReader(kind,item,tab,body){
 const tabs=kind==='topic'?[['guide','原理'],['code','代码'],['labs','练习']]:[['theory','原理'],['code','代码'],['exercise','练习']];
 const contents=readerContents(kind,item,tab),module=kind==='lesson'?moduleFor(item):null;
 const context=module?`<a href="#/?chapter=${module.id}">${esc(module.name)}</a>`:'<a href="#/">核心专题</a>';
 const core=null;
 markReading(kind,item,tab);
 return `<div class="reader-shell"><aside class="reader-sidebar"><a class="back-link" href="#/">← 课程目录</a><p>目录</p><nav aria-label="本页目录">${contents}</nav></aside><article class="reader-article"><header class="article-heading"><div class="article-context">${context}${core?`<a class="topic-shortcut" href="${topicHref(core)}">${esc(TOPIC_META[core].name)} 专题详解 →</a>`:''}</div><h1>${esc(item.title)}</h1></header><div class="reader-bar"><nav class="reader-tabs" aria-label="文章内容">${tabs.map(([id,label])=>`<a href="${kind==='topic'?topicHref(item.id,id):lessonHref(item.id,id)}" class="${id===tab?'active':''}" ${id===tab?'aria-current="page"':''}>${label}</a>`).join('')}</nav><details class="mobile-toc"><summary>目录</summary><nav aria-label="移动端文章目录">${contents}</nav></details></div><div class="reader-body">${body}</div>${renderRelated(kind,item,tab)}</article></div>`;
}

function renderLesson(l,tab,mode,params){
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
function renderRelated(kind,item,tab){
 const prerequisites=[...new Set(item.prerequisites||[])].filter(id=>byId[id]?.sections);
 const related=[...new Set(item.relatedLessons||[])].filter(id=>byId[id]?.sections&&id!==item.id);
 const group=(label,ids)=>ids.length?`<div class="connection-group"><span>${label}</span><div class="connection-links">${ids.map(id=>`<a href="${lessonHref(id)}">${esc(byId[id].title)} →</a>`).join('')}</div></div>`:'';
 const links=kind==='topic'?[...new Set([...prerequisites,...related])]:tab==='theory'?[]:[...prerequisites,...related];
 const list=kind==='lesson'?lessons:topics,index=list.indexOf(item),previous=list[index-1],next=list[index+1];
 const href=entry=>kind==='lesson'?lessonHref(entry.id):topicHref(entry.id);
 const relatedMarkup=kind==='lesson'?group('前置基础',prerequisites)+group('延伸应用',related):links.map(id=>`<a href="${lessonHref(id)}">${esc(byId[id].title)} →</a>`).join('');
 return `<footer class="article-footer">${relatedMarkup?`<details class="related-details"><summary>知识关联 · 前置基础与延伸应用</summary><div class="related-links">${relatedMarkup}</div></details>`:''}<nav class="article-pagination" aria-label="文章翻页">${previous?`<a href="${href(previous)}"><span>← 上一篇</span><strong>${esc(previous.title)}</strong></a>`:'<span></span>'}${next?`<a class="next" href="${href(next)}"><span>下一篇 →</span><strong>${esc(next.title)}</strong></a>`:''}</nav></footer>`;
}
function renderEvolution(evolution){
 if(!evolution?.steps?.length)return '';
 return `<details class="detail-box evolution-details"><summary>方法演进 · ${inline(evolution.title||'技术路线')}</summary><div class="detail-body">${evolution.context?`<p class="evolution-context">${inline(evolution.context)}</p>`:''}<ol class="evolution-steps">${evolution.steps.map(step=>`<li><strong>${inline(step.name)}</strong><p>${inline(step.change)}</p></li>`).join('')}</ol>${evolution.takeaway?`<p class="evolution-takeaway"><strong>本节要抓住：</strong>${inline(evolution.takeaway)}</p>`:''}</div></details>`;
}
function renderLearningConnections(item){
 const prerequisites=[...new Set(item.prerequisites||[])].filter(id=>byId[id]?.sections);
 const related=[...new Set(item.relatedLessons||[])].filter(id=>byId[id]?.sections&&id!==item.id);
 if(!prerequisites.length&&!related.length)return '';
 const group=(label,ids)=>ids.length?`<div class="connection-group"><span>${label}</span><div class="connection-links">${ids.map(id=>`<a href="${lessonHref(id)}">${esc(byId[id].title)} →</a>`).join('')}</div></div>`:'';
 return `<details class="detail-box learning-connections"><summary>知识关联 · 这节课与其他课程的关系</summary><div class="detail-body">${group('前置基础',prerequisites)}${group('进一步应用',related)}</div></details>`;
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
 const visual=TOPIC_VISUAL_SECTION[kind==='topic'?item.id:item.theoryTopic];
 return `<section class="article-section" id="${sectionId(kind,s,index)}" data-reading-section><h2><span class="section-number">${pad(index+1)}</span>${inline(cleanTitle(s.title))}</h2>${s.lead?`<p class="section-lead">${inline(s.lead)}</p>`:''}${renderFigures(s,0)}${renderWorkedExample(s.example,0)}${s.body.map((p,i)=>`<p>${inline(p)}</p>${renderFigures(s,i+1)}${renderWorkedExample(s.example,i+1)}`).join('')}${s.formula?`<div class="formula">${mathMarkup(s.formula,true)}</div>`:''}${s.bullets?.length?`<ul>${s.bullets.map(b=>`<li>${inline(b)}</li>`).join('')}</ul>`:''}${s.code?codeBlock(s.code,s.codeKind==='fragment'?'Python · 实现片段':'Python')+(s.codeExplanation?`<p class="code-note">${inline(s.codeExplanation)}</p>`:''):''}${renderFigures(s)}${renderComparison(s.comparison)}${renderWorkedExample(s.example)}${renderFocus(s.focus)}${visual&&visual.section===s.id?renderInlineVisual(visual.id):''}${(kind==='lesson'||kind==='topic')&&LV[item.id]&&LV[item.id].section===s.id?renderLessonLearning(item.id):''}</section>`;
}
function renderFigures(section,afterParagraph){
 const figures=section.figures||(section.figure?[section.figure]:[]);
 return figures.filter(f=>f.afterParagraph===afterParagraph).map(f=>{const src=f.src.startsWith('/')?f.src:'/'+f.src;const dimensions=Number.isInteger(f.width)&&Number.isInteger(f.height)&&f.width>0&&f.height>0?` width="${f.width}" height="${f.height}"`:'';return `<figure class="research-figure"><p class="figure-reading-hint">${src.endsWith('.gif')?'点击图片可打开原动图。':'图片较宽时可横向滚动；点击可打开原图。'}</p><a href="${esc(src)}" target="_blank" rel="noopener" aria-label="${esc((f.alt||section.title)+'（打开原图）')}"><img${dimensions} src="${esc(src)}" alt="${esc(f.alt||section.title)}" loading="lazy"></a><figcaption>${inline(f.caption||'')}</figcaption></figure>`;}).join('');
}
function renderInlineVisual(id){
 const visual=P0_VISUALS.find(x=>x.id===id);if(!visual)return '';
 const content=emlExplorer(visual.explorer);if(!content)return '';
 return `<details class="inline-visual" id="visual-${visual.id}"><summary>交互演示：${esc(visual.title)}</summary><div>${content}</div></details>`;
}
function renderChapterGoals(l){
 return `<aside class="chapter-goals" aria-label="本章学习目标"><h2>本章学习目标</h2><ul>${l.objectives.map(goal=>`<li>${inline(goal)}</li>`).join('')}</ul></aside>`;
}
function renderChapterReview(l){
 return `<section class="article-section chapter-review" id="chapter-review" data-reading-section><h2>读后自测</h2><p>先不看正文，写下答案，并用算例、推导或代码说明理由，再核对练习页的分析。</p><ol>${l.knowledgeChecks.slice(0,2).map((q,i)=>`<li><p>${inline(q.question)}</p><a href="${lessonHref(l.id,'exercise')+'&anchor=question-'+i}">核对参考解 →</a></li>`).join('')}</ol></section>`;
}
function renderLessonTheory(l){
 const visuals=l.theoryTopic?[]:P0_VISUALS.filter(v=>v.lessons[0]===l.id);
 const notation=`<details class="detail-box shape-details"><summary>符号与张量约定</summary><div class="detail-body table-wrap"><table><thead><tr><th>变量</th><th>形状</th><th>含义</th></tr></thead><tbody>${l.shapes.map(s=>`<tr><td>${inline(s.name)}</td><td>${shapeMarkup(s.shape)}</td><td>${inline(s.meaning)}</td></tr>`).join('')}</tbody></table></div></details>`;
 return `${l.lead?`<p class="article-intro">${inline(l.lead)}</p>`:''}${renderLearningConnections(l)}${renderEvolution(l.evolution)}${renderChapterGoals(l)}${notation}${l.sections.map((s,i)=>renderSection(s,i,'lesson',l)).join('')}${l.advancedSections?.length?`<details class="detail-box advanced-material"><summary>可选拓展：深入理论与进阶分析（${l.advancedSections.length} 节）</summary><div class="detail-body">${l.advancedSections.map((s,i)=>renderSection(s,l.sections.length+i,'lesson',l)).join('')}</div></details>`:''}${visuals.map(v=>renderInlineVisual(v.id)).join('')}${renderChapterReview(l)}${renderSources(l.sources,l.id)}<p class="article-action"><a class="button primary" href="${lessonHref(l.id,'code')}">阅读代码实现 →</a><a href="${lessonHref(l.id,'exercise')}">进入课程练习 →</a></p>`;
}
function renderTopicTheory(t){
 return `<p class="article-intro">${inline(t.lead)}</p><details class="detail-box notation"><summary>符号与张量约定</summary><div class="detail-body table-wrap"><table><thead><tr><th>符号</th><th>形状</th><th>含义</th></tr></thead><tbody>${t.notation.map(n=>`<tr><td>${inline(n.symbol)}</td><td>${shapeMarkup(n.shape)}</td><td>${inline(n.meaning)}</td></tr>`).join('')}</tbody></table></div></details>${t.sections.map((s,i)=>renderSection(s,i,'topic',t)).join('')}${renderSources(t.sources,null,t.relatedLessons)}<p class="article-action"><a class="button primary" href="${topicHref(t.id,'code')}">阅读代码实现 →</a><a href="${topicHref(t.id,'labs')}">进入课程练习 →</a></p>`;
}
function renderDiscussion(questions,kind,item){
 return `<section class="article-section discussion" id="discussion" data-reading-section><h2>推导与分析</h2><p>先写出推导、计算或反例，再展开参考解核对假设与关键步骤。编程题位于下方，可从本页目录直接进入。</p>${questions.map((q,i)=>`<section class="reasoning-question" id="question-${i}"><h3>${inline(q.question)}</h3><details class="detail-box"><summary>参考解与分析</summary><div class="detail-body">${(Array.isArray(q.answer)?q.answer:[q.answer]).map(p=>`<p>${inline(p)}</p>`).join('')}${q.codeFocus?`<p class="code-note"><strong>代码对应：</strong>${inline(q.codeFocus)}</p>`:''}${q.acceptance?.length?`<ul class="discussion-checks">${(Array.isArray(q.acceptance)?q.acceptance:[q.acceptance]).map(x=>`<li>${inline(x)}</li>`).join('')}</ul>`:''}</div></details></section>`).join('')}</section>`;
}
function renderPitfalls(items){
 return `<section class="article-section" id="mistakes" data-reading-section><h2>辨析与纠错</h2><p>判断下面的说法或实现会在哪一步失效，并说明成立所需的条件，再展开分析核对。</p>${items.map((p,i)=>`<details class="detail-box" id="pitfall-${i}"><summary>${inline(p.title)}</summary><div class="detail-body"><p>${inline(p.detail)}</p>${p.fix?`<p>${inline(p.fix)}</p>`:''}</div></details>`).join('')}</section>`;
}
function renderSources(sources,lessonId,related=[]){
 const ids=lessonId?[lessonId]:related;
 const external=(curriculum.resources||[]).filter(r=>r.lessons.some(id=>ids.includes(id)));
 return `<section class="article-section sources" id="sources" data-reading-section><h2>参考资料</h2><ol>${sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${inline(s.title)} ↗</a></li>`).join('')}</ol>${external.length?`<details class="detail-box"><summary>相关开源演示</summary><div class="detail-body">${external.map(r=>`<p><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a> <small>· ${esc(r.license)}</small></p><p>${inline(r.observe)}</p><p class="code-note">${inline(r.boundary)} <a href="${esc(r.repo)}" target="_blank" rel="noopener">源码</a></p>`).join('')}</div></details>`:''}</section>`;
}

function sourceExplanations(explanations,frame){
 return `<div class="source-explanations">${explanations.map(e=>`<button data-action="annotate" data-frame="${esc(frame)}" data-range="${esc(e.lines)}"><span>第 ${esc(e.lines)} 行</span><p>${inline(e.text)}</p></button>`).join('')}</div>`;
}
function mainImplementation(l){return (l.extraImplementations||[]).find(d=>d.id===l.mainImplementation);}
function renderLessonCode(l){
 const primary=mainImplementation(l),others=(l.extraImplementations||[]).filter(d=>d!==primary),advanced=l.advancedImplementations||[];
 return `<p class="code-reading-guide">运行前先预测关键输出，再对照断言和下方代码说明。核对通过后，尝试只改变一个输入或配置，解释输出为什么变化。</p>${primary?renderAdditionalCode(l,[primary]):''}${l.code.runtimeNote?`<p class="runtime-validation-note">${esc(l.code.runtimeNote)}</p>`:''}<section id="code-result" data-reading-section><h2 class="content-title">${primary?'补充演示的观察目标':'运行前的观察目标'}</h2><p>${inline(l.code.expected)}</p><p class="run-command"><code>python ${pad(l.number)}_${l.id}_demo.py</code><a href="#/guide">环境配置</a></p></section><section id="code-implementation" data-reading-section><h2 class="content-title">${primary?'补充演示：':''}${esc(l.code.title)}</h2>${codeBlock(l.code.source,pad(l.number)+'_'+l.id+'_demo.py','<button data-action="copy-demo">复制</button><button data-action="download-demo">下载 .py</button>','lesson-code')}</section><section id="code-explanations" data-reading-section><h3>代码说明</h3><p class="quiet">点击行号说明，高亮对应实现。</p>${sourceExplanations(l.code.explanations,'lesson-code')}</section>${renderAdditionalCode(l,others)}${advanced.length?`<details class="detail-box advanced-material"><summary>可选拓展实现（${advanced.length}）</summary><div class="detail-body">${renderAdditionalCode(l,advanced)}</div></details>`:''}<p class="article-action"><a class="button primary" href="${lessonHref(l.id,'exercise')}">进入课程练习 →</a></p>`;
}

function renderAdditionalCode(l,demos=l.extraImplementations||[]){return demos.map(d=>`<section class="implementation" id="demo-${d.id}" data-reading-section>${d.id===l.mainImplementation?'<p class="case-label">本章贯穿案例</p>':''}<h2>${inline(d.title)}</h2><p>${inline(d.description)}</p><div class="code-observation"><h3>运行时应核对</h3><p>${inline(d.expected)}</p></div>${codeBlock(d.source,(l.theoryTopic||l.id)+'_'+d.id+'.py',`<button data-action="copy-demo" data-lesson="${l.id}" data-demo="${d.id}">复制</button><button data-action="download-demo" data-lesson="${l.id}" data-demo="${d.id}">下载 .py</button>`,'code-'+d.id)}<h3>代码说明</h3>${sourceExplanations(d.explanations,'code-'+d.id)}</section>`).join('');}

function renderTopicCode(t){
 return t.implementations.map(d=>`<section class="implementation" id="demo-${d.id}" data-reading-section><h2>${inline(d.title)}</h2><p>${inline(d.description)}</p>${codeBlock(d.source,t.id+'_'+d.id+'.py',`<button data-action="copy-demo" data-topic="${t.id}" data-demo="${d.id}">复制</button><button data-action="download-demo" data-topic="${t.id}" data-demo="${d.id}">下载 .py</button>`,'code-'+d.id)}<h3>代码说明</h3>${sourceExplanations(d.explanations,'code-'+d.id)}<h3>预期结果</h3><p>${inline(d.expected)}</p></section>`).join('')+`<p class="article-action"><a class="button primary" href="${topicHref(t.id,'labs')}">进入课程练习 →</a><a href="#/guide">运行环境</a></p>`;
}
function renderTopicLabs(t,labId){
 const lab=t.labs.find(x=>x.id===labId)||t.labs[0];currentLesson=byId[topicExerciseId(t,lab)];currentTab='exercise';
 return `<nav class="lab-choices" aria-label="选择练习">${t.labs.map(l=>`<a href="${topicHref(t.id,'labs','&lab='+l.id)}" class="${lab.id===l.id?'active':''}" ${lab.id===l.id?'aria-current="page"':''}><strong>${esc(l.title)}</strong><small>${l.runtime==='python'?'Python · 在线运行':'PyTorch · 本地运行'}</small></a>`).join('')}</nav>${renderExercise(currentLesson,lab.runtime==='python'?'python':'torch',true)}`;
}
function renderExercise(l,mode,singleRuntime=false){
 const isTorch=mode==='torch',task=isTorch?l.pytorchTask:l.exercise;
 const draft=state.drafts[l.id+':'+mode]??task.starter;
 const filename=pad(l.number)+'_'+l.id+'_'+(isTorch?'torch':'practice')+'.py';
 return `${!singleRuntime?`<div class="runtime-tabs" aria-label="运行环境"><button class="${!isTorch?'active':''}" data-action="runtime" data-mode="python">Python · 在线运行</button><button class="${isTorch?'active':''}" data-action="runtime" data-mode="torch">PyTorch · 本地运行</button></div>`:''}<div class="exercise-head" id="exercise-task" data-reading-section><h2>${inline(task.title||(isTorch?'PyTorch 实现':'Python 实现'))}</h2>${proseParagraphs(task.prompt)}</div><details class="detail-box" id="exercise-tests" data-reading-section><summary>测试用例</summary><div class="detail-body">${codeBlock(task.tests,'tests.py')}</div></details><p class="runtime-note" id="editor-help">Tab 缩进 · Shift+Tab 反缩进 · Enter 自动缩进 · Esc 后按 Tab 移出编辑器。可拖动编程区右下角调整高度。</p><div class="editor-shell" id="exercise-editor" data-reading-section data-mode="${mode}"><div class="editor-toolbar"><span>${pad(l.number)}_${l.id}_${isTorch?'torch':'practice'}.py</span><small>草稿自动保存</small></div><div class="editor-wrap"><pre class="editor-lines" aria-hidden="true">${draft.split('\n').map((_,i)=>i+1).join('\n')}</pre><textarea id="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-describedby="editor-help" aria-label="${isTorch?'PyTorch':'Python'} 代码编辑器">${esc(draft)}</textarea></div><div class="editor-controls">${isTorch?'<button class="button primary" data-action="download-exercise">下载代码与测试</button>':'<button class="button primary" id="run-tests" data-action="run-tests">运行测试</button><button class="button" data-action="run-code">仅运行代码</button><button class="button" data-action="stop-code" hidden>停止</button><button class="text-button" data-action="download-exercise">下载 .py</button>'}<button class="text-button" data-action="copy-exercise">复制代码</button><button class="text-button" data-action="reset-code">恢复题目</button>${!isTorch?'<small>⌘ / Ctrl + Enter 测试 · 加 Shift 仅运行</small>':''}</div></div>${isTorch?`<p class="runtime-note">下载后在文件所在目录运行 <code>python ${esc(filename)}</code>。可先在这里编辑和复制代码；测试需使用本地 Python + PyTorch。<a href="#/guide">环境配置 →</a></p>`:`<details class="detail-box"><summary>自定义试运行（可选）</summary><div class="detail-body"><p class="runtime-note">调用上方实现的函数，用 print(...) 查看结果或用 assert 检查自己的例子。“仅运行代码”会执行此区；“运行测试”使用题目测试，不执行此区。草稿自动保存。</p><textarea id="try-code" class="try-code" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="自定义 Python 试运行代码" placeholder="例如：print(你的函数(...))">${esc(state.drafts[l.id+':scratch']??'')}</textarea></div></details><div class="output-panel"><div class="output-title"><span>运行结果</span><span id="run-status">等待运行</span></div><pre class="output-console" id="code-output" aria-live="polite">补全 TODO 后运行测试；也可在自定义试运行区调用函数并 print(...)。测试失败时查看 your_code.py 或 tests.py 的行号与断言。</pre></div>`}${task.hints?.length?`<details class="detail-box" id="exercise-hints" data-reading-section><summary>提示</summary><div class="detail-body"><p class="runtime-note">每次只展开一个提示，回到编程区尝试后再继续。</p>${task.hints.map((h,i)=>`<details><summary>提示 ${i+1}</summary><p>${inline(h)}</p></details>`).join('')}</div></details>`:''}<details class="detail-box solution-box" id="exercise-solution" data-reading-section><summary>参考实现与说明</summary><div class="detail-body"><p class="runtime-note">核对思路后，试着收起答案、恢复题目并独立重写；通过测试只表示满足本题提供的检查。</p>${codeBlock(task.solution,'参考实现')}${proseParagraphs(task.explanation)}<button class="button" data-action="fill-solution">将参考实现填入编辑器</button></div></details>`;
}
function renderPractice(){
 const topicGroups=practiceFilter==='all'||practiceFilter==='topics'?topics:[];
 const modules=MODULES.filter(m=>practiceFilter==='all'||practiceFilter===m.id);
 return `<div class="page practice-page"><header class="page-heading"><h1>课程练习</h1></header><label class="practice-filter">按主题查看<select id="practice-module"><option value="all">全部主题</option><option value="topics" ${practiceFilter==='topics'?'selected':''}>专题进阶练习</option>${MODULES.map(m=>`<option value="${m.id}" ${practiceFilter===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label>${modules.map(m=>`<section class="practice-chapter"><h2>${esc(m.name)}</h2><div class="practice-rows">${lessons.filter(l=>l.module===m.id).map(l=>`<div class="practice-row"><a class="practice-course" href="${lessonHref(l.id)}">${esc(l.title)}</a><a href="${lessonHref(l.id,'exercise')}">Python →</a><a href="${lessonHref(l.id,'exercise','torch')}">PyTorch →</a></div>`).join('')}</div></section>`).join('')}${topicGroups.length?`<section><h2>专题进阶练习</h2><div class="practice-topic-grid">${topicGroups.map(t=>`<section class="practice-topic"><h3>${esc(TOPIC_META[t.id].name)}</h3><ul>${t.labs.map(l=>`<li><a href="${topicHref(t.id,'labs','&lab='+l.id)}"><span>${esc(l.title)}</span><small>${l.runtime==='python'?'Python':'PyTorch'} →</small></a></li>`).join('')}</ul></section>`).join('')}</div></section>`:''}</div>`;
}
function renderGuide(){
 return `<div class="page narrow"><header class="page-heading"><h1>下载与运行</h1></header><section class="guide-section"><h2>学习资料</h2><div class="download-links"><a class="button primary" href="downloads/embodied-ml-study-pack.zip" download>下载完整学习包</a><a href="downloads/embodied-ml-topics.zip" download>下载专题练习包</a></div></section><section class="guide-section"><h2>运行环境</h2><p>Python 3.11 / 3.12 · CPU PyTorch 默认</p>${codeBlock('python -m venv .venv\nsource .venv/bin/activate  # Windows: .venv\\\\Scripts\\\\Activate.ps1\npython -m pip install torch','终端')}<p>GPU 安装方式见 <a href="https://pytorch.org/get-started/locally/" target="_blank" rel="noopener">PyTorch 官方安装说明 ↗</a>。Python 练习可在线运行；PyTorch 练习需本地运行。</p></section><section class="guide-section" id="drafts"><details class="detail-box"><summary>草稿备份</summary><div class="detail-body"><p>草稿保存在当前浏览器；导出包含草稿、笔记与记录，导入会合并草稿和笔记。</p><div class="download-links"><button class="button" data-action="export-drafts">导出备份</button><button class="button" data-action="import-drafts">导入备份</button></div></div></details></section><section class="guide-section"><details class="detail-box"><summary>历史课程归档（${lessons.filter(l=>l.module==='legacy').length} 节）</summary><div class="detail-body"><p>旧版课程继续保留；已迁移主题会跳转至对应的新课程。</p><ul class="reading-routes">${lessons.filter(l=>l.module==='legacy').map(l=>`<li><a href="${lessonHref(l.id)}">${esc(l.title)}</a></li>`).join('')}</ul></div></details></section></div>`;
}

function buildSearchIndex(){
 searchIndex=[];
 function add(entry){const raw=String(entry.text||''),text=EMLMath.searchText(raw,katex),title=EMLMath.searchText(entry.title,katex);searchIndex.push({...entry,text,title,normalized:normalize(entry.doc+' '+entry.title+' '+raw+' '+title+' '+text),normalizedTitle:normalize(title)});}
 function sectionText(s){const c=s.comparison;return sectionSearchText(s)+(c?' '+[c.title,...c.columns,...c.rows.flat()].join(' '):'');}
 for(const l of lessons){
  add({doc:moduleFor(l).name,title:l.title,href:lessonHref(l.id),text:[l.lead||'',l.subtitle,...l.tags].join(' '),kind:'article',key:l.id});
  l.sections.forEach((s,i)=>add({doc:l.title,title:cleanTitle(s.title),href:sectionHref('lesson',l,s,i),text:sectionText(s),kind:'section',key:l.id}));
  add({doc:l.title,title:l.code.title,href:lessonHref(l.id,'code'),text:l.code.source+' '+l.code.explanations.map(e=>e.text).join(' '),kind:'code',key:l.id});
  for(const d of l.extraImplementations||[])add({doc:l.title,title:d.title,href:lessonHref(l.id,'code')+'&anchor=demo-'+d.id,text:d.description+' '+d.source,kind:'code',key:l.id});
  for(const task of l.extraLabs||[])add({doc:l.title,title:task.title,href:lessonHref(l.id,'exercise')+'&lab='+task.id,text:task.prompt,kind:'exercise',key:l.id});
  for(const [mode,key] of [['python','exercise'],['torch','pytorchTask']]){const task=l[key];add({doc:l.title,title:task.title||l.title+' · '+(mode==='python'?'Python':'PyTorch')+' 练习',href:lessonHref(l.id,'exercise',mode),text:task.prompt,kind:'exercise',key:l.id});}
  for(const [i,q] of (l.knowledgeChecks||[]).entries())add({doc:l.title,title:q.question,href:lessonHref(l.id,'exercise')+'&anchor=question-'+i,text:q.answer.join(' '),kind:'discussion',key:l.id});
  for(const [i,p] of (l.pitfalls||[]).entries())add({doc:l.title,title:p.title,href:lessonHref(l.id,'exercise')+'&anchor=pitfall-'+i,text:[p.detail,p.fix].filter(Boolean).join(' '),kind:'pitfall',key:l.id});
 }
}
function sectionSearchText(s){return [s.lead||'',...s.body,...(s.bullets||[]),s.code||'',s.codeExplanation||'',s.formula?'\\['+s.formula+'\\]':'',s.example?[s.example.title,...s.example.steps,s.example.conclusion].join(' '):'',s.focus?[s.focus.title,s.focus.explanation,s.focus.check].join(' '):''].join(' ');}
function searchHighlight(text,terms){
 const escaped=terms.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).filter(Boolean);if(!escaped.length)return esc(text);
 const re=new RegExp(escaped.join('|'),'gi');let out='',last=0;
 for(const m of text.matchAll(re)){out+=esc(text.slice(last,m.index))+'<mark>'+esc(m[0])+'</mark>';last=m.index+m[0].length;}
 return out+esc(text.slice(last));
}
function renderSearch(query=''){
 const terms=query.trim().split(/\s+/).filter(Boolean),needles=terms.map(normalize);
 if(!terms.length){$('#search-results').innerHTML=`<p class="search-label">核心专题</p>${topics.map(t=>`<a class="search-result" data-search-result href="${topicHref(t.id)}"><strong>${esc(TOPIC_META[t.id].name)}</strong><p>${esc(TOPIC_META[t.id].description)}</p></a>`).join('')}`;return;}
 const ranked=searchIndex.filter(e=>needles.every(n=>e.normalized.includes(n))).map(e=>({...e,score:needles.reduce((n,term)=>n+(e.normalizedTitle===term?120:e.normalizedTitle.includes(term)?35:2),0)+(e.kind==='article'?10:0)})).sort((a,b)=>b.score-a.score);
 const seen=new Set(),perDoc={},matches=[];
 for(const e of ranked){if(seen.has(e.href))continue;const bucket=e.key+':'+e.kind;if((perDoc[bucket]||0)>=3)continue;seen.add(e.href);perDoc[bucket]=(perDoc[bucket]||0)+1;matches.push(e);if(matches.length===12)break;}
 $('#search-results').innerHTML=matches.length?matches.map(e=>{const raw=e.text.replace(/\s+/g,' '),position=Math.max(0,...terms.map(t=>raw.toLowerCase().indexOf(t.toLowerCase()))),start=Math.max(0,position-35),snippet=(start?'…':'')+raw.slice(start,start+140)+(raw.length>start+140?'…':'');return `<a class="search-result" data-search-result href="${esc(e.href)}"><small>${esc(e.doc)}${e.kind==='code'?' · 代码':e.kind==='exercise'?' · 练习':''}</small><strong>${searchHighlight(e.title,terms)}</strong><p>${searchHighlight(snippet,terms)}</p></a>`;}).join(''):'<p class="empty-state">没有找到匹配内容。试试更短的关键词。</p>';
}
