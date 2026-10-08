# CHANGELOG — Vương Quốc Thỏ (ontap-lop3)

## 2026-10-08 — Phản hồi Thỏ (nhánh pet-smooth-growth, chờ review)
- Giữ vị trí cún qua render, đi tới nơi mới làm hành động, quay hướng và dừng CSS/RAF khi ẩn tab; thêm test chuyển động. Chỉnh atlas trưởng thành v3 cho đầu/mặt cân đối, rà lại neo nơ và silhouette chống lẫn ô. Nới phòng mobile/desktop nhẹ; không thêm nhà tắm, không đổi dữ liệu/giá/luật. Kèm GIF và ảnh trước/sau để duyệt.

## 2026-10-07 — Nơ cho cún (nhánh pet-accessory, chờ review)
- Thêm nơ xanh 50 sao trong Trang trí, mua một lần và đeo/tháo miễn phí cho cả ba giai đoạn; neo theo từng khung, tạm ẩn khi ngủ. Tủ phụ kiện nằm ở profile.petWardrobe, ghi cùng sao qua Pet.tx và giữ được khi tab pet v1 chăm cún. Có test bấm đúp/save lỗi/khôi phục Cloud/tư thế; dùng ảnh đã có, không imagegen thêm.

## 2026-10-07 — Phòng cún mẫu (nhánh pet-room-art, chờ duyệt hình)
- Review tiếp: giường/bát xanh trả sao chuyển sang navy, đồ cơ bản giữ nguyên; id/giá không đổi. Test so trực tiếp màu WebP với default cho mọi món, kèm ảnh so default/full xanh 1280px.
- Review: toàn bộ đồ trả sao xanh/hồng có hình recolor từ default, giữ texture/độ sáng/alpha, không imagegen thêm; giường gồm hai lớp cùng canvas. Thêm test mọi item có ảnh và mua full bộ trên web, kèm ảnh 1280px xanh/hồng.
- Vẽ nền tường/sàn gỗ/cửa sổ và năm món cơ bản, giường hai lớp; WebP khoảng 225KB, chỉ tải đồ đang đặt. Tách vùng đi wide/narrow; giữ id/giá/dữ liệu cũ và màu tường đã mua. Có ảnh 390px/1280px để Nam duyệt; chưa làm biến thể màu hoặc phụ kiện.

## 2026-10-07 — Khung nhìn phòng cún mobile
- Viewport x140–860 cho màn ≤750px; dời đồ và giới hạn vùng đi để cún không bị cắt. Resize không chào lại; thêm hợp đồng hình và mốc gỡ mirror. Chưa vẽ phòng mẫu.

## 2026-10-07 — Khung phòng cún (nhánh pet-room-frame, chờ review)
- Thêm template 1000×625 và manifest giữ id/giá cũ; chuyển phòng phẳng sang slots có tương thích bản web cũ. Hành vi tìm điểm theo khả năng, depth theo chân đang hiển thị, giường tách lưng/viền trước; kích thước cún theo giai đoạn nằm trong template. Chuyển style bộ hình sang pet.css. Có test dữ liệu, mobile và khôi phục sao lưu; chưa thêm bộ hình phòng mới, không đổi Storage/Cloud.

## 2026-10-07 — Bộ hình cún nâu (nhánh pet-art, chờ review)
- Phân phối WebP: 3 atlas giữ 1254px; nơ 512px. Tổng 7,52MB PNG → 1,42MB WebP (giảm 81,1%), alpha giữ nguyên; chỉ tải atlas giai đoạn đang dùng. Giữ PNG nguồn riêng, thêm test lượt mở lạnh mobile.
- V2 theo mẫu Nam duyệt: sơ sinh mũm mĩm như cục bông, lớn vừa có chỏm tóc, trưởng thành thân/ngực rộng và đầu nhỏ hơn tương đối. Thay bảng hình v1 bằng v2; nơ xanh/chỏm tóc là ảnh riêng với nút thử đeo/tháo trong trang duyệt, chưa thêm vào shop hoặc hồ sơ.
- Thay SVG demo bằng hình cún nâu lông xoăn đã duyệt: 3 giai đoạn, đủ 13 tư thế; đi bộ/vẫy đuôi dùng hai khung. Giữ KIND và toàn bộ luật/dữ liệu/giá. Chặn đi ra ngoài phòng trên mobile, dừng timer khung khi rời màn/ẩn tab, tôn trọng giảm chuyển động. Sửa nhãn Trang chủ ở 360px; thêm trang duyệt bộ hình và test luồng vẽ.

## 2026-10-07 — Nhà cún v1 (nhánh pet, chờ review)
- Mở shop theo giá Nam chốt: hạt 10⭐/phần, bánh 15⭐/phần, đồ xanh/hồng cùng 50⭐. Bánh tăng trưởng như hạt, có phản ứng vui riêng; không thêm hoạt động mới.
- Review vòng 2: Cho ăn trực tiếp từ túi, mở/cuộn panel khi hết đồ hoặc đủ bữa; menu mobile 7 ô nằm trong CSS chung với nhãn ngắn. Giữ bản cún lỗi trong petBroken, cho đón lại bằng quyền đã dùng nếu cún không còn hợp lệ; khóa mua 600ms và quay lại tab chỉ tiếp tục idle.
- Thêm màn Nhà cún, tương tác cho ăn/chơi/trang trí và dữ liệu trong hồ sơ; tối đa 3 bữa lớn/ngày, lớn ở 10/30 bữa. Hoàn thành thử thách 15 câu (5 câu mỗi môn Toán/Tiếng Việt/Tiếng Anh, theo bộ lọc hiện tại) để nhận nuôi miễn phí và có 6 phần hạt. Quyền nhận nuôi được lưu trước khi đặt tên; không tính thử thách vào đề trộn tuần hoặc nhiệm vụ hôm nay. Shop đã mở; PR chờ Claude review. Không đổi Storage/Cloud.

Nhật ký mỗi lần sửa website và push lên GitHub. Mới nhất ở trên cùng.
Chi tiết từng câu hỏi xem thêm ở `data-lop3/CHANGELOG.md`.

---


## 2026-10-07 — Vòng 10: ghi bài lô 1 (93 câu bảng trực tiếp + lời văn B2), đủ 193/199 câu core GĐ1
- `tools/apply_lesson_gd1_20261007b.py`: 93 câu → bài bảng tương ứng (B4/B5/B6/B9/B10/B11/B12) và B2, basis `muc-luc` (Codex duyệt).
- on-tap q006 (8 × 7) → B10 `suy-luan`, gợi ý "Đổi thành 7 × 8 rồi dùng bảng nhân 7.", skill `times-7`; on-tap q008 skill `divide-8`.
- Gợi ý bang-nhan q006/q037/q074 (nhân với 10) đổi theo bảng đang học. Không đổi đề, đáp án, id.
- Tổng: 193 câu có `lesson` (muc-luc 93, trang-sach 85, suy-luan 15) + 6 câu `nen`. Mã phiên bản `?v=20261007c`.

## 2026-10-07 — Vòng 9: ghi bài cho 56 câu Toán GĐ1 theo trang SGK (Codex duyệt)
- `tools/apply_lesson_gd1_20261007.py`: đổi chỗ thừa số → B10 (q038 → B5, q075 → B4 sau khi đổi gợi ý về bảng 3/bảng 5); quan hệ nhân–chia q058, q095 → B9; tìm thành phần a × ? = c, a : ? = c → B8/B9/B10 (gợi ý đổi sang tra bảng), ? × b = c, ? : b = c → B13; đồng hồ/lịch → B7; 30 câu "Một phần mấy" → B14; 6 câu độ dài/ước lượng kg ghi chú nền (không gắn bài).
- Nâng bằng chứng lên `trang-sach` cho các câu đã ghi có trang tương ứng (giữ `upgradedFrom`). Tổng: 99 câu có bài (trang-sach 85, suy-luan 14) + 6 câu nền. Chi tiết `docs/doi-chieu-sgk-toan3-t1.md` mục 6.
- Sửa script vòng 6 để chạy lại không hạ bằng chứng đã nâng. `tools/lesson_map.py` thêm trạng thái `nen`, hết câu chờ quyết.
- Test: `tests/lesson-data.test.js` mới; `tests/gen.e2e.js` kiểm mọi câu có bài mở đúng mốc, ẩn ở mốc trước. Mã phiên bản `?v=20261007b`.

## 2026-10-07 — Đối chiếu trang SGK Toán 3 tập một (chưa sửa dữ liệu)
- Thêm `docs/doi-chieu-sgk-toan3-t1.md`: bằng chứng trang sách (B1–B15) cho các câu đang chờ (đổi chỗ thừa số → B10; quan hệ nhân–chia với thừa số kia → B9; đồng hồ/lịch → B7; đổi đơn vị độ dài không có trong B7), lô tìm thành phần (dạng `a × ? = c`, `a : ? = c` có từ B8), 28 câu "Một phần mấy" (B14), nâng mức bằng chứng cho câu đã ghi, và xác nhận bộ sinh B1–B3 khớp sách (đọc "tư", viết "1 000").

## 2026-10-07 — Ghi bài thêm 3 câu (q056, q057, q093) + bản rà 135 câu muc-luc
- Ghi `lesson` (suy-luan, Codex duyệt): bảng nhân chia q056 → B9, q057 → B9, q093 → B10 (dạng thêm một nhóm). Tổng đã gắn bài: 43 câu.
- Thêm `docs/ra-soat-muc-luc-gd1.md`: rà 135 câu muc-luc theo 3 lô (94 đề xuất duyệt, 2 chuyển chờ vì gợi ý dùng đổi chỗ thừa số, 11 tìm thành phần đề xuất B13, 28 "Một phần mấy" chờ ảnh B14). Chưa ghi lesson cho các lô này.

## 2026-10-07 — Ghi bài (lesson) cho 40 câu Toán GĐ1 đã được Codex duyệt + sửa lời 6 câu
- `tools/apply_lesson_gd1_20261006.py`: ghi `lesson` + `lessonRef` (căn cứ `suy-luan`, Codex duyệt) cho 40 câu: bảng 4 → B6, bảng 6 → B9, bảng 7 → B10, lời văn cuối kho → B11/B12, lời văn một bước → B2, q012 → B10, q015 → B6, q106 → B9, q111 → B6, q105/q108/q110 → B10. Giữ nguyên id, thứ tự, `source`.
- Ý nghĩa `lesson`: bài sớm nhất mà kiến thức đã học đủ để làm câu theo cách giải được hướng dẫn (không phải "câu lấy từ bài đó").
- Sửa lời: gợi ý q105/q106 theo "tìm trong bảng nhân đã học" (bỏ "chia hết"); gợi ý q056/q057/q093 theo số nhóm ("thêm 1 nhóm 6"); on-tap q013 "kim giờ nằm giữa số 4 và số 5".
- Ô "đã học đến bài" giờ lọc cả câu có sẵn đã ghi số bài. Fixture 300 id kho web v1 (`tests/fixtures/gen-b1b3-bank-v1.json`). Báo cáo `docs/gan-bai-toan-gd1.md` có cột trạng thái (đã ghi 40 · chờ quyết 10 · chờ duyệt 135 · chờ trang sách 6 · chưa gắn 8). Mã phiên bản `?v=20261007a`.

## 2026-10-06 — Đề xuất gắn bài cho câu Toán GĐ1 (chưa sửa dữ liệu)
- Thêm `tools/lesson_map.py` → `docs/gan-bai-toan-gd1.md` + `docs/gan-bai-toan-gd1.csv`: 199 câu core GĐ1 → bài đề xuất, kỹ năng, nguồn đối chiếu (mục lục SGK), mức tin cậy (theo tên bài 135 · suy luận 56 · chưa gắn 8). Thống kê câu nâng cao (không gắn bài).
- Chờ Codex/Nam rà trước khi ghi `lesson` vào dữ liệu.

## 2026-10-06 — Tiến độ cũ của chủ đề "Nền số đến 1000" được chuyển và lưu ngay khi mở web (góp ý Codex)
- Dữ liệu tiến độ lưu theo vị trí (bản 1f57129) được đổi sang id và GHI LẠI ngay lúc tải trang, cho mọi bé trên máy, không đợi bé làm thêm câu.
- Ánh xạ kho v1 được giữ mãi ở các phiên bản sau → bé nào lâu chưa mở máy vẫn chuyển được.
- Test: `tests/progress-id.test.js` thêm 3 ca (chỉ mở / không trả lời → lên v2 → dựng lại câu v1 → còn dấu; bé chưa mở lại mở thẳng ở v2; ánh xạ không đổi). Mã phiên bản `?v=20261006z`.

## 2026-10-06 — Tiến độ chủ đề "Nền số đến 1000" lưu theo ID câu (góp ý Codex)
- Sửa lỗi: câu tự sinh dựng lại từ lịch sử có thể đổi vị trí sau khi tải lại, làm dấu "đã đúng" rơi sang câu khác. Nay tiến độ trong ngày và tích lũy của chủ đề này lưu theo id; chủ đề có sẵn không đổi.
- Lên phiên bản mẫu: câu mới không thừa hưởng dấu của câu cũ. Dữ liệu cũ (lưu theo vị trí) tự đổi sang id.
- Ô "đã học đến bài" ghi rõ: hiện chỉ lọc câu tự sinh; câu có sẵn vẫn theo giai đoạn.
- Test mới `tests/progress-id.test.js` + nhóm 3b trong `tests/gen.e2e.js` (gồm sao lưu sang máy khác). Mã phiên bản `?v=20261006y`.

## 2026-10-06 — Lên web: luyện nền Toán B1–B3 tự sinh + chọn "đã học đến bài"
- Chủ đề mới đứng đầu Toán: **🧮 Nền số đến 1000 (Bài 1–3)**, 300 câu tự sinh cố định (đọc, viết, cấu tạo, so sánh, liền trước/sau, cộng trừ trong 1000, tìm thành phần, lời văn một bước).
- "Giải toán có lời văn" và "Ôn tập tổng hợp" được trộn tối đa 40% câu tự sinh hợp chủ đề; các chủ đề khác không đổi.
- Thanh giai đoạn có thêm ô **"📖 Trên lớp đã học đến: Bài N"** (Toán 3 KNTT tập một). Chưa chọn thì vẫn theo giai đoạn như cũ.
- Câu điền dấu (>, <, =) hiện 3 nút trên một hàng.
- Câu tự sinh làm sai vẫn ôn lại được sau khi tải lại trang, sang máy khác hay lên phiên bản mẫu mới.
- Test mới `tests/gen.e2e.js` (7 nhóm luồng thật); toàn bộ test cũ vẫn đạt. Mã phiên bản `?v=20261006x`.

## 2026-10-06 — Bộ sinh B1–B3: đọc «tư» theo sách (Nam chốt)
- `GenB13.read`: 24 «hai mươi tư», 104 «một trăm linh tư», 14 vẫn «mười bốn». Câu đọc/viết số giờ có cả các số này. Test: bảng đọc viết tay thêm 11 số có chữ số 4; «mươi bốn» / «linh bốn» không xuất hiện ở lựa chọn nào. Test "gợi ý không lộ đáp án" đổi sang kiểm tra gợi ý không phụ thuộc số trong đề. Vẫn chưa lên web.

## 2026-10-06 — Bộ sinh B1–B3: sửa theo góp ý Codex (vẫn chưa lên web)
- Bộ chọn `GenB13.pick`: bỏ tên mẫu không có thật; không còn mẫu → `[]`; `maxLesson` 0 / không hợp lệ không còn mở toàn bộ nội dung.
- Giữ bộ dựng theo phiên bản (`T_BY_VER`): sau khi lên phiên bản mới, câu v1 trong lịch ôn vẫn dựng lại y nguyên (có test giả lập v2). Id `_v01_` bị từ chối.
- Lời văn tách phạm vi số theo bối cảnh: đồ dùng của bé dùng số nhỏ; số ba chữ số dùng thư viện, cửa hàng, trang trại.
- Gắn skill cho 5 câu bảng nhân chia còn lại (`compare-quotients`, `table-product-membership`, `common-table-product`, đăng ký trong `skills.json`).
- Tài liệu: `docs/ra-soat-nen-lop3.md` mục "Vòng 3"; câu mẫu và bản kiểm kê chạy lại.

## 2026-10-06 — Lớp 3: sửa câu đã được Codex đồng ý + bộ sinh B1–B3 thử nghiệm (chưa lên web)
- **Dữ liệu** (`tools/apply_ra_soat_20261006.py`, chi tiết ở `data-lop3/CHANGELOG.md`): sửa lời / nhiễu 5 câu; chuyển giai đoạn 15 câu (bài hai bước → GĐ2, biểu thức → GĐ3, 2 km → GĐ4); `so-do_q001` thay bằng `q001v2` (lớp 34 bạn, id mới để tiến độ câu cũ không áp sang); `prereq` cho 19 câu nâng cao; gắn skill cho 107/112 câu bảng nhân chia (72 tự động theo mẫu chắc chắn bằng `tools/tag_skills.py`, 35 rà tay, còn 5 chờ chọn tên).
- `data-lop3/skills.json`: thêm khoá kỹ năng nền B1–B3 (`read-1000`, `add-1000`, `sub-1000`, `find-addend`…), `word-2step`, `skip-count`, `mul-div-relation`.
- **Bộ sinh** `js/gen-b1b3.js` (CHƯA nạp trong index.html): 18 mẫu B1–B3 + lời văn một bước, id tái tạo được, nhiễu mô phỏng lỗi có quy tắc trong 0–1000. Kiểm thử `tests/gen-b1b3.test.js` (12 nhóm, ảnh chụp cố định `tests/fixtures/gen-b1b3-golden.json`). Câu mẫu cho Codex: `docs/mau-sinh-b1b3.md` (`node tools/gen_samples.js`).
- Tài liệu: `docs/ra-soat-nen-lop3.md` thêm mục "Vòng 2"; bản kiểm kê và mẫu câu đại diện chạy lại.
- Web không đổi giao diện; các bộ test cũ (cloud, arena, home, e2e) vẫn đạt.

## 2026-10-06 — Rà soát nền lớp 3: danh sách đề xuất (chưa sửa dữ liệu)
- Thêm `docs/ra-soat-nen-lop3.md` trả lời Codex: (a) câu sẽ sửa / chuyển nhãn (lời văn hai bước ở GĐ1, 2 km ở GĐ1, đáp án nhiễu mm/g, "better" ở en_adj-adv_q005, lớp 64 bạn…), không tạm ẩn câu nào; (b) bảng kỹ năng nền B1–B3 còn thiếu; (c) 8 mẫu tự sinh B1–B3 + lời văn một bước (ví dụ, điều kiện sinh, nhiễu, cách kiểm chứng); (d) câu cần hình / trang sách — Claude đã mở và giải lại cả 67 câu có hình, đáp án đều khớp.
- Đề xuất metadata `track / lesson / prereq / ref / review`, mốc "đã học đến bài N" tách khỏi giai đoạn.
- Không đổi web, không đổi câu hỏi.

## 2026-10-06 — Bản đồ nội dung lớp 3 (rà nền, chưa sửa dữ liệu)
- Nam chốt: tạm dừng phát triển lớp 2, tập trung lớp 3; chưa mở rộng kho đại trà trước khi rà xong nền.
- Thêm `docs/ban-do-noi-dung-lop3.md`: mỗi môn × giai đoạn — phạm vi, mục tiêu kỹ năng, kiến thức cần trước, chủ đề + số câu, nguồn; ghi rõ [Bám sách] / [Theo chương trình] / [Tự thiết kế] / [Chưa có nguồn]; cách chuyển giai đoạn hiện tại + đề xuất; mẫu tự sinh đề xuất; việc nhờ Codex.
- Thêm `tools/content_map.py` (đếm số câu thẳng từ `data-lop3/`) và `docs/mau-cau-dai-dien-lop3.md` (tối đa 3 câu đại diện mỗi môn × giai đoạn × chủ đề, chọn cố định theo hash id) để Codex soi.
- Không đổi web, không đổi câu hỏi.

## 2026-10-06 — Trang chủ: sửa 2 lỗi Codex tìm ra + khung tên trên điện thoại
- **[P2] Mất mạng bị tính thành 0 điểm**: trước đây tải nhật ký lỗi thì coi như "chưa học", bảng tuần hiện cả 3 bé 0 điểm và "Tuần mới bắt đầu". Nay `API.getLogStrict()` báo lỗi nếu **bất kỳ** bé hay tên phụ nào tải không được; `getWeekBoard()` trả `{ ok: false }`, **không xếp hạng**, **không lưu tạm** kết quả lỗi; trang chủ hiện "Chưa tải được bảng xếp hạng tuần (mạng?)" + nút Thử lại. Báo cáo phụ huynh vẫn dùng `getLog()` như cũ.
- **[P2] Ngày học 0 câu đúng không được đánh ✓**: số câu đúng chỉ được cộng khi trả lời đúng, nên lượt 0 câu đúng không để lại dấu ngày học, còn bị nhắc "học hôm nay để giữ chuỗi" dù chuỗi vẫn tăng. Nay xong lượt luôn ghi nhận ngày học (`addStudyLog(0)`); thẻ Tuần này đánh ✓ theo **có bản ghi ngày** (hoặc là ngày học gần nhất trong hồ sơ), số câu đúng vẫn tính riêng.
- **Điện thoại**: khung tên/avatar lên trên kế hoạch (như máy tính), bản gọn; lời chào chỉ còn chữ (không lặp avatar/sao). Thẻ kế hoạch bỏ lớp khung lồng bên trong, bớt khoảng đệm, giữ cỡ chữ → nút Bắt đầu vẫn nằm trên menu đáy ở 360/390/430px (kể cả tên dài).
- Kiểm thử: `tests/home.test.js` 12 bài (thêm `getWeekBoard` khi mất mạng / 1 tên phụ lỗi / phản hồi hỏng / nhật ký rỗng hợp lệ). `tests/home.e2e.js` 8 nhóm: thêm bảng tuần lỗi mạng, lượt 0 câu đúng chạy qua `Quiz._finish` thật; nút Bắt đầu nay đo so với **mép trên menu đáy** (trước chỉ so với chiều cao màn hình nên bỏ sót bị che). Hai bài mới **bắt được** lỗi ở bản trước.
- Phiên bản file `?v=20261006v`.

## 2026-10-06 — Trang chủ: Tin vui chạy chữ như cũ, khung tên/avatar về cột trái (Nam chọn)
- **Tin vui**: trả lại dòng chữ chạy ở **trên cùng** trang chủ như trước (bỏ bản tĩnh trong cột phải). Giữ lời mới cho tin mốc chuỗi: "đạt mốc N ngày học liên tục".
- **Khung tên + avatar** (tên, danh hiệu, lớp · đổi lớp, sao, Level): về **cột trái, ngay trên Kế hoạch hôm nay** như trước. Cột phải còn: Tuần này, Bộ sưu tập, Xếp hạng tuần.
- Điện thoại giữ thứ tự đã thống nhất: tin vui → lời chào → kế hoạch + Bắt đầu học → hồ sơ → tuần → bộ sưu tập → xếp hạng.
- `tests/home.e2e.js` cập nhật: tin vui chạy chữ và nằm trên cùng; trên máy tính khung tên ở cột trái, ngay trên kế hoạch.
- Phiên bản file `?v=20261006u`.

## 2026-10-06 — Trang chủ mới: lời chào theo tên, kế hoạch hôm nay làm trọng tâm (bàn cùng Codex)
- **Tiêu đề**: logo chỉ còn "Rabbit Academy" (bỏ "Lớp 3"); lớp nằm ở hồ sơ ("Lớp 3 · Đổi lớp"). Trang chủ bỏ tiêu đề "Kho Bài Tập", thay bằng lời chào **"Hôm nay mình học gì, [tên]?"** + một dòng "Rabbit chọn sẵn 3 việc · khoảng 20 phút" (hoặc "Còn 2 việc…"). Các màn khác vẫn có thanh tiêu đề; dòng phụ trên đó nay theo tên bé (trước ghi cố định "Anh Thư" cho mọi bé).
- **Thứ tự**: lời chào → kế hoạch hôm nay + Bắt đầu học → hồ sơ → tuần này → bộ sưu tập → xếp hạng tuần → tin vui. Máy tính: kế hoạch bên trái, các thẻ còn lại bên phải. Điện thoại: lời chào có avatar nhỏ + sao; hồ sơ đầy đủ ở dưới (không lặp sao, danh hiệu chỉ ở hồ sơ).
- **Bỏ trùng lặp**: bỏ bong bóng lời Thỏ trong thẻ, bỏ chữ ở khung Thỏ thanh bên, bỏ khối chào/bảng xếp hạng/ngọc rồng cũ khi đã có kế hoạch.
- **Hoàn thành kế hoạch**: "🎉 Con đã hoàn thành kế hoạch hôm nay! / Con nhận thêm 10 ⭐ · Túi sao hiện có X ⭐ / [Xem phần thưởng] / Muốn chơi thêm? Đấu trường tính nhanh · Ôn thêm 5 phút". Dòng "nhận thêm 10 ⭐" chỉ hiện khi thưởng đã được ghi nhận. Cộng sao và đánh dấu "đã nhận" nay trong **một** lần lưu hồ sơ (`Today.grantReward`) → không thể cộng 2 lần hay báo nhận mà chưa cộng. Mở lại trang không chạy lại thông báo, không cộng thêm.
- **Chuỗi ngày**: một nguồn chung `Today.streakNow()` — học hôm nay hoặc hôm qua thì giữ chuỗi (sáng chưa học không bị về 0), quá 1 ngày thì 0 (trước đây ô vẫn hiện số cũ). Thẻ "Tuần này": ✓ ngày đã học + "🔥 N ngày liền"; bỏ dòng "0 câu đúng" đầu tuần. Tin mốc chuỗi đổi lời thành "đạt mốc 3 ngày học liên tục" để không lẫn với chuỗi hiện tại.
- **Bộ sưu tập**: thẻ ngọc rồng thu thành 1 dòng "Ngọc rồng 3/7 · 12 sticker · 2 huy hiệu → Bộ sưu tập ›". Không còn nút "Mở shop" ở trang chủ.
- **Xếp hạng tuần**: điểm học = số câu đúng trong nhật ký làm bài từ 00:00 thứ Hai (không phải số sao, nên mua sticker không làm tụt hạng). Tô sáng dòng của bé. "Tổng thành tích" ở mục phụ (bấm để xem). Không cần sửa Apps Script.
- **Tin vui**: hết chạy chữ. Một tin gần nhất, tối đa 2 dòng, "Xem thêm" để mở danh sách; không tự đổi khi bé đang đọc.
- Kiểm thử: `tests/home.test.js` (11 bài: chuỗi ngày qua nửa đêm/tuần/tháng/năm và sáng chưa học, thưởng 1 lần 1 lần lưu, mở lại không cộng, tuần bắt đầu thứ Hai, điểm tuần) và `tests/home.e2e.js` (Chromium: thứ tự khối và nút Bắt đầu thấy ngay ở 360/390/430px, không cuộn ngang, không lặp sao/danh hiệu; máy tính; trạng thái hoàn thành; chưa nhập tên).
- Phiên bản file `?v=20261006t`.

## 2026-10-06 — Kiểm tra mã gia đình trên môi trường thật + hướng dẫn mở khoá
- Đã thử trên chamhoc.vercel.app với hồ sơ thử riêng "zz kiểm tra" (không đụng dữ liệu các bé): ghi thường → lưu được (ver 1); ghi đè không kèm mã → bị từ chối, dữ liệu giữ nguyên; ghi đè đúng mã (Nam tự nhập trong trình duyệt) → lưu được (ver 2). Sau đó đã xoá mã khỏi trình duyệt dùng để thử.
- Thêm hướng dẫn mở khoá khi ghi đè bị khoá (do có người gửi nhiều mã sai): chờ 1 giờ, hoặc xoá thuộc tính `fc_fail` trong Apps Script. Ghi ở đầu `Code.gs` (chỉ là chú thích, **không cần triển khai lại**) và trong thông báo ở Khu vực Bố Mẹ.
- Ghi rõ giới hạn: bộ đếm sai mã dùng chung cả gia đình, nên ai biết đường dẫn máy chủ có thể tạm khoá ghi đè 1 giờ.
- Phiên bản file `?v=20261006s`.

## 2026-10-06 — 🔑 Mã gia đình bảo vệ việc ghi đè bản sao lưu (#1, bàn cùng Codex)
- **Phạm vi bảo vệ**: chỉ chặn **ghi đè** (force) — mở file sao lưu, "Giữ bản máy này", khôi phục bản cất. **Chưa phải đăng nhập**: ai có đường dẫn máy chủ …/exec vẫn **đọc** được và **ghi thường** được (ghi thường vẫn bị chặn nếu bản trên mạng đã đổi, nhờ số phiên bản). Ghi rõ trong `Code.gs`, `cloud.js` và Khu vực Bố Mẹ.
- **Máy chủ** (`Code.gs`, kiểm tra trong `ScriptLock`, trước mọi thao tác ghi):
  - Mã đặt ở **Thuộc tính tập lệnh** `FAMILY_CODE` (chỉ chủ Apps Script xem được), không nằm trong code.
  - Chưa cài mã → từ chối mọi ghi đè (`family-code-unset`). Sai mã → `family-code-wrong`. Sai 10 lần trong 1 giờ → khoá ghi đè 1 giờ, kể cả mã đúng (`family-code-locked`).
  - Mã không bao giờ ghi vào Sheet, trang LichSu hay log.
- **Web** (`cloud.js`):
  - Mã lưu ở khoá riêng của **máy** (`khoBaiTap_familyCode_v1`, không gắn tên bé) → không nằm trong bản sao lưu, cloudmeta, URL. Chỉ đọc ra **lúc gửi** lệnh ghi đè, gửi trong thân POST. Ghi thường và beacon không gửi mã.
  - Thiếu mã trên máy → không gửi gì. Máy chủ báo thiếu/sai/khoá → **dừng tự thử lại** (không lặp), đồng bộ cũng không kéo bản mạng đè lên bản bố mẹ đã chọn (`force-blocked`). Khu vực Bố Mẹ hiện "⏸️ Bản bố mẹ chọn ghi đè chưa gửi được" + nút **✖️ Huỷ ghi đè**.
  - Khu vực Bố Mẹ → Sao lưu có ô **🔑 Mã gia đình** (≥ 6 ký tự): Lưu mã / Xoá mã khỏi máy này. Lưu mã xong thì các lượt ghi đè đang chờ được gửi lại **1 lần**.
- `tests/cloud.test.js`: 46 kiểm thử (máy chủ chưa cài mã, sai mã không lặp + nhập đúng gửi lại 1 lần, máy chưa nhập mã không POST, khoá sau 10 lần sai, mã không lọt vào URL/snapshot/cloudmeta/Sheet/beacon, huỷ ghi đè). 3 bài phía máy chủ **bắt được** việc `Code.gs` cũ cho ghi đè không cần mã.
- Thử trên Chromium bắt được 1 lỗi của chính bản vá (biến thông báo dùng trước khi khai báo làm thẻ sao lưu lỗi) — đã sửa trước khi đẩy lên.
- ⚠️ **Cần**: (1) triển khai lại Apps Script sao lưu, (2) thêm thuộc tính `FAMILY_CODE`, (3) nhập mã ở Khu vực Bố Mẹ trên máy bố mẹ hay dùng. Chưa làm (2) thì web vẫn chạy, chỉ là không ai ghi đè được.
- Phiên bản file `?v=20261006r`.

## 2026-10-06 — Đấu trường: lời "thử thách", kỉ lục ghi rõ, sửa giới hạn 12 phạm vi (góp ý Codex)
- **Lời hiển thị**: phạm vi là *phạm vi thử thách đã chọn* (kho câu của lượt), không phải chứng nhận bé thành thạo từng bảng — lượt 20 câu ngẫu nhiên không nhất thiết gặp đủ mọi bảng. Nay ghi "Đạt trong thử thách bảng …" (màn kết quả, Đấu trường, rê chuột trên nhãn cạnh tên), kệ huy hiệu ghi "Thử thách bảng …". Bảng tốc độ từng phép trong Khu Bố Mẹ vẫn là báo cáo thành thạo riêng.
- **Kỉ lục**: giữ `level.best` như cũ, ghi rõ "Kỉ lục mức này, tính mọi phạm vi" (chú thích ở ô chọn mức, "kỉ lục mức …" ở kệ huy hiệu, "Kỉ lục mới của mức này (tính mọi phạm vi)!" ở màn kết quả). Khi đang chọn đúng một phạm vi đã đạt ở mức đó, thẻ chọn hiện thêm "🏅 Thử thách bảng … đã đạt X/20" — chỉ của **chính** phạm vi đó (`TableGen.findScope`), không mượn điểm bảng 2 cho lượt trộn 2–9.
- **[P3] Giới hạn 12 phạm vi có thể thành 13**: chọn tiêu biểu và cắt danh sách dùng 2 thứ tự khác nhau, nên phạm vi "tất cả dạng" cũ được chọn tiêu biểu có thể nằm ngoài 12 mục đầu rồi bị thêm vào thành 13. Nay dùng **chung** một thứ tự (`_scopeOrder`: nhiều bảng → "tất cả dạng" → mới nhất) và cắt đúng `SCOPES_KEEP = 12`; mục tiêu biểu luôn đứng đầu nên không bao giờ bị cắt.
- `tests/arena.test.js`: 13 bài (thêm đúng ca 13 mục Codex tái hiện — **bắt được** lỗi ở bản trước — và `findScope`). `tests/arena.e2e.js`: thêm kiểm tra chữ "Thử thách", điểm của phạm vi đang chọn, và không mượn điểm khi đổi sang bảng 3, 4.
- Phiên bản file `?v=20261006q`.

## 2026-10-06 — Danh hiệu Đấu trường ghi rõ phạm vi đạt (#4a, bàn cùng Codex)
- **Vấn đề cũ**: danh hiệu chỉ lưu theo mức. Chỉ chơi bảng 2 ở mức 🐆 Báo vẫn được "Báo Tia Chớp", dễ hiểu nhầm là đã nhanh ở cả bảng 2–9.
- **Nay**: mỗi lượt **đạt** (≥16/20) ghi đúng phạm vi của chính lượt đó — các bảng và nhóm dạng có trong kho câu của lượt (`TableGen.scopeOf`), lưu ở `tableSpeed_v1` → `level.scopes[mức]` (được sao lưu cùng dữ liệu tốc độ).
  - **Không gộp** nhiều lượt: đạt bảng 2 và bảng 5 ở hai lượt riêng thì có 2 phạm vi "bảng 2" và "bảng 5", không thành "bảng 2, 5". Vượt riêng "Tính & tìm số thiếu" và "Quan hệ phép nhân" không thành "tất cả dạng". Chỉ hiện "bảng 2–9" khi có một lượt đạt đúng cấu hình đó.
  - Chọn "Tất cả dạng" mà kho câu chỉ có 1 nhóm → ghi đúng nhóm đó.
  - Danh hiệu, mở mức tiếp theo, mở avatar giữ nguyên như cũ (theo mức). Đạt lại đúng phạm vi cũ thì không ghi trùng.
- **Huy hiệu cũ giữ nguyên** (cả ngày đạt). Chưa có phạm vi thì ghi "chưa ghi nhận phạm vi"; lần sau bé đạt lại mức đó thì ghi phạm vi thật.
- **Hiển thị**:
  - Màn kết quả: "Mức 🐌 Ốc sên (bảng 3 · Quan hệ phép nhân) …", "Con nhận danh hiệu … với bảng 3 · …", hoặc "Danh hiệu … giờ có thêm phạm vi …".
  - Đấu trường: dưới danh hiệu "Đạt với …"; mỗi huy hiệu hiện phạm vi rộng nhất (nhiều bảng nhất, ưu tiên tất cả dạng) + "+ N phạm vi khác" (rê chuột xem). Bộ sưu tập cũng vậy.
  - Nhãn cạnh tên bé: gọn, vd. "🐆 Báo Tia Chớp · bảng 2–9" / "· 5 bảng · quan hệ"; huy hiệu cũ thì không thêm chữ.
- Kiểm thử: `tests/arena.test.js` (11 bài: huy hiệu cũ, không gộp bảng / nhóm dạng, không đạt thì không ghi, trùng, gọi kiểu cũ, `scopeOf`, cách viết bảng, cắt danh sách dài) và `tests/arena.e2e.js` (Chromium: bấm chọn bảng 3 + "Quan hệ phép nhân" ở Đấu trường → bắt đầu → kết quả → huy hiệu hiện đúng phạm vi; huy hiệu cũ hiện "chưa ghi nhận phạm vi").
- Phiên bản file `?v=20261006p`.

## 2026-10-06 — "Dữ liệu hỏng" luôn thắng "ghi đè đang chờ" (góp ý Codex)
- **[P1] Lỗi**: nếu bố mẹ vừa chọn ghi đè (mở file / giữ bản máy) mà gửi chưa xong, rồi một lần ghi khác bị đầy bộ nhớ làm dữ liệu trên máy thành bản lai (`damaged`), thì lượt thử lại ghi đè vẫn chạy → có thể đẩy bản lai đè lên bản tốt trên mạng.
- Nay `damaged` được ưu tiên cao nhất:
  - Khi dữ liệu thành bản lai: **huỷ** ý định ghi đè cũ (`forceRev`).
  - `_pendingNames()` bỏ qua bé đang hỏng, kể cả có ghi đè đang chờ; beacon cũng bỏ qua.
  - `_sendNow()` chặn ở bước cuối: lượt đã xếp hàng trước đó hay bấm tay đều trả `error: 'damaged'`, không gửi gì.
  - `_reconcile()` xét "hỏng" trước "ghi đè đang chờ": đang hỏng thì chỉ thử chép lại bản mạng để tự sửa; không có bản mạng thì chờ bố mẹ mở file sao lưu.
  - Ghi trọn một bản đầy đủ (chép bản mạng, mở file, khôi phục bản cất) thành công → hết `damaged`, gửi lại bình thường.
- `tests/cloud.test.js`: 40 kiểm thử. Thêm đúng tình huống Codex nêu: ghi đè đang chờ → ghi hỏng → không POST, không beacon, bấm tay bị chặn, bản mạng còn nguyên → đồng bộ tự sửa → thay đổi mới gửi được. Bài này **bắt được** lỗi ở bản trước.
- Không đổi `Code.gs`. Phiên bản file `?v=20261006o`.

## 2026-10-06 — Sửa thêm 2 lỗi Codex tìm ra (đồng bộ 2 máy)
- **[P1] Trả lại nguyên trạng khi đầy bộ nhớ chưa chắc chắn**: trước đây nếu ghi bản mới bị đầy bộ nhớ giữa chừng, web phục hồi từng key cũ theo thứ tự; một key vừa to ra có thể chiếm chỗ làm key khác không phục hồi được, mà web vẫn báo "dữ liệu cũ giữ nguyên".
  - Nay `apply()` ghi theo thứ tự ít tốn chỗ nhất (xoá key thừa trước, key nhỏ đi trước, key to ra sau). Nếu vẫn lỗi: gỡ **hết** key của bé để giải phóng chỗ, ghi lại toàn bộ giá trị cũ, rồi **kiểm tra từng key**.
  - Kiểm tra đạt → báo "dữ liệu cũ giữ nguyên". Không đạt → trạng thái `damaged`: máy bị chặn mọi đường tự gửi lên (không gửi, không beacon, không cho "đồng bộ" đẩy bản lai lên); lần đồng bộ sau chỉ thử chép lại bản trên mạng để tự sửa. Khu vực Bố Mẹ hiện cảnh báo, dặn xoá bớt bản cất rồi bấm "Lấy bản trên mạng".
- **[P2] Trường bị coi là "tự sinh" quá rộng**: ngày đạt thành tích, chuỗi đúng hiện tại, lớp và giai đoạn bé tự chọn đều là dữ liệu thật → bỏ khỏi danh sách bỏ qua. Nay chỉ bỏ qua **kế hoạch hôm nay khi còn mới tinh** (chưa xong việc nào, chưa nhận thưởng); kế hoạch đã làm dở hoặc đã nhận thưởng cũng là dữ liệu thật. Bản cất khác ở các trường này không còn bị tự xoá, máy khác ở các trường này không bị kéo đè.
- `tests/cloud.test.js`: 38 kiểm thử. Bộ nhớ giả lập giới hạn theo tổng dung lượng như trình duyệt; có đúng tình huống Codex tái hiện (A 10→1, B 1→10, thêm C thì vượt). Đã thử: các bài mới **bắt được** lỗi trên bản trước.
- Không đổi `Code.gs` (không cần triển khai lại Apps Script). Phiên bản file `?v=20261006n`.

## 2026-10-06 — Sửa 3 lỗi Codex tìm ra sau #2A (đồng bộ 2 máy)
- **[P1] Máy chủ trả bản cũ kèm số phiên bản mới**: `doGet()` trước đây đọc dữ liệu rồi mới đọc phiên bản, không giữ khoá. Một lần lưu chen vào giữa thì máy nhận bản cũ + ver mới, rồi có thể ghi đè phần học của máy kia. Nay GET đọc cả hai trong cùng `ScriptLock`; POST ghi Sheet xong (`SpreadsheetApp.flush()`) rồi mới tăng phiên bản và nhả khoá. **Cần triển khai lại Apps Script.**
- **[P1] Bản khôi phục bị xoá quá sớm**: sau "Lấy bản trên mạng", lần đồng bộ kế tiếp thấy hai bản giống nhau đã xoá luôn bản cất. Nay một bản cất **chỉ tự xoá khi nội dung của nó đã nằm nguyên trên mạng** (bỏ qua trường tự sinh như kế hoạch hôm nay); còn lại chỉ bố mẹ xoá.
  - Bản cất chia 2 loại: ô **xung đột** (bản máy lúc đang xung đột) và **danh sách khôi phục** (bản máy trước mỗi lần "Lấy bản trên mạng", giữ tối đa 3 bản, mới nhất trước). Xung đột lần sau không ghi đè bản khôi phục cũ.
  - Khu vực Bố Mẹ liệt kê từng bản cất: ↩️ Khôi phục bản này / 💾 Tải về / 🗑️ Xoá.
- **[P2] Lấy bản mạng tạo "bản lai"**: trước chỉ ghi đè các key có trong bản mạng, key chỉ máy có (vd. dữ liệu tốc độ) vẫn còn mà lại bị coi là đã đồng bộ. Nay `apply()` đặt dữ liệu của bé **đúng bằng** bản được chọn: ghi key có trong bản đó, xoá key dữ liệu của bé không có trong bản đó. Không đụng cloudmeta, bản cất, PIN, dữ liệu bé khác. Kiểm tra snapshot trước khi ghi; ghi lỗi giữa chừng (vd. đầy bộ nhớ) thì trả lại nguyên trạng và **không** đánh dấu đã đồng bộ. Dùng chung cho lấy bản mạng, mở file sao lưu, khôi phục bản cất.
- Thêm: file sao lưu có mục tên trùng khoá hệ thống (vd. `khoBaiTap_cloudmeta`) bị từ chối — trước đây có thể ghi đè trạng thái đồng bộ của bé.
- `tests/cloud.test.js`: 34 kiểm thử. Có bài cho POST chen vào lúc GET đang đọc (đã thử: bài này **bắt được** lỗi trên `Code.gs` cũ), bài flush trước khi nhả khoá, lấy bản mạng → đồng bộ/tải lại trang → vẫn khôi phục được, xung đột 2 lần giữ cả 2 bản khôi phục, không tạo bản lai, ghi lỗi giữa chừng, file sai định dạng.
- Phiên bản file `?v=20261006m`.

## 2026-10-06 — Đồng bộ 2 máy không còn kéo đè phần bé vừa học (#2A, bàn cùng Codex)
- **Lỗi cũ**: web chọn nguyên cả bản theo XP. Máy ít XP hơn mà có phần học riêng (câu sai, sticker vừa mua, tốc độ…) sẽ bị bản mạng đè mất khi mở lại.
- **Số phiên bản trên máy chủ** (`Code.gs`): mỗi lần lưu thành công phiên bản của bé tăng 1. Máy gửi kèm phiên bản nó biết gần nhất; nếu bản trên mạng đã đổi thì máy chủ từ chối (`reason: 'conflict'`). Kiểm tra ngay trong `ScriptLock` nên 2 máy gửi cùng lúc thì chỉ 1 máy được nhận. Máy dùng bản web cũ vẫn theo luật XP như trước.
- **Quy tắc đồng bộ** (`js/cloud.js`), chạy khi mở web, nhập tên, **khi tab hiện lại** (tối đa 1 lần/30 giây) và khi máy chủ báo bản mạng đã đổi:
  - Giống hệt → đã đồng bộ.
  - Máy chưa có gì (máy mới) → lấy bản mạng.
  - Bản mạng chưa đổi kể từ lần máy biết → gửi bản máy lên.
  - Bản mạng đã đổi + máy **không** còn tiến độ chưa lên mạng → lấy bản mạng.
  - Bản mạng đã đổi + máy **còn** tiến độ chưa lên mạng → **xung đột**, bất kể XP bên nào cao hơn.
- "Tiến độ chưa lên mạng" so **từng mục** với bản đồng bộ gần nhất (từng key, riêng hồ sơ thì từng trường), nên bắt được cả dữ liệu ghi thẳng localStorage. Bỏ qua các trường tự sinh lại: kế hoạch hôm nay, lớp/giai đoạn đang chọn, huy hiệu thành tích, chuỗi đúng hiện tại — để sáng mở web sang ngày mới không bị báo xung đột nhầm.
- **Khi xung đột**: không tự kéo đè; cất bản máy vào `khoBaiTap_conflict::<tên>` (khoá này **không** nằm trong bản sao lưu); ngừng tự gửi; bé vẫn học bình thường. Cạnh link "Phụ huynh" hiện ☁️⚠️. Khu vực Bố Mẹ → Sao lưu hiện thẻ "Có 2 bản khác nhau" (sao, sticker, ngọc rồng, điểm kinh nghiệm mỗi bản) với 3 nút:
  - **📱 Giữ bản máy này** — gửi bản máy **hiện tại** (gồm cả phần bé học thêm sau lúc phát hiện) đè lên mạng. Bản mạng cũ vẫn còn trong trang LichSu.
  - **☁️ Lấy bản trên mạng** — trước khi lấy, cất lại bản máy hiện tại; sau đó có nút **↩️ Khôi phục bản đó**, **💾 Tải bản đó về**, **🗑️ Xoá bản cất**. Không cất được (máy đầy) thì không lấy.
  - **💾 Tải cả hai bản về** — 2 file JSON.
- Bố mẹ đã chọn ghi đè (mở file sao lưu / giữ bản máy) mà gửi chưa xong → đồng bộ **không bao giờ** kéo bản mạng đè lên bản đó.
- Beacon lúc đóng tab của chính máy đã lên (máy chủ tăng phiên bản mà máy không biết) → nhận ra là bản của mình, không báo xung đột.
- `tests/cloud.test.js`: 26 kiểm thử, máy chủ là **chính `Code.gs`** chạy trên Google Sheet giả lập (bản cũ ở `tests/fixtures/Code.v1.gs` để thử máy chủ chưa cập nhật).
- ⚠️ **Cần triển khai lại Apps Script sao lưu** để bật số phiên bản. Chưa triển khai thì web vẫn chạy (không kéo đè khi còn thay đổi chưa lưu), chỉ là chưa có kiểm tra phiên bản phía máy chủ.
- Phiên bản file `?v=20261006l`.

## 2026-10-06 — Sao lưu: mọi đường gửi đều tự thử lại khi lỗi (#3, theo góp ý của Codex)
- Trước: chỉ lượt gửi tự động mới hẹn thử lại. Mở file sao lưu, nút "☁️ Sao lưu ngay" và lúc đồng bộ khi mở web nếu gặp lỗi thì dữ liệu vẫn được giữ là "chưa lưu" nhưng không ai gửi lại cho tới khi có thao tác mới hoặc tải lại trang.
- Nay mọi đường gửi đi qua một chỗ xử lý kết quả chung (`Cloud._send` → `_onResult`): lỗi tạm thời thì tăng backoff đúng 1 lần (30 giây → 2 phút → 5 phút) và tự hẹn gửi lại; gửi được thì xoá backoff.
- Ghi đè chủ động (mở file sao lưu) mà gặp lỗi: nhớ ý định ghi đè (`forceRev` trong cloudmeta), lần thử lại vẫn là ghi đè, không bị máy chủ trả "older" rồi coi như xong. Ghi đè thành công thì xoá ý định.
- Thêm `tests/cloud.test.js` (14 kiểm thử, chạy `node tests/cloud.test.js`).
- Phiên bản file `?v=20261006k`.

## 2026-10-06 — Sao lưu chỉ báo "đã lưu" khi máy chủ xác nhận thật (#3, bàn cùng Codex)
- **Lỗi đã sửa**: trước đây nếu Apps Script lỗi (trả trang HTML thay vì JSON, vd. hết giờ chờ khoá, hết quota) thì web vẫn coi là **đã lưu**; và cờ "có thay đổi" bị xoá **trước** khi gửi nên lỗi xong không gửi lại. Kết quả: có lúc tiến độ chỉ nằm trên máy mà bố mẹ tưởng đã sao lưu.
- **Cách mới** (`js/cloud.js`): mỗi bé có 2 số trong cloudmeta — `localRev` (số lần dữ liệu trên máy thay đổi) và `savedRev` (bản mới nhất máy chủ đã xác nhận). Chỉ khi HTTP thành công **và** JSON trả `ok: true, saved: true` mới cập nhật `savedRev`, đúng bằng rev của bản đã gửi. Thay đổi phát sinh trong lúc đang gửi vẫn là "chưa lưu" và được gửi tiếp ngay sau.
- Mỗi lượt gửi giữ cố định tên bé + snapshot + rev; các lượt gửi chạy lần lượt, không chồng nhau. Đổi bé giữa chừng không làm xác nhận nhầm.
- Lỗi mạng / HTTP / phản hồi hỏng → thử lại sau 30 giây, 2 phút, rồi 5 phút (không gửi dồn dập). Máy chủ từ chối hẳn (quá lớn…) → chờ thay đổi mới. Máy chủ báo "bản trên mạng tiến xa hơn" → ghi nhận xung đột, ngừng tự gửi (bước #2A sẽ làm phần xử lý xung đột).
- Tải lại trang mà còn thay đổi chưa lưu (của bất kỳ bé nào trên máy) → tự gửi lại. Máy đang dùng bản web cũ: thay đổi sau lần gửi cuối được coi là chưa lưu.
- Gửi nhanh lúc đóng tab (beacon) không có phản hồi nên **không** đánh dấu đã lưu.
- Lấy bản trên mạng về → coi như đã đồng bộ; việc làm mới giao diện sau đó không bị tính là thay đổi mới.
- Khu vực Bố Mẹ → Sao lưu: hiện "⏳ Còn thay đổi chưa sao lưu" hoặc cảnh báo khi trên mạng có bản tiến xa hơn.
- Không đổi `Code.gs` (không cần triển khai lại Apps Script). Đã chạy 10 kiểm thử: thay đổi trong lúc gửi, HTTP/mất mạng/HTML lỗi, backoff, tải lại trang, đổi bé lúc gửi, beacon, xung đột, lấy bản mạng, máy bản cũ, bản giống hệt.
- Phiên bản file `?v=20261006j`.

## 2026-10-06 — Mở bộ sticker "🦕 Thế Giới Khủng Long" (12 sticker)
- Ảnh do Nam tạo bằng ChatGPT. Mình cắt sát hình, đặt vào khung vuông nền trong suốt, nén WebP 512×512 (36–65 KB/ảnh) ở `images/rewards/stickers/dino-world/`. Ảnh số 10 bị nền đen nên đã tách nền. Ảnh gốc nằm trong thư mục "rabbit avatar/sticker khung long" của Nam.
- Cửa hàng sao: bộ Khủng Long hết "Sắp ra mắt", đổi bằng sao như bộ 12 Con Giáp (20 → 250 ⭐):
  Khủng Long Con Nở Trứng 20 · Khủng Long Vẫy Chào 30 · Khủng Long Cổ Dài 40 · Khủng Long Gai Lưng 50 · Khủng Long Bọc Giáp 65 · Khủng Long Đầu Cứng 80 · Khủng Long Mào Kèn 100 · Thằn Lằn Bay 120 · Khủng Long Chạy Nhanh 140 · Khủng Long Ba Sừng 170 · Khủng Long Gai Buồm 210 · **Khủng Long Bạo Chúa 250**.
- Sticker đã đổi hiện trong Bộ sưu tập / Túi đồ như các bộ khác. Chưa có quà thưởng khi sưu tập đủ bộ; nếu muốn thì thêm `bonus` cho pack sau.
- Phiên bản file `?v=20261006i`.

## 2026-10-06 — Danh hiệu hiện cạnh tên bé
- Khung hồ sơ ở trang chủ ("Hôm nay học gì?") và ô xem trước ở Bộ sưu tập → Trang trí hồ sơ: cạnh bảng tên có thêm nhãn danh hiệu, vd. **[Anh Thư 🥕] [🐌 Ốc Sên Kiên Trì]**. Nhãn có màu theo mức (xanh lá, xanh dương, hồng, tím, vàng).
- Nhãn đi theo con vật đang làm avatar. Nếu đang để avatar Thỏ Rabbit thì hiện danh hiệu cao nhất đã đạt; chưa có danh hiệu thì không hiện nhãn.
- Khung hẹp (điện thoại) thì nhãn tự xuống dòng dưới tên.
- Phiên bản file `?v=20261006h`.

## 2026-10-06 — Ảnh avatar 5 con vật (Nam tạo bằng ChatGPT)
- 5 ảnh `images/arena/avatar-oc-sen|rua|tho|dai-bang|bao.webp`, mỗi ảnh 15–25 KB. Đã cắt tròn và làm nền trong suốt, cỡ 360×360. Ảnh gốc PNG nằm trong thư mục "rabbit avatar/avatar update" của Nam.
- **Avatar** (trang chủ, khung trang trí, Bộ sưu tập → Hình đại diện): dùng ảnh thay cho emoji (`Decor.AVATAR_IMAGES = true`).
- **Huy hiệu Đấu trường** (thẻ danh hiệu, bộ huy hiệu, màn kết quả, Bộ sưu tập): giữa huy hiệu là ảnh con vật (`TableGen.AVATAR_IN_BADGE = true`). Huy hiệu chưa đạt vẫn xám và có 🔒.
- Phiên bản file `?v=20261006g`.

## 2026-10-06 — Danh hiệu Đấu trường mở avatar con vật + gọn môn Toán
- **Avatar con vật**: đạt danh hiệu nào thì mở **hình đại diện** con vật đó (🐌 Ốc sên, 🐢 Rùa, 🐰 Thỏ, 🦅 Đại bàng, 🐆 Báo).
  - Lúc vừa đạt danh hiệu, avatar **tự đổi** sang con vật mới (màn kết quả có báo).
  - Muốn đổi lại thì vào **Đấu trường** (nút "Dùng làm avatar" dưới mỗi huy hiệu đã đạt) hoặc **Bộ sưu tập → Trang trí hồ sơ → Hình đại diện**. Thỏ Rabbit cũ luôn chọn lại được.
  - Avatar hiện ở trang chủ ("Hôm nay học gì?") và khung trang trí, vẫn giữ khung, bảng tên, nền đang mặc. Lưu trong `decor.face` của hồ sơ nên được sao lưu. Logo góc trái vẫn là Thỏ.
  - Hiện vẽ bằng emoji trên nền tròn màu của từng mức. Khi có ảnh thì đặt vào `images/arena/avatar-<oc-sen|rua|tho|dai-bang|bao>.webp` và đổi `Decor.AVATAR_IMAGES` thành `true`.
- **Gỡ thẻ "⚡ Luyện bảng nhân chia (tự sinh)" khỏi danh sách chủ đề môn Toán**: phần này giờ chỉ nằm ở nút ⏱️ Đấu trường tính nhanh (vẫn có Luyện 20 câu, Kiểm tra, Ôn lỗi sai không tính giờ). Chủ đề "Bảng nhân, chia (2–9)" trong môn Toán giữ nguyên.
  - Phần tự sinh không còn được tính vào số chủ đề của môn Toán (vd. "Hôm nay: x/y").
  - Câu sai ở Đấu trường vẫn vào Ôn câu sai, lịch ôn và báo cáo như cũ.
- Phiên bản file `?v=20261006f`.

## 2026-10-06 — Nút "⏱️ Đấu trường tính nhanh" + 5 danh hiệu con vật
- **Nút mới ở thanh bên** (dưới "Vào học"; trên điện thoại là ô "⏱️ Tính nhanh" ở menu đáy, nay có 6 ô). Bấm một lần là vào thẳng màn **Đấu trường tính nhanh** (file mới `js/arena.js`), không phải qua Vào học → Toán → chủ đề nữa. Bé nào cũng dùng được, kể cả bé lớp 2: nếu bé chưa tự chọn bảng thì mặc định là bảng 2–5.
- **Màn Đấu trường** có:
  - Thẻ danh hiệu hiện tại của bé, kèm mục tiêu tiếp theo.
  - **Bộ huy hiệu**: 5 huy hiệu, cái đã đạt có màu và ngày đạt; cái chưa đạt thì xám, có 🔒.
  - Phần chọn bảng, dạng bài và mức, nút "⏱️ Bắt đầu thử thách" to. Bên dưới là "Luyện thêm (không tính giờ)".
- **5 danh hiệu**, nhận khi đúng và kịp giờ từ 16/20 câu ở mức tương ứng:
  - 🐌 Ốc Sên Kiên Trì
  - 🐢 Rùa Bền Bỉ
  - 🐰 Thỏ Nhanh Nhẹn
  - 🦅 Đại Bàng Tinh Mắt
  - 🐆 Báo Tia Chớp
  - Màn kết quả hiện huy hiệu to kèm "🎉 Con nhận danh hiệu …".
  - Danh hiệu được báo trên **bảng 📣 Tin vui** cho cả 3 bé ("Chúc mừng … đạt danh hiệu 🐰 Thỏ Nhanh Nhẹn ở Đấu trường tính nhanh!").
  - Danh hiệu cao nhất hiện thành nhãn nhỏ dưới danh hiệu Level trong khung hồ sơ; bấm vào nhãn là mở Đấu trường.
  - **Bộ sưu tập** có thêm khu "⏱️ Huy hiệu Đấu trường tính nhanh".
  - Danh hiệu lưu trong hồ sơ (`arenaRank`) và số liệu tốc độ (`level.passed`) nên được sao lưu cùng.
- Huy hiệu hiện vẽ bằng SVG (mỗi con một màu). Khi có ảnh sticker thì đặt vào `images/arena/badge-<oc-sen|rua|tho|dai-bang|bao>.webp` và đổi `TableGen.BADGE_IMAGES` thành `true`.
- Làm bài bắt đầu từ Đấu trường: nút "Quay lại" và "🏟️ Về Đấu trường" ở màn kết quả đưa bé về lại Đấu trường. Lựa chọn bảng, dạng và mức nay được nhớ riêng cho từng bé.
- Phiên bản file `?v=20261006d`.

## 2026-10-06 — ⏱️ Thử thách tốc độ bảng nhân chia (5 mức con vật) + bảng tốc độ cho bố mẹ
- Thẻ **"⚡ Luyện bảng nhân chia 2–9 (tự sinh)"** có thêm khu **⏱️ Thử thách tốc độ**. Lượt thử thách dùng đúng bảng và nhóm dạng con đang chọn, mỗi lượt 20 câu mới.
- **5 mức**, thời gian mỗi câu (tính thẳng / tìm số thiếu / quan hệ phép nhân):
  - 🐌 Ốc sên 15 / 18 / 25 giây
  - 🐢 Rùa 10 / 12 / 18 giây
  - 🐰 Thỏ 8 / 10 / 15 giây
  - 🦅 Đại bàng 5 / 7 / 11 giây
  - 🐆 Báo 3 / 5 / 8 giây
  - Ban đầu chỉ mở Ốc sên. **Đúng và kịp giờ từ 16/20 câu** thì mở mức tiếp theo (có thông báo chúc mừng). Mỗi mức lưu kỉ lục của con.
- **Khi làm bài**: thanh đếm ngược phía trên câu hỏi (xanh, 3 giây cuối đổi cam). Không có tiếng tích tắc. Đúng thì hiện "Chính xác! ⚡ 2,3 giây" rồi tự sang câu. Sai hoặc hết giờ thì hiện đáp án đúng khoảng 2 giây rồi tự sang câu; bé cũng có thể bấm "Câu tiếp theo".
  - **Hết giờ không tính là sai**: không vào Ôn câu sai, không trừ gì, chỉ ghi là "chậm".
  - Con chuyển sang tab hoặc ứng dụng khác thì đồng hồ dừng, và câu đó không tính vào số liệu tốc độ. Thoát giữa chừng thì đồng hồ tắt.
  - Chạy như chế độ Kiểm tra: chọn 1 lần, không gợi ý.
- **Ghi thời gian từng phép** (cả ở Luyện 20 câu, Kiểm tra, Thử thách) cho từng bé, khoá `tableSpeed_v1`, có sao lưu lên mạng:
  - Gộp hai chiều và mọi dạng của cùng phép (7 × 8, 8 × 7, 56 : 7, 7 × ? = 56…).
  - Thời gian câu tìm số thiếu / quan hệ được quy đổi về câu tính thẳng.
  - Xếp loại theo 3 lần gần nhất: **Nhanh** (dưới 3 giây), **Ổn**, **Chậm** (từ 6 giây hoặc có lần hết giờ), **Đang sai**.
- **Ôn đúng chỗ chậm**: phép chậm hoặc hết giờ được ưu tiên ở các lượt Luyện và Thử thách sau, cùng với phép hay sai.
  - Màn kết quả ghi số câu kịp giờ, thời gian trung bình, số câu hết giờ và "🐢 Phép con còn chậm hoặc sai: 7 × 8, 6 × 9…".
  - Thẻ chủ đề cũng hiện dòng này.
- **Khu Bố Mẹ → "⏱️ Tốc độ bảng nhân chia"**:
  - Lưới bảng 2–9 × thừa số 2–10, tô màu theo 4 mức (xanh / vàng / cam / đỏ, xám = chưa đo); rê chuột vào ô để xem số giây.
  - Mức con vật đã mở + kỉ lục từng mức, và danh sách "Nên ôn thêm" (dùng để in phiếu ôn riêng).
  - Xem được cả bé ở máy khác, lấy từ bản sao lưu.
- Phiên bản file `?v=20261006b`.

## 2026-10-06 — Tự sinh câu hỏi bảng nhân, chia 2–9
- **File mới `js/table-gen.js`** sinh câu bảng nhân/chia 2–9 (thừa số 2–10, không có chia có dư). Mỗi câu có id cố định theo dạng + phép tính (vd. `toan_gen_mfac_6x9`), nên cùng một câu luôn ra cùng đề, cùng đáp án nhiễu → Ôn câu sai, lịch ôn "sắp quên", báo cáo kỹ năng đều nhận ra.
- **Hai nhóm dạng**:
  - Tính & tìm số thiếu: `7 × 8 = ?`, `56 : 7 = ?`, `6 × ? = 54`, `36 : ? = 4`, `? : 8 = 7`.
  - Quan hệ phép nhân: `7 × 9 = 7 × 10 − ?`, `9 × 6 = 9 × 5 + ?`, `6 × 7 = 6 × 8 − ?`, `8 × 7 = 8 × 5 + 8 × ?`, `4 + 4 + 4 + 4 = 4 × ?`, `3 × 8 = 8 × ?`, so sánh hai tích `7 × 7 … 6 × 8` (>, <, =).
  - Đáp án nhiễu sát đáp án (±1–2, ± một lần thừa số), vị trí đáp án đúng chia đều A/B/C/D; gợi ý chỉ cách làm, không lộ đáp án.
- **Chủ đề cũ "Bảng nhân, chia"** đổi tên thành **"Bảng nhân, chia (2–9)"**: giữ nguyên 152 câu cũ, thêm 108 câu tự sinh phía sau (bổ sung bảng 2, 3, 5 còn thiếu + các dạng tìm số thiếu, quan hệ phép nhân, so sánh) → 260 câu.
- **Chủ đề mới "⚡ Luyện bảng nhân chia 2–9 (tự sinh)"** (ngay dưới chủ đề cũ, kho 552 câu):
  - Bấm chọn bảng muốn luyện (2…9, có nút "Chọn hết"; mỗi ô có vạch xanh = phần đã vững của bảng đó) và nhóm dạng (Tất cả / Tính & tìm số thiếu / Quan hệ phép nhân). Lựa chọn được nhớ trên máy.
  - **⚡ Luyện 20 câu**: mỗi lần bấm (kể cả "làm lại") bốc 20 câu mới; **ưu tiên phép con hay sai** (gộp cả câu cũ, vd. sai `6 × 9 = ?` thì lượt sau có `6 × ? = 54`, `54 : 6`…), câu chưa làm, bớt câu đã vững; mỗi phép tối đa 1 câu/lượt; chọn "Tất cả" thì khoảng 12 câu tính + 8 câu quan hệ.
  - 📝 Kiểm tra (20 câu, không gợi ý) và 🔁 Ôn lỗi sai theo đúng bảng đã chọn.
  - Không đưa vào "Đề trộn tuần" và không được chọn làm nhiệm vụ "Hôm nay học gì?" (tránh kho 552 câu lấn các chủ đề khác).
- `skills.json`: thêm tên 9 dạng mới cho báo cáo kỹ năng (tìm thừa số, tìm số chia, tìm số bị chia, nhân 9 = nhân 10 bớt một lần, thêm/bớt một lần, tách thừa số, tổng thành tích, đổi chỗ thừa số, so sánh hai tích).
- Lưu ý khi sửa sau này: câu tự sinh nằm **sau** câu trong `bang-nhan-chia.json`; thêm câu tĩnh vào file đó sẽ làm lệch chỉ số tiến độ của phần tự sinh — nên thêm dạng mới vào `table-gen.js` thay vì vào file JSON.
- Phiên bản file `?v=20261006a`.

## 2026-10-02 — Linh vật Thỏ mới (ảnh Gemini) + sửa lỗi không hiện lời nhận xét
- **Bộ 9 ảnh Thỏ** (Nam tạo bằng Gemini; tách nền, cắt, nén WebP 15–57 KB) ở `images/mascot/`: avatar, vẫy tay, giơ ngón cái, cổ vũ, ôm sao, động viên, đọc sách, ngủ, ăn mừng.
- Gắn vào web:
  - Avatar trong khung trang trí (trang chủ, Bộ sưu tập) và logo góc trái: Thỏ avatar thay biểu tượng 🐰.
  - Thanh bên máy tính: Thỏ vẫy tay.
  - Thẻ "Hôm nay học gì?": chưa làm việc nào → vẫy tay (việc đầu là Ôn lại → đọc sách); đang làm dở → cổ vũ; xong hết → ôm sao.
  - Khi làm bài: đúng → Thỏ giơ ngón cái; sai → Thỏ động viên kèm gợi ý; làm lại câu sai đúng ngay → Thỏ cổ vũ.
  - Màn kết quả: ≥80% → Thỏ ăn mừng cầm cúp; ≥50% → cổ vũ; thấp hơn → động viên.
- **Sửa lỗi có từ bản đầu**: khung nhận xét sau mỗi câu ("Chính xác!", "Chưa đúng rồi" + 💡 gợi ý) bị ẩn vĩnh viễn nên bé chưa bao giờ thấy gợi ý. Nay hiện đúng.

## 2026-10-02 — Nhãn Tin vui dễ nhìn hơn
- Nhãn "📣 Tin vui" đổi nền xanh dương–tím của web; cái loa nằm trong vòng tròn trắng nên không còn lẫn vào nền cam.

## 2026-10-02 — Tin vui chạy chữ mượt trên mọi máy
- Dòng "📣 Tin vui" nay chạy chữ chậm, đều **từ phải sang trái** bằng JavaScript (~38 px/giây), rê chuột hoặc chạm vào thì dừng. Trước đây chạy bằng CSS nên máy bật "giảm hiệu ứng" (Windows: Hiệu ứng hoạt hình = Tắt) thấy chữ đứng yên.
- Nhãn "📣 Tin vui" đổi màu cam–đỏ, có vệt sáng lướt qua và loa rung nhẹ mỗi vài giây.

## 2026-10-02 — Bảng tin "📣 Tin vui" chạy ngang + thành tích
- **Dòng tin vui chạy ngang** trên đầu trang chủ (file mới `js/achieve.js`): thông báo thành tích của **cả 3 bé** trong 14 ngày gần nhất, mới nhất trước, rê chuột vào thì dừng. Bé khác máy thì đọc từ bản sao lưu trên mạng. Chưa có tin thì hiện lời nhắc học đều để có tên trên bảng tin.
- **Các mốc thành tích**:
  - 🔥 Học liên tục 3 / 7 / 14 / 30 / 60 / 100 ngày.
  - 🎯 Trả lời đúng **liên tiếp** 10 / 20 / 50 / 100 / 200 câu (tính lần chọn đầu tiên của mỗi câu; sai một câu là đếm lại; không tính câu "làm lại").
  - ✅ Tổng số câu đúng 100 / 300 / 500 / 1000 / 2000 / 5000.
  - ⭐ Lên Level 5 / 10 / 15 / 20 / 30 / 50.
  - 🐉 Đủ 7 viên ngọc rồng. 🎒 Sưu tập 10 / 20 / 30 / 50 sticker.
- Đạt mốc mới thì bé thấy thông báo chúc mừng ngay. Thành tích lưu trong hồ sơ (có ngày đạt) nên được sao lưu.
- Lần đầu chạy: các mốc đã đạt từ trước chỉ báo mốc cao nhất của mỗi loại, tránh dồn một lúc nhiều tin cũ.

## 2026-10-02 — Trang trí hồ sơ (thử nghiệm 3 bộ)
- **Trang trí hồ sơ kiểu Discord** (file mới `js/decor.js`, `decor.css`, vẽ hoàn toàn bằng CSS, không dùng ảnh): mỗi bộ có **khung avatar**, **bảng tên** và **hiệu ứng nền**.
  - 🥕 **Vườn Cà Rốt** (Level 1, mở sẵn): khung lá cà rốt, bảng tên cam, lá bay nhẹ.
  - 🍭 **Lâu Đài Kẹo Ngọt** (Level 5): khung sọc kẹo, bảng tên hồng, bong bóng bay lên.
  - 🪐 **Dải Ngân Hà** (Level 10): khung có hành tinh bay quanh, bảng tên trăng, trời sao lấp lánh.
- **Bộ sưu tập → "🎨 Trang trí hồ sơ"**: xem trước, phối từng món từ các bộ đã mở (vd. khung kẹo + nền sao), hoặc bấm "Mặc cả bộ". Bộ chưa mở hiện 🔒 Level cần đạt.
- **Trang chủ**: thẻ "Hôm nay học gì?" hiện avatar có khung + bảng tên + nền theo đồ đang mặc (thay ô chữ viết tắt cũ). Bấm vào avatar để mở phần trang trí.
- Lên Level mở được bộ mới → thông báo "🎨 Mở khoá bộ trang trí …".
- Đồ đang mặc lưu trong hồ sơ bé nên được sao lưu cùng sao, sticker. Máy bật "giảm chuyển động" thì tắt hiệu ứng động.

## 2026-10-02 — Sửa hình đếm hình chữ nhật
- Câu "Hình bên có tất cả bao nhiêu hình chữ nhật?" (lưới 2×2): vẽ lại thành 4 ô chữ nhật dẹt, không ô nào trông như hình vuông. Đáp án vẫn 9. Câu đếm hình vuông giữ hình lưới vuông cũ.
- Hình dải 3 ô: hạ chiều cao để mỗi ô là hình chữ nhật rõ ràng (trước đây gần vuông). Đáp án vẫn 6.

## 2026-10-02 — Địa chỉ mới: chamhoc.vercel.app
- Gắn thêm tên miền **https://chamhoc.vercel.app** cho web (cài trên Vercel, không đổi code). Link cũ `ontap-lop3.vercel.app` vẫn chạy song song.
- Sao/sticker/tiến độ lưu trong trình duyệt theo từng địa chỉ: lần đầu mở địa chỉ mới, bé gõ lại đúng tên cũ là web tự lấy lại từ bản sao lưu.
- Các tên đã thử nhưng có người giữ: vuihoc, hocvui, hoc-vui, ontap, hocthem.

## 2026-10-02 — Làm lại câu sai ngay trong lượt + nhận xét kỹ năng sau lượt
- **Làm lại câu vừa sai**: câu nào con sai ở lần chọn đầu, 3 câu sau Rabbit hỏi lại câu đó (tiêu đề "🔁 Làm lại câu vừa sai", đáp án xáo lại vị trí).
  - Đúng ngay → "Sửa được rồi! Con giỏi lắm 💪". Sai nữa → hiện gợi ý, con chọn lại rồi đi tiếp như thường, không bị trừ gì.
  - Câu làm lại **chỉ để củng cố**: không cộng sao/XP/điểm, không tính vào "đã vững" hay lịch ôn; điểm lượt (vd. 8/10) vẫn tính theo lần trả lời đầu. Câu sai vẫn vào phần Ôn lại hôm sau như cũ.
  - Không áp dụng ở chế độ Kiểm tra; câu sai ở 2 câu cuối lượt thì không hỏi lại ngay (đã có Ôn lại hôm sau).
- **Màn kết quả có nhận xét ngắn**: "🔁 Con đã sửa được 2/3 câu vừa sai", "🌟 Con làm tốt *Tìm một phần mấy của một số* (đúng 4/4)", "🌱 Thử ôn thêm *Lập số từ các chữ số* (đúng 1/4)". Nhận xét kỹ năng chỉ hiện khi lượt có **từ 3 câu cùng dạng** trở lên.

## 2026-10-02 — Bảng xếp hạng chung, có nhãn lớp tự lên lớp
- Bỏ các tab Lớp 2 / Lớp 3 trên bảng xếp hạng: còn **một bảng chung**, cạnh tên mỗi bé có nhãn màu **Lớp 2 / Lớp 3**.
- Lớp của bé khai trong `API.KIDS` (`js/api.js`): coca lớp 2, Anh Thư lớp 3, Minh Trí lớp 3, tính cho năm học 2026–2027. **Nhãn tự tăng 1 lớp vào 1/9 mỗi năm** (tháng 9/2027: coca lớp 3, Anh Thư và Minh Trí lớp 4), không cần sửa tay.
- Bỏ dòng ghi chú "Điểm lớp 2 và lớp 3 đang nằm chung một bảng".

## 2026-10-02 — Bảng xếp hạng chỉ còn 3 bé thật, gộp tên trùng
- Bảng xếp hạng và danh sách bé trong Khu vực Bố Mẹ chỉ còn **coca, Anh Thư, Minh Trí** (danh sách `API.KIDS` trong `js/api.js`).
- Gộp tên gõ khác của cùng một bé, cộng dồn điểm và số lượt: "Anh thu japan" → Anh Thư, "MINH TRÍ" → Minh Trí, "Coca" → coca. Báo cáo của bố mẹ cũng lấy đủ nhật ký của mọi cách gõ tên.
- Ẩn các tên thử / lạ (Rabbit, Mạnh Quân, Nhạc Khanh, Ai hỏi việt nam, Test). Dữ liệu gốc trong Google Sheet bảng xếp hạng không bị xoá; muốn thêm bé mới thì thêm tên vào `API.KIDS`.

## 2026-10-02 — Nút 🔊 chỉ còn ở Tiếng Anh
- Nút "Đọc to" chỉ hiện ở môn **Tiếng Anh** (nghe phát âm từ, câu). Toán, Tiếng Việt, Toán Tiếng Anh ẩn nút: bé lớp 3 tự đọc đề, và tự đọc cũng là kỹ năng cần luyện. Muốn bật lại môn nào thì thêm vào `Speak.ENABLED_SUBJECTS` trong `js/speak.js`.

## 2026-10-02 — Tiếng Việt: 5 dạng đề còn thiếu + câu hỏi dài dễ đọc hơn
- Thêm 35 câu Tiếng Việt cho 5 dạng trong "Kho dạng đề" chưa có trên web: V02 điền từ vào câu nêu ý nghĩa, V07 tả bằng giác quan nào, V12 từ không cùng nhóm, V30 tìm dấu bạn đặt sai, V32 câu đố điền âm. Chi tiết ở `data-lop3/CHANGELOG.md`.
- **Câu hỏi dài** (đọc hiểu, đoạn văn): xuống dòng đúng chỗ, chữ nhỏ vừa phải và căn trái, không còn dồn thành một khối chữ to.
- Câu "chọn chỗ (1) (2) (3) (4)" giữ đúng thứ tự đáp án, không bị xáo trộn.

## 2026-10-02 — Nút 🔊 Đọc to
- **Nút "🔊 Đọc to"** ở góc khung câu hỏi (file mới `js/speak.js`): bấm là đọc câu hỏi rồi đọc lần lượt các đáp án theo thứ tự đang hiện; bấm lần nữa (nút "Dừng") để dừng. Tự dừng khi con chọn đáp án hoặc sang câu khác.
  - Dùng giọng đọc có sẵn của máy, không cần mạng. Câu tiếng Việt đọc giọng Việt, câu tiếng Anh đọc giọng Anh (đoán theo từng câu và từng đáp án).
  - Tiếng Việt đọc đúng phép tính và đơn vị: × → nhân, : → chia, − → trừ, = ? → bằng mấy, 1/5 → 1 phần 5, cm² → xăng-ti-mét vuông, kg, g, l, mm…; "25 014" đọc liền thành số.
  - Tiếng Anh: chỗ trống "___" đọc là "blank", "= ?" là "equals what".
  - Máy không có giọng phù hợp (vd. Windows chưa cài giọng tiếng Việt) thì nút tự ẩn với câu đó.
- Điện thoại: nút chỉ còn biểu tượng 🔊 cho gọn.

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
