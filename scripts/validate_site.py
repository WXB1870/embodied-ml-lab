"""Check delivered HTML, canonical content, links and downloadable study assets."""
import json, re, os
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs, unquote
import zipfile
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
site_url = os.environ.get('SITE_URL', 'https://wxb1870.github.io/embodied-ml-lab/').rstrip('/')
base_path = urlparse(site_url).path
origin = urlparse(site_url)._replace(path='').geturl()
lessons = json.loads((dist / 'data/lessons.json').read_text())
by_id = {lesson['id']: lesson for lesson in lessons}
errors, records = [], []


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.assets, self.canonical = [], [], [], []
        self.prerendered = False
        self.raw_formulas = 0
        self.math_errors = []
        self.ignored_math_tags = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'pre', 'code', 'textarea', 'annotation'):
            self.ignored_math_tags.append(tag)
        if 'katex-error' in attrs.get('class', '').split():
            self.math_errors.append('KaTeX error element')
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'icon'):
            self.assets.append(attrs['href'])
        if tag in ('script', 'img') and attrs.get('src'):
            self.assets.append(attrs['src'])
        if tag == 'main' and 'data-prerendered' in attrs:
            self.prerendered = True
        if 'data-formula' in attrs:
            self.raw_formulas += 1

    def handle_endtag(self, tag):
        if self.ignored_math_tags and self.ignored_math_tags[-1] == tag:
            self.ignored_math_tags.pop()

    def handle_data(self, data):
        if not self.ignored_math_tags and re.search(r'\\[()\[\]]|\\(?:frac|dfrac|sqrt|mathbb|mathcal|nabla|partial)\b', data):
            self.math_errors.append('Unrendered mathematical notation: ' + data[:160])


pages = {}
for file in sorted(dist.rglob('*.html')):
    if 'vendor' in file.parts:
        continue
    route = '/' + str(file.relative_to(dist)).replace('index.html', '')
    page = Page()
    page.feed(file.read_text())
    pages[route] = page
    if len(page.ids) != len(set(page.ids)):
        errors.append([route, 'duplicate DOM ids'])
    if page.raw_formulas:
        errors.append([route, 'formula omitted from static HTML'])
    if page.math_errors:
        errors.append([route, 'formula rendering errors', page.math_errors])
    expected = site_url + route
    if route == '/404.html':
        expected = site_url + '/404/'
    if not route.startswith('/topics/') and page.canonical != [expected]:
        errors.append([route, 'canonical mismatch', page.canonical])
    if route.startswith('/learn/'):
        if not page.prerendered:
            errors.append([route, 'missing static body'])
        parts = route.strip('/').split('/')
        if len(parts) == 2:
            for section in by_id[parts[1]]['sections']:
                if 'section-' + section['id'] not in page.ids:
                    errors.append([route, 'missing authored section', section['id']])
    records.append({'path': route, 'ids': len(page.ids), 'links': len(page.links), 'assets': len(page.assets)})

link_count = 0
for route, page in pages.items():
    for value in page.links + page.assets:
        url = urlparse(value)
        if url.netloc and url.netloc != urlparse(origin).netloc:
            continue
        if url.scheme and url.scheme not in ('http', 'https'):
            continue
        if not url.path:
            if url.fragment and url.fragment not in page.ids:
                errors.append([route, 'missing local fragment', value])
            continue
        if not url.path.startswith('/'):
            errors.append([route, 'relative route or asset', value])
            continue
        if base_path and not url.path.startswith(base_path + '/'):
            errors.append([route, 'link escaped deployment path', value])
            continue
        url = url._replace(path=url.path[len(base_path):])
        file = dist / unquote(url.path.lstrip('/'))
        if file.is_dir():
            file /= 'index.html'
        if not file.is_file():
            errors.append([route, 'missing route or asset', value])
            continue
        link_count += 1
        query = parse_qs(url.query)
        target = pages.get(url.path)
        if not target:
            continue
        anchor = query.get('anchor', [url.fragment or None])[0]
        if 'section' in query:
            section = query['section'][0]
            item = by_id.get(url.path.strip('/').split('/')[-1], {})
            anchor = 'section-' + item.get('legacySectionMap', {}).get(section, section)
        if anchor and anchor.startswith('topic-section-'):
            anchor = 'section-' + anchor[len('topic-section-'):]
        if 'pitfall' in query:
            anchor = 'pitfall-' + query['pitfall'][0]
        if anchor and anchor not in target.ids:
            errors.append([route, 'missing target anchor', value, anchor])

archive_records = []
authored_figures={f['src'].lstrip('/') for lesson in lessons for s in lesson['sections']
                  for f in s.get('figures',[s['figure']] if s.get('figure') else [])}
for asset in authored_figures:
    file=dist/asset
    if file.suffix=='.svg' and file.exists():
        try:
            svg=ET.parse(file).getroot()
            if not svg.get('viewBox'):errors.append([asset,'SVG missing viewBox'])
            if asset.startswith('assets/figures/') and svg.find('{http://www.w3.org/2000/svg}title') is None:
                errors.append([asset,'SVG missing accessible title'])
        except ET.ParseError as error:errors.append([asset,'invalid SVG XML',str(error)])
for filename in ['embodied-ml-study-pack.zip', 'embodied-ml-topics.zip']:
    with zipfile.ZipFile(dist / 'downloads' / filename) as archive:
        assert archive.testzip() is None
        names = set(archive.namelist())
        for expected in ['assets/experiments/fm-mixture-evidence.json',
                         'assets/experiments/fm-mixture-dynamics.svg',
                         'assets/experiments/fm-mixture-distributions.svg',
                         'experiments/plot_fm_mixture.py']:
            if expected not in names:
                errors.append([filename, 'missing reproducibility asset', expected])
        for asset in authored_figures:
            if asset not in names:errors.append([filename,'missing article figure',asset])
        if filename=='embodied-ml-study-pack.zip':
            for lesson in lessons:
                if lesson.get('theoryTopic'):continue
                for demo in lesson.get('extraImplementations',[]):
                    name=f"demos/{lesson['id']}/{demo['id']}.py"
                    if name not in names:errors.append([filename,'missing shared example',name])
                    elif archive.read(name).decode()!=demo['source']+'\n':errors.append([filename,'shared example source mismatch',name])
        archive_records.append({'name': filename, 'files': len(names)})

report = {'html_pages': len(pages), 'lessons': len(lessons), 'internal_targets_checked': link_count,
          'errors': errors, 'archives': archive_records, 'pages': records}
(root / 'reports/site-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['html_pages', 'lessons', 'internal_targets_checked', 'errors', 'archives']}, ensure_ascii=False))
if errors:
    raise SystemExit(1)
