# Movers Listening Part 4 — audio và Quiz thử nghiệm

Ngày rà: 2026-11-10. Chưa phát hành; không merge trước khi Claude review.

## Màn nghe thử bổ sung theo yêu cầu Nam

Sau khi Nam báo không tìm thấy từ trang chủ: thêm link “Luyện nghe Movers (thử)” vào rail Tài nguyên, Today tự chép vào Tài nguyên điện thoại. Link mở tab mới với noopener/noreferrer, tab gốc không bật pilot. Không thêm vào menu đáy hoặc kế hoạch tự động. Entry E2E kiểm lối vào này ở 390/1280, vùng bấm ≥44px và không tràn ngang.

Mở preview với `?pilot=1&movers=1` để vào thẳng hộp nghe thử. Hoặc bật `?pilot=1`, bấm “🎧 Thử nghe Movers” ở dải vàng đầu trang. Nghe câu ví dụ (không tính điểm), có thể xem đáp án ví dụ; chọn Luyện tập/Mô phỏng rồi chạm “Bắt đầu phần nghe (5 câu)”. Nếu chưa có tên, dùng hồ sơ riêng “Thử Movers” trong vùng pilot.

Index chỉ nạp bootstrap `movers-pilot.js`. Ngoài pilot, bootstrap thoát ngay: không có nút và không tải module/audio/CSS/dữ liệu Movers. Trong pilot, các phần này chỉ tải khi mở hộp nghe. Dữ liệu sáu câu chuyển từ fixture sang `data/pilot/movers-listening-p4.json`, chưa vào kho bài học chính thức hay kế hoạch Today.

Nút bắt đầu gọi Quiz trong chính thao tác chạm; không coi đây là bằng chứng autoplay iOS hoạt động xuyên suốt. Chưa MP3, chưa duyệt hình ok. Bản này mới mở preview để Nam nghe thật, vẫn không merge main.

`tests/movers-entry.e2e.js`: 24 kiểm tra ở 390/1280 px qua đường người dùng thật, mở ví dụ → nghe → xem đáp án → chọn mô phỏng → bắt đầu năm câu → kết thúc sớm. Giọng giả, không POST mạng, key thật không đổi; không pilot không tải payload Movers. E2E deferred 100 và Node 35 vẫn đạt sau chuyển đường dữ liệu.

## Phạm vi

- Nhận bản Claude gửi trong `5files.zip`: 29 test gốc đạt trước khi sửa tiếp.
- Sáu câu đã rà nội dung nằm ở `data/pilot/movers-listening-p4.json`: một ví dụ, năm câu tính điểm. 18 SVG ở `images/questions/lop3/movers/` vẫn để `choiceImageReview: pending`.
- Chưa thêm danh mục, chủ đề hoặc dữ liệu học chính thức. Index nạp bootstrap thoát ngay ngoài pilot; module chỉ tải khi mở hộp thử. Dữ liệu thật được kiểm không thay đổi.
- `MoversP4.splitExample()` phải được gọi khi dựng lượt: ví dụ ở bước hướng dẫn riêng, chỉ năm câu scored vào Quiz. Quiz chặn nộp ví dụ như lớp phòng vệ bổ sung.

## Hợp đồng audio

`MoversAudio.play()` và `playTwice()` trả Promise kết thúc bằng `ended`, `error` hoặc `cancelled`. `onPass` chỉ chạy khi một lượt phát hết; `onEnded` chạy khi kết thúc hoặc lỗi, không chạy sau hủy. Stop, chuyển màn, phát mới và destroy hủy HEAD, audio, timer và giải quyết Promise đang chờ.

Không có MP3 thì dùng TTS ngay, không gọi HEAD. Có MP3 thì kiểm HEAD, lỗi media có thể chuyển TTS; lỗi play báo lỗi để thử lại. Chỉ đọc text của hội thoại, không đọc nhãn nhân vật. Hiện chưa chọn giọng riêng theo nhân vật.

App hiện có Speak làm cơ chế TTS. Giữ `Speak.speakParts(parts, callback)` và `Speak.stop()`; bổ sung đối số thứ ba tùy chọn `onError` cho Movers, vì lỗi TTS không được tính như một lượt nghe hoàn tất. Caller cũ không đổi hợp đồng. Quiz attach Speak trước khi renderer tự phát để không dừng nhầm audio mới.

## Phản hồi hoãn

Quiz hỏi `T.feedbackPolicy({mode, q})`. Chế độ test của Part 4 trả `deferred`, luyện trả `immediate`.

- Nộp bài mô phỏng chỉ hiện cùng một thông báo “Đã ghi nhận”, khóa lựa chọn, không lộ đúng/sai, transcript, âm báo hay điểm.
- Giữ câu trả lời, thời gian, hint và trạng thái giám sát tại thời điểm nộp. Chỉ khi đủ câu mới ghi học tập, lịch sử, tiến độ và thưởng; không lấy thời gian cuối phần làm thời gian từng câu.
- Gọi tự động khi chưa đủ câu không ghi gì. Nút riêng “Kết thúc phần nghe” gọi `_finish({earlyEnd:true})`: nếu chưa đủ câu thì hủy bằng chứng, đóng audio/guard và mở màn “Đã dừng phần nghe / Chưa chấm”, không chạy study log, streak, Today, API hay session history. Nộp đôi hoặc gọi kết thúc lặp không ghi trùng. Cuối phần có năm mục chữa bài, đáp án, transcript và giải thích.
- Phòng vệ trùng index giữ mục cuối trước khi flush; luồng thường vẫn khóa sau lần nộp đầu. Tổng thưởng dùng một lần addStar và một lần addXP. Ví dụ lọt pool ẩn nút Kiểm tra và cảnh báo console yêu cầu splitExample.
- Dạng cũ không khai báo policy giữ luồng hiện có. Luyện Part 4 vẫn phản hồi ngay.

## Kiểm chứng

Node: `node tests/movers-listen.test.js` — 35 test, gồm 29 ca Claude và sáu ca bổ sung về Promise hủy, lỗi audio, nhãn hội thoại và tô đáp án khi chữa.

Trình duyệt: `node tests/movers-deferred.e2e.js` — 100 kiểm tra, Edge Chromium 390/1280 px, qua Quiz và Speak thật với speechSynthesis giả. Bao gồm hai lượt nghe, ví dụ không tính điểm, hoãn toàn bộ phản hồi, nộp đôi, kết thúc sớm/lặp, chữa đủ năm câu, luyện vẫn phản hồi ngay, không POST ra Sheets và không đổi localStorage thật. Ảnh chạy test lưu trong `tests/out/movers-*.png`.

Hồi quy đã chạy: qtypes Node/E2E (16 nhóm / 145 kiểm tra), speak-lang Node (10), en-data, en-books Node (13), en-midterm Node (9), home E2E và Toán batch 1 E2E.

Rà tiếp theo góp ý Claude: `node tests/movers-lifecycle.e2e.js` — 34 kiểm tra ở 390/1280 px. Qua Speak thật, giả sự kiện lỗi ở đầu lượt nghe thứ hai: hiện thông báo lỗi, bật lại Nghe, chỉ phát lại đúng một lượt còn lại. Caller hai đối số vẫn nhận callback theo hành vi cũ. Bổ sung ca kết thúc bằng nút thật ở 2/5 và 0/5: có màn chưa chấm, bằng chứng bị xóa, mọi key/value localStorage không đổi; kết thúc lặp không ghi gì. Làm hai câu (một sai, một đúng), chuyển sang câu ba rồi đóng tab thật: toàn bộ key/value localStorage, gồm cả vùng pilot, giống hệt snapshot trước khi trả lời; tab mới mở nguồn tĩnh cũng không có dữ liệu câu trả lời sót lại. Snapshot lấy sau khi app/hồ sơ đã khởi tạo, không coi thao tác đăng nhập/khởi tạo là một phần lượt thi.

Chạy lại hồi quy sau góp ý: qtypes E2E 145, spell-pilot E2E 102 và audiobooks E2E 390/1280 + JSON 404 đều đạt. Sách nói dùng HTMLAudio riêng, không gọi Speak; spell-fix không gọi speakParts. Kiểm sách nói này là nhánh lỗi/mở/đóng/điều hướng, không phải nghe MP3 thật.

## Chưa kiểm / bước sau

- Chưa có MP3, chưa nghe giọng thật hoặc kiểm Safari iOS/Chrome Android trên thiết bị thật. Speech giả không chứng minh phát âm, chất lượng nghe hay autoplay hoạt động trên máy bé.
- Đã có màn vào riêng trong pilot; chưa có mục Movers ở web thường. Chưa duyệt `imageReview: ok` chỉ dựa trên test.
- Câu trả lời mô phỏng đang chờ được giữ trong RAM; thoát/reload trước cuối phần mất lượt chưa hoàn tất. Không coi đây là cơ chế tiếp tục bài hoặc giao dịch lưu trữ chống crash.
- HEAD chưa có timeout riêng; người dùng có thể dừng/hủy. **Trước khi gắn `audio.src` đầu tiên**, bắt buộc thêm hạn 3–5 giây với AbortController và test HEAD treo → fallback, hủy/chuyển câu → không callback muộn, retry không dùng kết quả lỗi đã cache. Hiện fixture không có src nên chưa gọi HEAD trong luồng người dùng.
- Trước khi mở cho bé: nghe giọng thật trên điện thoại (đặc biệt autoplay Safari iOS), kiểm đủ 18 hình trong app 390 px rồi mới đổi duyệt hình; không suy ra các kiểm này từ speech giả.
- Màn thử vừa bổ sung theo yêu cầu Nam, cần Claude rà phần bootstrap/UI mới; không merge main tự động.
