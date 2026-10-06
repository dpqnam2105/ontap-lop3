# Gắn bài cho câu Toán GĐ1

**Ý nghĩa đã chốt**: `lesson` = bài SỚM NHẤT mà kiến thức đã học đủ để làm câu theo cách giải được hướng dẫn — không có nghĩa "câu lấy từ bài đó trong SGK". `source` gốc giữ nguyên; căn cứ ghi trong `lessonRef.basis` (muc-luc / suy-luan / trang-sach / nen).

## Trạng thái

| Trạng thái | Số câu | Nghĩa |
|---|---|---|
| da-ghi | 99 | đã ghi `lesson` + `lessonRef` vào dữ liệu (nhóm Codex duyệt) |
| cho-quyet | 0 | Codex yêu cầu chờ: cách giải trong gợi ý chưa khớp bài, hoặc cần xác nhận |
| nen | 6 | Codex chốt không gắn bài: kiến thức nền lớp 2 (đổi độ dài, ước lượng kg) — có `lessonRef.basis = nen`, không có `lesson` |
| cho-duyet | 94 | lô 1 (bảng nhân/chia trực tiếp, cộng trừ B2) — đề xuất muc-luc, chờ Codex duyệt |
| chua-gan | 0 | chưa đủ căn cứ |

## Chờ quyết

| id | đề | ghi chú |
|---|---|---|

---

# Đề xuất ban đầu (vòng 5) — giữ để đối chiếu

_Sinh bởi `python3 tools/lesson_map.py`. Bảng đầy đủ: `docs/gan-bai-toan-gd1.csv` (id → bài → kỹ năng → nguồn → ghi chú)._

**Căn cứ**: mục lục SGK Toán 3 KNTT tập một (tên bài + trang). Chưa đối chiếu nội dung từng trang (bản scan không có lớp chữ). Vì vậy chỉ có hai mức: `muc-luc` (tên bài nêu đúng kỹ năng) và `suy-luan` (theo phần bảng / kiến thức cần — cần rà). Câu chưa đủ căn cứ để `chua-gan`.

## Tổng hợp (câu core GĐ1: 199)

| Mức | Số câu |
|---|---|
| muc-luc | 94 |
| suy-luan | 14 |
| chua-gan | 0 |

| Bài | Tên | Số câu đề xuất |
|---|---|---|
| B2 | Ôn tập cộng, trừ trong phạm vi 1000 | 6 |
| B4 | Ôn tập bảng nhân 2, 5, bảng chia 2, 5 | 2 |
| B5 | Bảng nhân 3, bảng chia 3 | 2 |
| B6 | Bảng nhân 4, bảng chia 4 | 25 |
| B7 | Ôn tập hình học và đo lường | 6 |
| B8 | Luyện tập chung | 3 |
| B9 | Bảng nhân 6, bảng chia 6 | 33 |
| B10 | Bảng nhân 7, bảng chia 7 | 38 |
| B11 | Bảng nhân 8, bảng chia 8 | 22 |
| B12 | Bảng nhân 9, bảng chia 9 | 20 |
| B13 | Tìm thành phần trong phép nhân, phép chia | 6 |
| B14 | Một phần mấy | 30 |

## Câu phân vân (`suy-luan`) — nhờ Codex/Nam rà

| id | đề | bài đề xuất | lý do |
|---|---|---|---|
| `bang-nhan-chia_q059` | Trong các phép chia cho 6, phép nào có kết quả BÉ NHẤT? | B9 | phần bảng 6; số lượng mỗi nhóm quyết định bảng |
| `bang-nhan-chia_q064` | Có 48 học sinh xếp thành các hàng, mỗi hàng 6 bạn. Hỏi xếp được bao nh | B9 | phần bảng 6; số lượng mỗi nhóm quyết định bảng |
| `bang-nhan-chia_q095` | Biết 7 × 9 = 63. Vậy 63 : 9 = ? | B9 | vận dụng quan hệ ở B9 tr.29 bài 1c sang một tích cho sẵn (7 × 9 = 63); không cần tự nhớ bảng 7; không phải câu tương ứng trực tiếp trên trang |
| `bang-nhan-chia_q105` | Số 42 có trong bảng nhân nào dưới đây? | B10 | các phương án dùng bảng 4, 5, 6, 7 |
| `bang-nhan-chia_q106` | Số nào vừa có trong bảng nhân 4, vừa có trong bảng nhân 6? | B9 | tìm số có trong cả bảng 4 và bảng 6; không cần bảng 7 |
| `bang-nhan-chia_q108` | Phép tính nào dưới đây có kết quả bằng 36? | B10 | phương án 6×7, 7×5, 4×8, 6×6: cần bảng 4, 6, 7 |
| `bang-nhan-chia_q110` | Phép nhân nào dưới đây có kết quả lớn nhất? | B10 | phương án 6×8, 7×7, 6×9, 7×8: cần bảng 6, 7 |
| `bang-nhan-chia_q111` | Mỗi tuần Thỏ học 6 buổi, mỗi buổi 4 tiết. Hỏi mỗi tuần Thỏ học bao nhi | B6 | mỗi buổi 4 tiết, 6 buổi → 4 × 6 (số lượng mỗi nhóm quyết định bảng) |
| `bang-nhan-chia_q152` | Có 72 học sinh xếp thành các hàng, mỗi hàng 9 bạn. Hỏi xếp được mấy hà | B12 | 72 : 9 → bảng chia 9 |
| `phan-so-don-gian_q029` | Có 18 quả cam. 9 quả cam là mấy phần của số cam? | B14 | B14 tr.43 bài 3, tr.45 bài 3: nhận ra phần khoanh là 1/4, 1/3 qua hình; câu web chuyển sang suy luận bằng lời (chia toàn bộ thành các nhóm bằng nhau) — khó hơn câu có hình, không trùng dạng nguyên văn |
| `phan-so-don-gian_q030` | Có 12 quả dâu. 2 quả dâu là mấy phần của số dâu? | B14 | B14 tr.43 bài 3, tr.45 bài 3: nhận ra phần khoanh là 1/4, 1/3 qua hình; câu web chuyển sang suy luận bằng lời (chia toàn bộ thành các nhóm bằng nhau) — khó hơn câu có hình, không trùng dạng nguyên văn |
| `giai-toan-co-loi-van_q003` | Hà có 45 viên bi, Hà nhiều hơn Nam 18 viên. Hỏi Nam có bao nhiêu viên  | B2 | một bước trừ, bẫy "nhiều hơn" hỏi số bé |
| `giai-toan-co-loi-van_q004` | Mai có 28 nhãn vở, Mai ít hơn Lan 15 nhãn vở. Hỏi Lan có bao nhiêu nhã | B2 | một bước cộng, bẫy "ít hơn" hỏi số lớn |
| `on-tap-tong-hop_q014` | Hùng có 30 viên bi, Hùng kém Việt 12 viên. Hỏi Việt có bao nhiêu viên  | B2 | "kém" = ít hơn, hỏi số lớn: một bước cộng |

## Chưa gắn (`chua-gan`)

| id | đề | lý do |
|---|---|---|

## Gắn theo tên bài (`muc-luc`) — tóm tắt theo kỹ năng

| Kỹ năng | Bài | Số câu |
|---|---|---|
| word-problem | B2 | 3 |
| times-5 | B4 | 1 |
| times-3 | B5 | 1 |
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
