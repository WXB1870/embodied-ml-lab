import {layerGeometry, computeReceptiveField} from './cnn-math.mjs';

const layer = (s=1,p=1,d=1)=>({k:3,s,p,d});
const presets = [
  ['普通 3×3 堆叠', [layer(),layer(),layer()], '对中央输出，7×7 理论框的中心有 49 条路径，四角各只有 1 条。'],
  ['固定空洞率 2、2、2', [layer(1,2,2),layer(1,2,2),layer(1,2,2)], '每层都跨两格取样。试着切换到 1、2、3：理论框一样大，斜纹会怎样变化？'],
  ['混合空洞率 1、2、3', [layer(),layer(1,2,2),layer(1,3,3)], '依次使用 d = 1、2、3，相邻层能补上采样间隙，中央输出的 13×13 理论框被完整覆盖。'],
  ['Stride=2 边界截断', [layer(2),layer(2)], '左上输出的理论框延伸到填充区。移到中央输出，比较输入域内的面积和路径分布。']
];
const values={k:[1,3,5,7],s:[1,2],p:[0,1,2,3],d:[1,2,3]};
const pct=v=>(100*v).toFixed(1)+'%';
const options=(choices,value)=>choices.map(v=>'<option'+(v===value?' selected':'')+'>'+v+'</option>').join('');
function initial() {return {layers:presets[1][1].map(l=>({...l})), n:21, selected:1, y:10,x:10, locked:false};}
function parameters(state) {
  return state.layers.map((l,i)=>`<div class="cnn-layer"><span>第 ${i+1} 层</span>${Object.entries(values).map(([key,choices])=>
    `<label>${key}<select data-layer="${i}" data-key="${key}" aria-label="第 ${i+1} 层 ${key}">${options(choices,l[key])}</select></label>`).join('')}</div>`).join('');
}
function gridDefs(id) {
  return `<defs><pattern id="${id}-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 1V0H1" fill="none" stroke="var(--line)" stroke-width=".065"/></pattern></defs>`;
}
function heat(r,n) {
  const {x0,y0,x1,y1}=r.trfBox;
  const paths=new Map();
  for(let y=Math.max(0,y0);y<=Math.min(n-1,y1);y++) for(let x=Math.max(0,x0);x<=Math.min(n-1,x1);x++) {
    const count=r.pathGrid[y][x];
    paths.set(count,(paths.get(count)||'')+`M${x} ${y}h1v1h-1z`);
  }
  return `<rect width="${n}" height="${n}" fill="white"/>`+Array.from(paths,([count,path])=>
    count ? `<path d="${path}" fill="var(--blue)" fill-opacity="${count/r.maxPath}"/>` :
    `<path d="${path}" fill="url(#cnn-hatch)"/>`).join('')+
    `<rect width="${n}" height="${n}" fill="url(#cnn-input-grid)"/><rect x="${Math.max(0,x0)}" y="${Math.max(0,y0)}" width="${Math.max(0,Math.min(n,x1+1)-Math.max(0,x0))}" height="${Math.max(0,Math.min(n,y1+1)-Math.max(0,y0))}" fill="none" stroke="var(--ink)" stroke-width=".13" stroke-dasharray=".37 .2"/>`;
}
function metrics(rows) {
  return rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}
function stats(r) {
  return metrics([
    ['理论跨度',r.span+'×'+r.span],
    ['可达像素 / 框内真实像素',r.reachable+' / '+r.inBoundsArea+' · '+(r.inBoundsArea?pct(r.coverage):'—')]
  ]);
}
function pathDetails(r) {
  return metrics([
    ['总步长',r.jump],
    ['域内 / 理论面积',r.inBoundsArea+' / '+r.area],
    ['几何中心 / 边缘最小非零',(r.centerPath??'—')+' / '+(r.edgeMin??'—')],
    ['峰值 / 最小非零',r.total?r.maxPath+' / '+r.minPath:'—'],
    ['90% 核心 / 域内',r.total?r.corePixels+' / '+r.inBoundsArea+' · '+pct(r.coreFraction):'—'],
    ['总路径数',r.total.toLocaleString('en-US')]
  ]);
}
function grids(state,r) {
  const n=state.n,out=r.sizes.at(-1);
  return `<div class="cnn-grids">
    <div><h4>输入 <small>路径权重 / 峰值</small></h4><svg data-input viewBox="0 0 ${n} ${n}" tabindex="0" role="img" aria-label="输入路径热力图，方向键探查像素">
    ${gridDefs('cnn-input')}<defs><pattern id="cnn-hatch" width=".4" height=".4" patternUnits="userSpaceOnUse"><path d="M-.1 .1l.2-.2M0 .4l.4-.4M.3 .5l.2-.2" stroke="#718497" stroke-width=".065"/></pattern></defs>
    <g data-heat>${heat(r,n)}</g><rect data-probe visibility="hidden" width="1" height="1" fill="none" stroke="var(--ink)" stroke-width=".13"/></svg></div>
    <div><h4>输出 <small data-target>目标 (${state.y}, ${state.x})</small></h4><svg data-output viewBox="0 0 ${out} ${out}" tabindex="0" role="img" aria-label="输出特征图，方向键移动，回车锁定或解锁">
    ${gridDefs('cnn-output')}<rect width="${out}" height="${out}" fill="url(#cnn-output-grid)"/><rect data-marker x="${state.x}" y="${state.y}" width="1" height="1" fill="var(--blue)"/></svg></div></div>
    <div class="cnn-legend"><span>虚线 · 理论框在输入域内的边界</span><span>斜纹 · 域内零路径</span><span>颜色深度 · 相对路径数</span></div>
    <p class="lab-readout" data-inspect>悬停输入查看权重，在输出上点击锁定，再点一次解锁。</p>
    <dl class="lab-metrics" data-stats>${stats(r)}</dl>
    <details class="lab-settings" data-path-details><summary>路径统计与空间尺寸</summary><div class="lab-flow">空间尺寸 <strong>${r.sizes.map(v=>v+'×'+v).join(' → ')}</strong></div>
    <dl class="lab-metrics" data-counts>${pathDetails(r)}</dl><p class="lab-foot">90% 核心是累积达到总路径数 90% 所需的最少像素，占比以理论框内的真实输入像素为分母。</p></details>`;
}
function layout(state,r) {
  return `<header><h3>理论框里，哪些像素能影响输出？</h3><p>这里固定卷积核权重为 1，省去激活函数，因此输入梯度恰好等于路径数。训练后的 CNN 还受权重与激活状态影响。</p></header>
    <div class="lab-buttons">${presets.map(([name],i)=>`<button data-preset="${i}" aria-pressed="${i===state.selected}">${name}</button>`).join('')}</div>
    <p class="lab-note" data-note>${presets[state.selected][2]}</p>
    <details class="lab-settings"><summary>卷积参数</summary><div class="lab-controls">
    <label>输入尺寸 <select data-size>${[15,21].map(n=>`<option value="${n}"${n===state.n?' selected':''}>${n}×${n}</option>`).join('')}</select></label>
    <button data-remove>减一层</button><button data-add>加一层</button></div><div data-layers>${parameters(state)}</div></details>
    <div data-view>${grids(state,r)}</div>`;
}
export function renderInitial() {
  const state=initial();
  return layout(state,computeReceptiveField(state.layers,state.n,state.y,state.x));
}
export function mount(root) {
  const state=initial(), get=sel=>root.querySelector(sel);
  if (!get('[data-view]')) root.innerHTML=renderInitial();
  let result=computeReceptiveField(state.layers,state.n,state.y,state.x), probe=null;
  function inspect(y,x) {
    probe=[y,x];
    const count=result.pathGrid[y][x], mark=get('[data-probe]');
    mark.setAttribute('x',x);mark.setAttribute('y',y);mark.setAttribute('visibility','visible');
    get('[data-inspect]').textContent=`输入 (${y}, ${x}) · ${count} 条路径 · 占总权重 ${result.total?pct(count/result.total):'—'}`;
  }
  function select(y,x,force=false) {
    if (!force && y===state.y && x===state.x) return;
    state.y=y;state.x=x;
    result=computeReceptiveField(state.layers,state.n,y,x);
    get('[data-heat]').innerHTML=heat(result,state.n);
    get('[data-marker]').setAttribute('x',x);get('[data-marker]').setAttribute('y',y);
    get('[data-target]').textContent=(state.locked?'已锁定':'目标')+` (${y}, ${x})`;
    get('[data-stats]').innerHTML=stats(result);
    get('[data-counts]').innerHTML=pathDetails(result);
    if(probe) inspect(...probe);
  }
  function configure(recenter) {
    state.locked=false;probe=null;
    const g=layerGeometry(state.layers,state.n);
    get('[data-layers]').innerHTML=parameters(state);
    get('[data-add]').disabled=state.layers.length===4;
    get('[data-remove]').disabled=state.layers.length===1;
    for(const b of root.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed',Number(b.dataset.preset)===state.selected);
    get('[data-note]').textContent=state.selected<0?'自定义卷积：改变输出位置，比较理论框与可达像素。':presets[state.selected][2];
    if(g.error) {result=null;get('[data-view]').innerHTML=`<p class="lab-error" role="status">${g.error}</p>`;return;}
    const out=g.sizes.at(-1), start=state.selected===3?0:Math.floor(out/2);
    state.y=recenter?start:Math.min(state.y,out-1);state.x=recenter?start:Math.min(state.x,out-1);
    result=computeReceptiveField(state.layers,state.n,state.y,state.x);
    const expanded=get('[data-path-details]')?.open;
    get('[data-view]').innerHTML=grids(state,result);
    if(expanded)get('[data-path-details]').open=true;
  }
  function pixel(svg,e) {
    const n=svg.viewBox.baseVal.width, rect=svg.getBoundingClientRect();
    const cell=(v,offset,size)=>Math.max(0,Math.min(n-1,Math.floor((v-offset)*n/size)));
    return [cell(e.clientY,rect.top,rect.height),cell(e.clientX,rect.left,rect.width)];
  }
  root.addEventListener('pointermove',e=>{
    const svg=e.target.closest('svg');
    if(!svg || !result)return;
    if(svg.hasAttribute('data-input')) {
      const [y,x]=pixel(svg,e); if(!probe||probe[0]!==y||probe[1]!==x)inspect(y,x);
    } else if(!state.locked)select(...pixel(svg,e));
  });
  root.addEventListener('click',e=>{
    const b=e.target.closest('button'), output=e.target.closest('[data-output]');
    if(output) {
      const [y,x]=pixel(output,e);
      state.locked=!(state.locked && y===state.y && x===state.x);select(y,x,true);
    } else if(b?.hasAttribute('data-preset')) {
      state.selected=Number(b.dataset.preset);state.layers=presets[state.selected][1].map(l=>({...l}));configure(true);
    } else if(b?.hasAttribute('data-add')||b?.hasAttribute('data-remove')) {
      if(b.hasAttribute('data-add'))state.layers.push(layer());else state.layers.pop();
      state.selected=-1;configure(false);
    }
  });
  root.addEventListener('change',e=>{
    const el=e.target;
    if(el.hasAttribute('data-size'))state.n=Number(el.value);
    else if(el.hasAttribute('data-layer')){state.layers[Number(el.dataset.layer)][el.dataset.key]=Number(el.value);state.selected=-1;}
    else return;
    const focus=el.hasAttribute('data-layer')?`[data-layer="${el.dataset.layer}"][data-key="${el.dataset.key}"]`:null;
    configure(el.hasAttribute('data-size'));if(focus)get(focus).focus();
  });
  root.addEventListener('keydown',e=>{
    if(!e.target.matches('[data-input],[data-output]')||!result)return;
    const input=e.target.hasAttribute('data-input');
    if(!input && ['Enter',' '].includes(e.key)){e.preventDefault();state.locked=!state.locked;select(state.y,state.x,true);return;}
    const dirs={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    if(!dirs[e.key])return;
    e.preventDefault();const from=input?(probe||[0,0]):[state.y,state.x], n=input?state.n:result.sizes.at(-1);
    const [y,x]=from.map((v,i)=>Math.max(0,Math.min(n-1,v+dirs[e.key][i])));
    if(input)inspect(y,x);else select(y,x);
  });
}
