import { vnNeighborhoodBoard, vnOriginalCopy } from '../../src/domain/vn-original-content.js';

const controls = document.querySelector('#controls');
const name = document.querySelector('#name');
const status = document.querySelector('#status');
const seats = ['Nguyễn Thị Minh Anh', 'Bình', 'Chi', 'Dũng'];
const firstProperty = vnNeighborhoodBoard.spaces[1];
const firstPropertyName = vnOriginalCopy[firstProperty.labelKey];
const colors = [0xa23e36, 0x276469, 0x906222, 0x684b75];
const fixtures = [
  ['Chuẩn bị', 'Nhập tên để bắt đầu', 'Nhập tên người chơi bằng tiếng Việt.', 'Bắt đầu'],
  ['Mua đất', 'Minh Anh · Quyết định mua', `${firstPropertyName} · Giá ${firstProperty.economy.price} xu\nMua: còn ${1200 - firstProperty.economy.price} xu. Từ chối: mở đấu giá.`, 'Từ chối và đấu giá'],
  ['Đấu giá', 'Chuyền máy cho Bình', 'Lượt của Minh Anh · Bình cần đặt giá hoặc bỏ lượt.\nSân nhỏ Hà Nội · Giá mở 10 xu.', 'Bình đã nhận máy'],
  ['Thẻ và tiền thuê', 'Bình · Đã trả tiền thuê', 'Thẻ đã lật: đi đến bến xe.\nBình trả Minh Anh 25 xu tiền thuê.', 'Xem ô đất'],
  ['Ô đất', 'Sân nhỏ Hà Nội', 'Chủ sở hữu Minh Anh · Chưa thế chấp\nTiền thuê cơ bản 4 xu · Có hai quân trên ô.', 'Xem giao dịch'],
  ['Giao dịch', 'Chi · Xem đề nghị', 'Minh Anh đưa Sân nhỏ Hà Nội.\nChi đưa 80 xu. Chi là người quyết định.', 'Xem khoản nợ'],
  ['Khoản nợ', 'Dũng · Cần trả 90 xu', 'Trả cho Bình · Có 60 xu · Thiếu 30 xu.\nXem tài sản để huy động tiền.', 'Xem kết quả'],
  ['Kết quả', 'Minh Anh thắng', 'Kết quả mẫu · Tất cả số dư và giao dịch chỉ để minh họa.', 'Quay về chuẩn bị'],
];
let index = 1;
let handed = false;
let auctionResult;
let focused;
let detailView;
let setupError = '';

class Table extends Phaser.Scene {
  create() {
    this.elements = [];
    this.scale.on('resize', () => this.draw());
    name.addEventListener('input', () => {
      setupError = '';
      this.errorLabel?.setText('');
      this.drawName();
    });
    name.addEventListener('focus', () => this.focus('name'));
    name.addEventListener('blur', () => this.focus());
    this.draw();
  }

  focus(id) {
    focused = id;
    for (const { marker, key } of this.elements) marker.setVisible(key === focused);
  }

  drawName() {
    this.nameLabel?.setText(name.value || 'Nhập tên người chơi');
  }

  show(indexToShow, focusId = 'primary') {
    detailView = undefined;
    index = indexToShow;
    handed = false;
    auctionResult = undefined;
    this.draw(focusId);
    status.textContent = fixtures[index][1];
  }

  resolveAuction(bid) {
    handed = false;
    auctionResult = ['Đấu giá', 'Kết quả đấu giá mẫu', bid
      ? `Bình thắng ${firstPropertyName} với 10 xu.`
      : `Không có giá đặt. ${firstPropertyName} vẫn ở ngân hàng.`, 'Xem thẻ và tiền thuê'];
    this.draw('primary');
    status.textContent = auctionResult[2];
  }

  openDetail(kind, opener) {
    detailView = { kind, opener };
    this.draw('close');
    status.textContent = kind === 'deed' ? firstPropertyName : 'Chi tiết lượt mẫu';
  }

  closeDetail() {
    const { opener } = detailView;
    detailView = undefined;
    this.draw(opener);
    status.textContent = handed ? 'Bình · Đặt giá hoặc bỏ lượt' : (auctionResult ?? fixtures[index])[1];
  }

  draw(focusId = document.activeElement?.dataset.key) {
    this.children.removeAll(true);
    controls.replaceChildren();
    this.elements = [];
    this.nameLabel = undefined;
    this.errorLabel = undefined;
    const { width, height } = this.scale.gameSize;
    const boardSize = Math.min(width * 0.67, height - 92, 1600);
    const boardX = 32;
    const boardY = 64;
    const panelX = boardX + boardSize + 32;
    const panelY = boardY;
    const panelW = Math.min(width - panelX - 32, 640);
    const text = (x, y, value, size = 16, style = {}) => this.add.text(x, y, value, {
      fontFamily: 'Georgia, serif', fontSize: Math.round(size * Math.min(1.5, Math.max(1, width / 1440))), color: '#193930', ...style,
    });
    const box = (x, y, w, h, fill) => this.add.rectangle(x, y, w, h, fill).setOrigin(0);
    const button = (key, x, y, w, label, activate, primary = false) => {
      box(x, y, w, 44, primary ? 0x1f5144 : 0xf9eed9).setInteractive({ useHandCursor: true }).on('pointerup', activate);
      text(x + w / 2, y + 22, label, 14, { color: primary ? '#ffffff' : '#193930' }).setOrigin(0.5);
      const marker = box(x, y, w, 44, 0xffffff).setFillStyle(0, 0).setStrokeStyle(3, 0xb44328).setVisible(key === focused);
      this.elements.push({ key, marker });
      if (key === 'name') return;
      const control = document.createElement('button');
      control.dataset.key = key;
      control.textContent = label;
      if (key === 'previous') control.setAttribute('aria-label', 'Cảnh mẫu trước');
      if (key === 'next') control.setAttribute('aria-label', 'Cảnh mẫu tiếp theo');
      control.onclick = activate;
      control.onfocus = () => this.focus(key);
      control.onblur = () => this.focus();
      controls.append(control);
    };
    text(16, 14, 'Khu phố', 25, { fontStyle: 'bold' });
    text(width - 16, 20, 'Bản mẫu · ST-601', 13).setOrigin(1, 0);

    const cell = boardSize / 11;
    box(boardX, boardY, boardSize, boardSize, 0x3e7055);
    box(boardX + cell * 1.15, boardY + cell * 1.15, cell * 8.7, cell * 8.7, 0xdce2b3);
    const centerX = boardX + boardSize / 2;
    this.add.ellipse(centerX, boardY + boardSize * 0.58, boardSize * 0.42, boardSize * 0.22, 0x8eb9aa);
    for (let j = 0; j < 6; j += 1) {
      const x = boardX + boardSize * (0.24 + j * 0.085);
      box(x, boardY + boardSize * 0.34, cell * 0.65, cell * 0.72, colors[j % 4]);
      box(x, boardY + boardSize * 0.34 + cell * 0.72, cell * 0.65, cell * 0.36, 0xf1d4a5);
      this.add.circle(x + cell * 0.3, boardY + boardSize * 0.75, cell * 0.24, 0x517b50);
    }
    text(centerX, boardY + boardSize * 0.23, 'Phố và vườn', Math.max(15, boardSize / 22)).setOrigin(0.5);
    vnNeighborhoodBoard.spaces.forEach((space, i) => {
      const segment = Math.floor(i / 10);
      const step = i % 10;
      const [col, row] = [[10 - step, 10], [0, 10 - step], [step, 0], [10, step]][segment];
      const x = boardX + col * cell;
      const y = boardY + row * cell;
      const tile = box(x + 1, y + 1, cell - 2, cell - 2, i === 1 ? 0xffde84 : 0xf8efd9);
      if (i === 1 && !detailView) tile.setInteractive({ useHandCursor: true }).on('pointerup', () => this.openDetail('deed', 'inspect'));
      if (space.groupId) box(x + 2, y + 2, cell - 4, Math.max(3, cell * 0.13), colors[space.groupId.charCodeAt(0) % 4]);
      text(x + cell / 2, y + cell * 0.48, String(i), Math.max(10, cell * 0.29)).setOrigin(0.5);
      if ([1, 7, 14].includes(i)) {
        const tokens = i === 1 ? [0, 1] : [i === 7 ? 2 : 3];
        tokens.forEach((seat, slot) => {
          const cx = x + cell * (0.29 + slot * 0.43);
          const cy = y + cell * 0.78;
          this.add.circle(cx, cy, cell * 0.17, colors[seat]).setStrokeStyle(1, 0xffffff);
          text(cx, cy, String(seat + 1), 9, { color: '#ffffff' }).setOrigin(0.5);
        });
      }
    });

    const [, title, detail, action] = auctionResult ?? fixtures[index];
    const twoColumns = panelW >= 270;
    const seatWidth = twoColumns ? panelW / 2 : panelW;
    seats.forEach((seat, i) => {
      const x = panelX + (twoColumns ? i % 2 : 0) * seatWidth;
      const y = panelY + (twoColumns ? Math.floor(i / 2) : i) * 30;
      this.add.circle(x + 8, y + 10, 8, colors[i]);
      text(x + 8, y + 10, String(i + 1), 10, { color: '#ffffff' }).setOrigin(0.5);
      text(x + 20, y + 2, seat, 12);
    });
    const decisionY = panelY + (twoColumns ? 66 : 126);
    if (detailView) {
      name.hidden = true;
      const deed = detailView.kind === 'deed';
      const heading = text(panelX, decisionY, deed ? firstPropertyName : 'Chi tiết lượt mẫu', 22, {
        fontStyle: 'bold', wordWrap: { width: panelW },
      });
      const copy = deed
        ? `Giá mua ${firstProperty.economy.price} xu · Thuê cơ bản ${firstProperty.economy.rents[0]} xu\nQuân trên ô: Minh Anh và Bình.`
        : 'Minh Anh · Đến Sân nhỏ Hà Nội.\nMinh Anh · Từ chối mua.\nĐấu giá · Đang chờ Bình.';
      const body = text(panelX, heading.y + heading.height + 14, copy, 16, { wordWrap: { width: panelW }, lineSpacing: 6 });
      button('close', panelX, body.y + body.height + 18, panelW, 'Quay về quyết định', () => this.closeDetail(), true);
      const close = controls.querySelector('[data-key="close"]');
      close.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.closeDetail();
      });
      close.focus();
      return;
    }
    const heading = text(panelX, decisionY, handed ? 'Bình · Đặt giá hoặc bỏ lượt' : title, 22, {
      fontStyle: 'bold', wordWrap: { width: panelW },
    });
    const description = text(panelX, decisionY + heading.height + 14, detail, 15, { wordWrap: { width: panelW }, lineSpacing: 5 });
    let actionY = description.y + description.height + 12;
    name.hidden = index !== 0;
    if (index === 0) {
      button('name', panelX, actionY, panelW, '', () => name.focus());
      this.nameLabel = text(panelX + 10, actionY + 12, '', 16);
      this.drawName();
      this.errorLabel = text(panelX, actionY + 49, setupError, 14, { color: '#9b3026' });
      actionY += 80;
    }
    button('primary', panelX, actionY, panelW, handed ? 'Bỏ lượt · Xem kết quả mẫu' : action, () => {
      if (handed) return this.resolveAuction(false);
      if (index === 2 && !auctionResult) {
        handed = true;
        this.draw('primary');
        status.textContent = 'Bình đã nhận máy. Bình có thể đặt giá hoặc bỏ lượt.';
        return;
      }
      if (index === 0 && !name.value.trim()) {
        setupError = 'Hãy nhập tên người chơi.';
        this.errorLabel.setText(setupError);
        status.textContent = setupError;
        name.focus();
        return;
      }
      this.show((index + 1) % fixtures.length);
    }, true);
    if (handed) {
      button('bid', panelX, actionY + 50, panelW, 'Đặt giá 10 xu', () => this.resolveAuction(true));
    }
    const navY = actionY + (handed ? 105 : 55);
    button('previous', panelX, navY, 44, '‹', () => this.show((index + fixtures.length - 1) % fixtures.length, 'previous'));
    const detailWidth = (panelW - 108) / 2;
    button('inspect', panelX + 50, navY, detailWidth, 'Xem ô đất', () => this.openDetail('deed', 'inspect'));
    if (index === 2 && !auctionResult) {
      button('history', panelX + 54 + detailWidth, navY, detailWidth, 'Chi tiết lượt', () => this.openDetail('history', 'history'));
    }
    button('next', panelX + panelW - 44, navY, 44, '›', () => this.show((index + 1) % fixtures.length, 'next'));
    if (name.hidden || document.activeElement !== name) controls.querySelector(`[data-key="${focusId}"]`)?.focus();
  }
}

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'table',
  backgroundColor: '#efdfc5',
  scale: { mode: Phaser.Scale.RESIZE, width: Math.max(1280, window.innerWidth), height: Math.max(720, window.innerHeight) },
  scene: Table,
  audio: { noAudio: true },
});
