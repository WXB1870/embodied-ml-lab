'use strict';
const DeepFlow={
 variance(t,sigma){return (1-t)*(1-t)+t*t*sigma*sigma;},
 exact(t,z,mean,sigma){return t*mean+Math.sqrt(this.variance(t,sigma))*z;},
 velocity(t,x,mean,sigma){const q=this.variance(t,sigma);return mean+(-(1-t)+t*sigma*sigma)/q*(x-t*mean);},
 integrate(z,mean,sigma,steps,method){
  const dt=1/steps,path=[{t:0,x:z}];let x=z;
  for(let i=0;i<steps;i++){const t=i*dt,v=this.velocity(t,x,mean,sigma);x+=method==='heun'?dt*(v+this.velocity(t+dt,x+dt*v,mean,sigma))/2:dt*v;path.push({t:(i+1)*dt,x});}
  return path;
 }
};
P0_VISUALS.push({id:'flow-ode',title:'Flow Matching：速度场与 ODE 积分',explorer:'flow-ode',lessons:['flow-matching'],question:'直线条件路径产生的边际速度场，为什么仍可能对应弯曲的生成轨迹？积分步数怎样影响结果？'});
const beforeDeepExplorer=emlExplorer,beforeDeepInit=initExplorers;
emlExplorer=function(id){
 if(id!=='flow-ode')return beforeDeepExplorer(id);
 return '<section class="explorer" data-explorer="flow-ode">'+p0Heading('速度场的数值积分与步长误差','使用已知的一维高斯边际速度场隔离数值积分误差：噪声 N(0,1)，目标 N(μ,σ²)，t=0 → 1。本演示不训练神经网络，也不把条件训练直线当作最终生成轨迹。')+'<div class="experiment-controls"><label for="deep-ode-method">积分器 <select id="deep-ode-method"><option value="euler">Euler</option><option value="heun">Heun</option></select></label><label for="deep-ode-steps">步数 <input id="deep-ode-steps" type="range" min="1" max="64" value="4"><output id="deep-ode-steps-value">4</output></label><label for="deep-ode-mean">目标均值 μ <input id="deep-ode-mean" type="range" min="-2" max="3" step=".1" value="2"><output id="deep-ode-mean-value">2.0</output></label><label for="deep-ode-sigma">目标标准差 σ <input id="deep-ode-sigma" type="range" min=".3" max="1.5" step=".05" value=".7"><output id="deep-ode-sigma-value">0.70</output></label></div><div class="ode-plot-wrap"><svg class="ode-plot" id="deep-ode-plot" viewBox="0 0 720 340" role="img" aria-label="解析流轨迹与数值积分轨迹比较"></svg></div><div class="ode-legend"><span>实线与圆点：数值积分</span><span>灰色虚线：相同初值的解析流轨迹</span></div><div class="ode-result" id="deep-ode-result" aria-live="polite"></div><div class="calc-equation">q(t) = (1−t)² + t²σ²<br>u(t,x) = μ + [−(1−t)+tσ²] / q(t) · (x−tμ)<br>解析轨迹 x(t) = tμ + √q(t) · z，初值 z ∈ {−1.5, 0, 1.5}</div><p class="experiment-explanation">训练配对中的 x₀、x₁ 独立采样，条件直线速度为 x₁−x₀；在给定 xₜ 后取条件期望，得到这里的边际场。图中横轴是时间，纵轴是样本值；弯曲表示速度随时间变化。解析场的误差这里只来自求解器，真实模型还包含速度预测误差。</p><a class="text-link" href="#/topics/flow-matching?tab=guide">阅读条件期望与 ODE 的完整推导 →</a></section>';
};
function drawDeepFlow(){
 const steps=Number(document.getElementById('deep-ode-steps').value),mean=Number(document.getElementById('deep-ode-mean').value),sigma=Number(document.getElementById('deep-ode-sigma').value),method=document.getElementById('deep-ode-method').value;
 document.getElementById('deep-ode-steps-value').textContent=steps;document.getElementById('deep-ode-mean-value').textContent=mean.toFixed(1);document.getElementById('deep-ode-sigma-value').textContent=sigma.toFixed(2);
 const starts=[-1.5,0,1.5],numerical=starts.map(z=>DeepFlow.integrate(z,mean,sigma,steps,method)),exact=starts.map(z=>Array.from({length:101},(_,i)=>({t:i/100,x:DeepFlow.exact(i/100,z,mean,sigma)})));
 const values=[...numerical.flat(),...exact.flat()].map(p=>p.x),low=Math.floor(Math.min(...values)-.3),high=Math.ceil(Math.max(...values)+.3),px=t=>52+620*t,py=x=>286-(x-low)/(high-low)*250;
 let svg='';for(let i=0;i<=4;i++){const t=i/4,x=px(t);svg+='<line x1="'+x+'" y1="30" x2="'+x+'" y2="286" stroke="#edf1f7"/><text x="'+x+'" y="310" text-anchor="middle" font-size="12" fill="#8996a9">'+t.toFixed(2)+'</text>';}
 for(let i=0;i<=4;i++){const x=low+(high-low)*i/4,y=py(x);svg+='<line x1="52" y1="'+y+'" x2="672" y2="'+y+'" stroke="#edf1f7"/><text x="42" y="'+(y+4)+'" text-anchor="end" font-size="12" fill="#8996a9">'+x.toFixed(1)+'</text>';}
 const points=path=>path.map(p=>px(p.t).toFixed(2)+','+py(p.x).toFixed(2)).join(' '),colors=['#779ccf','#315fba','#479999'];
 exact.forEach(path=>{svg+='<polyline points="'+points(path)+'" fill="none" stroke="#a8b4c6" stroke-width="2" stroke-dasharray="5 5"/>';});
 numerical.forEach((path,i)=>{svg+='<polyline points="'+points(path)+'" fill="none" stroke="'+colors[i]+'" stroke-width="2.4"/>';path.forEach(p=>{svg+='<circle cx="'+px(p.t)+'" cy="'+py(p.x)+'" r="'+(steps>32?1.7:3)+'" fill="'+colors[i]+'"/>';});});
 svg+='<text x="363" y="334" text-anchor="middle" font-size="12" fill="#677b98">时间 t：噪声 → 数据</text><text x="15" y="19" font-size="12" fill="#677b98">样本 x(t)</text>';
 document.getElementById('deep-ode-plot').innerHTML=svg;
 const error=Math.max(...numerical.map((path,i)=>Math.abs(path[path.length-1].x-DeepFlow.exact(1,starts[i],mean,sigma))));
 document.getElementById('deep-ode-result').textContent=method.toUpperCase()+' · '+steps+' 步 · '+(method==='heun'?2*steps:steps)+' 次速度求值 · 三条轨迹的最大终点误差 '+error.toFixed(6);
}
initExplorers=function(){beforeDeepInit();if(document.getElementById('deep-ode-plot')){['deep-ode-method','deep-ode-steps','deep-ode-mean','deep-ode-sigma'].forEach(id=>document.getElementById(id).addEventListener('input',drawDeepFlow));drawDeepFlow();}};
