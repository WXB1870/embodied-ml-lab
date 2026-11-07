/* Bundled CPython/Pyodide 0.27.7. Each submission receives a new Python namespace. */
let runtime;
self.onmessage = async ({data}) => {
  const {id, code, tests, scratch} = data;
  try {
    if (!runtime) {
      self.postMessage({id,type:'loading'});
      importScripts('./vendor/pyodide/pyodide.js');
      runtime = await loadPyodide({indexURL:new URL('./vendor/pyodide/',self.location.href).href});
    }
    self.postMessage({id,type:'ready'});
    let count=0;
    runtime.setStdout({batched:text=>{if(count++<500)self.postMessage({id,type:'stdout',text});}});
    runtime.setStderr({batched:text=>{if(count++<500)self.postMessage({id,type:'stderr',text});}});
    const dict=runtime.globals.get('dict');
    const ns=dict();
    try {
      ns.set('__name__','__main__');
      const output=await runtime.runPythonAsync(code,{globals:ns,filename:'your_code.py'});
      if(output&&typeof output.destroy==='function')output.destroy();
      if(scratch){
        const tried=await runtime.runPythonAsync(scratch,{globals:ns,filename:'try_code.py'});
        if(tried&&typeof tried.destroy==='function')tried.destroy();
      }
      if(tests){
        ns.set('__eml_test_source',tests);
        const tested=await runtime.runPythonAsync(`
import ast as __eml_ast
__eml_tree = __eml_ast.parse(__eml_test_source, filename='tests.py')
for __eml_node in __eml_ast.walk(__eml_tree):
    if isinstance(__eml_node, __eml_ast.Assert) and __eml_node.msg is None:
        __eml_expression = __eml_ast.get_source_segment(__eml_test_source, __eml_node.test)
        __eml_node.msg = __eml_ast.Constant(
            '测试断言未通过（tests.py 第 %d 行）：%s' % (__eml_node.lineno, __eml_expression))
exec(compile(__eml_ast.fix_missing_locations(__eml_tree), 'tests.py', 'exec'), globals())
`,{globals:ns,filename:'test_runner.py'});
        if(tested&&typeof tested.destroy==='function')tested.destroy();
      }
      self.postMessage({id,type:'done',passed:!!tests});
    } finally {ns.destroy();dict.destroy();}
  } catch(error){
    const trace=String(error.message||error);
    const frames=[...trace.matchAll(/File "(your_code|tests|try_code)\.py", line (\d+)/g)];
    const frame=frames[frames.length-1];
    const summary=trace.trim().split('\n').pop();
    self.postMessage({id,type:'error',text:frame?`${frame[1]}.py · 第 ${frame[2]} 行\n${summary}`:trace});
  }
};
