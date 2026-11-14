import Phaser from 'phaser';

// Canvas is only a projection. Every full label and occupant remains in the HTML space list.
// Original neighborhood geometry adapted from the approved ST-501 mock.
const WIDTH = 880;
const HEIGHT = 615;
const DICE_Y = 340;
const PALETTE = [0xb75c45, 0x347b79, 0x7a6991, 0x9b7828];
const GROUPS = [0xbd9474, 0x84acb4, 0xb392ab, 0xd9aa6a, 0x92aa79, 0x72a99b, 0xb4a261, 0x7996b6];
const project = (x, y) => ({ x: 156 + x * .97 - y * .17, y: 31 + x * .115 + y * .65 });
const corners = (x, y, w, h) => [project(x, y), project(x + w, y), project(x + w, y + h), project(x, y + h)];

function polygon(graphics, points, color, line) {
  graphics.fillStyle(color).fillPoints(points, true);
  if (line !== undefined) graphics.lineStyle(1, line).strokePoints(points, true);
}

function floor(graphics, x, y, width, height, fill, line) {
  polygon(graphics, corners(x, y, width, height), fill, line);
}

function shape(graphics, x, y, scale, points, color, line) {
  polygon(graphics, points.map(([dx, dy]) => ({ x: x + dx * scale, y: y + dy * scale })), color, line);
}

function tree(graphics, { x, y }, scale) {
  graphics.fillStyle(0x4f6745, .21).fillEllipse(x + 3 * scale, y + 3 * scale, 30 * scale, 12 * scale);
  graphics.fillStyle(0x8e7050).fillRect(x - 2 * scale, y - 25 * scale, 4 * scale, 26 * scale);
  graphics.fillStyle(0x65875b).fillEllipse(x, y - 31 * scale, 34 * scale, 42 * scale);
  graphics.fillStyle(0x8da76d).fillEllipse(x - 5 * scale, y - 38 * scale, 26 * scale, 32 * scale);
}

function shop(graphics, { x, y }, scale, wall, roof) {
  graphics.fillStyle(0x415139, .15).fillEllipse(x + 7 * scale, y + 4 * scale, 68 * scale, 18 * scale);
  const face = (points, fill) => shape(graphics, x, y, scale, points, fill);
  face([[-27, -2], [-27, -48], [12, -42], [12, 4]], wall);
  face([[12, 4], [12, -42], [32, -53], [32, -7]], 0xb6b18d);
  face([[-33, -48], [-14, -70], [39, -60], [14, -39]], roof);
  face([[-33, -48], [14, -39], [14, -32], [-33, -41]], 0x9a634b);
  face([[14, -39], [39, -60], [39, -53], [14, -32]], 0x85583f);
  face([[-23, -12], [-23, -29], [-13, -27], [-13, -10]], 0x708f83);
  face([[-6, -8], [-6, -26], [5, -24], [5, -6]], 0x708f83);
  face([[18, -10], [18, -28], [26, -33], [26, -15]], 0x7a8c73);
  face([[-28, -30], [14, -23], [18, -32], [-24, -39]], 0xf2e2b8);
  for (const offset of [0, 14, 28]) {
    face([[-28 + offset, -30 + offset / 6], [-21 + offset, -29 + offset / 6],
      [-17 + offset, -38 + offset / 6], [-24 + offset, -39 + offset / 6]], roof);
  }
}

function drawNeighborhood(graphics) {
  const [a, b, c, d] = corners(-8, -8, 731, 731);
  const edge = ({ x, y }) => ({ x, y: y + 19 });
  graphics.fillStyle(0x8c9062, .22).fillEllipse(446, 562, 726, 67);
  polygon(graphics, [d, c, edge(c), edge(d)], 0xa18b5e, 0x83774f);
  polygon(graphics, [b, c, edge(c), edge(b)], 0x99865a, 0x83774f);
  polygon(graphics, [a, b, c, d], 0xc6cba7, 0xa3a67b);
  floor(graphics, 67, 67, 581, 581, 0xd7dbb6, 0xb6bd91);
  floor(graphics, 104, 104, 507, 507, 0xdce0be, 0xc1c69e);
  floor(graphics, 120, 273, 460, 37, 0xefe5c8, 0xc5c29d);
  floor(graphics, 344, 121, 34, 475, 0xeee4c7, 0xc5c29d);
  floor(graphics, 144, 357, 155, 118, 0x80aa99, 0x88ab98);
  floor(graphics, 151, 364, 140, 101, 0x91b7a6, 0xbed0b0);
  for (let index = 0; index < 5; index++) {
    const { x, y } = project(161 + index * 20, 410);
    graphics.lineStyle(2, 0xc4d8c0).lineBetween(x, y, x + 15, y + 2);
  }
  floor(graphics, 322, 365, 72, 18, 0xb79b6b, 0xa18a61);
}

function decorateNeighborhood(scene, graphics) {
  const objects = [
    [158, 190, .95, 0xedcd92, 0xbd7957], [239, 203, 1.12, 0xdfd3a4, 0x7d9486],
    [438, 181, 1.05, 0xdfb999, 0xaa6f52], [529, 204, .9, 0xe2d3a0, 0x729387],
    [440, 460, 1.2, 0xe5cd95, 0xb77551], [544, 471, .95, 0xdbd0ac, 0x87977b],
    [440, 558, .8, 0xe5c4a0, 0xaa7359],
    [107, 120, .9], [295, 139, .8], [559, 125, .9], [115, 257, .8], [561, 310, .7],
    [583, 390, .8], [110, 543, .9], [203, 564, .8], [287, 542, .7], [566, 584, .9],
    [403, 324, .65], [297, 338, .6],
  ];
  objects.sort(([ax, ay], [bx, by]) => project(ax, ay).y - project(bx, by).y);
  for (const [x, y, scale, wall, roof] of objects) {
    const point = project(x, y);
    if (wall) shop(graphics, point, scale, wall, roof);
    else tree(graphics, point, scale);
  }
  const plaza = project(348, 313);
  graphics.fillStyle(0xeeebcc).fillEllipse(plaza.x, plaza.y, 56, 25);
  graphics.fillStyle(0xbdbe99).fillEllipse(plaza.x, plaza.y, 46, 18);
  graphics.fillStyle(0xbaac7f).fillRect(plaza.x - 3, plaza.y - 21, 6, 19);
  graphics.fillStyle(0xe8dcb5).fillEllipse(plaza.x, plaza.y - 21, 16, 8);
  const brand = project(359, 208);
  scene.add.text(brand.x, brand.y, 'Phố Nhà Mình', {
    fontFamily: 'Georgia, serif', fontSize: '32px', color: '#34593f', fontStyle: 'bold',
  }).setOrigin(.5).setAngle(7);
}

function tilePosition(index) {
  if (index <= 10) return [(10 - index) * 65, 650];
  if (index <= 20) return [0, (20 - index) * 65];
  if (index <= 30) return [(index - 20) * 65, 0];
  return [650, (index - 30) * 65];
}

function paintToken(graphics, index, size = 1) {
  const fill = PALETTE[index];
  const points = (path, color) => shape(graphics, 0, 0, size, path, color, 0xfff5dd);
  graphics.fillStyle(0x404d3a, .25).fillEllipse(0, 2 * size, 20 * size, 8 * size);
  graphics.fillStyle(fill).fillEllipse(0, 0, 17 * size, 6 * size);
  if (index === 0) {
    graphics.fillStyle(0xe79d80);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      graphics.fillCircle(Math.cos(angle) * 5 * size, (Math.sin(angle) * 5 - 10) * size, 4 * size);
    }
    graphics.fillStyle(0xffe2a4).fillCircle(0, -10 * size, 2.7 * size);
  } else if (index === 1) {
    points([[0, -22], [8, -12], [0, -3], [-8, -12]], 0x66a9a3);
    graphics.lineStyle(1, 0xfff5dd).lineBetween(0, -21 * size, 0, -3 * size);
  } else if (index === 2) {
    points([[0, -5], [-7, -8], [-9, -15], [-3, -14], [0, -9], [4, -17], [9, -19], [9, -12], [5, -7]], 0x9681ae);
    graphics.lineStyle(1, 0xfff5dd).lineBetween(0, -3 * size, 0, -10 * size);
  } else {
    points([[-10, -5], [10, -5], [6, 0], [-6, 0]], fill);
    points([[0, -6], [0, -23], [9, -8]], 0xf3e3b2);
    points([[-2, -7], [-2, -19], [-8, -7]], 0xd9b75e);
  }
}

const special = { start: '⌂', tax: '◈', transit: '▰', service: '✣', jail: '▥', rest: '♧', 'go-to-jail': '↶', deck: '✉' };

const diceFaces = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];

function drawDie(graphics, value) {
  graphics.clear();
  graphics.fillStyle(0x173733, 0.22); graphics.fillEllipse(5, 25, 42, 12);
  graphics.fillStyle(0x9bb3a3); graphics.fillPoints([{ x: 18, y: -18 }, { x: 25, y: -23 }, { x: 25, y: 13 }, { x: 18, y: 18 }], true);
  graphics.fillStyle(0xcbd9c5); graphics.fillPoints([{ x: -18, y: 18 }, { x: 18, y: 18 }, { x: 25, y: 13 }, { x: -11, y: 13 }], true);
  graphics.fillStyle(0xfffdf4); graphics.fillRoundedRect(-18, -18, 36, 36, 6);
  graphics.lineStyle(2, 0x28594c); graphics.strokeRoundedRect(-18, -18, 36, 36, 6);
  graphics.fillStyle(0x28594c);
  for (const pip of diceFaces[value]) graphics.fillCircle((pip % 3 - 1) * 10, (Math.floor(pip / 3) - 1) * 10, 2.5);
}

export function createBoardView(parent) {
  let scene;
  let tween;
  let movingToken;
  let motionTarget;
  let rollingDice = [];
  let motionChanged = () => {};
  let pendingRender;
  let api;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: WIDTH, height: HEIGHT, transparent: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true }, banner: false,
    scene: { create() {
      scene = this;
      api?.render();
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
    rollingDice.forEach(({ container, face, value, x }) => { drawDie(face, value); container.setPosition(x, DICE_Y).setAngle(0).setScale(1); }); rollingDice = [];
    movingToken = undefined; motionTarget = undefined; parent.dataset.animating = 'false'; motionChanged(false);
  }
  function onReducedMotion(event) { if (event.matches) finishMotion(); }
  reducedMotion.addEventListener('change', onReducedMotion);

  api = {
    render(args) {
      if (!scene) { pendingRender = args; return; }
      const { board, state, activeSeatId, person, roll, motion, onMotionChange = () => {} } = args ?? {};
      // A UI-only render at the same revision must preserve accepted motion and Skip.
      if (tween && parent.dataset.revision === String(state?.revision)) return;
      finishMotion(); motionChanged = onMotionChange; motionChanged(false);
      scene.children.removeAll(true);
      rollingDice = [];
      const graphics = scene.add.graphics();
      drawNeighborhood(graphics);
      const turn = state?.turn;
      const finished = state?.status === 'Finished' && turn.phase === 'Finished';
      const active = turn?.seats.find(({ id }) => id === activeSeatId);
      const seatIndices = new Map(turn?.seats.map((seat, index) => [seat.id, index]));
      for (let index = 0; index < 40; index++) {
        const space = board?.spaces[index];
        const [x, y] = tilePosition(index);
        const selected = !finished && active?.position === index;
        floor(graphics, x + 1, y + 1, 63, 63, selected ? 0xffedba : 0xf6f0da, selected ? 0x946029 : 0xb6b393);
        const group = space?.type === 'street' && GROUPS[Number(space.groupId.slice(1)) - 1];
        if (group) {
          floor(graphics, x + 4, y + 4, 57, 8, group);
          if (index % 3 !== 2) shop(graphics, project(x + 31, y + 27), .38, 0xe4d19c, group);
        } else if (space) {
          const point = project(x + 32, y + 30);
          scene.add.text(point.x, point.y, special[space.type] ?? '✦', {
            fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#657557',
          }).setOrigin(.5);
        }
        if (!space) continue;
        const title = board.copy[space.labelKey] ?? space.id;
        const label = project(x + 33, y + 44);
        scene.add.text(label.x, label.y, title.split(' ').slice(0, 2).join(' '), {
          fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#354933', fontStyle: 'bold',
        }).setOrigin(.5);
        const price = space.economy?.price ?? space.price;
        const number = project(x + 33, y + 57);
        scene.add.text(number.x, number.y, price ? `${index + 1} · ${price}` : String(index + 1), {
          fontFamily: 'system-ui, sans-serif', fontSize: '7px', color: '#53644d',
        }).setOrigin(.5);
        const owner = seatIndices.get(turn?.ownership[space.id]);
        if (owner !== undefined) {
          floor(graphics, x + 10, y + 65, 45, 4, PALETTE[owner]);
          const marker = project(x + 56, y + 34);
          paintToken(scene.add.graphics().setPosition(marker.x, marker.y), owner, .46);
          const level = turn.buildings[space.id] ?? 0;
          if (level === 5) shop(graphics, project(x + 47, y + 23), .40, 0xeab19a, PALETTE[owner]);
          else for (let house = 0; house < level; house++) {
            shop(graphics, project(x + 9 + house * 13, y + 12), .17, 0xe9dfb3, PALETTE[owner]);
          }
        }
      }
      decorateNeighborhood(scene, graphics);
      parent.dataset.renderer = game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas';
      if (!state) return;
      const tokenPoint = (position, seatId) => {
        const [x, y] = tilePosition(position);
        const occupants = turn.seats.filter((seat) => !seat.eliminated && seat.position === position);
        const index = Math.max(0, occupants.findIndex((seat) => seat.id === seatId));
        const column = occupants.length === 1 ? 32 : 13 + index % 2 * 27;
        return project(x + column, y + 34 - Math.floor(index / 2) * 25);
      };
      const spaceCenter = (position) => {
        const [x, y] = tilePosition(position);
        return project(x + 32, y + 34);
      };
      const tokens = new Map();
      for (const seat of turn.seats.filter((entry) => !entry.eliminated)) {
        const point = tokenPoint(seat.position, seat.id);
        const piece = scene.add.graphics();
        paintToken(piece, seatIndices.get(seat.id));
        tokens.set(seat.id, scene.add.container(point.x, point.y, [piece]).setDepth(3));
      }
      const centerText = finished ? `Ván đã kết thúc · ${person(turn.winnerSeatId)} thắng!` : `Đến lượt: ${person(activeSeatId)}`;
      if (roll?.dice?.length === 2 && !finished) {
        rollingDice = roll.dice.map((value, index) => {
          const face = scene.add.graphics();
          drawDie(face, value);
          const x = 410 + index * 60;
          return { container: scene.add.container(x, DICE_Y, [face]).setDepth(2), face, value, x };
        });
      }
      parent.dataset.revision = state.revision;
      parent.dataset.animating = 'false';
      parent.dataset.centerText = centerText;

      if (!motion || reducedMotion.matches) return;
      movingToken = tokens.get(motion.seatId);
      if (!movingToken) return;
      motionTarget = tokenPoint(motion.toPosition, motion.seatId);
      const points = [motion.fromPosition === motion.toPosition ? motionTarget : spaceCenter(motion.fromPosition)];
      if (motion.fromPosition === motion.toPosition) points.push(motionTarget);
      else if (motion.forcedJail) points.push(spaceCenter(motion.toPosition));
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
      rollingDice.forEach(({ container, x }, index) => container.setPosition(x + (index ? 75 : -75), DICE_Y));
      tween = scene.tweens.addCounter({
        from: 0, to: points.length - 1, duration: Math.min(1800, Math.max(500, (points.length - 1) * 120)), ease: 'Linear',
        onUpdate: (current) => {
          const progress = current.getValue(); const segment = Math.min(Math.floor(progress), points.length - 2);
          const fraction = Math.min(1, progress - segment); const start = points[segment]; const end = points[segment + 1];
          movingToken.setPosition(start.x + (end.x - start.x) * fraction, start.y + (end.y - start.y) * fraction);
          const t = progress / (points.length - 1);
          rollingDice.forEach(({ container, face, value, x }, index) => {
            const arc = Math.sin(Math.PI * t);
            drawDie(face, t >= 0.8 ? value : (Math.floor(t * 16 + index * 3) % 6) + 1);
            container.setPosition(x + (index ? 1 : -1) * (1 - t) * 75, DICE_Y - Math.abs(Math.sin(t * Math.PI * 3)) * 30 * (1 - t));
            container.setAngle((index ? -1 : 1) * 720 * Math.max(0, 1 - t / 0.8));
            container.setScale(1 + 0.22 * arc);
          });
        },
        onComplete: () => {
          movingToken?.setPosition(motionTarget.x, motionTarget.y);
          rollingDice.forEach(({ container, face, value, x }) => { drawDie(face, value); container.setPosition(x, DICE_Y).setAngle(0).setScale(1); }); rollingDice = [];
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
