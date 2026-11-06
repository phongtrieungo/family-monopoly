import Phaser from 'phaser';

// Canvas is only a projection. Every label and occupant remains available in the HTML list.
const colors = ['0xd7684d', '0x287e78', '0x7a68ad', '0xd29b27'];
const short = (value, max = 11) => value.length > max ? `${value.slice(0, max - 1)}…` : value;

export function createBoardView(parent) {
  let scene;
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: 770, height: 770, backgroundColor: '#e4eddd',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true }, banner: false,
    scene: { create() { scene = this; } },
  });

  return {
    render({ board, state, activeSeatId, person }) {
      if (!scene) return;
      scene.children.removeAll(true);
      const g = scene.add.graphics();
      const bg = 0xe4eddd; g.fillStyle(bg); g.fillRect(0, 0, 770, 770);
      const turn = state.turn;
      const placements = board.spaces.map((space, i) => i <= 10 ? [10, 10-i] : i <= 20 ? [20-i, 0] : i <= 30 ? [0, i-20] : [i-30, 10]);
      for (const [index, space] of board.spaces.entries()) {
        const [row, col] = placements[index]; const x = 12 + col * 68; const y = 12 + row * 68;
        const active = turn.seats.find((seat) => seat.id === activeSeatId)?.position === index;
        const fill = active ? 0xffe8bd : 0xfffdf7;
        g.fillStyle(fill); g.fillRoundedRect(x, y, 64, 64, 8);
        g.lineStyle(active ? 3 : 1, active ? 0x9a5a22 : 0xc5d4c2); g.strokeRoundedRect(x, y, 64, 64, 8);
        if (space.groupId?.startsWith('G')) {
          const groupColor = [0xc9ac6d, 0x77aeb7, 0xb88caa, 0xb79b86, 0x83a46e, 0xd18b62, 0x6d9fb2, 0x88a876][Number(space.groupId.slice(1))-1];
          g.fillStyle(groupColor); g.fillRoundedRect(x+3, y+3, 58, 6, 3);
        }
        const title = board.copy[space.labelKey] ?? space.id;
        scene.add.text(x+5, y+11, `${index+1}. ${short(title, 10)}`, { fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#24483f', fontStyle: 'bold', wordWrap: { width: 55 } }).setDepth(1);
        const owner = turn.ownership[space.id];
        if (owner) scene.add.text(x+5, y+33, `◆ ${short(person(owner), 9)}`, { fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#465f54' }).setDepth(1);
        const occupants = turn.seats.filter((seat) => !seat.eliminated && seat.position === index);
        occupants.forEach((seat, tokenIndex) => {
          const seatIndex = turn.seats.findIndex(({ id }) => id === seat.id);
          const cx = x + 11 + tokenIndex * 14; const cy = y + 52;
          g.fillStyle(Number(colors[seatIndex])); g.fillCircle(cx, cy, 8); g.lineStyle(2, 0xffffff); g.strokeCircle(cx, cy, 8);
          scene.add.text(cx, cy-5, String(seatIndex+1), { fontFamily: 'system-ui, sans-serif', fontSize: '8px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(.5).setDepth(2);
        });
      }
      g.fillStyle(0xd3e6d1); g.fillRoundedRect(82, 82, 606, 606, 28);
      const active = turn.seats.find(({ id }) => id === activeSeatId);
      scene.add.text(385, 320, 'PHỐ NHÀ MÌNH', { fontFamily: 'system-ui, sans-serif', fontSize: '27px', color: '#28594c', fontStyle: 'bold' }).setOrigin(.5);
      scene.add.text(385, 365, `Đến lượt: ${person(activeSeatId)}  ·  ${active ? active.cash.toLocaleString('vi-VN') : 0} xu`, { fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#355c4d' }).setOrigin(.5);
      scene.add.text(385, 402, 'Chạm vào danh sách bên dưới để đọc đủ thông tin từng ô.', { fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#46605a' }).setOrigin(.5);
      parent.dataset.renderer = game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas';
      parent.dataset.revision = state.revision;
    },
    destroy() { game.destroy(true); },
  };
}
