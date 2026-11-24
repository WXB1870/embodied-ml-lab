import {kvCache} from './attention-math.mjs';

const models=[['MHA',8],['GQA',2],['MQA',1]];
const defaults=()=>({q:8,kv:8,t:4096,l:32,head:128});
const options=(arr,value)=>arr.map(v=>`<option${v===value?' selected':''}>${v}</option>`).join('');
const divisors=n=>Array.from({length:n},(_,i)=>i+1).filter(i=>n%i===0);
const memory=bytes=>(bytes<2**30?+(bytes/2**20).toFixed(2)+' MiB':+(bytes/2**30).toFixed(3)+' GiB');
function select(label,key,choices,value){
  return `<label>${label}<select data-param="${key}">${options(choices,value)}</select></label>`;
}
function sharing(s) {
  const a=kvCache(s.q,s.kv,s.t,s.l,s.head);
  const width=Math.max(448,28*s.q), pad=8, pitch=(width-2*pad)/s.q;
  const qx=i=>pad+(i+.5)*pitch, kx=i=>pad+(i+.5)*pitch*a.groupSize;
  const rectWidth=Math.min(30,pitch-3);
  let groups='';
  for(let k=0;k<s.kv;k++) {
    const x=kx(k);
    const heads=Array.from({length:a.groupSize},(_,i)=>k*a.groupSize+i);
    groups+=`<g data-group="${k}" class="head-group group-${k%2}">`;
    for(const i of heads)groups+=`<path d="M${qx(i)} 32 C${qx(i)} 57 ${x} 62 ${x} 90" class="head-edge"/>`;
    for(const i of heads)groups+=`<g data-head="${k}" tabindex="0" role="img" aria-label="Q${i} 读取 KV${k}"><rect x="${qx(i)-rectWidth/2}" y="10" rx="4" width="${rectWidth}" height="22"/><text x="${qx(i)}" y="25">${i}</text></g>`;
    groups+=`<g data-head="${k}" tabindex="0" role="img" aria-label="KV${k} 由 ${a.groupSize} 个 Query 共享"><rect x="${x-rectWidth/2}" y="90" rx="4" width="${rectWidth}" height="22"/><text x="${x}" y="105">${k}</text></g></g>`;
  }
  return `<h4>Query heads <small>Q₀ … Q${s.q-1}</small></h4><div class="head-scroll"><svg data-headmap viewBox="0 0 ${width} 121" style="min-width:${Math.max(260,s.q*20)}px" role="group" aria-label="Query 与 KV 的分组共享图">${groups}</svg></div><h4>KV heads <small>KV₀ … KV${s.kv-1}</small></h4>
  <p class="lab-readout" data-group-info>悬停或聚焦一个头，查看它的共享组。</p>
  <div data-memory>${memoryPanel(s,a)}</div>`;
}
function memoryPanel(s,a){
  return `<p class="lab-readout"><strong>${s.q} 个 Query 头</strong>，每 ${a.groupSize} 个读取一组 KV。BF16 缓存为 <strong>${memory(a.bytes)}</strong>（同配置 MHA：${memory(a.mhaBytes)}）。</p>`;
}
function estimate(s){
  const a=kvCache(s.q,s.kv,s.t,s.l,s.head);
  return `<p class="lab-foot">单序列：2（K、V）× ${s.l} 层 × ${s.t} token × ${s.kv} 头 × ${s.head} 维 × 2 B = ${a.bytes.toLocaleString('en-US')} B。缓存压缩 ${a.groupSize}×；相同模型宽度下，K/V 投影参数量为 MHA 的 ${100*a.ratio}%。</p>`;
}
export function renderInitial(){
  const s=defaults();
  return `<header><h3>Query 头如何共享 KV？</h3><p>从 MHA 切到 GQA，沿连线观察哪些 Query 开始共用同一组 Key 和 Value。</p></header>
    <div class="lab-buttons">${models.map(([m,kv])=>`<button data-model="${kv}" aria-pressed="${s.kv===kv}">${m} · 8∶${kv}</button>`).join('')}</div>
    <div data-sharing>${sharing(s)}</div>
    <details class="lab-settings"><summary>显存估算与自定义头数</summary>
    <div class="lab-controls">${select('Query 头','q',[4,8,16,32],s.q)}${select('KV 头','kv',divisors(s.q),s.kv)}${select('层数 L','l',[1,8,16,24,32,48,64,80],s.l)}${select('头维度','head',[64,128],s.head)}
    <label class="lab-range">序列长度 T <input type="range" data-param="t" min="512" max="32768" value="${s.t}"><output data-tokens>${s.t}</output></label></div>
    <div data-estimate>${estimate(s)}</div></details>`;
}
export function mount(root){
  const s=defaults(),get=sel=>root.querySelector(sel);
  if(!get('[data-sharing]'))root.innerHTML=renderInitial();
  function update(topology){
    if(topology){
      get('[data-param="kv"]').innerHTML=options(divisors(s.q),s.kv);
      get('[data-param="q"]').value=s.q;
      for(const b of root.querySelectorAll('[data-model]'))b.setAttribute('aria-pressed',s.q===8&&+b.dataset.model===s.kv);
      get('[data-sharing]').innerHTML=sharing(s);
    }else get('[data-memory]').innerHTML=memoryPanel(s,kvCache(s.q,s.kv,s.t,s.l,s.head));
    get('[data-tokens]').textContent=s.t;
    get('[data-estimate]').innerHTML=estimate(s);
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-model]');if(!b)return;
    s.q=8;s.kv=Number(b.dataset.model);update(true);
  });
  root.addEventListener('input',e=>{
    const key=e.target.dataset.param;if(!key)return;
    s[key]=Number(e.target.value);
    if(key==='q')s.kv=Math.min(s.q,s.kv);
    update(key==='q'||key==='kv');
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
