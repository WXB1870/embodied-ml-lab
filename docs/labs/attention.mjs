import {gaussianBank, compareAttention} from './attention-math.mjs';

const dimPresets=[[8,'低维基线'],[64,'常用头宽'],[512,'高维饱和']];
const defaults=()=>({dim:64,seed:7});
const options=(arr,value)=>arr.map(v=>`<option${v===value?' selected':''}>${v}</option>`).join('');
const format=v=>v!==0&&Math.abs(v)<0.001?v.toExponential(2):v.toFixed(3);
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
function summary(a,dim){
  const winner=a.raw.scores.indexOf(Math.max(...a.raw.scores))+1;
  const pct=v=>(100*v).toFixed(1)+'%';
  return `<p class="lab-readout">两种计算都把 <strong>K${winner}</strong> 排在首位。它的权重从 <strong>${pct(a.raw.peak)}</strong> 变为 <strong>${pct(a.scaled.peak)}</strong>。</p>
  <p class="lab-foot">8 个分数的样本方差：${format(a.raw.variance)} → ${format(a.scaled.variance)}。独立标准正态分量下，理论方差为 ${dim} → 1。</p>`;
}
function detail(a){
  return `<h4>点积分数</h4>${bars(a,'scores')}
    <table class="att-table"><thead><tr><th></th><th>原始</th><th>缩放</th></tr></thead><tbody>
    <tr><th scope="row">分布熵 · nat</th><td>${format(a.raw.entropy)}</td><td>${format(a.scaled.entropy)}</td></tr>
    <tr><th scope="row">最大 pⱼ(1−pⱼ)</th><td>${format(a.raw.gradient)}</td><td>${format(a.scaled.gradient)}</td></tr></tbody></table>
    <p class="lab-foot">pⱼ(1−pⱼ) 是权重对自身分数的局部导数。当一个权重逼近 1 时，各个对角项都趋近 0。</p>`;
}
export function renderInitial(){
  const s=defaults(),a=compareAttention(gaussianBank(s.seed),s.dim);
  return `<header><h3>点积缩放与 Softmax 饱和</h3><p>固定一组 Q、K。点积分数除以 √dₖ 后，排第一的 Key 和它分到的权重各有什么变化？</p></header>
  <div class="lab-buttons">${dimPresets.map(([v,label])=>`<button data-dim="${v}" aria-pressed="${s.dim===v}">${label} · ${v}</button>`).join('')}</div>
  <div class="lab-controls"><label class="lab-range">头维度 dₖ <input data-param="dim" type="range" min="4" max="512" value="${s.dim}" list="att-dims"><output data-dimension>${s.dim}</output></label><datalist id="att-dims">${options([8,32,64,128,256,512],0)}</datalist>
  <button data-resample>换一组随机向量</button></div>
  <div class="att-legend"><span>原始 QKᵀ</span><span>除以 √dₖ</span></div>
  <h4>Softmax 权重</h4><div class="att-chart" data-probabilities>${bars(a,'probabilities')}</div>
  <div data-summary>${summary(a,s.dim)}</div>
  <details class="lab-settings"><summary>点积分数、熵与局部梯度</summary><div class="att-detail" data-detail>${detail(a)}</div></details>`;
}
export function mount(root){
  const s=defaults(),get=sel=>root.querySelector(sel);
  let bank=gaussianBank(s.seed);
  if(!get('[data-probabilities]'))root.innerHTML=renderInitial();
  function update(){
    const a=compareAttention(bank,s.dim);
    get('[data-dimension]').textContent=s.dim;get('[data-param="dim"]').value=s.dim;
    for(const b of root.querySelectorAll('[data-dim]'))b.setAttribute('aria-pressed',+b.dataset.dim===s.dim);
    get('[data-probabilities]').innerHTML=bars(a,'probabilities');
    get('[data-summary]').innerHTML=summary(a,s.dim);get('[data-detail]').innerHTML=detail(a);
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-dim'))s.dim=Number(b.dataset.dim);
    else if(b.hasAttribute('data-resample'))bank=gaussianBank(++s.seed);
    else return;
    update();
  });
  root.addEventListener('input',e=>{
    if(e.target.dataset.param==='dim'){s.dim=Number(e.target.value);update();}
  });
}
