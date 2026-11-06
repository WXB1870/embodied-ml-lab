'use strict';
// Shared by the browser and the static build. Parse math before Markdown so
// subscripts, brackets, asterisks and ampersands never become document markup.
(function(root){
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const delimiters=[['$$','$$',true],['\\(','\\)',false],['\\[','\\]',true],['$','$',false]];
 function escapedAt(text,index){let n=0;while(index>0&&text[--index]==='\\')n++;return n%2===1;}
 function tokens(value){
  const text=String(value??''),out=[];let start=0,i=0;
  function emit(type,end,body,display){if(i>start)out.push({type:'text',value:text.slice(start,i)});out.push({type,value:body,display});i=end;start=end;}
  while(i<text.length){
   if(text[i]==='`'&&!escapedAt(text,i)){
    const end=text.indexOf('`',i+1);
    if(end>i+1){emit('code',end+1,text.slice(i+1,end),false);continue;}
   }
   const delimiter=delimiters.find(([left])=>text.startsWith(left,i)&&!escapedAt(text,i));
   if(delimiter){
    const [left,right,display]=delimiter;let end=text.indexOf(right,i+left.length);
    while(end!==-1&&escapedAt(text,end))end=text.indexOf(right,end+right.length);
    if(end>i+left.length){emit('math',end+right.length,text.slice(i+left.length,end),display);continue;}
   }
   i++;
  }
  if(start<text.length)out.push({type:'text',value:text.slice(start)});
  return out;
 }
 function render(tex,display,katex){
  const source=String(tex).replace(/^\$\$([\s\S]*)\$\$$/,'$1');
  const markup=katex.renderToString(source,{throwOnError:true,strict:false,displayMode:display,output:'htmlAndMathml'});
  // Use spans so display math is valid even when embedded in a prose paragraph.
  // The scroll box is separate from the formula width: neither end is clipped.
  return display?'<span class="math-display" tabindex="0" role="group" aria-label="独立公式">'+markup+'</span>':'<span class="math-inline">'+markup+'</span>';
 }
 function decodeText(value){return value.replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/[\u2061\u2062]/g,'');}
 function mathText(mml){
  // Interpret the generated MathML structure. Merely stripping tags would turn
  // I/r into Ir, or x^2 into x2, changing the meaning of a search excerpt.
  const tree={tag:'root',children:[]},stack=[tree];
  const xml=mml.replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g,'');
  for(const token of xml.match(/<[^>]*>|[^<]+/g)||[]){
   if(token.startsWith('</')){stack.pop();continue;}
   if(token.startsWith('<')){
    const node={tag:token.match(/^<([\w-]+)/)?.[1]||'',children:[]};
    stack[stack.length-1].children.push(node);if(!token.endsWith('/>'))stack.push(node);
   }else stack[stack.length-1].children.push(decodeText(token));
  }
  const wrap=s=>/^[\p{L}\p{N}]+$/u.test(s)?s:'('+s+')';
  const script=(base,op,value)=>base+op+(/^[\p{L}\p{N}]$/u.test(value)?value:'{'+value+'}');
  function read(node){
   if(typeof node==='string')return node;
   const c=node.children.map(read),joined=c.join('');
   switch(node.tag){
    case 'mfrac':return wrap(c[0])+'/'+wrap(c[1]);
    case 'msqrt':return '√('+joined+')';
    case 'mroot':return 'root_'+wrap(c[1])+'('+c[0]+')';
    case 'msub':case 'munder':return script(c[0],'_',c[1]);
    case 'msup':return script(c[0],'^',c[1]);
    case 'msubsup':case 'munderover':return script(script(c[0],'_',c[1]),'^',c[2]);
    case 'mover':{
     const accents={'^':'hat','ˉ':'bar','¯':'bar','~':'tilde','˜':'tilde','˙':'dot','→':'vec'};
     return accents[c[1]]?accents[c[1]]+'('+c[0]+')':script(c[0],'^',c[1]);
    }
    case 'mtable':return c.join('; ');
    case 'mtr':return c.join(', ');
    case 'mspace':return ' ';
    default:return joined;
   }
  }
  return read(tree);
 }
 function searchText(value,katex){
  // Search snippets are plain text, so retain the mathematical symbols rather
  // than exposing TeX delimiters/macros after cutting a snippet mid-expression.
  return tokens(value).map(token=>{
   if(token.type!=='math')return token.value;
   const mml=katex.renderToString(token.value,{throwOnError:true,strict:false,output:'mathml'});
   return mathText(mml);
  }).join('');
 }
 const api={tokens,render,searchText,escape};
 root.EMLMath=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
