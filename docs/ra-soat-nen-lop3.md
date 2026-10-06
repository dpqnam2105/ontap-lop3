# Rà soát nền lớp 3: danh sách đề xuất (CHƯA sửa dữ liệu)

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
| `bang-nhan-chia` (112 câu thiếu skill) | Gắn `skill` tự động | Gắn theo mẫu phép tính (`times-N` / `divide-N`). Không đổi nội dung câu. |
| `on-tap-tong-hop_q012` (2 km = ? m) | NHÃN GĐ1→GĐ4 | Đáp án 2000 vượt phạm vi 1000. |
| `do-luong_q016` | SỬA nhiễu | Thay "15 mm" (mm học ở CĐ5) bằng "15 dm". |
| `do-luong_q017` | SỬA nhiễu | Thay "28 g" (g học ở CĐ5) bằng "8 kg". |

### Toán — chủ đề nâng cao (track = enrich)

| Câu | Việc | Lý do |
|---|---|---|
| `so-do-doan-thang_q001` | SỬA số | Một lớp 3 có 64 bạn là không thực tế. Đổi thành tổng 34, nam 16, nữ 18; sửa nhãn trong SVG `so-do-01.svg` và các phương án theo. |
| `so-do-doan-thang_q008`, `q009`, `q010` | NHÃN GĐ1→GĐ2 | Sơ đồ hai bước (hơn/kém rồi tính tổng). |
| `so-do-doan-thang_q017`, `q018` | Giữ ở nâng cao, thêm `prereq` | Bài tổng – hiệu là phương pháp của lớp 4. Chỉ mở khi đã vững `add-sub-1000` và `divide-2`. |

Các dạng nâng cao Codex nêu sẽ giữ trong kho nhưng **không tính vào tín hiệu chuyển giai đoạn**. Mỗi dạng có điều kiện mở (`prereq`):

| Dạng | Câu ví dụ | prereq |
|---|---|---|
| Tổng – hiệu | `so-do-doan-thang_q017–018` | `add-sub-1000`, `divide-2` |
| Đếm số hạng | `day-so-cach-deu_q006` (1; 3; …; 21) | `sequence-1000`, `divide-2-9` |
| Suy ngược | `tu-duy-so_q044` | `find-addend`, `find-minuend` (B3) |
| Ốc sên | `kieu-kangaroo_q018` | `add-sub-100` |
| Xếp lịch | `tu-duy-logic_q054` | `add-sub-100`, `clock` |
| Trồng cây | Chưa có câu nào | Chưa làm |

### Tiếng Anh

| Câu | Việc | Lý do |
|---|---|---|
| `en_adj-adv_q005` ("Tom is a ___ swimmer") | SỬA nhiễu | "better" cũng hợp ngữ pháp ("a better swimmer"). Thay bằng "goodly" → "nicely" hoặc một trạng từ khác sai rõ ràng. |
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
prereq:  ["add-sub-1000", ...]          ← chỉ dùng cho enrich
ref:     "KNTT T3 t1 B3"                 ← chỉ ghi khi đã đối chiếu trang sách
review:  "claude" | "codex" | "nam"      ← ai đã soát
```

- **Mốc bài:** trong cài đặt của bé thêm "Đã học đến bài N". Câu core có `lesson ≤ N` mới được hiện, còn `stage` chỉ dùng để gom nhóm hiển thị. Câu chưa có `lesson` thì dùng `stage` như cũ.
- **Tín hiệu chuyển giai đoạn:** chỉ dựa vào câu core. Mỗi skill của giai đoạn cần đạt ≥ 80% trên 20 lượt gần nhất. Kết quả câu enrich không tính.
