"""Run every demonstration and every reference solution in isolated namespaces."""
import json,subprocess,os,tempfile,time,sys,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
lessons=json.loads((root/'dist/data/lessons.json').read_text())
results=[]
env=os.environ.copy();env['OMP_NUM_THREADS']='1';env['MKL_NUM_THREADS']='1'
old_report=json.loads((root/'validation.json').read_text()) if (root/'validation.json').exists() else {'results':[]}
previous={(r['lesson'],r['case']):r for r in old_report['results']}
try:
    baseline=json.loads(subprocess.run(['git','show','HEAD:dist/data/lessons.json'],cwd=root,capture_output=True,text=True,check=True).stdout)
    baseline={l['id']:l for l in baseline}
except (subprocess.CalledProcessError,json.JSONDecodeError):baseline={}
def cases_for(l):
    cases=[('demo',l['code']['source']),('python',l['exercise']['solution']+'\n'+l['exercise']['tests']),('torch',l['pytorchTask']['solution']+'\n'+l['pytorchTask']['tests'])]
    # Core-topic implementations are executed by validate_topics.py. Other courses
    # may own a shared, complete example without pretending to be a core topic.
    if not l.get('theoryTopic'):
        cases.extend(('implementation:'+d['id'],d['source']) for d in l.get('extraImplementations',[]))
    return cases
for lesson in lessons:
    cases=cases_for(lesson)
    for kind,source in cases:
        digest=hashlib.sha256(source.encode()).hexdigest()
        prior=previous.get((lesson['id'],kind))
        baseline_source=dict(cases_for(baseline[lesson['id']])).get(kind) if lesson['id'] in baseline else None
        if prior and prior.get('passed') is True and (prior.get('source_sha256')==digest or (not prior.get('source_sha256') and source==baseline_source)):
            item={**prior,'source_sha256':digest,'status':'passed','reused_unchanged_result':True,'original_checked_at':prior.get('original_checked_at',old_report.get('checked_at'))}
            results.append(item);print('VERIFIED UNCHANGED',lesson['id'],kind,flush=True);continue
        if lesson['id']=='distributed-training' and kind=='demo' and lesson['code'].get('validationStatus')=='environment_blocked':
            note=json.loads((root/'content'/'ddp-validation-note.json').read_text())
            assert note['lesson']==lesson['id'] and note['case']=='demo'
            results.append({'lesson':lesson['id'],'case':kind,'passed':None,'status':'environment_blocked','reason':note['reason'],'output':note.get('output_excerpt',''),'source_sha256':digest})
            print('ENVIRONMENT BLOCKED',lesson['id'],kind,flush=True);continue
        start=time.time()
        with tempfile.TemporaryDirectory(prefix='eml-check-') as temp:
            file=Path(temp)/'lesson.py';file.write_text(source)
            try:
                run=subprocess.run([sys.executable,str(file)],cwd=temp,env=env,capture_output=True,text=True,timeout=45)
                ok=run.returncode==0;output=(run.stdout+run.stderr)[-5000:]
            except subprocess.TimeoutExpired:ok=False;output='Timed out after 45 seconds'
        item={'lesson':lesson['id'],'case':kind,'passed':ok,'status':'passed' if ok else 'failed','source_sha256':digest,'seconds':round(time.time()-start,3),'output':output}
        results.append(item)
        print(('PASS' if ok else 'FAIL'),lesson['id'],kind,flush=True)
        if not ok:print(output,flush=True)
report={'checked_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'python':sys.version,'environment':'CPU; isolated process and temporary directory per executed example; unchanged previously executed sources reuse recorded results','total':len(results),'passed':sum(x['passed'] is True for x in results),'failed':sum(x['passed'] is False for x in results),'environment_blocked':sum(x.get('status')=='environment_blocked' for x in results),'results':results}
try:
 import torch
 report['torch']=torch.__version__
except ImportError:pass
(root/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:report[k] for k in ['total','passed','failed','environment_blocked']},ensure_ascii=False))
if report['failed']:sys.exit(1)
