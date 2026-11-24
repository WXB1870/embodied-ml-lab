/* Pointer-aware interactions for standalone Robot Agent page. */
(()=>{
  const finePointer=window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!finePointer||reduceMotion||window.__EML_POINTER_EFFECTS__)return;
  window.__EML_POINTER_EFFECTS__=true;
  const cardSelector='.topic-card,.practice-card,.agent-card,.feature-card,.agent-node,.agent-skill,.agent-project';
  const magnetSelector='.button,.search-trigger,.icon-button';
  let activeCard=null,activeMagnet=null,raf=0,lastX=0,lastY=0;
  const aura=document.createElement('div');aura.className='cursor-aura';aura.setAttribute('aria-hidden','true');document.body.appendChild(aura);
  const resetCard=el=>{if(!el)return;el.style.removeProperty('--spot-x');el.style.removeProperty('--spot-y');el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y');el.style.transform='';};
  const resetMagnet=el=>{if(!el)return;el.style.removeProperty('--mag-x');el.style.removeProperty('--mag-y');};
  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse')return;lastX=event.clientX;lastY=event.clientY;
    if(!raf)raf=requestAnimationFrame(()=>{
      raf=0;aura.style.left=lastX+'px';aura.style.top=lastY+'px';
      const target=document.elementFromPoint(lastX,lastY),card=target?.closest(cardSelector);
      if(card!==activeCard){resetCard(activeCard);activeCard=card;}
      if(card){const r=card.getBoundingClientRect(),x=(lastX-r.left)/r.width,y=(lastY-r.top)/r.height;
        card.style.setProperty('--spot-x',(x*100)+'%');card.style.setProperty('--spot-y',(y*100)+'%');
        card.style.setProperty('--tilt-x',((.5-y)*5).toFixed(2)+'deg');card.style.setProperty('--tilt-y',((x-.5)*5).toFixed(2)+'deg');
        card.style.transform='perspective(1000px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))';}
      const magnet=target?.closest(magnetSelector);if(magnet!==activeMagnet){resetMagnet(activeMagnet);activeMagnet=magnet;}
      if(magnet){const r=magnet.getBoundingClientRect(),dx=lastX-(r.left+r.width/2),dy=lastY-(r.top+r.height/2);
        magnet.style.setProperty('--mag-x',(dx/r.width*5).toFixed(2)+'px');magnet.style.setProperty('--mag-y',(dy/r.height*5).toFixed(2)+'px');}
    });
  },{passive:true});
  document.addEventListener('pointerover',event=>{if(event.pointerType==='mouse'&&event.target.closest(cardSelector))document.body.classList.add('pointer-active');},{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget||event.relatedTarget===document.documentElement){document.body.classList.remove('pointer-active');resetCard(activeCard);resetMagnet(activeMagnet);activeCard=activeMagnet=null;}},{passive:true});
  document.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse')return;const button=event.target.closest('button,.button,.search-trigger');
    if(!button||button.disabled)return;const rect=button.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*1.55,ripple=document.createElement('span');
    ripple.className='pointer-ripple';ripple.setAttribute('aria-hidden','true');ripple.style.width=ripple.style.height=size+'px';
    ripple.style.left=(event.clientX-rect.left-size/2)+'px';ripple.style.top=(event.clientY-rect.top-size/2)+'px';button.appendChild(ripple);window.setTimeout(()=>ripple.remove(),650);
  },{passive:true});
  window.addEventListener('blur',()=>{document.body.classList.remove('pointer-active');resetCard(activeCard);resetMagnet(activeMagnet);activeCard=activeMagnet=null;});
})();