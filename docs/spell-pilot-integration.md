# Pilot sửa chính tả — tích hợp 31/10/2026

Nhánh `integrate/spell-fix-pilot`, từ main `dc9b4e5`. Rebase bản sao của `feat/dang-bai-moi-dot0`; nhập nội dung Claude `3d282b4` thành `649605a`. Hai nhánh nguồn giữ nguyên. Chưa merge main.

## Cách thử
- Mở URL preview với `?pilot=1`. Dải báo chế độ thử và hồ sơ tách biệt phải hiện. Tắt bằng `?pilot=0`.
- Nhập tên trong hồ sơ thử, chọn lớp 3, Tiếng Anh GĐ2 học cộng dồn, Ms Hoa đến U6 L2. Thẻ báo đủ 12/12 từ; không tự mở rộng phạm vi nếu thiếu.
- Đo đầu 12 câu trước luyện. K2: `Choose the correct spelling: ___ your teeth (đánh răng)` phù hợp đáp án `brush`.
- Luyện 12 từ, mỗi lượt chỉ chọn một biến thể dinner. Xóa một chữ hoặc chọn khe và chữ cần điền. Sai lần đầu tô vị trí có thể sửa; lần hai hiện cách viết. Các vị trí cho cùng một từ có cùng responseKey.
- Đo lại từ ngày thứ 3 kể từ lượt luyện hoàn tất gần nhất; quá 5 ngày vẫn ghi đúng ngày thực tế. Mỗi lượt luyện chỉ có một lượt đo lại hoàn tất. Làm lượt luyện mới sẽ bắt đầu mốc chờ mới.
- Lượt dở tiếp tục bằng cùng nút, lưu số lần thử trước đó; các câu đã xong không phát lại. Điểm của phiên tiếp tục chỉ tính phần còn lại; sao đã nhận trong hồ sơ thử được giữ.

## Giới hạn diễn giải
Kết quả đo là nhận diện chính tả qua trắc nghiệm, không phải bằng chứng thành thạo tự viết. Bố mẹ đọc cho viết giấy didn't/dinner/smiled để đối chiếu. So sánh đo đầu/đo lại hiển thị trên thẻ, không kết luận hiệu quả chỉ từ một lần thử.

## Lưu và cô lập
`spellPilot_v1` trong Storage của hồ sơ thử: runId/kind, ngày thực tế, questionIds, entries theo targetId; mỗi lần nộp có responseKey, response, đúng/sai, assistanceUsed/Shown, timeSpentMs. Chỉ ghi kết quả trước khi phát phản hồi; đọc lại xác nhận ghi thành công.
Không ghi hộp ôn tập, LearningEngine, wrong-history hoặc tiến độ chủ đề ở cả luyện lẫn đo. Không xóa lỗi cũ của câu probe. Không gọi Today.onSessionFinish. Thưởng dùng Quiz, không theo số nút bấm. Không lưu lên API/Cloud trong chế độ thử. Câu pilot không vào kế hoạch/đề tuần/thử thách cún. Tên và ID câu cũ giữ nguyên.

## Kiểm thử
- Node: tests/spell-integration.test.js kiểm schema/đáp án/responseKey, các tác dụng phụ của Quiz, lịch đo lại, nộp trùng; tests/pilot-spell-fix.test.js kiểm nội dung Claude.
- Browser: tests/spell-pilot.e2e.js, 390/1280px, Edge; đo đầu/luyện/đo lại, tải lại giữa lần sai, lỗi probe cũ giữ nguyên, không gửi ghi lên Apps Script, không tràn ngang. Ảnh trong tests/out, không deploy ảnh kiểm thử.
- Khung cũ: tests/qtypes.e2e.js (trắc nghiệm/nghe chọn tranh/sắp xếp, cô lập hồ sơ thử). Kết quả hồi quy cuối ghi trong PR.
- Máy này không có Chromium bundled; chạy Edge bằng PLAYWRIGHT_CHANNEL=msedge. Không suy kết quả này thành đã thử iPad/iPhone thật.

## Kết quả trước PR
- 18 bộ Node đạt; nội dung pilot 737 kiểm tra, tích hợp 122 kiểm tra.
- 19 bộ E2E đạt trên Edge: arena, audiobooks (mô phỏng lỗi âm thanh), companion, en-books, en-midterm-images, en-midterm, gen, home, layout-regression, pet-accessory, pet-art, pet-mobile-payload, pet-motion, pet-reduced-motion, pet-room, pet, topic-cards, qtypes (145), spell-pilot (102).
- Arena lúc đầu đọc danh sách rỗng trước khi tải đủ bảng; test đã chờ đủ 8 nút, không đổi logic ứng dụng hoặc assert phạm vi. Audiobooks chạy lại với BASE_URL cổng 8765 đúng máy chủ.
- Các lỗi pet-art/payload ghi nhận trước đây không tái hiện ở lượt Edge này; không kết luận đã sửa trên mọi trình duyệt. Không chạy audiobook catalog-live hoặc phát âm thanh nguồn thật trong lượt hồi quy này.
- Generator nội dung chạy lại không đổi JSON. git diff --check sạch. Ảnh kiểm thử chỉ nằm trong tests/out.
