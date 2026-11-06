/* Bundled CPython/Pyodide 0.27.7. Each submission receives a new Python namespace. */
let runtime;
self.onmessage = async ({data}) => {
  const {id, code, tests} = data;
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
      if(tests){
        const tested=await runtime.runPythonAsync(tests,{globals:ns,filename:'tests.py'});
        if(tested&&typeof tested.destroy==='function')tested.destroy();
      }
      self.postMessage({id,type:'done',passed:!!tests});
    } finally {ns.destroy();dict.destroy();}
  } catch(error){self.postMessage({id,type:'error',text:String(error.message||error)});}
};
