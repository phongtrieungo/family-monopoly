// Pure rendering/interaction checks using an in-memory DOM stand-in.
// This does not exercise browser layout, touch, accessibility or audio playback.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const elements = new Map();
function element(selector) {
  if (selector === '.confetti') return null;
  if (!elements.has(selector)) {
    elements.set(selector, {
      innerHTML: '', textContent: '', hidden: false, open: false, value: '',
      options: ['fluid','1440x900','1280x720','1024x768','768x1024','360x800'].map(value => ({value})),
      style: {setProperty() {}, removeProperty() {}},
      classList: {toggle() {}, add() {}, remove() {}},
      handlers: {},
      addEventListener(type, handler) { this.handlers[type] = handler; },
      dispatchEvent(event) { this.handlers[event.type]?.({target: this}); },
      focus() {},
      showModal() { this.open = true; },
      close() { this.open = false; this.handlers.close?.(); },
      querySelector: element,
      setAttribute() {},
    });
  }
  return elements.get(selector);
}
const sandbox = vm.createContext({
  document: {querySelector: element, addEventListener() {}, activeElement: null,
    body: {classList: {toggle() {}}}},
  location: {search: '?scene=purchase&viewport=1280x720'},
  URLSearchParams, Event: class { constructor(type) { this.type = type; } },
  setTimeout: () => 1, clearTimeout() {},
  matchMedia: () => ({matches: true}),
});
const source = fs.readFileSync(path.join(__dirname, 'mock.js'), 'utf8');
vm.runInContext(source, sandbox);
const run = source => vm.runInContext(source, sandbox);
let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS:', name); }

check('review deep link selects purchase and requested viewport', () => {
  assert.equal(element('#fixture-select').value, 'purchase');
  assert.equal(element('#viewport-select').value, '1280x720');
});
check('40 unique authored space IDs and full readable list', () => {
  const ids = [...element('#board').innerHTML.matchAll(/data-space-id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 40); assert.equal(new Set(ids).size, 40);
  assert.equal(ids[0], 'VN-S00'); assert.equal(ids[39], 'VN-S39');
  run('showSpaces()');
  assert.equal([...element('#dialog-content').innerHTML.matchAll(/data-space="\d+"/g)].length, 40);
  element('#detail-dialog').close();
});
check('all eight fixtures produce a distinct readable decision heading', () => {
  const headings = new Set();
  for (const fixture of ['table','purchase','auction','setup','trade','debt','victory','recovery']) {
    run(`goFixture(${JSON.stringify(fixture)})`);
    const html = element('#decision').innerHTML;
    assert.match(html, /id="decision-heading"/);
    headings.add(html.match(/id="decision-heading"[^>]*>(.*?)<\/h2>/s)[1]);
  }
  assert.equal(headings.size, 8);
});
check('HUD turn marker moves to the next player for handoff and rent', () => {
  for (const stage of ['next','rent']) {
    run(`goFixture('table'); stage=${JSON.stringify(stage)}; render()`);
    const html = element('#players').innerHTML;
    assert.match(html, /class="player active"[^>]*aria-label="Bình, Cánh diều,[^"]*chủ lượt"/);
    assert.doesNotMatch(html, /aria-label="An,[^"]*chủ lượt"/);
  }
});
check('both trade responses require recipient handoff', () => {
  run("goFixture('trade')");
  assert.doesNotMatch(element('#decision').innerHTML, /data-action="trade-(accept|decline)"/);
  run("handleAction('trade-decline')");
  assert.equal(element('#detail-dialog').open, false);
  run("handleAction('trade-review')");
  assert.match(element('#decision').innerHTML, /data-action="trade-accept"/);
  assert.match(element('#decision').innerHTML, /data-action="trade-decline"/);
  run("handleAction('trade-decline')");
  assert.equal(element('#detail-dialog').open, true);
  element('#detail-dialog').close();
});
check('edited names stay consistent in handoff, rent, trade, debt and victory', () => {
  run("people.forEach((p,i)=>p.name=['Mai','Lan','Hạ','Nam'][i])");
  run("goFixture('table');stage='next';render()");
  assert.match(element('#dock-title').textContent, /Lan/);
  assert.match(element('#decision').innerHTML, /Lan ơi/);
  run("stage='rent';render()");
  assert.match(element('#decision').innerHTML, /Lan · −4 xu/);
  for (const fixture of ['trade','debt','victory','recovery']) {
    run(`goFixture(${JSON.stringify(fixture)})`);
    assert.doesNotMatch(element('#decision').innerHTML, /Bình|Chi|Dũng|\bAn\b/);
  }
  run("goFixture('auction')");
  assert.match(element('#decision').innerHTML, /Hạ đang dẫn đầu/);
});
check('user-provided names remain escaped in illustrated HTML', () => {
  run("people[1].name='<img src=x onerror=alert(1)>';goFixture('trade')");
  const html = element('#decision').innerHTML;
  assert.match(html, /&lt;img/); assert.doesNotMatch(html, /<img src=x/);
});
check('reduced-motion roll advances directly to selected purchase', () => {
  run("goFixture('table');handleAction('receive');handleAction('roll')");
  assert.equal(element('#fixture-select').value, 'purchase');
});
console.log(`${count} checks passed; browser layout and real-device gates remain separate.`);
