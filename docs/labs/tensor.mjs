import {alignTensors,sourceIndices} from './tensor-math.mjs';

const presets = [
  {label:'按特征加权',a:'(2,3,2)',b:'(2)',note:'B 和 D 都等于 2。沿样本轴（轴 -3）移动探针，观察权重 W 的下标是否变化。'},
  {label:'按样本加权',a:'(2,3,2)',b:'(2,1,1)',note:'同样两个权重，给 W 补上两个长度为 1 的轴。再沿样本轴移动探针。'},
  {label:'两侧各扩一轴',a:'(B,1,D)',b:'(1,T,D)',note:'沿时间轴（轴 -2）移动，只有 W 改变下标。沿样本轴（轴 -3）移动，只有 A 改变下标。'},
  {label:'注意力点积',a:'(B,H,Q,D)',b:'(B,H,K,D)',eq:'bhqd,bhkd->bhqk',note:'令 A 为 Query，W 为 Key。固定一个 q、k 位置，沿 d 移动探针即可查看构成这一个点积的各项。'}
];
const fmt = n => n.toLocaleString('en-US');
const tuple = xs => '('+xs.join(', ')+')';
const exampleCoords = model => new Map(model.axes.map((axis,i) => [axis,i===0 && model.sizes.get(axis)>1 ? 1 : 0]));
const axisName = axis => axis.startsWith('-') ? '轴 '+axis : axis;

function figure(model,coords,contract) {
  const width = Math.max(234,52+model.axes.length*96);
  const sources = sourceIndices(model,coords);
  const rows = ['A','W','输出'];
  let picture = '<defs><pattern id="tensor-repeat" width="5" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L5 0" stroke="currentColor" stroke-width="1"/></pattern></defs>' + rows.map((label,i)=>'<text x="4" y="'+(51+i*34)+'">'+label+'</text>').join('');
  for (const [i,axis] of model.axes.entries()) {
    const x=52+i*96, n=model.sizes.get(axis), index=coords.get(axis), reduced=model.reduced.includes(axis);
    picture += '<g data-axis="'+axis+'"><text x="'+(x+41)+'" y="15" text-anchor="middle">'+axisName(axis)+(reduced?' · Σ':'')+'</text>';
    for(let row=0;row<3;row++){
      const y=26+row*34, labels=row===2?model.output:model.inputs[row];
      const pos=labels.indexOf(axis), missing=pos===-1;
      if(row===2 && missing){
        picture += '<text x="'+(x+41)+'" y="'+(y+23)+'" class="tensor-reduced" text-anchor="middle">求和</text>';
        continue;
      }
      const dim=row===2?n:missing?1:model.shapes[row][pos];
      const repeat=dim===1 && n>1;
      const current=row===2?index:missing?0:sources[row][pos];
      // The track is the full logical axis; a singleton always reads its first address.
      const scale=82/n,mark=Math.min(82,Math.max(2,scale));
      const offset=Math.min(82-mark,current*scale);
      picture += '<rect class="axis-track" x="'+x+'" y="'+y+'" width="82" height="6"/>'+
        (repeat?'<rect x="'+x+'" y="'+y+'" width="82" height="6" fill="url(#tensor-repeat)"/>':'')+
        '<rect data-marker-axis="'+axis+'" data-base="'+x+'" data-fixed="'+(dim===1)+'" class="'+(repeat?'axis-repeat':'axis-index')+'" x="'+(x+offset)+'" y="'+y+'" width="'+mark+'" height="6"/>'+
        '<text x="'+(x+41)+'" y="'+(y+23)+'" text-anchor="middle">'+(missing?(contract?'共享':'补 1'):String(dim))+(repeat?' → '+n:'')+'</text>';
    }
    picture += '<rect data-axis-track="'+axis+'" x="'+x+'" y="17" width="82" height="109" fill="transparent"/></g>';
  }
  return '<div class="head-scroll"><svg data-axis-grid viewBox="0 0 '+width+' 130" style="min-width:'+width+'px" role="img" aria-label="输入与输出的轴对齐，横条上的色块标记当前读取位置">'+picture+'</svg></div>';
}
function probeText(model,coords) {
  const [a,b]=sourceIndices(model,coords), output=model.output.map(axis=>coords.get(axis));
  const term='A['+a.join(',')+'] × W['+b.join(',')+']';
  return 'Y['+output.join(',')+']'+(model.terms>1n?' 的一项为 ':' = ')+term;
}
function metrics(model,contract) {
  const base = '输出 '+tuple(model.outputShape)+' · '+fmt(model.outputCount)+' 个元素';
  if(contract) return base+'。每个输出累加 '+fmt(model.terms)+' 项，FP32 输出占 '+fmt(4n*model.outputCount)+' B。';
  return base+'。A、W 的逻辑元素数分别扩大到原来的 '+fmt(model.outputCount/model.inputCounts[0])+'×、'+fmt(model.outputCount/model.inputCounts[1])+'×。';
}
function controls(model,coords) {
  return model.axes.filter(axis=>model.sizes.get(axis)>1).map(axis=>
    '<label>'+axisName(axis)+(model.reduced.includes(axis)?' 求和':'')+' <input type="range" data-index="'+axis+'" min="0" max="'+(model.sizes.get(axis)-1)+'" value="'+coords.get(axis)+'"><output>'+coords.get(axis)+'</output></label>'
  ).join('');
}
function memory(model,contract) {
  if(contract) return '按 FP32、连续稠密输入估算。两个输入分别占 '+fmt(model.inputCounts[0]*4n)+' B 与 '+fmt(model.inputCounts[1]*4n)+' B。输出与两输入合计的存储比为 '+fmt(model.outputCount)+' / '+fmt(model.inputCounts[0]+model.inputCounts[1])+'。运行时临时内存取决于实现。';
  return '按 FP32 计算。expand 视图复用原存储，两个输入的新增元素存储均为 0 B。将逐元素乘积写入新的稠密输出需要 '+fmt(model.outputCount*4n)+' B。';
}
function section(model,coords,contract) {
  return '<div data-figure>'+figure(model,coords,contract)+'</div><p class="lab-flow">'+metrics(model,contract)+'</p>'+
    '<div class="lab-controls tensor-probes">'+controls(model,coords)+'</div><p class="lab-readout" data-probe>'+probeText(model,coords)+'</p>'+
    '<details class="lab-settings"><summary>存储如何计算</summary><p>'+memory(model,contract)+'</p></details>';
}
export function renderInitial() {
  const p=presets[0], model=alignTensors(p.a,p.b);
  return '<h3>沿一条轴移动，追踪两个输入的下标</h3><div class="lab-buttons">'+presets.map((p,i)=>
    '<button type="button" data-preset="'+i+'" aria-pressed="'+(i===0)+'">'+p.label+'</button>').join('')+'</div>'+
    '<p class="lab-note" data-note>'+p.note+'</p>'+
    '<div class="lab-controls tensor-fields"><label>运算 <select data-mode><option value="broadcast">广播乘法</option><option value="einsum">einsum</option></select></label>'+
    '<label>A 形状 <input data-a maxlength="48" value="'+p.a+'" spellcheck="false"></label><label>第二输入形状 <input data-b maxlength="48" value="'+p.b+'" spellcheck="false"></label>'+
    '<label data-equation-field hidden>einsum <input data-equation maxlength="40" value="bhqd,bhkd->bhqk" spellcheck="false"></label></div>'+
    '<details class="lab-settings"><summary>形状与下标的写法</summary><p>可用整数或 B=2、T=3、D=4、H=2、Q=3、K=5。广播按负轴号从右对齐。einsum 接受两个操作数与显式输出，相同字母对齐，右侧省略的字母求和。</p></details>'+
    '<div data-result>'+section(model,exampleCoords(model),false)+'</div>';
}
export function mount(root) {
  if (!root.querySelector('[data-mode]')) root.innerHTML=renderInitial();
  const el = key => root.querySelector('[data-'+key+']');
  let model,coords,contract=false;
  function update() {
    contract=el('mode').value==='einsum';
    el('equation-field').hidden=!contract;
    try {
      model=alignTensors(el('a').value,el('b').value,contract?el('equation').value:null);
      coords=exampleCoords(model);
      el('result').innerHTML=section(model,coords,contract);
    } catch(error) {
      model=null;
      const message=document.createElement('p');
      message.className='lab-error'; message.setAttribute('role','status');message.textContent=error.message;
      el('result').replaceChildren(message);
    }
  }
  function point(axis,value) {
    if(!model || coords.get(axis)===value)return;
    coords.set(axis,value);
    const slider=root.querySelector('[data-index="'+axis+'"]');
    if(slider){slider.value=value;slider.nextElementSibling.textContent=value;}
    const n=model.sizes.get(axis);
    for(const marker of root.querySelectorAll('[data-marker-axis="'+axis+'"][data-fixed="false"]')){
      const width=Number(marker.getAttribute('width'));
      marker.setAttribute('x',Number(marker.dataset.base)+Math.min(82-width,82*value/n));
    }
    el('probe').textContent=probeText(model,coords);
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-preset]');
    if(!button)return;
    const p=presets[Number(button.dataset.preset)];
    el('a').value=p.a;el('b').value=p.b;el('mode').value=p.eq?'einsum':'broadcast';
    if(p.eq)el('equation').value=p.eq;
    el('note').hidden=false;el('note').textContent=p.note;
    root.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    update();
  });
  root.addEventListener('input',event=>{
    const input=event.target;
    if(input.hasAttribute('data-index')){point(input.dataset.index,Number(input.value));return;}
    if(!input.matches('[data-a],[data-b],[data-mode],[data-equation]'))return;
    el('note').hidden=true;
    root.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));
    update();
  });
  root.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    const track=event.target.closest('[data-axis-track]');
    if(!track || !model)return;
    const axis=track.dataset.axisTrack, n=model.sizes.get(axis), rect=track.getBoundingClientRect();
    point(axis,Math.max(0,Math.min(n-1,Math.floor((event.clientX-rect.left)/rect.width*n))));
  });
  update();
}
