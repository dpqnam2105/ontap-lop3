# Thu gọn thẻ chủ đề — gửi Claude review

Nhánh `compact-topic-cards`, căn cứ main `31abf22`.

- Chỉ thẻ chủ đề thường: bấm đầu thẻ mở lựa chọn, một thẻ mở mỗi lúc. Thẻ tự sinh bảng nhân chia / Đấu trường không đổi.
- Enter/Space mở/đóng; focus thấy rõ. Khách mở thẻ được; bắt đầu học mới nhắc nhập tên.
- Số trên nút ôn = số câu phiên ôn thực tế, tối đa 20. `Quiz.reviewCandidates` dùng chung cho thẻ và Quiz, lọc theo allowed; không đổi kho wrong-history của banner.
- Nhãn theo độ phủ không nói thành thạo. `Đã vững` vẫn dùng hộp ôn tập >= MASTER_BOX và >=80%.
- Đổi giai đoạn/mốc bài vẽ lại và đóng thẻ. Desktop thẻ cạnh không bị kéo cao. Kế hoạch hôm nay vẫn bắt đầu trực tiếp.
- Phát hiện thêm khung mobile cũ rộng 512px dù body che overflow; đặt min-width:0 cho ô lưới. Test kiểm mép thẻ nằm trong viewport 320/360/390/430/1280px.

## Ảnh đối chiếu

| Khổ | Trước | Đóng | Mở không câu sai | Mở có câu sai |
|---|---|---|---|---|
|390|[Trước](before-closed-390.png)|[Đóng](after-closed-390.png)|[Không ôn](after-no-review-390.png)|[Có ôn](after-with-review-390.png)|
|1280|[Trước](before-closed-1280.png)|[Đóng](after-closed-1280.png)|[Không ôn](after-no-review-1280.png)|[Có ôn](after-with-review-1280.png)|

## Kiểm thử

- 12 bộ Node pass.
- `tests/topic-cards.e2e.js`: bàn phím, một thẻ mở, số ôn L1/L2 và trần 20, khách, redraw, mastery, giới hạn viewport.
- Các e2e cũ sửa thao tác mở thẻ trước khi bấm mode, giữ ý nghĩa kiểm phạm vi.
- Máy Codex chưa có Chromium bundled; chạy bằng Edge qua PET_BROWSER_CHANNEL=msedge và preload tạm cho suite cũ. Không thay mặc định launcher trong repo.
- E2E đạt trên Edge: topic-cards, arena, en-books, gen (8 nhóm), layout-regression, pet, pet-room, pet-motion, pet-accessory, pet-art, pet-mobile-payload, pet-reduced-motion.
- `home.e2e.js`: ca 360px/tên dài báo nút Bắt đầu bottom 676 > mép menu 669. Đã chạy cùng test với mã main `31abf22` qua route Git: lỗi y hệt 676/669. Không nới assert, không sửa giao diện home trong PR này. Các nhóm còn lại được chạy riêng bằng bản tạm bỏ duy nhất khổ 360 để không bị dừng sớm; các nhóm còn lại đều đạt (390/430px, desktop, hoàn thành/thưởng/reload, lỗi bảng tuần, lượt 0 điểm, khách).
- `home`/`gen` trước dùng chờ cứng 800/1500ms khiến reload đọc App.allData=null trên Edge. Đổi sang chờ App.allData và cache lớp được nạp. Gen sau sửa đạt toàn bộ.
- Hai test pet từng được báo lỗi hiện đạt trên máy Codex; không sửa logic/test pet trong đợt này.
