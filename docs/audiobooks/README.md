# Sách nói pilot — Kể chuyện Bác Hồ

Nam xác nhận trường đồng ý cho phát sách trên web Thỏ trong hội thoại ngày 2026-10-14. Chỉ dùng MP3 gốc; không tải/đăng lại MP3 hoặc ảnh bìa.

## Kiểm tra 2026-10-14

| Mục | Kết quả |
| --- | --- |
| HTTPS | Đạt; nguồn media.thuvien.edu.vn, đuôi .mp3 |
| Hotlink HTTP | localhost và Referer https://chamhoc.vercel.app/ trả 206 |
| Range bytes=0-1 | 206; Content-Range bytes 0-1/17781827; Content-Length 2. Không có Accept-Ranges; Range thực tế hoạt động |
| Content-Type | audio/mpeg; tổng 17.781.827 bytes |
| Edge desktop, local, 390/1280 | canPlayType probably; phát thật và tua tới 120 giây; nghe tiếp vị trí đã lưu; Escape dừng âm thanh |
| Thời lượng | 1111,36 giây, khoảng 18:31 |
| Nhiều tập | Pilot chỉ xác nhận 1 nguồn MP3; chưa làm danh sách nhiều tập |
| Token/expires/signature | URL không có query/token; không phải cam kết tồn tại lâu dài |
| Kiểm lại >=24 giờ | CHƯA KIỂM; phải mở lại trang trường, so URL và phát lại trước khi kết luận độ bền |
| Chrome desktop / Android / Safari iOS | CHƯA KIỂM trên thiết bị thật |
| Preview Vercel | Build READY; chuyển hướng đăng nhập Vercel. Chưa kiểm phát từ preview; automatic approval review từ chối tạo share URL vì mở rộng quyền truy cập. Nam có thể kiểm bằng phiên đăng nhập sẵn có |

## Hành vi

Bấm Sách nói từ menu trái hoặc Today mở dialog có audio native (không tự phát), tua +/-10s, tốc độ 0,75–1,5x và nút nghe tiếp. Đóng, Escape hoặc đổi màn dừng âm thanh. Nhớ vị trí/rate ở rabbit_audiobook_v1/<tên bé>/<sách> trên máy, không gửi vào Cloud, sao/XP/lịch học. Khách dùng vùng guest. Không tạo proxy.

error hiển thị lời báo + link nguồn. waiting/stalled hiển thị tải, sau 12 giây mới gợi ý mở nguồn; không coi stalled ngay là lỗi vĩnh viễn. Khi không tải được JSON vẫn có link danh mục gốc.

## Chạy kiểm tra

node tests/audiobooks.test.js
BASE_URL=http://localhost:8770/ PLAYWRIGHT_CHANNEL=msedge node tests/audiobooks.e2e.js

E2E chuẩn chặn MP3 để kiểm nhánh lỗi mà không cần mạng trường. REAL_AUDIO=1 bật kiểm phát và tua nguồn thực tế; báo lỗi nếu nguồn không phát được, không tự bỏ qua.

Kiểm hồi quy: home.e2e trên Edge đạt các khổ 360/390/430 và desktop; unit home đạt. E2E audiobook nhánh lỗi đạt 390/1280. Phát MP3 thật được kiểm riêng trên Edge local, không phải Safari/Chrome Android.
