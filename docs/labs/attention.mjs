import {gaussianBank, compareAttention, kvCache} from './attention-math.mjs';

const dimPresets=[[8,'低维基线'],[64,'常用头宽'],[512,'高维饱和']];
const models=[['MHA',8],['GQA',2],['MQA',1]];
const defaults=()=>({dim:512,seed:7,q:8,kv:2,t:4096,l:32,head:128});
const options=(arr,value)=>arr.map(v=>`<option${v===value?' selected':''}>${v}</option>`).join('');
const divisors=n=>Array.from({length:n},(_,i)=>i+1).filter(i=>n%i===0);
const format=v=>v!==0&&Math.abs(v)<0.001?v.toExponential(2):v.toFixed(3);
const memory=bytes=>(bytes<2**30?+(bytes/2**20).toFixed(2)+' MiB':+(bytes/2**30).toFixed(3)+' GiB');
const channels=['raw','scaled'];

function bars(data,field) {
  const scores=field==='scores', w=360,h=148;
  const bound=scores?Math.max(1,Math.ceil(Math.max(...data.raw.scores.map(Math.abs)))):1;
  const low=scores?-bound:0, high=bound;
  const y=v=>14+(high-v)/(high-low)*104;
  const ticks=scores?[bound,0,-bound]:[1,.5,0];
  let body=ticks.map(v=>`<path d="M33 ${y(v)}h319" class="plot-rule"/><text x="28" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('');
  for(let i=0;i<8;i++){
    const center=53+i*39.5;
    for(const [j,channel] of channels.entries()) {
      const v=data[channel][field][i], top=Math.min(y(0),y(v));
      body+=`<rect x="${center-11+j*11}" y="${top}" width="9" height="${Math.abs(y(0)-y(v))}" class="att-${channel}"><title>K${i+1} · ${j?'缩放':'原始'} · ${format(v)}</title></rect>`;
    }
    body+=`<text x="${center}" y="138" text-anchor="middle">K${i+1}</text>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${scores?'八组点积分数，共用零轴':'八组 Softmax 概率，纵轴零到一'}">${body}</svg>`;
}
function numbers(a,d) {
  const rows=[
    ['样本方差 / 理论方差',format(a.raw.variance)+' / '+d,format(a.scaled.variance)+' / 1'],
    ['最大注意力权重',format(a.raw.peak),format(a.scaled.peak)],
    ['熵 H(p) · nat',format(a.raw.entropy),format(a.scaled.entropy)],
    ['最大对角梯度 p(1−p)',format(a.raw.gradient),format(a.scaled.gradient)]
  ];
  return rows.map(([label,raw,scaled])=>`<tr><th scope="row">${label}</th><td>${raw}</td><td>${scaled}</td></tr>`).join('');
}
function distribution(state,bank) {
  const a=compareAttention(bank,state.dim);
  return `<div class="att-legend"><span>原始 QKᵀ</span><span>除以 √dₖ</span></div><div class="att-plots">
    <div><h4>点积分数</h4>${bars(a,'scores')}</div><div><h4>Softmax 概率</h4>${bars(a,'probabilities')}</div></div>
    <table class="att-table"><thead><tr><th>同一组 Q、K</th><th>原始</th><th>缩放</th></tr></thead><tbody>${numbers(a,state.dim)}</tbody></table>
    <p class="lab-foot">方差按 8 个分数作样本估计。梯度取各概率对自身分数的导数最大值。</p>`;
}
function sharing(s) {
  const a=kvCache(s.q,s.kv,s.t,s.l,s.head);
  const width=Math.max(448,28*s.q), pad=8, pitch=(width-2*pad)/s.q;
  const qx=i=>pad+(i+.5)*pitch, kx=i=>pad+(i+.5)*pitch*a.groupSize;
  const rectWidth=Math.min(30,pitch-3);
  let groups='';
  for(let k=0;k<s.kv;k++) {
    const x=kx(k);
    const heads=a.groups.map((group,i)=>group===k?i:-1).filter(i=>i>=0);
    groups+=`<g data-group="${k}" class="head-group group-${k%2}">`;
    for(const i of heads)groups+=`<path d="M${qx(i)} 32 C${qx(i)} 57 ${x} 62 ${x} 90" class="head-edge"/>`;
    for(const i of heads)groups+=`<g data-head="${k}" tabindex="0" role="img" aria-label="Q${i} 读取 KV${k}"><rect x="${qx(i)-rectWidth/2}" y="10" rx="4" width="${rectWidth}" height="22"/><text x="${qx(i)}" y="25">${i}</text></g>`;
    groups+=`<g data-head="${k}" tabindex="0" role="img" aria-label="KV${k} 由 ${a.groupSize} 个 Query 共享"><rect x="${x-rectWidth/2}" y="90" rx="4" width="${rectWidth}" height="22"/><text x="${x}" y="105">${k}</text></g></g>`;
  }
  return `<h4>Query heads <small>Q₀ … Q${s.q-1}</small></h4><div class="head-scroll"><svg data-headmap viewBox="0 0 ${width} 121" style="min-width:${Math.max(260,s.q*20)}px" role="group" aria-label="Query 与 KV 的分组共享图">${groups}</svg></div><h4>KV heads <small>KV₀ … KV${s.kv-1}</small></h4>
  <p class="lab-readout" data-group-info>悬停或聚焦一个头，查看它的共享组。</p>
  <div data-memory>${memoryPanel(s,a)}</div>`;
}
function memoryPanel(s,a) {
  const metrics=[['每个 KV 服务',a.groupSize+' 个 Q'],['KV 投影参数 / MHA',+(100*a.ratio).toFixed(2)+'%'],['当前 KV Cache',memory(a.bytes)],['MHA 对照',memory(a.mhaBytes)],['显存压缩倍数',a.groupSize+'×']];
  return `<dl class="lab-metrics">${metrics.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  <p class="lab-foot">单序列 BF16 · 2（K、V）× ${s.l} 层 × ${s.t} token × ${s.kv} 头 × ${s.head} 维 × 2 B = ${a.bytes.toLocaleString('en-US')} B。固定模型宽度时，每 token 的 K/V 投影计算与投影权重数均按 Hₖᵥ / Hq 缩放。</p>`;
}
function select(label,key,choices,value){
  return `<label>${label}<select data-param="${key}">${options(choices,value)}</select></label>`;
}
function dimNote(d){
  if(d===8)return '低维也可能出现尖峰。固定向量后增大维度，观察原始与缩放分数的差距。';
  if(d===64)return '缩放把点积的理论方差从 64 调回 1，八个样本的实测方差仍会波动。';
  if(d===512)return '高维原始分数更易拉开差距；当单个权重逼近 1，所有对角梯度都趋近 0。';
  return '两组柱使用相同向量与坐标轴，只有缩放因子不同。';
}
export function renderInitial(){
  const s=defaults();
  return `<header><h2>注意力实验</h2></header>
  <div class="lab-tabs" role="tablist" aria-label="注意力实验视图"><button role="tab" id="att-tab-a" aria-controls="att-a" aria-selected="true">1. √dₖ 缩放与梯度消失</button><button role="tab" id="att-tab-b" aria-controls="att-b" aria-selected="false" tabindex="-1">2. MHA · GQA · MQA 分组与 KV 显存</button></div>
  <section id="att-a" role="tabpanel" aria-labelledby="att-tab-a">
  <div class="lab-buttons">${dimPresets.map(([v,label])=>`<button data-dim="${v}" aria-pressed="${s.dim===v}">${label} · ${v}</button>`).join('')}</div><p class="lab-note" data-dim-note>${dimNote(s.dim)}</p>
  <div class="lab-controls"><label class="lab-range">头维度 dₖ <input data-param="dim" type="range" min="4" max="512" value="${s.dim}" list="att-dims"><output data-dimension>${s.dim}</output></label><datalist id="att-dims">${options([8,32,64,128,256,512],0)}</datalist>
  <button data-resample>换一组随机向量</button><small data-seed>seed ${s.seed}</small></div><div data-distribution>${distribution(s,gaussianBank(s.seed))}</div></section>
  <section id="att-b" role="tabpanel" aria-labelledby="att-tab-b" hidden>
  <div class="lab-buttons">${models.map(([m,kv])=>`<button data-model="${kv}" aria-pressed="${s.kv===kv}">${m} · 8∶${kv}</button>`).join('')}</div>
  <p class="lab-note" data-kv-note>每 4 个 Query 共享一对 K/V；同长度缓存缩至 MHA 的四分之一。</p>
  <div class="lab-controls">${select('Query 头','q',[4,8,16,32],s.q)}${select('KV 头','kv',divisors(s.q),s.kv)}${select('层数 L','l',[1,8,16,24,32,48,64,80],s.l)}${select('头维度','head',[64,128],s.head)}
  <label class="lab-range">序列长度 T <input type="range" data-param="t" min="512" max="32768" step="1" value="${s.t}"><output data-tokens>${s.t}</output></label></div>
  <div data-sharing>${sharing(s)}</div></section>`;
}
export function mount(root) {
  if(!root.querySelector('[data-distribution]'))root.innerHTML=renderInitial();
  const s=defaults(), get=sel=>root.querySelector(sel);let bank=gaussianBank(s.seed);
  function updateA(){
    get('[data-dimension]').textContent=s.dim;get('[data-seed]').textContent='seed '+s.seed;
    get('[data-param="dim"]').value=s.dim;get('[data-dim-note]').textContent=dimNote(s.dim);
    for(const b of root.querySelectorAll('[data-dim]'))b.setAttribute('aria-pressed',+b.dataset.dim===s.dim);
    get('[data-distribution]').innerHTML=distribution(s,bank);
  }
  function updateB(topologyChanged=true){
    get('[data-param="kv"]').innerHTML=options(divisors(s.q),s.kv);
    get('[data-param="q"]').value=s.q;get('[data-tokens]').textContent=s.t;
    for(const b of root.querySelectorAll('[data-model]'))b.setAttribute('aria-pressed',s.q===8&&+b.dataset.model===s.kv);
    get('[data-kv-note]').textContent=s.q===s.kv?'每个 Query 拥有独立的 K/V，缓存随头数线性增长。':
      s.kv===1?'全部 Query 读取同一对 K/V，缓存仍要随序列长度增长。':`每 ${s.q/s.kv} 个 Query 共用一对 K/V，缓存缩至 MHA 的 1/${s.q/s.kv}。`;
    if(topologyChanged)get('[data-sharing]').innerHTML=sharing(s);
    else get('[data-memory]').innerHTML=memoryPanel(s,kvCache(s.q,s.kv,s.t,s.l,s.head));
  }
  function tab(active){
    for(const b of root.querySelectorAll('[role=tab]')){
      const on=b===active;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;
      get('#'+b.getAttribute('aria-controls')).hidden=!on;
    }
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.getAttribute('role')==='tab')tab(b);
    else if(b.hasAttribute('data-dim')){s.dim=+b.dataset.dim;s.seed=7;bank=gaussianBank(s.seed);updateA();}
    else if(b.hasAttribute('data-resample')){bank=gaussianBank(++s.seed);updateA();}
    else if(b.hasAttribute('data-model')){s.q=8;s.kv=+b.dataset.model;updateB();}
  });
  root.addEventListener('keydown',e=>{
    if(e.target.getAttribute('role')!=='tab'||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const both=[...root.querySelectorAll('[role=tab]')];
    const next=e.key==='Home'?both[0]:e.key==='End'?both[1]:both.find(b=>b!==e.target);
    tab(next);next.focus();
  });
  root.addEventListener('input',e=>{
    const key=e.target.dataset.param;if(!key)return;
    s[key]=Number(e.target.value);
    if(key==='dim')updateA();
    else {if(key==='q')s.kv=Math.min(s.q,s.kv);updateB(key==='q'||key==='kv');}
  });
  function highlight(el) {
    const head=el?.closest?.('[data-head]'), svg=get('[data-headmap]');
    const k=head?Number(head.dataset.head):-1;
    if(svg.dataset.active===String(k))return;
    svg.dataset.active=k;
    for(const g of svg.querySelectorAll('[data-group]'))g.classList.toggle('muted-group',k>=0&&+g.dataset.group!==k);
    const size=s.q/s.kv;
    get('[data-group-info]').textContent=k<0?'悬停或聚焦一个头，查看它的共享组。':
      `KV${k} ← Q${k*size}${size>1?' … Q'+((k+1)*size-1):''} · ${size} 个 Query`;
  }
  for(const name of ['pointerover','focusin'])root.addEventListener(name,e=>{if(e.target.closest('[data-headmap]'))highlight(e.target);});
  for(const name of ['pointerout','focusout'])root.addEventListener(name,e=>{if(e.target.closest('[data-head]'))highlight(e.relatedTarget);});
}
