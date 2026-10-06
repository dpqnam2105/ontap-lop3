# Rà 135 câu `muc-luc` Toán GĐ1 — đề xuất theo 3 lô

> **Đã chốt (2026-10-07):** lô 2, lô 3 và q038/q075 ghi ở vòng 9 (xem `docs/doi-chieu-sgk-toan3-t1.md` mục 6). Lô 1 ghi ở vòng 10 (`tools/apply_lesson_gd1_20261007b.py`): 93 câu theo bảng 1a, basis `muc-luc`. Riêng on-tap q006 (8 × 7) → **B10** `suy-luan` (đổi thành 7 × 8, bảng 7; đổi chỗ ở B10 tr.32), gợi ý "Đổi thành 7 × 8 rồi dùng bảng nhân 7.", skill `times-7`. on-tap q008 skill → `divide-8`. Gợi ý ba câu nhân 10 (bang-nhan q006, q037, q074) đổi thành "Trong bảng nhân a, đếm thêm a đến lần thứ 10." Tổng: 193 câu core GĐ1 có lesson + 6 câu `nen`. Nội dung dưới đây là bản đề xuất gốc, giữ để đối chiếu.

Định nghĩa đã chốt: `lesson` = bài sớm nhất mà kiến thức đã học đủ để làm câu **theo cách giải được hướng dẫn** (gợi ý).
Mọi câu dưới đây giữ nguyên `source`. Nếu được duyệt, ghi `lessonRef.basis = muc-luc`.

Cách rà: đọc từng đề, đáp án, 3 nhiễu và gợi ý (bảng đầy đủ ở `docs/gan-bai-toan-gd1.csv`), kèm kiểm tra tự động.
- Kiểm tra tự động: tính lại đáp án từ đề, phép chia phải chia hết, 4 lựa chọn khác nhau, nhiễu không lệch quá xa.
- Kết quả: **không có đáp án sai, không có lựa chọn trùng**.
- Cảnh báo duy nhất: nhiễu `64` ở `on-tap_q008` (72 : 8). Đây là 72 − 8, tức lỗi trừ thay vì chia, nên vẫn hợp lý.

## Lô 1 — phép nhân/chia trực tiếp và câu cộng/trừ (96 câu)

### 1a. Đề xuất duyệt: 94 câu

| Nhóm | Câu | Bài | Cách giải trong gợi ý |
|---|---|---|---|
| Bảng 4 | bang-nhan q001–q007 (×), q009–q016 (:) | B6 | "Lấy 4 × 5 rồi cộng thêm 4", "4 nhân mấy thì bằng 12?" — tra bảng / quan hệ trong bảng |
| Bảng 6 | q029–q037 (×), q040–q048 (:) | B9 | như trên |
| Bảng 7 | q066–q074 (×), q077–q085 (:) | B10 | như trên |
| Bảng 8 | q113–q121 (×), q122–q130 (:) | B11 | "Lấy 8 × 1 rồi cộng thêm 8", "Nhẩm lại bảng nhân 8: 8 nhân mấy…" |
| Bảng 9 | q131–q139 (×), q140–q148 (:) | B12 | như trên |
| Bảng 3, 5 | q103 (3 × 8), q104 (5 × 9) | B5, B4 | thêm/bớt một nhóm trong bảng 3, bảng 5 |
| Ôn tập | on-tap q006 (8 × 7), q008 (72 : 8) | B11 | "Nhẩm bảng nhân 8…" |
| Cộng trừ trong 1000 | giai-toan q001 (248 + 135), q002 (420 − 175), q011 (100 − 36) | B2 | một phép tính, có nhớ |

Ghi chú lô 1:
- **Sửa skill khi ghi lesson** (không đổi đề, đáp án):
  - on-tap q006: `times-table` → `times-8`.
  - on-tap q008: `divide` → `divide-8`. Khoá `divide` đang mang nghĩa "chia số có nhiều chữ số" (GĐ2).
- **on-tap q006** có gợi ý "bảng nhân 8 hoặc bảng nhân 7". Nếu dùng bảng 7 thì cần đổi chỗ thừa số (7 × 8). Vì vậy đề xuất **B11** (tra bảng 8 trực tiếp), không lấy B10.
- **Độ khó không đồng đều** giữa các bảng (chỉ ghi nhận, chưa sửa):
  - Bảng 4/6/7: phép nhân từ × 6 trở đi và phép chia có thương ≥ 4 là độ khó 2.
  - Bảng 8/9: mọi câu đều độ khó 1.
- **B2 lời văn**: ba câu chỉ có một phép tính. Nhiễu đều từ lỗi rõ ràng: quên nhớ (373), nhầm phép tính (595, 136, 113), trừ sai hàng.

### 1b. Đề nghị chuyển sang nhóm chờ: 2 câu

| Câu | Đề | Lý do |
|---|---|---|
| bang-nhan q038 | 3 × 6 = ? | Có sẵn trong bảng 3 (B5), nhưng gợi ý lại là "Đổi chỗ hai thừa số, kết quả không đổi". Cách giải được hướng dẫn là 6 × 3 → cùng câu hỏi với q008/q039/q076 (sách có dạy đổi chỗ ở bài bảng không?) |
| bang-nhan q075 | 5 × 7 = ? | Như trên: có sẵn trong bảng 5 (B4), nhưng gợi ý dùng đổi chỗ |

Theo nguyên tắc "không đổi gợi ý chỉ để gắn bài sớm hơn", mình chưa sửa gợi ý hai câu này.

## Lô 2 — 11 câu tìm thành phần

Gợi ý hiện tại của **cả 11 câu đều là quy tắc B13**: "Chia 24 cho 4 để tìm thừa số còn thiếu", "Muốn tìm số bị chia, lấy thương nhân với số chia", "Muốn tìm số chia…". Theo định nghĩa lesson, cách giải này là của B13.

| Dạng | Câu | Đề xuất |
|---|---|---|
| a × ? = c (số thiếu đứng sau, giống cách đọc bảng) | q018 (4 × ? = 36), q049 (6 × ? = 42), q086 (7 × ? = 56) | **B13** theo gợi ý hiện tại. Nếu đổi gợi ý thành "Nhẩm bảng nhân 4: 4 nhân mấy bằng 36?" thì làm được ngay ở B6 / B9 / B10, như các câu chia trong bảng |
| ? × b = c (số thiếu đứng trước) | q017 (? × 4 = 24), q050 (? × 6 = 54), q087 (? × 7 = 63) | **B13**. Muốn tra bảng thì phải đổi chỗ thừa số → nếu không theo B13 thì cùng câu hỏi với q008 |
| ? : b = c (tìm số bị chia) | q019, q051, q088 | **B13** — gợi ý là quy tắc "thương × số chia" |
| a : ? = c (tìm số chia) | q052, q089 | **B13** — quy tắc "số bị chia : thương" |

Đề xuất: ghi cả 11 câu **B13**, basis `muc-luc`, vì đó là cách giải đang hướng dẫn. Có thể tách riêng 3 câu dạng `a × ? = c` sang bài bảng, nhưng chỉ khi Codex muốn đổi gợi ý sang tra bảng. Mình nghiêng về giữ B13, đúng tinh thần "không đổi gợi ý chỉ để gắn sớm".

## Lô 3 — 28 câu "Một phần mấy" (chờ ảnh B14, tr.42–45)

| Dạng | Câu | Cần xác nhận từ trang sách |
|---|---|---|
| Nhận biết phần bằng nhau (bánh chia n phần, lấy 1) | phan-so q001–q006 | B14 có dạng "chia làm n phần bằng nhau, lấy 1 phần" bằng lời không, hay chỉ bằng hình tô màu? |
| Đọc / viết 1/n | q007–q010 | B14 có dạy đọc "một phần ba" không? |
| Tìm 1/n của một số (tính thuần) | q011–q020 + on-tap q009 | B14 có tìm 1/n của số lượng không, hay chỉ nhận biết? (Có thể dạng này nằm ở bài sau.) |
| Lời văn tìm 1/n | q021–q024, q027, q028 | như trên, thêm bối cảnh |
| "Bao nhiêu là 1/9 số cam" | q031 | như dạng tìm 1/n |

`phan-so_q029/q030` ("a là mấy phần của b") giữ nguyên trạng thái chờ.

## Tổng kết đề xuất

| | Số câu |
|---|---|
| Lô 1 đề xuất duyệt | 94 |
| Lô 1 chuyển sang chờ (gợi ý dùng đổi chỗ thừa số) | 2 |
| Lô 2 đề xuất B13 | 11 |
| Lô 3 chờ ảnh B14 | 28 |
| **Cộng** | **135** |

Nếu Codex duyệt lô 1a và lô 2: tổng đã gắn bài = 43 + 94 + 11 = **148 / 199**.
