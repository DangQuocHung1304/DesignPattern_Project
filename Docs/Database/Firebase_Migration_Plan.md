# Kế Hoạch Chuyển Đổi Database: SQL Server → Firebase

## 📊 Phân Tích Database Hiện Tại

### Cấu Trúc SQL Server (18 Tables)

#### **Core Tables**
1. ✅ `users` - Thông tin người dùng (patient, doctor, reception, admin, etc.)
2. ✅ `patient_profiles` - Hồ sơ bệnh nhân
3. ✅ `staff_profiles` - Hồ sơ nhân viên
4. ✅ `specialties` - Chuyên khoa
5. ✅ `doctor_specialties` - Bác sĩ - Chuyên khoa (Many-to-Many)
6. ✅ `doctor_schedules` - Lịch làm việc bác sĩ
7. ✅ `appointments` - Lịch hẹn khám
8. ✅ `appointment_history` - Lịch sử thay đổi lịch hẹn
9. ✅ `encounters` - Lượt khám (visits)
10. ✅ `prescriptions` - Đơn thuốc
11. ✅ `prescription_items` - Chi tiết đơn thuốc
12. ✅ `services` - Dịch vụ (khám, XN, CĐHA, thuốc)
13. ✅ `invoices` - Hóa đơn
14. ✅ `invoice_items` - Chi tiết hóa đơn
15. ✅ `payments` - Thanh toán
16. ✅ `lab_requests` + `lab_results` - Xét nghiệm
17. ✅ `imaging_requests` + `imaging_results` - Chẩn đoán hình ảnh
18. ✅ `files` - Tệp đính kèm
19. ✅ `notifications` - Thông báo
20. ✅ `ratings` - Đánh giá
21. ✅ `payroll_periods` + `payroll_entries` - Bảng lương
22. ✅ `activity_logs` - Nhật ký hoạt động

### ⚠️ Đặc Điểm Phức Tạp
- **Foreign Keys:** Nhiều quan hệ phức tạp (users → staff/patients, appointments → users)
- **Triggers:** 3 triggers (prevent overlap, history tracking, invoice total)
- **Stored Procedures:** 2 SPs (create_appointment, cancel_appointment)
- **Views:** 2 views (daily_revenue, visits_per_doctor)
- **Data Types:** BIGINT, UNIQUEIDENTIFIER, DATETIMEOFFSET, NVARCHAR

---

## 🔥 Thiết Kế Firebase Firestore

### 1. Collections Cấu Trúc

```
QLPhongKham (Firestore Database)
│
├── users/                           # Top-level collection
│   ├── {userId}/                    # Document (auto-generated ID)
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── passwordHash: string
│   │   ├── role: string            # patient|doctor|reception|lab|admin
│   │   ├── status: string          # active|inactive
│   │   ├── firstName: string
│   │   ├── lastName: string
│   │   ├── dob: timestamp
│   │   ├── gender: string
│   │   ├── createdAt: timestamp
│   │   ├── updatedAt: timestamp
│   │   │
│   │   ├── profile/                # Subcollection (patient hoặc staff)
│   │   │   └── {profileId}/        # Document
│   │   │       ├── medicalRecordNumber: string (patient)
│   │   │       ├── insuranceProvider: string
│   │   │       ├── staffCode: string (staff)
│   │   │       ├── department: string
│   │   │       ├── position: string
│   │   │       └── ...
│   │   │
│   │   └── specialties/            # Subcollection (chỉ doctor)
│   │       └── {specialtyId}/
│   │           ├── name: string
│   │           ├── description: string
│   │
├── specialties/                     # Top-level collection
│   └── {specialtyId}/
│       ├── name: string
│       ├── description: string
│
├── appointments/                    # Top-level collection
│   └── {appointmentId}/
│       ├── patientId: string (ref to users)
│       ├── doctorId: string (ref to users)
│       ├── createdBy: string
│       ├── appointmentStart: timestamp
│       ├── appointmentEnd: timestamp
│       ├── status: string           # scheduled|confirmed|cancelled|completed
│       ├── source: string           # online|walk_in|phone
│       ├── reason: string
│       ├── cancellationReason: string
│       ├── rescheduledFromId: string (ref)
│       ├── reminderSent: boolean
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       │
│       └── history/                 # Subcollection
│           └── {historyId}/
│               ├── changedBy: string
│               ├── oldStatus: string
│               ├── newStatus: string
│               ├── oldStart: timestamp
│               ├── newStart: timestamp
│               ├── comment: string
│               ├── changedAt: timestamp
│
├── encounters/                      # Top-level collection
│   └── {encounterId}/
│       ├── appointmentId: string (optional ref)
│       ├── patientId: string
│       ├── doctorId: string
│       ├── visitDatetime: timestamp
│       ├── chiefComplaint: string
│       ├── diagnosis: string
│       ├── notes: string
│       ├── status: string           # open|closed
│       ├── createdAt: timestamp
│       │
│       ├── prescriptions/           # Subcollection
│       │   └── {prescriptionId}/
│       │       ├── doctorId: string
│       │       ├── prescribedAt: timestamp
│       │       ├── notes: string
│       │       │
│       │       └── items/           # Subcollection
│       │           └── {itemId}/
│       │               ├── medicineName: string
│       │               ├── dosage: string
│       │               ├── frequency: string
│       │               ├── durationDays: number
│       │               ├── instructions: string
│       │
│       ├── labRequests/             # Subcollection
│       │   └── {labRequestId}/
│       │       ├── requestedBy: string
│       │       ├── requestedAt: timestamp
│       │       ├── status: string
│       │       ├── note: string
│       │       │
│       │       └── results/         # Subcollection
│       │           └── {resultId}/
│       │               ├── testCode: string
│       │               ├── resultText: string
│       │               ├── resultValue: string
│       │               ├── performedBy: string
│       │               ├── performedAt: timestamp
│       │
│       └── imagingRequests/         # Subcollection
│           └── {imagingRequestId}/
│               ├── requestedBy: string
│               ├── requestedAt: timestamp
│               ├── status: string
│               │
│               └── results/
│                   └── {resultId}/
│                       ├── reportText: string
│                       ├── performedBy: string
│                       ├── performedAt: timestamp
│
├── invoices/                        # Top-level collection
│   └── {invoiceId}/
│       ├── patientId: string
│       ├── encounterId: string (optional)
│       ├── createdBy: string
│       ├── issuedAt: timestamp
│       ├── totalAmount: number      # Calculated
│       ├── status: string           # unpaid|paid|partial|cancelled
│       │
│       ├── items/                   # Subcollection
│       │   └── {itemId}/
│       │       ├── serviceId: string (optional ref)
│       │       ├── description: string
│       │       ├── qty: number
│       │       ├── unitPrice: number
│       │       ├── amount: number   # qty * unitPrice
│       │
│       └── payments/                # Subcollection
│           └── {paymentId}/
│               ├── paidBy: string
│               ├── amount: number
│               ├── method: string   # cash|card|insurance
│               ├── paidAt: timestamp
│               ├── reference: string
│
├── services/                        # Top-level collection
│   └── {serviceId}/
│       ├── code: string
│       ├── name: string
│       ├── category: string         # consultation|lab|imaging|medication
│       ├── defaultPrice: number
│       ├── taxable: boolean
│       ├── createdAt: timestamp
│
├── doctorSchedules/                 # Top-level collection
│   └── {scheduleId}/
│       ├── doctorId: string
│       ├── scheduleDate: timestamp  # Date only
│       ├── startTime: string        # HH:mm format
│       ├── endTime: string
│       ├── slotLengthMinutes: number
│       ├── isAvailable: boolean
│       ├── createdAt: timestamp
│
├── notifications/                   # Top-level collection
│   └── {notificationId}/
│       ├── userId: string
│       ├── appointmentId: string (optional)
│       ├── type: string             # reminder|promo|admin
│       ├── channel: string          # push|sms|email
│       ├── scheduledAt: timestamp
│       ├── sentAt: timestamp (optional)
│       ├── status: string           # pending|sent|failed
│       ├── payload: string
│       ├── createdAt: timestamp
│
├── ratings/                         # Top-level collection
│   └── {ratingId}/
│       ├── patientId: string
│       ├── doctorId: string (optional)
│       ├── serviceId: string (optional)
│       ├── rating: number           # 1-5
│       ├── comment: string
│       ├── createdAt: timestamp
│
├── payrollPeriods/                  # Top-level collection
│   └── {periodId}/
│       ├── startDate: timestamp
│       ├── endDate: timestamp
│       ├── createdAt: timestamp
│       │
│       └── entries/                 # Subcollection
│           └── {entryId}/
│               ├── staffUserId: string
│               ├── baseSalary: number
│               ├── bonus: number
│               ├── deductions: number
│               ├── netSalary: number
│               ├── generatedAt: timestamp
│
├── files/                           # Top-level collection (hoặc Firebase Storage)
│   └── {fileId}/
│       ├── ownerUserId: string
│       ├── objectType: string       # lab_result|imaging_result
│       ├── objectId: string
│       ├── fileName: string
│       ├── filePath: string         # Storage path
│       ├── mimeType: string
│       ├── fileSize: number
│       ├── uploadedBy: string
│       ├── uploadedAt: timestamp
│
└── activityLogs/                    # Top-level collection
    └── {logId}/
        ├── userId: string
        ├── action: string
        ├── objectType: string
        ├── objectId: string
        ├── details: string
        ├── ipAddress: string
        ├── createdAt: timestamp
```

---

## 🔄 Mapping Strategy

### Thay Đổi Chính

| SQL Server | Firebase Firestore | Lý Do |
|------------|-------------------|-------|
| `BIGINT IDENTITY` | Auto-generated Document ID | Firestore tự động tạo ID |
| `UNIQUEIDENTIFIER` | Document ID hoặc field UUID | Không cần public_id riêng |
| `DATETIMEOFFSET` | `Timestamp` | Firestore native timestamp |
| `NVARCHAR(MAX)` | `string` | Không giới hạn |
| Foreign Keys | Reference strings (userId, doctorId) | Firestore không có FK |
| Many-to-Many (doctor_specialties) | Subcollection hoặc array | Dùng subcollection |
| Triggers | Cloud Functions | Firebase Cloud Functions |
| Stored Procedures | Cloud Functions | Backend logic |
| Views | Aggregation Queries | Firestore queries hoặc cache |

### Denormalization Strategy

Firebase khuyến nghị **denormalize** data để tối ưu read performance:

```javascript
// Thay vì JOIN users + appointments
// Lưu luôn doctor info trong appointment
appointments/{id}
{
  patientId: "userId123",
  patientName: "Đặng Quốc Hưng",      // Denormalized
  patientPhone: "0907000001",          // Denormalized
  
  doctorId: "userId456",
  doctorName: "Dr. Nguyễn Văn An",    // Denormalized
  doctorSpecialty: "Nội tổng quát",   // Denormalized
  
  appointmentStart: Timestamp,
  status: "confirmed"
}
```

**Trade-off:**
- ✅ Faster reads (no joins)
- ❌ Update complexity (phải update nhiều nơi)
- ✅ Offline support tốt hơn

---

## 🛠️ Migration Steps

### Phase 1: Setup Firebase Project

1. **Tạo Firebase Project**
   ```bash
   # Vào https://console.firebase.google.com/
   # Tạo project mới: "HealthySystem"
   # Enable Firestore Database
   # Enable Authentication (Email/Password)
   # Enable Storage (cho files)
   ```

2. **Install Firebase SDK**
   ```bash
   # Backend (nếu dùng Node.js)
   npm install firebase-admin
   
   # Frontend
   npm install firebase
   ```

3. **Initialize Firestore**
   ```javascript
   // firebaseConfig.js
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';
   import { getAuth } from 'firebase/auth';
   import { getStorage } from 'firebase/storage';

   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "healthysystem.firebaseapp.com",
     projectId: "healthysystem",
     storageBucket: "healthysystem.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };

   const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
   export const auth = getAuth(app);
   export const storage = getStorage(app);
   ```

### Phase 2: Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if hasRole('admin') || hasRole('reception');
      allow update: if isOwner(userId) || hasRole('admin');
      allow delete: if hasRole('admin');
      
      // Subcollections
      match /profile/{profileId} {
        allow read: if isOwner(userId) || hasRole('doctor') || hasRole('reception');
        allow write: if isOwner(userId) || hasRole('admin');
      }
      
      match /specialties/{specialtyId} {
        allow read: if true;  // Public
        allow write: if hasRole('admin');
      }
    }
    
    // Appointments
    match /appointments/{appointmentId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();  // Patient or reception
      allow update: if hasRole('doctor') || 
                       hasRole('reception') || 
                       isOwner(resource.data.patientId);
      allow delete: if hasRole('admin');
      
      match /history/{historyId} {
        allow read: if isSignedIn();
        allow write: if false;  // Only through Cloud Functions
      }
    }
    
    // Encounters
    match /encounters/{encounterId} {
      allow read: if hasRole('doctor') || 
                     hasRole('reception') || 
                     isOwner(resource.data.patientId);
      allow create, update: if hasRole('doctor');
      allow delete: if hasRole('admin');
      
      match /{document=**} {
        allow read: if hasRole('doctor') || isOwner(get(/databases/$(database)/documents/encounters/$(encounterId)).data.patientId);
        allow write: if hasRole('doctor');
      }
    }
    
    // Invoices
    match /invoices/{invoiceId} {
      allow read: if hasRole('accountant') || 
                     hasRole('reception') ||
                     isOwner(resource.data.patientId);
      allow write: if hasRole('accountant') || hasRole('reception');
      
      match /{document=**} {
        allow read, write: if hasRole('accountant');
      }
    }
    
    // Services (public read)
    match /services/{serviceId} {
      allow read: if true;
      allow write: if hasRole('admin');
    }
    
    // Specialties (public read)
    match /specialties/{specialtyId} {
      allow read: if true;
      allow write: if hasRole('admin');
    }
    
    // Doctor Schedules
    match /doctorSchedules/{scheduleId} {
      allow read: if true;  // Anyone can see availability
      allow write: if hasRole('doctor') || hasRole('admin');
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow write: if false;  // Only through Cloud Functions
    }
    
    // Ratings
    match /ratings/{ratingId} {
      allow read: if true;  // Public ratings
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.patientId);
    }
    
    // Activity Logs (admin only)
    match /activityLogs/{logId} {
      allow read: if hasRole('admin');
      allow write: if false;  // Only through Cloud Functions
    }
    
    // Payroll (sensitive)
    match /payrollPeriods/{periodId} {
      allow read, write: if hasRole('accountant') || hasRole('admin');
      
      match /entries/{entryId} {
        allow read: if hasRole('accountant') || 
                       hasRole('admin') ||
                       isOwner(resource.data.staffUserId);
        allow write: if hasRole('accountant') || hasRole('admin');
      }
    }
    
    // Files
    match /files/{fileId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.uploadedBy) || hasRole('admin');
    }
  }
}
```

### Phase 3: Cloud Functions (Thay Thế Triggers & SPs)

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// 1) Prevent Overlapping Appointments (thay trigger)
exports.validateAppointment = functions.firestore
  .document('appointments/{appointmentId}')
  .onWrite(async (change, context) => {
    const newData = change.after.exists ? change.after.data() : null;
    const oldData = change.before.exists ? change.before.data() : null;
    
    // Skip if deleted or cancelled
    if (!newData || newData.status === 'cancelled') {
      return null;
    }
    
    const doctorId = newData.doctorId;
    const start = newData.appointmentStart;
    const end = newData.appointmentEnd;
    const currentId = context.params.appointmentId;
    
    // Query overlapping appointments
    const overlapping = await db.collection('appointments')
      .where('doctorId', '==', doctorId)
      .where('status', '!=', 'cancelled')
      .get();
    
    for (const doc of overlapping.docs) {
      if (doc.id === currentId) continue;  // Skip self
      
      const existing = doc.data();
      const existingStart = existing.appointmentStart;
      const existingEnd = existing.appointmentEnd;
      
      // Check overlap: newStart < existingEnd && existingStart < newEnd
      if (start.toDate() < existingEnd.toDate() && 
          existingStart.toDate() < end.toDate()) {
        
        // Rollback by deleting (or update to previous state)
        await change.after.ref.delete();
        
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Lỗi: Bác sĩ đã có lịch trùng thời gian. Vui lòng chọn khung giờ khác.'
        );
      }
    }
    
    return null;
  });

// 2) Track Appointment History
exports.trackAppointmentHistory = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    const historyEntry = {
      changedBy: after.updatedBy || after.createdBy || null,
      oldStatus: before.status,
      newStatus: after.status,
      oldStart: before.appointmentStart,
      newStart: after.appointmentStart,
      oldEnd: before.appointmentEnd,
      newEnd: after.appointmentEnd,
      comment: after.cancellationReason || null,
      changedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await change.after.ref
      .collection('history')
      .add(historyEntry);
    
    return null;
  });

// 3) Update Invoice Total (thay trigger)
exports.updateInvoiceTotal = functions.firestore
  .document('invoices/{invoiceId}/items/{itemId}')
  .onWrite(async (change, context) => {
    const invoiceId = context.params.invoiceId;
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    
    // Get all items
    const itemsSnapshot = await invoiceRef.collection('items').get();
    
    let total = 0;
    itemsSnapshot.forEach(doc => {
      const item = doc.data();
      total += (item.qty || 0) * (item.unitPrice || 0);
    });
    
    await invoiceRef.update({
      totalAmount: total,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return null;
  });

// 4) Create Appointment (thay SP)
exports.createAppointment = functions.https.onCall(async (data, context) => {
  // Check auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const {
    patientId,
    doctorId,
    appointmentStart,
    appointmentEnd,
    source = 'online',
    reason = null
  } = data;
  
  const now = admin.firestore.Timestamp.now();
  const startTime = admin.firestore.Timestamp.fromDate(new Date(appointmentStart));
  const endTime = admin.firestore.Timestamp.fromDate(new Date(appointmentEnd));
  
  // Validation
  if (endTime.toDate() <= startTime.toDate()) {
    throw new functions.https.HttpsError('invalid-argument', 'End must be after start');
  }
  
  if (startTime.toDate() <= now.toDate()) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot create appointment in the past');
  }
  
  // Create appointment
  const appointmentRef = await db.collection('appointments').add({
    patientId,
    doctorId,
    createdBy: context.auth.uid,
    appointmentStart: startTime,
    appointmentEnd: endTime,
    status: 'scheduled',
    source,
    reason,
    reminderSent: false,
    createdAt: now,
    updatedAt: now
  });
  
  // Create reminders
  const reminder24h = new Date(startTime.toDate());
  reminder24h.setHours(reminder24h.getHours() - 24);
  
  const reminder2h = new Date(startTime.toDate());
  reminder2h.setHours(reminder2h.getHours() - 2);
  
  if (reminder24h > now.toDate()) {
    await db.collection('notifications').add({
      userId: patientId,
      appointmentId: appointmentRef.id,
      type: 'reminder',
      channel: 'push',
      scheduledAt: admin.firestore.Timestamp.fromDate(reminder24h),
      status: 'pending',
      payload: `Reminder: appointment at ${startTime.toDate().toISOString()}`,
      createdAt: now
    });
  }
  
  if (reminder2h > now.toDate()) {
    await db.collection('notifications').add({
      userId: patientId,
      appointmentId: appointmentRef.id,
      type: 'reminder',
      channel: 'push',
      scheduledAt: admin.firestore.Timestamp.fromDate(reminder2h),
      status: 'pending',
      payload: `Reminder: appointment in 2 hours`,
      createdAt: now
    });
  }
  
  return { appointmentId: appointmentRef.id };
});

// 5) Cancel Appointment (thay SP)
exports.cancelAppointment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { appointmentId, cancellationReason = null } = data;
  
  const appointmentRef = db.collection('appointments').doc(appointmentId);
  const appointmentDoc = await appointmentRef.get();
  
  if (!appointmentDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Appointment not found');
  }
  
  const appointment = appointmentDoc.data();
  
  if (appointment.status === 'cancelled') {
    throw new functions.https.HttpsError('failed-precondition', 'Already cancelled');
  }
  
  const now = new Date();
  const start = appointment.appointmentStart.toDate();
  const twoHoursBefore = new Date(start);
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
  
  if (now > twoHoursBefore) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Cannot cancel appointment within 2 hours of start time'
    );
  }
  
  // Update appointment
  await appointmentRef.update({
    status: 'cancelled',
    cancellationReason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid
  });
  
  // Notify patient
  await db.collection('notifications').add({
    userId: appointment.patientId,
    appointmentId,
    type: 'appointment_cancelled',
    channel: 'push',
    scheduledAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
    payload: `Your appointment has been cancelled. Reason: ${cancellationReason || 'N/A'}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});

// 6) Activity Logger (background)
exports.logActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) return null;
  
  const { action, objectType, objectId, details } = data;
  
  await db.collection('activityLogs').add({
    userId: context.auth.uid,
    action,
    objectType,
    objectId: objectId || null,
    details: details || null,
    ipAddress: context.rawRequest.ip || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { logged: true };
});
```

### Phase 4: Data Migration Script

```javascript
// migrate.js - Script chuyển data từ SQL Server sang Firebase
const admin = require('firebase-admin');
const sql = require('mssql');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// SQL Server config
const sqlConfig = {
  user: 'sa',
  password: 'YourPassword',
  server: 'MSI\\YLC',
  database: 'QLPhongKham',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function migrateUsers() {
  console.log('Migrating users...');
  const pool = await sql.connect(sqlConfig);
  const result = await pool.request().query('SELECT * FROM dbo.users');
  
  const batch = db.batch();
  let count = 0;
  
  for (const row of result.recordset) {
    const userRef = db.collection('users').doc();  // Auto-generate ID
    
    batch.set(userRef, {
      email: row.email,
      phone: row.phone || null,
      passwordHash: row.password_hash,
      role: row.role,
      status: row.status,
      firstName: row.first_name || null,
      lastName: row.last_name || null,
      dob: row.dob ? admin.firestore.Timestamp.fromDate(row.dob) : null,
      gender: row.gender || null,
      createdAt: admin.firestore.Timestamp.fromDate(row.created_at),
      updatedAt: row.updated_at ? admin.firestore.Timestamp.fromDate(row.updated_at) : null,
      sqlId: row.id  // Keep for reference mapping
    });
    
    count++;
    
    // Firestore batch limit: 500
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  Committed ${count} users`);
    }
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${count} users`);
}

async function migratePatientProfiles() {
  console.log('Migrating patient profiles...');
  const pool = await sql.connect(sqlConfig);
  
  // Get user mapping (sqlId -> firebaseId)
  const usersSnapshot = await db.collection('users').get();
  const userMap = {};
  usersSnapshot.forEach(doc => {
    userMap[doc.data().sqlId] = doc.id;
  });
  
  const result = await pool.request().query('SELECT * FROM dbo.patient_profiles');
  
  const batch = db.batch();
  let count = 0;
  
  for (const row of result.recordset) {
    const firebaseUserId = userMap[row.user_id];
    if (!firebaseUserId) continue;
    
    const profileRef = db.collection('users')
      .doc(firebaseUserId)
      .collection('profile')
      .doc('patient');
    
    batch.set(profileRef, {
      medicalRecordNumber: row.medical_record_number || null,
      insuranceProvider: row.insurance_provider || null,
      insuranceNumber: row.insurance_number || null,
      address: row.address || null,
      emergencyContactName: row.emergency_contact_name || null,
      emergencyContactPhone: row.emergency_contact_phone || null,
      allergies: row.allergies || null,
      chronicConditions: row.chronic_conditions || null,
      createdAt: admin.firestore.Timestamp.fromDate(row.created_at)
    });
    
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
    }
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${count} patient profiles`);
}

// Similar functions for:
// - migrateStaffProfiles()
// - migrateSpecialties()
// - migrateAppointments()
// - migrateEncounters()
// - migrateInvoices()
// ... etc

async function runMigration() {
  try {
    await migrateUsers();
    await migratePatientProfiles();
    // await migrateStaffProfiles();
    // await migrateSpecialties();
    // await migrateAppointments();
    // ... continue for all tables
    
    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sql.close();
  }
}

runMigration();
```

---

## 📱 Frontend Integration

### Ví Dụ: Get Appointments cho Doctor

**SQL Server (hiện tại):**
```javascript
// api.js
async getDoctorAppointments() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/appointments/doctor', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}
```

**Firebase (mới):**
```javascript
// firebaseApi.js
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

async function getDoctorAppointments() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const q = query(
    collection(db, 'appointments'),
    where('doctorId', '==', user.uid),
    where('status', 'in', ['scheduled', 'confirmed', 'pending']),
    orderBy('appointmentStart', 'asc')
  );
  
  const snapshot = await getDocs(q);
  const appointments = [];
  
  snapshot.forEach(doc => {
    appointments.push({
      id: doc.id,
      ...doc.data(),
      // Convert Timestamps to JS Date
      appointmentStart: doc.data().appointmentStart.toDate(),
      appointmentEnd: doc.data().appointmentEnd.toDate()
    });
  });
  
  return appointments;
}
```

### Realtime Updates (Bonus!)

```javascript
// Listen for real-time changes
import { onSnapshot } from 'firebase/firestore';

function listenToAppointments(doctorId, callback) {
  const q = query(
    collection(db, 'appointments'),
    where('doctorId', '==', doctorId),
    orderBy('appointmentStart', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const appointments = [];
    snapshot.forEach(doc => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    
    callback(appointments);  // Update UI automatically!
  });
  
  return unsubscribe;  // Call this to stop listening
}

// Usage
const unsubscribe = listenToAppointments(currentDoctorId, (appointments) => {
  console.log('Appointments updated:', appointments);
  renderAppointments(appointments);
});

// Later: cleanup
unsubscribe();
```

---

## ⚡ Performance Optimization

### 1. Indexes

```javascript
// Create composite indexes in Firebase Console
// appointments: (doctorId, appointmentStart)
// appointments: (patientId, status)
// encounters: (patientId, visitDatetime)
```

### 2. Denormalization Examples

```javascript
// Instead of storing only IDs
{
  appointmentId: "abc123",
  patientId: "user456",
  doctorId: "user789"
}

// Store denormalized data for faster reads
{
  appointmentId: "abc123",
  
  // Patient info (denormalized)
  patientId: "user456",
  patientName: "Đặng Quốc Hưng",
  patientPhone: "0907000001",
  patientEmail: "hung.dq@sample.local",
  
  // Doctor info (denormalized)
  doctorId: "user789",
  doctorName: "Dr. Nguyễn Văn An",
  doctorSpecialty: "Nội tổng quát",
  
  appointmentStart: Timestamp,
  appointmentEnd: Timestamp,
  status: "confirmed"
}
```

### 3. Caching

```javascript
// Use local cache for frequently accessed data
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open
    } else if (err.code == 'unimplemented') {
      // Browser doesn't support
    }
  });
```

---

## 💰 Cost Estimation

### Firebase Pricing (Free Tier)

- **Firestore:**
  - 50K reads/day ✅
  - 20K writes/day ✅
  - 20K deletes/day ✅
  - 1 GB storage ✅

- **Cloud Functions:**
  - 2M invocations/month ✅
  - 400K GB-seconds ✅
  - 200K CPU-seconds ✅

- **Storage:**
  - 5 GB transfer/day ✅

**Dự đoán:** Với clinic nhỏ (~100 appointments/day), **FREE TIER ĐỦ DÙNG**!

### Paid (nếu scale lên)

- Firestore: $0.06 per 100K reads
- Functions: $0.40 per million invocations
- Storage: $0.026 per GB

**Ước tính:** ~$10-20/month cho clinic vừa (500-1000 appointments/day)

---

## 🎯 Next Steps

1. ✅ Review cấu trúc Firebase design
2. 📝 Approve migration plan
3. 🔧 Tạo Firebase project
4. 🚀 Chạy migration script
5. 🧪 Test frontend với Firebase
6. 🔒 Setup security rules
7. 📊 Deploy Cloud Functions
8. 🎉 Go live!

Bạn muốn tôi bắt đầu implementation từ bước nào? 🚀
