/* ════════════════════════════════
   WISH JAR — Google Sheets Backend
   Wishes are stored only in Google Sheets (no localStorage)
════════════════════════════════ */
(function() {
  const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzUHDgxAL_kN12wAfmmZKvp7gwi1dtL-w8SxPAab0pwLBBLIuVwsL2dMpYzVrHor-PTIQ/exec';

  let canvas, ctx, fillBar, fillLbl, listWrap, textarea, addBtn, status, nameInput, hiddenList;

  const W=200, H=260;
  const JX=30, JY=40, JW=140, JH=195, JR=22;
  const LX=38, LY=22, LW=124, LH=22, LR=6;
  const FILL_BOT=JY+JH-12, FILL_TOP=JY+10;
  const FILL_H=FILL_BOT-FILL_TOP;
  const MAX_STARS=40;
  const COLORS=['#e8b4a0','#d4907a','#c98a7d','#e8c8a8','#d4aa88',
                '#f0d4c0','#c4785e','#e0b090','#dda888','#f5c8a8'];

  let stars=[], wishes=[], animId, animStart=null;

  /* ── WISH MODAL ── */
  function createWishModal() {
    if (document.getElementById('wishModal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'wishModalOverlay';
    overlay.innerHTML = `
      <div id="wishModal" role="dialog" aria-modal="true" aria-labelledby="wishModalAuthor">
        <button id="wishModalClose" aria-label="Close wish">×</button>
        <div class="wm-stars" aria-hidden="true">
          <span>✦</span><span>✦</span><span>✦</span>
        </div>
        <div class="wm-author-wrap">
          <span class="wm-label">A wish from</span>
          <span class="wm-author" id="wishModalAuthor"></span>
        </div>
        <div class="wm-rule"></div>
        <p class="wm-text" id="wishModalText"></p>
        <div class="wm-rule"></div>
        <span class="wm-date" id="wishModalDate"></span>
      </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      #wishModalOverlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(15, 5, 30, 0.72);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      #wishModalOverlay.open {
        opacity: 1;
        pointer-events: all;
      }
      #wishModal {
        position: relative;
        background: linear-gradient(145deg, #fdf6ee, #f5e8d8);
        border: 1px solid rgba(176,137,104,0.35);
        border-radius: 20px;
        padding: 2.8rem 2.4rem 2.2rem;
        max-width: 420px;
        width: 90%;
        box-shadow:
          0 30px 80px rgba(0,0,0,0.22),
          0 0 0 1px rgba(255,255,255,0.15) inset;
        transform: translateY(22px) scale(0.96);
        transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
        opacity: 0;
        text-align: center;
      }
      body.night #wishModal {
        background: linear-gradient(145deg, #1a0e2e, #120928);
        border-color: rgba(160,120,240,0.3);
      }
      #wishModalOverlay.open #wishModal {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      #wishModalClose {
        position: absolute;
        top: 1rem;
        right: 1.1rem;
        background: none;
        border: none;
        font-size: 1.6rem;
        cursor: pointer;
        color: #c98a7d;
        line-height: 1;
        padding: 0;
        transition: transform 0.2s, color 0.2s;
      }
      #wishModalClose:hover { transform: scale(1.2); color: #c4785e; }
      .wm-stars {
        display: flex;
        justify-content: center;
        gap: 0.55rem;
        margin-bottom: 1.2rem;
      }
      .wm-stars span {
        font-size: 0.7rem;
        color: #d4907a;
        animation: wm-twinkle 2.4s ease-in-out infinite;
      }
      .wm-stars span:nth-child(2) { animation-delay: 0.8s; }
      .wm-stars span:nth-child(3) { animation-delay: 1.6s; }
      @keyframes wm-twinkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.35); }
      }
      .wm-label {
        display: block;
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 0.78rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #c98a7d;
        margin-bottom: 0.3rem;
      }
      body.night .wm-label { color: #a070d0; }
      .wm-author {
        display: block;
        font-family: 'Dancing Script', cursive;
        font-size: 1.9rem;
        font-weight: 600;
        color: #7a4a38;
        line-height: 1.2;
      }
      body.night .wm-author { color: #c8a0f0; }
      .wm-rule {
        height: 1px;
        background: linear-gradient(90deg, transparent, #d4907a55, transparent);
        margin: 1.1rem auto;
        width: 70%;
      }
      body.night .wm-rule {
        background: linear-gradient(90deg, transparent, #a070d055, transparent);
      }
      .wm-text {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 1.22rem;
        font-style: italic;
        line-height: 1.8;
        color: #5a3828;
        margin: 0;
        padding: 0 0.5rem;
      }
      body.night .wm-text { color: #e0caf8; }
      .wm-date {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        color: #b8957a;
        opacity: 0.75;
      }
      body.night .wm-date { color: #9070c0; }

      /* Make wish items clickable */
      .hidden-wish-item {
        cursor: pointer;
        transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
        user-select: none;
      }
      .hidden-wish-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(176,137,104,0.22);
      }
      body.night .hidden-wish-item:hover {
        box-shadow: 0 6px 20px rgba(120,80,220,0.22);
      }
      .hidden-wish-item .wm-peek {
        display: block;
        font-size: 0.72rem;
        font-style: italic;
        opacity: 0.55;
        margin-top: 0.2rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
      }
    `;
    document.head.appendChild(style);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeWishModal();
    });
    document.getElementById('wishModalClose').addEventListener('click', closeWishModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeWishModal();
    });
  }

  function openWishModal(wish) {
    const overlay = document.getElementById('wishModalOverlay');
    if (!overlay) return;
    document.getElementById('wishModalAuthor').textContent = wish.name || 'Someone';
    document.getElementById('wishModalText').textContent = wish.text;
    document.getElementById('wishModalDate').textContent = fmt(wish.ts);
    overlay.classList.add('open');
    document.getElementById('wishModalClose').focus();
  }

  function closeWishModal() {
    const overlay = document.getElementById('wishModalOverlay');
    if (overlay) overlay.classList.remove('open');
  }
  /* ── END MODAL ── */

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

  function renderHiddenList(ws){
    if(!hiddenList) return;
    hiddenList.innerHTML='';

    if(!ws.length){
      hiddenList.innerHTML = `<div class="hidden-wish-item">No wishes yet ✦</div>`;
      return;
    }

    [...ws].reverse().forEach((w, i)=>{
      const item = document.createElement('div');
      item.className = 'hidden-wish-item';
      item.innerHTML = `<span>${w.name || 'Someone'}'s Wish</span>`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Open wish from ${w.name || 'Someone'}`);
      item.addEventListener('click', () => openWishModal(w));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWishModal(w); }
      });
      hiddenList.appendChild(item);
    });
  }

  // Google Sheets Integration
  async function syncWishToSheet(wish){
    try{
      const payload = { name: wish.name, text: wish.text, timestamp: wish.ts };
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
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
      const ts = new Date().toISOString();
      const newWish = { name, text, ts };
      wishes.push(newWish);
      syncWishToSheet(newWish);
      renderList(wishes);
      renderHiddenList(wishes);
      updateFillUI(wishes.length);
      buildStars(wishes.length, false);
      loopFall();
      nameInput.value='';
      textarea.value='';
      status.textContent='Wish saved ✦';
      setTimeout(()=>{ status.textContent=''; }, 2500);
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

    createWishModal();

    addBtn.addEventListener('click', addWish);
    textarea.addEventListener('keydown', e=>{
      if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); addWish(); }
    });

    drawJar();
    wishes = [];
    updateFillUI(0);

    // Load existing wishes from Google Sheets
    loadWishes();
  }

  async function loadWishes(){
    try{
      status.textContent = 'Loading wishes…';
      const res = await fetch(GOOGLE_SHEETS_URL, { method: 'GET' });
      const data = await res.json();
      if(Array.isArray(data) && data.length){
        wishes = data.filter(w => w.name && w.text && w.ts);
        renderList(wishes);
        renderHiddenList(wishes);
        updateFillUI(wishes.length);
        buildStars(wishes.length, true);
      }
      status.textContent = '';
    }catch(err){
      console.error('Failed to load wishes:', err);
      status.textContent = '';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
