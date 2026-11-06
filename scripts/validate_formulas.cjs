'use strict';
const fs=require('fs');
const path=require('path');
const katex=require('../dist/vendor/katex/katex.min.js');
const math=require('../dist/math.js');
const root=path.resolve(__dirname,'..');
let checked=0;const errors=[],unique=new Set(),unmarkedCandidates=[];
const skipped=new Set(['source','starter','solution','tests','code','searchText']);
function check(formula,where){
  try{math.render(formula,true,katex);checked++;unique.add(formula);}
  catch(error){errors.push({where,error:error.message});}
}
function walk(value,where,key){
  if(skipped.has(key)&&!(key==='code'&&value&&typeof value==='object'))return;
  if(typeof value==='string'){
    if(key==='formula'){check(value,where);return;}
    for(const token of math.tokens(value)){
      if(token.type==='math'){check(token.value,where);continue;}
      if(token.type==='code')continue;
      // A successful KaTeX parse cannot find math that was never marked as math.
      // Reject leaked TeX/delimiters; report ambiguous Unicode/identifiers for review.
      const outside=token.value.replace(/\[[^\]]*\]\((?:https:\/\/|#\/|\/)[^\s)]*\)/g,'');
      if(/\\(?:frac|dfrac|sqrt|mathbb|mathcal|nabla|partial|begin|end|sum|prod|alpha|sigma|theta)\b|\\[()[\]]/.test(outside))errors.push({where,error:'Unmarked TeX or unmatched math delimiter',text:outside});
      if(/[ᵀ²³ᵢⱼℝ∑Σ∂∇√]|(?<![A-Za-z])[A-Za-z]{1,2}_\{/.test(outside))unmarkedCandidates.push({where,text:outside});
    }
  }else if(Array.isArray(value)){value.forEach((v,i)=>walk(v,where+'['+i+']',key));}
  else if(value&&typeof value==='object'){for(const [k,v] of Object.entries(value))walk(v,where+'.'+k,k);}
}
for(const name of ['lessons','topics'])walk(JSON.parse(fs.readFileSync(path.join(root,'dist/data',name+'.json'),'utf8')),name,'');
const report={formulasChecked:checked,uniqueFormulas:unique.size,errors,unmarkedCandidates};
fs.writeFileSync(path.join(root,'reports/formula-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({formulasChecked:checked,uniqueFormulas:unique.size,errors,unmarkedCandidates:unmarkedCandidates.length},null,2));
if(errors.length)process.exitCode=1;
