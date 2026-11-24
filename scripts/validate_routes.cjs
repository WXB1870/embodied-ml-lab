'use strict';
// Pure renderer/router checks, including migration of previously saved exercise drafts.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const read=name=>JSON.parse(fs.readFileSync(path.join(dist,'data',name+'.json'),'utf8'));
const lessons=read('lessons'),topics=read('topics'),curriculum=read('curriculum');
const noop=()=>{},siteURL=new URL(process.env.SITE_URL||'https://wxb1870.github.io/embodied-ml-lab/'),origin=siteURL.origin,basePath=siteURL.pathname.replace(/\/$/,'');
const context={console,URL,URLSearchParams,EML_BASE_PATH:basePath,katex:require('../dist/vendor/katex/katex.min.js'),location:{origin,pathname:basePath+'/',search:'',hash:''},
 localStorage:{getItem:()=>null,setItem:noop},document:{addEventListener:noop},
 setTimeout:noop,clearTimeout:noop};
context.window=context;vm.createContext(context);
for(const name of ['math.js','reader.js'])vm.runInContext(fs.readFileSync(path.join(dist,name),'utf8'),context);
const app=fs.readFileSync(path.join(dist,'app.js'),'utf8');
vm.runInContext(app.slice(0,app.indexOf("document.addEventListener('click'")),context);
vm.runInContext(`curriculum=${JSON.stringify(curriculum)};MODULES=curriculum.modules;lessons=${JSON.stringify(lessons)};topics=${JSON.stringify(topics)};byId=Object.fromEntries(lessons.map(l=>[l.id,l]));topicById=Object.fromEntries(topics.map(t=>[t.id,t]));registerTopicExercises();markReading=()=>{};`,context);
const evaluate=expression=>vm.runInContext(expression,context);
require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'validate_lab_math.cjs')],{stdio:'inherit'});
const records=[];
function test(name,fn){fn();records.push({name,passed:true});}

test('Mathematical brackets are preserved rather than parsed as a relative link',()=>{
 const input='μ+[tσ²−(1−t)](x−tμ)/q(t)';
 assert.equal(evaluate(`inline(${JSON.stringify(input)})`),input);
 assert.equal(evaluate(`inline('[x](javascript:alert)')`),'[x](javascript:alert)');
 assert.ok(evaluate(`inline('[概率](#/learn/probability)')`).includes('href="'+basePath+'/learn/probability/?tab=theory"'));
});

test('Deployment paths cover assets, downloads and repeated normalization',()=>{
 const html=evaluate(`normalizeInternalLinks('<a href="downloads/embodied-ml-study-pack.zip">下载</a><img src="/assets/figures/transformer.svg"><a href="/practice/">练习</a>')`);
 assert.ok(html.includes('href="'+basePath+'/downloads/embodied-ml-study-pack.zip"'));
 assert.ok(html.includes('src="'+basePath+'/assets/figures/transformer.svg"'));
 assert.ok(html.includes('href="'+basePath+'/practice/"'));
 assert.equal(evaluate(`normalizeInternalLinks(${JSON.stringify(html)})`),html);
 assert.equal(evaluate(`routeHref(${JSON.stringify(basePath+'/')})`),basePath+'/');
 for(const resource of ['/assets/figures/d2l-classic-LICENSE.txt','/assets/figures/transformer-vaswani-figure1.png?download=1#figure','/downloads/embodied-ml-study-pack.zip']){
  assert.equal(evaluate(`routeHref(${JSON.stringify(resource)})`),basePath+resource);
  assert.equal(evaluate(`routeHref(${JSON.stringify(basePath+resource)})`),basePath+resource);
 }
 const caption=evaluate(`normalizeInternalLinks(inline('[许可](/assets/figures/d2l-classic-LICENSE.txt)'))`);
 assert.ok(caption.includes('href="'+basePath+'/assets/figures/d2l-classic-LICENSE.txt"'));
});

test('Homepage catalog, appendices and practice link to their registered courses',()=>{
 const html=evaluate('renderCatalog()');
 assert.ok(html.includes('href="#chapter-robot-agent"')&&html.includes('id="chapter-robot-agent"'));
 assert.ok(!html.includes('核心课程')&&!html.includes('含手撕'));
 for(const module of curriculum.modules){
  let last=-1;
  for(const id of module.lessons){
   const href=evaluate('lessonHref('+JSON.stringify(id)+')');
   const index=html.indexOf(href);
   assert.ok(index>last,id+' missing or out of order');
   last=index;
  }
 }
 const practice=evaluate('renderPractice()');
 assert.ok(practice.includes('手撕题库')&&practice.includes('/learn/generative-post-training/?tab=exercise'));
});

test('Search indexes chapter titles and body text for the two completed modules',()=>{
 evaluate('buildSearchIndex()');
 const lessonIds=[...curriculum.modules.find(m=>m.id==='robot-agent').lessons,'generative-post-training'];
 for(const id of lessonIds){
  const entries=evaluate('searchIndex.filter(entry=>entry.key==='+JSON.stringify(id)+')');
  const lesson=lessons.find(l=>l.id===id);
  assert.ok(entries.some(entry=>entry.kind==='article'&&entry.title===lesson.title));
  assert.equal(entries.filter(entry=>entry.kind==='section').length,lesson.sections.length);
  if(lesson.theoryOnly)assert.ok(entries.every(entry=>entry.href.includes('?tab=theory')));
 }
});

for(const lesson of lessons){
 const canonicalId=evaluate(`LEGACY_LESSON_IDS[${JSON.stringify(lesson.id)}]`)||lesson.id;
 test(lesson.id+' theory rendering follows its course type',()=>{
  const html=evaluate(`renderLesson(byId[${JSON.stringify(lesson.id)}],'theory','python',new URLSearchParams())`);
  assert.ok(html.includes('class="article-intro"'));
  const expectedLabs={
   'cnn-receptive-field':[['receptive-field','cnn','data-marker']],
   attention:[['1','attention','data-probabilities'],['mqa-gqa-kv-sharing','kv-sharing','data-headmap']]
  }[lesson.id]||[];
  const published=fs.readFileSync(path.join(dist,'learn',lesson.id,'index.html'),'utf8');
  assert.equal(published.includes('data-course-lab-style'),Boolean(expectedLabs.length));
  for(const page of [html,published]){
   assert.equal((page.match(/data-course-lab="/g)||[]).length,expectedLabs.length);
   for(const [section,name,marker] of expectedLabs){
    const start=page.indexOf('id="section-'+section+'"');
    const end=page.indexOf('<section class="article-section"',start+1);
    const body=page.slice(start,end<0?undefined:end);
    const formula=body.indexOf('class="formula"'), lab=body.indexOf('data-course-lab="'+name+'"');
    assert.ok(start>=0 && formula>=0 && lab>formula,name+' must follow its chapter formula');
    if(page===published)assert.ok(body.slice(lab).includes(marker),name+' missing prerendered content');
   }
  }
  if(expectedLabs.length)for(const tab of ['code','exercise']){
   assert.ok(!evaluate(`renderLesson(byId[${JSON.stringify(lesson.id)}],'${tab}','python',new URLSearchParams())`).includes('data-course-lab='));
  }
  assert.doesNotMatch(html,/data-learning-visual|data-lv-|class="inline-visual"|data-explorer=/);
  assert.equal((html.match(/class="section-lead"/g)||[]).length,lesson.sections.length+(lesson.advancedSections||[]).length);
  assert.ok(!html.includes('id="discussion"'));
  assert.ok(!html.includes('class="key-points"'));
  assert.ok(!html.includes('learning-connections')&&!html.includes('related-details'));
  if(lesson.prerequisites.length)assert.equal((html.match(/class="prerequisite-reading"/g)||[]).length,1);
  if(lesson.theoryOnly){
   assert.ok(!html.includes('class="chapter-goals"')&&!html.includes('id="chapter-review"'));
   assert.ok(!html.includes('class="article-action"')&&!html.includes('<pre')&&!html.includes('class="inline-visual"'));
   assert.ok(html.includes('<table>'));
   const code=evaluate(`renderLesson(byId[${JSON.stringify(lesson.id)}],'code','python',new URLSearchParams())`);
   const exercise=evaluate(`renderLesson(byId[${JSON.stringify(lesson.id)}],'exercise','python',new URLSearchParams())`);
   assert.ok(!code.includes('id="code-implementation"')&&!exercise.includes('id="exercise-editor"'));
   assert.ok(!html.includes('class="reader-tabs"')&&!html.includes('class="reader-bar"'));
   assert.ok(html.includes('class="mobile-toc"'));
   assert.ok(!html.includes('>代码</a>')&&!html.includes('>练习</a>'));
   assert.ok(!evaluate('renderPractice()').includes(lesson.title));
  }else{
   assert.ok(html.includes('class="reader-tabs"'));
   assert.ok(html.includes('class="chapter-goals"')&&html.includes('id="chapter-review"'));
   if(lesson.advancedSections?.length)assert.ok(html.includes('advanced-material'));
   const practice=evaluate(`renderLesson(byId[${JSON.stringify(lesson.id)}],'exercise','python',new URLSearchParams())`);
   assert.ok(practice.includes('id="discussion"')&&practice.includes('id="question-0"'));
   assert.ok(practice.includes('id="exercise-editor"'));
  }
 });
 if(lesson.theoryOnly){
  test(lesson.id+' legacy Robot Agent routes map to the consolidated theory lesson',()=>{
   const mapped=evaluate(`routeHref('/learn/robot-agent-loop/?tab=theory')`);
   assert.ok(mapped.includes('/learn/agent-architecture/?tab=theory'));
   const forced=evaluate(`renderLesson(byId[${JSON.stringify(lesson.id)}],'code','python',new URLSearchParams())`);
   assert.ok(!forced.includes('id="code-implementation"'));
  });
  continue;
 }
 test(lesson.id+' legacy discussion and pitfall routes lead to course exercises',()=>{
  for(const anchor of ['discussion','question-0','mistakes','pitfall-0']){
   const raw='/learn/'+lesson.id+'/?tab=theory&anchor='+anchor;
   const target=new URL(evaluate(`routeHref(${JSON.stringify(raw)})`),origin);
   assert.equal(target.pathname,basePath+'/learn/'+canonicalId+'/');
   assert.equal(target.searchParams.get('anchor'),anchor);
   assert.equal(target.searchParams.get('tab'),'exercise');
  }
 });
 test(lesson.id+' canonical theory/code/exercise query routes',()=>{
  for(const tab of ['theory','code','exercise']){
   const expected='/learn/'+lesson.id+'/?tab='+tab;
   assert.equal(evaluate(`routeHref(${JSON.stringify(expected)})`),basePath+'/learn/'+canonicalId+'/?tab='+tab);
   assert.equal(evaluate(`routeHref(${JSON.stringify(basePath+expected)})`),basePath+'/learn/'+canonicalId+'/?tab='+tab);
   const legacy='/learn/'+lesson.id+'/'+(tab==='theory'?'':tab+'/')+'?tab='+tab;
   const legacyResult=evaluate(`routeHref(${JSON.stringify(legacy)})`);
   assert.ok([basePath+'/learn/'+canonicalId+'/?tab='+tab,basePath+legacy].includes(legacyResult));
   context.location.pathname=basePath+'/learn/'+lesson.id+'/';
   context.location.search='?tab='+tab;context.location.hash='';
   assert.equal(evaluate('parseRoute().path'),'/learn/'+lesson.id);
   assert.equal(evaluate('parseRoute().params.get("tab")'),tab);
   context.location.pathname=basePath+'/learn/'+lesson.id+'/'+(tab==='theory'?'':tab+'/');
   context.location.search='';context.location.hash='';
   assert.equal(evaluate('parseRoute().path'),'/learn/'+lesson.id);
   assert.equal(evaluate('parseRoute().params.get("tab")')||'theory',tab);
  }
 });
 if(!lesson.theoryTopic)continue;
 const topic=topics.find(t=>t.id===lesson.theoryTopic),ids=new Set([...topic.sections,...(topic.advancedSections||[])].map(s=>s.id));
 const topicCanonicalId=({mlp:'mlp',cnn:'cnn-receptive-field',transformer:'attention','flow-matching':'flow-matching'})[topic.id]||canonicalId;
 for(const [old,target] of Object.entries(lesson.legacySectionMap))test(lesson.id+' old section '+old,()=>assert.ok(ids.has(target)));
 for(const [old,target] of Object.entries(lesson.legacyAnchorMap)){
  test(lesson.id+' old discussion link '+old,()=>{
   const raw='#/learn/'+lesson.id+'?tab=theory&anchor='+old;
   const converted=evaluate(`routeHref(${JSON.stringify(raw)})`);
   assert.equal(new URL(converted,origin).searchParams.get('anchor'),target);
   const native='/learn/'+lesson.id+'/?tab=theory&anchor='+old;
   assert.equal(new URL(evaluate(`routeHref(${JSON.stringify(native)})`),origin).searchParams.get('anchor'),old);
  });
 }
 const aliasHTML=fs.readFileSync(path.join(dist,'topics',topic.id,'index.html'),'utf8');
 const script=aliasHTML.match(/<script>([\s\S]*?)<\/script>/)[1];
 for(const oldTab of ['guide','code','labs','questions','reference'])test(topic.id+' native alias '+oldTab,()=>{
  let result;
  vm.runInNewContext(script,{URLSearchParams,location:{search:'?tab='+oldTab,hash:'',replace:value=>result=value}});
  const url=new URL(result,origin),tab=['labs','questions'].includes(oldTab)?'exercise':oldTab==='code'?'code':'theory';
  assert.equal(url.pathname,basePath+'/learn/'+topicCanonicalId+'/');
  assert.equal(url.searchParams.get('tab'),tab);
  if(oldTab==='labs')assert.equal(url.searchParams.get('lab'),topic.labs[0].id);
  if(oldTab==='questions')assert.equal(url.searchParams.get('anchor'),'discussion');
 });
 for(const lab of topic.labs)test(topic.id+' migrated draft '+lab.id,()=>{
  const id='topic-'+topic.id+'-'+lab.id,marker='draft_for_'+id;
  evaluate(`state=emptyState();state.drafts[${JSON.stringify(id+':'+lab.runtime)}]=${JSON.stringify(marker)};`);
  const html=evaluate(`renderLesson(byId[${JSON.stringify(lesson.id)}],'exercise','python',new URLSearchParams(${JSON.stringify('lab='+lab.id)}))`);
  assert.equal(evaluate('currentLesson.id'),id);assert.ok(html.includes(marker));
  const converted=evaluate(`routeHref(${JSON.stringify('#/topics/'+topic.id+'?tab=labs&lab='+lab.id)})`);
  const url=new URL(converted,origin);assert.equal(url.pathname,basePath+'/learn/'+topicCanonicalId+'/');
  assert.equal(url.searchParams.get('tab'),'exercise');
  assert.equal(url.searchParams.get('lab'),lab.id);
 });
}
test('Core code pages start with the running example and retain unique code frames',()=>{
 for(const id of ['mlp','cnn-receptive-field','flow-matching']){
  const lesson=lessons.find(l=>l.id===id);
  const html=evaluate(`renderLesson(byId[${JSON.stringify(id)}],'code','python',new URLSearchParams())`);
  const mainStart=html.indexOf('id="demo-'+lesson.mainImplementation+'"');
  assert.ok(mainStart>=0&&mainStart<html.indexOf('id="code-implementation"'));
  assert.equal((html.match(/id="lesson-code"/g)||[]).length,1);
  for(const demo of lesson.extraImplementations)assert.equal((html.match(new RegExp('id="code-'+demo.id+'"','g'))||[]).length,1);
 }
});
test('Attention course retains its own executable code page',()=>{
 const html=evaluate(`renderLesson(byId[\"attention\"],'code','python',new URLSearchParams())`);
 assert.ok(html.includes('id=\"lesson-code\"')&&html.includes('id=\"code-implementation\"'));
});
fs.writeFileSync(path.join(root,'reports/route-validation.json'),JSON.stringify({total:records.length,passed:records.length,results:records},null,2)+'\n');
console.log(JSON.stringify({routeAndRendererChecks:records.length,passed:records.length}));
