export const labels = {
  'space.start': 'Quảng trường',
  'space.rest': 'Vườn phố',
  'space.purchase': 'Phố Hà Nội',
  'space.rent': 'Bến Cần Thơ',
};

export const phases = {
  AwaitRoll: 'Gieo xúc xắc',
  AwaitPurchase: 'Quyết định mua',
  Auction: 'Đấu giá',
  AwaitEnd: 'Kết thúc lượt',
};

export const errors = {
  InvalidInvite: 'Mã mời không hợp lệ.',
  RoomFull: 'Phòng đã đủ người.',
  RoomClosed: 'Phòng đã đóng.',
  RoomStarted: 'Ván chơi đã bắt đầu.',
  SeatsNotReady: 'Cần ít nhất hai người đang kết nối và sẵn sàng.',
  Unauthorized: 'Phiên chơi đã hết hiệu lực. Hãy vào lại phòng.',
  ResyncRequired: 'Ván chơi vừa thay đổi. Hãy kiểm tra rồi thử lại.',
  ActionRejected: 'Thao tác hiện không hợp lệ.',
  InvalidName: 'Hãy nhập tên hiển thị.',
  Network: 'Mất kết nối. Đang thử kết nối lại…',
  Unknown: 'Không thể thực hiện thao tác. Hãy thử lại.',
};

export const money = (amount) => `${new Intl.NumberFormat('vi-VN').format(amount)} xu`;
