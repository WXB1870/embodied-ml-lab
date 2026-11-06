"""Run the complete topic demonstrations and exercise reference solutions."""
import hashlib,json,os,subprocess,sys,tempfile,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
topics=json.loads((root/'dist/data/topics.json').read_text())
env=os.environ.copy();env['OMP_NUM_THREADS']='1';env['MKL_NUM_THREADS']='1'
path=root/'topics-validation.json'
old=json.loads(path.read_text()) if path.exists() else {'results':[]}
previous={(r['topic'],r['case']):r for r in old['results']}
results=[]
for t in topics:
    cases=[('demo:'+d['id'],d['source']) for d in t['implementations']]+[('lab:'+l['id'],l['solution']+'\n'+l['tests']) for l in t['labs']]
    for name,code in cases:
        digest=hashlib.sha256(code.encode()).hexdigest();prior=previous.get((t['id'],name))
        if prior and prior['passed'] and prior['source_sha256']==digest:
            results.append({**prior,'reused_unchanged_result':True});print('UNCHANGED',t['id'],name,flush=True);continue
        started=time.monotonic()
        with tempfile.TemporaryDirectory(prefix='embodied-topic-') as tmp:
            file=Path(tmp)/'example.py';file.write_text(code)
            try:
                run=subprocess.run([sys.executable,str(file)],cwd=tmp,env=env,capture_output=True,text=True,timeout=90)
                ok=run.returncode==0;output=(run.stdout+run.stderr)[-8000:]
            except subprocess.TimeoutExpired:ok=False;output='Timed out after 90 seconds.'
        result={'topic':t['id'],'case':name,'passed':ok,'source_sha256':digest,'seconds':round(time.monotonic()-started,3),'output':output};results.append(result)
        print('PASS' if ok else 'FAIL',t['id'],name,flush=True)
        if not ok:print(output,flush=True)
report={'checked_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'environment':'CPU, one isolated process and temporary directory per executed case','total':len(results),'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print({k:report[k] for k in ['total','passed','failed']})
if report['failed']:sys.exit(1)
