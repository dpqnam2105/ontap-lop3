# CHANGELOG — Vương Quốc Thỏ (ontap-lop3)

Nhật ký mỗi lần sửa website và push lên GitHub. Mới nhất ở trên cùng.
Chi tiết từng câu hỏi xem thêm ở `data-lop3/CHANGELOG.md`.

---

## 2026-10-02 — Báo cáo kỹ năng cho bố mẹ + Rabbit gợi ý
- **Khu vực Bố Mẹ → khung "🧩 Kỹ năng của con"** (file mới `js/skill-report.js`):
  - Tổng: số câu đã gặp, đã vững, đang sai.
  - **Rabbit gợi ý cho bố mẹ**: tối đa 3 dạng bài con đang sai nhiều nhất (kèm một câu con vừa sai làm ví dụ), dạng sắp vững, dạng đã vững để khen, và nhắc khi có nhiều câu đến hạn ôn.
  - Theo từng môn → từng chủ đề: thanh màu (xanh đậm = vững, xanh nhạt = đúng 1 lần, đỏ = đang sai), nhãn Cần ôn / Đang học / Sắp vững / Đã vững, và các ô kỹ năng nhỏ "vững/đã làm" (vd. "Bảng nhân 8 3/5").
  - Xem được trên máy bất kỳ: chọn tên bé → lấy từ bản sao lưu trên mạng (bé đang dùng máy này thì lấy ngay trên máy).
- **Danh mục kỹ năng** `data-lop3/skills.json`: tên tiếng Việt cho ~200 dạng bài của 4 môn. Câu bảng nhân chia cũ chưa gắn dạng thì tự nhận theo đề (4 × 3 → Bảng nhân 4).
- Lịch ôn ghi thêm số lần làm và số lần đúng của từng câu (dùng cho báo cáo sau này).

## 2026-10-01 — Bật sao lưu tự động
- Gắn URL Apps Script sao lưu (Google Sheet "Thỏ - sao lưu") vào `Cloud.URL`. Đã thử từ web thật: ping, ghi, đọc đều được. Từ giờ sao, sticker, ngọc rồng, tiến độ tự sao lưu; đổi máy gõ đúng tên là lấy lại.

## 2026-10-01 — Sao lưu sao, sticker, ngọc rồng (đổi máy không mất)
- **Sao lưu tự động lên Google Sheet** (file mới `js/cloud.js`): sau mỗi lần sao/XP/sticker/ngọc rồng thay đổi, web gom toàn bộ dữ liệu của bé (sao, sticker, huy hiệu, Level, ngọc rồng, tiến độ chủ đề, câu sai, lịch ôn, kế hoạch hôm nay) và gửi lên sau vài giây; khi đóng tab cũng gửi nốt.
  - Đổi máy hoặc xoá trình duyệt: bé gõ đúng tên cũ → web tự lấy lại và báo "☁️ Đã lấy lại ⭐ … sao · … sticker · … ngọc rồng".
  - Học trên 2 máy: mở web là tự lấy bản tiến xa hơn (theo tổng XP; bằng nhau thì lấy bản mới sửa sau, vd. vừa mua sticker ở máy kia).
  - Chống mất: máy mới (ít tiến độ hơn) không ghi đè được bản tốt hơn trên mạng; mỗi lần ghi đè, bản cũ được chép sang trang "LichSu" (giữ 500 bản gần nhất).
  - Máy chủ: Apps Script riêng `backup-apps-script/Code.gs`, không đụng vào bảng xếp hạng cũ. **Chỉ chạy sau khi điền URL vào `Cloud.URL`.**
- **Khu vực Bố Mẹ → khung "☁️ Sao lưu phần thưởng"**: xem sao/sticker/ngọc rồng của bé trên máy này, giờ sao lưu gần nhất, nút **Sao lưu ngay**, **Tải file sao lưu** (.json) và **Mở file sao lưu** (dùng được cả khi chưa bật máy chủ).
- Sửa lỗi nhỏ: sticker trong túi đồ bị lỗi ảnh thì hiện emoji thay thế (trước đây báo lỗi JavaScript).

## 2026-10-01 — Ôn đúng lúc sắp quên + "Đã vững" + gọn giao diện điện thoại + 60 câu mới
- **Ôn đúng lúc sắp quên** (lặp lại ngắt quãng): mỗi câu con làm được xếp vào 4 hộp. Làm đúng ở một ngày khác thì lên hộp, sau 1 → 3 → 7 → 14 ngày Rabbit mới hỏi lại; làm sai thì về hộp đầu, sáng hôm sau ôn lại.
  - Việc 1 trong "Hôm nay học gì?" giờ là **Ôn lại tối đa 8 câu**: câu từng sai trước, rồi câu đến hạn ôn (ví dụ "1 câu từng sai · 7 câu sắp quên"). Theo giai đoạn đang học.
- **"Đã vững"**: câu đúng ở ít nhất 2 ngày khác nhau là đã vững. Thẻ chủ đề hiện "⭐ n câu đã vững"; vững từ 80% chủ đề thì có nhãn 🌟 Đã vững.
- **Điện thoại gọn hơn**: thanh điều hướng 5 nút cố định ở đáy màn hình (Trang chủ, Học, Cửa hàng, Xếp hạng, Phụ huynh), ẩn thanh tiêu đề trên cùng, thông báo nhỏ hiện ở trên. Link tài liệu chuyển vào cuối thẻ "Hôm nay".
- **Máy tính**: nút đang mở được tô sáng ở thanh bên; Thỏ ở góc dưới nói con hôm nay đã làm được mấy việc.
- **Câu hỏi mới** theo phiếu bổ trợ tuần 6–8 (Toán) và lỗi Tiếng Anh hay gặp — xem `data-lop3/CHANGELOG.md`. Có chủ đề mới **Dãy số cách đều**.

## 2026-10-01 — Đáp án nhiễu sát hơn + trang chủ 2 cột trên máy tính + thẻ "Tuần này"
- **Đáp án nhiễu sát đáp án đúng hơn** (89 câu): các câu tính toán đơn giản trước đây có phương án quá xa (vd. "1/5 của 35" có 7, 30, 40, 50 → bé đoán ngay được). Nay phương án nhiễu nằm sát đáp án (vd. 6, 7, 8, 9):
  - Một phần mấy: 14 câu · Bảng nhân, chia: 72 câu · Sơ đồ đoạn thẳng (một phần mấy): 3 câu.
- **Trang chủ trên máy tính chia 2 cột**: bên trái thẻ "Hôm nay học gì?", bên phải xếp dọc "Tuần này", ngọc rồng, bảng xếp hạng — hết khoảng trống hai bên. Điện thoại vẫn 1 cột.
- **Thẻ "Tuần này của con"**: 7 ô T2–CN, ngày nào học thì ô xanh và ghi số câu đúng; tổng câu đúng tuần này, khen khi nhiều hơn tuần trước (không hiện số âm). Bắt đầu ghi từ hôm nay.
- Bỏ ô "Tiến bộ học tập" 4 số cũ trên trang chủ (đã có trong thẻ Hôm nay và Tuần này).

## 2026-10-01 — Màn "Hôm nay học gì?" + nhiệm vụ thật + tiến độ không bị xoá
- **Trang chủ mới "Hôm nay học gì?"** (khi bé đã có tên): lời chào, chuỗi ngày, sao, thanh Level, lời nhắn của Thỏ và **kế hoạch 3 việc** Rabbit chọn sẵn mỗi ngày, cùng một nút lớn **Bắt đầu học / Học tiếp**. Vẫn có đường "Con muốn tự chọn bài".
  - Việc 1: Ôn lại tối đa 5 câu con từng sai (nếu có).
  - Việc 2: Luyện 10 câu ở chủ đề Toán còn yếu (chọn trong 3 chủ đề có tiến độ thấp nhất, theo giai đoạn đang học).
  - Việc 3: Thử thách tuần (nếu tuần này chưa làm), hoặc 10 câu môn khác (Tiếng Anh / Tiếng Việt xoay vòng).
  - Xong cả 3 việc → **+10 sao** (1 lần/ngày) và pháo hoa. Kế hoạch cố định trong ngày, riêng từng bé.
- Bỏ khung "Nhiệm vụ hôm nay" cũ (chỉ là chữ tĩnh, không đếm được). Ảnh banner và khung nhập tên chỉ hiện khi chưa có tên.
- **Nhớ lớp**: web mặc định Lớp 3 và nhớ lớp bé chọn; nút "Vào học" đi thẳng vào danh sách môn, không bắt chọn lại lớp. Bảng xếp hạng mở đúng tab lớp đang học.
- **Tiến độ chủ đề tích luỹ**: thẻ chủ đề hiện "x/y câu đã đúng" cộng dồn qua các ngày (trước đây tự về 0 lúc nửa đêm), kèm "hôm nay n câu". Tính từ hôm nay trở đi.
- **Màn kết quả mới**: hiện số sao và XP vừa nhận, thanh Level, tiến độ kế hoạch hôm nay, nút **Việc tiếp theo**, **Làm thêm một lượt**, **Về trang chủ**, **Chọn bài khác**.
- Thay các hộp thoại `alert()` ở chỗ bé dùng (thiếu sao, đổi ngọc rồng, hết câu sai, huy hiệu…) bằng thông báo nhỏ của web.
- Ẩn bớt thứ gây nhiễu: mục "Giải đấu" (sắp ra mắt), thẻ Lớp 4/5 "nghỉ hè", tab xếp hạng Lớp 4/5.

## 2026-09-30 — Thêm "Đề trộn tuần này" cho mọi môn
- Trong mỗi môn, dưới thanh chọn giai đoạn có thẻ **🎲 Đề trộn tuần này**: 20 câu lấy xen kẽ từ tất cả chủ đề nằm trong giai đoạn bé đang chọn (phương pháp luyện trộn dạng — interleaving).
- Bộ câu cố định trong một tuần (đổi vào thứ Hai), riêng cho từng bé và từng giai đoạn, nên làm lại được để so điểm; thẻ hiện **điểm cao nhất** của tuần.
- Câu sai trong đề trộn được đưa vào phần **Ôn câu sai**; không làm lệch tiến độ của từng chủ đề.

## 2026-09-30 — Toán lớp 3: chủ đề mới "Toán đố vui kiểu Kangaroo"
- Chủ đề mới **Toán đố vui kiểu Kangaroo** — 21 câu tự soạn theo phong cách kỳ thi Toán quốc tế Kangaroo (IKMC), đều ở GĐ1:
  - Xếp hàng (đứng thứ mấy từ hai phía), cưa gỗ, trồng cây hai đầu, xếp que diêm
  - Gà và chó (đếm đầu, đếm chân), bắt tay, tuổi, lịch, đồng hồ chạy nhanh
  - Chữ số: tổng chữ số, đánh số trang, lập số lớn nhất – bé nhất
  - "Chắc chắn" khi bốc bi, cân bằng táo – lê – dưa, hình thay số, chia kẹo, ốc sên leo cột, so sánh cao thấp
  - Hình nào phải lật mặt mới có được (2 câu có hình)
- Đáp án tính và kiểm tra bằng chương trình.

## 2026-09-30 — Toán lớp 3: chủ đề mới "Sơ đồ đoạn thẳng"
- Chủ đề mới **Sơ đồ đoạn thẳng (toán có lời văn)** — 20 câu, mỗi câu kèm hình sơ đồ (phương pháp "bar model" của Toán Singapore):
  - Phần – tổng (3), nhiều hơn / ít hơn (4), bài toán hai bước (3), một phần mấy (3), tổng – hiệu nâng cao (2), chọn sơ đồ đúng với đề bài (2) — GĐ1
  - Gấp một số lên nhiều lần (3) và chọn sơ đồ "gấp 3 lần" (1) — GĐ2
- 20 hình sơ đồ mới trong `images/questions/lop3/so-do-*.svg`.

## 2026-09-30 — Toán lớp 3: thêm 24 câu tư duy kiểu Bebras
- Chủ đề **Tư duy logic (kiểu Bebras)**: từ 46 lên 70 câu, thêm 8 dạng mới (đều ở GĐ1):
  - Robot đi theo lệnh trên lưới có đá (4 câu, có hình): dừng ở ô nào, chọn dãy lệnh đúng, lệnh lặp, ít lệnh nhất
  - Đường đi ngắn nhất trên bản đồ có số phút/số mét (3 câu, có hình)
  - Xếp lịch làm việc: việc nào chờ việc nào, làm song song (3 câu)
  - Hàng đợi "đến trước làm trước" và so sánh với chồng đĩa (3 câu)
  - Quy luật lặp lại: hình thứ 20, chuyền bóng, đếm hạt vòng (3 câu)
  - Cân hai đĩa tìm hòn bi nặng hơn với ít lần cân nhất (3 câu)
  - Tô màu / chia nhóm sao cho hai bên nối nhau không trùng (2 câu, có hình)
  - Đèn báo số 8-4-2-1 (3 câu)
- Đáp án được tính và kiểm tra bằng chương trình; 8 hình vẽ mới trong `images/questions/lop3/`.

## 2026-09-30 — Tiếng Anh lớp 3: chia theo giai đoạn học
- Thêm thanh **"Con đang học đến đâu?"** cho môn Tiếng Anh lớp 3, chia theo Now I Know 3 (giả định 6 unit mỗi học kì):
  - HK1 — GĐ1: Unit 1–2 · GĐ2: Unit 3–4 · GĐ3: Unit 5–6
  - HK2 — GĐ4: Unit 7–9 · GĐ5: Unit 10–12
- Cả 196 câu tiếng Anh hiện có đều thuộc GĐ1 (Unit 1–2 và kiến thức nền be / have / can / hiện tại đơn). Các giai đoạn sau sẽ có bài khi lớp học tới.
- Khi chọn "Chỉ giai đoạn này" mà giai đoạn chưa có bài, trang hiện lời nhắc thay vì để trống.

## 2026-09-30 — Toán lớp 3: chia theo giai đoạn học
- Thêm thanh **"Con đang học đến đâu?"** khi vào môn Toán lớp 3: Học kì 1 (GĐ1, GĐ2, GĐ3) và Học kì 2 (GĐ4, GĐ5), bám theo SGK Toán 3 Kết nối tri thức.
  - GĐ1: Chủ đề 1–2 (ôn tập đến 1000, bảng nhân chia 2–9, một phần mấy)
  - GĐ2: Chủ đề 3–4 (hình phẳng, hình khối, nhân chia số có hai chữ số, chia có dư)
  - GĐ3: Chủ đề 5–7 (mm, g, ml, nhiệt độ, nhân chia số có ba chữ số, biểu thức)
  - GĐ4–5: Học kì 2 (số đến 10 000 và 100 000, chu vi, diện tích, La Mã, đồng hồ đến từng phút, tiền)
- Hai cách học: **Ôn cả phần trước** (hiện câu từ GĐ1 đến giai đoạn đã chọn) hoặc **Chỉ giai đoạn này**. Lựa chọn lưu riêng cho từng bé; mặc định GĐ1.
- Gắn nhãn giai đoạn cho toàn bộ 546 câu Toán lớp 3 (GĐ1: 362, GĐ2: 26, GĐ3: 28, GĐ4: 47, GĐ5: 83). Chủ đề không có câu nào trong giai đoạn đang chọn sẽ tự ẩn.
- Bỏ cách ẩn tạm hai chủ đề "Số đến 100 000" và "Cộng trừ trong phạm vi 100 000": nay chúng nằm ở GĐ4–5.
- Tiến độ và câu sai vẫn giữ nguyên, không bị lệch khi đổi giai đoạn.

## 2026-09-30 — Tiếng Anh lớp 3: thêm 92 câu
- **NIK3 Unit 1: Places & directions** (chủ đề mới, 22 câu): nơi chốn trong thành phố (museum, theater, harbor, art gallery, recreation center…), giới từ above / below / beside / close to, câu mệnh lệnh và biển báo (Don't…), câu hỏi Are you…-ing? / Does she…?, đi lại bằng by bus.
- **NIK3 Unit 2: Dinosaurs & Ancient Egypt** (chủ đề mới, 22 câu): từ vựng khủng long và Ai Cập cổ đại, odd one out, has to / have to / don't have to / doesn't have to, câu hỏi Do/Does… have to?
- **Adjectives & Adverbs** (chủ đề mới, 16 câu): tính từ hay trạng từ, quy tắc -ly, y → ily, good → well, fast → fast.
- **Reading: NIK3 Unit 1–2** (chủ đề mới, 12 câu): 3 bài đọc ngắn, mỗi bài 4 câu hỏi.
- **Global Success 3 (tập 1)** (chủ đề mới, 20 câu): chào hỏi, tên tuổi, this/that, cơ thể, sở thích, phòng học, mệnh lệnh trong lớp, đồ dùng học tập, màu sắc, giờ ra chơi.
- Nội dung bám theo các phiếu in NIK3 Unit 1–2 và phiếu Tính từ – Trạng từ đã làm. Các chủ đề tiếng Anh cũ giữ nguyên.

## 2026-09-30 — Toán lớp 3: thêm 36 câu có hình
- **Đếm hình & đường gấp khúc** (chủ đề mới, 20 câu): đếm tam giác, tứ giác, hình chữ nhật, hình vuông trong hình ghép; đường gấp khúc, đổi ra dm, so sánh hai con đường.
- **Tư duy logic (kiểu Bebras)**: +16 câu có hình (lưới 3×3, sơ đồ có/không, đếm đường đi, mã hóa ô đen trắng), từ 30 lên 46 câu.
- 29 hình vẽ SVG trong `images/questions/lop3/`; ảnh câu hỏi tự co giãn trên máy tính.
- Bắt đầu push thẳng lên GitHub (không cần tải file lên tay nữa).

## 2026-09-29 — Toán + Tiếng Việt lớp 3: thêm 226 câu
- Toán: Tư duy số & phép tính (55), Toán có lời văn hay (39), Tư duy logic kiểu Bebras (30).
- Tiếng Việt: Đọc hiểu truyện ngắn (24), Từ, câu, dấu câu đến bài 12 (47), Chính tả theo nghĩa (25), Viết đoạn văn về bạn (6).
- Tạm ẩn hai chủ đề HK2 "Số đến 100 000" và "Cộng trừ trong phạm vi 100 000".

## 2026-09-25 — Viết lại bộ câu lớp 3
- Viết lại toàn bộ câu lớp 3 cho đúng phạm vi và thuật ngữ lớp 3; đáp án chia đều A/B/C/D.

## 2026-09-17 — Cập nhật website
- Nhiều lần tải file lên (chưa ghi chi tiết).

## Tháng 6/2026 — Dựng website
- Dựng website, hệ thống phần thưởng, cửa hàng sao, trang phụ huynh; dựng sườn dữ liệu lớp 3.
