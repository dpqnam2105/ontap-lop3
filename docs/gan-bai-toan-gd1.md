# Đề xuất gắn bài cho câu Toán GĐ1 (chưa sửa dữ liệu)

_Sinh bởi `python3 tools/lesson_map.py`. Bảng đầy đủ: `docs/gan-bai-toan-gd1.csv` (id → bài → kỹ năng → nguồn → ghi chú)._

**Căn cứ**: mục lục SGK Toán 3 KNTT tập một (tên bài + trang). Chưa đối chiếu nội dung từng trang (bản scan không có lớp chữ). Vì vậy chỉ có hai mức: `muc-luc` (tên bài nêu đúng kỹ năng) và `suy-luan` (theo phần bảng / kiến thức cần — cần rà). Câu chưa đủ căn cứ để `chua-gan`.

## Tổng hợp (câu core GĐ1: 199)

| Mức | Số câu |
|---|---|
| muc-luc | 135 |
| suy-luan | 56 |
| chua-gan | 8 |

| Bài | Tên | Số câu đề xuất |
|---|---|---|
| B2 | Ôn tập cộng, trừ trong phạm vi 1000 | 6 |
| B4 | Ôn tập bảng nhân 2, 5, bảng chia 2, 5 | 2 |
| B5 | Bảng nhân 3, bảng chia 3 | 2 |
| B6 | Bảng nhân 4, bảng chia 4 | 24 |
| B7 | Ôn tập hình học và đo lường | 6 |
| B9 | Bảng nhân 6, bảng chia 6 | 30 |
| B10 | Bảng nhân 7, bảng chia 7 | 37 |
| B11 | Bảng nhân 8, bảng chia 8 | 23 |
| B12 | Bảng nhân 9, bảng chia 9 | 22 |
| B13 | Tìm thành phần trong phép nhân, phép chia | 11 |
| B14 | Một phần mấy | 28 |

## Câu phân vân (`suy-luan`) — nhờ Codex/Nam rà

| id | đề | bài đề xuất | lý do |
|---|---|---|---|
| `bang-nhan-chia_q008` | 9 × 4 = ? | B12 | Câu 9 × 4 = ? nằm trong phần bảng 4 (B6): nếu sách dùng tính chất đổi chỗ thừa số thì có thể là B6 |
| `bang-nhan-chia_q020` | Đếm thêm 4:  4; 8; 12; ...; 20. Số còn thiếu là? | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q021` | Đếm lùi 4:  40; 36; 32; ...; 24. Số còn thiếu là? | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q022` | Biết 4 × 6 = 24. Vậy 24 : 4 = ? | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q023` | Trong các phép chia cho 4, phép nào có kết quả LỚN NHẤT? | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q024` | Mỗi ô tô con có 4 bánh xe. Hỏi 8 ô tô như vậy có bao nhiêu bánh xe? | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q025` | Mỗi bàn học có 4 chỗ ngồi. Hỏi 9 bàn như thế có tất cả bao nhiêu chỗ n | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q026` | Nhà Lan có 28 con gà nhốt đều vào 4 chuồng. Hỏi mỗi chuồng có bao nhiê | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q027` | Cô giáo chia đều 36 quyển vở cho 4 tổ. Hỏi mỗi tổ được bao nhiêu quyển | B6 | theo phần bảng 4 |
| `bang-nhan-chia_q039` | 8 × 6 = ? | B11 | Câu 8 × 6 = ? nằm trong phần bảng 6 (B9): nếu sách dùng tính chất đổi chỗ thừa số thì có thể là B9 |
| `bang-nhan-chia_q053` | Đếm thêm 6:  6; 12; 18; ...; 30. Số còn thiếu là? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q054` | Đếm lùi 6:  60; 54; 48; ...; 36. Số còn thiếu là? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q055` | Ba số tiếp theo của dãy 18; 24; 30; ... là? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q056` | Tính:  6 × 9 + 6 = ? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q057` | Tính:  6 × 6 + 6 = ? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q058` | Biết 6 × 8 = 48. Vậy 48 : 8 = ? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q059` | Trong các phép chia cho 6, phép nào có kết quả BÉ NHẤT? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q060` | Một hộp bút chì màu có 6 chiếc. Hỏi 7 hộp như thế có bao nhiêu chiếc b | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q061` | Mỗi bàn ăn xếp được 6 người. Hỏi 8 bàn như thế xếp được bao nhiêu ngườ | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q062` | Một cụm hoa súng có 6 bông. Hỏi 9 cụm hoa như vậy có bao nhiêu bông? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q063` | Có 36 quả cam xếp đều vào 6 đĩa. Hỏi mỗi đĩa có bao nhiêu quả cam? | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q064` | Có 48 học sinh xếp thành các hàng, mỗi hàng 6 bạn. Hỏi xếp được bao nh | B9 | theo phần bảng 6 |
| `bang-nhan-chia_q076` | 9 × 7 = ? | B12 | Câu 9 × 7 = ? nằm trong phần bảng 7 (B10): nếu sách dùng tính chất đổi chỗ thừa số thì có thể là B10 |
| `bang-nhan-chia_q090` | Đếm thêm 7:  7; 14; 21; ...; 35. Số còn thiếu là? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q091` | Đếm lùi 7:  70; 63; 56; ...; 42. Số còn thiếu là? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q092` | Ba số tiếp theo của dãy 21; 28; 35; ... là? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q093` | Tính:  7 × 8 + 7 = ? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q095` | Biết 7 × 9 = 63. Vậy 63 : 9 = ? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q096` | Trong các phép chia cho 7, phép nào có kết quả LỚN NHẤT? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q097` | Một tuần lễ có 7 ngày. Hỏi 6 tuần lễ có bao nhiêu ngày? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q098` | Mỗi giỏ có 7 quả cam. Hỏi 8 giỏ như thế có bao nhiêu quả cam? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q099` | Một tổ có 7 bạn. Hỏi 9 tổ như thế có bao nhiêu bạn? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q100` | Có 49 quyển vở chia đều cho 7 bạn. Hỏi mỗi bạn được bao nhiêu quyển? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q101` | Có 56 bông hoa cắm đều vào 7 lọ. Hỏi mỗi lọ có bao nhiêu bông? | B10 | theo phần bảng 7 |
| `bang-nhan-chia_q105` | Số 42 có trong bảng nhân nào dưới đây? | B10 | theo phần bảng 7 (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung) |
| `bang-nhan-chia_q106` | Số nào vừa có trong bảng nhân 4, vừa có trong bảng nhân 6? | B10 | theo phần bảng 7 (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung) |
| `bang-nhan-chia_q107` | Hai phép tính nào dưới đây có CÙNG kết quả? | B10 | theo phần bảng 7 (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung) |
| `bang-nhan-chia_q108` | Phép tính nào dưới đây có kết quả bằng 36? | B10 | theo phần bảng 7 (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung) |
| `bang-nhan-chia_q109` | Phép tính nào có kết quả BẰNG 6 × 7? | B10 | theo phần bảng 7 (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung) |
| `bang-nhan-chia_q110` | Phép nhân nào dưới đây có kết quả lớn nhất? | B10 | theo phần bảng 7 (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung) |
| `bang-nhan-chia_q111` | Mỗi tuần Thỏ học 6 buổi, mỗi buổi 4 tiết. Hỏi mỗi tuần Thỏ học bao nhi | B10 | theo phần bảng 7 (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung) |
| `bang-nhan-chia_q149` | Mỗi túi có 8 cái kẹo. Hỏi 6 túi có bao nhiêu cái kẹo? | B11 | lời văn cuối kho, theo bảng 8 |
| `bang-nhan-chia_q150` | Có 81 quả cam xếp đều vào 9 đĩa. Hỏi mỗi đĩa có bao nhiêu quả? | B12 | lời văn cuối kho, theo bảng 9 |
| `bang-nhan-chia_q151` | Mỗi tuần Thỏ học 8 tiết Toán. Hỏi 4 tuần Thỏ học bao nhiêu tiết Toán? | B11 | lời văn cuối kho, theo bảng 8 |
| `bang-nhan-chia_q152` | Có 72 học sinh xếp thành các hàng, mỗi hàng 9 bạn. Hỏi xếp được mấy hà | B12 | lời văn cuối kho, theo bảng 9 |
| `do-luong_q002` | 1 m = ? cm | B7 | đơn vị lớp 2 (m, dm, cm, km, kg) — ôn trong B7; chưa xem trang 21–23 |
| `do-luong_q003` | 1 km = ? m | B7 | đơn vị lớp 2 (m, dm, cm, km, kg) — ôn trong B7; chưa xem trang 21–23 |
| `do-luong_q011` | 8 dm = ? cm | B7 | đơn vị lớp 2 (m, dm, cm, km, kg) — ôn trong B7; chưa xem trang 21–23 |
| `do-luong_q015` | Chọn dấu thích hợp: 1 m ... 100 cm | B7 | đơn vị lớp 2 (m, dm, cm, km, kg) — ôn trong B7; chưa xem trang 21–23 |
| `do-luong_q016` | Chiếc bút chì dài khoảng: | B7 | đơn vị lớp 2 (m, dm, cm, km, kg) — ôn trong B7; chưa xem trang 21–23 |
| `do-luong_q017` | Một bạn học sinh lớp 3 nặng khoảng: | B7 | đơn vị lớp 2 (m, dm, cm, km, kg) — ôn trong B7; chưa xem trang 21–23 |
| `giai-toan-co-loi-van_q003` | Hà có 45 viên bi, Hà nhiều hơn Nam 18 viên. Hỏi Nam có bao nhiêu viên  | B2 | bài "nhiều hơn" hỏi số bé (bẫy đảo chiều), số ≤ 100 |
| `giai-toan-co-loi-van_q004` | Mai có 28 nhãn vở, Mai ít hơn Lan 15 nhãn vở. Hỏi Lan có bao nhiêu nhã | B2 | bài "ít hơn" hỏi số lớn (bẫy đảo chiều) |
| `giai-toan-co-loi-van_q012` | Thỏ đọc mỗi ngày 7 trang sách, đọc trong 6 ngày. Hỏi Thỏ đã đọc tất cả | B10 | 7 × 6 — bảng nhân 7 |
| `giai-toan-co-loi-van_q015` | Sợi dây dài 36 m, cắt thành các đoạn, mỗi đoạn dài 4 m. Hỏi cắt được m | B6 | 36 : 4 — bảng chia 4 |
| `on-tap-tong-hop_q014` | Hùng có 30 viên bi, Hùng kém Việt 12 viên. Hỏi Việt có bao nhiêu viên  | B2 | "kém" = ít hơn, hỏi số lớn |

## Chưa gắn (`chua-gan`)

| id | đề | lý do |
|---|---|---|
| `phan-so-don-gian_q029` | Có 18 quả cam. 9 quả cam là mấy phần của số cam? | "a là mấy phần của b": chờ trang sách (có thể B14 hoặc B39) — Codex yêu cầu không đoán |
| `phan-so-don-gian_q030` | Có 12 quả dâu. 2 quả dâu là mấy phần của số dâu? | "a là mấy phần của b": chờ trang sách (có thể B14 hoặc B39) — Codex yêu cầu không đoán |
| `xem-dong-ho-thoi-gian_q001` | Kim giờ chỉ đúng số 3, kim phút chỉ số 12. Đồng hồ chỉ: | xem giờ / lịch là kiến thức lớp 2; mục lục tập một không có bài riêng (có thể nằm trong B7) — chờ trang sách |
| `xem-dong-ho-thoi-gian_q002` | Kim giờ nằm giữa số 10 và số 11, kim phút chỉ số 6. Đồng hồ chỉ: | xem giờ / lịch là kiến thức lớp 2; mục lục tập một không có bài riêng (có thể nằm trong B7) — chờ trang sách |
| `xem-dong-ho-thoi-gian_q003` | Kim giờ chỉ quá số 1 một chút, kim phút chỉ số 3. Đồng hồ chỉ: | xem giờ / lịch là kiến thức lớp 2; mục lục tập một không có bài riêng (có thể nằm trong B7) — chờ trang sách |
| `xem-dong-ho-thoi-gian_q014` | Thứ Hai tuần này là ngày 5. Thứ Hai tuần sau là ngày mấy? | xem giờ / lịch là kiến thức lớp 2; mục lục tập một không có bài riêng (có thể nằm trong B7) — chờ trang sách |
| `xem-dong-ho-thoi-gian_q015` | Hôm nay là thứ Sáu. Ba ngày nữa là thứ mấy? | xem giờ / lịch là kiến thức lớp 2; mục lục tập một không có bài riêng (có thể nằm trong B7) — chờ trang sách |
| `on-tap-tong-hop_q013` | Kim giờ chỉ quá số 4 một chút, kim phút chỉ số 6. Đồng hồ chỉ: | xem đồng hồ — như chủ đề đồng hồ |

## Gắn theo tên bài (`muc-luc`) — tóm tắt theo kỹ năng

| Kỹ năng | Bài | Số câu |
|---|---|---|
| word-problem | B2 | 3 |
| times-5 | B4 | 2 |
| times-3 | B5 | 2 |
| divide-4 | B6 | 8 |
| times-4 | B6 | 7 |
| divide-6 | B9 | 9 |
| times-6 | B9 | 9 |
| divide-7 | B10 | 9 |
| times-7 | B10 | 9 |
| divide | B11 | 1 |
| divide-8 | B11 | 9 |
| times-8 | B11 | 9 |
| times-table | B11 | 1 |
| divide-9 | B12 | 9 |
| times-9 | B12 | 9 |
| missing-dividend | B13 | 3 |
| missing-divisor | B13 | 2 |
| missing-factor | B13 | 6 |
| fraction-of | B14 | 14 |
| unit-fraction | B14 | 6 |
| unit-fraction-read | B14 | 4 |
| word-problem | B14 | 4 |

## Câu nâng cao GĐ1 (track enrich) — KHÔNG gắn bài

| Chủ đề | Số câu GĐ1 | Đã có prereq | Có hình |
|---|---|---|---|
| tu-duy-so | 76 | 5 | 0 |
| loi-van-hay | 44 | 0 | 0 |
| tu-duy-logic | 70 | 3 | 25 |
| kieu-kangaroo | 21 | 2 | 2 |
| dem-hinh-gap-khuc | 20 | 0 | 20 |
| day-so-cach-deu | 15 | 7 | 0 |
| so-do-doan-thang | 13 | 2 | 13 |

Đề xuất: mọi câu nâng cao mang `track: enrich`; `prereq` bổ sung dần theo từng dạng (đã có 19 câu). Không ép vào một bài SGK chỉ vì cùng phép tính.
