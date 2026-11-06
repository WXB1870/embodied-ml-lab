'use strict';
// Regression cases for the actual shared prose renderer, not just TeX syntax.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const katex=require('../dist/vendor/katex/katex.min.js'),math=require('../dist/math.js');
const context={console,katex,EMLMath:math,URL,URLSearchParams,
 location:{origin:'https://embodied-ml-lab.noisynarwhal1.chatgpt.site',pathname:'/',search:'',hash:''},
 localStorage:{getItem:()=>null,setItem:()=>{}},document:{addEventListener:()=>{}}};
context.window=context;vm.createContext(context);
const app=fs.readFileSync(path.join(dist,'app.js'),'utf8');
vm.runInContext(app.slice(0,app.indexOf("document.addEventListener('click'")),context);
vm.runInContext(fs.readFileSync(path.join(dist,'reader.js'),'utf8'),context);
const inline=text=>vm.runInContext(`inline(${JSON.stringify(text)})`,context);
const records=[];
function test(name,fn){fn();records.push({name,passed:true});}
function countMath(html){return (html.match(/class="katex"/g)||[]).length;}
test('Inline fraction, subscript and superscript survive prose formatting',()=>{
 const tex=String.raw`J_N=\frac{P}{r}-\frac{cc^\top}{Dr^3}`;
 assert.equal(inline(String.raw`\(${tex}\)`),math.render(tex,false,katex));
});
test('Chinese punctuation stays attached to the preceding inline formula',()=>{
 assert.ok(inline(String.raw`\(z=\frac{c}{r}\)。下一句`).includes('</span>&#8288;。'));
});
test('Matrix alignment and escaped HTML have identical static/client markup',()=>{
 const tex=String.raw`A=\begin{bmatrix}1&k\\0&1\end{bmatrix},\quad k<1`;
 assert.equal(inline(String.raw`\[${tex}\]`),math.render(tex,true,katex));
});
test('Mathematical brackets cannot become Markdown links',()=>{
 const html=inline(String.raw`\(f(x)=[a+b](x-c),\quad\text{[x](/learn/tensor/)}\)`);
 assert.equal(countMath(html),1);assert.ok(!html.includes('<a '));
});
test('Math asterisks cannot become bold markup',()=>{
 const html=inline(String.raw`\(a**b+c**d\)`);
 assert.equal(countMath(html),1);assert.ok(!html.includes('<strong>'));
});
test('Inline code retains math delimiters and Python subscripts literally',()=>{
 assert.equal(inline('`x_t = "\\(a_b\\)"`'),'<code>x_t = &quot;\\(a_b\\)&quot;</code>');
});
test('All four authored delimiters use one rendering path',()=>{
 assert.equal(countMath(inline(String.raw`\(x_i\) / $y_j$ / \[A^\top\] / $$\sum_k z_k$$`)),4);
});
test('Prose emphasis and internal links remain usable around math',()=>{
 const html=inline(String.raw`**条件**：\(x>0\)，见 [概率](#/learn/probability)。`);
 assert.ok(html.includes('<strong>条件</strong>'));
 assert.ok(html.includes('href="/learn/probability/?tab=theory"'));assert.equal(countMath(html),1);
});
test('Link labels can contain math without leaking an internal placeholder',()=>{
 const html=inline(String.raw`[\(x_i\)](/learn/tensor/)`);
 assert.equal(countMath(html),1);assert.ok(html.startsWith('<a href="/learn/tensor/?tab=theory">'));assert.ok(!html.includes('\u0000'));
});
test('Link labels preserve inline code and keep its HTML escaped',()=>{
 const html=inline('[`x_t<2`](/learn/tensor/)');
 assert.equal(html,'<a href="/learn/tensor/?tab=theory"><code>x_t&lt;2</code></a>');
});
test('Code and math are never recursively interpreted',()=>{
 const html=inline(String.raw`\(\texttt{code}\) 与 \(\text{a\&b}\)`);
 assert.equal(countMath(html),2);assert.ok(!html.includes('&amp;amp;'));
});
test('A malformed expression fails the build rather than silently showing red TeX',()=>{
 assert.throws(()=>inline(String.raw`\(\frac{1}\)`));
});
test('Shape notation renders math while tensor layouts retain code styling',()=>{
 const shape=value=>vm.runInContext(`shapeMarkup(${JSON.stringify(value)})`,context);
 assert.equal(shape('[B,T,D]'),'<code>[B,T,D]</code>');
 assert.equal(countMath(shape(String.raw`\(\lVert\Delta\theta\rVert_2\)`)),1);
});
test('Search snippets retain Greek symbols without exposing TeX source',()=>{
 const text=math.searchText(String.raw`缩放 \(\alpha_t\)，条件 \(x<1\)，代码 `+'`x_t`',katex);
 assert.ok(text.includes('α'));assert.ok(text.includes('x<1'));assert.ok(text.includes('x_t'));assert.ok(!text.includes('\\alpha'));
});
test('Plain search text preserves fractions, scripts, roots and matrix rows',()=>{
 assert.equal(math.searchText(String.raw`\(\frac{I}{r}\)`,katex),'I/r');
 assert.equal(math.searchText(String.raw`\(x_i^2+\sqrt{y}\)`,katex),'x_i^2+√(y)');
 assert.equal(math.searchText(String.raw`\(\frac{a+b}{c+d}\)`,katex),'(a+b)/(c+d)');
 assert.equal(math.searchText(String.raw`\(\begin{bmatrix}1&k\\0&1\end{bmatrix}\)`,katex),'[1, k; 0, 1]');
});
test('Exercise paragraphs preserve the authored input/edge-case separation',()=>{
 const html=vm.runInContext(`proseParagraphs('输入约定。\\n\\n边界条件。')`,context);
 assert.equal(html,'<p>输入约定。</p><p>边界条件。</p>');
});
test('Display math is keyboard focusable and has a contained scroll box',()=>{
 const html=inline(String.raw`\[\prod_{\ell=0}^{L-1}(I+J_\ell)\]`);
 assert.ok(html.startsWith('<span class="math-display" tabindex="0"'));
 const css=fs.readFileSync(path.join(dist,'styles.css'),'utf8');
 assert.match(css,/\.math-display\{[^}]*overflow-x:auto/);
 assert.match(css,/\.katex-display\{[^}]*min-width:max-content/);
});
fs.writeFileSync(path.join(root,'reports/math-rendering-validation.json'),JSON.stringify({passed:records.length,records},null,2)+'\n');
console.log(JSON.stringify({passed:records.length}));
