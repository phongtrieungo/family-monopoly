import Phaser from 'phaser';

// Native elements supply layout, hit targets, focus and text composition.
// Phaser paints their visible representation from the same content and state.
export function createPanelView(panel, selector) {
  const layer = document.createElement('div');
  layer.className = 'local-panel-paint';
  layer.setAttribute('aria-hidden', 'true');
  panel.prepend(layer);
  let scene;
  let frame;
  let game;

  function refresh() {
    if (!scene || !panel.clientWidth || !panel.clientHeight) return;
    const width = panel.clientWidth;
    const height = panel.scrollHeight;
    if (game.scale.width !== width || game.scale.height !== height) game.scale.resize(width, height);
    scene.children.removeAll(true);
    const ink = scene.add.graphics();
    const bounds = layer.getBoundingClientRect();

    for (const element of panel.querySelectorAll(selector)) {
      if (!element.getClientRects().length) continue;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const x = rect.left - bounds.left;
      const y = rect.top - bounds.top;
      const style = getComputedStyle(element);
      if (element.classList.contains('player-card')) {
        ink.fillStyle(Phaser.Display.Color.ValueToColor(style.backgroundColor).color);
        ink.fillRoundedRect(x, y, rect.width, rect.height, 12);
        ink.lineStyle(element.classList.contains('selected') ? 2 : 1,
          Phaser.Display.Color.ValueToColor(style.borderBottomColor).color);
        ink.strokeRoundedRect(x + 1, y + 1, rect.width - 2, rect.height - 2, 12);
        continue;
      }
      const field = element instanceof HTMLInputElement;
      const button = element instanceof HTMLButtonElement;
      const active = element === document.activeElement;
      if (field || button) {
        ink.fillStyle(element.disabled ? 0xe1d9c7 : button ? 0x245548 : 0xfffbef);
        ink.fillRoundedRect(x, y, rect.width, rect.height, 6);
        ink.lineStyle(active ? 3 : 1, active ? 0xb14c26 : 0xa6a58e);
        ink.strokeRoundedRect(x, y, rect.width, rect.height, 6);
      }
      const value = field ? element.value : element.textContent.trim();
      const text = scene.add.text(x + (field || button ? 9 : 0), y, value, {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontStyle: style.fontWeight,
        color: button && !element.disabled ? '#fff9e8' : style.color,
        wordWrap: field || element.matches('.seat-cash, .local-piece') ? undefined : { width: Math.max(1, rect.width - (button ? 18 : 0)), useAdvancedWrap: true },
      });
      if (field || button) {
        text.y += Math.max(0, (rect.height - text.height) / 2);
        const innerWidth = Math.max(1, rect.width - 18);
        const offset = field ? element.scrollLeft : 0;
        const fieldLeft = text.x;
        text.x -= offset;
        text.setCrop(offset, 0, innerWidth, rect.height);
        if (field && active) {
          const position = (index) => Math.max(0, Math.min(innerWidth,
            text.context.measureText(value.slice(0, index)).width - offset));
          const start = position(element.selectionStart ?? value.length);
          const end = position(element.selectionEnd ?? value.length);
          if (start !== end) {
            ink.fillStyle(0x90c5b3).fillRect(fieldLeft + start, y + 7, end - start, rect.height - 14);
          } else {
            ink.lineStyle(1, 0x213e34).lineBetween(fieldLeft + end, y + 7, fieldLeft + end, y + rect.height - 7);
          }
        }
      }
    }
  }

  function schedule() {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      refresh();
    });
  }

  // Ignore Phaser's own canvas sizing and drawing mutations.
  const observer = new MutationObserver((records) => {
    if (records.some(({ target }) => !layer.contains(target))) schedule();
  });
  observer.observe(panel, { subtree: true, attributes: true, childList: true, characterData: true });
  const resize = new ResizeObserver(schedule);
  resize.observe(panel);
  for (const type of ['input', 'focusin', 'focusout', 'compositionupdate', 'keyup', 'click', 'select']) panel.addEventListener(type, schedule);
  panel.addEventListener('scroll', schedule, true);
  game = new Phaser.Game({
    type: Phaser.CANVAS, parent: layer, width: 1, height: 1, transparent: true, banner: false,
    audio: { noAudio: true },
    scene: { create() { scene = this; panel.classList.add('local-panel-painted'); schedule(); } },
  });
  return {
    refresh: schedule,
    destroy() {
      panel.removeEventListener('scroll', schedule, true);
      observer.disconnect();
      resize.disconnect();
      for (const type of ['input', 'focusin', 'focusout', 'compositionupdate', 'keyup', 'click', 'select']) panel.removeEventListener(type, schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
      panel.classList.remove('local-panel-painted');
      game.destroy(true);
      layer.remove();
    },
  };
}
