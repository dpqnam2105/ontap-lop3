# Thỏ đồng hành — bản đầu

Nhánh `rabbit-companion`, từ main `a70969c`; chờ Claude review trước merge.

## Hành vi

- Chào khi vào trang (mỗi bé/lượt mở trang); sau đó nhắc số việc còn lại tối đa một lần. Lấy đúng kế hoạch hôm nay, cùng lớp và tên chuẩn hoá như Today.
- Xong kế hoạch: “Con đã xong N việc hôm nay!” và nhảy ngắn. Ghi cờ UI trước khi diễn, không phát lại sau reload trong ngày. Cờ riêng theo bé/ngày trên máy này; không ghi hay đồng bộ dữ liệu học.
- Bấm Thỏ (có Enter/Space): luân phiên ảnh và số liệu thật của tuần/kế hoạch. Ngày đã học gồm ngày hoàn tất lượt với 0 câu đúng, giống thẻ Tuần này; không cộng ngày tương lai.
- Quiz: tho-doc-sach, đứng yên, nút disabled; hủy timer/lời đang nói. Không nối vào chấm sai.
- Bong bóng 3 giây rồi biến mất, không lặp. Chuyển tab ẩn hoặc mobile hủy hoạt ảnh/lời nói. Giảm chuyển động: không animation nhưng thời gian đọc còn nguyên.
- Desktop cao <=950px thu gọn khoảng cách/đệm thanh bên để Thỏ vừa màn 768px, không giảm cỡ chữ.
- Chỉ desktop >1100px. Không thêm lên mobile; dùng sáu WebP đã có, không sinh ảnh mới.

## Ảnh 1280px

[Chào](greet-1280.png) · [Còn hai việc](reminder-1280.png) · [Xong ba việc](celebrate-1280.png)

Ảnh sidebar 1280px và màn thấp 768px; tổng dưới 400KB. [Desktop 768px](desktop-768.png). Test mặc định xuất ảnh vào tests/out/companion (gitignore); chỉ COMPANION_SHOTS=docs mới ghi vào docs.

## Kiểm thử

- `tests/companion.e2e.js`: chế độ thường/giảm chuyển động, dwell thật 3 giây, nhắc một lần, số liệu câu đúng/ngày học, quiz yên lặng + hủy callback, ăn mừng một lần/reload, bé khác/ngày khác, Cloud snapshot không đổi, hidden mobile, desktop thấp 768px.
- Máy Codex dùng Edge qua PET_BROWSER_CHANNEL=msedge. Chromium mặc định vẫn giữ cho máy có Playwright bundled.
- 12 bộ Node đạt. E2E en-books, pet, pet-reduced-motion và layout-regression đạt trên Edge. Home: ca 360px vẫn lỗi sẵn 676/669 như main (đã ghi ở PR #10); chạy riêng các nhóm còn lại đều đạt, không nới assert trong test gốc.

Không thêm nút học, không cộng thưởng, không sửa các trạng thái/nguồn số liệu hiện có. Cờ UI không cần đưa vào sao lưu vì không phải thành tích học.
