# Bộ hình cún nâu v1 — 2026-10-07

Nam đã duyệt mẫu cún nâu lông xoăn. Mèo Ba Tư xám giữ riêng ở thư mục output của workspace, không nằm trong catalog hoặc dữ liệu web.

## Tệp và cách dùng

- `assets/pet/dog-fluffy-brown-stage0-v1.png`: cún con.
- `assets/pet/dog-fluffy-brown-stage1-v1.png`: cún lớn.
- `assets/pet/dog-fluffy-brown-stage2-v1.png`: trưởng thành.
- Cả ba: 1254 × 1254, RGBA, alpha có giá trị 0 và 255, nền trong suốt thật. Tổng khoảng 6 MB PNG; màn game chỉ tham chiếu bảng của giai đoạn hiện tại. Trang duyệt tải cả ba.
- `docs/pet-art-preview.html`: xem ba giai đoạn và từng tư thế.

Ảnh được tạo bằng imagegen tích hợp, ba lượt, lấy mẫu cún đã duyệt làm tham chiếu. Không chỉnh pixel PNG sau khi tạo. Vùng cắt SVG nằm trong `PetView.frameRects`; hai góc nhỏ của bảng trưởng thành có clip polygon để loại pixel tư thế hàng bên cạnh.

## Hợp đồng tư thế

Thứ tự 16 vùng: idle, walk-A, sit, sleep, wake, eat, wag-A, tilt, hop, sniff, chase, happy, celebrate, walk-B, wag-B, rest.

13 tư thế đã chốt đều có ở mỗi giai đoạn. Đây là hoạt ảnh đổi tư thế; walk/wag luân phiên hai khung, kết hợp chuyển vị trí và hiệu ứng CSS của game. Không phải 16 khung liên tiếp của cùng một chuyển động. Hai giai đoạn đầu gần nhau về nét mặt; thân/chân và kích thước trong game tăng dần, trưởng thành có tỉ lệ rõ hơn.

## Giới hạn thay đổi

- Chỉ lớp vẽ/hoạt ảnh `pet-view.js` và tài nguyên hình; không đổi Pet.tx, giá 10/15/50, tăng trưởng, sao, Storage, Cloud hoặc Quiz.
- `KIND = dog-fluffy-brown` giữ nguyên. Không đổi mã dữ liệu khi thay bộ hình.
- Timer khung hình dừng khi rời màn/ẩn tab; trở lại chỉ resume idle. Giảm chuyển động tắt timer khung hình, kể cả khi người dùng đổi cài đặt lúc đang mở.
- Giới hạn vị trí đi lại theo chiều rộng phòng để không cắt cún trên mobile.
- `index.html`: tăng cache cho pet-view; nhãn Trang chủ dùng lbl-short để xuống dòng ở 360px như các nhãn khác.

## Kiểm tra

- `node tests/pet-art.e2e.js`: 3 giai đoạn × 13 tư thế; ảnh thật tải được; vẽ không đổi hồ sơ; mã KIND; giới hạn phòng 360/390/430/1280px; nhãn rail; đổi khung đi bộ; dừng timer; giảm chuyển động.
- `node tests/pet.test.js`, `node tests/pet-challenge.test.js`, `node tests/pet.e2e.js`: kiểm tra lại luật chăm cún và luồng nhận nuôi/sao lưu.
- `python tools/inspect_pet_sheets.py`: đọc alpha và đo vùng nhân vật; chỉ đọc, không sửa ảnh.
- Đã xem ảnh chụp từng tư thế và màn mobile. Chờ Claude review trên nhánh mới trước khi merge.
