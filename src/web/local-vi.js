export { money } from './vi.js';
export const cardCopy = {
  "VN-C01": "Về quảng trường gặp cả nhà.",
  "VN-C02": "Ghé vườn nhà Huế.",
  "VN-C03": "Hẹn nhau ở sân mây.",
  "VN-C04": "Một chuyến đi biển.",
  "VN-C05": "Đổi tuyến xe ở bến gần nhất.",
  "VN-C06": "Ghé trạm dịch vụ gần nhất.",
  "VN-C07": "Quay lại tìm chiếc ô.",
  "VN-C08": "Chờ xử lý giấy tờ.",
  "VN-C09": "Giấy hẹn đã được giải quyết.",
  "VN-C10": "Hoàn tất một đơn hàng.",
  "VN-C11": "Nhận thưởng ý tưởng mới.",
  "VN-C12": "Bán đồ dùng còn tốt.",
  "VN-C13": "Chi phí chuyển nhà.",
  "VN-C14": "Góp tiền sửa đường.",
  "VN-C15": "Bảo trì nhà cửa.",
  "VN-C16": "Mời hàng xóm uống trà.",
  "VN-M01": "Quỹ xóm hoàn lại khoản góp.",
  "VN-M02": "Gian hàng cuối tuần có lãi.",
  "VN-M03": "Nhận quà từ bạn xa.",
  "VN-M04": "Tiết kiệm được một khoản.",
  "VN-M05": "Cả xóm mừng sinh nhật bạn.",
  "VN-M06": "Về quảng trường dự hội.",
  "VN-M07": "Thăm ngõ hoa Hà Nội.",
  "VN-M08": "Ghé chợ nổi Cần Thơ.",
  "VN-M09": "Chờ xác nhận hồ sơ.",
  "VN-M10": "Hồ sơ đã được thông qua.",
  "VN-M11": "Mua cây cho sân chung.",
  "VN-M12": "Đóng góp thư viện xóm.",
  "VN-M13": "Chi phí khám sức khỏe.",
  "VN-M14": "Sửa lại mái hiên.",
  "VN-M15": "Được hoàn phí sinh hoạt.",
  "VN-M16": "Trúng giải hội chợ nhỏ."
};
export const phases = { AwaitRoll: 'Gieo xúc xắc', AwaitPurchase: 'Mua hay đấu giá?', AwaitEnd: 'Kết thúc lượt', Auction: 'Đấu giá', AwaitDebt: 'Giải quyết khoản nợ', AwaitAcquisition: 'Chọn cách nhận tài sản thế chấp', BuildingDemand: 'Ai muốn xây công trình cuối?', BuildingOffer: 'Xác nhận xây công trình', Finished: 'Ván chơi đã kết thúc' };
export const errors = { InvalidLocalSetup: 'Cần 2–4 tên khác nhau, mỗi tên không quá 32 ký tự.', CommandIdConflict: 'Yêu cầu đã lưu có nội dung khác. Hãy kiểm tra trước khi thử lại.', Network: 'Không nhận được phản hồi. Kiểm tra kết nối rồi gửi lại thao tác đã lưu.', ResyncRequired: 'Ván chơi vừa thay đổi. Đã đồng bộ lại; hãy kiểm tra rồi chọn thao tác mới.', Unauthorized: 'Không khôi phục được phiên chơi. Có thể máy chủ đã đổi kho lưu. Hãy bắt đầu ván mới.', ActionRejected: 'Thao tác không hợp lệ ở trạng thái hiện tại. Kiểm tra tiền, quyền sở hữu, thứ tự xây hoặc bán và quyết định đang chờ.', Unknown: 'Không thể thực hiện thao tác. Hãy thử lại.' };

export const transactionCopy = {
  drawnCard: 'Thẻ đã rút',
  unknownCard: 'Rút một thẻ.',
  payment: 'Thanh toán đã xác nhận',
  balances: 'Số dư hiện tại',
  auctionResult: 'Kết quả đấu giá',
  noBid: 'Chưa có người đặt giá.',
  openingBid: 'Giá mở đầu',
  minimumBid: 'Giá đặt tối thiểu',
  bidder: 'Người đặt giá',
  bidderCash: 'Tiền đang có',
  buildingTarget: 'Ô sẽ xây nếu thắng',
  lastBuilding: 'công trình cuối',
  lastHouse: 'Nhà cuối cùng',
  lastHotel: 'Khách sạn cuối cùng',
};

export const pieces = [
  { icon: '✿', name: 'Bông hoa' },
  { icon: '◈', name: 'Cánh diều' },
  { icon: '♧', name: 'Lá non' },
  { icon: '◭', name: 'Thuyền buồm' },
];
