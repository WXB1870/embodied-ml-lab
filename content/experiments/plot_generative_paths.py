"""Redraw exact conditional-mixture marginals from the canonical Score course.

Run from the repository, or an extracted complete study pack. Requires torch,
numpy and matplotlib. No model is trained and no paper artwork is copied.
"""
from pathlib import Path
import argparse
import hashlib
import json
import xml.etree.ElementTree as ET

import torch
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import PowerNorm


def find_source():
    for parent in Path(__file__).resolve().parents:
        authored=parent/'content/generative.json'
        packed=parent/'curriculum/lessons.json'
        path=authored if authored.exists() else packed if packed.exists() else None
        if path:
            lessons=json.loads(path.read_text())
            return next(l for l in lessons if l['id']=='score-sde')['code']['source'], parent
    raise FileNotFoundError('Run from the repository or complete study pack.')


def draw(output):
    source, root=find_source()
    ns={'__name__':'shared_path_plot'}
    exec(compile(source,'score-sde_demo.py','exec'),ns)
    plt.rcParams.update({'svg.fonttype':'none','font.size':12,'axes.spines.top':False,
                         'axes.spines.right':False,'font.family':'DejaVu Sans'})
    fig, axes=plt.subplots(2,4,figsize=(12,6.5),sharex=True,sharey=True)
    grid=torch.linspace(-3,3,101)
    yy,xx=torch.meshgrid(grid,grid,indexing='ij')
    points=torch.stack((xx.flatten(),yy.flatten()),1)
    condition=torch.zeros(len(points),dtype=torch.long)
    # Shared levels ensure identical density values use identical colors.
    levels=[0,.005,.015,.035,.07,.14,.28,.56,1.1,1.6]
    for row,path in enumerate(('linear','vp')):
        for col,tvalue in enumerate((0,.35,.7,1)):
            density=ns['mixture'](points,torch.tensor(tvalue),condition,path)[0].exp()
            ax=axes[row,col]
            ax.contourf(xx.numpy(),yy.numpy(),density.reshape(101,101).numpy(),
                        levels=levels,cmap='Blues',norm=PowerNorm(.45,vmin=0,vmax=1.6))
            ax.set_aspect('equal');ax.set_xticks([-2,0,2]);ax.set_yticks([-2,0,2])
            ax.set_title(f'r = {tvalue:g}',fontsize=13,pad=8)
            if col==0:ax.set_ylabel(('Linear FM' if row==0 else 'VP marginal')+'\n$y$',fontsize=13)
            if row==1:ax.set_xlabel('$x$')
    fig.suptitle('Same conditional data, different marginal paths',fontsize=18,x=.52,y=.98)
    fig.text(.52,.90,'Generation clock: noise (r = 0)  →  data (r = 1)',ha='center',fontsize=12)
    fig.text(.5,.02,'Condition c = 0 · exact densities · common color scale · not Brownian trajectories',ha='center',fontsize=11,color='#4b5c72')
    fig.subplots_adjust(left=.08,right=.98,top=.83,bottom=.11,wspace=.25,hspace=.34)
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    fig.savefig(output,format='svg',metadata={'Title':'Two exact paths of one conditional Gaussian mixture',
                    'Description':'Original numerical figure. Linear and VP paths share endpoints but not intermediate densities.'})
    plt.close(fig)
    # Add accessible text while retaining editable vector paths and text elements.
    tree=ET.parse(output);svg=tree.getroot();namespace='{http://www.w3.org/2000/svg}'
    title=ET.Element(namespace+'title');title.text='同一条件混合分布的线性与 VP 边际路径'
    desc=ET.Element(namespace+'desc');desc.text='两行依次为线性 Flow Matching 与 VP；四列为生成时间 0、0.35、0.7、1。端点密度相同，中间密度不同。'
    svg.insert(0,title);svg.insert(1,desc)
    ET.register_namespace('','http://www.w3.org/2000/svg');tree.write(output,encoding='utf-8',xml_declaration=True)
    print(json.dumps({'svg':str(output),'source_sha256':hashlib.sha256(source.encode()).hexdigest(),
                      'svg_sha256':hashlib.sha256(output.read_bytes()).hexdigest()}))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',default='generative-shared-paths.svg')
    args=parser.parse_args();draw(args.output)
