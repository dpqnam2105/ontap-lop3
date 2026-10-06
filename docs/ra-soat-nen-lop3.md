# Rà soát nền lớp 3

## Vòng 4 (2026-10-06): tích hợp bộ sinh B1–B3 lên web (phạm vi: nền Toán B1–B3)

**Cách nối**: theo đúng kiểu `TableGen`. `GenB13.augment()` chạy lúc tải dữ liệu lớp 3:
- Thêm chủ đề **"Nền số đến 1000 (Bài 1–3)"** (`toan_g13`, đứng đầu danh sách Toán), gồm kho cố định 300 câu sinh từ seed `kho-web-v1`. Kho cố định nên chỉ số câu ổn định. Nhờ vậy tiến độ, câu sai, lịch ôn, điểm, sao lưu đều đi qua đúng luồng của câu tĩnh, không có nhánh riêng.
- Chủ đề này 100% câu sinh (lượt riêng "Luyện nền B1–B3").

**1. Quota**: `Quiz._mixGenerated` chỉ chạy cho chủ đề tĩnh có `genMix`, ở chế độ Luyện tập / Kiểm tra.
- "Giải toán có lời văn" chỉ trộn mẫu `lv`; "Ôn tập tổng hợp" trộn mọi mẫu B1–B3. Các chủ đề khác (hình học, bảng nhân chia, một phần mấy, đếm hình…) không có câu sinh.
- Giữ nguyên tổng số câu; câu sinh ≤ ⌊40% × tổng⌋, ưu tiên câu bé chưa gặp.
- Câu sinh giữ `topicId = toan_g13` và chỉ số trong kho, nên không ghi vào tiến độ ngày của chủ đề tĩnh (`next()` có kiểm tra).
- Ôn lỗi sai của từng chủ đề, đấu trường, đề trộn, ôn câu sai không trộn thêm.

**2. Mốc bài đã học**:
- Thanh "Con đang học đến đâu?" có thêm ô chọn "📖 Trên lớp đã học đến: Bài N" (44 bài Toán 3 KNTT tập một). Lưu riêng từng bé, theo lớp + môn, khoá `lessonBySubject`, gồm sách + tập.
- Lọc nằm trong `App._allowedIndices`, chỗ mà mọi đường tạo lượt mới đều đi qua: thẻ chủ đề, kế hoạch hôm nay (`Today._allowed`), đề trộn tuần, chủ đề gợi ý, và cả câu sinh được trộn vào chủ đề tĩnh.
- Chỉ lọc câu có `lesson` cùng bộ sách; câu tĩnh hiện chưa có `lesson` nên không bị ảnh hưởng.
- Chưa chọn mốc, hoặc giá trị lưu hỏng → giữ hành vi theo giai đoạn như cũ, không coi là "chưa học bài nào".

**Dựng lại câu cũ**: `GenB13.ensureFromHistory()` chạy trước khi lập lịch ôn (`Today._qIndex`) và trước khi mở ôn câu sai. Câu sinh có trong lịch sử (câu sai hoặc lịch ôn) mà không có trong kho thì được dựng lại từ id và gắn vào chủ đề nền.

**3–5. Kiểm thử luồng thật** (`tests/gen.e2e.js`, Chromium, 7 nhóm, đều đạt):
- **Mốc bài**: chọn Bài 1 thì cả 4 đường (thẻ chủ đề, kế hoạch hôm nay, đề trộn tuần, trộn vào lời văn) chỉ ra câu B1. Lời văn (B2) không bị trộn. Bỏ chọn hoặc giá trị hỏng → về như cũ. Chọn "chỉ GĐ3" → ẩn chủ đề nền.
- **Quota**: Luyện tập / Kiểm tra ở 2 chủ đề host đều ≤ 40% và đúng mẫu; 3 chủ đề khác không có câu sinh. Làm hết một lượt: tiến độ ngày chủ đề tĩnh = đúng các câu tĩnh, câu sinh vào tiến độ tích lũy của chủ đề nền.
- **Ôn câu sai**: làm sai một câu sinh (Kiểm tra) → tải lại trang → lịch ôn hôm nay có câu đó → bấm thanh "Ôn lại câu con hay sai" ở màn Vào học → câu hiện ra trùng id, đề, mảng lựa chọn, đáp án và gợi ý → bấm đúng → hết khỏi danh sách câu sai. (Thứ tự *hiển thị* nút vẫn được xáo như mọi câu tĩnh; mảng lựa chọn và đáp án giữ nguyên.)
- **Sao lưu / đồng bộ**: `Cloud.collect` → máy mới `Cloud.apply` → tải lại → ôn câu sai dựng đúng câu.
- **Câu ngoài kho** (giả lập sau khi lên phiên bản): vẫn vào lịch ôn và ôn được, nội dung đúng `build(id)`.
- **Câu điền dấu** ở 390px: đúng 3 nút `>`, `<`, `=` trên một hàng, thứ tự cố định, không tràn ngang. Sai → hiện gợi ý; Tab tới nút đúng + Enter → chấm đúng; chế độ Kiểm tra sai → kết quả 0/1.
- **Điểm**: một câu sinh và một câu tĩnh cùng chế độ cộng sao / XP / số câu đúng bằng nhau.
- Đã thử cài lần lượt 4 lỗi (bỏ lọc bài, tăng tỉ lệ trộn lên 90%, bỏ chặn ghi tiến độ, bỏ dựng lại câu ngoài kho): lần nào cũng đúng nhóm test tương ứng báo đỏ.
- Các bộ test cũ (cloud 46, arena 13, home 12, gen-b1b3, home.e2e, arena.e2e) vẫn đạt.

**Chưa làm**: tín hiệu chuyển giai đoạn; gắn `lesson` cho câu tĩnh; mở rộng mẫu.

## Vòng 3 (2026-10-06): sửa theo góp ý Codex trên commit 544bcf6

- **Đọc chữ số 4 (Nam chốt theo sách)**: «tư» sau «mươi» và sau «linh» (24 «hai mươi tư», 104 «một trăm linh tư»); sau «mười» vẫn là «bốn» (14 «mười bốn»). Bỏ chặn các số này khỏi câu đọc/viết số. Test chặn «mươi bốn», «linh bốn», «mười tư», «lẻ», «ngàn», «nhăm» xuất hiện ở bất kỳ lựa chọn nào. Còn chờ: 1000 viết «1 000» hay «1000» (đang để «1 000»).

- **[P2] Bộ chọn**: chỉ dùng tên mẫu có thật (tên sai bị bỏ qua, kể cả `constructor`, `toString`); không còn mẫu nào thì trả `[]` để bên gọi dùng câu tĩnh. `maxLesson`: không truyền = không lọc; `0` = chưa học bài nào → `[]`; giá trị không hợp lệ (null, âm, số lẻ, chuỗi, NaN) → `[]`, không bao giờ mở toàn bộ. `n` không phải số nguyên dương → `[]`. Có test cho từng trường hợp.
- **[P1 khi tích hợp] Phiên bản**: chọn cách **giữ bộ dựng của phiên bản cũ**. `T_BY_VER = {1: T}`; muốn sửa mẫu thì thêm bảng `T2`, tăng `VERSION`, không sửa bảng v1. `pick()` luôn sinh theo `VERSION` mới, `build()` dựng được mọi phiên bản đã có (id phiên bản tương lai → null). Test giả lập lên v2 (đổi gợi ý mẫu cộng): cả 86 câu v1 trong ảnh chụp vẫn dựng lại y nguyên, câu mới ra `_v2_` với gợi ý mới. Lưu ý: v1 chưa phát hành, nên đợt này còn sửa được khung lời văn; từ lúc nạp lên web thì v1 đóng băng, ảnh chụp cố định bảo vệ.
- **[P3] Id**: `_v01_`, `_v0_` bị từ chối (chỉ nhận `v` + số không có 0 đứng đầu); tên mẫu chỉ khớp khoá riêng của bảng mẫu.
- **Skill 5 câu còn lại**: `q023, q059, q096` → `compare-quotients`; `q105` → `table-product-membership`; `q106` → `common-table-product` (đã đăng ký trong `skills.json`). Bảng nhân chia: 152/152 câu có skill.
- **Thứ tự nhiễu**: giữ nguyên. `explain()` ghi rõ tên lỗi chỉ để rà mẫu, không dùng để kết luận bé mắc lỗi gì từ một lần chọn sai.
- **Lời văn theo bối cảnh**: tham số mới `[khung, x, y, bối cảnh, đồ vật, A, B]`.
  - Đồ dùng của một bé (vở, bi, hoa, que tính…): số ban đầu ≤ 99, thêm/bớt ≤ 60, kết quả ≤ 150. "Lan có 990 quyển vở" giờ là `null`.
  - Số ba chữ số dùng thư viện (mua thêm / cho mượn), cửa hàng (nhập thêm / đã bán: kg gạo, quả trứng), trang trại (mua thêm / đã bán: gà, vịt). Số ban đầu ≥ 100.
  - Khoảng 40% câu là đồ dùng cá nhân. Các ca 999 + 1, 1000 − 1, hiệu rất nhỏ chỉ để ở câu tính thuần.
- Chưa làm (bước tích hợp, cần test riêng): lọc theo bài đã học, ôn lại câu sinh trên web, giao diện ba lựa chọn của câu điền dấu, quota.

## Vòng 2 (2026-10-06): đã làm theo phản hồi Codex

**Bước 1 — sửa câu và nhãn đã được đồng ý** (`tools/apply_ra_soat_20261006.py`: kiểm tra giá trị cũ trước khi đổi, chạy lại không đổi gì thêm; không đổi thứ tự câu trong mảng):

- Sửa lời `loi-van_q001`; đổi nhiễu `do-luong_q016` (15 mm → 15 dm), `q017` (28 g → 8 kg); `en_adj-adv_q005` thay **`better` → `nicely`** (`goodly` giữ nguyên, vốn đã sai rõ ràng).
- Chuyển GĐ: hai bước → GĐ2 (`loi-van_q005, q013`, `phan-so_q025, q026`, `so-do_q008–q010`, và 4 câu mới tìm ra khi rà tay: `bang-nhan_q028, q065, q102, q112`); `bang-nhan_q094` → GĐ3; `on-tap_q012` → GĐ4. `phan-so_q029/q030` **giữ nguyên, vẫn chờ mục lục**.
- `so-do_q001`: đổi dữ kiện và đáp án nên **đổi id thành `toan_so-do-doan-thang_q001v2`** (giữ vị trí trong mảng, ghi `replaces`). Ôn câu sai / lịch ôn tìm theo id (rồi theo nội dung đề), nên không khớp câu cũ: tiến độ của câu cũ không áp sang câu mới. Hình mới `so-do-01-v2.svg`.
- Skill bảng nhân chia: `tools/tag_skills.py` chỉ gắn khi khớp mẫu chắc chắn (72 câu: `times-N`, `divide-N`, `missing-*`, `rel-them-bot` cho q056/q057/q093). Rà tay 35 câu (đếm thêm/lùi, nhân suy ra chia, lời văn một bước, so sánh tích, 4 bài hai bước). **Còn 5 câu chưa gắn**, chờ chọn tên kỹ năng: `q023, q059, q096` (phép chia nào lớn/bé nhất), `q105, q106` (số có trong bảng nhân nào).
- `prereq` + `track: enrich` cho 19 câu nâng cao, dùng khoá có trong `data-lop3/skills.json` (đã tách `add-1000` / `sub-1000`). Trồng cây `kieu-kangaroo_q003` cần `divide-4`, `add-1000`. Phát hiện thêm: `so-do_q017–q018` (tổng – hiệu) và `day-so_q008` cần **chia ngoài bảng** (40 : 2, 74 : 2, 57 : 3), nên prereq là `divide` (GĐ2), không phải `divide-2`.
- `review` là danh sách `{by, date, status, note}`, chỉ ghi ở câu đã sửa. Câu tĩnh chưa có `lesson` đều tính là chưa đối chiếu sách.
- Bản kiểm kê (mục 6 `docs/ban-do-noi-dung-lop3.md`) và mẫu câu đại diện đã chạy lại.

**Bước 2 — bộ sinh B1–B3 thử nghiệm** `js/gen-b1b3.js` (**chưa nạp vào web**, chưa vào kế hoạch học). Câu mẫu: `docs/mau-sinh-b1b3.md`. Kiểm thử: `node tests/gen-b1b3.test.js`.

- 18 mẫu trong 8 nhóm: đọc số, viết số từ chữ; cấu tạo số (gồm…), viết thành tổng, gộp tổng; điền dấu, lớn nhất/bé nhất, xếp tăng/giảm; liền trước/sau; cộng; trừ; tìm số hạng / số bị trừ / số trừ; lời văn một bước (6 khung, có 2 khung bẫy "A ít hơn B, hỏi B").
- **Phạm vi**: số 0–1000. Khi bốc câu: khoảng 70% số ba chữ số, 17% hai chữ số, 5% một chữ số, 8% số biên (0, 1, 9, 10, 99, 100, 101, 110, 500, 909, 990, 999, 1000). Riêng câu trừ và tìm thành phần có thêm 25–30% ca **hiệu hoặc số chưa biết nhỏ** (302 − 298, ? + 245 = 250). Có tổng bằng 1000. Câu đọc/viết số dùng số từ 10 (đọc số một chữ số là kiến thức lớp 1).
- **Nhiễu**: chỉ một chính sách — mọi lựa chọn dạng số đều trong 0–1000. Nhiễu sinh bằng mô phỏng lỗi có quy tắc, theo thứ tự ưu tiên: quên nhớ, quên nhớ ở một hàng, nhớ thừa, đặt tính lệch hàng, nhầm phép tính; trừ số bé cho số lớn từng hàng, quên trả khi mượn; đảo chữ số, bỏ sót / viết thừa chữ số 0; chép số đã cho. Dự phòng cuối là "sai 1 ở hàng chục / trăm" (ví dụ 1000 − 1: lỗi khác đều vượt 1000). Không đủ 3 nhiễu thì bộ tham số bị từ chối, bộ chọn sinh lại. `GenB13.explain(id)` in tên lỗi của từng nhiễu.
- **Đọc số**: cách đọc chuẩn là "linh", "mốt", "lăm", "một nghìn". Nhiễu là cách đọc chuẩn của *số khác*, nên "lẻ / ngàn / nhăm / tư" không bao giờ là đáp án sai (test chặn). **Chưa chốt** "… mươi tư / bốn" và "linh tư / bốn": các số đó tạm chưa ra trong câu đọc/viết, chờ Nam đối chiếu sách.
- **Tái tạo**: id = `toan_g13_<mẫu>_v1_<tham số>`. `GenB13.build(id)` luôn ra cùng đề, đáp án, gợi ý và vị trí đáp án. Id sai, sai phiên bản, có số 0 đứng đầu hoặc tham số ngoài phạm vi thì trả `null`. Không dùng vị trí trong mảng.
- **Metadata** mỗi câu sinh: `skill, track: core, stage: 1, lesson {book: kntt-toan3, vol: 1, no: 1|2|3}, source: gen-b1b3-v1, difficulty, review` (ghi "mẫu đã qua kiểm thử; chưa ai rà câu cụ thể").
- **Kiểm thử**: bảng đọc số viết tay (0, mốt, lăm, linh, tròn chục/trăm, 1000); 26 câu viết tay kèm nhiễu bắt buộc; khung lời văn ↔ phép tính; id hỏng → null; ảnh chụp cố định 86 câu (`tests/fixtures/gen-b1b3-golden.json`: đổi nội dung là test đỏ, phải tăng VERSION); quét 4000 câu seed cố định, đáp án tính lại độc lập; phủ phạm vi; vị trí đáp án 20–30% mỗi ô; skill có trong `skills.json`. Đã thử cố ý cài 4 lỗi vào bộ sinh: lần nào test cũng báo đỏ.
- Chưa làm (bước 4, sau khi Codex duyệt): nạp vào web, quota để câu sinh không lấn chủ đề tĩnh trong kế hoạch hôm nay, giao diện câu điền dấu (3 lựa chọn).
- **Tín hiệu chuyển giai đoạn: chưa triển khai.** Giữ trong tài liệu, cần câu khác nhau, nhiều ngày, đủ dạng mỗi skill (theo Codex).

---

# Vòng 1: danh sách đề xuất gửi Codex (giữ nguyên để đối chiếu; chỗ sai đã sửa ở vòng 2)

Trả lời góp ý của Codex trên commit 88d4782. Mọi thay đổi bên dưới chỉ là **đề xuất**: chưa động vào câu nào trong `data-lop3`. Câu sửa tại chỗ thì **giữ nguyên id**.

Ký hiệu: **SỬA** = sửa nội dung/đáp án nhiễu · **NHÃN** = đổi giai đoạn / đánh dấu nâng cao · **ẨN** = tạm ẩn · **CHỜ** = cần trang sách để chốt.

## (a) Câu sẽ sửa, chuyển nhãn hoặc tạm ẩn

### Toán — chủ đề theo sách (track = core)

| Câu | Việc | Lý do |
|---|---|---|
| `giai-toan-co-loi-van_q001` | SỬA lời | "Vườn có 248 quả, hái thêm 135 quả" mơ hồ: hái thêm thì vườn lại ít đi. Sửa thành "Buổi sáng hái được 248 quả cam, buổi chiều hái thêm 135 quả. Hỏi cả ngày hái được bao nhiêu quả?" Đáp án giữ là 383. |
| `giai-toan-co-loi-van_q005` | NHÃN GĐ1→GĐ2 | Bài hai bước (12 − 5 − 3), thuộc bài toán giải bằng hai bước tính ở CĐ4. |
| `giai-toan-co-loi-van_q013` | NHÃN GĐ1→GĐ2 | Bài hai bước (18 + 17 − 3). |
| `phan-so-don-gian_q025`, `q026` | NHÃN GĐ1→GĐ2 | Tìm 1/n rồi trừ tiếp, tức là hai bước. (`q028` "còn lại 1/3" chỉ một bước nên giữ GĐ1.) |
| `phan-so-don-gian_q029`, `q030` | CHỜ, dự kiến GĐ3 | Dạng "a là mấy phần của b", gần với bài "số bé bằng một phần mấy số lớn" (CĐ6). Cần mục lục để chốt số bài. |
| `bang-nhan-chia_q094` | NHÃN GĐ1→GĐ3 | 7 × 5 + 15 là tính giá trị biểu thức, chưa phải dạng "nhân thêm một lần". |
| `bang-nhan-chia_q056`, `q057`, `q093` | Giữ GĐ1, thêm `skill` | Dạng 6 × 9 + 6 = 6 × 10 dùng quan hệ trong bảng nhân, hợp GĐ1. |
| `bang-nhan-chia` (112 câu thiếu skill) | Gắn `skill` | ~~Gắn tất cả theo `times-N` / `divide-N`~~ → vòng 2: chỉ gắn tự động khi khớp mẫu chắc chắn, còn lại rà tay. |
| `on-tap-tong-hop_q012` (2 km = ? m) | NHÃN GĐ1→GĐ4 | Đáp án 2000 vượt phạm vi 1000. |
| `do-luong_q016` | SỬA nhiễu | Thay "15 mm" (mm học ở CĐ5) bằng "15 dm". |
| `do-luong_q017` | SỬA nhiễu | Thay "28 g" (g học ở CĐ5) bằng "8 kg". |

### Toán — chủ đề nâng cao (track = enrich)

| Câu | Việc | Lý do |
|---|---|---|
| `so-do-doan-thang_q001` | SỬA số | Một lớp 3 có 64 bạn là không thực tế. Đổi thành tổng 34, nam 16, nữ 18; sửa nhãn trong SVG `so-do-01.svg` và các phương án theo. |
| `so-do-doan-thang_q008`, `q009`, `q010` | NHÃN GĐ1→GĐ2 | Sơ đồ hai bước (hơn/kém rồi tính tổng). |
| `so-do-doan-thang_q017`, `q018` | Giữ ở nâng cao, thêm `prereq` | Bài tổng – hiệu là phương pháp của lớp 4. Chỉ mở khi đã vững `sub-1000` và `divide` (chia ngoài bảng — sửa ở vòng 2). |

Các dạng nâng cao Codex nêu sẽ giữ trong kho nhưng **không tính vào tín hiệu chuyển giai đoạn**. Mỗi dạng có điều kiện mở (`prereq`):

| Dạng | Câu ví dụ | prereq |
|---|---|---|
| Tổng – hiệu | `so-do-doan-thang_q017–018` | `sub-1000`, `divide` |
| Đếm số hạng | `day-so-cach-deu_q006` (1; 3; …; 21) | `sequence-1000`, `divide-2-9` |
| Suy ngược | `tu-duy-so_q044` | `find-addend`, `find-minuend` (B3) |
| Ốc sên | `kieu-kangaroo_q018` | `add-1000`, `sub-1000` |
| Xếp lịch | `tu-duy-logic_q054–q056` | `add-1000`, `duration` (+ `clock` cho q056) |
| Trồng cây | `kieu-kangaroo_q003` (20 m, cứ 4 m một cây, hai đầu → 6 cây) — vòng 1 bỏ sót | `divide-4`, `add-1000` |

### Tiếng Anh

| Câu | Việc | Lý do |
|---|---|---|
| `en_adj-adv_q005` ("Tom is a ___ swimmer") | SỬA nhiễu | "better" cũng hợp ngữ pháp ("a better swimmer"). Vòng 2: thay **`better` → `nicely`**. |
| 104 câu không gắn unit | Phân 4 nhóm ở vòng sau | Làm thành danh sách riêng (nền GĐ1 / dời giai đoạn sau / cần sửa / bỏ) sau khi chốt nền Toán, để vòng này không bị loãng. |

**Tạm ẩn: không có câu nào.** Mọi lỗi tìm thấy đều sửa được tại chỗ hoặc chỉ cần đổi nhãn.

## (b) Kỹ năng nền B1–B3 còn thiếu

Đếm theo `skill`: GĐ1 hiện chỉ có **1 câu** thuộc B1–B3 (một câu `compare`).

| Bài | skill đề xuất | Nội dung | Hiện có | Cần tối thiểu |
|---|---|---|---|---|
| B1 | `read-write-1000` | Đọc / viết số có ba chữ số (bằng chữ ↔ bằng số) | 0 | 15 |
| B1 | `place-value-1000` | Trăm – chục – đơn vị, viết thành tổng (thiếu hàng chục: 405, 760) | 0 | 15 |
| B1 | `compare-1000` | So sánh, tìm số lớn nhất/bé nhất, xếp thứ tự | 1 | 15 |
| B1 | `sequence-1000` | Số liền trước/liền sau, điền dãy đếm thêm 1, 10, 100 | 0 | 10 |
| B2 | `add-1000` | Cộng có nhớ / không nhớ trong 1000 | 0 | 15 |
| B2 | `sub-1000` | Trừ có nhớ / không nhớ trong 1000 (có mượn qua số 0: 503 − 178) | 0 | 15 |
| B2 | `word-1step-addsub` | Lời văn một bước: thêm / bớt / nhiều hơn / ít hơn | 6 (lời văn GĐ1) | 15 |
| B3 | `find-addend` | ? + 245 = 600 | 0 | 10 |
| B3 | `find-minuend` | ? − 128 = 300 | 0 | 10 |
| B3 | `find-subtrahend` | 700 − ? = 456 | 0 | 10 |

## (c) Mẫu tự sinh đợt đầu (chỉ B1–B3 và lời văn một bước)

Tất cả mẫu đều theo một nguyên tắc:

- Sinh bằng code: đáp án do code tính, không gõ tay.
- 3 phương án nhiễu đều lấy từ lỗi điển hình, không bốc ngẫu nhiên.
- Mỗi mẫu có một bài test chạy 1000 lần, kiểm tra: phạm vi số, đáp án duy nhất, phương án không trùng nhau, không có phương án âm hoặc vượt phạm vi.

| # | Mẫu (skill) | Ví dụ | Điều kiện sinh | Phương án nhiễu | Kiểm chứng |
|---|---|---|---|---|---|
| 1 | Đọc số (`read-write-1000`) | "Số 405 đọc là?" → **bốn trăm linh năm** | 100–999; ưu tiên số có chữ số 0, 1, 4, 5 (linh / mốt / tư / lăm) | "bốn trăm năm", "bốn mươi lăm", "bốn trăm linh lăm" | Hàm đọc số được đối chiếu với bảng 30 số đọc mẫu viết tay; test đủ 900 số không lỗi |
| 2 | Cấu tạo số (`place-value-1000`) | "7 trăm, 0 chục, 6 đơn vị là số?" → **706** | 100–999; khoảng 30% có hàng chục hoặc hàng đơn vị bằng 0 | 76, 760, 7006 | Ghép số từ ba chữ số rồi tách ngược lại phải ra đúng ba chữ số ban đầu |
| 3 | So sánh (`compare-1000`) | "Số lớn nhất: 589, 598, 859, 895" → **895** | 4 số có cùng bộ chữ số hoặc hơn kém nhau 1 ở một hàng | Chính là 3 số còn lại | Đáp án = max (hoặc min); 4 số khác nhau đôi một |
| 4 | Liền trước / liền sau, dãy (`sequence-1000`) | "Số liền sau của 699?" → **700** | Ưu tiên chỗ qua chục hoặc qua trăm (x99, x09, x90) | 6100, 698, 690 | n ± 1 nằm trong 100–999 |
| 5 | Cộng có nhớ (`add-1000`) | 367 + 258 = ? → **625** | Tổng ≤ 999; chọn trước số lần nhớ (0 / 1 / 2) theo độ khó | Quên nhớ (515), nhớ sai hàng (635), ±10 | Phép tính; đếm số lần nhớ khớp với độ khó đã chọn |
| 6 | Trừ có nhớ (`sub-1000`) | 503 − 178 = ? → **325** | a > b, a ≤ 999; 20% có chữ số 0 ở số bị trừ | Lấy số lớn trừ số bé ở từng hàng (475), quên trả mượn (435), ±10 | Hiệu + số trừ = số bị trừ |
| 7 | Tìm thành phần (`find-addend` / `find-minuend` / `find-subtrahend`) | ? − 128 = 300 → **428** | Kết quả 100–999; trộn đều ba dạng | Làm phép tính ngược sai chiều (172), ±100 | Thay đáp án vào phép tính gốc phải đúng |
| 8 | Lời văn một bước (`word-1step-addsub`) | "Lan có 245 nhãn vở, Mai có nhiều hơn Lan 38 nhãn vở. Hỏi Mai có bao nhiêu nhãn vở?" → **283** | Khung câu: thêm / bớt / nhiều hơn / ít hơn / "A ít hơn B" (hỏi B). Tên, đồ vật, đơn vị lấy từ danh sách duyệt sẵn. Số ≤ 999; mỗi câu chỉ một phép tính | Dùng phép ngược lại (207), cộng/trừ sai một hàng | Mỗi khung câu gắn sẵn phép tính đúng. Test kiểm tra từ khoá ↔ phép tính, và soát khung "A ít hơn B" (bẫy đảo chiều) |

Câu tự sinh sẽ mang `source: "gen-<mẫu>"`, `track: "core"`, `lesson: 1|2|3`. Cấp lần lượt vào phiên luyện, không lưu cứng vào JSON, giống cách `table-gen.js` đang làm với bảng nhân.

## (d) Câu cần hình hoặc trang sách

**Hình (67 câu có `image`).** Claude đã mở từng hình và tự đếm / giải lại. Kết quả: **cả 67 đáp án đều khớp hình.** Chi tiết:

- Đếm hình `dem-hinh-gap-khuc_q001–q015`: đếm theo tia và cạnh, khớp từng câu (ví dụ q006 có 4 tia × 2 đường ngang = 12 tam giác; q014 là lưới 2×2, ra 9 hình chữ nhật).
- Đường gấp khúc `q016–q020`: cộng độ dài trên hình, khớp.
- Sơ đồ đoạn thẳng `so-do-doan-thang_q001–q020`: số trên hình khớp đề. Riêng q001 có số không thực tế, xem mục (a).
- Lưới, cây phân loại, mã ô vuông, robot, đường đi, tô màu `tu-duy-logic_q031–q053, q066–q067`: đã giải lại, đáp án đều duy nhất.
- Mảnh ghép lật `kieu-kangaroo_q020–q021`: đã xoay thử, khớp.

Ảnh tổng hợp 23 câu đếm hình / đường đi để Codex soi chéo: `cau-can-nhin-hinh-lop3.png` (Nam gửi kèm).

**Trang sách (cần mục lục để chốt số bài):**

- Toán 3 tập 1: chốt số bài của `phan-so-don-gian_q029–q030` và mốc B1–B15 / B16–B29 dùng cho `lesson`.
- Toán 3 tập 2: chốt mốc GĐ4–5.
- NIK3: mục lục unit 3–12. Hiện mô tả GĐ2–5 tiếng Anh là Claude dựng **chưa đối chiếu sách**. Đề xuất ghi rõ "chưa xác minh" trong `index.json` cho tới khi có mục lục; chỉ U1–2 là đối chiếu với sách thật.
- `loi-van-hay_q032–q034` (biểu đồ tranh dạng chữ ★): không cần hình. Dạng này kế thừa từ lớp 2, để ở nâng cao.

## Đề xuất metadata và mốc bài

Thêm vào mỗi câu (đều không bắt buộc; câu cũ thiếu trường nào thì app xử lý như hiện nay):

```
track:   "core" | "enrich"
lesson:  số bài trong SGK (vd 3 = B3)   ← mốc bài, tách khỏi stage
skill:   như hiện tại
prereq:  ["add-1000", "sub-1000", ...]          ← chỉ dùng cho enrich
ref:     "KNTT T3 t1 B3"                 ← chỉ ghi khi đã đối chiếu trang sách
review:  "claude" | "codex" | "nam"      ← ai đã soát
```

- **Mốc bài:** trong cài đặt của bé thêm "Đã học đến bài N". Câu core có `lesson ≤ N` mới được hiện, còn `stage` chỉ dùng để gom nhóm hiển thị. Câu chưa có `lesson` thì dùng `stage` như cũ.
- **Tín hiệu chuyển giai đoạn:** chỉ dựa vào câu core. Mỗi skill của giai đoạn cần đạt ≥ 80% trên 20 lượt gần nhất. Kết quả câu enrich không tính.
