'use strict';
// One renderer serves both crawlable HTML and the browser enhancement.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const katex=require('../dist/vendor/katex/katex.min.js');
const siteURL=new URL(process.env.SITE_URL||'https://wxb1870.github.io/embodied-ml-lab/');
const origin=siteURL.origin,basePath=siteURL.pathname.replace(/\/$/,'');
const sitePath=route=>basePath+route;
const lessons=JSON.parse(fs.readFileSync(path.join(dist,'data/lessons.json'),'utf8'));
const topics=JSON.parse(fs.readFileSync(path.join(dist,'data/topics.json'),'utf8'));
const curriculum=JSON.parse(fs.readFileSync(path.join(dist,'data/curriculum.json'),'utf8'));
const noop=()=>{};
const location={origin,pathname:'/',search:'',hash:''};
const context={console,URL,URLSearchParams,location,katex,EML_BASE_PATH:basePath,localStorage:{getItem:()=>null,setItem:noop},
 document:{addEventListener:noop,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},
 setTimeout:noop,clearTimeout:noop,requestAnimationFrame:noop,history:{replaceState:noop,pushState:noop}};
context.window=context;vm.createContext(context);
for(const name of ['math.js','explorers.js','p0-explorers.js','deep-explorers.js','reader.js'])vm.runInContext(fs.readFileSync(path.join(dist,name),'utf8'),context,{filename:name});
const app=fs.readFileSync(path.join(dist,'app.js'),'utf8');
vm.runInContext(app.slice(0,app.indexOf("document.addEventListener('click'")),context,{filename:'app-core.js'});
vm.runInContext(`curriculum=${JSON.stringify(curriculum)};MODULES=curriculum.modules;lessons=${JSON.stringify(lessons)};topics=${JSON.stringify(topics)};byId=Object.fromEntries(lessons.map(l=>[l.id,l]));topicById=Object.fromEntries(topics.map(t=>[t.id,t]));registerTopicExercises();markReading=()=>{};`,context);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let formulas=0;
const shell=fs.readFileSync(path.join(root,'content/site-shell.html'),'utf8');
const pages=[];
function page(route,title,description,expression,{noindex=false,redirect}={}){
 location.pathname=sitePath(route);location.search=route.includes('/code/')?'?tab=code':route.includes('/exercise/')?'?tab=exercise':'';
 vm.runInContext('state=emptyState();currentLesson=null;currentTab="theory";',context);
 const content=vm.runInContext('normalizeInternalLinks('+expression+')',context);
 formulas+=(content.match(/class="katex"/g)||[]).length;
 let html=shell.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(title)} · Embodied ML Lab</title>`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(description)}">`)
  .replace('<head>',`<head><script>window.EML_BASE_PATH=${JSON.stringify(basePath)};</script>`)
  .replace('</head>',`<link rel="canonical" href="${origin+sitePath(route)}">${noindex?'<meta name="robots" content="noindex">':''}${redirect?'<meta http-equiv="refresh" content="0;url='+escape(sitePath(redirect))+'">':''}</head>`)
  .replace(/<main id="main"[\s\S]*?<\/main>/,`<main id="main" tabindex="-1" data-prerendered>${content}</main>`);
 html=vm.runInContext('normalizeInternalLinks('+JSON.stringify(html)+')',context);
 const file=route==='/404/'?path.join(dist,'404.html'):path.join(dist,route,'index.html');
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);
 if(!noindex)pages.push({path:route,title,bytes:Buffer.byteLength(html)});
}
for(const name of ['learn','topics','practice','guide'])fs.rmSync(path.join(dist,name),{recursive:true,force:true});
page('/','机器学习、生成模型与具身策略','个人自用的机器学习与具身智能学习网站，整理原理笔记、代码示例和练习。','renderCatalog()');
for(const lesson of lessons){
 for(const [tab,suffix] of [['theory',''],['code','code/'],['exercise','exercise/']]){
  const route='/learn/'+lesson.id+'/'+suffix;
  page(route,lesson.title+(tab==='theory'?'':tab==='code'?' · 代码':' · 练习'),lesson.subtitle,
   `renderLesson(byId[${JSON.stringify(lesson.id)}],${JSON.stringify(tab)},'python',new URLSearchParams())`);
 }
}
page('/practice/','课程练习','结合数学推导、手工计算、反例分析与可运行实现，检验对课程的理解。','renderPractice()');
page('/guide/','下载与运行','下载完整讲义、PyTorch 代码及练习，配置本地运行环境。','renderGuide()');
page('/404/','页面不存在','请求的课程不存在。','notFound()',{noindex:true});
// Old standalone topic paths are aliases; the lesson is the sole canonical article.
for(const [lessonId,topicId] of Object.entries(curriculum.canonicalTopics||{})){
 const dir=path.join(dist,'topics',topicId);fs.mkdirSync(dir,{recursive:true});
 const target=sitePath('/learn/'+lessonId+'/');
 const firstLab=topics.find(t=>t.id===topicId).labs[0].id;
 const redirectScript=`const p=new URLSearchParams(location.search),old=p.get('tab')||'guide';const tab=({guide:'theory',labs:'exercise',questions:'exercise',reference:'theory'}[old]||old);p.set('tab',tab);if(old==='questions')p.set('anchor','discussion');if(old==='labs'&&!p.has('lab'))p.set('lab',${JSON.stringify(firstLab)});location.replace(${JSON.stringify(target)}+(tab==='theory'?'':tab+'/')+'?'+p.toString()+location.hash);`;
 fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>课程地址已合并</title><meta name="robots" content="noindex"><link rel="canonical" href="${origin+target}"></head><body><a href="${target}">打开课程</a><script>${redirectScript}</script></body></html>`);
}
fs.writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin+sitePath('/sitemap.xml')}\n`);
fs.writeFileSync(path.join(dist,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(p=>`<url><loc>${origin+sitePath(p.path)}</loc><lastmod>${curriculum.reviewedAt}</lastmod></url>`).join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(root,'reports/prerender-validation.json'),JSON.stringify({pages:pages.length,formulasRendered:formulas,entries:pages},null,2)+'\n');
console.log(JSON.stringify({pages:pages.length,formulasRendered:formulas,bytes:pages.reduce((n,p)=>n+p.bytes,0)}));
