-- Fix trigger to allow patient_id NULL (for walk-in patients)
ALTER TRIGGER dbo.trg_appointments_prevent_overlap
ON dbo.appointments
INSTEAD OF INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Table variable with patient_id NULL and walk_in_patient_id added
    DECLARE @ins TABLE (
      id BIGINT NULL,
      patient_id BIGINT NULL,  -- CHANGED: Allow NULL for walk-in patients
      walk_in_patient_id BIGINT NULL,  -- NEW: For walk-in patients
      doctor_id BIGINT NOT NULL,
      created_by BIGINT NULL,
      appointment_start DATETIMEOFFSET NOT NULL,
      appointment_end DATETIMEOFFSET NOT NULL,
      status NVARCHAR(50) NULL,
      source NVARCHAR(50) NULL,
      reason NVARCHAR(MAX) NULL,
      cancellation_reason NVARCHAR(MAX) NULL,
      rescheduled_from_appointment_id BIGINT NULL,
      reminder_sent BIT NULL,
      rn INT IDENTITY(1,1) PRIMARY KEY
    );

    INSERT @ins (id, patient_id, walk_in_patient_id, doctor_id, created_by, appointment_start, appointment_end,
                 status, source, reason, cancellation_reason, rescheduled_from_appointment_id, reminder_sent)
    SELECT id, patient_id, walk_in_patient_id, doctor_id, created_by, appointment_start, appointment_end,
           status, source, reason, cancellation_reason, rescheduled_from_appointment_id, reminder_sent
    FROM inserted;

    -- 1) Check for overlapping appointments with same doctor
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

    -- 2) Check for overlapping within current batch
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

    -- 3) Perform UPDATE or INSERT
    IF EXISTS (SELECT 1 FROM deleted) -- UPDATE
    BEGIN
      UPDATE a
         SET patient_id = i.patient_id,
             walk_in_patient_id = i.walk_in_patient_id,  -- NEW
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
        patient_id, walk_in_patient_id, doctor_id, created_by, appointment_start, appointment_end,  -- Added walk_in_patient_id
        status, source, reason, cancellation_reason, rescheduled_from_appointment_id,
        reminder_sent, created_at
      )
      SELECT
        patient_id, walk_in_patient_id, doctor_id, created_by, appointment_start, appointment_end,  -- Added walk_in_patient_id
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

PRINT 'Trigger trg_appointments_prevent_overlap updated successfully';
