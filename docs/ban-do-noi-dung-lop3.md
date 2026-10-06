# Bản đồ nội dung Lớp 3 — để rà nền trước khi mở rộng kho

> Trạng thái: **bản rà soát, chưa sửa dữ liệu**. Ngày 06/10/2026, theo kho ở commit hiện tại trên `main`.
> Nam đã chốt: tạm dừng phát triển lớp 2, tập trung lớp 3; **chưa mở rộng kho đại trà trước khi rà xong nền.**
> Claude soạn bản này; Codex đối chiếu nguồn, rà thứ tự kỹ năng, soi mẫu câu ở `docs/mau-cau-dai-dien-lop3.md`.

**Nhãn dùng trong bản này**

- **[Bám sách]** — lấy đúng phạm vi / thứ tự bài trong sách bé học (đã có mục lục trong project).
- **[Theo chương trình]** — theo khung GDPT 2018 lớp 3 nói chung, **chưa** đối chiếu được mục lục sách cụ thể.
- **[Tự thiết kế]** — cách chia, nhóm chủ đề hay quy tắc do mình đặt ra, không có trong sách.
- **[Chưa có nguồn]** — cần Nam gửi mục lục / ảnh sách mới đối chiếu được.

Số câu ở mục 6 do `tools/content_map.py` đếm thẳng từ `data-lop3/` (chạy lại là ra số mới, không nhập tay).

---

## 1. Phát hiện chính (đọc trước)

1. **Toán GĐ1 lệch hẳn về nâng cao, thiếu phần nền.** GĐ1 có 471/662 câu (71%), nhưng 262 câu là 7 chủ đề nâng cao ngoài sách. Ba bài nền đầu sách — **B1 số đến 1000, B2 cộng trừ trong 1000, B3 tìm thành phần phép cộng/trừ** — gần như **không có câu nào** (đếm theo `skill`: chỉ 1 câu `compare`). Hai chủ đề "Số…" và "Cộng trừ…" hiện chỉ chứa câu GĐ4–5 (đến 10 000 / 100 000).
2. **Toán GĐ2–GĐ3 rất mỏng** (33 và 28 câu) — đúng phần lớp sắp học tới (Chủ đề 3–7 sách tập 1). Ví dụ GĐ2: nhân/chia số có hai chữ số chỉ 5 câu, toán hai bước 2 câu (+4 câu sơ đồ).
3. **Toán GĐ4–GĐ5 (học kì 2) chưa đối chiếu được sách** — project mới có mục lục **tập một**. Ranh giới GĐ4/GĐ5 là [Theo chương trình].
4. **Tiếng Việt chưa chia giai đoạn.** App hiện mọi câu cho mọi bé. Có 35 câu đã gắn `stage: 1` nhưng vô tác dụng vì `index.json` môn này không có `stages`. Chưa có mục lục SGK Tiếng Việt 3 trong project → [Chưa có nguồn].
5. **Tiếng Anh: giai đoạn dựng theo Now I Know 3 (sách ở trường), nhưng cả 205 câu đều gắn GĐ1.** Chỉ 72 câu thật sự bám NIK3 Unit 1–2, cộng 9 câu tính từ/trạng từ bổ trợ (81). 20 câu Global Success (sách ngoài trường, Nam muốn giữ cho phong phú). **104 câu từ đợt audit 24/9** (At School, My Family, Daily Activities, Vocabulary, Grammar, Reading, Ôn tập) chung chung, không gắn unit sách nào.
6. **Dữ liệu cần dọn:** 112/152 câu Bảng nhân chia không có `skill` và `source` (báo cáo phụ huynh không tách được bảng nào yếu). Quét từ khoá GĐ1 Toán thấy: `toan_on-tap-tong-hop_q012` "2 km = ? m" (đáp án 2000, vượt phạm vi 1000 của HK1); `toan_do-luong_q016/q017` dùng mm, g làm đáp án nhiễu (đơn vị học ở GĐ3) — Codex xem có chấp nhận không. Quét bằng từ khoá nên **chưa phải danh sách đầy đủ**.
7. **Chuyển giai đoạn hiện hoàn toàn thủ công** (bố mẹ/bé chọn). Không có tín hiệu "sẵn sàng" nào. Đề xuất ở mục 5.

---

## 2. Toán — 5 giai đoạn

Sách: **SGK Toán 3 Kết nối tri thức, tập một** (mục lục 7 chủ đề, 44 bài — có trong project). Tập hai: chưa có mục lục.

| GĐ | Phạm vi | Nhãn | Mục tiêu kỹ năng | Cần biết trước | Chủ đề đang có (số câu GĐ này) |
|---|---|---|---|---|---|
| **1** (HK1) | CĐ1–2, **B1–B15** (tr.6–48) | [Bám sách] | Đọc, viết, cấu tạo, so sánh số đến 1000; cộng trừ có nhớ trong 1000; tìm số hạng / số bị trừ / số trừ; thuộc bảng nhân chia 2–9; tìm thừa số, số bị chia, số chia; một phần mấy (1/2…1/9) của một số; ôn hình học – đo lường lớp 2 (đường gấp khúc, km/m/dm/cm, kg, l) | Toán 2: số đến 1000, cộng trừ có nhớ trong 1000, bảng nhân chia 2 và 5, xem giờ (giờ đúng, rưỡi, 15 phút) | Bảng nhân chia 152 · Một phần mấy 31 · Lời văn 9 · Đo lường 6 · Ôn tập 6 · Đồng hồ 5 · **Nâng cao 262** · **Số / cộng trừ / tìm thành phần cộng-trừ: ~0** |
| **2** (HK1) | CĐ3–4, **B16–B29** (tr.49–84) | [Bám sách] | Trung điểm; hình tròn (tâm, bán kính, đường kính); góc vuông/không vuông; tam giác, tứ giác, chữ nhật, vuông; khối lập phương, khối hộp chữ nhật; nhân số có 2 chữ số với số có 1 chữ số; gấp lên một số lần; **chia hết, chia có dư** (số dư < số chia); chia số có 2 chữ số; giảm đi một số lần; bài toán hai bước | GĐ1 vững, nhất là bảng nhân chia 2–9 và tìm thành phần | Hình học 15 · Nhân chia ngoài bảng 11 · Sơ đồ đoạn thẳng 4 · Lời văn 2 · Ôn tập 1 (**33**) |
| **3** (HK1) | CĐ5–7, **B30–B44** (tr.85–125) | [Bám sách] | mm; gam; ml; nhiệt độ; nhân số có 3 chữ số với số có 1 chữ số; chia số có 3 chữ số cho số có 1 chữ số; biểu thức số (thứ tự thực hiện, dấu ngoặc); số lớn gấp mấy lần số bé; ôn tập HK1 | GĐ2: nhân chia số có 2 chữ số, chia có dư; đổi đơn vị lớp 2 | Nhân chia ngoài bảng 13 · Đo lường 12 · Lời văn 3 (**28**) |
| **4** (HK2) | Số đến 10 000… | [Theo chương trình] | Số đến 10 000; làm tròn số; chữ số La Mã; chu vi, diện tích (hình chữ nhật, hình vuông); cộng trừ nhân chia trong 10 000 | Cả HK1 | Cộng trừ 14 · Hình học 13 · Số 12 · Nhân chia 4 · Ôn tập 4 (**47**) |
| **5** (HK2) | Số đến 100 000… | [Theo chương trình] | Số đến 100 000 và các phép tính; xem đồng hồ đến từng phút; tháng – năm; tiền Việt Nam; ôn tập cuối năm | GĐ4 | Số 40 · Cộng trừ 20 · Đồng hồ 10 · Nhân chia 5 · Ôn tập 5 · Đo lường 2 · Lời văn 1 (**83**) |

Ghi chú:

- **Ranh giới GĐ1/2/3** trùng ranh giới chủ đề sách (CĐ1–2 / CĐ3–4 / CĐ5–7) — việc **gộp chủ đề sách thành giai đoạn** là [Tự thiết kế]; nội dung trong mỗi GĐ là [Bám sách].
- Theo tiến độ Nam báo cuối tháng 9: lớp đã học hết bảng nhân chia 2–9 (hết B12), **chưa học chia có dư** (B25, GĐ2). Tức là bé đang ở cuối GĐ1.
- **Chủ đề nâng cao** (7 chủ đề, 262 câu, đều GĐ1) — [Tự thiết kế], không ứng với bài nào trong sách: Tư duy số & phép tính 76, Tư duy logic (kiểu Bebras) 70, Toán có lời văn hay 44, Kangaroo 21, Đếm hình & đường gấp khúc 20, Sơ đồ đoạn thẳng 16 (+4 ở GĐ2), Dãy số cách đều 15. Giả định khi xếp GĐ1: **chỉ dùng số ≤ 1000, cộng trừ có nhớ, bảng nhân chia 2–9, không chia có dư, không đơn vị GĐ3**. Codex soi mẫu để xác nhận giả định này.
- **Bảng nhân chia tự sinh** (Đấu trường tính nhanh, `js/table-gen.js`): bảng 2–9, thừa số 2–10, không chia có dư, gắn `stage: 1`, `source: table-gen`. Không nằm trong `index.json`.
- Quyết định cũ "ẩn số đến 100 000 cho tới khi lớp học tới" nay thực hiện bằng giai đoạn (GĐ5), không cần ẩn riêng.

## 3. Tiếng Việt — chưa chia giai đoạn

| | Nhãn |
|---|---|
| Sách: SGK Tiếng Việt 3 Kết nối tri thức. **Chưa có mục lục trong project.** | [Chưa có nguồn] |
| Lớp đang ở **tuần 6**, bài đọc 11 "Lời giải toán đặc biệt" (Nam báo cuối tháng 9). Chủ đề "Từ, câu, dấu câu (đến bài 12)" bám tiến độ này. | [Bám sách] một phần |
| Trục kỹ năng đang dùng: đọc hiểu (chi tiết, ý nghĩa, giác quan); từ chỉ sự vật / hoạt động / đặc điểm; kiểu câu (giới thiệu, nêu hoạt động, nêu đặc điểm, câu hỏi); dấu câu; chính tả phân biệt (r/d/gi, ch/tr, g/gh, s/x, l/n…); so sánh; viết đoạn (cảm nghĩ về bạn). | [Tự thiết kế] theo dạng đề Nam chụp |

**Đề xuất:** chia GĐ theo **nhóm tuần / chủ điểm** của sách tập 1 (vd. GĐ1 = tuần 1–6 đến bài 12…), giống cách Toán bám chủ đề sách. Cần Nam chụp **mục lục SGK Tiếng Việt 3 tập 1** trước. Khi chia: gắn lại `stage` cho cả 237 câu (35 câu đang có `stage: 1` cần soát lại).

## 4. Tiếng Anh — giai đoạn theo Now I Know 3

Sách ở trường: **Now I Know 3** (12 unit — mục lục có trong project). Global Success 3 là sách Nam sưu tầm, **trường không học**.

| GĐ | Phạm vi (theo `index.json`) | Nhãn | Ngữ pháp chính | Câu đang có |
|---|---|---|---|---|
| 1 | NIK3 U1–2 + nền (be, have, can, hiện tại đơn) | [Bám sách] + nền [Tự thiết kế] | Câu mệnh lệnh, don't; giới từ vị trí; have/has to | **205** (xem dưới) |
| 2 | NIK3 U3–4 | [Bám sách] | Quá khứ đơn (-ed, did/didn't, Wh- với did) | 0 |
| 3 | NIK3 U5–6 | [Bám sách] | So sánh hơn/nhất; danh từ chỉ lượng; hỏi giờ | 0 |
| 4 | NIK3 U7–9 | [Bám sách] | more/the most; How often…?; Would you like to…?; số thứ tự | 0 |
| 5 | NIK3 U10–12 | [Bám sách] | should/shouldn't; There is/are; will/won't | 0 |

205 câu GĐ1 gồm: NIK3 U1 22 · U2 22 · Reading NIK3 12 · Tính từ – trạng từ 25 (16 NIK3 + 9 bổ trợ) → **72 bám NIK3 + 9 bổ trợ = 81**. Global Success tập 1: 20 (dễ hơn NIK3, hợp làm nền). **Không gắn unit sách nào: 104** (At School, My Family, Daily Activities, Vocabulary, Grammar, Reading, Ôn tập — đợt audit 24/9) → đề xuất: Codex soi mẫu, câu nào là kiến thức nền thì giữ ở GĐ1 nhãn "nền", câu nào thừa / sai trình độ thì bỏ.

Lưu ý thứ tự kỹ năng: NIK3 U2 đã có have/has to; U3–4 vào quá khứ đơn sớm hơn nhiều sách phổ thông. Giai đoạn bám **thứ tự của NIK3**, không theo GDPT chung.

## Toán Tiếng Anh

Tạm hoãn theo ưu tiên của Nam (sách Max Maths để ở trường). 74 câu, chưa chia giai đoạn, không rà trong đợt này.

---

## 5. Bé chuyển giai đoạn thế nào

**Hiện tại (đọc từ `js/app.js`, không phải đề xuất):**

- Mỗi môn có thanh "📍 Con đang học đến đâu?" → chọn GĐ. Mặc định GĐ1. Chưa chọn thì có dòng nhắc bố mẹ chọn.
- Hai chế độ: **"Ôn cả phần trước"** (câu GĐ ≤ GĐ đang chọn) hoặc **"Chỉ giai đoạn này"**.
- Câu **chưa gắn GĐ luôn hiện** ở mọi GĐ.
- Kế hoạch hôm nay, Đề trộn tuần, Ôn câu sai đều lọc theo GĐ đang chọn. Lưu riêng từng bé, theo lớp + môn.
- **Không có** cơ chế tự chuyển hay gợi ý chuyển.

**Đề xuất [Tự thiết kế] — để Codex phản biện, chưa code:**

1. **Lớp học tới đâu thì bố mẹ chọn tới đó** — quyết định chính vẫn là của bố mẹ, vì app không biết tiến độ trên lớp. App **không tự nhảy** giai đoạn.
2. App chỉ **gợi ý** trong Khu Bố Mẹ:
   - "Sẵn sàng sang GĐ tiếp" khi **mọi chủ đề theo sách** của GĐ hiện tại đều: đã làm ≥ 10 câu khác nhau, đúng ngay lần đầu ≥ 80% trong 14 ngày gần nhất, và còn ≤ 5 câu sai chưa sửa.
   - "Cần củng cố [chủ đề]" khi một chủ đề theo sách < 60%.
   - Chủ đề nâng cao **không** chặn việc chuyển GĐ.
3. Sau khi chuyển: giữ chế độ "Ôn cả phần trước"; câu GĐ cũ chủ yếu quay lại qua ôn ngắt quãng.
4. Các con số 10 câu / 80% / 14 ngày / 5 câu / 60% là **giá trị khởi đầu**, cần chỉnh sau khi xem dữ liệu thật của 3 bé.

## Mẫu tự sinh có thể làm (đề xuất, chưa làm)

Theo cách của bảng nhân chia tự sinh (đáp án nhiễu là lỗi điển hình, câu cố định theo id):

| GĐ | Mẫu | Đáp án nhiễu (lỗi điển hình) |
|---|---|---|
| 1 | Cộng trừ có nhớ trong 1000 · tìm số hạng / số bị trừ / số trừ · tìm thừa số / số bị chia / số chia · một phần mấy của n (n chia hết) · liền trước – liền sau, so sánh, sắp xếp số ≤ 1000 · cấu tạo số trăm – chục – đơn vị | Quên nhớ, nhớ thừa, nhầm hàng, lấy nhầm phép ngược |
| 2 | Nhân số có 2 chữ số × 1 chữ số · chia số có 2 chữ số (hết và có dư, số dư < số chia) · gấp lên / giảm đi một số lần · toán hai bước theo khuôn | Quên nhớ khi nhân; số dư ≥ số chia; nhầm gấp ↔ giảm |
| 3 | Nhân / chia số có 3 chữ số với số có 1 chữ số · biểu thức (thứ tự thực hiện, ngoặc) · đổi mm/cm/m, g/kg, ml/l · gấp mấy lần | Tính trái sang phải bỏ qua ngoặc / ưu tiên; đổi sai 10 ↔ 100 ↔ 1000 |

## Việc nhờ Codex

1. **Đối chiếu nguồn:** ranh giới GĐ1–3 với mục lục SGK Toán 3 tập 1 (bảng mục 2); mô tả GĐ trong `data-lop3/toan/index.json` và `tieng-anh/index.json` có khớp không.
2. **Thứ tự kỹ năng:** có kỹ năng nào xếp sớm hơn sách không (đặc biệt 7 chủ đề nâng cao ở GĐ1, và GĐ4/GĐ5 chưa có sách tập 2).
3. **Soi mẫu câu** ở `docs/mau-cau-dai-dien-lop3.md` (tối đa 3 câu mỗi ô môn × GĐ × chủ đề): đúng GĐ? đúng đáp án? trình độ hợp lớp 3? đáp án nhiễu hợp lý?
4. Ý kiến về: quy tắc chuyển GĐ (mục 5), cách xử lý 104 câu Tiếng Anh không gắn unit, có tách "nâng cao" thành nhãn riêng (`track: enrich`) không.
5. Sau đó hai bên thống nhất danh sách: sửa nhãn / bỏ câu / bổ sung nền GĐ1 / mẫu tự sinh nào làm trước.

---

## 6. Số câu theo môn × giai đoạn × chủ đề (tự sinh)

<!-- Sinh bởi: python3 tools/content_map.py -->

### Toán — giai đoạn: GĐ1, GĐ2, GĐ3, GĐ4, GĐ5

| Chủ đề | Loại | GĐ1 | GĐ2 | GĐ3 | GĐ4 | GĐ5 | Chưa gắn GĐ | Tổng | Thiếu skill | Nguồn (source) |
|---|---|---|---|---|---|---|---|---|---|---|
| Số đến 100 000 | theo sách | 0 | 0 | 0 | 12 | 40 | 0 | 52 | 0 | claude-audit-20260924 52 |
| Cộng trừ trong phạm vi 100 000 | theo sách | 0 | 0 | 0 | 14 | 20 | 0 | 34 | 0 | claude-audit-20260924 34 |
| Bảng nhân, chia (2–9) | theo sách | 152 | 0 | 0 | 0 | 0 | 0 | 152 | 112 | (trống) 112, claude-audit-20260924 40 |
| Nhân, chia ngoài bảng | theo sách | 0 | 11 | 13 | 4 | 5 | 0 | 33 | 0 | claude-audit-20260924 33 |
| Một phần mấy | theo sách | 31 | 0 | 0 | 0 | 0 | 0 | 31 | 0 | claude-audit-20260924 24, bo-tro-tuan6-8-20261001 7 |
| Hình học (trung điểm, hình tròn, chu vi, diện tích) | theo sách | 0 | 15 | 0 | 13 | 0 | 0 | 28 | 0 | claude-audit-20260924 25, bo-tro-tuan6-8-20261001 3 |
| Đếm hình & đường gấp khúc | nâng cao | 20 | 0 | 0 | 0 | 0 | 0 | 20 | 0 | cai-bien-de-hk1-20260930 20 |
| Đo lường (độ dài, khối lượng, dung tích) | theo sách | 6 | 0 | 12 | 0 | 2 | 0 | 20 | 0 | claude-audit-20260924 20 |
| Xem đồng hồ, thời gian | theo sách | 5 | 0 | 0 | 0 | 10 | 0 | 15 | 0 | claude-audit-20260924 15 |
| Giải toán có lời văn | theo sách | 9 | 2 | 3 | 0 | 1 | 0 | 15 | 0 | claude-audit-20260924 15 |
| Sơ đồ đoạn thẳng (toán có lời văn) | nâng cao | 16 | 4 | 0 | 0 | 0 | 0 | 20 | 0 | claude-singapore-bar-model-20260930 20 |
| Dãy số cách đều | nâng cao | 15 | 0 | 0 | 0 | 0 | 0 | 15 | 0 | bo-tro-tuan6-8-20261001 15 |
| Ôn tập tổng hợp | theo sách | 6 | 1 | 0 | 4 | 5 | 0 | 16 | 0 | claude-audit-20260924 16 |
| Tư duy số & phép tính | nâng cao | 76 | 0 | 0 | 0 | 0 | 0 | 76 | 0 | cai-bien-de-hk1-20260929 55, bo-tro-tuan6-8-20261001 21 |
| Toán có lời văn hay | nâng cao | 44 | 0 | 0 | 0 | 0 | 0 | 44 | 0 | cai-bien-de-hk1-20260929 39, bo-tro-tuan6-8-20261001 5 |
| Tư duy logic (kiểu Bebras) | nâng cao | 70 | 0 | 0 | 0 | 0 | 0 | 70 | 0 | cai-bien-de-hk1-20260929 30, tu-soan-y-tuong-bebras-20260930 24, cai-bien-de-hk1-20260930 16 |
| Toán đố vui kiểu Kangaroo | nâng cao | 21 | 0 | 0 | 0 | 0 | 0 | 21 | 0 | tu-soan-y-tuong-kangaroo-20260930 21 |
| **Tổng** | | 471 | 33 | 28 | 47 | 83 | 0 | 662 | | |

### Tiếng Việt — CHƯA chia giai đoạn

| Chủ đề | Loại | Có nhãn GĐ (bị bỏ qua) | Chưa gắn GĐ | Tổng | Thiếu skill | Nguồn (source) |
|---|---|---|---|---|---|---|
| Đọc hiểu | — | 0 | 12 | 12 | 0 | claude-audit-20260924 12 |
| Từ vựng | — | 0 | 16 | 16 | 0 | claude-audit-20260924 16 |
| Chính tả | — | 0 | 16 | 16 | 0 | claude-audit-20260924 16 |
| Câu và dấu câu | — | 8 | 16 | 24 | 0 | claude-audit-20260924 16, dang-de-tv-20261002 8 |
| Luyện từ và câu | — | 0 | 16 | 16 | 0 | claude-audit-20260924 16 |
| Tập làm văn | — | 0 | 12 | 12 | 0 | claude-audit-20260924 12 |
| Ôn tập tổng hợp | — | 0 | 12 | 12 | 0 | claude-audit-20260924 12 |
| Đọc hiểu truyện ngắn | — | 11 | 24 | 35 | 0 | cai-bien-de-hk1-20260929 24, dang-de-tv-20261002 11 |
| Từ, câu, dấu câu (đến bài 12) | — | 8 | 47 | 55 | 0 | cai-bien-de-hk1-20260929 47, dang-de-tv-20261002 8 |
| Chính tả theo nghĩa | — | 8 | 25 | 33 | 0 | cai-bien-de-hk1-20260929 25, dang-de-tv-20261002 8 |
| Viết đoạn văn về bạn | — | 0 | 6 | 6 | 0 | cai-bien-de-hk1-20260929 6 |
| **Tổng** | | 35 | 202 | 237 | | |

### Tiếng Anh — giai đoạn: GĐ1, GĐ2, GĐ3, GĐ4, GĐ5

| Chủ đề | Loại | GĐ1 | GĐ2 | GĐ3 | GĐ4 | GĐ5 | Chưa gắn GĐ | Tổng | Thiếu skill | Nguồn (source) |
|---|---|---|---|---|---|---|---|---|---|---|
| NIK3 Unit 1: Places & directions | — | 22 | 0 | 0 | 0 | 0 | 0 | 22 | 0 | claude-nik3-20260930 22 |
| NIK3 Unit 2: Dinosaurs & Ancient Egypt | — | 22 | 0 | 0 | 0 | 0 | 0 | 22 | 0 | claude-nik3-20260930 22 |
| Adjectives & Adverbs | — | 25 | 0 | 0 | 0 | 0 | 0 | 25 | 0 | claude-nik3-20260930 16, bo-tro-tuan6-8-20261001 9 |
| Reading: NIK3 Unit 1–2 | — | 12 | 0 | 0 | 0 | 0 | 0 | 12 | 0 | claude-nik3-20260930 12 |
| Global Success 3 (tập 1) | — | 20 | 0 | 0 | 0 | 0 | 0 | 20 | 0 | claude-global-success-20260930 20 |
| At School | — | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 0 | claude-audit-20260924 16 |
| My Family | — | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 0 | claude-audit-20260924 16 |
| Daily Activities | — | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 0 | claude-audit-20260924 16 |
| Vocabulary | — | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 0 | claude-audit-20260924 16 |
| Grammar | — | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 0 | claude-audit-20260924 16 |
| Reading | — | 12 | 0 | 0 | 0 | 0 | 0 | 12 | 0 | claude-audit-20260924 12 |
| Ôn tập tổng hợp | — | 12 | 0 | 0 | 0 | 0 | 0 | 12 | 0 | claude-audit-20260924 12 |
| **Tổng** | | 205 | 0 | 0 | 0 | 0 | 0 | 205 | | |

### Toán Tiếng Anh — CHƯA chia giai đoạn

| Chủ đề | Loại | Có nhãn GĐ (bị bỏ qua) | Chưa gắn GĐ | Tổng | Thiếu skill | Nguồn (source) |
|---|---|---|---|---|---|---|
| Numbers | — | 0 | 14 | 14 | 0 | claude-audit-20260924 14 |
| Operations (+ - × :) | — | 0 | 16 | 16 | 0 | claude-audit-20260924 16 |
| Fractions | — | 0 | 8 | 8 | 0 | claude-audit-20260924 8 |
| Geometry | — | 0 | 8 | 8 | 0 | claude-audit-20260924 8 |
| Measurement | — | 0 | 10 | 10 | 0 | claude-audit-20260924 10 |
| Word Problems | — | 0 | 10 | 10 | 0 | claude-audit-20260924 10 |
| Ôn tập tổng hợp | — | 0 | 8 | 8 | 0 | claude-audit-20260924 8 |
| **Tổng** | | 0 | 74 | 74 | | |
