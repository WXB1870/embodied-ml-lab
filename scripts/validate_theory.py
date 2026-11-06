"""Validate authored lesson structure and report theory coverage, without executing code."""
import json,re,sys
from pathlib import Path

root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'content/curriculum.json').read_text())
lessons=json.loads((root/'dist/data/lessons.json').read_text())
records=[];errors=[];editorial_notes=[];introductions={}
position={lesson['id']:i for i,lesson in enumerate(lessons)}
for lesson in lessons:
    sections=lesson['sections']
    row={'id':lesson['id'],'title':lesson['title'],'sections':len(sections),
         'body_characters':sum(len(s.get('lead','')+''.join(s['body'])) for s in sections),
         'chapter_introduction':bool(lesson.get('lead','').strip()),
         'section_introductions':sum(bool(s.get('lead','').strip()) for s in sections),
         'worked_examples':sum(bool(s.get('example')) for s in sections),
         'focus_blocks':sum(bool(s.get('focus')) for s in sections),
         'key_points':len(lesson.get('keyPoints',[])),'pitfalls':len(lesson['pitfalls'])}
    records.append(row)
    if not sections or not lesson.get('lead','').strip():errors.append(lesson['id']+': missing chapter introduction or sections')
    for dependency in lesson.get('prerequisites',[]):
        if dependency not in position or position[dependency]>=position[lesson['id']]:errors.append(lesson['id']+': prerequisite is not earlier: '+dependency)
    for section in sections:
        key=lesson['id']+'/'+str(section['id']);lead=section.get('lead','').strip()
        if not lead:errors.append(key+': missing section introduction')
        elif lead in introductions:errors.append(key+': duplicate introduction with '+introductions[lead])
        else:introductions[lead]=key
        if lead and lead in section['body']:errors.append(key+': introduction duplicated in body')
        # This is an editorial review signal, not a proxy for educational quality.
        sentences=len(re.findall(r'[。！？]',re.sub(r'\\\(.*?\\\)', '', lead)))
        if lead and not 2<=sentences<=4:editorial_notes.append({'section':key,'sentence_count':sentences})
        if not all(isinstance(p,str) and p.strip() for p in section['body']):errors.append(lesson['id']+': invalid body')
        ex=section.get('example')
        if ex and (not isinstance(ex.get('steps'),list) or len(ex['steps'])<2 or not ex.get('conclusion')):errors.append(lesson['id']+': invalid worked example')
        f=section.get('focus')
        if f and (f.get('kind') not in ['常用','易错'] or not all(f.get(k) for k in ['title','explanation','check'])):errors.append(lesson['id']+': invalid focus block')
text='\n'.join((root/'content'/(name+'.json')).read_text() for name in catalog['sourceFiles'])
for pattern in [r'XYZHead',r'xyz_head',r'loss_xyz',r'首次闭合',r'首次夹爪闭合',r'三维目标读出头',r'3\s*维目标读出头']:
    if re.search(pattern,text):errors.append('Removed project example remains: '+pattern)
summary={'lessons':len(lessons),'theory_sections':sum(r['sections'] for r in records),
         'chapter_introductions':sum(r['chapter_introduction'] for r in records),
         'section_introductions':sum(r['section_introductions'] for r in records),
         'body_characters':sum(r['body_characters'] for r in records),
         'worked_examples':sum(r['worked_examples'] for r in records),
         'focus_blocks':sum(r['focus_blocks'] for r in records),
         'key_points':sum(r['key_points'] for r in records),
         'pitfalls':sum(r['pitfalls'] for r in records),'issues':len(errors)}
print(json.dumps(summary,ensure_ascii=False))
for error in errors:print(error)
if errors:sys.exit(1)
(root/'theory-coverage.json').write_text(json.dumps({'summary':summary,'lessons':records,'editorial_notes':editorial_notes},ensure_ascii=False,indent=2)+'\n')
