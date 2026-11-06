import Phaser from 'phaser';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Project-authored geometry for the synthetic comparison; no game rules live here.
const spaces = [
  { name: 'Quảng trường', tag: 'BẮT ĐẦU', color: 0xf7dfb5, css: '#f7dfb5', x: 32, y: 32 },
  { name: 'Vườn phố', tag: 'DỪNG CHÂN', color: 0xd7e9c5, css: '#d7e9c5', x: 330, y: 32 },
  { name: 'Phố Hà Nội', tag: 'MỘT GÓC PHỐ', color: 0xf4cdb9, css: '#f4cdb9', x: 330, y: 330 },
  { name: 'Bến Cần Thơ', tag: 'BẾN NƯỚC', color: 0xc8e2df, css: '#c8e2df', x: 32, y: 330 },
];
const center = (position, id) => ({ x: spaces[position].x + (id === 'host' ? 90 : 150), y: spaces[position].y + 174 });
const labels = { host: 'Mai', guest: 'Nam' };
const $ = (id) => document.getElementById(id);
const h = React.createElement;
const rect = (x, y, width, height, fill, rx = 18) => h('rect', { x, y, width, height, fill, rx });
let snapshot, visual, motion, scene;
const root = createRoot($('react-board'));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function ReactBoard({ view }) {
  return h('svg', { viewBox: '0 0 600 600', xmlns: 'http://www.w3.org/2000/svg' },
    rect(0, 0, 600, 600, '#d8e9d9', 0),
    ...spaces.map((s) => h('g', { key: s.name }, rect(s.x, s.y, 238, 238, s.css, 25),
      h('text', { x: s.x + 22, y: s.y + 34, fill: '#915d4b', fontWeight: 800, fontSize: 13 }, s.tag),
      h('text', { x: s.x + 22, y: s.y + 63, fill: '#294b3f', fontWeight: 800, fontSize: 22 }, s.name),
      h('path', { d: `M ${s.x+76} ${s.y+126} l 43 -38 l 43 38 v 30 h -86 z`, fill: '#fff7e5', stroke: '#b67355', strokeWidth: 5, strokeLinejoin: 'round' }), rect(s.x+107, s.y+125, 24, 31, '#b67355', 5))),
    h('circle', { cx: 300, cy: 300, r: 42, fill: '#286b5b', stroke: '#f8f4e9', strokeWidth: 6 }),
    h('text', { x: 300, y: 295, textAnchor: 'middle', fill: '#fdf6e8', fontSize: 20 }, '✿'),
    h('text', { x: 300, y: 317, textAnchor: 'middle', fill: '#fdf6e8', fontWeight: 800, fontSize: 12 }, 'XÓM NHỎ'),
    ...Object.entries(view).map(([id, p]) => h('g', { key: id, 'data-token': id, transform: `translate(${p.x} ${p.y})` },
      h('circle', { r: 20, fill: id === 'host' ? '#dc7256' : '#397d79', stroke: '#fffdf6', strokeWidth: 5 }),
      h('text', { y: 6, textAnchor: 'middle', fill: 'white', fontWeight: 800, fontSize: 17 }, id === 'host' ? 'M' : 'N'))));
}
class BoardScene extends Phaser.Scene {
  create() {
    scene = this; const g = this.add.graphics(); g.fillStyle(0xd8e9d9); g.fillRect(0, 0, 600, 600);
    for (const s of spaces) {
      g.fillStyle(s.color); g.fillRoundedRect(s.x, s.y, 238, 238, 25);
      this.add.text(s.x+22, s.y+20, s.tag, { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#915d4b' });
      this.add.text(s.x+22, s.y+42, s.name, { fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#294b3f' });
      g.fillStyle(0xfff7e5); g.lineStyle(5, 0xb67355); g.beginPath(); g.moveTo(s.x+76, s.y+126); g.lineTo(s.x+119, s.y+88); g.lineTo(s.x+162, s.y+126); g.lineTo(s.x+162, s.y+156); g.lineTo(s.x+76, s.y+156); g.closePath(); g.fillPath(); g.strokePath();
      g.fillStyle(0xb67355); g.fillRoundedRect(s.x+107, s.y+125, 24, 31, 5);
    }
    g.fillStyle(0xf8f4e9); g.fillCircle(300,300,45); g.fillStyle(0x286b5b); g.fillCircle(300,300,39);
    this.add.text(300,289,'✿',{ fontFamily:'Arial', fontSize:'20px', color:'#fdf6e8' }).setOrigin(.5);
    this.add.text(300,311,'XÓM NHỎ',{ fontFamily:'Arial', fontSize:'12px', fontStyle:'bold', color:'#fdf6e8' }).setOrigin(.5);
    this.tokens = {};
    for (const [id,color] of [['host',0xdc7256],['guest',0x397d79]]) {
      const disk=this.add.circle(0,0,20,color).setStrokeStyle(5,0xfffdf6);
      const letter=this.add.text(0,0,id==='host'?'M':'N',{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
      this.tokens[id]=this.add.container(0,0,[disk,letter]);
    }
    const renderer = this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas';
    $('renderer-info').textContent = renderer === 'webgl' ? 'WebGL' : 'Canvas'; $('renderer-info').dataset.renderer = renderer;
    if (visual) render();
  }
}
const mode = new URLSearchParams(location.search).get('renderer');
new Phaser.Game({ type: mode === 'canvas' ? Phaser.CANVAS : mode === 'webgl' ? Phaser.WEBGL : Phaser.AUTO,
  parent: 'phaser-board', width: 600, height: 600, backgroundColor: '#d8e9d9',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: BoardScene, banner: false, audio: { noAudio: true } });
function render() {
  if (!visual) return;
  if (scene) {
    for (const [id, p] of Object.entries(visual)) scene.tokens[id].setPosition(p.x, p.y);
    $('phaser-board').dataset.actualX = scene.tokens.host.x.toFixed(1);
    $('phaser-board').dataset.actualY = scene.tokens.host.y.toFixed(1);
  }
  root.render(h(ReactBoard, { view: visual }));
  for (const id of ['phaser-board', 'react-board']) $(id).dataset.hostPosition = snapshot.turn.seats[0].position;
  $('space-list').replaceChildren(...spaces.map((space, index) => {
    const item = document.createElement('li'); const occupants = snapshot.turn.seats.filter((seat) => seat.position === index).map((seat) => labels[seat.id]);
    item.textContent = `${index+1}. ${space.name}${occupants.length ? ` · ${occupants.join(', ')}` : ''}`; return item;
  }));
  const host = snapshot.turn.seats[0]; const dice = snapshot.events?.[0]?.dice;
  $('result-title').textContent = `Mai đang ở ${spaces[host.position].name}`;
  $('result-copy').textContent = dice ? `Máy chủ xác nhận: ${dice.join(' + ')} · lượt ${snapshot.revision}.` : 'Chờ máy chủ xác nhận lần gieo.';
  $('dice').setAttribute('aria-label', dice ? `Xúc xắc: ${dice.join(' và ')}` : 'Chưa gieo xúc xắc');
  $('dice').replaceChildren(...(dice ?? ['?','?']).map((value) => { const el=document.createElement('span'); el.textContent=value; return el; }));
  $('roll').disabled = snapshot.turn.phase !== 'AwaitRoll'; document.body.dataset.revision = snapshot.revision;
  for (const id of ['phaser-board', 'react-board']) { $(id).dataset.visualX = visual.host.x.toFixed(1); $(id).dataset.visualY = visual.host.y.toFixed(1); }
}
function finishMotion() {
  if (!motion) return;
  cancelAnimationFrame(motion.frame); visual.host = center(snapshot.turn.seats[0].position, 'host'); motion = undefined; render();
}
function move(from, to) {
  finishMotion();
  if (reduced.matches || from === to) { visual.host = center(to, 'host'); render(); return; }
  const path=[]; let cursor=from; while (cursor !== to) { cursor=(cursor+1)%spaces.length; path.push(cursor); }
  const start=performance.now(), duration=path.length*500; let frames=0;
  const frame=(now) => {
    const progress=Math.min((now-start)/duration,1), n=Math.min(Math.floor(progress*path.length),path.length-1);
    const a=center(n===0?from:path[n-1],'host'), b=center(path[n],'host'); const t=progress===1?1:progress*path.length-n;
    frames += 1; visual.host={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}; render();
    if (progress < 1) motion.frame=requestAnimationFrame(frame); else { document.body.dataset.motionFrames = frames; document.body.dataset.motionMs = Math.round(now-start); motion=undefined; }
  };
  motion={frame:requestAnimationFrame(frame)};
}
async function api(path, options) { const response=await fetch(path,options); if(!response.ok) throw Error('Không kết nối được bàn thử'); return response.json(); }
$('roll').addEventListener('click', async () => {
  $('roll').disabled=true;
  try {
    const before=snapshot.turn.seats[0].position;
    const result=await api('/api/roll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),expectedRevision:snapshot.revision})});
    if(result.revision<=snapshot.revision) return;
    snapshot=result; render(); $('announcement').textContent=`Máy chủ gieo ${result.events[0].dice.join(' và ')}. Mai đến ${spaces[result.turn.seats[0].position].name}.`;
    move(before,result.turn.seats[0].position);
  } catch(error) { $('result-copy').textContent=error.message; $('roll').disabled=false; }
});
$('skip').addEventListener('click',finishMotion);
$('reset').addEventListener('click',async () => {
  try { finishMotion(); snapshot=await api('/api/reset',{method:'POST'}); visual=Object.fromEntries(snapshot.turn.seats.map((seat)=>[seat.id,center(seat.position,seat.id)])); render(); $('announcement').textContent='Đã trở về đầu lượt mẫu.'; }
  catch(error) { $('result-copy').textContent=error.message; }
});
reduced.addEventListener('change',()=>{if(reduced.matches) finishMotion();});
snapshot=await api('/api/state'); visual=Object.fromEntries(snapshot.turn.seats.map((seat)=>[seat.id,center(seat.position,seat.id)])); render();
