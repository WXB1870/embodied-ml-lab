"""Validate detailed topic lessons and write portable study files."""
import json
import re

TOPIC_IDS = ['mlp', 'cnn', 'transformer', 'flow-matching']


def section_figures_markdown(section, asset_prefix='../../', after_paragraph=None):
    lines=[]
    for figure in section.get('figures', [section['figure']] if section.get('figure') else []):
        if figure.get('afterParagraph') == after_paragraph:
            lines += ['![' + figure.get('alt', section['title']) + '](' + asset_prefix + figure['src'].lstrip('/') + ')', figure.get('caption', '')]
    return '\n\n'.join(lines)


def section_learning_markdown(section, asset_prefix='../../'):
    lines = [section_figures_markdown(section, asset_prefix)]
    if section.get('comparison'):
        table = section['comparison']
        clean = lambda value: str(value).replace('|', '\\|').replace('\n', ' ')
        lines += ['### ' + table['title'], '| ' + ' | '.join(map(clean, table['columns'])) + ' |', '|' + '---|' * len(table['columns'])]
        lines += ['| ' + ' | '.join(map(clean, row)) + ' |' for row in table['rows']]
    if section.get('example'):
        ex = section['example']
        lines += ['### 例：' + ex['title']]
        lines += [str(i + 1) + '. ' + step for i, step in enumerate(ex['steps'])]
        lines += [ex['conclusion']]
    if section.get('focus'):
        focus = section['focus']
        lines += ['### ' + focus['title'], focus['explanation'], focus['check']]
    return '\n\n'.join(lines)


def topic_markdown(topic):
    lines = ['# ' + topic['title'], topic['lead'], '## 符号约定', '| 符号 | 形状 | 含义 |', '|---|---|---|']
    lines += ['| ' + ' | '.join(str(n[k]).replace('|', '\\|') for k in ['symbol', 'shape', 'meaning']) + ' |' for n in topic['notation']]
    for section in topic['sections']:
        lines += ['## ' + section['title'], section.get('lead', ''), section_figures_markdown(section, after_paragraph=0)]
        for i,paragraph in enumerate(section['body'],1):
            lines += [paragraph,section_figures_markdown(section,after_paragraph=i)]
        if section.get('formula'):
            lines += ['$$\n' + section['formula'] + '\n$$']
        lines += ['- ' + item for item in section.get('bullets', [])]
        if section.get('code'):
            if section.get('codeKind')=='fragment':lines += ['实现片段（所需上下文见代码说明）：']
            lines += ['```python\n' + section['code'] + '\n```', section.get('codeExplanation', '')]
        lines += [section_learning_markdown(section)]
    for demo in topic['implementations']:
        lines += ['## ' + demo['title'], demo['description'], '```python\n' + demo['source'] + '\n```']
        lines += ['- 第 ' + e['lines'] + ' 行：' + e['text'] for e in demo['explanations']]
        lines += ['预期输出：' + demo['expected']]
    for lab in topic['labs']:
        lines += ['## 练习：' + lab['title'], lab['prompt'], '运行环境：' + lab['runtime'], '```python\n' + lab['starter'] + '\n```', '### 提示']
        lines += ['- ' + hint for hint in lab['hints']]
        lines += ['### 参考答案', '```python\n' + lab['solution'] + '\n```', lab['explanation'], '### 断言测试', '```python\n' + lab['tests'] + '\n```']
    lines += ['## 练习：推导与分析']
    for question in topic['questions']:
        lines += ['### ' + question['question'], *question['answer']]
    lines += ['## 练习：辨析与纠错']
    for pitfall in topic['pitfalls']:
        lines += ['### ' + pitfall['title'], pitfall['detail'], pitfall['fix']]
    lines += ['## 参考资料'] + ['- [' + source['title'] + '](' + source['url'] + ')' for source in topic['sources']]
    return '\n\n'.join(line for line in lines if line) + '\n'


def build_knowledge(root):
    topics = []
    for topic_id in TOPIC_IDS:
        path = root / 'content' / 'topics' / (topic_id + '.json')
        topic = json.loads(path.read_text())
        assert topic['id'] == topic_id
        for key in ['title', 'lead', 'relatedLessons', 'notation', 'sections', 'implementations', 'labs', 'questions', 'pitfalls', 'sources']:
            assert topic.get(key), (topic_id, key)
        section_ids = {section['id'] for section in topic['sections']}
        assert len(section_ids) == len(topic['sections']), (topic_id, 'duplicate section')
        for section in topic['sections']:
            assert section['title'] and section['body'], (topic_id, section['id'])
            assert isinstance(section.get('lead'),str) and section['lead'].strip(), (topic_id, section['id'], 'missing section introduction')
            if section.get('code'):
                compile(section['code'], topic_id + '/' + section['id'], 'exec')
        for demo in topic['implementations']:
            compile(demo['source'], topic_id + '/' + demo['id'], 'exec')
            for explanation in demo['explanations']:
                numbers = [int(x) for x in re.findall(r'\d+', explanation['lines'])]
                assert numbers and 1 <= min(numbers) <= max(numbers) <= len(demo['source'].splitlines()), (topic_id, demo['id'], explanation)
        for lab in topic['labs']:
            assert lab['runtime'] in ['python', 'torch'] and lab['hints'] and lab['explanation']
            for key in ['starter', 'solution', 'tests']:
                compile(lab[key], topic_id + '/' + lab['id'] + '/' + key, 'exec')
        for collection in ['implementations', 'labs']:
            assert len({entry['id'] for entry in topic[collection]}) == len(topic[collection]), (topic_id, collection, 'duplicate id')
        topics.append(topic)
    (root / 'dist' / 'data' / 'topics.json').write_text(json.dumps(topics, ensure_ascii=False, indent=2) + '\n')
    return topics


def write_topic_files(archive, topics, report=None):
    archive.writestr('topics/README.md', '# 核心专题学习包\n\nMLP、CNN、Transformer、Flow Matching。每个专题的讲义包含推导、代码说明、练习和参考答案。\n\nPython 练习只用标准库；PyTorch 示例默认在 CPU 运行。运行完整文件中的断言来检查结果，正文中的短代码用于验证对应的数学关系。\n')
    archive.writestr('topics/topics.json', json.dumps(topics, ensure_ascii=False, indent=2))
    if report and report.exists():
        archive.writestr('topics/validation.json', report.read_text())
    for topic in topics:
        archive.writestr('topics/' + topic['id'] + '/lesson.md', topic_markdown(topic))
        for demo in topic['implementations']:
            archive.writestr('topics/' + topic['id'] + '/demos/' + demo['id'] + '.py', demo['source'] + '\n')
        for lab in topic['labs']:
            head = '# ' + topic['title'] + ' · ' + lab['title'] + '\n# ' + lab['prompt'].replace('\n', '\n# ') + '\n\n'
            tail = '\n\n# 断言测试\n' + lab['tests'] + '\n'
            archive.writestr('topics/' + topic['id'] + '/exercises/' + lab['id'] + '.py', head + lab['starter'] + tail)
            archive.writestr('topics/' + topic['id'] + '/solutions/' + lab['id'] + '.py', head + lab['solution'] + tail)
