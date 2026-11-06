import Phaser from 'phaser';

// Canvas is only a projection. Every full label and occupant remains in the HTML space list.
const colors = ['0xd7684d', '0x287e78', '0x7a68ad', '0xd29b27'];
const groups = [0xc9ac6d, 0x77aeb7, 0xb88caa, 0xb79b86, 0x83a46e, 0xd18b62, 0x6d9fb2, 0x88a876];
const short = (value, max = 11) => value.length > max ? `${value.slice(0, max - 1)}…` : value;

export function createBoardView(parent) {
  let scene;
  let tween;
  let movingToken;
  let motionTarget;
  let motionChanged = () => {};
  let pendingRender;
  let api;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: 770, height: 770, backgroundColor: '#e4eddd',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true }, banner: false,
    scene: { create() {
      scene = this;
      queueMicrotask(() => {
        if (!pendingRender || !api) return;
        const args = pendingRender; pendingRender = undefined; api.render(args);
      });
    } },
  });

  function finishMotion() {
    if (!tween) return;
    tween.stop(); tween = undefined;
    movingToken?.setPosition(motionTarget.x, motionTarget.y);
    movingToken = undefined; motionTarget = undefined; parent.dataset.animating = 'false'; motionChanged(false);
  }
  function onReducedMotion(event) { if (event.matches) finishMotion(); }
  reducedMotion.addEventListener('change', onReducedMotion);

  api = {
    render(args) {
      if (!scene) { pendingRender = args; return; }
      const { board, state, activeSeatId, person, roll, motion, onMotionChange = () => {} } = args;
      // UI-only renders can run again at the same revision immediately after a
      // command. Keep the current projection and tween until it finishes so a
      // follow-up render cannot cancel the accepted movement or hide Skip.
      if (tween && parent.dataset.revision === String(state.revision)) return;
      finishMotion(); motionChanged = onMotionChange; motionChanged(false);
      scene.children.removeAll(true);
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xe4eddd); graphics.fillRect(0, 0, 770, 770);
      const turn = state.turn;
      const layout = board.spaces.map((_, index) => index <= 10 ? [10, 10-index] : index <= 20 ? [20-index, 0] : index <= 30 ? [0, index-20] : [index-30, 10]);
      const tilePoint = (position) => {
        const [row, col] = layout[position];
        return { x: 12 + col * 68, y: 12 + row * 68 };
      };
      const tokenPoint = (position, seatId) => {
        const point = tilePoint(position);
        const occupants = turn.seats.filter((seat) => !seat.eliminated && seat.position === position);
        const tokenIndex = Math.max(0, occupants.findIndex((seat) => seat.id === seatId));
        return { x: point.x + 11 + tokenIndex * 14, y: point.y + 52 };
      };
      const spaceCenter = (position) => { const point = tilePoint(position); return { x: point.x + 32, y: point.y + 52 }; };

      for (const [index, space] of board.spaces.entries()) {
        const point = tilePoint(index); const x = point.x; const y = point.y;
        const active = turn.seats.find((seat) => seat.id === activeSeatId)?.position === index;
        graphics.fillStyle(active ? 0xffe8bd : 0xfffdf7);
        graphics.fillRoundedRect(x, y, 64, 64, 8);
        graphics.lineStyle(active ? 3 : 1, active ? 0x9a5a22 : 0xc5d4c2);
        graphics.strokeRoundedRect(x, y, 64, 64, 8);
        if (space.groupId?.startsWith('G')) {
          graphics.fillStyle(groups[Number(space.groupId.slice(1)) - 1]);
          graphics.fillRoundedRect(x + 3, y + 3, 58, 6, 3);
        }
        const title = board.copy[space.labelKey] ?? space.id;
        scene.add.text(x + 5, y + 11, `${index + 1}. ${short(title, 10)}`, {
          fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#24483f', fontStyle: 'bold', wordWrap: { width: 55 },
        }).setDepth(1);
        const owner = turn.ownership[space.id];
        if (owner) scene.add.text(x + 5, y + 33, `◆ ${short(person(owner), 9)}`, {
          fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#465f54',
        }).setDepth(1);
      }

      const tokens = new Map();
      for (const seat of turn.seats.filter((entry) => !entry.eliminated)) {
        const seatIndex = turn.seats.findIndex(({ id }) => id === seat.id);
        const point = tokenPoint(seat.position, seat.id);
        const disk = scene.add.circle(0, 0, 9, Number(colors[seatIndex])).setStrokeStyle(2, 0xffffff);
        const number = scene.add.text(0, -5, String(seatIndex + 1), {
          fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(.5);
        tokens.set(seat.id, scene.add.container(point.x, point.y, [disk, number]).setDepth(3));
      }

      graphics.fillStyle(0xd3e6d1); graphics.fillRoundedRect(82, 82, 606, 606, 28);
      const active = turn.seats.find(({ id }) => id === activeSeatId);
      scene.add.text(385, 305, 'PHỐ NHÀ MÌNH', { fontFamily: 'system-ui, sans-serif', fontSize: '27px', color: '#28594c', fontStyle: 'bold' }).setOrigin(.5);
      scene.add.text(385, 340, `Đến lượt: ${person(activeSeatId)}  ·  ${active ? active.cash.toLocaleString('vi-VN') : 0} xu`, {
        fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#355c4d',
      }).setOrigin(.5);
      if (roll?.dice?.length === 2) {
        scene.add.text(385, 382, `XÚC XẮC   ${roll.dice[0]}  +  ${roll.dice[1]}`, {
          fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#24483f', fontStyle: 'bold',
        }).setOrigin(.5);
      } else scene.add.text(385, 382, 'Chờ lượt gieo xúc xắc', { fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#46605a' }).setOrigin(.5);
      scene.add.text(385, 420, 'Đọc đủ thông tin trong danh sách 40 ô bên dưới.', { fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#46605a' }).setOrigin(.5);
      parent.dataset.renderer = game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas';
      parent.dataset.revision = state.revision;
      parent.dataset.animating = 'false';

      if (!motion || reducedMotion.matches || motion.fromPosition === motion.toPosition) return;
      movingToken = tokens.get(motion.seatId);
      if (!movingToken) return;
      motionTarget = tokenPoint(motion.toPosition, motion.seatId);
      const points = [spaceCenter(motion.fromPosition)];
      if (motion.forcedJail) points.push(spaceCenter(motion.toPosition));
      else {
        let position = motion.fromPosition;
        const steps = motion.dice.reduce((sum, die) => sum + die, 0);
        for (let step = 0; step < steps; step += 1) {
          position = (position + 1) % board.spaces.length;
          points.push(spaceCenter(position));
        }
      }
      points.push(motionTarget);
      movingToken.setPosition(points[0].x, points[0].y);
      tween = scene.tweens.addCounter({
        from: 0, to: points.length - 1, duration: Math.min(1800, Math.max(500, (points.length - 1) * 120)), ease: 'Linear',
        onUpdate: (current) => {
          const progress = current.getValue(); const segment = Math.min(Math.floor(progress), points.length - 2);
          const fraction = Math.min(1, progress - segment); const start = points[segment]; const end = points[segment + 1];
          movingToken.setPosition(start.x + (end.x - start.x) * fraction, start.y + (end.y - start.y) * fraction);
        },
        onComplete: () => {
          movingToken?.setPosition(motionTarget.x, motionTarget.y);
          tween = undefined; movingToken = undefined; motionTarget = undefined; parent.dataset.animating = 'false'; motionChanged(false);
        },
      });
      parent.dataset.animating = 'true'; motionChanged(true);
    },
    skipMotion: finishMotion,
    destroy() { finishMotion(); reducedMotion.removeEventListener('change', onReducedMotion); game.destroy(true); },
  };
  return api;
}
