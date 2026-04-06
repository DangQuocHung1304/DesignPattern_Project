# Presentation Script - HealthySystem (10-15 minutes)

## Muc tieu buoi demo

- Chung minh gia tri tai cau truc tu legacy code sang kien truc Design Pattern
- Trinh dien Hero Flow nghiep vu kham benh dau-cuoi
- Khong chi "chay duoc", ma con "de mo rong, de bao tri, de test"

## Tong thoi luong de xuat

- Phan 1 - Mo dau: 2-3 phut
- Phan 2 - Hero Flow ky thuat: 7-9 phut
- Phan 3 - Ket luan + Q&A: 2-3 phut

---

## PHAN 1 - MO DAU (2-3 phut)

### 1.1 Opening line

"Kinh thua thay/co, de tai cua nhom em la nang cap he thong quan ly phong kham theo huong Software Engineering chuan, giai quyet bai toan legacy code va coupling cao bang 12 Design Patterns."

### 1.2 Neu van de legacy

"Ban dau he thong co nhieu logic if-else trai dai trong Controller, moi thay doi nghiep vu deu phai sua tren nhieu file, rat de phat sinh loi day chuyen."

"Ngoai ra, cac quy trinh quan trong nhu doi trang thai lich hen, bat dau kham, tinh phi, gui bao hiem deu bi tron lan business rule, khong co abstraction ro rang."

### 1.3 Chot huong giai quyet

"Nhom em tai cau truc theo 12 Design Patterns de tach trach nhiem, chuan hoa endpoint /pattern, va de co the smoke test tung flow mot cach he thong."

Cau noi chuyen tiep:

"Sau day em xin demo Hero Flow tu luc bac si bat dau kham den luc thanh toan va dong bo thong bao."

---

## PHAN 2 - HERO FLOW (7-9 phut)

## 2.1 Buoc A - Bac si bam "Bat dau kham" (Facade + Builder) [2 phut]

### Hanh dong demo

- Dang nhap vai tro doctor
- Mo doctor dashboard
- Chon 1 lich hen va bam "Bat dau kham"

### Loi thuyet trinh

"Tai thao tac nay, he thong khong goi tung service rieng le. Mau Facade duoc dung de kich hoat dong thoi nhieu subsystem trong 1 command duy nhat: tao encounter, cap nhat workflow, tinh phi ban dau, va tao context dieu tri."

"Sau do, Builder tao SOAP note theo cau truc chuan (Header, Subjective, Assessment, Plan, Footer). Nghia la format y khoa duoc tao co he thong, khong phai ghep chuoi thu cong."

### Endpoint co the chi tren slide

- POST /api/examinations/start/pattern

### Ket qua can nhan manh

- Encounter code va invoice code duoc tao
- SOAP note day du section
- Processing state tra ve nhat quan

---

## 2.2 Buoc B - Doi trang thai lich hen (State + Observer) [2 phut]

### Hanh dong demo

- O trang doctor appointments, doi status lich hen (vi du scheduled -> checked-in -> in-progress)

### Loi thuyet trinh

"Mau State dam bao chi nhung transition hop le moi duoc phep. Tuc la he thong kiem soat luat chuyen trang thai thay vi if-else phan tan."

"Mau Observer lang nghe su thay doi va phat event ngay lap tuc. Frontend nhan event de cap nhat badge/toast theo thoi gian thuc."

### Endpoint

- PUT /api/appointments/{id}/status/pattern
- POST /api/design-patterns/observer/appointments/{appointmentCode}/status/pattern

### Ket qua can nhan manh

- Transition duoc validate
- Co event payload de dong bo UI

---

## 2.3 Buoc C - Tra cuu benh an bao mat (Proxy) [1-1.5 phut]

### Hanh dong demo

- Mo patient lookup
- Tim 1 benh nhan 2 lan lien tiep

### Loi thuyet trinh

"Mau Proxy dung de kiem soat truy cap benh an theo role va patient scope."

"Lan truy cap sau co the tai su dung cache payload, giam tai he thong va van giu rule bao mat."

### Endpoint

- GET /api/medicalhistory/secure-summary/{patientCode}/pattern

### Ket qua can nhan manh

- Co gate access
- Co dau hieu cache reuse

---

## 2.4 Buoc D - Tao tai khoan theo role (Factory Method + Singleton) [1.5 phut]

### Hanh dong demo

- Dang nhap admin
- Tao account theo role tren man hinh Admin Accounts
- Mo Admin System Config va doi MaxAppointmentsPerHour

### Loi thuyet trinh

"Factory Method tao actor profile theo role, vi du doctor/reception/patient, moi role co onboarding va metadata rieng."

"Singleton duoc dung cho system config de dam bao 1 nguon cau hinh nhat quan xuyen suot ung dung."

### Endpoint

- POST /api/account/create/pattern
- POST /api/design-patterns/singleton/config/pattern

### Ket qua can nhan manh

- Khong can if-else dai de tao role profile
- Cau hinh thay doi va doc lai nhat quan

---

## 2.5 Buoc E - Thanh toan (Strategy + Decorator) [1.5-2 phut]

### Hanh dong demo

- Mo Payments Management
- Preview pricing voi cac option (insurance, loyal, after-hours)
- Thanh toan invoice bang card/insurance

### Loi thuyet trinh

"Decorator dung de cong/tru phi linh hoat tren cung 1 pricing pipeline, khong can nhan ban class."

"Strategy dung de chon thuat toan thanh toan theo method: cash, card, insurance. Them method moi se khong pha vo code cu."

### Endpoint

- POST /api/invoice/pricing/preview/pattern
- POST /api/invoice/{invoiceId}/pay/pattern

### Ket qua can nhan manh

- Tong phi theo cong thuc subtotal - discount + surcharge
- Payment transaction code va insurance claim reference ro rang

---

## 2.6 Buoc F - Ke hoach dieu tri va gui bao hiem (Template Method + Adapter) [1 phut]

### Hanh dong demo

- Mo treatment-plan page
- Generate plan type acute/chronic
- Submit insurance claim

### Loi thuyet trinh

"Template Method dinh nghia bo khung quy trinh tao treatment plan, moi bien the chi can thay doi step dac thu."

"Adapter chuyen doi model noi bo sang payload cua cong bao hiem ben ngoai, giu cho core domain khong bi phu thuoc external API."

### Endpoint

- POST /api/examinations/treatment-plan/{planType}/pattern
- POST /api/examinations/insurance-claim/pattern

---

## PHAN 3 - KET LUAN (2-3 phut)

### 3.1 Tong ket gia tri ky thuat

"Qua Hero Flow vua roi, he thong da cho thay Design Pattern khong chi la ly thuyet, ma da duoc ung dung truc tiep vao nghiep vu cot loi."

"Ket qua la code de mo rong hon, de test hon, va de bao tri hon. Team co the them role, them payment method, them quy trinh dieu tri ma khong can sua vo vach logic cu."

### 3.2 Khang dinh nang luc Software Engineer | AI-Enhanced Development

"Nhom em khong dung AI de viet code thay con nguoi, ma dung AI de tang toc phan tich, tao smoke test script, va xac thuc consistency tren toan bo flow."

"Do do, san pham dat muc Software Engineer | AI-Enhanced Development: co kien truc, co test evidence, co kha nang trinh dien va ban giao."

### 3.3 Chot bai

"Em xin ket thuc phan demo. Em rat san long di sau vao tung pattern hoac tung endpoint neu thay/co muon review chi tiet."

---

## Backup Q&A (neu duoc hoi)

- Vi sao khong dung 1 pattern cho tat ca?  
  -> Moi pattern giai quyet 1 loai van de rieng (state transition, object creation, behavior strategy, orchestration...).

- Neu mo rong them role moi thi sao?  
  -> Mo rong Factory Method/Abstract Factory, khong can sua logic cu theo kieu if-else.

- Lam sao chung minh pattern dang chay that?  
  -> Co endpoint /pattern, log smoke test, va ket qua payload theo tung flow.
