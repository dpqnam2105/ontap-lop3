# Sách nói — 13 cuốn từ thư viện trường

Nam đã báo trường; Ban giám hiệu đồng ý cho phát sách nói của thư viện trên web Thỏ (Nam xác nhận 2026-10-14). Chỉ phát MP3 gốc từ máy chủ trường, ghi nguồn, không tải/đăng lại MP3 hay ảnh bìa.

## Kiểm tra 2026-10-14

| Mục | Kết quả |
| --- | --- |
| HTTPS | Đạt; nguồn media.thuvien.edu.vn, đuôi .mp3 |
| Hotlink HTTP | localhost và Referer https://chamhoc.vercel.app/ trả 206 |
| Range bytes=0-1 | 206; Content-Range bytes 0-1/17781827; Content-Length 2. Không có Accept-Ranges; Range thực tế hoạt động |
| Content-Type | audio/mpeg; tổng 17.781.827 bytes |
| Edge desktop, local, 390/1280 | canPlayType probably; phát thật và tua tới 120 giây; nghe tiếp vị trí đã lưu; Escape dừng âm thanh |
| Thời lượng | 1111,36 giây, khoảng 18:31 |
| Danh mục | 13 cuốn hiển thị ở trang danh mục; mở từng trang và nút Nghe sách, mỗi cuốn có 1 nguồn MP3 được ghi trong JSON |
| Token/expires/signature | URL không có query/token; không phải cam kết tồn tại lâu dài |
| Kiểm lại >=24 giờ | CHƯA KIỂM; phải mở lại trang trường, so URL và phát lại trước khi kết luận độ bền |
| Chrome desktop / Android / Safari iOS | CHƯA KIỂM trên thiết bị thật |
| Preview Vercel | Build READY; chuyển hướng đăng nhập Vercel. Chưa kiểm phát từ preview; automatic approval review từ chối tạo share URL vì mở rộng quyền truy cập. Nam có thể kiểm bằng phiên đăng nhập sẵn có |

## Hành vi

Bấm Sách nói từ menu trái hoặc Today mở dialog có bộ chọn 13 cuốn theo 3 nhóm và audio native (không tự phát), tua +/-10s, tốc độ 0,75–1,5x và nút nghe tiếp. Đóng, Escape hoặc đổi màn dừng âm thanh. Nhớ vị trí/rate ở rabbit_audiobook_v1/<tên bé>/<sách> trên máy, không gửi vào Cloud, sao/XP/lịch học. Khách dùng vùng guest. Không tạo proxy.

error hiển thị lời báo + link nguồn. waiting/stalled hiển thị tải, sau 12 giây mới gợi ý mở nguồn; không coi stalled ngay là lỗi vĩnh viễn. Khi không tải được JSON vẫn có link danh mục gốc.

## Chạy kiểm tra

node tests/audiobooks.test.js
BASE_URL=http://localhost:8770/ PLAYWRIGHT_CHANNEL=msedge node tests/audiobooks.e2e.js

E2E chuẩn chặn MP3 để kiểm nhánh lỗi mà không cần mạng trường. REAL_AUDIO=1 bật kiểm phát và tua nguồn thực tế; báo lỗi nếu nguồn không phát được, không tự bỏ qua.

Kiểm hồi quy: home.e2e trên Edge đạt các khổ 360/390/430 và desktop; unit home đạt. E2E audiobook nhánh lỗi đạt 390/1280. Phát MP3 thật được kiểm riêng trên Edge local, không phải Safari/Chrome Android.

## Mở rộng 13 cuốn — 2026-10-14

Nam yêu cầu đưa đúng 13 cuốn hiển thị trong danh mục lên web. Tên và URL được đọc từ trang thư viện qua trình duyệt, mở từng trang và nút Nghe sách; không chạy bot cào danh mục và không lấy ảnh bìa. Nhóm Truyện và lịch sử: 5; Kỹ năng sống: 5; Khám phá thế giới: 3. Đây là 13 cuốn đang hiển thị, không khẳng định đã lấy hết những cuốn ẩn sau Xem thêm.

- source-checks-13.json: đủ 13 nguồn HTTPS, audio/mpeg, 206 + Content-Range khi Referer là web Thỏ; không có token/expires/signature trong URL.
- live-checks-13.json: Edge local phát/tua thật từng cuốn, kiểm vị trí lưu riêng, đổi sách và quay lại nghe tiếp; kiểm giao diện 390/1280px. Không tự tải 13 MP3 cùng lúc; chỉ cuốn chọn hiện tại.
- Unit kiểm đủ 13 ID/pageUrl/audioUrl không trùng, có tên/nhóm/ngày kiểm, đúng HTTPS/tên miền. E2E offline giữ ca JSON 404 mở link nguồn và lỗi MP3.
- Android/iPhone Safari và kiểm lại sau >=24 giờ vẫn CHƯA KIỂM. Preview vẫn giữ bảo vệ, không tạo share URL.

Chạy kiểm trực tiếp nguồn (cần mạng): BASE_URL=http://localhost:8771/ PLAYWRIGHT_CHANNEL=msedge node tests/audiobooks-catalog-live.e2e.js
