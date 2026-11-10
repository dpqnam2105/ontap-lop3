# Codex → Claude: bàn giao Movers Listening Part 4

Cập nhật 10/11/2026 sau khi Nam nghe thử và xác nhận “ok mượt mà rồi”.

## Đã lên web chính

- PR #22: https://github.com/dpqnam2105/ontap-lop3/pull/22 — merge `e79e977f4061954065a1e3a57f1b102ff07c92a8`.
- PR #23: https://github.com/dpqnam2105/ontap-lop3/pull/23 — merge `f383dcd90c068b0944e6ce74bc39d0843a314b13`.
- Vercel báo success cho cả hai commit; đã kiểm đường vào trên web thật sau triển khai.
- Link nghe thẳng: https://chamhoc.vercel.app/?pilot=1&movers=1
- Trang chủ thường: Tài nguyên → “🎧 Luyện nghe Movers (thử)”. Điện thoại: dưới kế hoạch học; máy tính: thanh trái. Link mở tab mới với noopener/noreferrer, tab gốc không bật pilot. Menu đáy vẫn giữ nguyên.

## Cách dùng và phạm vi

Hộp vào có một câu ví dụ riêng, được nghe và xem đáp án, không tính điểm. Chọn Luyện tập/Mô phỏng rồi chạm Bắt đầu để làm năm câu. Nếu chưa có tên thì dùng hồ sơ “Thử Movers” trong vùng pilot.

Index nạp `js/movers-pilot.js`; bootstrap thoát ngay ngoài pilot. Audio, qtype, CSS và dữ liệu chỉ tải khi mở hộp thử. Sáu câu tự soạn ở `data/pilot/movers-listening-p4.json` (đã chuyển khỏi tests/fixtures), 18 SVG ở `images/questions/lop3/movers/`. Chưa thêm vào kho chủ đề học chính thức hoặc kế hoạch Today.

Pilot dùng localStorage có tiền tố pilot::, Cloud/Sheets không ghi. Kiểm trên context trình duyệt riêng xác nhận key thật không đổi. Bài tự soạn dùng giọng tổng hợp, không phải đề/audio Cambridge chính thức.

## Code đã chốt qua các vòng review

- Audio Promise kết thúc bằng ended/error/cancelled; dừng, phát mới, destroy và chuyển màn hủy token, request, timer, audio và giải quyết Promise đang chờ. Không gọi callback cũ sau hủy. Không có MP3 thì không HEAD, dùng TTS ngay.
- Giữ Speak.speakParts(parts, callback) và Speak.stop(); thêm đối số lỗi tùy chọn thứ ba. Lỗi TTS không tính thành một lượt nghe hoàn tất. Speak.attach chạy trước renderer để không dừng audio vừa tự phát.
- Luyện nghe lại thoải mái, có nghe chậm. Mô phỏng hai lượt hoàn tất; lỗi ở lượt hai chỉ nghe lại một lượt còn lại. Nút Bắt đầu gọi Quiz trong chính thao tác chạm.
- Quiz hỏi feedbackPolicy; mô phỏng chỉ báo “Đã ghi nhận” khi nộp. Cuối phần mới ghi học tập, lịch sử, tiến độ, điểm và tổng thưởng một lần, rồi chữa đủ năm câu với transcript.
- Nộp đôi/kết thúc lặp không ghi trùng. Phòng vệ trùng index giữ mục cuối; luồng thường vẫn khóa sau lần đầu. Bằng chứng lúc nộp giữ thời gian/hint/visibility, không lấy thời gian cuối phần làm thời gian mỗi câu.
- Nút Kết thúc phần nghe ở 2/5 hoặc 0/5 mở “Đã dừng phần nghe — Chưa chấm”, xóa bằng chứng RAM; bỏ qua study log, streak, Today, API và session history. Toàn bộ localStorage không đổi.
- Ví dụ lọt pool: ẩn Kiểm tra, console.warn nhắc splitExample, submit vẫn chặn. Lượt hợp lệ đã tách ví dụ trước khi dựng pool.

## Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| movers-listen.test.js | 35 test đạt |
| movers-deferred.e2e.js | 100 kiểm tra, 390/1280 px |
| movers-lifecycle.e2e.js | 34 kiểm tra, 390/1280 px; đóng tab và kết thúc sớm không ghi dở |
| movers-entry.e2e.js | 36 kiểm tra, gồm click Tài nguyên → tab mới → nghe; đã chạy cả local và web chính |
| qtypes | Node 16 nhóm, E2E 145 đạt |
| Hồi quy khác đã chạy | speak-lang Node 10; en-data; en-books Node 13; en-midterm Node 9; home; Toán batch 1 E2E 47; spell-pilot E2E 102; audiobooks E2E |

E2E là Edge Chromium với speechSynthesis giả; sách nói kiểm nhánh lỗi/mở/đóng/điều hướng, không tuyên bố phát MP3 thật. Home đạt 360/390/430/desktop sau khi thêm link Tài nguyên. Kiểm entry xác nhận vùng bấm ≥44px, không tràn ngang, tab gốc không bật pilot và không POST kết quả.

Nam đã nghe preview và báo ổn, rồi xác nhận lối vào trên web chính mượt. Chưa có xác nhận cụ thể thiết bị, hệ điều hành hay từng thao tác autoplay/đổi câu; không ghi thành Safari iOS/Android đã đạt.

## Còn mở — không tự mở rộng

1. Chưa MP3 và chưa chọn giọng riêng theo nhân vật. Trước audio.src đầu tiên: thêm timeout HEAD 3–5 giây bằng AbortController, test request treo/fallback/retry/callback muộn. Hiện không có src nên không HEAD trong luồng nghe.
2. 18 hình vẫn choiceImageReview pending, chỉ chạy trong pilot. Đã xem ảnh UI 390px và đo layout; chưa đổi ok thay cho kiểm trực quan đủ từng câu, nhất là đồng hồ 4/5/6 và panda/penguin/tiger.
3. Chưa chứng minh autoplay Safari iOS xuyên suốt chỉ từ một lần chạm; nếu máy chưa kêu có nút Nghe để thử lại. Cần kiểm thiết bị cụ thể khi làm tiếp.
4. Lượt mô phỏng chưa hoàn tất ở RAM, reload/thoát là hủy; chưa có resume. Không tự đưa Movers vào Today, đề trộn hay hồ sơ thật.
5. Khi Nam cho Thỏ làm: quan sát con phân biệt phủ định/thời điểm ở q001, q004, q005; không đánh đồng lỗi bẫy với nghe không ra từ.

Chi tiết kỹ thuật: `docs/movers-p4-audio-wiring.md`. Khi làm tiếp, lấy main mới; không dùng trạng thái “PR #22 còn draft/chưa có màn vào” của các tin nhắn cũ.
