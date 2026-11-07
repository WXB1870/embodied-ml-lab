"""Assemble the authored curriculum and a downloadable learning pack."""
from pathlib import Path
import json, zipfile, copy, shutil, re, os
from build_knowledge import build_knowledge, write_topic_files, section_learning_markdown, section_figures_markdown
root=Path(__file__).resolve().parents[1]
site_url=os.environ.get('SITE_URL','https://wxb1870.github.io/embodied-ml-lab/').rstrip('/')
catalog=json.loads((root/'content'/'curriculum.json').read_text())
topics=build_knowledge(root)
topic_lookup={t['id']:t for t in topics}
lessons=[]
for name in catalog['sourceFiles']:
    source=root/'content'/f'{name}.json'
    if not source.exists():
        raise SystemExit(f'Missing content: {source}')
    lessons.extend(json.loads(source.read_text()))
order=[id for module in catalog['modules'] for id in module['lessons']]
assert len(order)==len(set(order)), 'Duplicate lesson in catalog'
ids={x['id'] for x in lessons}
assert ids==set(order), {'missing':set(order)-ids,'unexpected':ids-set(order)}
assert len(ids)==len(lessons)
lookup={l['id']:l for l in lessons}
lessons=[lookup[id] for id in order]
for module in catalog['modules']:
    for id in module['lessons']:lookup[id]['module']=module['id']
for number,l in enumerate(lessons,1):
    l['number']=number
    if l.get('theoryTopic'):
        t=topic_lookup[l['theoryTopic']]
        l['title']=t['title']
        l['subtitle']=t['subtitle']
        l['lead']=t['lead']
        l['sections']=copy.deepcopy(t['sections'])
        l['shapes']=[{'name':n['symbol'],'shape':n['shape'],'meaning':n['meaning']} for n in t['notation']]
        l['knowledgeChecks']=copy.deepcopy(t['questions'])
        l['pitfalls']=copy.deepcopy(t['pitfalls'])
        l['sources']=list({s['url']:s for s in l['sources']+t['sources']}.values())
        l['extraImplementations']=copy.deepcopy(t['implementations'])
        l['extraLabs']=copy.deepcopy(t['labs'])
required=['id','number','module','title','subtitle','minutes','tags','prerequisites','objectives','why','lead','sections','shapes','code','exercise','pytorchTask','pitfalls','sources','knowledgeChecks']
for l in lessons:
    for k in required: assert k in l,(l['id'],k)
    for p in l['prerequisites']: assert p in ids,(l['id'],'unknown prerequisite',p)
    assert len(l['sections'])>=3
    assert len(l['knowledgeChecks'])>=2
    for q in l['knowledgeChecks']:
        assert q['question'] and isinstance(q['answer'],list) and len(q['answer'])>=1
        if not l.get('theoryTopic'):assert q['codeFocus'] and q['acceptance']
    for key in ['exercise','pytorchTask']:
        assert l[key].get('hints') and l[key].get('explanation'),(l['id'],key,'missing answer explanation')
    for section in l['sections']:
        assert isinstance(section.get('lead'),str) and section['lead'].strip(),(l['id'],section.get('id'),'missing section introduction')
        if section.get('code'):compile(section['code'],l['id']+'/section','exec')
        if section.get('codeKind')=='fragment':assert section.get('codeExplanation'),(l['id'],section['id'],'fragment needs context')
        for figure in section.get('figures',[section['figure']] if section.get('figure') else []):
            assert figure.get('alt') and figure.get('caption'),(l['id'],section['id'],'figure needs description')
            if 'afterParagraph' in figure:assert type(figure['afterParagraph']) is int and 0<=figure['afterParagraph']<=len(section['body']),(l['id'],section['id'],'figure position')
            asset_path=figure['src'].lstrip('/')
            assert asset_path.startswith('assets/') and '..' not in Path(asset_path).parts,(l['id'],'figure asset path')
            source=root/'content'/asset_path.removeprefix('assets/')
            assert source.is_file(),(l['id'],'missing figure',source)
        if section.get('example'):
            ex=section['example']
            assert ex.get('title') and ex.get('conclusion') and len(ex.get('steps',[]))>=2,(l['id'],'invalid worked example')
        if section.get('focus'):
            focus=section['focus']
            assert focus.get('kind') in ['常用','易错'] and all(focus.get(k) for k in ['title','explanation','check']),(l['id'],'invalid focus block')
    for e in l['code']['explanations']:
        line_numbers=[int(n) for n in re.findall(r'\d+',str(e['lines']))]
        assert line_numbers and min(line_numbers)>0 and max(line_numbers)<=len(l['code']['source'].splitlines()),(l['id'],'invalid code explanation',e)
    for demo in l.get('extraImplementations',[]):
        compile(demo['source'],l['id']+'/'+demo['id'],'exec')
        for e in demo['explanations']:
            numbers=[int(n) for n in re.findall(r'\d+',str(e['lines']))]
            assert numbers and 0<min(numbers)<=max(numbers)<=len(demo['source'].splitlines()),(l['id'],demo['id'],'invalid explanation')
    assert len(l.get('extraImplementations',[]))==len({d['id'] for d in l.get('extraImplementations',[])}),(l['id'],'duplicate implementation')
    for s in l['sources']:assert s['url'].startswith('https://')
    for code in [l['code']['source'],l['exercise']['starter'],l['exercise']['solution'],l['exercise']['tests'],l['pytorchTask']['starter'],l['pytorchTask']['solution'],l['pytorchTask']['tests']]:compile(code,l['id'],'exec')
# Check the course dependency graph is acyclic.
visited=set();visiting=set();lookup={l['id']:l for l in lessons}
def dfs(id):
    assert id not in visiting,('dependency cycle',id)
    if id in visited:return
    visiting.add(id)
    for p in lookup[id]['prerequisites']:dfs(p)
    visiting.remove(id);visited.add(id)
for id in ids:dfs(id)
data=root/'dist'/'data';data.mkdir(exist_ok=True)
(data/'lessons.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
(data/'curriculum.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
topic_report=root/'topics-validation.json'
downloads=root/'dist'/'downloads';downloads.mkdir(exist_ok=True)
readme='''# Embodied × ML 学习代码包

课程按数学基础、神经网络、Transformer 与多模态、生成模型、动作策略与后训练、训练工程、执行评估七个章节组织。

## 使用顺序

1. 按文章中的推导阅读，结合短代码和完整实现核对结果。
2. 在 `exercises/python/` 找到本节标准库练习，独立完成 TODO。
3. 使用 `python 文件名.py` 执行，该文件末尾带断言测试。
4. 阅读 `demos/` 的完整 PyTorch 示例；改动输入，观察张量形状和输出。
5. 完成 `exercises/torch/` 中对应的 PyTorch 任务。
6. 需要时再打开 `solutions/`，答案与练习分开存放。

## 环境

建议 Python 3.11 或 3.12。Python 练习只用标准库，无需安装依赖。
PyTorch 演示与任务以 CPU 为默认环境。DDP 演示需要本地两进程 Gloo 通信；当前交付环境禁止通信 socket，此一项没有完成运行验证，详见 validation.json。AMP 提供 CPU BF16 教学路径，GPU 分支应在你的硬件上再核验。

```bash
python -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
python -m pip install torch
python demos/01_tensor_demo.py
python exercises/python/01_tensor_practice.py
```

GPU/CUDA 版本请按 https://pytorch.org/get-started/locally/ 选择安装命令。

## 目录

- `topics/`：四门核心课程的详细源讲义、附加实现与编程练习；与网站对应课程使用同一份理论来源。
- `demos/`：{lesson_count} 个完整带注释 PyTorch 教学演示。
- `exercises/python/`：{lesson_count} 个标准库练习，带 TODO 和测试。
- `exercises/torch/`：{lesson_count} 个 PyTorch 练习，带 TODO 和测试。
- `solutions/python/`、`solutions/torch/`：对应参考答案和同一套测试。
- `curriculum/`：完整中文课程内容 JSON，含原理、形状、逐段说明、开放问题和来源。
- `lessons/`：每节完整 Markdown 讲义，可直接阅读或放入 Obsidian；含推导、算例、代码说明、讨论与参考解。
- `validation.json`：基础课程的实际运行验证结果。
- `topics/validation.json`：四个详细专题的实际运行验证结果。
- `curriculum/curriculum.json`：研究补齐依据、开源可视化与进阶边界。
- `assets/experiments/`：Flow Matching 多峰实验的实际数据与图形。
- `assets/figures/`：原创结构图、张量流向图、经典论文图与动图，以及所复用图片的出处和许可说明。
- `demos/课程ID/`：由相关课程共同引用的完整训练或原理验证案例。
- `experiments/`：读取已记录数据重新绘图的脚本；绘图额外依赖 NumPy 与 Matplotlib。

## 运行说明

测试验证本节指定的最小行为，不证明任意输入下均正确，也不代表真实机器人效果。
浏览器练习、PyTorch 练习和完整机器人模型是不同层次的实现。Diffusion/Flow 示例是教学小模型。
浮点计算可能随硬件和库版本产生微小差异，断言中使用容差比较。

## 课程索引
'''.replace('{lesson_count}',str(len(lessons)))
for l in lessons:readme+=f"- {l['number']:02d} {l['title']} (`{l['id']}`)\n"
(downloads/'README.md').write_text(readme)
def lesson_markdown(l):
    text=f"# {l['title']}\n\n{l['subtitle']}\n\n"
    if l.get('lead'):text+=l['lead']+'\n\n'
    if l.get('prerequisites'):text+='前置知识：'+' · '.join(f"[{lookup[id]['title']}]({site_url}/learn/{id}/)" for id in l['prerequisites'])+'\n\n'
    for section in l['sections']:
        text+='## '+section['title']+'\n\n'+section.get('lead','')+'\n\n'+section_figures_markdown(section,'../',0)+'\n\n'
        for i,paragraph in enumerate(section['body'],1):
            text+=paragraph+'\n\n'+section_figures_markdown(section,'../',i)+'\n\n'
        if section.get('formula'):text+='$$\n'+section['formula']+'\n$$\n\n'
        if section.get('bullets'):text+='\n'.join('- '+x for x in section['bullets'])+'\n\n'
        if section.get('code'):
            if section.get('codeKind')=='fragment':text+='实现片段（所需上下文见代码说明）：\n\n'
            text+='```python\n'+section['code']+'\n```\n\n'+section.get('codeExplanation','')+'\n\n'
        text+=section_learning_markdown(section, '../')+'\n\n'
    text+='## 张量形状\n\n| 变量 | 形状 | 含义 |\n|---|---|---|\n'
    for shape in l['shapes']:text+='| '+' | '.join(str(shape[k]).replace('|','\\|') for k in ['name','shape','meaning'])+' |\n'
    text+='\n## 完整代码与精读\n\n'
    if l['code'].get('runtimeNote'):text+=l['code']['runtimeNote']+'\n\n'
    text+='```python\n'+l['code']['source']+'\n```\n\n'
    text+='\n'.join('- 第 '+e['lines']+' 行：'+e['text'] for e in l['code']['explanations'])+'\n\n预期观察：'+l['code']['expected']+'\n\n'
    for demo in l.get('extraImplementations',[]):
        source=f"../topics/{l['theoryTopic']}/demos/{demo['id']}.py" if l.get('theoryTopic') else f"../demos/{l['id']}/{demo['id']}.py"
        text+='### '+demo['title']+'\n\n'+demo['description']+'\n\n[完整可运行代码]('+source+')\n\n'
        text+='\n'.join('- 第 '+e['lines']+' 行：'+e['text'] for e in demo['explanations'])+'\n\n预期观察：'+demo['expected']+'\n\n'
    for title,key in [('浏览器 Python 练习','exercise'),('本地 PyTorch 练习','pytorchTask')]:
        task=l[key];text+='## '+title+'\n\n'+task['prompt']+'\n\n```python\n'+task['starter']+'\n```\n\n### 提示\n\n'+'\n'.join('- '+h for h in task['hints'])+'\n\n### 参考实现与解释\n\n```python\n'+task['solution']+'\n```\n\n'+task['explanation']+'\n\n### 断言测试\n\n```python\n'+task['tests']+'\n```\n\n'
    for lab in l.get('extraLabs',[]):
        base=f"../topics/{l['theoryTopic']}"
        text+='### 练习：'+lab['title']+'\n\n'+lab['prompt']+'\n\n[练习与测试]('+base+'/exercises/'+lab['id']+'.py) · [参考实现]('+base+'/solutions/'+lab['id']+'.py)\n\n'+lab['explanation']+'\n\n'
    text+='## 练习：推导与分析\n\n'
    for q in l['knowledgeChecks']:
        text+='### '+q['question']+'\n\n'+'\n\n'.join(q['answer'])+'\n\n'
        if q.get('codeFocus'):text+='代码定位：'+q['codeFocus']+'\n\n'
        if q.get('acceptance'):text+='\n'.join('- '+x for x in (q['acceptance'] if isinstance(q['acceptance'],list) else [q['acceptance']]))+'\n\n'
    text+='## 练习：辨析与纠错\n\n'+'\n\n'.join('### '+x['title']+'\n\n'+x['detail'] for x in l['pitfalls'])+'\n\n'
    text+='## 原始资料\n\n'+'\n'.join(f"- [{s['title']}]({s['url']})" for s in l['sources'])+'\n'
    return text
report=root/'validation.json'
if report.exists():
    validation=json.loads(report.read_text())
    summary={k:validation.get(k) for k in ['checked_at','total','passed','failed','environment_blocked','python','torch','environment']}
    summary['blocked_cases']=[{k:r.get(k) for k in ['lesson','case','status','reason']} for r in validation['results'] if r.get('status')=='environment_blocked']
    if topic_report.exists():
        tr=json.loads(topic_report.read_text())
        summary['foundation_total']=summary['total']
        summary['topic_total']=tr['total']
        summary['foundation_checked_at']=summary['checked_at']
        summary['topic_checked_at']=tr['checked_at']
        summary['checked_at']=max(summary['checked_at'],tr['checked_at'])
        for k in ['total','passed','failed']:summary[k]+=tr[k]
    (data/'validation-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
figure_files=sorted(path for path in (root/'content/figures').iterdir()
                    if path.suffix in ('.svg','.png','.gif') or path.name.endswith('-LICENSE.txt'))
def write_experiment_files(archive, include_full_curriculum=False):
    plotting_scripts={'plot_fm_mixture.py'}
    if include_full_curriculum:plotting_scripts.add('plot_generative_paths.py')
    for path in sorted((root/'content/experiments').glob('*')):
        if path.suffix not in ('.json','.svg','.py'):continue
        # Repo-only runners read authored JSON; the packs already export their
        # canonical, standalone programs under demos/. Plotters are scoped to
        # the curriculum data actually present in each archive.
        if path.suffix=='.py' and path.name not in plotting_scripts:continue
        folder='experiments' if path.suffix=='.py' else 'assets/experiments'
        archive.write(path,folder+'/'+path.name)
    for path in figure_files:
        archive.write(path,'assets/figures/'+path.name)

assets=root/'dist/assets/experiments';assets.mkdir(parents=True,exist_ok=True)
for path in (root/'content/experiments').glob('*'):
    if path.suffix in ('.json','.svg'):shutil.copyfile(path,assets/path.name)
figures=root/'dist/assets/figures';figures.mkdir(parents=True,exist_ok=True)
for path in figure_files:shutil.copyfile(path,figures/path.name)

with zipfile.ZipFile(downloads/'embodied-ml-study-pack.zip','w',zipfile.ZIP_DEFLATED) as z:
    write_topic_files(z,topics,topic_report)
    write_experiment_files(z,include_full_curriculum=True)
    z.writestr('README.md',readme)
    z.writestr('requirements.txt','torch>=2.6\n')
    z.writestr('curriculum/lessons.json',json.dumps(lessons,ensure_ascii=False,indent=2))
    z.writestr('curriculum/curriculum.json',json.dumps(catalog,ensure_ascii=False,indent=2))
    if report.exists():z.writestr('validation.json',report.read_text())
    for l in lessons:
        prefix=f"{l['number']:02d}_{l['id']}"
        z.writestr(f'lessons/{prefix}.md',lesson_markdown(l))
        z.writestr(f'demos/{prefix}_demo.py',l['code']['source']+'\n')
        if not l.get('theoryTopic'):
            for demo in l.get('extraImplementations',[]):z.writestr(f"demos/{l['id']}/{demo['id']}.py",demo['source']+'\n')
        for kind,key in [('python','exercise'),('torch','pytorchTask')]:
            task=l[key];env='Python 标准库' if kind=='python' else 'Python + PyTorch CPU'
            header=f"# {l['title']}\n# 环境：{env}\n# {task['prompt'].replace(chr(10),chr(10)+'# ')}\n\n"
            tail='\n\n# ===== 断言测试 =====\n'+task['tests']+'\nprint("所有提供的测试通过。")\n'
            z.writestr(f'exercises/{kind}/{prefix}_{"practice" if kind=="python" else "torch"}.py',header+task['starter']+tail)
            z.writestr(f'solutions/{kind}/{prefix}_solution.py',header+task['solution']+tail)
with zipfile.ZipFile(downloads/'embodied-ml-topics.zip','w',zipfile.ZIP_DEFLATED) as z:
    write_topic_files(z,topics,topic_report)
    write_experiment_files(z)
print(json.dumps({'topics':len(topics),'lessons':len(lessons),'python_exercises':len(lessons),'pytorch_exercises':len(lessons),'curriculum_bytes':(data/'lessons.json').stat().st_size,'learning_pack_bytes':(downloads/'embodied-ml-study-pack.zip').stat().st_size},ensure_ascii=False))
