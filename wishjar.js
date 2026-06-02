/* ════════════════════════════════
   WISH JAR — Google Sheets Backend
   Wishes are stored only in Google Sheets (no localStorage)
════════════════════════════════ */
(function() {
  const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzUHDgxAL_kN12wAfmmZKvp7gwi1dtL-w8SxPAab0pwLBBLIuVwsL2dMpYzVrHor-PTIQ/exec';

  let canvas, ctx, fillBar, fillLbl, listWrap, textarea, addBtn, status, nameInput, hiddenList;
  let modal, modalContent, modalClose, modalOverlay;

  const W=200, H=260;
  const JX=30, JY=40, JW=140, JH=195, JR=22;
  const LX=38, LY=22, LW=124, LH=22, LR=6;
  const FILL_BOT=JY+JH-12, FILL_TOP=JY+10;
  const FILL_H=FILL_BOT-FILL_TOP;
  const MAX_STARS=40;
  const COLORS=['#e8b4a0','#d4907a','#c98a7d','#e8c8a8','#d4aa88',
                '#f0d4c0','#c4785e','#e0b090','#dda888','#f5c8a8'];

  let stars=[], wishes=[], animId, animStart=null;

  function initElements() {
    canvas   = document.getElementById('wishCanvas');
    if (!canvas) return false;
    ctx      = canvas.getContext('2d');
    fillBar  = document.getElementById('jarFillBar');
    fillLbl  = document.getElementById('jarFillLabel');
    listWrap = document.getElementById('wishListWrap');
    textarea = document.getElementById('wishTextarea');
    addBtn   = document.getElementById('wishAddBtn');
    status   = document.getElementById('wishStatus');
    nameInput = document.getElementById('wishName');
    hiddenList = document.getElementById('wishHiddenList');
    
    // Initialize modal elements
    modal = document.getElementById('wishModal');
    modalContent = document.getElementById('wishModalContent');
    modalClose = document.getElementById('wishModalClose');
    modalOverlay = document.getElementById('wishModalOverlay');
    
    return true;
  }

  function rr(c,x,y,w,h,r){
    c.beginPath();
    c.moveTo(x+r,y); c.lineTo(x+w-r,y);
    c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h);
    c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r);
    c.quadraticCurveTo(x,y,x+r,y);
    c.closePath();
  }

  function starPath(cx,cy,r,rot){
    ctx.beginPath();
    for(let i=0;i<10;i++){
      const a=(i*Math.PI/5)+rot;
      const rad=i%2===0?r:r*0.42;
      const x=cx+Math.cos(a)*rad, y=cy+Math.sin(a)*rad;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();
  }

  function isNightMode(){ return document.body.classList.contains('night'); }

  function drawJar(){
    ctx.clearRect(0,0,W,H);
    ctx.save();
    rr(ctx,JX,JY,JW,JH,JR);
    ctx.clip();
    ctx.fillStyle= isNightMode()?'rgba(20,10,50,0.55)':'rgba(237,226,210,0.55)';
    ctx.fill();
    stars.forEach(s=>{
      ctx.save(); ctx.globalAlpha=s.alpha;
      starPath(s.x,s.y,s.r,s.rot);
      ctx.fillStyle=s.color; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.35)';
      ctx.lineWidth=0.5; ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

    rr(ctx,JX,JY,JW,JH,JR);
    ctx.strokeStyle= isNightMode()?'rgba(160,120,240,0.45)':'rgba(176,137,104,0.55)';
    ctx.lineWidth=1.5; ctx.stroke();

    ctx.save();
    rr(ctx,JX+8,JY+8,16,JH-16,8);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fill();
    ctx.restore();

    rr(ctx,LX,LY,LW,LH,LR);
    ctx.fillStyle= isNightMode()?'rgba(80,40,160,0.85)':'rgba(176,137,104,0.85)';
    ctx.fill();
    ctx.strokeStyle= isNightMode()?'rgba(120,80,220,0.5)':'rgba(130,95,65,0.6)';
    ctx.lineWidth=1; ctx.stroke();
    rr(ctx,LX+10,LY+4,30,8,4);
    ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fill();
  }

  function fillRatio(n){ return n===0?0:Math.min(0.08+n*0.055,0.96); }

  function updateFillUI(n){
    const r=fillRatio(n);
    fillBar.style.width=(r*100)+'%';
    fillLbl.textContent=n===0?'empty — add a wish!':n===1?'1 wish inside':`${n} wishes inside`;
  }

  function buildStars(count, instant){
    const needed=Math.round(fillRatio(count)*MAX_STARS);
    if(instant){
      stars=[];
      const r=fillRatio(count), fp=r*FILL_H, fy=FILL_BOT-fp;
      for(let i=0;i<needed;i++){
        const x=JX+18+Math.random()*(JW-36);
        const y=fy+Math.random()*Math.max(fp-10,1)+5;
        stars.push({x,y,targetY:y,r:3.5+Math.random()*3.5,
          rot:Math.random()*Math.PI*2,rotSpeed:(Math.random()-.5)*.008,
          color:COLORS[Math.floor(Math.random()*COLORS.length)],
          alpha:1,falling:false,speed:0,delay:0});
      }
      drawJar();
      loopIdle();
      return;
    }
    const existing=stars.length;
    if(needed<=existing) return;
    const r=fillRatio(count), fp=r*FILL_H, fy=FILL_BOT-fp;
    for(let i=existing;i<needed;i++){
      const x=JX+18+Math.random()*(JW-36);
      stars.push({x,y:JY-20,targetY:fy+Math.random()*Math.max(fp-10,1)+5,
        r:3.5+Math.random()*3.5,rot:Math.random()*Math.PI*2,
        rotSpeed:(Math.random()-.5)*.08,
        color:COLORS[Math.floor(Math.random()*COLORS.length)],
        alpha:0,falling:true,speed:2.5+Math.random()*2,delay:(i-existing)*55});
    }
  }

  function loopIdle(){
    cancelAnimationFrame(animId);
    function tick(){
      stars.forEach(s=>{s.rot+=s.rotSpeed;});
      drawJar();
      animId=requestAnimationFrame(tick);
    }
    animId=requestAnimationFrame(tick);
  }

  function loopFall(){
    cancelAnimationFrame(animId);
    animStart=null;
    function tick(ts){
      if(!animStart) animStart=ts;
      const el=ts-animStart;
      let any=false;
      stars.forEach(s=>{
        if(el<s.delay) return;
        if(s.falling){
          any=true;
          s.y+=s.speed; s.rot+=s.rotSpeed;
          s.alpha=Math.min(s.alpha+0.06,1);
          if(s.y>=s.targetY){s.y=s.targetY;s.falling=false;}
        } else { s.rot+=s.rotSpeed*0.12; }
      });
      drawJar();
      if(any) animId=requestAnimationFrame(tick);
      else loopIdle();
    }
    animId=requestAnimationFrame(tick);
  }

  function fmt(ts){
    return new Date(ts).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
  }

  function renderList(ws){
    listWrap.innerHTML='';
    [...ws].reverse().forEach(w=>{
      const d=document.createElement('div');
      d.className='wish-item-card';
      d.innerHTML=`<div class="wish-dot-mark"></div><div class="wish-text-body">${w.text}</div><div class="wish-date-stamp">${fmt(w.ts)}</div>`;
      listWrap.appendChild(d);
    });
  }

  function openWishModal(wish){
    if(!modal || !modalContent || !modalOverlay) return;
    
    modalContent.innerHTML=`
      <div class="modal-wish-header">
        <h2>${wish.name || 'Someone'}'s Wish</h2>
        <span class="modal-wish-date">${fmt(wish.ts)}</span>
      </div>
      <div class="modal-wish-text">
        ${wish.text}
      </div>
    `;
    
    modalOverlay.classList.add('active');
  }

  function closeWishModal(){
    if(!modalOverlay) return;
    modalOverlay.classList.remove('active');
  }

  function renderHiddenList(ws){
    if(!hiddenList) return;

    hiddenList.innerHTML='';

    if(!ws.length){
      hiddenList.innerHTML = `
        <div class="hidden-wish-item">
          No wishes yet ✦
        </div>
      `;
      return;
    }

    [...ws].reverse().forEach(w=>{
      const item=document.createElement('div');
      item.className='hidden-wish-item';
      item.style.cursor='pointer';
      
      item.innerHTML=`
        ${w.name || 'Someone'}'s Wish
      `;
      
      item.addEventListener('click', ()=>{
        openWishModal(w);
      });

      hiddenList.appendChild(item);
    });
  }

  // Google Sheets Integration
  async function syncWishToSheet(wish){
    try{
      const payload = {
        name: wish.name,
        text: wish.text,
        date: fmt(wish.ts),
        timestamp: wish.ts
      };

      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Wish synced to Google Sheets');
      return true;
    }catch(err){
      console.error('Failed to sync wish to Google Sheets:', err);
      return false;
    }
  }

  function addWish(){
    const name = nameInput.value.trim();
    const text = textarea.value.trim();

    if(!name || !text){
      status.textContent='Please enter your name and a wish.';
      return;
    }

    addBtn.disabled=true;
    status.textContent='Saving…';

    try{
      const ts=new Date().toISOString();
      const newWish = { name, text, ts };

      // Add new wish to in-memory array
      wishes.push(newWish);

      // Sync to Google Sheets
      syncWishToSheet(newWish);

      renderList(wishes);
      renderHiddenList(wishes);

      updateFillUI(wishes.length);
      buildStars(wishes.length,false);
      loopFall();

      nameInput.value='';
      textarea.value='';

      status.textContent='Wish saved ✦';

      setTimeout(()=>{
        status.textContent='';
      },2500);

    }catch(err){
      console.error(err);
      status.textContent='Could not save wish. Please try again.';
    }

    addBtn.disabled=false;
    textarea.focus();
  }

  function init() {
    if (!initElements()) {
      console.error('Wish jar elements not found. Retrying...');
      setTimeout(init, 100);
      return;
    }

    addBtn.addEventListener('click',addWish);
    textarea.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addWish();}
    });

    // Modal event listeners - fixed to prevent stopping clicks on inputs
    if(modalClose){
      modalClose.addEventListener('click',closeWishModal);
    }
    
    // Close modal only when clicking on the overlay background, not the modal itself
    if(modalOverlay){
      modalOverlay.addEventListener('click',(e)=>{
        if(e.target === modalOverlay) {
          closeWishModal();
        }
      });
    }

    drawJar();

    // Start with empty wishes array (no localStorage)
    wishes = [];
    updateFillUI(0);
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
