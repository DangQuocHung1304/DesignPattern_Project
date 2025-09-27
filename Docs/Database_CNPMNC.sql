/****************************************************
  Schema: Healthy System - SQL Server DDL
  Note: run under the target database (e.g. USE QLPhongKham;)
****************************************************/

-- OPTIONAL: ensure using the intended DB
-- USE QLPhongKham;
-- GO

/**********************
 Common types / defaults
**********************/

-- We'll use:
--   BIGINT IDENTITY for surrogate ids
--   UNIQUEIDENTIFIER for public_id (UUID)
--   datetimeoffset for timezone-aware timestamps
--   nvarchar for textual fields

CREATE DATABASE QLPhongKham
GO
USE QLPhongKham
GO

/**********************
 1) users
**********************/
CREATE TABLE dbo.users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  public_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
  email NVARCHAR(255) NOT NULL,
  phone NVARCHAR(50) NULL,
  password_hash NVARCHAR(512) NOT NULL,
  role NVARCHAR(50) NOT NULL, -- e.g. patient, reception, doctor, lab, radiology, accountant, admin
  status NVARCHAR(50) NOT NULL DEFAULT 'active',
  first_name NVARCHAR(150) NULL,
  last_name NVARCHAR(150) NULL,
  dob DATE NULL,
  gender NCHAR(1) NULL, -- M/F/O etc.
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIMEOFFSET NULL,
  deleted_at DATETIMEOFFSET NULL,
  CONSTRAINT UQ_users_email UNIQUE (email),
  CONSTRAINT UQ_users_public_id UNIQUE (public_id)
);
GO

CREATE INDEX IX_users_phone ON dbo.users(phone);
GO

/**********************
 2) patient_profiles
**********************/
CREATE TABLE dbo.patient_profiles (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  medical_record_number NVARCHAR(100) UNIQUE NULL,
  insurance_provider NVARCHAR(200) NULL,
  insurance_number NVARCHAR(200) NULL,
  address NVARCHAR(1000) NULL,
  emergency_contact_name NVARCHAR(200) NULL,
  emergency_contact_phone NVARCHAR(50) NULL,
  allergies NVARCHAR(MAX) NULL,
  chronic_conditions NVARCHAR(MAX) NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_patient_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);
GO

/**********************
 3) staff_profiles
**********************/
CREATE TABLE dbo.staff_profiles (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  staff_code NVARCHAR(100) UNIQUE NULL,
  department NVARCHAR(200) NULL,
  position NVARCHAR(100) NULL,
  qualifications NVARCHAR(MAX) NULL,
  license_number NVARCHAR(200) NULL,
  work_start_date DATE NULL,
  work_end_date DATE NULL,
  base_salary DECIMAL(18,2) NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_staff_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);
GO

/**********************
 4) specialties & doctor_specialties
**********************/
CREATE TABLE dbo.specialties (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  description NVARCHAR(MAX) NULL,
  CONSTRAINT UQ_specialties_name UNIQUE (name)
);
GO

CREATE TABLE dbo.doctor_specialties (
  doctor_user_id BIGINT NOT NULL,
  specialty_id BIGINT NOT NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_doctor_specialties PRIMARY KEY (doctor_user_id, specialty_id),
  CONSTRAINT FK_doctor_specialties_user FOREIGN KEY (doctor_user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
  CONSTRAINT FK_doctor_specialties_specialty FOREIGN KEY (specialty_id) REFERENCES dbo.specialties(id) ON DELETE CASCADE
);
GO

/**********************
 5) doctor_schedules
    (work blocks used for availability)
**********************/
CREATE TABLE dbo.doctor_schedules (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  doctor_user_id BIGINT NOT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_length_minutes INT NOT NULL DEFAULT 15,
  is_available BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_doctor_schedules_doctor FOREIGN KEY (doctor_user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);

CREATE INDEX IX_doctor_schedules_doctor_date ON dbo.doctor_schedules(doctor_user_id, schedule_date);
GO

/**********************
 6) appointments
**********************/
CREATE TABLE dbo.appointments (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  doctor_id BIGINT NOT NULL,
  created_by BIGINT NULL,      -- who created (patient or receptionist)
  appointment_start DATETIMEOFFSET NOT NULL,
  appointment_end DATETIMEOFFSET NOT NULL,
  status NVARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled|confirmed|rescheduled|cancelled|completed|no_show
  source NVARCHAR(50) NULL,    -- online|walk_in|phone|admin
  reason NVARCHAR(MAX) NULL,
  cancellation_reason NVARCHAR(MAX) NULL,
  rescheduled_from_appointment_id BIGINT NULL,
  reminder_sent BIT NOT NULL DEFAULT 0,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIMEOFFSET NULL,
  CONSTRAINT FK_appointments_patient FOREIGN KEY (patient_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
  CONSTRAINT FK_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES dbo.users(id),
  CONSTRAINT FK_appointments_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
  CONSTRAINT FK_appointments_rescheduled_from FOREIGN KEY (rescheduled_from_appointment_id) REFERENCES dbo.appointments(id)
);

CREATE INDEX IX_appointments_doctor_start ON dbo.appointments(doctor_id, appointment_start);
CREATE INDEX IX_appointments_patient_start ON dbo.appointments(patient_id, appointment_start);
CREATE INDEX IX_appointments_status ON dbo.appointments(status);
GO

/**********************
 7) appointment_history
**********************/
CREATE TABLE dbo.appointment_history (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  appointment_id BIGINT NOT NULL,
  changed_by BIGINT NULL,
  old_status NVARCHAR(50) NULL,
  new_status NVARCHAR(50) NULL,
  old_start DATETIMEOFFSET NULL,
  new_start DATETIMEOFFSET NULL,
  old_end DATETIMEOFFSET NULL,
  new_end DATETIMEOFFSET NULL,
  comment NVARCHAR(MAX) NULL,
  changed_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_appointment_history_appointment FOREIGN KEY (appointment_id) REFERENCES dbo.appointments(id) ON DELETE CASCADE,
  CONSTRAINT FK_appointment_history_changed_by FOREIGN KEY (changed_by) REFERENCES dbo.users(id)
);

CREATE INDEX IX_appointment_history_appointment ON dbo.appointment_history(appointment_id);
GO

/**********************
 8) encounters (visits)
**********************/
CREATE TABLE dbo.encounters (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  appointment_id BIGINT NULL,
  patient_id BIGINT NOT NULL,
  doctor_id BIGINT NULL,
  visit_datetime DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  chief_complaint NVARCHAR(MAX) NULL,
  diagnosis NVARCHAR(MAX) NULL,
  notes NVARCHAR(MAX) NULL,
  status NVARCHAR(50) NOT NULL DEFAULT 'open',
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_encounters_appointment FOREIGN KEY (appointment_id) REFERENCES dbo.appointments(id),
  CONSTRAINT FK_encounters_patient FOREIGN KEY (patient_id) REFERENCES dbo.users(id),
  CONSTRAINT FK_encounters_doctor FOREIGN KEY (doctor_id) REFERENCES dbo.users(id)
);
CREATE INDEX IX_encounters_patient ON dbo.encounters(patient_id);
GO

/**********************
 9) prescriptions & prescription_items
**********************/
CREATE TABLE dbo.prescriptions (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  encounter_id BIGINT NOT NULL,
  doctor_id BIGINT NOT NULL,
  prescribed_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  notes NVARCHAR(MAX) NULL,
  CONSTRAINT FK_prescriptions_encounter FOREIGN KEY (encounter_id) REFERENCES dbo.encounters(id) ON DELETE CASCADE,
  CONSTRAINT FK_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES dbo.users(id)
);
GO

CREATE TABLE dbo.prescription_items (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  prescription_id BIGINT NOT NULL,
  medicine_name NVARCHAR(300) NOT NULL,
  dosage NVARCHAR(200) NULL,
  frequency NVARCHAR(200) NULL,
  duration_days INT NULL,
  instructions NVARCHAR(MAX) NULL,
  CONSTRAINT FK_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES dbo.prescriptions(id) ON DELETE CASCADE
);
GO

/**********************
 10) services (list of billable items)
**********************/
CREATE TABLE dbo.services (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(100) UNIQUE NULL,
  name NVARCHAR(300) NOT NULL,
  category NVARCHAR(100) NULL, -- consultation|lab|imaging|medication
  default_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  taxable BIT NOT NULL DEFAULT 0,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/**********************
 11) invoices, invoice_items, payments
**********************/
CREATE TABLE dbo.invoices (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  encounter_id BIGINT NULL,
  created_by BIGINT NULL,
  issued_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  status NVARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid|paid|partial|cancelled
  CONSTRAINT FK_invoices_patient FOREIGN KEY (patient_id) REFERENCES dbo.users(id),
  CONSTRAINT FK_invoices_encounter FOREIGN KEY (encounter_id) REFERENCES dbo.encounters(id),
  CONSTRAINT FK_invoices_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id)
);
GO

CREATE TABLE dbo.invoice_items (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  invoice_id BIGINT NOT NULL,
  service_id BIGINT NULL,
  description NVARCHAR(MAX) NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  amount AS (qty * unit_price) PERSISTED,
  CONSTRAINT FK_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id) ON DELETE CASCADE,
  CONSTRAINT FK_invoice_items_service FOREIGN KEY (service_id) REFERENCES dbo.services(id)
);
GO

CREATE TABLE dbo.payments (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  invoice_id BIGINT NOT NULL,
  paid_by BIGINT NULL,
  amount DECIMAL(18,2) NOT NULL,
  method NVARCHAR(50) NULL, -- cash|card|insurance|transfer
  paid_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  reference NVARCHAR(300) NULL,
  CONSTRAINT FK_payments_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(id),
  CONSTRAINT FK_payments_paid_by FOREIGN KEY (paid_by) REFERENCES dbo.users(id)
);
GO

CREATE INDEX IX_invoices_patient ON dbo.invoices(patient_id);
GO

/**********************
 12) lab_requests & lab_results
**********************/
CREATE TABLE dbo.lab_requests (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  encounter_id BIGINT NOT NULL,
  requested_by BIGINT NOT NULL, -- doctor
  requested_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  status NVARCHAR(50) NOT NULL DEFAULT 'requested', -- requested|in_progress|completed|cancelled
  note NVARCHAR(MAX) NULL,
  CONSTRAINT FK_lab_requests_encounter FOREIGN KEY (encounter_id) REFERENCES dbo.encounters(id) ON DELETE CASCADE,
  CONSTRAINT FK_lab_requests_requested_by FOREIGN KEY (requested_by) REFERENCES dbo.users(id)
);
GO

CREATE TABLE dbo.lab_results (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  lab_request_id BIGINT NOT NULL,
  test_code NVARCHAR(200) NULL,
  result_text NVARCHAR(MAX) NULL,
  result_value NVARCHAR(200) NULL,
  units NVARCHAR(100) NULL,
  normal_range NVARCHAR(200) NULL,
  performed_by BIGINT NULL,
  performed_at DATETIMEOFFSET NULL,
  attachment_file_id BIGINT NULL,
  CONSTRAINT FK_lab_results_request FOREIGN KEY (lab_request_id) REFERENCES dbo.lab_requests(id) ON DELETE CASCADE,
  CONSTRAINT FK_lab_results_performed_by FOREIGN KEY (performed_by) REFERENCES dbo.users(id)
);
GO

/**********************
 13) imaging_requests & imaging_results
**********************/
CREATE TABLE dbo.imaging_requests (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  encounter_id BIGINT NOT NULL,
  requested_by BIGINT NOT NULL,
  requested_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  status NVARCHAR(50) NOT NULL DEFAULT 'requested',
  note NVARCHAR(MAX) NULL,
  CONSTRAINT FK_imaging_requests_encounter FOREIGN KEY (encounter_id) REFERENCES dbo.encounters(id) ON DELETE CASCADE,
  CONSTRAINT FK_imaging_requests_requested_by FOREIGN KEY (requested_by) REFERENCES dbo.users(id)
);
GO

CREATE TABLE dbo.imaging_results (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  imaging_request_id BIGINT NOT NULL,
  report_text NVARCHAR(MAX) NULL,
  performed_by BIGINT NULL,
  performed_at DATETIMEOFFSET NULL,
  attachment_file_id BIGINT NULL,
  CONSTRAINT FK_imaging_results_request FOREIGN KEY (imaging_request_id) REFERENCES dbo.imaging_requests(id) ON DELETE CASCADE,
  CONSTRAINT FK_imaging_results_performed_by FOREIGN KEY (performed_by) REFERENCES dbo.users(id)
);
GO

/**********************
 14) files (attachments)
**********************/
CREATE TABLE dbo.files (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  owner_user_id BIGINT NULL,
  object_type NVARCHAR(100) NULL, -- lab_result, imaging_result, invoice, prescription ...
  object_id BIGINT NULL,
  file_path NVARCHAR(2000) NULL,
  file_name NVARCHAR(500) NULL,
  mime_type NVARCHAR(200) NULL,
  file_size BIGINT NULL,
  uploaded_by BIGINT NULL,
  uploaded_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id)
);
GO

CREATE INDEX IX_files_object ON dbo.files(object_type, object_id);
GO

/**********************
 15) notifications (reminders)
**********************/
CREATE TABLE dbo.notifications (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  appointment_id BIGINT NULL,
  type NVARCHAR(100) NULL, -- reminder|promo|admin
  channel NVARCHAR(50) NULL, -- push|sms|call|email
  scheduled_at DATETIMEOFFSET NULL,
  sent_at DATETIMEOFFSET NULL,
  status NVARCHAR(50) NULL, -- pending|sent|failed
  payload NVARCHAR(MAX) NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
  CONSTRAINT FK_notifications_appointment FOREIGN KEY (appointment_id) REFERENCES dbo.appointments(id)
);
GO

/**********************
 16) ratings
**********************/
CREATE TABLE dbo.ratings (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  doctor_id BIGINT NULL,
  service_id BIGINT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment NVARCHAR(MAX) NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_ratings_patient FOREIGN KEY (patient_id) REFERENCES dbo.users(id),
  CONSTRAINT FK_ratings_doctor FOREIGN KEY (doctor_id) REFERENCES dbo.users(id),
  CONSTRAINT FK_ratings_service FOREIGN KEY (service_id) REFERENCES dbo.services(id)
);
GO

/**********************
 17) payroll_periods & payroll_entries
**********************/
CREATE TABLE dbo.payroll_periods (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.payroll_entries (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  period_id BIGINT NOT NULL,
  staff_user_id BIGINT NOT NULL,
  base_salary DECIMAL(18,2) NULL,
  bonus DECIMAL(18,2) NULL,
  deductions DECIMAL(18,2) NULL,
  net_salary DECIMAL(18,2) NULL,
  generated_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_payroll_entries_period FOREIGN KEY (period_id) REFERENCES dbo.payroll_periods(id),
  CONSTRAINT FK_payroll_entries_staff FOREIGN KEY (staff_user_id) REFERENCES dbo.users(id)
);
GO

/**********************
 18) activity_logs
**********************/
CREATE TABLE dbo.activity_logs (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NULL,
  action NVARCHAR(200) NOT NULL,
  object_type NVARCHAR(200) NULL,
  object_id BIGINT NULL,
  details NVARCHAR(MAX) NULL,
  ip_address NVARCHAR(100) NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_activity_logs_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
);
GO

/**********************
 Useful Indexes
**********************/
CREATE INDEX IX_prescriptions_encounter ON dbo.prescriptions(encounter_id);
CREATE INDEX IX_lab_requests_status ON dbo.lab_requests(status);
CREATE INDEX IX_imaging_requests_status ON dbo.imaging_requests(status);
GO

/********************************************************
 TRIGGERS / BASIC BUSINESS RULES
 1) Prevent overlapping appointments (double booking) for same doctor
 2) Record appointment history on INSERT/UPDATE
 3) Update invoice.total_amount when invoice_items change
********************************************************/

-- 1) Prevent double-booking for same doctor
-- This trigger checks for overlaps when inserting/updating appointments.
-- Overlap condition: new.start < existing.end AND existing.start < new.end
-- Note: This is a simple enforcement at DB level; application-level checks recommended for better UX.

/*  TRIGGER dbo.trg_appointments_prevent_overlap ----Version 1
CREATE OR ALTER TRIGGER dbo.trg_appointments_prevent_overlap
ON dbo.appointments
INSTEAD OF INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Work with the new rows in inserted
    ;WITH ins AS (
      SELECT *
      FROM inserted
    )
    -- Check each inserted/updated row against existing appointments (excluding self on update)
    SELECT 1
    FROM ins i
    JOIN dbo.appointments a
      ON a.doctor_id = i.doctor_id
     AND (a.id <> i.id OR i.id IS NULL) -- exclude same row when updating
     AND i.appointment_start < a.appointment_end
     AND a.appointment_start < i.appointment_end
     AND a.status NOT IN ('cancelled')  -- ignore cancelled appointments
    OPTION (RECOMPILE);

    -- If the above SELECT returns rows, we'll throw below. So check count
    IF EXISTS (
      SELECT 1
      FROM ins i
      JOIN dbo.appointments a
        ON a.doctor_id = i.doctor_id
       AND (a.id <> i.id OR i.id IS NULL)
       AND i.appointment_start < a.appointment_end
       AND a.appointment_start < i.appointment_end
       AND a.status NOT IN ('cancelled')
    )
    BEGIN
      THROW 51000, 'Lỗi: Bác sĩ đã có lịch trùng thời gian (double booking). Vui lòng chọn khung giờ khác.', 1;
      RETURN;
    END

    -- If no overlap, perform the actual INSERT/UPDATE
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
      -- Distinguish between UPDATE and INSERT: use MERGE-like logic
      IF EXISTS (SELECT 1 FROM deleted) -- UPDATE
      BEGIN
        -- Perform update
        UPDATE a
        SET
          patient_id = i.patient_id,
          doctor_id = i.doctor_id,
          created_by = i.created_by,
          appointment_start = i.appointment_start,
          appointment_end = i.appointment_end,
          status = i.status,
          source = i.source,
          reason = i.reason,
          cancellation_reason = i.cancellation_reason,
          rescheduled_from_appointment_id = i.rescheduled_from_appointment_id,
          reminder_sent = i.reminder_sent,
          updated_at = SYSUTCDATETIME()
        FROM dbo.appointments a
        JOIN inserted i ON a.id = i.id;
      END
      ELSE -- INSERT
      BEGIN
        INSERT INTO dbo.appointments(
          patient_id, doctor_id, created_by, appointment_start, appointment_end,
          status, source, reason, cancellation_reason, rescheduled_from_appointment_id,
          reminder_sent, created_at
        )
        SELECT
          patient_id, doctor_id, created_by, appointment_start, appointment_end,
          status, source, reason, cancellation_reason, rescheduled_from_appointment_id,
          reminder_sent, SYSUTCDATETIME()
        FROM inserted;
      END
    END
  END TRY
  BEGIN CATCH
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrMsg, 16, 1);
    ROLLBACK;
  END CATCH
END;
*/

CREATE OR ALTER TRIGGER dbo.trg_appointments_prevent_overlap
ON dbo.appointments
INSTEAD OF INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Lưu inserted vào table variable để tái sử dụng
    DECLARE @ins TABLE (
      id BIGINT NULL,
      patient_id BIGINT NOT NULL,
      doctor_id BIGINT NOT NULL,
      created_by BIGINT NULL,
      appointment_start DATETIMEOFFSET NOT NULL,
      appointment_end   DATETIMEOFFSET NOT NULL,
      status NVARCHAR(50) NULL,
      source NVARCHAR(50) NULL,
      reason NVARCHAR(MAX) NULL,
      cancellation_reason NVARCHAR(MAX) NULL,
      rescheduled_from_appointment_id BIGINT NULL,
      reminder_sent BIT NULL,
      rn INT IDENTITY(1,1) PRIMARY KEY
    );

    INSERT @ins (id, patient_id, doctor_id, created_by, appointment_start, appointment_end,
                 status, source, reason, cancellation_reason, rescheduled_from_appointment_id, reminder_sent)
    SELECT id, patient_id, doctor_id, created_by, appointment_start, appointment_end,
           status, source, reason, cancellation_reason, rescheduled_from_appointment_id, reminder_sent
    FROM inserted;

    -- 1) Trùng với lịch đã có (bỏ qua 'cancelled')
    IF EXISTS (
      SELECT 1
      FROM @ins i
      JOIN dbo.appointments a
        ON a.doctor_id = i.doctor_id
       AND (a.id <> i.id OR i.id IS NULL)
       AND i.appointment_start < a.appointment_end
       AND a.appointment_start < i.appointment_end
       AND a.status <> N'cancelled'
    )
    BEGIN
      THROW 51000, N'Lỗi: Bác sĩ đã có lịch trùng thời gian (double booking). Vui lòng chọn khung giờ khác.', 1;
    END;

    -- 2) Trùng lẫn nhau trong batch hiện tại
    IF EXISTS (
      SELECT 1
      FROM @ins i1
      JOIN @ins i2
        ON i1.doctor_id = i2.doctor_id
       AND i1.rn < i2.rn
       AND i1.appointment_start < i2.appointment_end
       AND i2.appointment_start < i1.appointment_end
       AND ISNULL(i1.status, N'scheduled') <> N'cancelled'
       AND ISNULL(i2.status, N'scheduled') <> N'cancelled'
    )
    BEGIN
      THROW 51001, N'Lỗi: Các bản ghi trong batch đang chèn/cập nhật bị trùng nhau về thời gian cho cùng bác sĩ.', 1;
    END;

    -- 3) Thực hiện UPDATE hoặc INSERT
    IF EXISTS (SELECT 1 FROM deleted) -- UPDATE
    BEGIN
      UPDATE a
         SET patient_id = i.patient_id,
             doctor_id = i.doctor_id,
             created_by = i.created_by,
             appointment_start = i.appointment_start,
             appointment_end = i.appointment_end,
             status = i.status,
             source = i.source,
             reason = i.reason,
             cancellation_reason = i.cancellation_reason,
             rescheduled_from_appointment_id = i.rescheduled_from_appointment_id,
             reminder_sent = ISNULL(i.reminder_sent, a.reminder_sent),
             updated_at = SYSUTCDATETIME()
      FROM dbo.appointments a
      JOIN @ins i ON a.id = i.id;
    END
    ELSE -- INSERT
    BEGIN
      INSERT INTO dbo.appointments (
        patient_id, doctor_id, created_by, appointment_start, appointment_end,
        status, source, reason, cancellation_reason, rescheduled_from_appointment_id,
        reminder_sent, created_at
      )
      SELECT
        patient_id, doctor_id, created_by, appointment_start, appointment_end,
        ISNULL(status, N'scheduled'), source, reason, cancellation_reason, rescheduled_from_appointment_id,
        ISNULL(reminder_sent, 0), SYSUTCDATETIME()
      FROM @ins;
    END
  END TRY
  BEGIN CATCH
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrSev INT = ERROR_SEVERITY();
    DECLARE @ErrState INT = ERROR_STATE();
    RAISERROR(@ErrMsg, @ErrSev, @ErrState);
  END CATCH
END;

GO

-- 2) Appointment history trigger (after insert/update) to log changes
-- We create an AFTER trigger to append changed rows to appointment_history.
--CREATE OR ALTER TRIGGER dbo.trg_appointment_history_after
--ON dbo.appointments
--AFTER INSERT, UPDATE
--AS
--BEGIN
--  SET NOCOUNT ON;

--  INSERT INTO dbo.appointment_history (
--    appointment_id, changed_by, old_status, new_status,
--    old_start, new_start, old_end, new_end, comment, changed_at
--  )
--  SELECT
--    COALESCE(d.id, i.id) AS appointment_id,
--    i.updated_at IS NOT NULL /*cannot get changed_by here, but we can use created_by*/ ? i.created_by : i.created_by, -- fallback
--    d.status AS old_status,
--    i.status AS new_status,
--    d.appointment_start AS old_start,
--    i.appointment_start AS new_start,
--    d.appointment_end AS old_end,
--    i.appointment_end AS new_end,
--    NULL,
--    SYSUTCDATETIME()
--  FROM inserted i
--  LEFT JOIN deleted d ON i.id = d.id
--  -- We will insert a row for both inserts (d NULL) and updates
--  ;
--END;

CREATE OR ALTER TRIGGER dbo.trg_appointment_history_after
ON dbo.appointments
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.appointment_history (
    appointment_id,
    changed_by,
    old_status,
    new_status,
    old_start,
    new_start,
    old_end,
    new_end,
    comment,
    changed_at
  )
  SELECT
    COALESCE(d.id, i.id) AS appointment_id,
    i.created_by AS changed_by,            -- dùng created_by vì updated_by không tồn tại
    d.status AS old_status,
    i.status AS new_status,
    d.appointment_start AS old_start,
    i.appointment_start AS new_start,
    d.appointment_end AS old_end,
    i.appointment_end AS new_end,
    NULL AS comment,
    SYSUTCDATETIME() AS changed_at
  FROM inserted i
  LEFT JOIN deleted d ON i.id = d.id;
END;
GO


-- 3) Maintain invoices.total_amount whenever invoice_items change
-- After insert/update/delete on invoice_items, recalc sum of amounts and update invoice.total_amount
CREATE OR ALTER TRIGGER dbo.trg_invoice_items_sync_total
ON dbo.invoice_items
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @InvoiceIds TABLE (invoice_id BIGINT PRIMARY KEY);

  INSERT INTO @InvoiceIds(invoice_id)
  SELECT DISTINCT invoice_id FROM inserted
  WHERE invoice_id IS NOT NULL
  UNION
  SELECT DISTINCT invoice_id FROM deleted
  WHERE invoice_id IS NOT NULL;

  UPDATE inv
  SET total_amount = ISNULL(t.sum_amount, 0.00)
  FROM dbo.invoices inv
  LEFT JOIN (
    SELECT invoice_id, SUM(amount) AS sum_amount
    FROM dbo.invoice_items
    GROUP BY invoice_id
  ) t ON t.invoice_id = inv.id
  WHERE inv.id IN (SELECT invoice_id FROM @InvoiceIds);
END;
GO

/********************************************************
 Notes & Recommendations
 - Application should enforce "cancel before 2 hours" rule:
     check appointment_start - SYSUTCDATETIME() >= 2 hours
   (you can implement as stored procedure or check in app layer)
 - For large scale, consider row-versioning, partitioning, and archiving old logs.
 - Secure: store password_hash with bcrypt/argon2 outside DB or store hash; protect DB backups.
 - Consider using schemas (e.g. hr, billing) if you'd like to segment objects.
********************************************************/



/**********************************************
sp_create_appointment
Params:
 @patient_id BIGINT,
 @doctor_id BIGINT,
 @appointment_start DATETIMEOFFSET,
 @appointment_end DATETIMEOFFSET,
 @created_by BIGINT = NULL,
 @source NVARCHAR(50) = 'online',
 @reason NVARCHAR(MAX) = NULL,
 OUT @appointment_id BIGINT OUTPUT
Behavior:
 - Insert appointment (DB will enforce overlap via trigger)
 - Create reminder notifications: 24h and 2h before (if those times > now())
 - Return new appointment id
**********************************************/
CREATE OR ALTER PROCEDURE dbo.sp_create_appointment
  @patient_id BIGINT,
  @doctor_id BIGINT,
  @appointment_start DATETIMEOFFSET,
  @appointment_end DATETIMEOFFSET,
  @created_by BIGINT = NULL,
  @source NVARCHAR(50) = 'online',
  @reason NVARCHAR(MAX) = NULL,
  @appointment_id BIGINT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @now DATETIMEOFFSET = SYSUTCDATETIME();

  BEGIN TRY
    BEGIN TRANSACTION;

    -- Basic validation
    IF @appointment_end <= @appointment_start
    BEGIN
      THROW 51001, 'appointment_end must be greater than appointment_start', 1;
    END

    IF @appointment_start <= @now
    BEGIN
      THROW 51002, 'Cannot create appointment in the past. Choose a future time.', 1;
    END

    -- Insert appointment
    INSERT INTO dbo.appointments (
      patient_id, doctor_id, created_by, appointment_start, appointment_end,
      status, source, reason, reminder_sent, created_at
    )
    VALUES (
      @patient_id, @doctor_id, @created_by, @appointment_start, @appointment_end,
      'scheduled', @source, @reason, 0, SYSUTCDATETIME()
    );

    SET @appointment_id = SCOPE_IDENTITY();

    -- Create reminders:
    -- 1) 24 hours before
    DECLARE @reminder24 DATETIMEOFFSET = DATEADD(hour, -24, @appointment_start);
    DECLARE @reminder2 DATETIMEOFFSET  = DATEADD(hour, -2, @appointment_start);

    IF @reminder24 > @now
    BEGIN
      INSERT INTO dbo.notifications (
        user_id, appointment_id, type, channel, scheduled_at, status, payload, created_at
      )
      VALUES (
        @patient_id, @appointment_id, 'reminder', 'push', @reminder24, 'pending',
        CONCAT('Reminder: appointment at ', CONVERT(nvarchar(50), @appointment_start, 20)),
        SYSUTCDATETIME()
      );
    END

    IF @reminder2 > @now
    BEGIN
      INSERT INTO dbo.notifications (
        user_id, appointment_id, type, channel, scheduled_at, status, payload, created_at
      )
      VALUES (
        @patient_id, @appointment_id, 'reminder', 'push', @reminder2, 'pending',
        CONCAT('Reminder: appointment in 2 hours at ', CONVERT(nvarchar(50), @appointment_start, 20)),
        SYSUTCDATETIME()
      );
    END

    -- Optionally notify receptionist or doctor (one-off notification)
    INSERT INTO dbo.notifications (
      user_id, appointment_id, type, channel, scheduled_at, status, payload, created_at
    )
    VALUES (
      @doctor_id, @appointment_id, 'appointment_created', 'push', SYSUTCDATETIME(), 'pending',
      CONCAT('New appointment scheduled: ', CONVERT(nvarchar(50), @appointment_start, 20)),
      SYSUTCDATETIME()
    );

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0
      ROLLBACK TRANSACTION;

    DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE();
    THROW 51010, @err, 1;
  END CATCH
END;
GO


/**********************************************
sp_cancel_appointment
Params:
 @appointment_id BIGINT,
 @cancelled_by BIGINT = NULL,
 @cancellation_reason NVARCHAR(MAX) = NULL
Behavior:
 - Check appointment exists and not already cancelled
 - Enforce cancellation window: must cancel at least 2 hours before appointment_start
 - Update appointments.status -> 'cancelled' and cancellation_reason, updated_at
 - Insert a row into appointment_history
 - Insert a notification to patient (and doctor)
**********************************************/
CREATE OR ALTER PROCEDURE dbo.sp_cancel_appointment
  @appointment_id BIGINT,
  @cancelled_by BIGINT = NULL,
  @cancellation_reason NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @now DATETIMEOFFSET = SYSUTCDATETIME();

  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @appt_patient BIGINT, @appt_doctor BIGINT, @appt_start DATETIMEOFFSET, @appt_status NVARCHAR(50);

    SELECT
      @appt_patient = patient_id,
      @appt_doctor  = doctor_id,
      @appt_start   = appointment_start,
      @appt_status  = status
    FROM dbo.appointments
    WHERE id = @appointment_id;

    IF @appt_patient IS NULL
    BEGIN
      THROW 51020, 'Appointment not found.', 1;
    END

    IF @appt_status = 'cancelled'
    BEGIN
      THROW 51021, 'Appointment already cancelled.', 1;
    END

    -- Enforce cancellation window: at least 2 hours before appointment_start
    IF DATEADD(hour, -2, @appt_start) < @now
    BEGIN
      THROW 51022, 'Cannot cancel appointment within 2 hours of start time.', 1;
    END

    -- Update appointment
    UPDATE dbo.appointments
    SET status = 'cancelled',
        cancellation_reason = @cancellation_reason,
        updated_at = SYSUTCDATETIME()
    WHERE id = @appointment_id;

    -- Insert into appointment_history
    INSERT INTO dbo.appointment_history (
      appointment_id, changed_by, old_status, new_status,
      old_start, new_start, old_end, new_end, comment, changed_at
    )
    SELECT
      @appointment_id,
      @cancelled_by,
      @appt_status,
      'cancelled',
      appointment_start,
      appointment_start,
      appointment_end,
      appointment_end,
      @cancellation_reason,
      SYSUTCDATETIME()
    FROM dbo.appointments
    WHERE id = @appointment_id;

    -- Notify patient
    INSERT INTO dbo.notifications (
      user_id, appointment_id, type, channel, scheduled_at, sent_at, status, payload, created_at
    )
    VALUES (
      @appt_patient, @appointment_id, 'appointment_cancelled', 'push', SYSUTCDATETIME(), NULL, 'pending',
      CONCAT('Your appointment at ', CONVERT(nvarchar(50), @appt_start, 20), ' has been cancelled. Reason: ', ISNULL(@cancellation_reason,'')),
      SYSUTCDATETIME()
    );

    -- Notify doctor (optional)
    IF @appt_doctor IS NOT NULL
    BEGIN
      INSERT INTO dbo.notifications (
        user_id, appointment_id, type, channel, scheduled_at, sent_at, status, payload, created_at
      )
      VALUES (
        @appt_doctor, @appointment_id, 'appointment_cancelled', 'push', SYSUTCDATETIME(), NULL, 'pending',
        CONCAT('Appointment for patient ', @appt_patient, ' at ', CONVERT(nvarchar(50), @appt_start, 20), ' was cancelled.'),
        SYSUTCDATETIME()
      );
    END

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0
      ROLLBACK TRANSACTION;

    DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE();
    THROW 51030, @err, 1;
  END CATCH
END;
GO



/**********************************************
vw_daily_revenue
 - Aggregates invoices by issued date (exclude cancelled)
**********************************************/
CREATE OR ALTER VIEW dbo.vw_daily_revenue
AS
SELECT
  CAST(issued_at AS DATE) AS revenue_date,
  COUNT(*) AS invoice_count,
  SUM(total_amount) AS total_revenue
FROM dbo.invoices
WHERE status <> 'cancelled'
GROUP BY CAST(issued_at AS DATE);
GO

/**********************************************
vw_visits_per_doctor
 - Aggregates encounters (visits) per doctor per date
**********************************************/
CREATE OR ALTER VIEW dbo.vw_visits_per_doctor
AS
SELECT
  CAST(visit_datetime AS DATE) AS visit_date,
  doctor_id,
  COUNT(*) AS total_visits
FROM dbo.encounters
GROUP BY CAST(visit_datetime AS DATE), doctor_id;
GO



/**********************************************
daily_revenue_summary (materialized-like)
 - Primary key on revenue_date for fast reads.
 - Use sp_refresh_daily_revenue_summary to update.
**********************************************/
IF OBJECT_ID('dbo.daily_revenue_summary','U') IS NULL
BEGIN
  CREATE TABLE dbo.daily_revenue_summary (
    revenue_date DATE PRIMARY KEY,
    invoice_count INT NOT NULL,
    total_revenue DECIMAL(18,2) NOT NULL,
    last_refreshed DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_refresh_daily_revenue_summary
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    -- Replace contents with current aggregates
    TRUNCATE TABLE dbo.daily_revenue_summary;

    INSERT INTO dbo.daily_revenue_summary (revenue_date, invoice_count, total_revenue, last_refreshed)
    SELECT
      revenue_date, invoice_count, ISNULL(total_revenue,0.00), SYSUTCDATETIME()
    FROM dbo.vw_daily_revenue;

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0
      ROLLBACK TRANSACTION;

    DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE();
    THROW 51100, @err, 1;
  END CATCH
END;
GO

-- Index (already PK on revenue_date). You may add covering indexes if needed.

/**********************************************
doctor_visits_summary
 - Composite PK (doctor_id, visit_date)
 - Use sp_refresh_doctor_visits_summary to update.
**********************************************/
IF OBJECT_ID('dbo.doctor_visits_summary','U') IS NULL
BEGIN
  CREATE TABLE dbo.doctor_visits_summary (
    doctor_id BIGINT NOT NULL,
    visit_date DATE NOT NULL,
    total_visits INT NOT NULL,
    last_refreshed DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_doctor_visits_summary PRIMARY KEY (doctor_id, visit_date)
  );
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_refresh_doctor_visits_summary
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    TRUNCATE TABLE dbo.doctor_visits_summary;

    INSERT INTO dbo.doctor_visits_summary (doctor_id, visit_date, total_visits, last_refreshed)
    SELECT
      dv.doctor_id,
      dv.visit_date,
      dv.total_visits,
      SYSUTCDATETIME()
    FROM dbo.vw_visits_per_doctor dv;

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0
      ROLLBACK TRANSACTION;

    DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE();
    THROW 51110, @err, 1;
  END CATCH
END;
GO


/***********************************************
Cách dùng
----------Tạo appointment:
DECLARE @new_appt_id BIGINT;
EXEC dbo.sp_create_appointment
  @patient_id = 123,
  @doctor_id = 45,
  @appointment_start = '2025-10-01 09:00:00 +07:00',
  @appointment_end   = '2025-10-01 09:30:00 +07:00',
  @created_by = 123,
  @source = 'online',
  @reason = 'Đi khám tổng quát',
  @appointment_id = @new_appt_id OUTPUT;

SELECT @new_appt_id AS appointment_id;

-----------Huỷ appointment:
EXEC dbo.sp_cancel_appointment
  @appointment_id = 999,
  @cancelled_by = 50,
  @cancellation_reason = N'Khách yêu cầu đổi lịch';


------------Làm mới báo cáo:
EXEC dbo.sp_refresh_daily_revenue_summary;
EXEC dbo.sp_refresh_doctor_visits_summary;

SELECT TOP 100 * FROM dbo.daily_revenue_summary ORDER BY revenue_date DESC;
SELECT TOP 100 * FROM dbo.doctor_visits_summary ORDER BY visit_date DESC;

****************************************************************/




/****************************************************************
Chèn dữ liệu mẫu:
****************************************************************/

/* =========================================================
   SAMPLE SEED DATA for QLPhongKham
   - Run after creating schema from Database_CNPMNC.sql
   - Run on empty DB to avoid UNIQUE violations
   ========================================================= */
USE QLPhongKham;
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRAN;

------------------------------------------------------------
-- 1) USERS (admin, doctors, staff, patients)
------------------------------------------------------------
DECLARE 
  @u_admin BIGINT, 
  @u_doc1 BIGINT, @u_doc2 BIGINT,
  @u_rece BIGINT, @u_lab BIGINT, @u_rad BIGINT, @u_acc BIGINT,
  @u_pat1 BIGINT, @u_pat2 BIGINT;

-- Admin
INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'admin@clinic.local', N'0901000001', N'hash:admin', N'admin', N'active', N'Admin', N'Clinic', '1990-01-01', N'M');
SELECT @u_admin = SCOPE_IDENTITY();

-- Doctors
INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'dr.an@clinic.local', N'0902000001', N'hash:dr.an', N'doctor', N'active', N'Nguyễn', N'Văn An', '1980-05-20', N'M');
SELECT @u_doc1 = SCOPE_IDENTITY();

INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'dr.binh@clinic.local', N'0902000002', N'hash:dr.binh', N'doctor', N'active', N'Trần', N'Thị Bình', '1985-10-10', N'F');
SELECT @u_doc2 = SCOPE_IDENTITY();

-- Receptionist
INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'reception@clinic.local', N'0903000001', N'hash:recep', N'reception', N'active', N'Lê', N'Thu Hà', '1996-02-14', N'F');
SELECT @u_rece = SCOPE_IDENTITY();

-- Lab staff
INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'lab@clinic.local', N'0904000001', N'hash:lab', N'lab', N'active', N'Phạm', N'Quang', '1992-08-08', N'M');
SELECT @u_lab = SCOPE_IDENTITY();

-- Radiology staff
INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'radiology@clinic.local', N'0905000001', N'hash:rad', N'radiology', N'active', N'Võ', N'Minh', '1991-03-03', N'M');
SELECT @u_rad = SCOPE_IDENTITY();

-- Accountant
INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'accounting@clinic.local', N'0906000001', N'hash:acct', N'accountant', N'active', N'Bùi', N'Lan', '1990-09-09', N'F');
SELECT @u_acc = SCOPE_IDENTITY();

-- Patients (có thể cá nhân hóa 1 bản ghi)
INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'hung.dq@sample.local', N'0907000001', N'hash:patient1', N'patient', N'active', N'Đặng', N'Quốc Hưng', '1999-07-07', N'M');
SELECT @u_pat1 = SCOPE_IDENTITY();

INSERT dbo.users (email, phone, password_hash, role, status, first_name, last_name, dob, gender)
VALUES (N'pham.anh@sample.local', N'0907000002', N'hash:patient2', N'patient', N'active', N'Phạm', N'Anh', '2000-12-12', N'F');
SELECT @u_pat2 = SCOPE_IDENTITY();

------------------------------------------------------------
-- 2) STAFF & PATIENT PROFILES
------------------------------------------------------------
INSERT dbo.staff_profiles (user_id, staff_code, department, position, qualifications, license_number, work_start_date, base_salary)
VALUES 
(@u_doc1, N'DR001', N'Nội tổng quát', N'Bác sĩ', N'BSCKI; Nội khoa', N'MD-12345', '2022-01-01', 30000000.00),
(@u_doc2, N'DR002', N'Nhi',           N'Bác sĩ', N'BSCKI; Nhi khoa', N'MD-23456', '2021-06-01', 32000000.00),
(@u_rece, N'RC001', N'Lễ tân',        N'Nhân viên', N'NV y tế', NULL, '2023-03-01', 12000000.00),
(@u_lab,  N'LB001', N'Xét nghiệm',    N'KTV', N'KTV xét nghiệm', NULL, '2020-09-01', 15000000.00),
(@u_rad,  N'RD001', N'Chẩn đoán hình ảnh', N'KTV', N'KTV CĐHA', NULL, '2020-09-01', 16000000.00),
(@u_acc,  N'AC001', N'Kế toán',       N'Kế toán', N'Kế toán viên', NULL, '2019-01-01', 18000000.00);

INSERT dbo.patient_profiles (user_id, medical_record_number, insurance_provider, insurance_number, address, emergency_contact_name, emergency_contact_phone, allergies, chronic_conditions)
VALUES
(@u_pat1, N'MRN-0001', N'BHYT Quận 1', N'BHYT-123456', N'12 Nguyễn Huệ, Q1, TP.HCM', N'Ngô Minh', N'0912345678', N'Không', N'Không'),
(@u_pat2, N'MRN-0002', N'BHYT Quận 3', N'BHYT-654321', N'45 CMT8, Q3, TP.HCM',       N'Vũ Hạnh', N'0987654321', N'Penicillin', N'Hen phế quản');

------------------------------------------------------------
-- 3) SPECIALTIES & DOCTOR SPECIALTIES
------------------------------------------------------------
INSERT dbo.specialties (name, description)
VALUES 
(N'Nội tổng quát', N'Khám và điều trị bệnh nội khoa'),
(N'Tim mạch',      N'Chẩn đoán và điều trị bệnh tim mạch'),
(N'Nhi khoa',      N'Chăm sóc sức khỏe trẻ em'),
(N'Xét nghiệm',    N'Khoa xét nghiệm'),
(N'Chẩn đoán hình ảnh', N'X-quang, siêu âm, CT, MRI');

DECLARE @sp_gen BIGINT, @sp_card BIGINT, @sp_ped BIGINT;
SELECT @sp_gen  = id FROM dbo.specialties WHERE name = N'Nội tổng quát';
SELECT @sp_card = id FROM dbo.specialties WHERE name = N'Tim mạch';
SELECT @sp_ped  = id FROM dbo.specialties WHERE name = N'Nhi khoa';

INSERT dbo.doctor_specialties (doctor_user_id, specialty_id)
VALUES 
(@u_doc1, @sp_gen),
(@u_doc1, @sp_card),
(@u_doc2, @sp_ped);

------------------------------------------------------------
-- 4) DOCTOR SCHEDULES (availability blocks)
------------------------------------------------------------
-- Bác sĩ An (01/10/2025): sáng & chiều
INSERT dbo.doctor_schedules (doctor_user_id, schedule_date, start_time, end_time, slot_length_minutes, is_available)
VALUES 
(@u_doc1, '2025-10-01', '09:00', '12:00', 15, 1),
(@u_doc1, '2025-10-01', '13:30', '17:00', 15, 1);

-- Bác sĩ Bình (01/10/2025)
INSERT dbo.doctor_schedules (doctor_user_id, schedule_date, start_time, end_time, slot_length_minutes, is_available)
VALUES 
(@u_doc2, '2025-10-01', '08:30', '11:30', 15, 1),
(@u_doc2, '2025-10-01', '13:00', '16:30', 15, 1);

------------------------------------------------------------
-- 5) SERVICES (billable items)
------------------------------------------------------------
INSERT dbo.services (code, name, category, default_price, taxable)
VALUES
(N'CONSULT',  N'Khám tư vấn',         N'consultation', 150000.00, 0),
(N'LAB_CBC',  N'Xét nghiệm công thức máu (CBC)', N'lab', 80000.00, 0),
(N'IMG_CXR',  N'Chụp X-quang ngực',   N'imaging', 200000.00, 0),
(N'MED_AMOX', N'Amoxicillin 500mg (viên)', N'medication', 5000.00, 0);

DECLARE @svc_consult BIGINT, @svc_cbc BIGINT, @svc_cxr BIGINT, @svc_amox BIGINT;
SELECT @svc_consult = id FROM dbo.services WHERE code = N'CONSULT';
SELECT @svc_cbc     = id FROM dbo.services WHERE code = N'LAB_CBC';
SELECT @svc_cxr     = id FROM dbo.services WHERE code = N'IMG_CXR';
SELECT @svc_amox    = id FROM dbo.services WHERE code = N'MED_AMOX';

DECLARE @price_consult DECIMAL(18,2), @price_cbc DECIMAL(18,2), @price_cxr DECIMAL(18,2), @price_amox DECIMAL(18,2);
SELECT 
  @price_consult = default_price FROM dbo.services WHERE id = @svc_consult;
SELECT 
  @price_cbc = default_price FROM dbo.services WHERE id = @svc_cbc;
SELECT 
  @price_cxr = default_price FROM dbo.services WHERE id = @svc_cxr;
SELECT 
  @price_amox = default_price FROM dbo.services WHERE id = @svc_amox;

------------------------------------------------------------
-- 6) APPOINTMENTS (no overlap; trigger will check)
-- Lưu ý: INSTEAD OF trigger => không dùng SCOPE_IDENTITY() cho appointments
------------------------------------------------------------
DECLARE @appt1 BIGINT, @appt2 BIGINT;

-- Hẹn #1: Patient1 với BS An (09:00-09:30 +07:00)
INSERT dbo.appointments
  (patient_id, doctor_id, created_by, appointment_start, appointment_end, status, source, reason, reminder_sent)
VALUES
  (@u_pat1, @u_doc1, @u_rece, '2025-10-01 09:00:00 +07:00', '2025-10-01 09:30:00 +07:00', N'scheduled', N'online', N'Khám tổng quát', 0);

-- Hẹn #2: Patient2 với BS Bình (09:00-09:20 +07:00)
INSERT dbo.appointments
  (patient_id, doctor_id, created_by, appointment_start, appointment_end, status, source, reason, reminder_sent)
VALUES
  (@u_pat2, @u_doc2, @u_rece, '2025-10-01 09:00:00 +07:00', '2025-10-01 09:20:00 +07:00', N'scheduled', N'phone', N'Ho kéo dài', 0);

-- Lấy id theo dấu vết (patient/doctor/time)
SELECT @appt1 = id FROM dbo.appointments 
 WHERE patient_id = @u_pat1 AND doctor_id = @u_doc1 
   AND appointment_start = '2025-10-01 09:00:00 +07:00';

SELECT @appt2 = id FROM dbo.appointments 
 WHERE patient_id = @u_pat2 AND doctor_id = @u_doc2 
   AND appointment_start = '2025-10-01 09:00:00 +07:00';

------------------------------------------------------------
-- 7) ENCOUNTERS (Visit)
------------------------------------------------------------
DECLARE @enc1 BIGINT, @enc2 BIGINT;

INSERT dbo.encounters (appointment_id, patient_id, doctor_id, visit_datetime, chief_complaint, diagnosis, notes, status)
VALUES 
(@appt1, @u_pat1, @u_doc1, '2025-10-01 09:05:00 +07:00', N'Khám sức khỏe định kỳ', N'Khỏe mạnh', N'Huyết áp bình thường', N'closed');
SELECT @enc1 = SCOPE_IDENTITY();

INSERT dbo.encounters (appointment_id, patient_id, doctor_id, visit_datetime, chief_complaint, diagnosis, notes, status)
VALUES 
(@appt2, @u_pat2, @u_doc2, '2025-10-01 09:05:00 +07:00', N'Ho 2 tuần', N'Viêm họng cấp', N'Khuyên uống nước ấm', N'open');
SELECT @enc2 = SCOPE_IDENTITY();

------------------------------------------------------------
-- 8) PRESCRIPTIONS & ITEMS
------------------------------------------------------------
DECLARE @rx1 BIGINT, @rx2 BIGINT;

INSERT dbo.prescriptions (encounter_id, doctor_id, notes)
VALUES (@enc1, @u_doc1, N'Bổ sung vitamin D, vận động thường xuyên');
SELECT @rx1 = SCOPE_IDENTITY();

INSERT dbo.prescriptions (encounter_id, doctor_id, notes)
VALUES (@enc2, @u_doc2, N'Uống nhiều nước; dùng kháng sinh nếu cần');
SELECT @rx2 = SCOPE_IDENTITY();

-- Items cho toa #2 (Patient2)
INSERT dbo.prescription_items (prescription_id, medicine_name, dosage, frequency, duration_days, instructions)
VALUES 
(@rx2, N'Amoxicillin 500mg', N'500mg', N'3 lần/ngày', 7, N'Uống sau ăn'),
(@rx2, N'Paracetamol 500mg', N'500mg', N'4-6 giờ/lần khi sốt/đau', 3, N'Không dùng quá 4g/ngày');

------------------------------------------------------------
-- 9) LAB REQUESTS/RESULTS (cho enc2)
------------------------------------------------------------
DECLARE @labreq2 BIGINT, @labres2 BIGINT;

INSERT dbo.lab_requests (encounter_id, requested_by, note)
VALUES (@enc2, @u_doc2, N'Yêu cầu CBC để đánh giá nhiễm trùng');
SELECT @labreq2 = SCOPE_IDENTITY();

INSERT dbo.lab_results (lab_request_id, test_code, result_text, result_value, units, normal_range, performed_by, performed_at)
VALUES (@labreq2, N'CBC', N'Bình thường', N'WBC 7.2; Hb 13.5; PLT 250', N'--', N'--', @u_lab, '2025-10-01 10:30:00 +07:00');
SELECT @labres2 = SCOPE_IDENTITY();

------------------------------------------------------------
-- 10) IMAGING REQUESTS/RESULTS (cho enc2)
------------------------------------------------------------
DECLARE @imgreq2 BIGINT, @imgres2 BIGINT;

INSERT dbo.imaging_requests (encounter_id, requested_by, note)
VALUES (@enc2, @u_doc2, N'X-quang ngực thẳng CXR do ho kéo dài');
SELECT @imgreq2 = SCOPE_IDENTITY();

INSERT dbo.imaging_results (imaging_request_id, report_text, performed_by, performed_at)
VALUES (@imgreq2, N'Không thấy tổn thương nhu mô phổi; tim không to', @u_rad, '2025-10-01 11:15:00 +07:00');
SELECT @imgres2 = SCOPE_IDENTITY();

------------------------------------------------------------
-- 11) FILE ATTACHMENTS (gắn vào kết quả xét nghiệm/chẩn đoán hình ảnh)
------------------------------------------------------------
INSERT dbo.files (owner_user_id, object_type, object_id, file_path, file_name, mime_type, file_size, uploaded_by)
VALUES
(@u_pat2, N'lab_result',     @labres2, N'/files/lab/2025/10/01', N'cbc_phan_tich.pdf',  N'application/pdf', 120345, @u_lab),
(@u_pat2, N'imaging_result', @imgres2, N'/files/img/2025/10/01', N'cxr_bao_cao.pdf',     N'application/pdf', 256789, @u_rad);

------------------------------------------------------------
-- 12) INVOICES & ITEMS & PAYMENTS
------------------------------------------------------------
DECLARE @inv1 BIGINT, @inv2 BIGINT;

-- Hóa đơn cho enc1 (khám tổng quát)
INSERT dbo.invoices (patient_id, encounter_id, created_by, status)
VALUES (@u_pat1, @enc1, @u_acc, N'unpaid');
SELECT @inv1 = SCOPE_IDENTITY();

INSERT dbo.invoice_items (invoice_id, service_id, description, qty, unit_price)
VALUES
(@inv1, @svc_consult, NULL, 1, @price_consult);

-- Hóa đơn cho enc2 (khám + CBC + CXR + thuốc)
INSERT dbo.invoices (patient_id, encounter_id, created_by, status)
VALUES (@u_pat2, @enc2, @u_acc, N'unpaid');
SELECT @inv2 = SCOPE_IDENTITY();

INSERT dbo.invoice_items (invoice_id, service_id, description, qty, unit_price)
VALUES
(@inv2, @svc_consult, NULL, 1, @price_consult),
(@inv2, @svc_cbc,     NULL, 1, @price_cbc),
(@inv2, @svc_cxr,     NULL, 1, @price_cxr),
-- thuốc kê đơn: có thể để service_id NULL, ghi diễn giải + đơn giá/viên
(@inv2, NULL, N'Amoxicillin 500mg (20 viên)', 20, @price_amox);

-- Trigger sẽ tự cập nhật invoices.total_amount theo invoice_items

-- Thanh toán: enc1 trả đủ; enc2 trả đủ
INSERT dbo.payments (invoice_id, paid_by, amount, method, reference)
VALUES
(@inv1, @u_acc, (1 * @price_consult), N'cash', N'RCPT-INV1-001'),
(@inv2, @u_acc, (@price_consult + @price_cbc + @price_cxr + 20 * @price_amox), N'cash', N'RCPT-INV2-001');

-- Cập nhật trạng thái hóa đơn về 'paid'
UPDATE dbo.invoices SET status = N'paid' WHERE id IN (@inv1, @inv2);

------------------------------------------------------------
-- 13) NOTIFICATIONS (ví dụ thủ công)
------------------------------------------------------------
INSERT dbo.notifications (user_id, appointment_id, type, channel, scheduled_at, status, payload)
VALUES
(@u_pat1, @appt1, N'reminder', N'push', '2025-09-30 09:00:00 +07:00', N'pending', 
 N'Nhắc lịch: Khám lúc 09:00 01/10/2025'),
(@u_pat2, @appt2, N'reminder', N'push', '2025-09-30 09:00:00 +07:00', N'pending', 
 N'Nhắc lịch: Khám lúc 09:00 01/10/2025');

------------------------------------------------------------
-- 14) RATINGS (đánh giá dịch vụ/bác sĩ)
------------------------------------------------------------
INSERT dbo.ratings (patient_id, doctor_id, service_id, rating, comment)
VALUES
(@u_pat1, @u_doc1, @svc_consult, 5, N'Bác sĩ tư vấn kỹ, rất hài lòng'),
(@u_pat2, @u_doc2, @svc_consult, 4, N'Nhiệt tình, giải thích rõ ràng');

------------------------------------------------------------
-- 15) PAYROLL (kỳ lương & entries)
------------------------------------------------------------
DECLARE @prd1 BIGINT;
INSERT dbo.payroll_periods (start_date, end_date) VALUES ('2025-09-01', '2025-09-30');
SELECT @prd1 = SCOPE_IDENTITY();

INSERT dbo.payroll_entries (period_id, staff_user_id, base_salary, bonus, deductions, net_salary)
VALUES
(@prd1, @u_doc1, 30000000.00, 2000000.00, 500000.00, 31500000.00),
(@prd1, @u_doc2, 32000000.00, 1000000.00, 0.00,      33000000.00),
(@prd1, @u_rece, 12000000.00, 300000.00,  0.00,      12300000.00),
(@prd1, @u_lab,  15000000.00, 500000.00,  200000.00, 15300000.00),
(@prd1, @u_rad,  16000000.00, 400000.00,  0.00,      16400000.00),
(@prd1, @u_acc,  18000000.00, 0.00,       0.00,      18000000.00);

------------------------------------------------------------
-- 16) ACTIVITY LOGS (một vài hành động mẫu)
------------------------------------------------------------
INSERT dbo.activity_logs (user_id, action, object_type, object_id, details, ip_address)
VALUES
(@u_rece, N'create', N'appointment', @appt1, N'Tạo lịch cho MRN-0001', N'192.168.1.10'),
(@u_rece, N'create', N'appointment', @appt2, N'Tạo lịch cho MRN-0002', N'192.168.1.10'),
(@u_doc2, N'order',  N'lab_request', @labreq2, N'Chỉ định CBC', N'192.168.1.20'),
(@u_rad,  N'upload', N'file',        NULL,     N'Đính kèm báo cáo CXR', N'192.168.1.30');

COMMIT TRAN;

------------------------------------------------------------
-- 17) QUICK CHECKS
------------------------------------------------------------
SELECT TOP 10 id, email, role FROM dbo.users ORDER BY id;
SELECT TOP 10 * FROM dbo.specialties;
SELECT TOP 10 * FROM dbo.doctor_schedules ORDER BY schedule_date, start_time;
SELECT TOP 10 id, patient_id, doctor_id, appointment_start, appointment_end, status FROM dbo.appointments ORDER BY id;
SELECT TOP 10 * FROM dbo.encounters ORDER BY id;
SELECT TOP 10 * FROM dbo.prescriptions ORDER BY id;
SELECT TOP 10 * FROM dbo.lab_requests ORDER BY id;
SELECT TOP 10 * FROM dbo.imaging_requests ORDER BY id;
SELECT TOP 10 id, total_amount, status FROM dbo.invoices ORDER BY id;
SELECT TOP 10 * FROM dbo.payments ORDER BY id;
SELECT TOP 10 * FROM dbo.notifications ORDER BY id;
SELECT TOP 10 * FROM dbo.ratings ORDER BY id;
SELECT TOP 10 * FROM dbo.payroll_entries ORDER BY id;
SELECT TOP 10 * FROM dbo.activity_logs ORDER BY id;
