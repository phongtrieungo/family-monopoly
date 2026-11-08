/* ST-501 original design demonstration. All state is ephemeral and illustrative.
   No game module, API, network request, persistent storage or transaction. */
'use strict';
const $ = (selector) => document.querySelector(selector);
const labels = [
  'Quảng trường sum vầy','Ngõ hoa Hà Nội','Chuyện xóm mình','Sân nhỏ Hà Nội','Quỹ hạ tầng',
  'Bến xe Bắc','Phố đèn Hải Phòng','Bước ngoặt','Chợ sớm Hải Phòng','Hiên nhà Hải Phòng',
  'Nhà chờ','Vườn nhà Huế','Trạm điện khu phố','Ngõ tím Huế','Sân vườn Huế','Bến xe Trung',
  'Hiên nắng Đà Nẵng','Chuyện xóm mình','Chợ chiều Đà Nẵng','Phố gió Đà Nẵng','Vườn nghỉ',
  'Đồi hoa Đà Lạt','Bước ngoặt','Ngõ thông Đà Lạt','Sân mây Đà Lạt','Bến xe Cao Nguyên',
  'Chợ nổi Cần Thơ','Ngõ nước Cần Thơ','Trạm nước khu phố','Hiên sông Cần Thơ','Đến nhà chờ',
  'Phố sáng Sài Gòn','Ngõ vui Sài Gòn','Chuyện xóm mình','Sân chung Sài Gòn','Bến xe Nam',
  'Bước ngoặt','Vườn biển Phú Quốc','Phí cảnh quan','Hiên biển Phú Quốc'
];
const streetData = [
  [1,1,80,40,[4,8,20,60,180,280,400]],[3,1,100,40,[6,12,30,90,220,340,480]],
  [6,2,120,60,[8,16,40,120,300,420,560]],[8,2,120,60,[8,16,40,120,300,420,560]],[9,2,140,60,[10,20,50,150,340,460,620]],
  [11,3,160,80,[12,24,60,180,400,540,700]],[13,3,160,80,[12,24,60,180,400,540,700]],[14,3,180,80,[14,28,70,210,440,580,760]],
  [16,4,200,100,[16,32,80,240,500,660,840]],[18,4,200,100,[16,32,80,240,500,660,840]],[19,4,220,100,[18,36,90,270,540,700,900]],
  [21,5,240,120,[20,40,100,300,600,780,980]],[23,5,240,120,[20,40,100,300,600,780,980]],[24,5,260,120,[22,44,110,330,640,820,1040]],
  [26,6,280,140,[24,48,120,360,700,900,1120]],[27,6,280,140,[24,48,120,360,700,900,1120]],[29,6,300,140,[26,52,130,390,740,940,1180]],
  [31,7,320,160,[28,56,140,420,800,1020,1260]],[32,7,320,160,[28,56,140,420,800,1020,1260]],[34,7,340,160,[30,60,150,450,840,1060,1320]],
  [37,8,360,180,[34,68,170,510,920,1160,1440]],[39,8,400,180,[40,80,200,600,1040,1300,1600]]
];
const groupColors = ['#bd9474','#84acb4','#b392ab','#d9aa6a','#92aa79','#72a99b','#b4a261','#7996b6'];
const boardSpaces = labels.map((name, index) => {
  const street = streetData.find(([position]) => position === index);
  const transit = [5,15,25,35].includes(index), service = [12,28].includes(index);
  return { id:`VN-S${String(index).padStart(2,'0')}`, index, name, street, transit, service,
    price:street?.[2] ?? (transit ? 180 : service ? 140 : null), color:street ? groupColors[street[1]-1] : '#c9c5ac' };
});
const people = [
  {name:'An',icon:'✿',piece:'Bông hoa',cash:1040,count:3,color:'#b75c45',bg:'#f2d6c5',position:1},
  {name:'Bình',icon:'◈',piece:'Cánh diều',cash:1280,count:4,color:'#347b79',bg:'#d5e7df',position:14},
  {name:'Chi',icon:'♧',piece:'Lá non',cash:960,count:2,color:'#7a6991',bg:'#e4ddef',position:24},
  {name:'Dũng',icon:'⛵',piece:'Thuyền buồm',cash:1120,count:3,color:'#9b7828',bg:'#eee2af',position:33}
];
const fixtureNames = {table:'Bàn chơi',purchase:'Mua đất',auction:'Đấu giá',setup:'Chuẩn bị',trade:'Trao đổi',debt:'Khoản nợ',victory:'Kết thúc',recovery:'Khôi phục'};
let fixture = 'table', stage = 'handoff', motionTimer, toastTimer, sound = false, audioContext;
let bid = 130, leading = people[2].name, bidder = 1, bidderReady = false, passes = 0, bought = false, debtRemaining = 60;
const money = (value) => value.toLocaleString('vi-VN');
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function notify(message){$('#announcement').textContent=message;$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4200);}
function beep(){if(!sound)return;try{audioContext ??= new (window.AudioContext || window.webkitAudioContext)();audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.type='sine';oscillator.frequency.setValueAtTime(520,audioContext.currentTime);gain.gain.setValueAtTime(.04,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.12);oscillator.start();oscillator.stop(audioContext.currentTime+.13);}catch{notify('Thiết bị chưa hỗ trợ hiệu ứng âm thanh. Phần chữ vẫn hiển thị đầy đủ.');}}
function renderPlayers(){
 const turnOwner = fixture === 'table' && ['next','rent'].includes(stage) ? 1 : 0;
  $('#players').innerHTML=people.map((p,i)=>`<article class="player ${i===turnOwner?'active':''}" style="--player-bg:${p.bg};--player-color:${p.color}" aria-label="${escape(p.name)}, ${p.piece}, ${money(p.cash-(i===0&&bought?80:0))} xu, ${p.count+(i===0&&bought?1:0)} tài sản${i===turnOwner?', chủ lượt':''}">${i===turnOwner?'<span class="turn-marker">ĐANG ĐẾN LƯỢT</span>':''}<div class="player-avatar" aria-hidden="true">${p.icon}</div><div class="player-info"><div class="player-name">${escape(p.name)}<small>${p.piece}</small></div><div class="player-cash">${money(p.cash-(i===0&&bought?80:0))} <small>xu</small></div><div class="player-colorbar"></div></div><div class="player-properties">${p.count+(i===0&&bought?1:0)} tài sản</div></article>`).join('');
}
// Original shallow-oblique geometry. Floor transforms; lettering and structures stay upright.
const point=(x,y)=>[173+x*.97-y*.17,65+x*.115+y*.65];
const coords=(points)=>points.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const poly=(points,fill,stroke='#8a92652e',width=1)=>`<polygon points="${coords(points)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const floor=(x,y,w,h,fill,stroke)=>poly([point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)],fill,stroke);
function tree(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cx="3" cy="3" rx="15" ry="6" fill="#4f674525"/><path d="M0 1V-25" stroke="#8e7050" stroke-width="5"/><ellipse cx="0" cy="-31" rx="17" ry="21" fill="#65875b"/><ellipse cx="-5" cy="-38" rx="13" ry="16" fill="#8da76d"/><path d="M-7-46Q-13-37-11-31" fill="none" stroke="#b4c18b" stroke-width="3" stroke-linecap="round"/></g>`;}
function building(x,y,scale=1,color='#e9cf91',roof='#b5674b',sign=''){return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cx="7" cy="4" rx="34" ry="9" fill="#41513920"/><path d="M-27-2V-48L12-42V4Z" fill="${color}" stroke="#a4866022"/><path d="M12 4V-42L32-53V-7Z" fill="#b6b18d"/><path d="M-33-48L-14-70L39-60L14-39Z" fill="${roof}"/><path d="M-33-48L14-39V-32L-33-41Z" fill="#9a634b"/><path d="M14-39L39-60V-53L14-32Z" fill="#85583f"/><path d="M-23-12V-29L-13-27V-10Z M-6-8V-26L5-24V-6Z" fill="#708f83"/><path d="M-23-12L-13-10M-18-28V-11M-6-8L5-6M0-25V-7" fill="none" stroke="#eddfb9" stroke-width="2"/><path d="M18-10V-28L26-33V-15Z" fill="#7a8c73"/><path d="M-28-30L14-23L18-32L-24-39Z" fill="#f2e2b8"/><path d="M-28-30L-21-29L-17-38L-24-39ZM-14-27L-7-26L-3-35L-10-36ZM0-25L7-24L11-33L4-34Z" fill="${roof}"/>${sign?`<rect x="-23" y="-49" width="31" height="10" rx="2" fill="#faf0d0"/><text x="-8" y="-42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="5.5" font-weight="800" fill="#6b674b">${sign}</text>`:''}</g>`;}
function token(x,y,index){const p=people[index];const shape=index===0?'<path d="M0-27C-9-43-20-25-7-21C-22-13-10-2-1-15C4 1 19-12 6-20C23-26 8-40 0-27" fill="#d87c63" stroke="#fff2d3" stroke-width="2"/><circle cy="-21" r="5" fill="#f1d48c"/>':index===1?'<path d="M0-45L15-27L0-10L-15-27Z" fill="#66a9a3" stroke="#f0edcc" stroke-width="2"/><path d="M0-43V-11M-13-27H13M0-11Q-10-4 0 1" fill="none" stroke="#f5e4ac" stroke-width="2"/>':index===2?'<path d="M0-11C-31-29-5-51 2-26C24-46 28-16 0-11" fill="#9681ae" stroke="#f3e4f1" stroke-width="2"/><path d="M0-3V-24" stroke="#ede7bd" stroke-width="3"/>':'<path d="M-19-13H21L12-2H-9Z" fill="#b88b35" stroke="#f1d28a" stroke-width="2"/><path d="M0-16V-47L18-19Z" fill="#f3e3b2" stroke="#a17e34" stroke-width="2"/><path d="M-4-18V-37L-17-18Z" fill="#d9b75e"/>';
 return `<g class="board-token token-${index}" transform="translate(${x} ${y})"><ellipse cy="4" rx="22" ry="8" fill="#404d3a30"/><ellipse cy="0" rx="18" ry="7" fill="${p.color}" stroke="#fff5dd" stroke-width="2"/>${shape}</g>`;}
function boardTile(index){const space=boardSpaces[index];let x,y;if(index<=10){x=(10-index)*65;y=650;}else if(index<=20){x=0;y=(20-index)*65;}else if(index<=30){x=(index-20)*65;y=0;}else{x=650;y=(index-30)*65;}
 const center=point(x+32.5,y+35);let svg=`<g id="space-${space.id}" data-space-id="${space.id}"><title>${index+1}. ${space.name}</title>${floor(x+1,y+1,63,63,index===1?'#fff0c7':'#f6f0da','#b6b393')}`;
 if(space.street){svg+=floor(x+4,y+4,57,8,space.color);if([3,6,11,14,16,21,24,27,31,34,37].includes(index)){const b=point(x+31,y+29);svg+=building(b[0],b[1],.48+(index%3)*.05,'#e4d19c',['#ae6e50','#789185','#bd9670'][index%3]);}else{svg+=`<path d="M${center[0]-8} ${center[1]-11}h17" stroke="${space.color}" stroke-width="5" stroke-linecap="round"/>`;}}
 else {const icon=[0,10,20,30].includes(index)?({0:'⌂',10:'▥',20:'♧',30:'↶'})[index]:space.transit?'▰':space.service?'⚙':[2,17,33].includes(index)?'✉':[7,22,36].includes(index)?'✦':'◈';svg+=`<text x="${center[0]}" y="${center[1]-4}" font-family="system-ui,sans-serif" font-size="21" fill="${index===0?'#b56d46':'#7c8c6c'}" text-anchor="middle">${icon}</text>`;}
 const shortNames={0:'SUM VẦY',1:'NGÕ HOA',3:'SÂN NHỎ',5:'BẾN BẮC',6:'PHỐ ĐÈN',8:'CHỢ SỚM',9:'HIÊN NHÀ',10:'NHÀ CHỜ',11:'VƯỜN HUẾ',13:'NGÕ TÍM',14:'SÂN VƯỜN',15:'BẾN TRUNG',16:'HIÊN NẮNG',18:'CHỢ CHIỀU',19:'PHỐ GIÓ',20:'VƯỜN NGHỈ',21:'ĐỒI HOA',23:'NGÕ THÔNG',24:'SÂN MÂY',25:'CAO NGUYÊN',26:'CHỢ NỔI',27:'NGÕ NƯỚC',29:'HIÊN SÔNG',30:'ĐẾN NHÀ CHỜ',31:'PHỐ SÁNG',32:'NGÕ VUI',34:'SÂN CHUNG',35:'BẾN NAM',37:'VƯỜN BIỂN',39:'HIÊN BIỂN'};
 svg+=`<text x="${center[0]}" y="${center[1]+14}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="6.4" font-weight="750" fill="#5b6552">${shortNames[index]??(space.service?'DỊCH VỤ':index===4||index===38?'QUỸ PHỐ':'CHUYỆN PHỐ')}</text><text x="${center[0]}" y="${center[1]+23}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="6.5" fill="#7b7c61">${space.price?space.price+' xu':String(index+1).padStart(2,'0')}</text></g>`;
 return {svg,x,y};}
function renderBoard(){
 let svg=`<defs><linearGradient id="board-edge" x2="0" y2="1"><stop stop-color="#b19a69"/><stop offset="1" stop-color="#8d8054"/></linearGradient><linearGradient id="pond" x2="0" y2="1"><stop stop-color="#a4c2b0"/><stop offset="1" stop-color="#72a89a"/></linearGradient></defs>`;
 const a=point(-10,-10),b=point(725,-10),c=point(725,725),d=point(-10,725);
 svg+=`<ellipse cx="490" cy="577" rx="375" ry="48" fill="#8c906236"/>`;
 svg+=poly([d,c,[c[0],c[1]+18],[d[0],d[1]+18]],'url(#board-edge)','#83774f');svg+=poly([b,c,[c[0],c[1]+18],[b[0],b[1]+18]],'#99865a','#83774f');
 svg+=poly([a,b,c,d],'#c6cba7','#a3a67b',3);svg+=floor(67,67,580,580,'#d7dbb6','#b6bd91');
 // Paths, a quiet pond and a planted central square connect the miniature street fronts.
 svg+=floor(104,104,507,507,'#dce0be','#c1c69e');svg+=floor(120,273,460,37,'#efe5c8','#c5c29d');svg+=floor(344,121,34,475,'#eee4c7','#c5c29d');
 svg+=floor(144,357,155,118,'url(#pond)','#88ab98');svg+=floor(151,364,140,101,'#91b7a6','#bed0b0');
 for(let i=0;i<5;i++){const w=point(161+i*20,410);svg+=`<path d="M${w[0]} ${w[1]}l22 3" stroke="#c4d8c0" stroke-width="2" stroke-linecap="round"/>`;}
 svg+=floor(322,365,72,18,'#b79b6b','#a18a61');
 const tiles=boardSpaces.map((_,i)=>boardTile(i));for(const tile of tiles)svg+=tile.svg;
 const structures=[ [158,190,.95,'#edcd92','#bd7957','TIỆM TRÀ'],[239,203,1.12,'#dfd3a4','#7d9486','NHÀ HOA'],[438,181,1.05,'#dfb999','#aa6f52','GÓC PHỐ'],[529,204,.9,'#e2d3a0','#729387','BÁNH MÌ'],[440,460,1.2,'#e5cd95','#b77551','CHỢ NHỎ'],[544,471,.95,'#dbd0ac','#87977b','CÀ PHÊ'],[440,558,.8,'#e5c4a0','#aa7359','SÁCH'] ];
 for(const [x,y,s,col,roof,sign]of structures){const p=point(x,y);svg+=building(p[0],p[1],s,col,roof,sign);}
 for(const [x,y,s]of [[107,120,.9],[295,139,.8],[559,125,.9],[115,257,.8],[561,310,.7],[583,390,.8],[110,543,.9],[203,564,.8],[287,542,.7],[566,584,.9],[403,324,.65],[297,338,.6]]){const p=point(x,y);svg+=tree(p[0],p[1],s);}
 const plaza=point(348,313);svg+=`<g transform="translate(${plaza[0]} ${plaza[1]})"><ellipse rx="27" ry="13" fill="#bdbe99" stroke="#eeebcc" stroke-width="4"/><ellipse cy="-7" rx="16" ry="7" fill="#d0c59a"/><path d="M0-9V-34" stroke="#baac7f" stroke-width="7"/><ellipse cy="-35" rx="10" ry="5" fill="#e8dcb5"/></g>`;
 const brand=point(359,243);svg+=`<g transform="translate(${brand[0]} ${brand[1]}) rotate(7)"><text text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="30" fill="#41684b">Phố Nhà Mình</text><text y="18" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7.5" font-weight="650" letter-spacing="2.2" fill="#7f8965">ĐI MỘT VÒNG · GẦN NHAU HƠN</text></g>`;
 const positions=people.map((p,i)=>i===0&&['roll','rolling'].includes(stage)?38:p.position);positions.forEach((position,i)=>{const t=tiles[position];const p=point(t.x+33,t.y+32);svg+=token(p[0],p[1],i);});
 if(bought){const t=tiles[1],p=point(t.x+32,t.y+65);svg+=`<path d="M${p[0]-17} ${p[1]+2}l34 4" stroke="#b75c45" stroke-width="5" stroke-linecap="round"/>`;}
 $('#board').innerHTML=svg;
}
function propertyArt(){return `<div class="property-art"><span class="property-tag">MỘT GÓC HÀ NỘI</span><svg viewBox="0 0 320 140" aria-hidden="true"><path d="M0 112L150 82L320 108V140H0Z" fill="#ccd4af"/><path d="M30 130L165 99L290 122" fill="none" stroke="#eee6c8" stroke-width="18"/>${building(130,111,1.06,'#ead29d','#bc7955','NHÀ HOA')}${building(199,106,.83,'#e2c9a3','#80988a','TIỆM TRÀ')}${tree(65,112,.77)}${tree(258,118,.9)}<path d="M130 126l31 4" stroke="#a99268" stroke-width="3" stroke-linecap="round"/></svg></div>`;}
const header=(eyebrow,title,lead,icon='✦')=>`<div class="decision-header"><span class="step-mark" aria-hidden="true">${icon}</span><span class="eyebrow">${eyebrow}</span></div><h2 id="decision-heading" tabindex="-1">${title}</h2><p class="lead">${lead}</p>`;
const action=(name,text,kind='primary')=>`<button class="${kind}" data-action="${name}">${text}</button>`;
function setDock(eyebrow,title,note,button,disabled=false){$('#dock-eyebrow').textContent=eyebrow;$('#dock-title').textContent=title;$('#dock-note').textContent=note;$('#dock-action').textContent=button;$('#dock-action').disabled=disabled;}
function renderDecision(){
 let html='';
 setDock(`LƯỢT CỦA ${people[0].name.toUpperCase()} · BÔNG HOA`,'Cả khu phố đang chờ bạn','Người cầm máy: chưa xác nhận',`Tôi là ${people[0].name} · nhận máy`);
 if(fixture==='table'){
  if(stage==='handoff')html=header('MỘT CHIỀU QUANH PHỐ','Đến lượt bạn, '+escape(people[0].name)+'!','Cầm máy, ngắm phố và bắt đầu một vòng khám phá.','☀')+propertyArt()+`<div class="neighborhood-card"><span class="mini-label">MỘT BÀN · BỐN NGƯỜI</span><h3>Chuyện vui còn ở phía trước</h3><p>Mỗi người một góc phố. Cùng mua đất, xây nhà và trao đổi để khu phố thêm nhộn nhịp.</p></div><div class="decision-actions">${action('receive','Tôi là '+escape(people[0].name)+' · nhận máy')}</div><p class="decision-foot">Xác nhận người cầm máy trước mỗi lượt.</p>`;
  else if(stage==='roll'||stage==='rolling'){
   setDock('NGƯỜI CẦM MÁY: '+people[0].name.toUpperCase(),'Đi thôi, phố đang chờ!','Mẫu xúc xắc đã chọn sẵn: 1 + 2.',stage==='rolling'?'Hiện kết quả ngay':'Gieo xúc xắc');
   html=header('LƯỢT ĐÃ NHẬN','Đi một vòng phố','Kết quả minh họa: 1 + 2 = 3 bước. Bạn luôn có thể bỏ qua chuyển động.','⚄')+`<div class="dice ${stage==='rolling'?'rolling':''}" aria-label="Xúc xắc minh họa một và hai"><span class="die">⚀</span><span class="die">⚁</span></div><div class="neighborhood-card"><span class="mini-label">ĐIỂM ĐẾN MINH HỌA</span><h3>Ngõ hoa Hà Nội</h3><p>Từ ô Phí cảnh quan, đi 3 bước tới Ngõ hoa Hà Nội. Kết quả này được chọn sẵn để duyệt thiết kế.</p></div><div class="decision-actions">${action(stage==='rolling'?'skip':'roll',stage==='rolling'?'Hiện kết quả ngay':'Gieo xúc xắc · mẫu')}${action('inspect','Xem thông tin khu đất','secondary')}</div>`;
  }else if(stage==='owned'){
   setDock('NGƯỜI CẦM MÁY: '+people[0].name.toUpperCase(),'Một góc phố đã có chủ','Mua mẫu đã hiển thị · còn 960 xu.','Kết thúc lượt · mẫu');
   html=header('ĐÃ CẬP NHẬT MINH HỌA','Chào chủ nhà mới!','Ngõ hoa Hà Nội đã mang dấu bông hoa của '+escape(people[0].name)+'.','✓')+propertyArt()+`<div class="receipt"><div><span>Đã trả ngân hàng</span><b>80 xu</b></div><div class="total"><span>Số dư minh họa</span><b>960 xu</b></div></div><div class="decision-actions">${action('next','Kết thúc lượt · đến '+escape(people[1].name))}${action('inspect','Xem đầy đủ khu đất','secondary')}</div>`;
  }else if(stage==='next'){
   setDock('LƯỢT CỦA '+people[1].name.toUpperCase()+' · CÁNH DIỀU','Chuyền máy cho '+people[1].name,'Đợi '+people[1].name+' xác nhận trước khi tiếp tục.','Tôi là '+people[1].name+' · nhận máy');
   html=header('CHUYỀN MÁY',escape(people[1].name)+' ơi, đến lượt!','Bông hoa nghỉ chân, cánh diều lên đường. Chuyền thiết bị cho '+escape(people[1].name)+'.','◈')+`<div class="recovery-icon" aria-hidden="true">◈</div><div class="decision-actions">${action('rent','Tôi là '+escape(people[1].name)+' · xem lượt thuê mẫu')}</div><p class="decision-foot">Cảnh tiếp theo là minh họa trả tiền thuê.</p>`;
  }else{
   setDock('NGƯỜI CẦM MÁY: '+people[1].name.toUpperCase(),'Đã đến Ngõ hoa Hà Nội','Chủ đất: '+people[0].name+' · tiền thuê mẫu: 4 xu','Xác nhận đã xem · mẫu');
   html=header('TIỀN THUÊ MINHỌA','Ghé phố của '+escape(people[0].name),escape(people[1].name)+' trả 4 xu cho chủ Ngõ hoa Hà Nội. Trong trò chơi, chỉ hiện kết quả sau khi máy chủ xác nhận.','↗')+propertyArt()+`<div class="receipt"><div><span>Người trả</span><b>${escape(people[1].name)} · −4 xu</b></div><div><span>Người nhận</span><b>${escape(people[0].name)} · +4 xu</b></div></div><div class="decision-actions">${action('reset','Xem lại câu chuyện')}</div>`;
  }
 }else if(fixture==='purchase'){
  setDock('NGƯỜI CẦM MÁY: '+people[0].name.toUpperCase(),'Bạn dừng ở Ngõ hoa Hà Nội','Khu đất chưa có chủ · chọn mua hoặc mở đấu giá.','Xem đầy đủ khu đất');
  html=header('DỪNG CHÂN · Ô 02','Một góc phố mới','Một hiên nhà nhỏ, một giàn hoa xinh. Bạn muốn giữ góc phố này chứ?','⌂')+propertyArt()+`<div class="deed-band"><span class="group-dot"></span> NHÓM 1 · HÀ NỘI</div><h3 class="property-title">Ngõ hoa Hà Nội</h3><div class="facts"><div class="fact"><small>Giá mua mẫu</small><strong>80 <small>xu</small></strong></div><div class="fact"><small>Thuê đất trống mẫu</small><strong>4 <small>xu</small></strong></div></div><div class="receipt"><div><span>Hiện có</span><b>1.040 xu</b></div><div class="total"><span>Sau khi mua</span><b>960 xu</b></div></div><div class="decision-actions">${action('buy','Mua khu đất · 80 xu')}${action('auction','Không mua · mở đấu giá','secondary')}</div><p class="decision-foot"><button class="text-button" data-action="inspect">Xem tiền thuê, xây dựng và thế chấp</button></p>`;
 }else if(fixture==='auction'){
  setDock('ĐẤU GIÁ · NGƯỜI TRẢ GIÁ: '+people[bidder].name.toUpperCase(),'Ngõ hoa Hà Nội đang được mời giá',bidderReady?'Người cầm máy: '+people[bidder].name:'Chuyền máy trước khi gửi giá.',bidderReady?'Xem đầy đủ khu đất':'Tôi là '+people[bidder].name+' · nhận máy');
  html=header('CẢ NHÀ CÙNG TRẢ GIÁ','Ai sẽ là chủ mới?','Mỗi lượt trả giá đều gọi đúng người. Không đếm ngược; cả nhà có thời gian suy nghĩ.','⚑')+`<h3 class="property-title">Ngõ hoa Hà Nội</h3><div class="bid-current"><span class="mini-label">GIÁ CAO NHẤT · MẪU</span><div class="bid-value">${money(bid)} <small>xu</small></div><p>${escape(leading)} đang dẫn đầu</p><div class="bid-seats">${people.map((p,i)=>`<span class="${bidder===i?'selected':''}">${escape(p.name)}${bidder===i?' · trả giá':''}</span>`).join('')}</div></div><p class="muted">${escape(people[bidder].name)} có ${money(people[bidder].cash)} xu · chỉ gửi khi đã nhận máy.</p>${bidderReady?`<label class="field">Giá bạn muốn gửi · xu<input id="bid-input" type="number" min="${bid+1}" max="${people[bidder].cash}" step="1" value="${bid+10}" inputmode="numeric"></label><div class="bid-controls"><button data-action="bid-add" data-amount="10">+10 xu</button><button data-action="bid-add" data-amount="50">+50 xu</button></div><div class="decision-actions">${action('bid','Gửi giá · minh họa')}${action('pass','Bỏ lượt · chuyển người','secondary')}</div>`:`<div class="decision-tip"><span class="tip-icon">↪</span><span>Chuyền máy cho <b>${escape(people[bidder].name)}</b>. Giá đang chờ được giữ nguyên.</span></div><div class="decision-actions">${action('auction-receive','Tôi là '+escape(people[bidder].name)+' · nhận máy')}${action('inspect','Xem đầy đủ khu đất','secondary')}</div>`}<p class="decision-foot">Dữ liệu minh họa · không phải giao dịch hay luật đấu giá mới.</p>`;
 }else if(fixture==='setup'){
  setDock('CẢ NHÀ CÙNG CHUẨN BỊ','Chọn một quân cờ, ngồi vào bàn','Mẫu bốn người · có thể bỏ tên người 3 và 4.','Xem bàn chơi mẫu');
  html=header('TRƯỚC KHI DẠO PHỐ','Chào cả nhà!','2–4 người, một thiết bị. Gọi tên nhau rồi chọn một góc quanh bàn.','☀')+`<form id="setup-form">${people.map((p,i)=>`<div class="setup-row"><label><span class="setup-icon" style="color:${p.color}" aria-hidden="true">${p.icon}</span><span class="sr-only">Tên người ${i+1}${i>1?' · tùy chọn':''}</span><input name="player${i}" aria-label="Tên người ${i+1}${i>1?' · tùy chọn':''}" value="${escape(p.name)}" maxlength="24" ${i<2?'required':''} placeholder="Người ${i+1}${i>1?' · tùy chọn':''}"></label></div>`).join('')}<div class="decision-tip"><span class="tip-icon">⌂</span><span>Trò chơi thật giữ ván đang chơi. Bản thiết kế này chỉ đổi tên mẫu trong lần xem hiện tại.</span></div><div class="decision-actions"><button class="primary" type="submit">Cả nhà vào bàn · mẫu →</button></div></form><p class="decision-foot">Không lưu tên hay tạo phiên chơi thật.</p>`;
 }else if(fixture==='trade'){
  setDock('TRAO ĐỔI · '+people[0].name.toUpperCase()+' → '+people[1].name.toUpperCase(),'Cùng xem trước khi đồng ý','Chỉ người nhận đề nghị mới xác nhận bước tiếp.','Xem tài sản trao đổi');
  html=header('ĐỀ NGHỊ ĐANG CHỜ','Đổi một góc phố','Mỗi bên nhìn rõ mình đưa gì và nhận gì trước khi quyết định.','⇄')+`<div class="trade-route"><span>✿ ${escape(people[0].name)}</span><b>⇄</b><span>◈ ${escape(people[1].name)}</span></div><div class="trade-item"><b>${escape(people[0].name)} đưa</b><small>Ngõ hoa Hà Nội · chưa xây nhà<br>30 xu · số tiền minh họa</small></div><div class="trade-item"><b>${escape(people[1].name)} đưa</b><small>Sân nhỏ Hà Nội · chưa xây nhà</small></div><div class="decision-tip"><span class="tip-icon">↪</span><span>${stage==='trade-review'?escape(people[1].name)+' đang cầm máy. Kiểm tra cả hai chiều trước khi chấp nhận.':'Chuyền máy cho '+escape(people[1].name)+' để xem và trả lời đề nghị.'}</span></div><div class="decision-actions">${stage==='trade-review'?action('trade-accept','Chấp nhận đề nghị · mẫu'):action('trade-review','Tôi là '+escape(people[1].name)+' · xem đề nghị')}${stage==='trade-review'?action('trade-decline','Từ chối · giữ tài sản','secondary'):''}</div><p class="decision-foot">Tài sản thế chấp phải hiện nghĩa vụ tiếp nhận riêng.</p>`;
 }else if(fixture==='debt'){
  setDock('NGƯỜI CẦM MÁY: '+people[0].name.toUpperCase()+' · KHOẢN NỢ','Giải quyết xong mới qua lượt','Chưa có khoản thanh toán nào được thực hiện.','Xem tài sản có thể xử lý');
  html=header('KHOẢN NỢ ĐANG CHỜ','Từng bước gỡ khó',escape(people[0].name)+' cần trả '+escape(people[1].name)+' 140 xu. Hãy xem cách bổ sung số xu còn thiếu.','!')+`<div class="debt-amount">${debtRemaining} <small>xu còn thiếu · mẫu</small></div><div class="receipt"><div><span>Cần trả ${escape(people[1].name)}</span><b>140 xu</b></div><div><span>Hiện có · mẫu</span><b>${140-debtRemaining} xu</b></div></div><div class="trade-item"><b>Ngõ hoa Hà Nội</b><small>Thế chấp mẫu: nhận 40 xu · ngừng thu tiền thuê.<br>Quyết định này cần xác nhận trước khi thực hiện.</small></div><div class="decision-actions">${debtRemaining===60?action('mortgage','Xem lại phương án thế chấp','secondary'):debtRemaining>0?'<p class="muted">Ngõ hoa Hà Nội đã thế chấp trong mẫu. Còn thiếu 20 xu; xem phương án bán tài sản khác.</p>':action('settle','Trả 140 xu · minh họa')}${action('liquidate','Xem bán nhà và tài sản','secondary')}${action('bankrupt','Xem hệ quả phá sản','text-button')}</div>`;
 }else if(fixture==='victory'){
  setDock('VÁN MẪU ĐÃ KẾT THÚC','Một buổi chơi, thật nhiều chuyện','Kết quả được giữ để cả nhà cùng nhìn lại.','Xem lại bàn chơi');
  html=header('CẢM ƠN CẢ NHÀ','Một khu phố đáng nhớ',escape(people[0].name)+' là người thắng trong cảnh minh họa này. Mỗi người đều để lại một góc phố riêng.','✦')+`<div class="victory-icon" aria-hidden="true">✿</div><h3 style="text-align:center">Chúc mừng ${escape(people[0].name)}!</h3><ul class="victory-list"><li><span>✿ ${escape(people[0].name)} · còn trong ván</span><b>1.860 xu</b></li><li><span>◈ ${escape(people[1].name)} · đã rời ván</span><b>—</b></li><li><span>♧ ${escape(people[2].name)} · đã rời ván</span><b>—</b></li><li><span>⛵ ${escape(people[3].name)} · đã rời ván</span><b>—</b></li></ul><div class="decision-actions">${action('celebrate','Chúc mừng cả nhà')}${action('setup','Xem chuẩn bị ván mới','secondary')}</div><p class="decision-foot">Kết quả mẫu · không có bảng xếp hạng thật.</p>`;
 }else{
  setDock('CHƯA XÁC NHẬN NGƯỜI CẦM MÁY','Bàn chơi đang được giữ lại','Quyết định mua đang chờ · chưa gửi lại thao tác.','Đang chờ đồng bộ',true);
  html=header('ĐỒNG BỘ LẠI','Vẫn là góc phố ấy','Giữ nguyên bàn và quyết định đang chờ. Bạn không cần bắt đầu lại.','↻')+`<div class="recovery-icon" aria-hidden="true">⌂</div><div class="connection-banner"><b>${stage==='recovered'?'Đã đồng bộ · minh họa':'Mất kết nối · cảnh minh họa'}</b><br>${stage==='recovered'?'Ngõ hoa Hà Nội vẫn đang chờ quyết định. Nhận máy trước khi tiếp tục.':'Bản nhìn gần nhất: lượt '+escape(people[0].name)+', ô Ngõ hoa Hà Nội. Các thao tác giao dịch đang khóa.'}</div><div class="receipt"><div><span>Quyết định giữ lại</span><b>Mua hoặc đấu giá</b></div><div><span>Thao tác chờ kết quả</span><b>Chưa xác nhận</b></div></div><div class="decision-actions">${stage==='recovered'?action('resume','Tôi là '+escape(people[0].name)+' · tiếp tục quyết định'):action('reconnect','Mô phỏng kết nối lại')}${action('retry-info','Vì sao không gửi thao tác mới?','secondary')}</div><p class="decision-foot">Không thực hiện kết nối hay gửi lại giao dịch thật.</p>`;
 }
 $('#decision').innerHTML=html;
}
function render(){renderPlayers();renderBoard();renderDecision();}
function goFixture(name,focus=false){clearTimeout(motionTimer);fixture=name;stage=name==='table'?'handoff':'';bid=130;leading=people[2].name;bidder=1;bidderReady=false;passes=0;bought=false;debtRemaining=60;$('#fixture-select').value=name;$('.confetti')?.remove();render();$('#decision').scrollTop=0;$('#announcement').textContent='Cảnh mẫu: '+fixtureNames[name];if(focus)$('#decision-heading').focus();}
let dialogOpener;
function showDialog(title,content){dialogOpener=document.activeElement;$('#dialog-content').innerHTML=`<h2 id="dialog-heading" tabindex="-1">${title}</h2>${content}`;if(!$('#detail-dialog').open)$('#detail-dialog').showModal();$('#dialog-heading').focus();}
function inspectSpace(index){const s=boardSpaces[index];let details=`<p class="dialog-body">Ô ${index+1} · ${s.id}. Mọi giá trị ở đây là mẫu tham khảo từ nội dung gốc của dự án, không phải thay đổi luật.</p>`;
 if(s.street){const [,group,price,cost,rents]=s.street;details+=`<table class="detail-table"><tbody><tr><th>Nhóm</th><td>Nhóm ${group}</td></tr><tr><th>Giá mua</th><td>${price} xu</td></tr>${['Đất trống','Đủ nhóm, chưa xây','1 nhà','2 nhà','3 nhà','4 nhà','Khách sạn'].map((label,i)=>`<tr><th>Thuê · ${label}</th><td>${rents[i]} xu</td></tr>`).join('')}<tr><th>Mỗi nhà / khách sạn</th><td>${cost} xu</td></tr><tr><th>Thế chấp minh họa</th><td>${price/2} xu · không thu tiền thuê</td></tr></tbody></table><p class="dialog-body">Chủ đất mẫu: ${bought&&index===1?escape(people[0].name):index===1?'chưa có':index%2?escape(people[1].name):escape(people[2].name)}. Nhà mẫu: 0. Trạng thái thế chấp: chưa thế chấp. Tính hợp lệ của xây, bán và chuộc do máy chủ quyết định trong trò chơi thật.</p>`;}
 else if(s.transit)details+=`<table class="detail-table"><tbody><tr><th>Giá mua</th><td>180 xu</td></tr><tr><th>Thuê với 1 / 2 / 3 / 4 bến</th><td>20 / 45 / 90 / 180 xu</td></tr></tbody></table>`;
 else if(s.service)details+=`<p class="dialog-body">Giá mua mẫu: 140 xu. Tiền thuê mẫu: 4 hoặc 10 lần tổng xúc xắc theo số trạm sở hữu. Hiện đủ số trạm và phép tính trong quyết định thật.</p>`;
 else details+=`<p class="dialog-body">${index===10?'Nhà chờ: hiện trạng thái đang ghé hoặc đang bị giữ riêng. Quyết định thật nêu số lượt, quyền dùng thẻ, trả phí hoặc gieo xúc xắc hợp lệ.':index===30?'Đến nhà chờ: giải thích điểm đến và nguyên nhân, rồi cập nhật theo kết quả máy chủ.':[2,7,17,22,33,36].includes(index)?'Ô rút thẻ: mở nội dung đã công bố và hệ quả đã xác nhận; không lộ thứ tự thẻ chưa rút.':index===4||index===38?'Ô khoản phí: luôn nêu số xu và người nhận trước hệ quả.':'Ô đặc biệt: mô tả đầy đủ theo trạng thái đã xác nhận trong trò chơi thật.'}</p>`;
 showDialog(escape(s.name),details+`<button class="secondary full" data-action="spaces">Về danh sách 40 ô</button>`);
}
function showSpaces(){showDialog('Cả khu phố · 40 ô',`<p class="dialog-body">Chọn tên ô để đọc đầy đủ. Hình bàn chơi là toàn cảnh minh họa; các nút ở đây hỗ trợ bàn phím và cảm ứng.</p><ol class="space-list">${boardSpaces.map(s=>`<li><button data-space="${s.index}">${String(s.index+1).padStart(2,'0')}. ${s.name}<small>${s.price?s.price+' xu · giá mẫu':'Ô đặc biệt · xem mô tả'}</small></button></li>`).join('')}</ol>`);}
function finishRoll(){clearTimeout(motionTimer);goFixture('purchase',true);beep();}
function handleAction(name,source){
 if(name==='receive'){stage='roll';render();$('#decision-heading').focus();notify('Đã nhận máy · '+people[0].name+'.');}
 else if(name==='roll'){stage='rolling';renderDecision();if(matchMedia('(prefers-reduced-motion: reduce)').matches)finishRoll();else motionTimer=setTimeout(finishRoll,650);}
 else if(name==='skip')finishRoll();
 else if(name==='buy'){fixture='table';stage='owned';bought=true;$('#fixture-select').value='table';render();$('#decision-heading').focus();notify('Đã mua trong bản minh họa · không có giao dịch thật.');beep();}
 else if(name==='auction')goFixture('auction',true);
 else if(name==='inspect')inspectSpace(1);
 else if(name==='spaces')showSpaces();
 else if(name==='next'){stage='next';render();$('#decision-heading').focus();}
 else if(name==='rent'){stage='rent';render();$('#decision-heading').focus();}
 else if(name==='reset')goFixture('table',true);
 else if(name==='auction-receive'){bidderReady=true;render();$('#bid-input').focus();notify(people[bidder].name+' đã nhận máy.');}
 else if(name==='bid-add'){const input=$('#bid-input');input.value=Math.min(people[bidder].cash,Number(input.value)+Number(source.dataset.amount));input.focus();}
 else if(name==='bid'){
  const input=$('#bid-input'),value=Number(input.value);if(!input.reportValidity()||!Number.isSafeInteger(value)||value<=bid||value>people[bidder].cash){notify('Giá phải là số xu nguyên, cao hơn giá hiện tại và không vượt số xu đang có.');return;}
  bid=value;leading=people[bidder].name;bidder=(bidder+1)%4;bidderReady=false;passes=0;render();$('#decision-heading').focus();notify('Giá mẫu '+money(bid)+' xu đã hiển thị. Chuyền máy cho '+people[bidder].name+'.');beep();
 }else if(name==='pass'){
  passes++;bidder=(bidder+1)%4;bidderReady=false;if(passes>=3){showDialog('Kết quả đấu giá · minh họa',`<p class="dialog-body">${escape(leading)} nhận Ngõ hoa Hà Nội với giá mẫu ${bid} xu. Chỉ là điểm kết của chuỗi minh họa; không phải mô phỏng đủ luật hoặc thanh toán thật.</p><button class="primary full" data-action="reset-dialog">Về bàn chơi mẫu</button>`);}else{render();$('#decision-heading').focus();notify('Đã bỏ lượt mẫu. Chuyền máy cho '+people[bidder].name+'.');}
 }else if(name==='setup')goFixture('setup',true);
 else if(name==='trade-review'){stage='trade-review';render();$('#decision-heading').focus();}
 else if(name==='trade-accept'||name==='trade-decline'){if(stage!=='trade-review')return;showDialog(name==='trade-accept'?'Đã chấp nhận · minh họa':'Đã từ chối · minh họa',`<p class="dialog-body">${name==='trade-accept'?'Hai chiều trao đổi đã được hiển thị rõ trước xác nhận. Tài sản trong bản minh họa không thay đổi.':'Đề nghị đã đóng. Hai bên giữ nguyên tài sản.'}</p><button class="primary full" data-action="reset-dialog">Về bàn chơi mẫu</button>`);}
 else if(name==='mortgage')showDialog('Xem lại thế chấp',`<p class="dialog-body">Ngõ hoa Hà Nội · nhận mẫu 40 xu. Khu đất dừng thu tiền thuê; khi chuộc phải hiện toàn bộ số xu cần trả theo máy chủ. Sau thao tác mẫu này còn thiếu ${Math.max(0,debtRemaining-40)} xu.</p><div class="button-row">${action('confirm-mortgage','Xác nhận mẫu · +40 xu')}${action('close','Quay lại','secondary')}</div>`);
 else if(name==='confirm-mortgage'){debtRemaining=Math.max(0,debtRemaining-40);$('#detail-dialog').close();renderDecision();$('#decision-heading').focus();notify('Đã cập nhật số xu minh họa; không thay đổi tài sản thật.');}
 else if(name==='liquidate')showDialog('Xử lý tài sản · minh họa',`<p class="dialog-body">Danh sách thật cần nêu tài sản, số nhà, giá bán và điều kiện hợp lệ. Cảnh này minh họa bán nhà để bù ${debtRemaining} xu còn thiếu.</p>${action('confirm-liquidate','Xem sau khi bổ sung đủ xu')}`);
 else if(name==='confirm-liquidate'){debtRemaining=0;$('#detail-dialog').close();renderDecision();$('#decision-heading').focus();}
 else if(name==='settle'){notify('Đã xem thanh toán mẫu 140 xu. Không gửi giao dịch.');goFixture('table',true);}
 else if(name==='bankrupt')showDialog('Hệ quả phá sản',`<p class="dialog-body">Dừng lượt và rời ván; tài sản chuyển theo người nhận và trạng thái máy chủ. Nghĩa vụ tiếp nhận tài sản thế chấp phải được giải quyết trước khi công bố người thắng. Đây là minh họa tĩnh, không có nút phá sản thật.</p>${action('close','Quay lại khoản nợ','secondary')}`);
 else if(name==='reconnect'){stage='recovered';renderDecision();$('#decision-heading').focus();notify('Đã hiển thị trạng thái đồng bộ mẫu.');}
 else if(name==='resume')goFixture('purchase',true);
 else if(name==='retry-info')showDialog('Một thao tác, một kết quả',`<p class="dialog-body">Trong trò chơi thật, giữ nguyên mã thao tác, người gửi và phiên bản trạng thái khi chờ phản hồi. Kết nối lại để đọc kết quả; chỉ gửi lại cùng thao tác khi được phép. Không tạo giao dịch mới để thay cho thao tác chưa rõ kết quả. Bản minh họa không có giao tiếp máy chủ.</p>${action('close','Đã hiểu','secondary')}`);
 else if(name==='celebrate'){if($('.confetti')){$('.confetti').remove();notify('Đã bỏ qua chuyển động chúc mừng.');}else{const confetti=document.createElement('div');confetti.className='confetti';$('#game').append(confetti);source.textContent='Bỏ qua chúc mừng';beep();notify('Cảm ơn cả nhà đã cùng chơi!');}}
 else if(name==='close')$('#detail-dialog').close();
 else if(name==='reset-dialog'){$('#detail-dialog').close();goFixture('table',true);}
}
document.addEventListener('click',(event)=>{const space=event.target.closest('[data-space]');if(space){inspectSpace(Number(space.dataset.space));return;}const control=event.target.closest('[data-action]');if(control)handleAction(control.dataset.action,control);});
$('#fixture-select').addEventListener('change',(event)=>goFixture(event.target.value));
$('#viewport-select').addEventListener('change',(event)=>{const value=event.target.value,host=$('#preview-host');document.body.classList.toggle('preset',value!=='fluid');if(value==='fluid'){host.style.width='';$('#game').style.removeProperty('--frame-height');$('#game').style.minHeight='';$('#viewport-note').hidden=true;}else{const [w,h]=value.split('x').map(Number);host.style.width=w+'px';$('#game').style.setProperty('--frame-height',h+'px');$('#game').style.minHeight=h+'px';$('#viewport-note').hidden=false;$('#viewport-note').textContent='Khung minh họa '+w+' × '+h+' · chiều rộng thu nhỏ nếu cửa sổ hẹp hơn; nội dung dài vẫn cuộn được.';}});
$('#dock-action').addEventListener('click',()=>{
 if(fixture==='table')handleAction(({handoff:'receive',roll:'roll',rolling:'skip',owned:'next',next:'rent',rent:'reset'})[stage]);
 else if(fixture==='purchase'||fixture==='trade'||fixture==='debt')inspectSpace(1);
 else if(fixture==='auction')handleAction(bidderReady?'inspect':'auction-receive');
 else goFixture('table',true);
});
$('#spaces-button').addEventListener('click',showSpaces);
$('#brand-link').addEventListener('click',(event)=>{event.preventDefault();goFixture('table',true);});
$('#history-button').addEventListener('click',()=>showDialog('Chuyện vừa qua · mẫu',`<ol class="sample-ledger"><li><span class="ledger-icon">✿</span><span>${escape(people[0].name)} đang ở Ngõ hoa Hà Nội<small>Hiện tại · quyết định đang chờ</small></span></li><li><span class="ledger-icon">◈</span><span>${escape(people[1].name)} đã mua Sân nhỏ Hà Nội<small>Vòng trước · 100 xu minh họa</small></span></li><li><span class="ledger-icon">♧</span><span>${escape(people[2].name)} đã nhận tiền thuê<small>Vòng trước · kết quả mẫu</small></span></li></ol><p class="dialog-body">Diễn biến minh họa tĩnh; không ghi lại một ván thật.</p>`));
$('#sound-button').addEventListener('click',()=>{sound=!sound;$('#sound-button').setAttribute('aria-pressed',String(sound));$('#sound-button').querySelector('span').textContent='Âm thanh: '+(sound?'bật':'tắt');$('#sound-button').title=sound?'Tắt hiệu ứng âm thanh':'Bật hiệu ứng âm thanh';notify(sound?'Đã bật hiệu ứng ngắn · không có nhạc.':'Đã tắt âm thanh.');beep();});
$('#close-dialog').addEventListener('click',()=>$('#detail-dialog').close());
$('#detail-dialog').addEventListener('close',()=>{if(dialogOpener?.isConnected)dialogOpener.focus();else $('#decision-heading').focus();});
document.addEventListener('submit',(event)=>{if(event.target.id!=='setup-form')return;event.preventDefault();const data=new FormData(event.target);people.forEach((p,i)=>{const name=String(data.get('player'+i)||'').trim();p.name=name||(i>1?'Khách '+(i+1):'Người '+(i+1));});goFixture('table',true);notify('Đã đổi tên mẫu trong lần xem này. Bốn chỗ là minh họa cố định.');});
// Review-only deep links make the exact scene/frame shareable with the owner.
const reviewParameters = new URLSearchParams(location.search);
const initialFixture = reviewParameters.get('scene');
if (Object.hasOwn(fixtureNames, initialFixture)) goFixture(initialFixture);
else render();
const initialViewport = reviewParameters.get('viewport');
if ([...$('#viewport-select').options].some((option) => option.value === initialViewport)) {
 $('#viewport-select').value = initialViewport;
 $('#viewport-select').dispatchEvent(new Event('change'));
}
