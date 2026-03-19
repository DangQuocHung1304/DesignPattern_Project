# MÔ TẢ HỆ THỐNG PHÒNG KHÁM "HEALTHY SYSTEM"

## I. TỔNG QUAN HỆ THỐNG

### 1.1. Giới thiệu chung
**Tên dự án**: Hệ thống Quản lý Phòng khám Tư nhân "Healthy System"

**Mục đích**: Xây dựng hệ thống quản lý toàn diện cho phòng khám tư nhân, hỗ trợ:
- Bệnh nhân đặt lịch khám trực tuyến và quản lý thông tin sức khỏe
- Nhân viên y tế và quản lý điều hành các hoạt động phòng khám
- Tự động hóa quy trình khám bệnh, xét nghiệm, thanh toán

**Nền tảng**: 
- Web Application (cho nhân viên và bệnh nhân)
- Web Application (cho nhân viên và bệnh nhân)
- RESTful API Backend (ASP.NET Core)

### 1.2. Phạm vi hệ thống
Hệ thống quản lý đầy đầu quy trình khám chữa bệnh từ đặt lịch, khám bệnh, xét nghiệm, kê đơn thuốc, thanh toán, đến quản lý nhân sự và báo cáo tài chính.

---

## II. CÁC ACTOR TRONG HỆ THỐNG

### 2.1. Bệnh nhân (Patient) - Actor chính

**Mô tả**: Người đến khám bệnh tại phòng khám, có thể đăng ký tài khoản để quản lý thông tin sức khỏe cá nhân.

**Các chức năng (Use Cases)**:

#### 2.1.1. Quản lý tài khoản
- **UC-01**: Đăng ký tài khoản mới
  - Input: Email, số điện thoại, họ tên, ngày sinh, giới tính, địa chỉ
  - Output: Tài khoản được tạo với mã bệnh nhân (Medical Record Number)
  - Quy định: Email và số điện thoại phải duy nhất

- **UC-02**: Đăng nhập vào hệ thống
  - Input: Email/Số điện thoại + Mật khẩu
  - Output: Truy cập vào trang cá nhân
  - Quy định: Tài khoản phải được kích hoạt (status = active)

- **UC-03**: Cập nhật thông tin cá nhân
  - Có thể thay đổi: Địa chỉ, số điện thoại, thông tin dị ứng, nhóm máu
  - Không thể thay đổi: Email (dùng làm định danh)

#### 2.1.2. Quản lý lịch hẹn
- **UC-04**: Đặt lịch khám trực tuyến
  - Bước 1: Chọn bác sĩ (theo chuyên khoa hoặc tìm kiếm)
  - Bước 2: Chọn ngày và giờ khám (dựa trên lịch làm việc của bác sĩ)
  - Bước 3: Điền lý do khám, triệu chứng
  - Bước 4: Xác nhận đặt lịch
  - Output: Mã lịch hẹn, thông báo xác nhận
  - **Quy định**: 
    - Chỉ đặt được lịch trong giờ làm việc của bác sĩ
    - Mỗi ca khám có giới hạn số lượng bệnh nhân (max_appointments_per_slot)
    - Thời gian khám tối thiểu 30 phút

- **UC-05**: Xem danh sách lịch hẹn
  - Hiển thị: Lịch hẹn sắp tới, lịch sử đã khám
  - Trạng thái: Chờ khám, Đang khám, Hoàn thành, Đã hủy

- **UC-06**: Thay đổi lịch hẹn
  - **Quy định**: Chỉ được thay đổi trước giờ khám ít nhất 2 tiếng
  - Có thể thay đổi: Ngày, giờ khám
  - Lưu lịch sử thay đổi vào appointment_history

- **UC-07**: Hủy lịch hẹn
  - **Quy định**: Chỉ được hủy trước giờ khám ít nhất 2 tiếng
  - Lý do hủy được ghi nhận
  - Trạng thái chuyển sang "cancelled"

#### 2.1.3. Xem thông tin y tế
- **UC-08**: Xem lịch sử khám bệnh
  - Hiển thị: Ngày khám, bác sĩ, chẩn đoán, đơn thuốc, kết quả xét nghiệm
  - Có thể lọc theo: Thời gian, bác sĩ, chuyên khoa

- **UC-09**: Xem kết quả xét nghiệm
  - Hiển thị: Loại xét nghiệm, kết quả, chỉ số, nhận xét
  - Trạng thái: Chờ xét nghiệm, Đang xử lý, Hoàn thành

- **UC-10**: Xem đơn thuốc
  - Hiển thị: Tên thuốc, liều lượng, cách dùng, thời gian dùng
  - Có thể in đơn thuốc

#### 2.1.4. Đánh giá dịch vụ
- **UC-11**: Đánh giá bác sĩ
  - Input: Điểm số (1-5 sao), nhận xét
  - **Quy định**: Chỉ đánh giá được sau khi hoàn thành lịch khám
  - Một bệnh nhân chỉ đánh giá 1 lần cho mỗi lần khám

- **UC-12**: Đánh giá dịch vụ phòng khám
  - Input: Điểm số (1-5 sao), nhận xét về dịch vụ
  - Các tiêu chí: Chất lượng khám, thái độ nhân viên, cơ sở vật chất

#### 2.1.5. Khác
- **UC-13**: Xem thông tin phòng khám
  - Giới thiệu phòng khám, chuyên khoa, trang thiết bị
  - Thông tin liên hệ, giờ làm việc

- **UC-14**: Tìm kiếm bác sĩ
  - Tìm theo: Tên, chuyên khoa, đánh giá
  - Xem hồ sơ bác sĩ: Học vấn, kinh nghiệm, đánh giá

---

### 2.2. Bác sĩ (Doctor) - Actor chính

**Mô tả**: Bác sĩ thực hiện khám bệnh, chẩn đoán, kê đơn thuốc và yêu cầu xét nghiệm cho bệnh nhân.

**Các chức năng (Use Cases)**:

#### 2.2.1. Quản lý hồ sơ cá nhân
- **UC-15**: Cập nhật thông tin cá nhân
  - Có thể cập nhật: Số điện thoại, địa chỉ, ảnh đại diện
  - Thông tin học vấn: Bằng cấp, chứng chỉ, chuyên môn

- **UC-16**: Xem lịch làm việc của mình
  - Hiển thị: Lịch làm việc tuần (do Admin thiết lập)
  - Thống kê: Số ngày làm việc, tổng giờ, số ca khám
  - **Lưu ý**: Bác sĩ chỉ XEM, không tự chỉnh sửa lịch

#### 2.2.2. Quản lý lịch hẹn
- **UC-17**: Xem danh sách lịch hẹn
  - Lọc theo: Ngày, trạng thái, loại khám
  - Hiển thị: Thông tin bệnh nhân, lý do khám, giờ hẹn

- **UC-18**: Thay đổi lịch hẹn bệnh nhân
  - Trường hợp: Bác sĩ bận đột xuất, cần dời lịch
  - Hệ thống tự động thông báo cho bệnh nhân

- **UC-19**: Hủy lịch hẹn
  - Yêu cầu nhập lý do hủy
  - Hệ thống thông báo cho bệnh nhân và tiếp tân

#### 2.2.3. Khám bệnh và điều trị
- **UC-20**: Xem thông tin bệnh nhân
  - Thông tin cơ bản: Họ tên, tuổi, giới tính, dị ứng
  - Lịch sử khám bệnh: Các lần khám trước, chẩn đoán, thuốc đã dùng
  - Kết quả xét nghiệm trước đó

- **UC-21**: Tạo phiếu khám bệnh (Encounter)
  - Input: Triệu chứng, chẩn đoán sơ bộ, cân nặng, chiều cao, huyết áp, nhiệt độ
  - Ghi chú: Diễn biến bệnh, kế hoạch điều trị
  - Trạng thái: In Progress → Completed

- **UC-22**: Yêu cầu xét nghiệm
  - Các loại: Xét nghiệm máu, nước tiểu, X-quang, siêu âm, CT, MRI
  - Mỗi yêu cầu bao gồm:
    - Loại xét nghiệm
    - Ghi chú cho kỹ thuật viên
    - Độ ưu tiên (Normal, Urgent, Critical)
  - **Biểu mẫu**: Lab Request Form / Imaging Request Form

- **UC-23**: Xem kết quả xét nghiệm
  - Kết quả được cập nhật bởi Bác sĩ Xét nghiệm
  - Xem file đính kèm (ảnh X-quang, siêu âm...)
  - Thêm nhận xét về kết quả

- **UC-24**: Kê đơn thuốc (Prescription)
  - Input: 
    - Tên thuốc, liều lượng, đường dùng
    - Số lượng, tần suất dùng
    - Ghi chú (uống trước/sau ăn, lưu ý...)
  - **Biểu mẫu**: Prescription Form (Đơn thuốc)
  - **Quy định**: 
    - Phải có chẩn đoán trước khi kê đơn
    - Kiểm tra dị ứng thuốc của bệnh nhân
    - Ghi rõ liều lượng và cách dùng

- **UC-25**: Lập phác đồ điều trị
  - Tạo treatment plan với nhiều treatment items
  - Mỗi item: Tên điều trị, mô tả, thời gian, chi phí
  - Theo dõi tiến độ điều trị

#### 2.2.4. Quản lý bệnh nhân walk-in
- **UC-26**: Khám bệnh nhân không hẹn trước
  - Bệnh nhân đến trực tiếp, do Tiếp tân tạo hồ sơ tạm
  - Quy trình khám giống bệnh nhân đã đăng ký

#### 2.2.5. Thống kê và báo cáo
- **UC-27**: Xem thống kê cá nhân
  - Số lượng bệnh nhân đã khám
  - Đánh giá trung bình từ bệnh nhân
  - Doanh thu tạo ra (cho tính lương)

---

### 2.3. Nhân viên Tiếp tân (Receptionist) - Actor phụ trợ

**Mô tả**: Tiếp đón bệnh nhân, quản lý lịch hẹn, tạo hồ sơ bệnh nhân mới.

**Các chức năng (Use Cases)**:

#### 2.3.1. Quản lý lịch hẹn
- **UC-28**: Xem danh sách lịch hẹn
  - Lọc theo: Ngày, bác sĩ, trạng thái
  - Hiển thị: Lịch hẹn online và lịch hẹn tại quầy

- **UC-29**: Đặt lịch hẹn cho bệnh nhân
  - Trường hợp: Bệnh nhân gọi điện hoặc đến trực tiếp
  - Chọn bác sĩ, ngày giờ khám
  - Xác nhận và in phiếu hẹn

- **UC-30**: Thay đổi/Hủy lịch hẹn
  - Theo yêu cầu của bệnh nhân hoặc bác sĩ
  - Ghi rõ lý do thay đổi/hủy

- **UC-31**: Xác nhận lịch hẹn
  - Khi bệnh nhân đến phòng khám
  - Chuyển trạng thái từ "Scheduled" → "Checked-in"

#### 2.3.2. Quản lý bệnh nhân walk-in
- **UC-32**: Tạo hồ sơ bệnh nhân walk-in
  - Input: Họ tên, số điện thoại, ngày sinh, giới tính
  - Tạo mã hồ sơ tạm (Walk-in ID)
  - **Biểu mẫu**: Walk-in Patient Registration Form

- **UC-33**: Chuyển đổi walk-in thành bệnh nhân chính thức
  - Sau khi bệnh nhân đăng ký tài khoản
  - Liên kết hồ sơ walk-in với tài khoản

#### 2.3.3. Liên lạc và thông báo
- **UC-34**: Liên hệ bệnh nhân
  - Gọi điện xác nhận lịch hẹn
  - Thông báo thay đổi lịch
  - Nhắc lịch trước giờ khám

---

### 2.4. Bác sĩ Xét nghiệm / Kỹ thuật viên (Lab Technician) - Actor phụ trợ

**Mô tả**: Thực hiện xét nghiệm và cập nhật kết quả theo yêu cầu của bác sĩ.

**Các chức năng (Use Cases)**:

#### 2.4.1. Quản lý yêu cầu xét nghiệm
- **UC-35**: Xem danh sách yêu cầu xét nghiệm
  - Lọc theo: Trạng thái (Pending, In Progress, Completed)
  - Độ ưu tiên (Normal, Urgent, Critical)
  - Loại xét nghiệm (Lab Test, Imaging)

- **UC-36**: Nhận yêu cầu xét nghiệm
  - Chuyển trạng thái từ "Pending" → "In Progress"
  - Xem thông tin bệnh nhân và ghi chú từ bác sĩ

#### 2.4.2. Cập nhật kết quả
- **UC-37**: Nhập kết quả xét nghiệm
  - Input: 
    - Kết quả các chỉ số (theo loại xét nghiệm)
    - File đính kèm (ảnh X-quang, siêu âm)
    - Nhận xét của kỹ thuật viên
  - **Biểu mẫu**: Lab Result Form / Imaging Result Form
  - **Quy định**:
    - Kết quả phải đầy đủ theo template
    - Đính kèm đơn vị đo lường
    - Đánh dấu nếu kết quả bất thường

- **UC-38**: Hoàn thành xét nghiệm
  - Chuyển trạng thái "In Progress" → "Completed"
  - Hệ thống tự động thông báo cho bác sĩ
  - Bệnh nhân có thể xem kết quả

#### 2.4.3. Tìm kiếm và thống kê
- **UC-39**: Tìm kiếm yêu cầu xét nghiệm
  - Tìm theo: Tên bệnh nhân, bác sĩ yêu cầu, ngày
  - Xem lịch sử xét nghiệm của bệnh nhân

- **UC-40**: Xem thống kê công việc
  - Số lượng xét nghiệm đã thực hiện
  - Thời gian xử lý trung bình
  - Xét nghiệm đang chờ xử lý

---

### 2.5. Nhân viên Kế toán (Accountant) - Actor quản lý

**Mô tả**: Quản lý tài chính, tính toán chi phí khám bệnh, thanh toán và lương nhân viên.

**Các chức năng (Use Cases)**:

#### 2.5.1. Quản lý hóa đơn và thanh toán
- **UC-41**: Tạo hóa đơn cho bệnh nhân
  - Tự động tính toán:
    - Phí khám bệnh (theo dịch vụ)
    - Phí xét nghiệm
    - Phí thuốc
    - Phí điều trị
  - **Biểu mẫu**: Invoice (Hóa đơn thanh toán)
  - **Quy định**:
    - Mỗi encounter có 1 hóa đơn
    - Giá dịch vụ lấy từ bảng services
    - Áp dụng thuế VAT nếu có

- **UC-42**: Xuất bảng chi phí khám bệnh
  - Lọc theo: Khoảng thời gian, bệnh nhân, bác sĩ
  - Hiển thị: Chi tiết từng khoản phí, tổng chi phí
  - Export: Excel, PDF
  - **Biểu mẫu**: Medical Cost Report

- **UC-43**: Theo dõi thanh toán
  - Trạng thái: Chưa thanh toán, Đã thanh toán, Thanh toán một phần
  - Phương thức: Tiền mặt, Chuyển khoản, Thẻ
  - Lưu lịch sử thanh toán

#### 2.5.2. Quản lý lương nhân viên
- **UC-44**: Tính lương cho nhân viên
  - Input: Tháng/năm cần tính lương
  - Công thức tính:
    - **Bác sĩ**: Lương cơ bản + % doanh thu từ bệnh nhân khám
    - **Nhân viên khác**: Lương cố định theo hợp đồng
  - **Biểu mẫu**: Salary Report (Bảng lương)
  - **Quy định**:
    - Lương bác sĩ = Base salary + (Total revenue × Commission %)
    - Commission % mặc định: 15-30% tùy chuyên khoa
    - Tính theo số buổi làm việc thực tế

- **UC-45**: Xuất bảng lương
  - Lọc theo: Tháng, nhân viên, phòng ban
  - Hiển thị: Lương cơ bản, hoa hồng, thưởng, tổng lương
  - Export Excel, PDF

#### 2.5.3. Báo cáo tài chính
- **UC-46**: Xem báo cáo doanh thu
  - Theo ngày, tuần, tháng, năm
  - Biểu đồ: Doanh thu theo thời gian, theo dịch vụ
  - So sánh với kỳ trước

- **UC-47**: Xem báo cáo chi phí
  - Chi phí nhân sự (lương)
  - Chi phí vận hành
  - Chi phí thuốc và vật tư y tế

- **UC-48**: Tính chi phí khám chữa bệnh trung bình
  - Theo chuyên khoa
  - Theo loại bệnh
  - Theo bác sĩ

---

### 2.6. Quản trị viên Hệ thống (System Admin) - Actor quản lý

**Mô tả**: Quản lý toàn bộ hệ thống, người dùng, lịch làm việc và cấu hình.

**Các chức năng (Use Cases)**:

#### 2.6.1. Quản lý người dùng
- **UC-49**: Xem danh sách người dùng
  - Lọc theo: Vai trò, trạng thái (Active/Inactive)
  - Tìm kiếm theo tên, email, số điện thoại

- **UC-50**: Kích hoạt/Vô hiệu hóa tài khoản
  - Kích hoạt: Cho phép người dùng đăng nhập
  - Vô hiệu hóa: Khóa tài khoản (không xóa dữ liệu)
  - **Quy định**: Không được xóa tài khoản có dữ liệu liên quan

- **UC-51**: Tạo tài khoản nhân viên
  - Tạo tài khoản cho: Bác sĩ, Tiếp tân, Kỹ thuật viên, Kế toán
  - Gán vai trò (role): doctor, reception, lab, accountant, admin

#### 2.6.2. Quản lý lịch làm việc bác sĩ
- **UC-52**: Tạo lịch làm việc cho bác sĩ
  - Input:
    - Chọn bác sĩ
    - Chọn thứ trong tuần (Thứ 2 - Chủ nhật)
    - Giờ bắt đầu, giờ kết thúc
    - Số lượng bệnh nhân tối đa/ca
  - **Quy định**:
    - Lịch làm việc theo tuần (recurring weekly)
    - Không được trùng lặp thời gian
    - Mỗi ca tối thiểu 30 phút
    - Giờ bắt đầu < Giờ kết thúc

- **UC-53**: Sửa/Xóa lịch làm việc
  - Có thể: Thay đổi giờ, tạm dừng, xóa lịch
  - Hệ thống tự động cập nhật lịch hẹn của bệnh nhân

- **UC-54**: Xem lịch làm việc tổng quan
  - Hiển thị lịch của tất cả bác sĩ
  - Lọc theo: Bác sĩ, ngày, trạng thái

#### 2.6.3. Thông báo và nhắc lịch
- **UC-55**: Gửi nhắc lịch hẹn tự động
  - Tìm kiếm lịch hẹn trong khoảng thời gian (1h, 4h, 24h, 48h)
  - Tạo thông báo cho bệnh nhân
  - Gửi qua: Email, SMS, In-app notification
  - **Quy định**:
    - Nhắc trước 24 giờ: Bắt buộc
    - Nhắc trước 2 giờ: Tùy chọn
    - Lưu lịch sử gửi thông báo

- **UC-56**: Gửi thông báo hàng loạt
  - Chọn nhiều bệnh nhân
  - Nội dung tùy chỉnh
  - Theo dõi trạng thái gửi

#### 2.6.4. In ấn và báo cáo
- **UC-57**: In lịch sử thông tin bệnh nhân
  - Chọn bệnh nhân
  - Hiển thị: Thông tin cá nhân, lịch sử khám, xét nghiệm, đơn thuốc
  - **Biểu mẫu**: Patient Medical History Report
  - Format: A4, có logo phòng khám
  - Thống kê: Tổng số lần khám, lần đầu, lần cuối

- **UC-58**: Xuất báo cáo tổng hợp
  - Báo cáo hoạt động phòng khám
  - Thống kê theo ngày, tuần, tháng

#### 2.6.5. Cấu hình hệ thống
- **UC-59**: Quản lý dịch vụ và giá
  - Thêm/Sửa/Xóa dịch vụ khám
  - Cập nhật giá dịch vụ
  - **Quy định**: Giá dịch vụ > 0

- **UC-60**: Quản lý chuyên khoa
  - Thêm/Sửa/Xóa chuyên khoa
  - Gán bác sĩ vào chuyên khoa

---

## III. SƠ ĐỒ USE CASE

### 3.1. Sơ đồ Use Case Tổng quát

```
                    HỆ THỐNG PHÒNG KHÁM HEALTHY SYSTEM
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   [Bệnh nhân]                    [Hệ thống]                          │
│       │                                                               │
│       ├─ Đăng ký/Đăng nhập                                          │
│       ├─ Đặt lịch khám                                              │
│       ├─ Quản lý lịch hẹn                                           │
│       ├─ Xem thông tin y tế                                         │
│       └─ Đánh giá dịch vụ                                           │
│                                                                       │
│   [Bác sĩ]                                                           │
│       │                                                               │
│       ├─ Quản lý lịch hẹn                                           │
│       ├─ Khám bệnh                                                   │
│       ├─ Yêu cầu xét nghiệm                                         │
│       ├─ Kê đơn thuốc                                               │
│       └─ Lập phác đồ điều trị                                       │
│                                                                       │
│   [Tiếp tân]                                                         │
│       │                                                               │
│       ├─ Quản lý lịch hẹn                                           │
│       ├─ Đăng ký bệnh nhân walk-in                                  │
│       └─ Xác nhận lịch hẹn                                          │
│                                                                       │
│   [Bác sĩ XN]                                                        │
│       │                                                               │
│       ├─ Nhận yêu cầu xét nghiệm                                    │
│       ├─ Cập nhật kết quả                                           │
│       └─ Hoàn thành xét nghiệm                                      │
│                                                                       │
│   [Kế toán]                                                          │
│       │                                                               │
│       ├─ Tạo hóa đơn                                                │
│       ├─ Tính lương nhân viên                                       │
│       └─ Xuất báo cáo tài chính                                     │
│                                                                       │
│   [Admin]                                                            │
│       │                                                               │
│       ├─ Quản lý người dùng                                         │
│       ├─ Quản lý lịch làm việc BS                                  │
│       ├─ Gửi nhắc lịch                                              │
│       └─ In báo cáo                                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2. Use Case Package Diagram

**Package 1: Patient Management**
- UC-01 đến UC-14 (Chức năng bệnh nhân)

**Package 2: Doctor Management**
- UC-15 đến UC-27 (Chức năng bác sĩ)

**Package 3: Reception Management**
- UC-28 đến UC-34 (Chức năng tiếp tân)

**Package 4: Laboratory Management**
- UC-35 đến UC-40 (Chức năng xét nghiệm)

**Package 5: Financial Management**
- UC-41 đến UC-48 (Chức năng kế toán)

**Package 6: System Administration**
- UC-49 đến UC-60 (Chức năng quản trị)

---

## IV. CÁC BIỂU MẪU VÀ TÀI LIỆU

### 4.1. Biểu mẫu cho Bệnh nhân

**1. Phiếu đăng ký khám bệnh (Appointment Form)**
- Mã lịch hẹn
- Thông tin bệnh nhân: Họ tên, tuổi, giới tính, SĐT
- Bác sĩ khám
- Ngày giờ khám
- Lý do khám, triệu chứng
- Trạng thái lịch hẹn

**2. Phiếu khám bệnh (Medical Examination Form)**
- Mã phiếu khám
- Thông tin bệnh nhân
- Bác sĩ khám
- Ngày khám
- Triệu chứng, chẩn đoán
- Chỉ số sinh tồn: Cân nặng, chiều cao, huyết áp, nhiệt độ, nhịp tim
- Kết luận và hướng điều trị

**3. Đơn thuốc (Prescription)**
- Mã đơn thuốc
- Thông tin bệnh nhân
- Bác sĩ kê đơn
- Ngày kê đơn
- Danh sách thuốc:
  - Tên thuốc
  - Liều lượng
  - Đường dùng (uống, tiêm, bôi...)
  - Số lượng
  - Cách dùng (sáng/trưa/tối, trước/sau ăn)
  - Thời gian dùng
- Lời dặn của bác sĩ
- Chữ ký bác sĩ

**4. Phiếu yêu cầu xét nghiệm (Lab Request Form)**
- Mã yêu cầu
- Thông tin bệnh nhân
- Bác sĩ yêu cầu
- Ngày yêu cầu
- Loại xét nghiệm:
  - Xét nghiệm máu (CBC, glucose, ...)
  - Xét nghiệm nước tiểu
  - Xét nghiệm sinh hóa
  - Xét nghiệm vi sinh
- Ghi chú đặc biệt
- Độ ưu tiên

**5. Kết quả xét nghiệm (Lab Result Form)**
- Mã kết quả
- Thông tin bệnh nhân
- Loại xét nghiệm
- Ngày thực hiện
- Kết quả các chỉ số:
  - Tên chỉ số
  - Kết quả
  - Đơn vị
  - Giá trị bình thường
  - Đánh dấu bất thường
- Nhận xét của kỹ thuật viên
- Người thực hiện

**6. Hóa đơn thanh toán (Invoice)**
- Mã hóa đơn
- Thông tin bệnh nhân
- Ngày lập
- Chi tiết các khoản phí:
  - Phí khám bệnh
  - Phí xét nghiệm (từng loại)
  - Phí thuốc (từng loại)
  - Phí điều trị
  - Phí khác
- Tổng cộng
- Đã thanh toán / Còn nợ
- Phương thức thanh toán
- Người thu

### 4.2. Biểu mẫu cho Bác sĩ

**7. Bệnh án điện tử (Electronic Medical Record - EMR)**
- Mã bệnh án
- Thông tin bệnh nhân đầy đủ
- Lịch sử khám bệnh:
  - Ngày khám
  - Bác sĩ
  - Chẩn đoán
  - Điều trị
- Tiền sử bệnh:
  - Bệnh mãn tính
  - Tiền sử dị ứng
  - Tiền sử phẫu thuật
- Kết quả xét nghiệm
- Hình ảnh chụp chiếu
- Đơn thuốc đã kê
- Diễn biến bệnh

**8. Phác đồ điều trị (Treatment Plan)**
- Mã phác đồ
- Chẩn đoán
- Mục tiêu điều trị
- Các bước điều trị:
  - Tên bước
  - Mô tả
  - Thời gian dự kiến
  - Chi phí ước tính
- Thuốc sử dụng
- Lịch tái khám
- Theo dõi tiến độ

**9. Giấy chứng nhận khám sức khỏe (Health Certificate)**
- Thông tin bệnh nhân
- Mục đích khám
- Kết quả khám:
  - Chiều cao, cân nặng
  - Huyết áp, nhịp tim
  - Thị lực, thính lực
  - Các bộ phận khác
- Kết luận: Đủ sức khỏe / Không đủ sức khỏe
- Bác sĩ khám, ngày khám

### 4.3. Biểu mẫu cho Kế toán

**10. Bảng kê chi phí khám bệnh (Medical Cost Report)**
- Thời gian: Từ ngày ... đến ngày ...
- Lọc theo: Bệnh nhân, Bác sĩ, Loại dịch vụ
- Bảng chi tiết:
  - Mã hóa đơn
  - Bệnh nhân
  - Ngày khám
  - Phí khám
  - Phí xét nghiệm
  - Phí thuốc
  - Tổng cộng
- Tổng doanh thu
- Đã thu / Chưa thu

**11. Bảng lương nhân viên (Salary Report)**
- Tháng/Năm
- Danh sách nhân viên:
  - Họ tên
  - Chức vụ
  - Lương cơ bản
  - Phụ cấp
  - Hoa hồng (bác sĩ)
  - Thưởng
  - Khấu trừ
  - Thực lĩnh
- Tổng chi phí nhân sự

**12. Báo cáo doanh thu (Revenue Report)**
- Khoảng thời gian
- Doanh thu theo:
  - Dịch vụ (khám bệnh, xét nghiệm, ...)
  - Chuyên khoa
  - Bác sĩ
- Biểu đồ xu hướng
- So sánh với kỳ trước

**13. Báo cáo chi phí (Expense Report)**
- Khoảng thời gian
- Chi phí theo:
  - Nhân sự (lương)
  - Vật tư y tế
  - Thuốc
  - Vận hành (điện, nước, ...)
  - Khác
- Tổng chi phí
- Lợi nhuận = Doanh thu - Chi phí

### 4.4. Biểu mẫu cho Quản trị

**14. Báo cáo lịch sử bệnh nhân (Patient History Report)**
- Thông tin bệnh nhân đầy đủ
- Thống kê:
  - Tổng số lần khám
  - Lần khám đầu tiên
  - Lần khám gần nhất
- Lịch sử khám bệnh chi tiết (theo thời gian)
- Tất cả xét nghiệm
- Tất cả đơn thuốc
- Tất cả hóa đơn
- Format in A4

**15. Lịch làm việc bác sĩ (Doctor Schedule)**
- Họ tên bác sĩ
- Chuyên khoa
- Lịch làm việc tuần:
  - Thứ 2: 8:00-12:00, 13:00-17:00
  - Thứ 3: 8:00-12:00, 13:00-17:00
  - ...
- Số lượng bệnh nhân/ca
- Trạng thái (Hoạt động/Tạm dừng)

**16. Thông báo nhắc lịch (Appointment Reminder)**
- Kính gửi: [Tên bệnh nhân]
- Lịch hẹn khám bệnh:
  - Thời gian: [Ngày] lúc [Giờ]
  - Bác sĩ: [Tên bác sĩ]
  - Chuyên khoa: [Tên chuyên khoa]
  - Phòng khám: Healthy System
  - Địa chỉ: [Địa chỉ]
- Lưu ý: Vui lòng đến đúng giờ. Nếu không thể đến, vui lòng hủy lịch trước 2 giờ.
- Liên hệ: [SĐT] - [Email]

---

## V. QUY ĐỊNH VÀ CHÍNH SÁCH PHÒNG KHÁM

### 5.1. Quy định về Đặt lịch và Hủy lịch

**5.1.1. Đặt lịch khám**
1. **Thời gian đặt lịch**: 
   - Đặt trước tối thiểu 2 giờ
   - Đặt trước tối đa 30 ngày

2. **Giới hạn đặt lịch**:
   - Mỗi bệnh nhân: Tối đa 3 lịch hẹn đang chờ
   - Mỗi ca khám: Giới hạn số lượng bệnh nhân (do Admin thiết lập)

3. **Xác nhận lịch hẹn**:
   - Hệ thống tự động gửi xác nhận qua Email/SMS
   - Bệnh nhân phải đến trước giờ hẹn 15 phút để check-in

**5.1.2. Thay đổi lịch hẹn**
1. Chỉ được thay đổi **trước giờ khám ít nhất 2 giờ**
2. Tối đa thay đổi **2 lần** cho mỗi lịch hẹn
3. Hệ thống lưu lịch sử thay đổi

**5.1.3. Hủy lịch hẹn**
1. Hủy miễn phí: **Trước giờ khám ít nhất 2 giờ**
2. Hủy muộn (trong vòng 2 giờ): **Không được hoàn phí** (nếu đã thanh toán trước)
3. No-show (không đến không báo): **Khóa đặt lịch online 7 ngày**

### 5.2. Quy định về Khám bệnh

**5.2.1. Thời gian khám**
- Mỗi lượt khám: **30 phút** (mặc định)
- Khám phức tạp: **45-60 phút** (theo yêu cầu bác sĩ)
- Giờ làm việc: **8:00 - 12:00**, **13:00 - 17:00** (Thứ 2 - Thứ 6)
- Thứ 7, Chủ nhật: Theo lịch của từng bác sĩ

**5.2.2. Quy trình khám bệnh**
1. **Check-in tại quầy tiếp tân** (15 phút trước giờ hẹn)
2. **Chờ gọi tên** tại phòng chờ
3. **Vào phòng khám**: Bác sĩ khám bệnh, chẩn đoán
4. **Yêu cầu xét nghiệm** (nếu cần): Lấy mẫu tại phòng xét nghiệm
5. **Nhận kết quả** và tái khám
6. **Kê đơn thuốc** và hướng dẫn điều trị
7. **Thanh toán** tại quầy thu ngân
8. **Nhận thuốc** tại quầy thuốc (nếu có)

**5.2.3. Bệnh nhân Walk-in**
- Được phục vụ khi bác sĩ có thời gian trống
- Ưu tiên bệnh nhân đã đặt lịch trước
- Có thể phải chờ lâu hơn

### 5.3. Quy định về Xét nghiệm

**5.3.1. Thời gian xử lý**
- Xét nghiệm máu, nước tiểu: **2-4 giờ**
- Xét nghiệm vi sinh: **24-48 giờ**
- X-quang, siêu âm: **1-2 giờ**
- CT, MRI: **Trong ngày** (nếu có lịch)

**5.3.2. Độ ưu tiên**
1. **Critical (Cấp cứu)**: Xử lý ngay lập tức
2. **Urgent (Khẩn)**: Xử lý trong 1 giờ
3. **Normal (Thường)**: Xử lý theo thứ tự

**5.3.3. Nhận kết quả**
- Tại quầy tiếp tân: Sau khi có kết quả
- Online: Xem trên tài khoản cá nhân
- Email: Tự động gửi khi hoàn thành

### 5.4. Quy định về Thanh toán

**5.4.1. Phương thức thanh toán**
- Tiền mặt
- Chuyển khoản ngân hàng
- Thẻ tín dụng/ghi nợ
- Ví điện tử (Momo, ZaloPay, ...)

**5.4.2. Thời điểm thanh toán**
- **Thanh toán sau**: Khi hoàn thành khám (mặc định)
- **Thanh toán trước**: Khi đặt lịch online (tùy chọn)
- **Thanh toán theo đợt**: Với điều trị dài ngày

**5.4.3. Hoàn tiền**
- Hủy lịch đúng quy định: **Hoàn 100%** (nếu đã thanh toán trước)
- Hủy muộn: **Không hoàn**
- Lỗi hệ thống: **Hoàn 100%** + bồi thường

**5.4.4. Giá dịch vụ**
| Loại dịch vụ | Giá (VNĐ) |
|-------------|----------|
| Khám bệnh tổng quát | 200,000 - 300,000 |
| Khám chuyên khoa | 300,000 - 500,000 |
| Xét nghiệm máu cơ bản | 150,000 - 300,000 |
| X-quang | 200,000 - 400,000 |
| Siêu âm | 250,000 - 500,000 |
| CT Scan | 1,500,000 - 3,000,000 |
| MRI | 3,000,000 - 5,000,000 |

*Lưu ý: Giá có thể thay đổi theo thời gian*

### 5.5. Quy định về Lương và Hoa hồng

**5.5.1. Lương Bác sĩ**
- **Công thức**: `Lương = Lương cơ bản + (Doanh thu × Hoa hồng %)`
- **Lương cơ bản**: 
  - Bác sĩ thường: 15,000,000 VNĐ/tháng
  - Bác sĩ chuyên khoa I: 20,000,000 VNĐ/tháng
  - Bác sĩ chuyên khoa II: 25,000,000 VNĐ/tháng
  - Phó giáo sư, Giáo sư: 30,000,000+ VNĐ/tháng

- **Hoa hồng**: 15-30% doanh thu từ bệnh nhân khám
  - Khám bệnh: 20%
  - Xét nghiệm, chụp chiếu: 10%
  - Điều trị, phẫu thuật: 30%

**5.5.2. Lương Nhân viên khác**
- Tiếp tân: 8,000,000 - 10,000,000 VNĐ/tháng
- Kỹ thuật viên xét nghiệm: 10,000,000 - 15,000,000 VNĐ/tháng
- Kế toán: 12,000,000 - 18,000,000 VNĐ/tháng
- Quản trị hệ thống: 15,000,000 - 20,000,000 VNĐ/tháng

**5.5.3. Chính sách thưởng**
- Tháng 13: 100% lương cơ bản
- Thưởng hiệu suất: Dựa trên KPI (đánh giá, số lượng bệnh nhân, ...)
- Thưởng lễ, tết: Theo quy định

### 5.6. Quy định về Dữ liệu và Bảo mật

**5.6.1. Quyền riêng tư bệnh nhân**
- Thông tin bệnh nhân là **BÍ MẬT Y TẾ**
- Chỉ bác sĩ điều trị và nhân viên được ủy quyền mới được xem
- Không được chia sẻ thông tin cho bên thứ 3 (trừ trường hợp pháp lý)

**5.6.2. Lưu trữ dữ liệu**
- Bệnh án điện tử: Lưu trữ **vô thời hạn**
- Backup dữ liệu: **Hàng ngày** (tự động)
- Log hệ thống: Lưu trữ **6 tháng**

**5.6.3. Quyền truy cập**
- **Bệnh nhân**: Xem thông tin của mình
- **Bác sĩ**: Xem bệnh nhân mình điều trị
- **Tiếp tân**: Xem thông tin cơ bản (không xem bệnh án)
- **Kế toán**: Xem thông tin thanh toán
- **Admin**: Xem tất cả (có log)

### 5.7. Quy định về Thông báo

**5.7.1. Nhắc lịch hẹn tự động**
- **24 giờ trước**: Gửi email + SMS
- **2 giờ trước**: Gửi thông báo in-app (nếu có)
- **15 phút trước**: Gọi điện (với lịch quan trọng)

**5.7.2. Thông báo kết quả xét nghiệm**
- Kết quả bình thường: Email tự động
- Kết quả bất thường: Bác sĩ gọi điện trực tiếp
- Kết quả nguy hiểm: Liên hệ khẩn cấp

**5.7.3. Thông báo thay đổi**
- Thay đổi lịch hẹn: Thông báo ngay lập tức
- Thay đổi bác sĩ: Thông báo trước 24 giờ
- Thay đổi giá dịch vụ: Thông báo trước 7 ngày

---

## VI. THÔNG TIN KỸ THUẬT

### 6.1. Công nghệ sử dụng

**Backend**:
- ASP.NET Core 9.0 (Web API)
- Entity Framework Core (ORM)
- SQL Server (Database)
- JWT Authentication

**Frontend**:
- Web: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- Frontend: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5

**Libraries/Frameworks**:
- Chart.js (Biểu đồ)
- Font Awesome (Icons)
- SweetAlert2 (Notifications)

### 6.2. Cấu trúc Database

**Các bảng chính**:
1. `users` - Thông tin người dùng
2. `patient_profiles` - Hồ sơ bệnh nhân
3. `staff_profiles` - Hồ sơ nhân viên
4. `appointments` - Lịch hẹn
5. `encounters` - Phiếu khám bệnh
6. `prescriptions` - Đơn thuốc
7. `lab_requests` - Yêu cầu xét nghiệm
8. `lab_results` - Kết quả xét nghiệm
9. `invoices` - Hóa đơn
10. `doctor_schedules` - Lịch làm việc bác sĩ
11. `notifications` - Thông báo
12. `ratings` - Đánh giá

### 6.3. API Endpoints (Tóm tắt)

**Authentication**:
- POST `/api/auth/register` - Đăng ký
- POST `/api/auth/login` - Đăng nhập

**Appointments**:
- GET `/api/appointments` - Danh sách lịch hẹn
- POST `/api/appointments` - Đặt lịch mới
- PUT `/api/appointments/{id}` - Cập nhật lịch
- DELETE `/api/appointments/{id}` - Hủy lịch

**Doctors**:
- GET `/api/doctors` - Danh sách bác sĩ
- GET `/api/doctors/{id}` - Thông tin bác sĩ
- GET `/api/doctors/{id}/schedules` - Lịch làm việc

**Patients**:
- GET `/api/patients/{id}` - Thông tin bệnh nhân
- GET `/api/patients/{id}/history` - Lịch sử khám

**Lab Technician**:
- GET `/api/lab/requests` - Danh sách yêu cầu XN
- PUT `/api/lab/results/{id}` - Cập nhật kết quả

**Accountant**:
- GET `/api/accountant/invoices` - Danh sách hóa đơn
- GET `/api/accountant/salary` - Bảng lương
- GET `/api/accountant/reports` - Báo cáo tài chính

**Admin**:
- GET `/api/admin/users` - Quản lý người dùng
- POST `/api/admin/schedules` - Tạo lịch làm việc
- POST `/api/admin/reminders` - Gửi nhắc lịch

---

## VII. KẾT LUẬN

Hệ thống Phòng khám "Healthy System" là một giải pháp toàn diện, tự động hóa toàn bộ quy trình khám chữa bệnh từ đặt lịch, khám bệnh, xét nghiệm, thanh toán đến quản lý nhân sự và báo cáo.

**Lợi ích chính**:
- **Cho bệnh nhân**: Đặt lịch dễ dàng, quản lý thông tin sức khỏe, nhận kết quả nhanh chóng
- **Cho bác sĩ**: Truy cập bệnh án điện tử, yêu cầu xét nghiệm, kê đơn thuốc hiệu quả
- **Cho phòng khám**: Quản lý tập trung, báo cáo tài chính chi tiết, tối ưu vận hành

**Hướng phát triển**:
- Tích hợp AI hỗ trợ chẩn đoán
- Telemedicine (Khám bệnh từ xa)
- Tích hợp bảo hiểm y tế
- Ứng dụng wearable devices

---

**Phiên bản**: 1.0  
**Ngày cập nhật**: 08/11/2025  
**Người soạn**: Nhóm 8 - Hệ thống Phòng khám Healthy System


