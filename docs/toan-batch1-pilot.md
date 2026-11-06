# Toán bổ trợ tuần 9–11 — bản thử để Nam/Claude review

Chỉ mở bằng `?pilot=1`. Chưa mở cho hồ sơ học thật. Vùng lưu pilot có tiền tố riêng do pilot-guard hiện có quản lý; Cloud/Sheets vẫn bị chặn. Tắt bằng `?pilot=0`.

## Thử từ giao diện

1. Mở preview hoặc local với `?pilot=1`, nhập tên thử, chọn lớp 3.
2. Vào Toán, chọn Giai đoạn 2 (GĐ1 không hiện hai thẻ thử).
3. Cuối danh sách có **Chia hết – chia có dư (thử)** và **Dãy số cách đều (thử)**, 60 câu mỗi chủ đề. Bấm thẻ rồi Luyện tập hoặc Kiểm tra.
4. Làm sai một câu rồi tải lại trang; Ôn câu sai phải mở đúng ID và câu đã gặp. Đổi tên hồ sơ không được nhận tiến độ/câu sai của tên trước.

Kho mẫu: 15 câu mỗi dạng chia (đựng hết: 8 chia hết, 7 có dư), 30 câu mỗi dạng dãy số. 3165 biến thể chỉ là nguồn cho test/chọn ID; app không gọi generateAll(). Công thức hiển thị giữ `(n − 1) × khoảng cách + số bé nhất của dãy`.

## Wiring

- Core `js/toan-batch1.js`: cùng v1/ID sinh cùng câu, choices và đáp án; giữ fixture v1 nguyên vẹn. Chỉ thêm wrapper browser/CommonJS, không đổi thuật toán.
- Adapter `js/toan-batch1-adapter.js`: bản Claude có kiểm từng câu/try-catch theo ID. Bổ sung cấu hình manifest cho browser; Node vẫn require file JSON. Manifest nằm ở `data-lop3/toan/toan-batch1-ids.json`.
- `API._getAllDataV3`: chỉ trong pilot lớp 3 mới fetch manifest và augment trước LearningEngine chuẩn hóa. Chưa có cấu hình hợp lệ thì không bật batch này.
- `ToanBatch1Web.attachData`: dùng dữ liệu App đã chuẩn hóa; hai chủ đề đăng ký Storage.registerIdTopic, không đổi kho/tiến độ chủ đề cũ. Gắn `manualOnly`, stage 2 và tên/biểu tượng thử.
- App mở môn, Today._qIndex và Quiz.startWrongReview gọi restore trước tìm ID; lấy đúng hai Storage getter của hồ sơ đang chọn. Câu khôi phục ngoài kho mẫu được chuẩn hóa qua cùng LearningEngine và giữ stage 2.
- Đổi dữ liệu thì vô hiệu Today._qIdxCache. Gọi khôi phục nhiều lần không nhân câu. Tìm câu batch theo ID, không dự phòng theo chữ đề. ID không hỗ trợ giữ trong lịch sử, báo “Một số câu ôn chưa tải được”, không báo nhầm hoàn thành.
- `manualOnly` loại chủ đề khỏi chọn chủ đề tự động, đề trộn và thử thách cún. App thêm riêng hai thẻ mở thủ công. Câu đã làm vẫn có thể ôn qua lịch sử/câu đến hạn. Không thêm nội dung mới vào phạm vi học thật.

## Kiểm

Chạy với Node (không cần thư viện cho hai bộ đầu):

```
node tests/toan-batch1.test.js
node tests/toan-batch1-adapter.test.js
```

Kiểm browser, có Playwright và máy chủ static:

```
BASE_URL=http://127.0.0.1:8773/ PLAYWRIGHT_CHANNEL=msedge node tests/toan-batch1-web.e2e.js
```

PowerShell: đặt `$env:BASE_URL`, `$env:PLAYWRIGHT_CHANNEL` trước rồi chạy Node. Không cần quyền mạng tới Sheets; test chặn request ở trình duyệt.

E2E kiểm 390/1280px: ngoài pilot không có chủ đề hoặc request manifest; 60+60 câu có tên và adaptive; GĐ1 ẩn/GĐ2 mở; bấm thẻ thật; sai rồi đúng không được thưởng lại; câu ngoài mẫu khôi phục sau reload; tiến độ theo ID; hồ sơ khác trống; ID hỏng không báo nhầm hết câu sai; lớp 2 không có batch; 0 POST từ pilot và localStorage thật nguyên vẹn. Ở 390 có thêm phép thử thu hẹp khung đáp án còn 220px và tăng chữ để kiểm xuống dòng, không sửa CSS sản phẩm.

Ảnh local lưu trong `tmp/math-batch1-shots/`: 390/1280 trước và sau chữa; `390-large-text-wrong.png` là phép thử chữ lớn/khung hẹp. Không commit ảnh test sinh tự động.

## Giới hạn

- Chưa merge/main, chưa mở ngoài pilot. Không tính khả năng nghe máy thật: đây là Toán, nút đọc chung vẫn giữ quy tắc cũ.
- Source của Claude đã được đối chiếu trực tiếp từ ZIP và hai file adapter gửi lại; lần gửi lặp có hash giống nhau.
- Sau review, việc mở chính thức cần chốt phạm vi bổ trợ và cách chọn lượt mới từ nguồn 3165 câu; bản này chỉ có kho mẫu cố định 120 câu để kiểm luồng.

## Sửa sau review PR #19

- API lấy số câu dự kiến từ manifest; `added + present` đủ mới bật pilot. Test gọi API hai lần và giả lập augment trên cùng list để lần trả về `added: 0, present: 120` vẫn giữ hai chủ đề.
- Lượt ôn không tải được gọi Today với `blocked`; lượt ôn được một phần gọi với `partial`. Không đánh dấu xong nhiệm vụ, không thưởng kế hoạch. Phần tải được vẫn học bình thường; cuối lượt có thông báo phần chưa tải được.
- `ToanBatch1Web.restore()` tự đặt `Today._qIdxCache = null` khi thêm câu. Không cần lặp thao tác này ở App.
- E2E tích hợp: 40 kiểm tra, gồm cả hai đường mở ôn, trạng thái Today và thông báo cuối lượt thiếu câu. Ảnh là thao tác kiểm thử tự động, không phải bài làm của Thỏ.
- Ảnh `390-dung-het-full.png`: câu dài nhất dạng đựng hết trong kho mẫu; `390-large-text-wrong.png`: vừa chọn sai, chưa chữa, khung đáp án 220px và chữ 28px. Khung 220px là phép thử CSS tạm thời, không phải chiều rộng toàn màn hình.
