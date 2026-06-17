# Dữ liệu Lớp 3 — Cấu trúc & Quy ước

## Sơ đồ thư mục

```
data-lop3/
├── manifest.json          # Danh sách 4 môn, trỏ tới index từng môn
├── CHANGELOG.md           # Lịch sử thêm/sửa câu
├── toan/
│   ├── index.json         # Danh sách chủ đề của môn + số câu mỗi chủ đề
│   ├── so-den-100000.json # 1 file = 1 chủ đề
│   ├── phan-so-don-gian.json
│   └── ...
├── tieng-viet/
│   ├── index.json
│   └── ...
├── tieng-anh/
│   ├── index.json
│   └── ...   (tên unit còn là placeholder, đổi khi biết bộ sách)
└── toan-tieng-anh/
    ├── index.json
    └── ...
```

## Mỗi file chủ đề trông như thế nào

```json
{
  "topic": {
    "id": "toan_phan-so-don-gian",
    "icon": "",
    "name": "Phân số đơn giản",
    "questions": []
  }
}
```

Câu hỏi thêm vào mảng `questions`, format **giống hệt lớp 2** để app dùng lại code cũ:

```json
{
  "q": "...",
  "choices": ["...", "...", "...", "..."],
  "a": 0,
  "difficulty": 1,
  "hint": "...",
  "skill": "...",
  "unit": "phan-so-don-gian",
  "id": "toan_phan-so-don-gian_q001"
}
```

## Quy ước

- **ID**: `<prefix>_<chủ đề>_qNNN`. Prefix: Toán=`toan`, Tiếng Việt=`tv`,
  Tiếng Anh=`en`, Toán Tiếng Anh=`tta`.
- **Tách file theo chủ đề**: sửa chủ đề nào, GitHub chỉ hiện diff file đó.
- **CHANGELOG**: mỗi lần thêm câu, ghi 1 dòng vào `CHANGELOG.md`.
- **`count` trong index.json**: cập nhật lại sau mỗi lần thêm câu.

## Phạm vi chương trình (GDPT 2018, Lớp 3)

- Toán: số đến 100 000; cộng trừ trong 100 000; bảng nhân/chia đến 9;
  nhân/chia ngoài bảng; **phân số đơn giản** (mới so với lớp 2); hình học;
  đo lường; xem đồng hồ; giải toán có lời văn.
- Tiếng Việt / Tiếng Anh: chờ xác nhận bộ sách rồi đặt tên chủ đề chính thức.

## Quy trình thêm câu (Claude làm, Nam upload)

1. Đính kèm file chủ đề hiện tại (hoặc nói rõ môn/chủ đề).
2. Claude: backup → thêm câu → gán ID nối tiếp → cân bằng vị trí đáp án →
   validate trùng/lộ đáp án → cập nhật `count` + `CHANGELOG`.
3. Nam: upload file lên GitHub. Vercel tự deploy.
