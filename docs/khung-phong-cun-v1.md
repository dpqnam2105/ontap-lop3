# Khung phòng cún v1

Đợt này chỉ dựng khung dữ liệu và dùng đồ minh hoạ hiện có. Chưa có bộ hình phòng mới, kéo thả, thưởng bộ sưu tập hoặc phụ kiện trong shop. Giá, tăng trưởng, quyền nhận nuôi và KIND không đổi.

## Dữ liệu và tương thích

`js/pet-room.js` xuất `window.PetRoom`, chứa template `room-cozy-v1` và manifest vật phẩm với id cũ. Phòng dùng toạ độ 1000 × 625; template giữ kích thước cún riêng cho ba giai đoạn.

Phòng lưu dạng `{ template, slots, pos? }`. `slots` là nguồn chính. Trong thời gian tương thích, normalize cũng tạo các trường phẳng bed/rug/bowl/toy/plant/wall để bản web cũ đang mở vẫn đọc được. Mỗi giao dịch mới cập nhật lại các trường này. Đọc phòng phẳng cũ không tự ghi hồ sơ; giao dịch tiếp theo mới ghi dạng chuẩn. Test dùng chính mã pet v1 để kiểm tra một lượt ghi từ bản cũ rồi đọc lại bằng bản mới.

Id lạ, sai vị trí hoặc món chưa sở hữu trở về mặc định. Template lạ trở về room-cozy-v1. `pos` chỉ được kiểm tra và giữ lại nếu hợp lệ, chưa dùng để đặt đồ. Không sửa Storage hoặc Cloud; toàn bộ dữ liệu vẫn nằm trong profile.pet.

## Vẽ và tương tác

Mỗi slot có vị trí, kích thước, layer, điểm đứng `spot` và khả năng `does`. Hành vi ăn/ngủ/chơi/ngửi tìm slot theo khả năng; thay điểm đứng trong dữ liệu sẽ thay đường đi. Manifest có thể thay ảnh, kích thước và offset mà không đổi điểm tương tác.

Đồ dùng chung lớp depth với cún được sắp theo y chân đế. Giường có phần lưng và viền trước riêng: khi ngủ cún nằm giữa hai phần, khi đi ra trước giường cún vượt lên trước viền. Trong lúc chuyển động, depth lấy vị trí chân đang hiển thị thay vì điểm đích. RAF theo dõi depth dừng khi rời màn; giảm chuyển động vẫn được tôn trọng. Style bộ hình đã chuyển vào pet.css, không chèn style bằng JS.

## Hợp đồng hình cho bước tiếp theo

- Nền ≤1600px; mỗi món WebP cạnh dài ≤512px, chỉ tải món đang đặt.
- Giường có img và frontImg, cùng canvas/điểm neo để lắp đúng vị trí.
- Góc nhìn 3/4, ánh sáng trên trái, cùng bảng màu; lấy cún giai đoạn 1 làm chuẩn tỉ lệ.
- Hiện img/frontImg là null, dùng hình minh hoạ CSS/emoji. Chưa vẽ biến thể màu.
- Neo phụ kiện đầy đủ head/neck/back với visible/layer sẽ làm ở đợt phụ kiện; chưa coi phần này là hoàn thành.

## Kiểm tra

pet-room.test.js: chuyển phòng cũ, giao dịch, bản web cũ, id lạ, pos dự phòng, capability, offset, depth, giới hạn đi và JSON sao lưu.

pet-room.e2e.js: vị trí ăn theo template, hai lớp giường trong lúc đi, ba kích thước cún ở 360/390/430/1280px, khôi phục Cloud từ phòng phẳng và không chèn stylesheet.

Sau Claude review khung: dựng một phòng mẫu và năm món cơ bản để Nam duyệt, rồi mới làm biến thể và phụ kiện.

## Khung nhìn mobile — chốt trước khi vẽ

Viewports: wide x=0,w=1000; narrow x=140,w=720 cho màn ≤750px. Cùng sân khấu 1000×625, mobile chỉ cắt hai mép nền; không đổi dữ liệu hồ sơ. Resize không gọi visit/chào lại.

Vùng an toàn hình x=140–860: toàn bộ hộp ảnh năm món và spot nằm bên trong. Chỉ cửa sổ/tranh nền được ra ngoài. Giường tâm690 rộng330, cây tâm230 rộng160. WalkArea chân x310–690,y390–585, đủ hộp cún trưởng thành rộng320. Nền vẫn 1000×625; không vẽ đồ chức năng dính nền ngoài vùng an toàn.

Gỡ mirror ở PR riêng sau khi Nam xác nhận mọi máy đã tải bản có slots và không còn tab phiên bản cũ. Không tự bỏ theo ngày.

## Phòng mẫu đã dựng trên nhánh pet-room-art

Xem phong-cun-mau-v1.md và ảnh 390px/1280px. Món mặc định và nền đã có WebP; câu ghi img=null ở phần khung phía trên mô tả đợt trước. Wide có walkArea riêng x160–850; narrow giữ x310–690. Bộ hình mẫu chưa được merge/duyệt nên chưa thay biến thể trả sao.
