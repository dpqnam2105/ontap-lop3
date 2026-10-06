# Đối chiếu trang SGK Toán 3 (KNTT) tập một — bằng chứng `trang-sach`

Nguồn: bản PDF SGK Toán 3 tập một Nam gửi (126 trang; trang sách = trang PDF − 1).
Claude đã xem các trang: 6–27 (B1–B8), 28–38 (B9–B12), 39–41 (B13), 42–45 (B14), 46 (B15).
Mọi đề xuất dưới đây **chưa ghi** vào dữ liệu, chờ Codex duyệt.

## 1. Trả lời các câu đang chờ

| Câu / nhóm | Thấy trên trang | Đề xuất |
|---|---|---|
| **Đổi chỗ thừa số**: q008 (9×4), q039 (8×6), q076 (9×7), q038 (3×6), q075 (5×7) | B10 tr.32 bài 4a: `7 × 2 ? 2 × 7` — lần đầu sách cho so sánh hai tích đổi chỗ. Các bài bảng 4/6 (tr.19–20, 28–30) không có. B12 tr.38 dùng **bảng nhân chia** (lưới) để tra 4 × 6, 7 × 8. | Gợi ý đang dùng đổi chỗ → bài sớm nhất là **B10** (q008: đổi về 4 × 9; q039: 6 × 8; q076: 7 × 9; q038: 6 × 3; q075: 7 × 5). basis `trang-sach`. Riêng q038, q075 vốn có sẵn trong bảng 3 (B5) / bảng 5 (B4): giữ gợi ý thì ghi B10. Codex có thể chọn đổi gợi ý về "đếm thêm 3 / thêm 5" để ghi B5 / B4. |
| q107 (6×7 và 7×6 cùng kết quả), q109 (bằng 6×7) | B10 tr.32 bài 4a (như trên); B5 tr.18 và B9 tr.29 có dạng "Hai phép tính nào có cùng kết quả?" nhưng là tính từng phép | **B10**, `trang-sach` |
| q058 (Biết 6×8=48 → 48:8), q095 (Biết 7×9=63 → 63:9) | B9 tr.29 bài 1c: `6 × 5`, `30 : 6`, `30 : 5` — từ một phép nhân suy ra chia cho **thừa số kia**. Các bài trước (B5 tr.17, B6 tr.20) chỉ chia cho số của bảng. | q058 → **B9** `trang-sach`. q095: đề đã cho sẵn tích nên chỉ cần quan hệ (B9). Ghi B9 thì đúng định nghĩa "sớm nhất"; ghi B10 thì theo phần bảng 7 — nhờ Codex chọn |
| **Đồng hồ / lịch**: dong-ho q001–q003, q014, q015; on-tap q013 | B7 tr.23 bài 2a: đồng hồ "3 giờ 30 phút / 6 giờ 15 phút…"; bài 2b: "ngày 4 tháng 10 là thứ Ba thì ngày 10 tháng 10 là…"; bài 4: đồng hồ kim ↔ số | **B7** `trang-sach` (sách ôn đúng các dạng này ở B7). Nếu Codex vẫn muốn coi là "nền đã học trước" thì để không gắn |
| **Đo lường** do-luong q002 (1 m = ? cm), q003 (1 km = ? m), q011 (8 dm = ? cm), q015 (1 m … 100 cm), q016 (bút chì dài khoảng…) | B7 tr.22–23 chỉ có: đường gấp khúc (cm), cân (kg), can dầu (lít), đồng hồ, lịch. **Không có** đổi m / dm / km | Năm câu độ dài: **không gắn bài** — kiến thức lớp 2, sách tập một không ôn lại. Ghi chú `nen-lop2` |
| do-luong q017 (bạn lớp 3 nặng khoảng 28 kg) | B7 tr.22: đọc cân (kg), nhưng không có ước lượng | Không gắn (ước lượng là lớp 2) — hoặc B7 nếu Codex coi đọc kg là đủ |

## 2. Lô 2 — 11 câu tìm thành phần

| Thấy trên trang | |
|---|---|
| **B8 tr.26 bài 4a**: `4 × ? = 8`, `12 : ? = 3`, `3 × ? = 18`, `25 : ? = 5` | Dạng **a × ? = c** và **a : ? = c** xuất hiện ở B8, **trước** B13, với các bảng đã học |
| **B13 tr.39**: "Muốn tìm một thừa số, ta lấy tích chia cho thừa số kia"; mẫu `? × 5 = 35`; bài `? × 4 = 28`, `6 × ? = 24` | Quy tắc tìm thừa số; dạng **? × b = c** chỉ thấy từ B13 |
| **B13 tr.40–41**: tìm số bị chia (`? : 6 = 7`…), tìm số chia (`24 : ? = 6`…) kèm quy tắc | Dạng **? : b = c** chỉ có ở B13 |

Đề xuất (bài sớm nhất = dạng đã xuất hiện + bảng đã học), basis `trang-sach`:

| Câu | Dạng | Bài |
|---|---|---|
| q018 `4 × ? = 36` | a × ? = c (B8) + bảng 4 (B6) | **B8** |
| q049 `6 × ? = 42` | a × ? = c + bảng 6 | **B9** |
| q086 `7 × ? = 56` | a × ? = c + bảng 7 | **B10** |
| q052 `30 : ? = 5`, q089 `35 : ? = 5` | a : ? = c (B8) + bảng 5 (B4) | **B8** |
| q017 `? × 4 = 24`, q050 `? × 6 = 54`, q087 `? × 7 = 63` | ? × b = c | **B13** |
| q019 `? : 4 = 7`, q051 `? : 6 = 8`, q088 `? : 7 = 6` | ? : b = c | **B13** |

Lưu ý: gợi ý của 5 câu dạng B8 đang là quy tắc B13 ("Chia 36 cho 4…", "lấy số bị chia chia cho thương"). Ở B8, phép chia đó bé đã làm được (bảng chia đã học), nên mình đề xuất **giữ gợi ý**. Nếu Codex muốn nhãn và gợi ý khớp tuyệt đối thì giữ cả 11 câu ở B13.

## 3. Lô 3 — 28 câu "Một phần mấy" (B14 tr.42–45)

| Dạng | Câu | Thấy trên trang | Đề xuất |
|---|---|---|---|
| Chia bánh n phần bằng nhau, lấy 1 phần | phan-so q001–q006 | tr.42: "chia cái bánh thành hai/bốn phần bằng nhau", "Một phần hai viết là 1/2" | **B14** |
| Đọc 1/n | q007–q010 | tr.43 bài 2: "Chọn cách đọc… Một phần năm / tư / hai / ba" | **B14** |
| Tìm 1/n của số lượng | q011–q020, on-tap q009, q031 | tr.45 bài 4: "Chia 12 quả cam thành 3 phần bằng nhau. 1/3 số quả cam là ? quả" (số nhỏ, có hình) | **B14** — câu của mình là tính thuần, số lớn hơn (dùng bảng chia đến B12) |
| Lời văn tìm 1/n | q021–q024, q027, q028 | như trên | **B14** |
| "a là mấy phần của b" | q029, q030 | tr.43 bài 3 và tr.45 bài 3: "Đã khoanh vào 1/4 số hạt dẻ của hình nào?", "khoanh vào 1/3 số cây cải bắp…" — bé nhận ra 2 trong 8 là 1/4 qua hình | Đề xuất **B14** basis `suy-luan`: sách có dạng nhận ra "mấy phần" từ hình; câu của mình bằng lời, không hình. Codex quyết |

## 4. Nâng mức bằng chứng cho câu đã ghi (đề xuất)

| Câu đã ghi | Trang | Ghi chú |
|---|---|---|
| q024 (4 bánh × 8 ô tô) | B6 tr.19 bài 3 — **trùng nguyên văn** | suy-luan → trang-sach |
| q023 (phép chia cho 4 lớn nhất) | B6 tr.20 bài 2 "Toa tàu nào… lớn nhất? 8:4, 16:4, 40:4, 24:4" — gần như nguyên văn | → trang-sach |
| q020, q021 (đếm thêm/lùi 4), q053–q055, q090–q092 | B6 tr.19 bài 2; B9 tr.29; B10 tr.32 "Nêu các số còn thiếu" | → trang-sach |
| q022 (4×6=24 → 24:4) | B6 tr.20 khám phá `4 × 6 = 24 → 24 : 4 = 6` — trùng | → trang-sach |
| q026, q027, q063, q064, q100, q101 (lời văn chia) | B6 tr.20 bài 2 (24 bánh, mỗi hộp 4); B10 tr.32 bài 3 (42 cốc, 7 hộp) | → trang-sach |
| q097 (1 tuần 7 ngày × 6 tuần) | B10 tr.32 bài 3 "Mỗi tuần lễ có 7 ngày… 4 tuần lễ" | → trang-sach |
| q056/q057/q093 (thêm một nhóm) | Các bài bảng: "Thêm 6 vào kết quả của 6 × 2 ta được kết quả của 6 × 3" (tr.28, 31, 33, 36) | → trang-sach |

## 5. Bộ sinh B1–B3 khớp sách

- **Cách đọc**: B1 tr.6 "một trăm ba mươi **tư**", "hai trăm bảy mươi **mốt**" — đúng quy tắc đang dùng.
- **Viết 1000**: sách viết **"1 000"** (tiêu đề B1, B2 tr.9 "1 000 − 700") — đúng `fmt()` hiện tại. Câu hỏi còn mở về "1 000" đã có trả lời.
- **Đúng dạng sách, kể cả lời văn**:
  - "Số gồm 5 trăm, 0 chục và 4 đơn vị" (tr.6) — trùng mẫu `gom`.
  - Viết thành tổng `385 = 300 + 80 + 5` (tr.7) — trùng mẫu `tong`.
  - Liền trước / liền sau có 999 (tr.7).
  - So sánh, sắp xếp 4 số cùng chữ số "531, 513, 315, 351" (tr.8).
  - Đặt tính cộng trừ có nhớ (tr.9–10).
  - Lời văn "ít hơn 18 học sinh", "650 kg / 150 kg" (tr.9–10) — đúng hướng số lớn trong bối cảnh lớn.
  - Quy tắc tìm số hạng / số bị trừ / số trừ (tr.11–13).
- **Khác nhỏ**:
  - Gợi ý `timsh` của mình: "lấy tổng trừ đi số hạng **đã biết**"; sách viết "lấy tổng trừ đi số hạng **kia**". Có thể đổi cho khớp sách, nhưng phải lên v2 vì v1 đã phát hành → đề xuất để nguyên.
  - Sách B3 dùng số ≤ 100, mình sinh đến 1000 (đã học ở B2).
- **Chưa có**: so sánh với biểu thức ("100 ? 90 + 9", "400 + 70 + 5 ? 475", tr.8). Nếu cần thì thêm mẫu ở v2.
