# Bộ hình cún nâu v2 — 2026-10-07

Nam đã duyệt bảng so sánh v2: sơ sinh tròn mũm mĩm, lớn vừa thân/chân rõ hơn và chỏm tóc, trưởng thành ngực rộng và đầu nhỏ hơn so với thân. Mèo Ba Tư xám giữ riêng ở thư mục output của workspace, không nằm trong catalog hoặc dữ liệu web.

## Tệp và cách dùng

- `assets/pet/dog-fluffy-brown-stage0-v2.webp`: cún sơ sinh, 433.420 byte.
- `assets/pet/dog-fluffy-brown-stage1-v2.webp`: cún lớn vừa, 484.554 byte.
- `assets/pet/dog-fluffy-brown-stage2-v2.webp`: trưởng thành, 479.902 byte.
- Cả ba: 1254 × 1254, alpha có giá trị 0 và 255, nền trong suốt thật. Màn game chỉ tham chiếu bảng của giai đoạn hiện tại. Trang duyệt tải cả ba.
- `assets/pet/bow-blue-tuft-v1.webp`: chỏm tóc/nơ xanh riêng, 512 × 341, 23.882 byte. Chỉ thử trong trang duyệt, có checkbox đeo/tháo và vị trí riêng theo từng tư thế sơ sinh. Không tính tiền, không tạo vật phẩm owned, không lưu trạng thái nơ vào hồ sơ.
- Tổng WebP: 1.421.758 byte so với PNG 7.523.287 byte, giảm khoảng 81,1%. PNG gốc không đổi, giữ trong lịch sử Git và workspace `output/pet-art/masters-v2`; chỉ phân phối WebP trên web.
- `docs/pet-art-preview.html`: xem ba giai đoạn và từng tư thế.

Ảnh được tạo bằng imagegen tích hợp, lấy bảng tạo hình v2 đã duyệt làm tham chiếu. Bản trưởng thành chỉnh thêm tỉ lệ đầu/thân để phân biệt rõ hơn; phụ kiện tạo riêng. Prompt ghi trong pet-art-v2-prompts.json. Theo yêu cầu Claude, đổi định dạng bằng Pillow quality 88/method 6; atlas không resize, nơ thu nhỏ Lanczos. Kiểm tra alpha WebP giải mã khớp chính xác với ảnh đầu vào sau bước resize. Vùng cắt SVG trong `PetView.frameRects` giữ nguyên; hai góc trưởng thành có clip polygon để loại pixel hàng bên cạnh. PNG v1/v2 giữ trong lịch sử Git và thư mục ảnh sinh gốc.

## Hợp đồng tư thế

Thứ tự 16 vùng: idle, walk-A, sit, sleep, wake, eat, wag-A, tilt, hop, sniff, chase, happy, celebrate, walk-B, wag-B, rest.

13 tư thế đã chốt đều có ở mỗi giai đoạn. Đây là hoạt ảnh đổi tư thế; walk/wag luân phiên hai khung, kết hợp chuyển vị trí và hiệu ứng CSS của game. Không phải 16 khung liên tiếp của cùng một chuyển động. Sơ sinh có đầu to/bụng tròn/chân rất ngắn; lớn vừa có thân/chân rõ hơn; trưởng thành thân/ngực rộng và đầu nhỏ hơn tương đối. Cùng màu lông và khuôn mặt để nhận ra cùng một bạn cún.

## Giới hạn thay đổi

- Chỉ lớp vẽ/hoạt ảnh `pet-view.js` và tài nguyên hình; không đổi Pet.tx, giá 10/15/50, tăng trưởng, sao, Storage, Cloud hoặc Quiz.
- `KIND = dog-fluffy-brown` giữ nguyên. Không đổi mã dữ liệu khi thay bộ hình.
- Timer khung hình dừng khi rời màn/ẩn tab; trở lại chỉ resume idle. Giảm chuyển động tắt timer khung hình, kể cả khi người dùng đổi cài đặt lúc đang mở.
- Giới hạn vị trí đi lại theo chiều rộng phòng để không cắt cún trên mobile.
- `index.html`: tăng cache cho pet-view; nhãn Trang chủ dùng lbl-short để xuống dòng ở 360px như các nhãn khác.

## Kiểm tra

- `node tests/pet-art.e2e.js`: 3 giai đoạn × 13 tư thế; ảnh thật tải được; vẽ không đổi hồ sơ; mã KIND; giới hạn phòng 360/390/430/1280px; nhãn rail; đổi khung đi bộ; dừng timer; giảm chuyển động.
- `node tests/pet.test.js`, `node tests/pet-challenge.test.js`, `node tests/pet.e2e.js`: kiểm tra lại luật chăm cún và luồng nhận nuôi/sao lưu.
- `python tools/inspect_pet_sheets.py --v2`: đọc alpha và đo vùng nhân vật; chỉ đọc, không sửa ảnh.
- Test trang duyệt: nơ là lớp riêng, có ở cả 14 tư thế sơ sinh khi bật; tháo nơ không thay bảng hình gốc và không hiện trên hai giai đoạn chưa duyệt phụ kiện.
- `node tests/pet-mobile-payload.e2e.js`: mở lạnh từng giai đoạn ở 390×844 trong context Chromium mới, theo dõi byte ảnh qua HTTP route local. Mỗi lần chỉ 1 request ảnh cún, không tải atlas giai đoạn khác hoặc nơ. Báo cáo `tests/out/pet-mobile-payload.json`; đây là byte thân ảnh, không phải thời gian mạng Production.
- Tạo lại WebP: `python tools/convert_pet_webp.py --source-dir <thư mục PNG gốc>`; script không sửa nguồn và xác nhận alpha.
- Đã xem ảnh chụp từng tư thế và màn mobile. Chờ Claude review trên nhánh mới trước khi merge.
