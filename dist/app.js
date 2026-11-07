'use strict';
const SITE_BASE_PATH=window.EML_BASE_PATH||'';
const sitePath=value=>SITE_BASE_PATH&&!(value===SITE_BASE_PATH||value.startsWith(SITE_BASE_PATH+'/'))?SITE_BASE_PATH+value:value;
const localPath=value=>SITE_BASE_PATH&&(value===SITE_BASE_PATH||value.startsWith(SITE_BASE_PATH+'/'))?(value.slice(SITE_BASE_PATH.length)||'/'):value;
let MODULES=[],curriculum={};
let lessons=[],byId={},topics=[],topicById={},searchIndex=[];
let currentLesson=null,currentTab='theory',practiceFilter='all';
let sectionObserver=null;
const STORAGE_KEY='embodied-ml-lab-v1';
const emptyState=()=>({version:1,drafts:{},notes:{},passed:{},viewed:{},lastLesson:null,lastRead:null});
let state;
try{state=Object.assign(emptyState(),JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}catch{state=emptyState();}
for(const key of ['drafts','notes','passed','viewed'])if(!state[key]||typeof state[key]!=='object'||Array.isArray(state[key]))state[key]={};
let savingWarning=false;
function save(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{if(!savingWarning){toast('当前浏览器无法保存草稿，可下载代码或导出备份。');savingWarning=true;}}}
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function inline(value){
 const parts=[];
 const restore=text=>text.replace(/\u0000(\d+)\u0000/g,(_,i)=>parts[Number(i)]);
 let text=EMLMath.tokens(value).map((token,index,tokens)=>{
  if(token.type==='text')return token.value;
  const join=token.type==='math'&&!token.display&&tokens[index+1]?.type==='text'&&/^[，。；：、？！）]/.test(tokens[index+1].value)?'&#8288;':'';
  parts.push((token.type==='code'?'<code>'+esc(token.value)+'</code>':mathMarkup(token.value,token.display))+join);
  return '\u0000'+(parts.length-1)+'\u0000';
 }).join('');
 text=text.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(original,label,href)=>{
  if(!/^(https:\/\/|#\/|\/(?!\/))/.test(href))return original;
  const internal=href.startsWith('#/')||href.startsWith('/');
  parts.push('<a href="'+esc(internal?routeHref(href):href)+'"'+(internal?'':' target="_blank" rel="noopener"')+'>'+restore(esc(label))+'</a>');
  return '\u0000'+(parts.length-1)+'\u0000';
 });
 return restore(esc(text).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>'));
}
const pad=v=>String(v).padStart(2,'0');
const cleanTitle=t=>String(t).replace(/^\d+[.、．]\s*/,'');
const moduleFor=l=>MODULES.find(m=>m.id===l.module)||MODULES[0];
const lessonHref=(id,tab='theory',mode)=>sitePath('/learn/'+id+'/'+(tab==='theory'?'':tab+'/'))+'?tab='+tab+(mode?'&mode='+mode:'');
const topicHref=(id,tab='guide',extra='')=>lessonHref(Object.keys(CORE_LESSON_TOPIC).find(k=>CORE_LESSON_TOPIC[k]===id)||id,({guide:'theory',labs:'exercise'}[tab]||tab))+extra;
const topicExerciseId=(t,l)=>'topic-'+t.id+'-'+l.id;
const normalize=t=>String(t).toLowerCase().replace(/[\s_-]+/g,'');
function parseRoute(){
 const legacy=location.hash.startsWith('#/'),raw=legacy?location.hash.slice(1):localPath(location.pathname)+location.search;
 const split=raw.indexOf('?'),params=new URLSearchParams(split<0?'':raw.slice(split+1));
 let path=(split<0?raw:raw.slice(0,split)).replace(/\/$/,'')||'/';
 const match=path.match(/^\/learn\/([a-z0-9-]+)\/(code|exercise)$/);
 if(match){path='/learn/'+match[1];if(!params.has('tab'))params.set('tab',match[2]);}
 return {path,params};
}
function routeHref(raw){
 const url=new URL(raw.startsWith('#/')?raw.slice(1):raw,location.origin);
 if(url.origin!==location.origin)return raw;
 if(/^\/(assets|downloads)\//.test(localPath(url.pathname)))return sitePath(localPath(url.pathname))+url.search+url.hash;
 const parts=localPath(url.pathname).split('/').filter(Boolean),params=url.searchParams;
 if(parts[0]==='topics'&&parts[1]){
  const topic=topicById[parts[1]],id=Object.keys(CORE_LESSON_TOPIC).find(k=>CORE_LESSON_TOPIC[k]===parts[1]);
  if(id){
   const oldTab=params.get('tab')||'guide',tab=({guide:'theory',labs:'exercise',questions:'exercise',reference:'theory'}[oldTab]||oldTab);
   params.set('tab',tab);if(oldTab==='questions')params.set('anchor','discussion');
   if(oldTab==='labs'&&!params.has('lab')&&topic)params.set('lab',topic.labs[0].id);
   const extra=new URLSearchParams([...params].filter(([k])=>k!=='tab')).toString();
   return lessonHref(id,tab)+(extra?'&'+extra:'');
  }
 }
 if(parts[0]==='learn'&&parts[1]){
  let tab=params.get('tab')||(['code','exercise'].includes(parts[2])?parts[2]:'theory');
  if(raw.startsWith('#/learn/')){
   const map=byId[parts[1]]?.legacyAnchorMap||{};
   const old=params.has('pitfall')?'pitfall-'+params.get('pitfall'):params.get('anchor');
   if(map[old]){params.set('anchor',map[old]);params.delete('pitfall');}
  }
  const moved=params.has('pitfall')?'pitfall-'+params.get('pitfall'):params.get('anchor');
  if(moved&&/^(discussion|mistakes|question-\d+|pitfall-\d+)$/.test(moved)){
   tab='exercise';params.set('anchor',moved);params.delete('pitfall');params.delete('lab');
  }
  const extra=new URLSearchParams([...params].filter(([k])=>k!=='tab')).toString();
  return lessonHref(parts[1],tab)+(extra?'&'+extra:'');
 }
 return sitePath(localPath(url.pathname).replace(/\/?$/,'/'))+url.search+url.hash;
}
function normalizeInternalLinks(html){
 return html.replace(/href="#\/([^"]*)"/g,(_,rest)=>'href="'+esc(routeHref('#/'+rest.replace(/&amp;/g,'&')))+'"').replace(/href="(downloads\/[^"]*)"/g,'href="/$1"').replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g,(_,attr,value)=>attr+'="'+sitePath(value)+'"');
}
function navigate(href,replace=false){
 const url=routeHref(href);
 if(activeJob)terminateRun();
 if(replace)history.replaceState(null,'',url);else if(location.pathname+location.search!==url)history.pushState(null,'',url);
 render();window.scrollTo({top:0,behavior:'instant'});scrollToSection();
}
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2600);}
function mathMarkup(source,display=false){
 return EMLMath.render(source,display,katex);
}
function syntax(line){
 const rx=/(#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|class|return|import|from|as|for|in|if|elif|else|while|with|assert|raise|try|except|finally|pass|True|False|None|and|or|not|lambda|yield|del|is|break|continue)\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?\b|\b[A-Za-z_]\w*(?=\())/g;
 let out='',last=0;
 for(const m of line.matchAll(rx)){out+=esc(line.slice(last,m.index));const token=m[0];const cls=token.startsWith('#')?'comment':/^['"]/.test(token)?'string':/^\d/.test(token)?'number':/^(def|class|return|import|from|as|for|in|if|elif|else|while|with|assert|raise|try|except|finally|pass|True|False|None|and|or|not|lambda|yield|del|is|break|continue)$/.test(token)?'keyword':'function';out+=`<span class="tok-${cls}">${esc(token)}</span>`;last=m.index+token.length;}
 return out+esc(line.slice(last));
}
function codeBlock(source,title='Python',actions='',id=''){
 return `<div class="code-frame" ${id?`id="${esc(id)}"`:''}><div class="code-toolbar"><span>${esc(title)}</span><div>${actions}</div></div><pre class="code-block" tabindex="0">${String(source||'').split('\n').map((line,i)=>`<span class="code-line" data-n="${i+1}">${syntax(line)||' '}</span>`).join('')}</pre></div>`;
}
function markReading(kind,item,tab){
 const {params}=parseRoute(),mode=tab==='exercise'?(params.get('mode')==='torch'?'torch':'python'):undefined;
 let href=kind==='topic'?topicHref(item.id,tab):lessonHref(item.id,tab,mode);
 if(params.has('lab'))href+='&lab='+encodeURIComponent(params.get('lab'));
 state.lastRead={href,title:item.title};if(kind==='lesson')state.lastLesson=item.id;save();
}
function lastReading(){
 if(state.lastRead){
  const match=state.lastRead.href.match(/(?:#)?\/(learn|topics)\/([a-z0-9-]+)/);
  if(match){const item=match[1]==='learn'?byId[match[2]]:topicById[match[2]];if(item)return {href:routeHref(state.lastRead.href),title:item.title};}
 }
 const l=byId[state.lastLesson];return l&&l.sections?{href:lessonHref(l.id),title:l.title}:null;
}
function registerTopicExercises(){topics.forEach((t,ti)=>t.labs.forEach((l,li)=>{const task={...l};byId[topicExerciseId(t,l)]={id:topicExerciseId(t,l),number:'T'+(ti+1)+(li+1),title:l.title,exercise:task,pytorchTask:task,topicId:t.id};}));}
function canonicalRoute(){
 if(location.hash.startsWith('#/'))history.replaceState(null,'',routeHref(location.hash));
 let {path,params}=parseRoute(),href=null,pendingQuery=null;
 if(path.startsWith('/topics/'))href=routeHref(location.pathname+location.search);
 if(path==='/learn'||path==='/topics'||path==='/p0')href='#/'+(params.get('module')?'?chapter='+encodeURIComponent(params.get('module')):'');
 if(path==='/reference'){pendingQuery=params.get('q');href='#/';}
 if(path==='/map')href=byId[params.get('node')]?lessonHref(params.get('node')):'#/';
 if(path==='/progress')href='#/guide?section=drafts';
 if(path==='/visuals'){const v=P0_VISUALS.find(x=>x.id===params.get('demo'));href=v?lessonHref(v.lessons[0])+'&anchor=visual-'+v.id:'#/';}
 if(path.startsWith('/learn/')&&params.get('tab')==='quiz')href=lessonHref(path.split('/')[2])+'&anchor=discussion';
 if(path.startsWith('/learn/')&&(params.has('pitfall')||/^(discussion|mistakes|question-\d+|pitfall-\d+)$/.test(params.get('anchor')||'')))href=routeHref(location.pathname+location.search);
 if(path.startsWith('/topics/')&&['reference','questions'].includes(params.get('tab')))href=topicHref(path.split('/')[2],'guide',params.get('tab')==='questions'?'&anchor=discussion':'');
 if(href)history.replaceState(null,'',routeHref(href));
 return pendingQuery;
}
function render(){
 if(!lessons.length)return;
 if(sectionObserver)sectionObserver.disconnect();
 const pendingQuery=canonicalRoute(),{path,params}=parseRoute();currentLesson=null;currentTab='theory';let html,active='catalog',title='';
 const indexable=['/','/practice','/guide'].includes(path)||(/^\/learn\/[a-z0-9-]+$/.test(path)&&byId[path.split('/')[2]]?.sections);
 if(/^\/learn\/[a-z0-9-]+$/.test(path)){const l=byId[path.split('/')[2]];if(l?.sections){const tab=['theory','code','exercise'].includes(params.get('tab'))?params.get('tab'):'theory';html=renderLesson(l,tab,params.get('mode')==='torch'?'torch':'python',params);title=l.title;}else html=notFound();}
 else if(path.startsWith('/topics/')){const t=topicById[path.split('/')[2]];if(t){html=renderTopic(t,params);title=t.title;}else html=notFound();}
 else if(path==='/practice'){html=renderPractice();active='practice';title='课程练习';}
 else if(path==='/guide'){html=renderGuide();active='guide';title='下载与说明';}
 else if(path==='/')html=renderCatalog();else html=notFound();
 $('#main').innerHTML=normalizeInternalLinks(html);
 const canonical=$('link[rel=canonical]');if(canonical)canonical.href=location.origin+location.pathname;
 const description=$('meta[name=description]');if(description&&currentLesson)description.content=currentLesson.subtitle||currentLesson.title;
 let robots=$('meta[name=robots]');
 if(indexable){if(robots)robots.remove();}
 else{if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots);}robots.content='noindex';}
 $$('[data-nav]').forEach(el=>{const chosen=el.dataset.nav===active;el.classList.toggle('active',chosen);if(chosen)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 document.title=(title?title+' · ':'')+'Embodied ML';
 initExplorers();bindEditor();bindPracticeFilters();trackSections();
 if(pendingQuery)requestAnimationFrame(()=>openSearch(pendingQuery));
}
function notFound(){return '<div class="page narrow"><h1>没有找到这篇内容</h1><a class="button primary" href="#/">返回课程目录</a></div>';}
function scrollToSection(){
 const {path,params}=parseRoute();let id=params.get('anchor');
 if(params.get('section')){const item=byId[path.split('/')[2]],section=item?.legacySectionMap?.[params.get('section')]??params.get('section');id=path.startsWith('/learn/')?'section-'+section:params.get('section');}
 if(id?.startsWith('topic-section-'))id='section-'+id.slice(14);
 const lesson=byId[path.split('/')[2]];if(id?.startsWith('section-')&&lesson?.legacySectionMap?.[id.slice(8)])id='section-'+lesson.legacySectionMap[id.slice(8)];
 if(params.has('pitfall'))id='pitfall-'+params.get('pitfall');
 if(params.get('chapter'))id='chapter-'+(curriculum.moduleAliases?.[params.get('chapter')]||params.get('chapter'));
 if(id)requestAnimationFrame(()=>{const el=document.getElementById(id);if(el){const details=el.closest('details');if(details)details.open=true;el.scrollIntoView({block:'start',behavior:'instant'});}});
}
function trackSections(){
 const targets=$$('[data-reading-section]');if(!targets.length||!window.IntersectionObserver)return;
 sectionObserver=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;$$('.reader-sidebar [data-section]').forEach(a=>{const active=a.dataset.section===e.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-110px 0px -65% 0px',threshold:0});
 targets.forEach(x=>sectionObserver.observe(x));
}
function bindPracticeFilters(){
 const filter=$('#practice-module');if(filter)filter.addEventListener('change',()=>{practiceFilter=filter.value;render();});
}
function bindEditor(){
 const editor=$('#code-editor');if(!editor||!currentLesson)return;const id=currentLesson.id,mode=$('.editor-shell').dataset.mode;
 editor.addEventListener('input',()=>{state.drafts[id+':'+mode]=editor.value;save();$('.editor-lines').textContent=editor.value.split('\n').map((_,i)=>i+1).join('\n');});
 editor.addEventListener('scroll',()=>{$('.editor-lines').scrollTop=editor.scrollTop;});
 editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('    ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();if(mode==='python')runCode(true);else downloadExercise();}});
}

let pythonWorker=null,activeJob=null,jobCounter=0,runTimer=null;
function setRunUI(busy){$$('[data-action="run-tests"],[data-action="run-code"]').forEach(b=>b.disabled=busy);const stop=$('[data-action="stop-code"]');if(stop)stop.hidden=!busy;}
function showOutput(text,cls,append=false){const out=$('#code-output');if(!out)return;if(append){out.textContent=(out.textContent==='正在准备 Python 环境…'?'':out.textContent)+text+'\n';out.scrollTop=out.scrollHeight;}else{out.textContent=text;}if(cls!==undefined)out.className='output-console '+cls;}
function runStatus(text,cls=''){const el=$('#run-status');if(el){el.textContent=text;el.className=cls;}}
function terminateRun(message='运行已停止。可以修改代码后重新运行。'){if(pythonWorker)pythonWorker.terminate();pythonWorker=null;activeJob=null;clearTimeout(runTimer);setRunUI(false);showOutput(message,'');runStatus('已停止');}
function runCode(withTests){if(!currentLesson||!$('#code-editor')||$('.editor-shell').dataset.mode!=='python')return;if(activeJob){toast('代码正在运行，可先点击停止。');return;}const l=currentLesson,code=$('#code-editor').value;activeJob={id:++jobCounter,lesson:l.id,withTests};setRunUI(true);showOutput('正在准备 Python 环境…','');runStatus('加载 Python');if(!pythonWorker){pythonWorker=new Worker(new URL(sitePath('/python-worker.js'),window.location.origin));pythonWorker.onmessage=e=>{const msg=e.data;if(!activeJob||msg.id!==activeJob.id)return;const visible=currentLesson?.id===activeJob.lesson&&currentTab==='exercise'&&$('.editor-shell')?.dataset.mode==='python';if(msg.type==='loading'){if(visible)runStatus('首次加载约 14 MB');}else if(msg.type==='ready'){clearTimeout(runTimer);runTimer=setTimeout(()=>terminateRun('执行超过 8 秒，已停止。请检查循环终止条件，或下载到本地运行。'),8000);if(visible){showOutput('','');runStatus('运行中');}}else if(msg.type==='stdout'||msg.type==='stderr'){if(visible)showOutput(msg.text,undefined,true);}else if(msg.type==='done'){clearTimeout(runTimer);const finished=activeJob;if(msg.passed){state.passed[finished.lesson]=true;save();}if(visible){showOutput(msg.passed?'✓ 所有提供的断言测试通过。':'✓ 代码执行结束。此次未运行断言测试。',msg.passed?'pass':'',true);runStatus(msg.passed?'测试通过':'运行结束',msg.passed?'good':'');}activeJob=null;setRunUI(false);}else if(msg.type==='error'){clearTimeout(runTimer);if(visible){showOutput(msg.text,'error',true);runStatus('未通过 / 运行错误','bad');}activeJob=null;setRunUI(false);}};pythonWorker.onerror=e=>{showOutput('Python 环境加载或执行失败：'+e.message+'\n请重新运行，或下载练习到本地 Python 环境执行。','error');runStatus('运行环境错误','bad');if(pythonWorker)pythonWorker.terminate();pythonWorker=null;activeJob=null;clearTimeout(runTimer);setRunUI(false);};}runTimer=setTimeout(()=>terminateRun('Python 环境加载超过 60 秒。请检查网络后再试，或下载练习在本地运行。'),60000);pythonWorker.postMessage({id:activeJob.id,code,tests:withTests?l.exercise.tests:''});}
function download(content,name,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('代码已复制');}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('代码已复制');}}
function downloadExercise(){if(!currentLesson)return;const l=currentLesson,mode=$('.editor-shell')?.dataset.mode||'python',task=mode==='torch'?l.pytorchTask:l.exercise;const code=$('#code-editor')?.value??task.starter;download('# '+l.title+'\n# '+(mode==='torch'?'运行环境：Python + PyTorch（CPU 即可）':'运行环境：Python 3 标准库')+'\n# 完成 TODO，然后运行此文件。\n\n'+code+'\n\n# ===== 断言测试 =====\n'+task.tests+'\nprint("所有提供的测试通过。")\n',`${pad(l.number)}_${l.id}_${mode==='torch'?'torch':'practice'}.py`);}


function openSearch(query=''){const dialog=$('#search-dialog');$('#search-input').value=query;renderSearch(query);if(!dialog.open)dialog.showModal();$('#search-input').focus();}
function closeSearch(){if($('#search-dialog').open)$('#search-dialog').close();}
document.addEventListener('click',async event=>{
 if(event.target.closest('[data-search-result]')){closeSearch();requestAnimationFrame(scrollToSection);}
 const tocLink=event.target.closest('.reader-sidebar a[data-section],.mobile-toc a[data-section]');
 if(tocLink){const mobile=tocLink.closest('.mobile-toc');if(mobile)mobile.open=false;if(tocLink.getAttribute('href')===location.hash){event.preventDefault();scrollToSection();}}
 const link=event.target.closest('a[href]');
 if(link&&!event.defaultPrevented&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&!link.hasAttribute('download')&&!link.target){
  const url=new URL(link.href,location.origin);
  if(url.origin===location.origin&&(/^\/(learn|topics|practice|guide)(\/|$)/.test(localPath(url.pathname))||localPath(url.pathname)==='/')&&(!url.hash||url.hash.startsWith('#/'))){
   event.preventDefault();navigate(url.hash.startsWith('#/')?url.hash:url.pathname+url.search);return;
  }
 }
 const target=event.target.closest('[data-action]');if(!target)return;
 const action=target.dataset.action,l=currentLesson;
 if(action==='search')openSearch();
 else if(action==='close-search')closeSearch();
 else if(action==='runtime'&&l)navigate(lessonHref(l.id,'exercise',target.dataset.mode));
 else if(action==='copy-demo'||action==='download-demo'){
  const owner=target.dataset.lesson?byId[target.dataset.lesson]:l;
  const d=target.dataset.topic?topicById[target.dataset.topic]?.implementations.find(x=>x.id===target.dataset.demo):target.dataset.demo?owner?.extraImplementations?.find(x=>x.id===target.dataset.demo):owner?.code;
  const filename=target.dataset.topic?target.dataset.topic+'_'+d?.id+'.py':target.dataset.demo?(owner?.theoryTopic||owner?.id)+'_'+d?.id+'.py':owner?pad(owner.number)+'_'+owner.id+'_demo.py':'demo.py';
  if(d){if(action==='copy-demo')await copy(d.source);else download(d.source+'\n',filename);}
 }
 else if(action==='annotate'){
  const frame=document.getElementById(target.dataset.frame);if(!frame)return;
  const nums=target.dataset.range.match(/\d+/g)?.map(Number)||[],from=nums[0]||1,to=nums[1]||from;
  frame.querySelectorAll('.code-line').forEach(line=>line.classList.toggle('highlight-line',Number(line.dataset.n)>=from&&Number(line.dataset.n)<=to));
  target.closest('.source-explanations').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===target));
  const pre=frame.querySelector('pre'),line=frame.querySelector('[data-n="'+from+'"]');if(line)pre.scrollTop=line.offsetTop-pre.clientHeight/4;frame.scrollIntoView({block:'start',behavior:'smooth'});
 }
 else if(action==='download-exercise')downloadExercise();
 else if(action==='reset-code'&&l){const mode=$('.editor-shell').dataset.mode,task=mode==='torch'?l.pytorchTask:l.exercise;const editor=$('#code-editor');editor.value=task.starter;editor.dispatchEvent(new Event('input'));toast('已恢复题目代码');}
 else if(action==='fill-solution'&&l){const mode=$('.editor-shell').dataset.mode,task=mode==='torch'?l.pytorchTask:l.exercise;const editor=$('#code-editor');editor.value=task.solution;editor.dispatchEvent(new Event('input'));editor.scrollIntoView({behavior:'smooth',block:'center'});toast('已填入参考实现');}
 else if(action==='run-tests')runCode(true);
 else if(action==='stop-code')terminateRun();
 else if(action==='export-drafts')download(JSON.stringify({app:'embodied-ml-lab',exportedAt:new Date().toISOString(),state},null,2),'embodied-ml-drafts.json','application/json');
 else if(action==='import-drafts')$('#import-drafts').click();
});
document.addEventListener('keydown',event=>{
 const editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
 if(!event.isComposing&&(((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')||(event.key==='/'&&!editing))){event.preventDefault();openSearch();}
 if($('#search-dialog').open&&event.target===$('#search-input')&&['Enter','ArrowDown'].includes(event.key)){const result=$('#search-results a');if(result){event.preventDefault();if(event.key==='Enter')result.click();else result.focus();}}
});
$('#search-input').addEventListener('input',e=>renderSearch(e.target.value));
$('#search-dialog').addEventListener('click',e=>{if(e.target===$('#search-dialog'))closeSearch();});
$('#import-drafts').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>5000000)throw new Error('备份文件过大');
  const parsed=JSON.parse(await file.text());if(parsed.app!=='embodied-ml-lab'||parsed.state?.version!==1)throw new Error('不是有效的本站备份');
  for(const key of ['drafts','notes']){const values=parsed.state[key];if(!values||typeof values!=='object'||Array.isArray(values))continue;for(const [id,value] of Object.entries(values)){if(Object.hasOwn(byId,id.split(':')[0])&&typeof value==='string'&&value.length<100000)state[key][id]=value;}}
  save();toast('已导入草稿与笔记');
 }catch(error){toast('导入失败：'+error.message);}e.target.value='';
});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#/'))navigate(location.hash,true);});
window.addEventListener('popstate',()=>{if(activeJob)terminateRun();render();window.scrollTo({top:0,behavior:'instant'});scrollToSection();});
$('.skip-link').addEventListener('click',e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView();});
async function init(){
 try{
  const [courseResponse,catalogResponse,topicResponse]=await Promise.all([fetch(sitePath('/data/lessons.json'),{cache:'no-cache'}),fetch(sitePath('/data/curriculum.json'),{cache:'no-cache'}),fetch(sitePath('/data/topics.json'),{cache:'no-cache'})]);
  if(!courseResponse.ok||!catalogResponse.ok||!topicResponse.ok)throw new Error('课程文件暂时不可用');
  curriculum=await catalogResponse.json();MODULES=curriculum.modules;
  lessons=(await courseResponse.json()).sort((a,b)=>a.number-b.number);byId=Object.fromEntries(lessons.map(l=>[l.id,l]));topics=await topicResponse.json();topicById=Object.fromEntries(topics.map(t=>[t.id,t]));
  registerTopicExercises();buildSearchIndex();render();scrollToSection();
 }catch(error){if(document.querySelector('[data-prerendered]')){console.error(error);return;}$('#main').innerHTML=`<div class="page narrow"><h1>课程暂时无法加载</h1><p>${esc(error.message)}</p><button class="button primary" onclick="location.reload()">重新加载</button></div>`;}
}
init();
