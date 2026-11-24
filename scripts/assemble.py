"""Assemble the authored curriculum and a downloadable learning pack."""
from pathlib import Path
import json, zipfile, copy, shutil, re, os
from build_knowledge import build_knowledge, write_topic_files, section_learning_markdown, section_figures_markdown, section_example_markdown
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
legacy_lessons=[]
for name in catalog.get('legacySourceFiles', []):
    source=root/'content'/f'{name}.json'
    if not source.exists():
        raise SystemExit(f'Missing legacy content: {source}')
    for lesson in json.loads(source.read_text()):
        if lesson['id'] not in ids:
            lesson['module']='legacy'
            legacy_lessons.append(lesson)
            ids.add(lesson['id'])
lessons.extend(legacy_lessons)
lookup={l['id']:l for l in lessons}
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
        l['advancedSections']=copy.deepcopy(t.get('advancedSections', []))
        l['shapes']=[{'name':n['symbol'],'shape':n['shape'],'meaning':n['meaning']} for n in t['notation']]
        l['knowledgeChecks']=copy.deepcopy(t['questions'])
        l['advancedKnowledgeChecks']=copy.deepcopy(t.get('advancedQuestions', []))
        l['pitfalls']=copy.deepcopy(t['pitfalls'])
        l['advancedPitfalls']=copy.deepcopy(t.get('advancedPitfalls', []))
        l['sources']=list({s['url']:s for s in l['sources']+t['sources']}.values())
        advanced_impl=set(t.get('advancedImplementationIds', []))
        l['extraImplementations']=copy.deepcopy([d for d in t['implementations'] if d['id'] not in advanced_impl])
        l['advancedImplementations']=copy.deepcopy([d for d in t['implementations'] if d['id'] in advanced_impl])
        if t.get('mainImplementation'):
            l['mainImplementation']=t['mainImplementation']
            assert any(d['id']==l['mainImplementation'] for d in l['extraImplementations'])
        advanced_labs=set(t.get('advancedLabIds', []))
        l['extraLabs']=copy.deepcopy([d for d in t['labs'] if d['id'] not in advanced_labs])
        l['advancedLabs']=copy.deepcopy([d for d in t['labs'] if d['id'] in advanced_labs])
required=['id','number','module','title','subtitle','minutes','tags','prerequisites','objectives','why','lead','sections','sources']
for l in lessons:
    for k in required: assert k in l,(l['id'],k)
    for p in l['prerequisites']: assert p in ids,(l['id'],'unknown prerequisite',p)
    assert (len(l['sections'])==4 if l.get('theoryOnly') else len(l['sections'])>=3),(l['id'],'invalid section count')
    for section in l['sections']:
        assert isinstance(section.get('lead'),str) and section['lead'].strip(),(l['id'],section.get('id'),'missing section introduction')
        assert len(section.get('body',[]))>=2,(l['id'],section.get('id'),'insufficient section content')
        if section.get('code') and not l.get('theoryOnly'):compile(section['code'],l['id']+'/section','exec')
        if section.get('comparison'):
            comparison=section['comparison']
            assert comparison.get('title') and len(comparison.get('columns',[]))>=2 and comparison.get('rows'),(l['id'],section['id'],'invalid comparison matrix')
            assert all(len(row)==len(comparison['columns']) for row in comparison['rows']),(l['id'],section['id'],'comparison row shape')
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
    for source in l['sources']:assert source['url'].startswith('https://')
    if l.get('theoryOnly'):
        assert not any(k in l for k in ['code','exercise','pytorchTask','extraImplementations','extraLabs']),(l['id'],'theory-only course must not contain code or practice payloads')
        assert not l.get('knowledgeChecks'),(l['id'],'theory-only course must not add practice questions')
        continue
    required_teaching=['shapes','code','exercise','pytorchTask','pitfalls','knowledgeChecks']
    for k in required_teaching:assert k in l,(l['id'],k)
    assert len(l['knowledgeChecks'])>=2
    for q in l['knowledgeChecks']:
        assert q['question'] and isinstance(q['answer'],list) and len(q['answer'])>=1
        if not l.get('theoryTopic'):
            assert q.get('acceptance'),(l['id'],'knowledge check needs acceptance criteria')
            assert q.get('codeFocus'),(l['id'],'knowledge check needs code focus')
    for key in ['exercise','pytorchTask']:
        assert l[key].get('hints') and l[key].get('explanation'),(l['id'],key,'missing answer explanation')
    for e in l['code']['explanations']:
        line_numbers=[int(n) for n in re.findall(r'\d+',str(e['lines']))]
        assert line_numbers and min(line_numbers)>0 and max(line_numbers)<=len(l['code']['source'].splitlines()),(l['id'],'invalid code explanation',e)
    for demo in l.get('extraImplementations',[]):
        compile(demo['source'],l['id']+'/'+demo['id'],'exec')
        for e in demo['explanations']:
            numbers=[int(n) for n in re.findall(r'\d+',str(e['lines']))]
            assert numbers and 0<min(numbers)<=max(numbers)<=len(demo['source'].splitlines()),(l['id'],demo['id'],'invalid explanation')
    assert len(l.get('extraImplementations',[]))==len({d['id'] for d in l.get('extraImplementations',[])}),(l['id'],'duplicate implementation')
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
# Keep the browser runtime used by prerender in sync with its authored source.
dist=root/'dist'
for asset in ['app.js','reader.js','styles.css','math.js','explorers.js','p0-explorers.js','deep-explorers.js','learning-visuals.js','pointer-effects.js']:
    source=root/'docs'/asset
    if not source.is_file():raise SystemExit(f'Missing browser asset: {source}')
    shutil.copyfile(source,dist/asset)
(data/'lessons.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
(data/'curriculum.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
topic_report=root/'topics-validation.json'
downloads=root/'dist'/'downloads';downloads.mkdir(exist_ok=True)
readme='''# Embodied × ML 学习代码包

课程按网络基础与视觉表征、现代 Transformer 与多模态骨干、生成模型与连续时间建模、具身策略架构与动作建模、高效微调与后训练对齐、具身智能体与技能编排六个主干模块组织；训练工程基础收录于附录。Robot Agent 模块为纯理论课程，不包含编程实现和手撕练习。

## 使用顺序

1. 按文章中的原理、对比矩阵和运行链路阅读；带代码的课程再结合实现核对。
2. 需要编程训练的课程可在 `exercises/python/` 完成标准库练习；Robot Agent 模块不设置编程题。
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

- `topics/`：保留的专题讲义、附加实现与编程练习。
- `demos/`：课程对应的完整带注释 PyTorch 教学演示。
- `exercises/python/`：适用课程的标准库练习，带 TODO 和测试。
- `exercises/torch/`：适用课程的 PyTorch 练习，带 TODO 和测试。
- `solutions/python/`、`solutions/torch/`：对应参考答案和同一套测试。
- `curriculum/`：六个核心模块 27 节课程及训练工程附录的中文课程数据。
- `lessons/`：每节 Markdown 讲义；Robot Agent 课程包含架构、权衡矩阵、运行链路和工程排查。
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
'''
for l in lessons:readme+=f"- {l['number']:02d} {l['title']} (`{l['id']}`)\n"
(downloads/'README.md').write_text(readme)
def lesson_markdown(l):
    text=f"# {l['title']}\n\n{l['subtitle']}\n\n"
    if l.get('lead'):text+=l['lead']+'\n\n'
    if l.get('prerequisites'):text+='前置知识：'+' · '.join(f"[{lookup[id]['title']}]({site_url}/learn/{id}/)" for id in l['prerequisites'])+'\n\n'
    for section in l['sections']:
        text+='## '+section['title']+'\n\n'+section.get('lead','')+'\n\n'
        for paragraph in section['body']:text+=paragraph+'\n\n'
        if section.get('comparison'):
            comp=section['comparison'];text+='### '+comp['title']+'\n\n| '+' | '.join(comp['columns'])+' |\n| '+' | '.join(['---']*len(comp['columns']))+' |\n'
            for row in comp['rows']:text+='| '+' | '.join(str(cell).replace('|','\\|') for cell in row)+' |\n'
            text+='\n'
        text+=section_learning_markdown(section, '../')+'\n\n'
    text+='## 代表项目与参考资料\n\n'+'\n'.join(f"- [{item['title']}]({item['url']})" for item in l['sources'])+'\n'
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
        if l.get('theoryOnly'):continue
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
