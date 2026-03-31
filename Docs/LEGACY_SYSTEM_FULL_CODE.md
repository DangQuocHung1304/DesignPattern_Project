# LEGACY_SYSTEM_FULL_CODE

Tai lieu nay tai hien ma nguon ban dau (legacy/original) cho 12 chuc nang trong he thong phong kham Healthy System, truoc khi ap dung cac mau thiet ke.

Luu y:
- Cac class duoi day co y mo ta code cu: nhieu if-else/switch-case, khoi tao truc tiep bang new, su dung static global, coupling cao.
- Day la tai lieu phuc vu bao cao mon hoc, khong phai code production.

## 1) SystemConfiguration (Legacy Static Global)
```csharp
using System;
using System.Collections.Generic;

namespace HealthySystem.API.Legacy
{
    public static class SystemConfiguration
    {
        public static string ClinicName = "Healthy System General Clinic";
        public static string ClinicCode = "HSC-01";
        public static string BranchName = "District 1 Main Branch";
        public static string BranchAddress = "123 Nguyen Hue, Ho Chi Minh City";
        public static string Hotline = "19001234";
        public static string SupportEmail = "support@healthysystem.local";
        public static string DefaultTimezone = "SE Asia Standard Time";
        public static string Language = "vi-VN";
        public static string Environment = "Development";

        public static string DbServer = "(localdb)\\MSSQLLocalDB";
        public static string DbName = "HealthySystemDb";
        public static string DbUser = "sa";
        public static string DbPassword = "P@ssw0rd123";

        public static string JwtIssuer = "HealthySystemIssuer";
        public static string JwtAudience = "HealthySystemAudience";
        public static string JwtSecret = "THIS_IS_A_HARDCODED_SECRET_KEY_123456";

        public static string EmailApiBaseUrl = "https://legacy-mail-gateway.local/api";
        public static string SmsApiBaseUrl = "https://legacy-sms-gateway.local/api";
        public static string InsuranceApiBaseUrl = "https://insurance-partner.local/api";
        public static string InsuranceApiKey = "LEGACY_INSURANCE_KEY_ABC";

        public static decimal DefaultConsultationFee = 250000m;
        public static decimal DefaultAfterHoursSurcharge = 50000m;
        public static decimal DefaultInsuranceDiscountPercent = 30m;
        public static decimal DefaultLoyaltyDiscountAmount = 20000m;
        public static decimal VatPercent = 8m;

        public static int MaxAppointmentsPerHour = 12;
        public static int MaxReminderRetryCount = 3;
        public static int ReminderRetryDelaySeconds = 5;
        public static int VisitAutoCloseHour = 22;
        public static int VisitStartBufferMinute = 15;

        public static bool EnableEmail = true;
        public static bool EnableSms = true;
        public static bool EnableInsurance = true;
        public static bool EnableLoyaltyProgram = true;
        public static bool EnableWalkInPatient = true;

        public static List<string> DefaultDoctorTitles = new List<string>();
        public static Dictionary<string, bool> FeatureFlags = new Dictionary<string, bool>();
        public static Dictionary<string, string> RoleDefaultDashboard = new Dictionary<string, string>();

        static SystemConfiguration()
        {
            DefaultDoctorTitles = new List<string>
            {
                "BS.",
                "TS.BS.",
                "PGS.TS.BS."
            };

            FeatureFlags = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase)
            {
                { "UseLegacyBilling", true },
                { "UseLegacyReminder", true },
                { "UseLegacyStateMachine", true },
                { "AllowManualStatusOverride", true },
                { "AllowCashAtReception", true }
            };

            RoleDefaultDashboard = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "doctor", "/doctor-dashboard.html" },
                { "patient", "/patient-dashboard.html" },
                { "reception", "/reception-dashboard.html" },
                { "accountant", "/accountant-dashboard.html" },
                { "admin", "/admin-dashboard.html" }
            };
        }

        public static string BuildConnectionString()
        {
            return "Server=" + DbServer + ";Database=" + DbName + ";User Id=" + DbUser + ";Password=" + DbPassword + ";TrustServerCertificate=True;";
        }

        public static string GetDashboardByRole(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                return "/login.html";
            }

            if (RoleDefaultDashboard.ContainsKey(role))
            {
                return RoleDefaultDashboard[role];
            }

            return "/login.html";
        }

        public static bool IsAfterHours(DateTime localTime)
        {
            return localTime.Hour < 8 || localTime.Hour >= 17;
        }
    }
}
```

## 2) ActorService (if-else role classification)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace HealthySystem.API.Legacy
{
    public class ActorService
    {
        private readonly string _connectionString;
        private readonly string _auditFilePath;
        private readonly string _defaultPassword;

        public ActorService()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();
            _auditFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "legacy-actor-audit.log");
            _defaultPassword = "123456";
        }

        public LegacyActorProfile CreateProfile(string role, Dictionary<string, string> payload)
        {
            if (payload == null)
            {
                throw new ArgumentNullException(nameof(payload));
            }

            if (string.IsNullOrWhiteSpace(role))
            {
                throw new InvalidOperationException("Role is required.");
            }

            var normalizedRole = role.Trim().ToLowerInvariant();
            var firstName = GetValue(payload, "FirstName");
            var lastName = GetValue(payload, "LastName");
            var email = GetValue(payload, "Email");
            var phone = GetValue(payload, "Phone");

            ValidateRequired(firstName, "FirstName");
            ValidateRequired(lastName, "LastName");
            ValidateRequired(email, "Email");

            if (normalizedRole == "doctor")
            {
                var title = GetValue(payload, "Title", "BS.");
                var department = GetValue(payload, "Department", "General");
                var specialty = GetValue(payload, "Specialty", "Internal Medicine");
                var staffCode = "DOC-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");

                var userId = InsertUserRecord(firstName, lastName, email, phone, "doctor");
                InsertStaffProfile(userId, staffCode, title, department);
                InsertDoctorExtraProfile(userId, specialty, 0);
                CreateDefaultDoctorSchedule(userId);
                WriteAudit("CREATE_DOCTOR", email, "Doctor profile created with default schedule.");

                return new LegacyActorProfile
                {
                    UserId = userId,
                    Role = "doctor",
                    DisplayName = firstName + " " + lastName,
                    Email = email,
                    Phone = phone,
                    StaffCode = staffCode,
                    MedicalRecordNumber = null,
                    Department = department,
                    Message = "Doctor profile created successfully."
                };
            }
            else if (normalizedRole == "patient")
            {
                var dateOfBirth = GetValue(payload, "DateOfBirth", "1990-01-01");
                var gender = GetValue(payload, "Gender", "unknown");
                var address = GetValue(payload, "Address", "");
                var mrn = "MRN-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");

                var userId = InsertUserRecord(firstName, lastName, email, phone, "patient");
                InsertPatientProfile(userId, mrn, dateOfBirth, gender, address);
                WriteAudit("CREATE_PATIENT", email, "Patient profile created with default medical record number.");

                return new LegacyActorProfile
                {
                    UserId = userId,
                    Role = "patient",
                    DisplayName = firstName + " " + lastName,
                    Email = email,
                    Phone = phone,
                    StaffCode = null,
                    MedicalRecordNumber = mrn,
                    Department = null,
                    Message = "Patient profile created successfully."
                };
            }
            else if (normalizedRole == "reception")
            {
                var title = GetValue(payload, "Title", "Receptionist");
                var department = GetValue(payload, "Department", "Front Desk");
                var shift = GetValue(payload, "Shift", "Morning");
                var staffCode = "REC-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");

                var userId = InsertUserRecord(firstName, lastName, email, phone, "reception");
                InsertStaffProfile(userId, staffCode, title, department);
                InsertReceptionShift(userId, shift);
                WriteAudit("CREATE_RECEPTION", email, "Reception profile created and shift assigned.");

                return new LegacyActorProfile
                {
                    UserId = userId,
                    Role = "reception",
                    DisplayName = firstName + " " + lastName,
                    Email = email,
                    Phone = phone,
                    StaffCode = staffCode,
                    MedicalRecordNumber = null,
                    Department = department,
                    Message = "Reception profile created successfully."
                };
            }
            else
            {
                WriteAudit("CREATE_UNKNOWN_ROLE", email, "Unsupported role requested: " + role);
                throw new InvalidOperationException("Unsupported role: " + role);
            }
        }

        private long InsertUserRecord(string firstName, string lastName, string email, string phone, string role)
        {
            var passwordHash = ComputeSha256(_defaultPassword);
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO Users (PublicId, FirstName, LastName, FullName, Email, Phone, Role, Status, PasswordHash, CreatedAt, UpdatedAt)
VALUES (NEWID(), @FirstName, @LastName, @FullName, @Email, @Phone, @Role, 'active', @PasswordHash, SYSUTCDATETIME(), SYSUTCDATETIME());
SELECT CAST(SCOPE_IDENTITY() AS BIGINT);
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@FirstName", firstName);
            command.Parameters.AddWithValue("@LastName", lastName);
            command.Parameters.AddWithValue("@FullName", firstName + " " + lastName);
            command.Parameters.AddWithValue("@Email", email);
            command.Parameters.AddWithValue("@Phone", (object?)phone ?? DBNull.Value);
            command.Parameters.AddWithValue("@Role", role);
            command.Parameters.AddWithValue("@PasswordHash", passwordHash);

            var result = command.ExecuteScalar();
            return Convert.ToInt64(result);
        }

        private void InsertStaffProfile(long userId, string staffCode, string title, string department)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO StaffProfiles (UserId, StaffCode, Title, Department, CreatedAt, UpdatedAt)
VALUES (@UserId, @StaffCode, @Title, @Department, SYSUTCDATETIME(), SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@UserId", userId);
            command.Parameters.AddWithValue("@StaffCode", staffCode);
            command.Parameters.AddWithValue("@Title", title);
            command.Parameters.AddWithValue("@Department", department);
            command.ExecuteNonQuery();
        }

        private void InsertDoctorExtraProfile(long userId, string specialty, int yearsOfExperience)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO DoctorProfiles (UserId, Biography, Education, YearsOfExperience, CreatedAt, UpdatedAt)
VALUES (@UserId, @Biography, @Education, @YearsOfExperience, SYSUTCDATETIME(), SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@UserId", userId);
            command.Parameters.AddWithValue("@Biography", "Doctor from " + specialty + " department.");
            command.Parameters.AddWithValue("@Education", "Legacy medical curriculum");
            command.Parameters.AddWithValue("@YearsOfExperience", yearsOfExperience);
            command.ExecuteNonQuery();
        }

        private void CreateDefaultDoctorSchedule(long userId)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            for (int day = 1; day <= 5; day++)
            {
                var sql = @"
INSERT INTO DoctorSchedules (DoctorId, DayOfWeek, StartTime, EndTime, MaxAppointments, IsActive, CreatedAt, UpdatedAt)
VALUES (@DoctorId, @DayOfWeek, '08:00', '17:00', @MaxAppointments, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
";

                using var command = new SqlCommand(sql, connection);
                command.Parameters.AddWithValue("@DoctorId", userId);
                command.Parameters.AddWithValue("@DayOfWeek", day);
                command.Parameters.AddWithValue("@MaxAppointments", SystemConfiguration.MaxAppointmentsPerHour * 8);
                command.ExecuteNonQuery();
            }
        }

        private void InsertPatientProfile(long userId, string mrn, string dateOfBirth, string gender, string address)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO PatientProfiles (UserId, MedicalRecordNumber, EmergencyContactName, EmergencyContactPhone, InsuranceNumber, CreatedAt, UpdatedAt)
VALUES (@UserId, @Mrn, @EmergencyContactName, @EmergencyContactPhone, @InsuranceNumber, SYSUTCDATETIME(), SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@UserId", userId);
            command.Parameters.AddWithValue("@Mrn", mrn);
            command.Parameters.AddWithValue("@EmergencyContactName", "N/A");
            command.Parameters.AddWithValue("@EmergencyContactPhone", "N/A");
            command.Parameters.AddWithValue("@InsuranceNumber", "");
            command.ExecuteNonQuery();

            var updateUserSql = @"
UPDATE Users
SET DateOfBirth = @DateOfBirth, Gender = @Gender, Address = @Address, UpdatedAt = SYSUTCDATETIME()
WHERE Id = @UserId;
";

            using var updateCommand = new SqlCommand(updateUserSql, connection);
            updateCommand.Parameters.AddWithValue("@DateOfBirth", DateTime.Parse(dateOfBirth));
            updateCommand.Parameters.AddWithValue("@Gender", gender);
            updateCommand.Parameters.AddWithValue("@Address", address);
            updateCommand.Parameters.AddWithValue("@UserId", userId);
            updateCommand.ExecuteNonQuery();
        }

        private void InsertReceptionShift(long userId, string shift)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO ReceptionShifts (ReceptionistId, ShiftName, IsDefault, CreatedAt)
VALUES (@ReceptionistId, @ShiftName, 1, SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@ReceptionistId", userId);
            command.Parameters.AddWithValue("@ShiftName", shift);
            command.ExecuteNonQuery();
        }

        private static string GetValue(Dictionary<string, string> payload, string key, string fallback = "")
        {
            if (payload.ContainsKey(key) && !string.IsNullOrWhiteSpace(payload[key]))
            {
                return payload[key].Trim();
            }

            return fallback;
        }

        private static void ValidateRequired(string value, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException(fieldName + " is required.");
            }
        }

        private void WriteAudit(string action, string subject, string detail)
        {
            var line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " | " + action + " | " + subject + " | " + detail;
            File.AppendAllText(_auditFilePath, line + Environment.NewLine);
        }

        private static string ComputeSha256(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes);
        }
    }

    public class LegacyActorProfile
    {
        public long UserId { get; set; }
        public string Role { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string Email { get; set; } = "";
        public string? Phone { get; set; }
        public string? StaffCode { get; set; }
        public string? MedicalRecordNumber { get; set; }
        public string? Department { get; set; }
        public string Message { get; set; } = "";
    }
}
```

## 3) ReminderService (large function, self-format + self-send)
```csharp
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HealthySystem.API.Legacy
{
    public class ReminderService
    {
        private readonly HttpClient _httpClient;
        private readonly string _emailApiBaseUrl;
        private readonly string _smsApiBaseUrl;
        private readonly string _logFile;

        public ReminderService()
        {
            _httpClient = new HttpClient();
            _emailApiBaseUrl = SystemConfiguration.EmailApiBaseUrl;
            _smsApiBaseUrl = SystemConfiguration.SmsApiBaseUrl;
            _logFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "legacy-reminder.log");
        }

        public async Task<LegacyReminderResult> SendReminderAsync(string role, LegacyReminderInput input)
        {
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input));
            }

            var normalizedRole = (role ?? "").Trim().ToLowerInvariant();
            var result = new LegacyReminderResult
            {
                AppointmentCode = input.AppointmentCode,
                DoctorSent = false,
                PatientSent = false,
                Message = "No reminder sent."
            };

            if (normalizedRole == "doctor")
            {
                var doctorSubject = "[Doctor Reminder] Appointment " + input.AppointmentCode;
                var doctorBody = "Doctor " + input.DoctorName + ", you have an appointment with patient " + input.PatientName +
                                 " at " + input.StartAt.ToString("HH:mm dd/MM/yyyy") + " in room " + input.Room + ".";

                if (!string.IsNullOrWhiteSpace(input.DoctorEmail) && SystemConfiguration.EnableEmail)
                {
                    result.DoctorSent = await SendEmailDirectAsync(input.DoctorEmail, doctorSubject, doctorBody);
                }

                if (!result.DoctorSent && !string.IsNullOrWhiteSpace(input.DoctorPhone) && SystemConfiguration.EnableSms)
                {
                    result.DoctorSent = await SendSmsDirectAsync(input.DoctorPhone, "Doctor reminder: " + input.AppointmentCode + " at " + input.StartAt.ToString("HH:mm"));
                }

                result.PatientSent = false;
                result.Message = result.DoctorSent ? "Doctor reminder sent." : "Doctor reminder failed.";
            }
            else if (normalizedRole == "patient")
            {
                var patientSubject = "[Patient Reminder] Upcoming Visit";
                var patientBody = "Dear " + input.PatientName + ", this is a reminder for your visit with " + input.DoctorName +
                                  " at " + input.StartAt.ToString("HH:mm dd/MM/yyyy") + ". Please arrive 15 minutes early.";

                if (!string.IsNullOrWhiteSpace(input.PatientPhone) && SystemConfiguration.EnableSms)
                {
                    result.PatientSent = await SendSmsDirectAsync(input.PatientPhone, patientBody);
                }

                if (!result.PatientSent && !string.IsNullOrWhiteSpace(input.PatientEmail) && SystemConfiguration.EnableEmail)
                {
                    result.PatientSent = await SendEmailDirectAsync(input.PatientEmail, patientSubject, patientBody);
                }

                result.DoctorSent = false;
                result.Message = result.PatientSent ? "Patient reminder sent." : "Patient reminder failed.";
            }
            else
            {
                var doctorSubject = "[Mixed Reminder] Appointment " + input.AppointmentCode;
                var doctorBody = "Doctor " + input.DoctorName + ", appointment with " + input.PatientName + " at " + input.StartAt.ToString("HH:mm dd/MM/yyyy");
                var patientSubject = "[Mixed Reminder] Upcoming Visit";
                var patientBody = "Patient " + input.PatientName + ", appointment with " + input.DoctorName + " at " + input.StartAt.ToString("HH:mm dd/MM/yyyy");

                if (!string.IsNullOrWhiteSpace(input.DoctorEmail))
                {
                    result.DoctorSent = await SendEmailDirectAsync(input.DoctorEmail, doctorSubject, doctorBody);
                }

                if (!string.IsNullOrWhiteSpace(input.PatientPhone))
                {
                    result.PatientSent = await SendSmsDirectAsync(input.PatientPhone, patientBody);
                }

                result.Message = "Fallback reminder path executed.";
            }

            WriteLog(result, normalizedRole, input);
            return result;
        }

        private async Task<bool> SendEmailDirectAsync(string email, string subject, string body)
        {
            var payload = new
            {
                to = email,
                subject,
                body,
                clinicCode = SystemConfiguration.ClinicCode,
                priority = "normal"
            };

            var json = JsonSerializer.Serialize(payload);
            var response = await _httpClient.PostAsync(
                _emailApiBaseUrl + "/send-email",
                new StringContent(json, Encoding.UTF8, "application/json"));

            return response.IsSuccessStatusCode;
        }

        private async Task<bool> SendSmsDirectAsync(string phone, string message)
        {
            var payload = new
            {
                phone,
                message,
                sender = "HealthySystem",
                channel = "transactional"
            };

            var json = JsonSerializer.Serialize(payload);
            var response = await _httpClient.PostAsync(
                _smsApiBaseUrl + "/send-sms",
                new StringContent(json, Encoding.UTF8, "application/json"));

            return response.IsSuccessStatusCode;
        }

        private void WriteLog(LegacyReminderResult result, string role, LegacyReminderInput input)
        {
            var line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") +
                       " | role=" + role +
                       " | appt=" + input.AppointmentCode +
                       " | doctorSent=" + result.DoctorSent +
                       " | patientSent=" + result.PatientSent +
                       " | message=" + result.Message;

            File.AppendAllText(_logFile, line + Environment.NewLine);
        }
    }

    public class LegacyReminderInput
    {
        public string AppointmentCode { get; set; } = "";
        public string DoctorName { get; set; } = "";
        public string PatientName { get; set; } = "";
        public string? DoctorEmail { get; set; }
        public string? DoctorPhone { get; set; }
        public string? PatientEmail { get; set; }
        public string? PatientPhone { get; set; }
        public DateTime StartAt { get; set; }
        public string Room { get; set; } = "";
    }

    public class LegacyReminderResult
    {
        public string AppointmentCode { get; set; } = "";
        public bool DoctorSent { get; set; }
        public bool PatientSent { get; set; }
        public string Message { get; set; } = "";
    }
}
```

## 4) ClinicalNoteService (manual long string concatenation)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Text;

namespace HealthySystem.API.Legacy
{
    public class ClinicalNoteService
    {
        private readonly string _connectionString;

        public ClinicalNoteService()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();
        }

        public string CreateSoapNoteAndSave(LegacySoapInput input)
        {
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input));
            }

            string note = "";
            note += "==================================================" + Environment.NewLine;
            note += "HEALTHY SYSTEM CLINICAL SOAP NOTE" + Environment.NewLine;
            note += "==================================================" + Environment.NewLine;
            note += "Encounter Code: " + input.EncounterCode + Environment.NewLine;
            note += "Appointment Code: " + input.AppointmentCode + Environment.NewLine;
            note += "Date Time: " + input.VisitTime.ToString("yyyy-MM-dd HH:mm:ss") + Environment.NewLine;
            note += "Doctor: " + input.DoctorName + Environment.NewLine;
            note += "Patient: " + input.PatientName + Environment.NewLine;
            note += "MRN: " + input.MedicalRecordNumber + Environment.NewLine;
            note += "--------------------------------------------------" + Environment.NewLine;
            note += "S - SUBJECTIVE" + Environment.NewLine;
            note += "Chief Complaint: " + input.ChiefComplaint + Environment.NewLine;
            note += "History of Present Illness: " + input.HistoryOfPresentIllness + Environment.NewLine;
            note += "Past Medical History: " + input.PastMedicalHistory + Environment.NewLine;
            note += "Allergies: " + input.Allergies + Environment.NewLine;
            note += "Current Medications: " + input.CurrentMedications + Environment.NewLine;
            note += "--------------------------------------------------" + Environment.NewLine;
            note += "O - OBJECTIVE" + Environment.NewLine;
            note += "Temperature: " + input.Temperature + " C" + Environment.NewLine;
            note += "Pulse: " + input.Pulse + " bpm" + Environment.NewLine;
            note += "Blood Pressure: " + input.BloodPressure + Environment.NewLine;
            note += "Respiratory Rate: " + input.RespiratoryRate + " bpm" + Environment.NewLine;
            note += "SpO2: " + input.SpO2 + " %" + Environment.NewLine;
            note += "Weight: " + input.Weight + " kg" + Environment.NewLine;
            note += "Physical Exam: " + input.PhysicalExam + Environment.NewLine;
            note += "Lab Findings: " + input.LabFindings + Environment.NewLine;
            note += "Imaging Findings: " + input.ImagingFindings + Environment.NewLine;
            note += "--------------------------------------------------" + Environment.NewLine;
            note += "A - ASSESSMENT" + Environment.NewLine;
            note += "Primary Diagnosis: " + input.PrimaryDiagnosis + Environment.NewLine;
            note += "Secondary Diagnosis: " + input.SecondaryDiagnosis + Environment.NewLine;
            note += "Clinical Impression: " + input.ClinicalImpression + Environment.NewLine;
            note += "Risk Level: " + input.RiskLevel + Environment.NewLine;
            note += "--------------------------------------------------" + Environment.NewLine;
            note += "P - PLAN" + Environment.NewLine;
            note += "Treatment Plan: " + input.TreatmentPlan + Environment.NewLine;
            note += "Prescription: " + input.Prescription + Environment.NewLine;
            note += "Lab Orders: " + input.LabOrders + Environment.NewLine;
            note += "Follow-up Plan: " + input.FollowUpPlan + Environment.NewLine;
            note += "Patient Instructions: " + input.PatientInstructions + Environment.NewLine;
            note += "Emergency Advice: " + input.EmergencyAdvice + Environment.NewLine;
            note += "--------------------------------------------------" + Environment.NewLine;
            note += "Note entered by: " + input.DoctorName + Environment.NewLine;
            note += "Generated at: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + Environment.NewLine;
            note += "==================================================" + Environment.NewLine;

            SaveNoteToDatabase(input.EncounterCode, note, input.DoctorUserId);
            return note;
        }

        private void SaveNoteToDatabase(string encounterCode, string note, long doctorUserId)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO ClinicalNotes (EncounterCode, NoteType, NoteContent, EnteredBy, CreatedAt, UpdatedAt)
VALUES (@EncounterCode, 'SOAP', @NoteContent, @EnteredBy, SYSUTCDATETIME(), SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@EncounterCode", encounterCode);
            command.Parameters.AddWithValue("@NoteContent", note);
            command.Parameters.AddWithValue("@EnteredBy", doctorUserId);
            command.ExecuteNonQuery();
        }
    }

    public class LegacySoapInput
    {
        public string EncounterCode { get; set; } = "";
        public string AppointmentCode { get; set; } = "";
        public DateTime VisitTime { get; set; }
        public string DoctorName { get; set; } = "";
        public long DoctorUserId { get; set; }
        public string PatientName { get; set; } = "";
        public string MedicalRecordNumber { get; set; } = "";
        public string ChiefComplaint { get; set; } = "";
        public string HistoryOfPresentIllness { get; set; } = "";
        public string PastMedicalHistory { get; set; } = "";
        public string Allergies { get; set; } = "";
        public string CurrentMedications { get; set; } = "";
        public decimal Temperature { get; set; }
        public int Pulse { get; set; }
        public string BloodPressure { get; set; } = "";
        public int RespiratoryRate { get; set; }
        public int SpO2 { get; set; }
        public decimal Weight { get; set; }
        public string PhysicalExam { get; set; } = "";
        public string LabFindings { get; set; } = "";
        public string ImagingFindings { get; set; } = "";
        public string PrimaryDiagnosis { get; set; } = "";
        public string SecondaryDiagnosis { get; set; } = "";
        public string ClinicalImpression { get; set; } = "";
        public string RiskLevel { get; set; } = "Medium";
        public string TreatmentPlan { get; set; } = "";
        public string Prescription { get; set; } = "";
        public string LabOrders { get; set; } = "";
        public string FollowUpPlan { get; set; } = "";
        public string PatientInstructions { get; set; } = "";
        public string EmergencyAdvice { get; set; } = "";
    }
}
```

## 5) InsuranceClaimService (direct third-party dependency, no adapter)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Threading.Tasks;
using ThirdPartyInsuranceSdk;

namespace HealthySystem.API.Legacy
{
    public class InsuranceClaimService
    {
        private readonly string _connectionString;
        private readonly ClaimGatewayClient _partnerClient;

        public InsuranceClaimService()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();

            // Truc tiep phu thuoc vao SDK ben thu 3
            _partnerClient = new ClaimGatewayClient(
                SystemConfiguration.InsuranceApiBaseUrl,
                SystemConfiguration.InsuranceApiKey,
                timeoutSeconds: 30,
                useSandbox: SystemConfiguration.Environment != "Production");
        }

        public async Task<LegacyInsuranceClaimResult> SubmitClaimAsync(LegacyInsuranceClaimRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var partnerRequest = new ClaimSubmissionDto
            {
                RequestId = request.ClaimCode,
                PatientCode = request.PatientCode,
                PayerPolicyNumber = request.InsuranceNumber,
                DiagnosisCode = request.DiagnosisCode,
                TreatmentDate = request.VisitDate,
                TotalAmount = request.TotalAmount,
                CoveredAmount = request.ExpectedCoveredAmount,
                Currency = "VND",
                HospitalCode = SystemConfiguration.ClinicCode,
                Notes = request.Notes
            };

            var partnerResponse = await _partnerClient.SubmitClaimAsync(partnerRequest);

            SaveClaimLog(request, partnerResponse);

            return new LegacyInsuranceClaimResult
            {
                ClaimCode = request.ClaimCode,
                Approved = partnerResponse.IsApproved,
                PartnerReference = partnerResponse.ReferenceId,
                ApprovedAmount = partnerResponse.ApprovedAmount,
                Message = partnerResponse.Message,
                RawStatus = partnerResponse.StatusText
            };
        }

        public async Task<LegacyInsuranceClaimResult> QueryClaimStatusAsync(string claimCode)
        {
            var partnerResponse = await _partnerClient.GetClaimStatusAsync(claimCode);

            return new LegacyInsuranceClaimResult
            {
                ClaimCode = claimCode,
                Approved = partnerResponse.IsApproved,
                PartnerReference = partnerResponse.ReferenceId,
                ApprovedAmount = partnerResponse.ApprovedAmount,
                Message = partnerResponse.Message,
                RawStatus = partnerResponse.StatusText
            };
        }

        private void SaveClaimLog(LegacyInsuranceClaimRequest request, ClaimStatusDto response)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO InsuranceClaimLogs
(ClaimCode, PatientCode, InsuranceNumber, RequestAmount, ApprovedAmount, PartnerReference, StatusText, Message, CreatedAt)
VALUES
(@ClaimCode, @PatientCode, @InsuranceNumber, @RequestAmount, @ApprovedAmount, @PartnerReference, @StatusText, @Message, SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@ClaimCode", request.ClaimCode);
            command.Parameters.AddWithValue("@PatientCode", request.PatientCode);
            command.Parameters.AddWithValue("@InsuranceNumber", request.InsuranceNumber);
            command.Parameters.AddWithValue("@RequestAmount", request.TotalAmount);
            command.Parameters.AddWithValue("@ApprovedAmount", response.ApprovedAmount);
            command.Parameters.AddWithValue("@PartnerReference", response.ReferenceId ?? "");
            command.Parameters.AddWithValue("@StatusText", response.StatusText ?? "");
            command.Parameters.AddWithValue("@Message", response.Message ?? "");
            command.ExecuteNonQuery();
        }
    }

    public class LegacyInsuranceClaimRequest
    {
        public string ClaimCode { get; set; } = "";
        public string PatientCode { get; set; } = "";
        public string InsuranceNumber { get; set; } = "";
        public string DiagnosisCode { get; set; } = "";
        public DateTime VisitDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal ExpectedCoveredAmount { get; set; }
        public string Notes { get; set; } = "";
    }

    public class LegacyInsuranceClaimResult
    {
        public string ClaimCode { get; set; } = "";
        public bool Approved { get; set; }
        public string? PartnerReference { get; set; }
        public decimal ApprovedAmount { get; set; }
        public string Message { get; set; } = "";
        public string RawStatus { get; set; } = "";
    }
}
```

## 6) MedicalRecordService (direct DB access, no permission check, no cache)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;

namespace HealthySystem.API.Legacy
{
    public class MedicalRecordService
    {
        private readonly string _connectionString;

        public MedicalRecordService()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();
        }

        public List<LegacyMedicalRecordRow> GetMedicalHistoryByPatientCode(string patientCode)
        {
            // Legacy: khong check role, khong check ownership, khong cache
            var rows = new List<LegacyMedicalRecordRow>();

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
SELECT TOP 500
    e.EncounterCode,
    e.CreatedAt,
    e.Status,
    i.PrimaryDiagnosis,
    i.ClinicalImpression,
    i.TreatmentPlan,
    u.FullName AS DoctorName,
    a.Reason AS AppointmentReason
FROM Encounters e
LEFT JOIN EncounterInsights i ON e.EncounterCode = i.EncounterCode
LEFT JOIN Appointments a ON e.AppointmentId = a.Id
LEFT JOIN Users u ON a.DoctorId = u.Id
LEFT JOIN Users p ON a.PatientId = p.Id
WHERE p.PublicId = @PatientCode
ORDER BY e.CreatedAt DESC;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@PatientCode", patientCode);

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                rows.Add(new LegacyMedicalRecordRow
                {
                    EncounterCode = reader["EncounterCode"]?.ToString() ?? "",
                    CreatedAt = reader["CreatedAt"] as DateTime? ?? DateTime.MinValue,
                    Status = reader["Status"]?.ToString() ?? "",
                    PrimaryDiagnosis = reader["PrimaryDiagnosis"]?.ToString() ?? "",
                    ClinicalImpression = reader["ClinicalImpression"]?.ToString() ?? "",
                    TreatmentPlan = reader["TreatmentPlan"]?.ToString() ?? "",
                    DoctorName = reader["DoctorName"]?.ToString() ?? "Unknown",
                    AppointmentReason = reader["AppointmentReason"]?.ToString() ?? ""
                });
            }

            return rows;
        }

        public void AddRawMedicalNote(string patientCode, string doctorCode, string noteText)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO MedicalHistory
(PatientCode, DoctorCode, RawNote, CreatedAt)
VALUES
(@PatientCode, @DoctorCode, @RawNote, SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@PatientCode", patientCode);
            command.Parameters.AddWithValue("@DoctorCode", doctorCode);
            command.Parameters.AddWithValue("@RawNote", noteText ?? "");
            command.ExecuteNonQuery();
        }

        public string GetLatestDiagnosis(string patientCode)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
SELECT TOP 1 i.PrimaryDiagnosis
FROM EncounterInsights i
INNER JOIN Encounters e ON i.EncounterCode = e.EncounterCode
INNER JOIN Appointments a ON e.AppointmentId = a.Id
INNER JOIN Users p ON a.PatientId = p.Id
WHERE p.PublicId = @PatientCode
ORDER BY e.CreatedAt DESC;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@PatientCode", patientCode);

            var result = command.ExecuteScalar();
            return result?.ToString() ?? "No diagnosis";
        }
    }

    public class LegacyMedicalRecordRow
    {
        public string EncounterCode { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = "";
        public string PrimaryDiagnosis { get; set; } = "";
        public string ClinicalImpression { get; set; } = "";
        public string TreatmentPlan { get; set; } = "";
        public string DoctorName { get; set; } = "";
        public string AppointmentReason { get; set; } = "";
    }
}
```

## 7) VisitManager (God Object)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HealthySystem.API.Legacy
{
    public class VisitManager
    {
        private readonly string _connectionString;
        private readonly HttpClient _httpClient;
        private readonly ReminderService _reminderService;
        private readonly InvoiceCalculator _invoiceCalculator;

        public VisitManager()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();
            _httpClient = new HttpClient();
            _reminderService = new ReminderService();
            _invoiceCalculator = new InvoiceCalculator();
        }

        public async Task<LegacyVisitResult> StartVisitAsync(LegacyStartVisitInput input)
        {
            var result = new LegacyVisitResult
            {
                AppointmentCode = input.AppointmentCode,
                Success = false,
                Message = "Visit start failed."
            };

            if (!ValidateAppointment(input.AppointmentCode))
            {
                result.Message = "Appointment is not valid.";
                return result;
            }

            var encounterCode = CreateEncounter(input);
            var invoiceSummary = _invoiceCalculator.CalculateInvoice(input.InvoiceLines, input.HasInsurance, input.IsLoyalPatient, input.IsAfterHours);
            var invoiceCode = CreateInvoice(input, invoiceSummary);

            UpdateAppointmentStatus(input.AppointmentCode, "in-progress");
            LinkEncounterAndInvoice(encounterCode, invoiceCode);
            SaveVitalSigns(encounterCode, input);

            // God object tu lo notify
            await _reminderService.SendReminderAsync("doctor", new LegacyReminderInput
            {
                AppointmentCode = input.AppointmentCode,
                DoctorName = input.DoctorName,
                PatientName = input.PatientName,
                DoctorEmail = input.DoctorEmail,
                DoctorPhone = input.DoctorPhone,
                StartAt = input.VisitTime,
                Room = input.Room
            });

            await _reminderService.SendReminderAsync("patient", new LegacyReminderInput
            {
                AppointmentCode = input.AppointmentCode,
                DoctorName = input.DoctorName,
                PatientName = input.PatientName,
                PatientEmail = input.PatientEmail,
                PatientPhone = input.PatientPhone,
                StartAt = input.VisitTime,
                Room = input.Room
            });

            // God object tu goi external API de cap nhat waiting board
            await NotifyWaitingBoardAsync(input.AppointmentCode, "in-progress", input.Room);

            result.Success = true;
            result.EncounterCode = encounterCode;
            result.InvoiceCode = invoiceCode;
            result.TotalAmount = invoiceSummary.TotalAmount;
            result.Message = "Visit started successfully.";
            return result;
        }

        private bool ValidateAppointment(string appointmentCode)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
SELECT COUNT(1)
FROM Appointments
WHERE AppointmentCode = @AppointmentCode
  AND Status IN ('scheduled', 'checked-in')
  AND DeletedAt IS NULL;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@AppointmentCode", appointmentCode);
            var count = Convert.ToInt32(command.ExecuteScalar());
            return count > 0;
        }

        private string CreateEncounter(LegacyStartVisitInput input)
        {
            var encounterCode = "ENC-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO Encounters
(EncounterCode, AppointmentCode, DoctorCode, PatientCode, Status, CreatedAt, UpdatedAt)
VALUES
(@EncounterCode, @AppointmentCode, @DoctorCode, @PatientCode, 'in-progress', SYSUTCDATETIME(), SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@EncounterCode", encounterCode);
            command.Parameters.AddWithValue("@AppointmentCode", input.AppointmentCode);
            command.Parameters.AddWithValue("@DoctorCode", input.DoctorCode);
            command.Parameters.AddWithValue("@PatientCode", input.PatientCode);
            command.ExecuteNonQuery();

            return encounterCode;
        }

        private string CreateInvoice(LegacyStartVisitInput input, LegacyInvoiceSummary summary)
        {
            var invoiceCode = "INV-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO Invoices
(InvoiceCode, AppointmentCode, PatientCode, Subtotal, Discount, Surcharge, TaxAmount, TotalAmount, Status, CreatedAt, UpdatedAt)
VALUES
(@InvoiceCode, @AppointmentCode, @PatientCode, @Subtotal, @Discount, @Surcharge, @TaxAmount, @TotalAmount, 'pending', SYSUTCDATETIME(), SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@InvoiceCode", invoiceCode);
            command.Parameters.AddWithValue("@AppointmentCode", input.AppointmentCode);
            command.Parameters.AddWithValue("@PatientCode", input.PatientCode);
            command.Parameters.AddWithValue("@Subtotal", summary.Subtotal);
            command.Parameters.AddWithValue("@Discount", summary.DiscountAmount);
            command.Parameters.AddWithValue("@Surcharge", summary.SurchargeAmount);
            command.Parameters.AddWithValue("@TaxAmount", summary.TaxAmount);
            command.Parameters.AddWithValue("@TotalAmount", summary.TotalAmount);
            command.ExecuteNonQuery();

            return invoiceCode;
        }

        private void UpdateAppointmentStatus(string appointmentCode, string status)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
UPDATE Appointments
SET Status = @Status, UpdatedAt = SYSUTCDATETIME()
WHERE AppointmentCode = @AppointmentCode;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Status", status);
            command.Parameters.AddWithValue("@AppointmentCode", appointmentCode);
            command.ExecuteNonQuery();
        }

        private void LinkEncounterAndInvoice(string encounterCode, string invoiceCode)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
UPDATE Encounters
SET InvoiceCode = @InvoiceCode, UpdatedAt = SYSUTCDATETIME()
WHERE EncounterCode = @EncounterCode;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@InvoiceCode", invoiceCode);
            command.Parameters.AddWithValue("@EncounterCode", encounterCode);
            command.ExecuteNonQuery();
        }

        private void SaveVitalSigns(string encounterCode, LegacyStartVisitInput input)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO VitalSigns
(EncounterCode, Temperature, Pulse, BloodPressure, RespiratoryRate, SpO2, Weight, CreatedAt)
VALUES
(@EncounterCode, @Temperature, @Pulse, @BloodPressure, @RespiratoryRate, @SpO2, @Weight, SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@EncounterCode", encounterCode);
            command.Parameters.AddWithValue("@Temperature", input.Temperature);
            command.Parameters.AddWithValue("@Pulse", input.Pulse);
            command.Parameters.AddWithValue("@BloodPressure", input.BloodPressure);
            command.Parameters.AddWithValue("@RespiratoryRate", input.RespiratoryRate);
            command.Parameters.AddWithValue("@SpO2", input.SpO2);
            command.Parameters.AddWithValue("@Weight", input.Weight);
            command.ExecuteNonQuery();
        }

        private async Task NotifyWaitingBoardAsync(string appointmentCode, string status, string room)
        {
            var payload = new
            {
                appointmentCode,
                status,
                room,
                clinicCode = SystemConfiguration.ClinicCode
            };

            var json = JsonSerializer.Serialize(payload);
            await _httpClient.PostAsync(
                "https://legacy-waitingboard.local/api/update",
                new StringContent(json, Encoding.UTF8, "application/json"));
        }
    }

    public class LegacyStartVisitInput
    {
        public string AppointmentCode { get; set; } = "";
        public string DoctorCode { get; set; } = "";
        public string PatientCode { get; set; } = "";
        public string DoctorName { get; set; } = "";
        public string PatientName { get; set; } = "";
        public string? DoctorEmail { get; set; }
        public string? DoctorPhone { get; set; }
        public string? PatientEmail { get; set; }
        public string? PatientPhone { get; set; }
        public DateTime VisitTime { get; set; }
        public string Room { get; set; } = "";
        public bool HasInsurance { get; set; }
        public bool IsLoyalPatient { get; set; }
        public bool IsAfterHours { get; set; }
        public decimal Temperature { get; set; }
        public int Pulse { get; set; }
        public string BloodPressure { get; set; } = "";
        public int RespiratoryRate { get; set; }
        public int SpO2 { get; set; }
        public decimal Weight { get; set; }
        public LegacyInvoiceLine[] InvoiceLines { get; set; } = Array.Empty<LegacyInvoiceLine>();
    }

    public class LegacyVisitResult
    {
        public string AppointmentCode { get; set; } = "";
        public bool Success { get; set; }
        public string EncounterCode { get; set; } = "";
        public string InvoiceCode { get; set; } = "";
        public decimal TotalAmount { get; set; }
        public string Message { get; set; } = "";
    }
}
```

## 8) InvoiceCalculator (nested if logic)
```csharp
using System;
using System.Linq;

namespace HealthySystem.API.Legacy
{
    public class InvoiceCalculator
    {
        public InvoiceCalculator()
        {
        }

        public LegacyInvoiceSummary CalculateInvoice(
            LegacyInvoiceLine[] lines,
            bool hasInsurance,
            bool isLoyalPatient,
            bool isAfterHours)
        {
            if (lines == null || lines.Length == 0)
            {
                return new LegacyInvoiceSummary();
            }

            decimal subtotal = lines.Sum(x => x.UnitPrice * x.Quantity);
            decimal discount = 0m;
            decimal surcharge = 0m;
            decimal tax = 0m;

            // Legacy nested conditions
            if (hasInsurance)
            {
                discount = subtotal * (SystemConfiguration.DefaultInsuranceDiscountPercent / 100m);

                if (isLoyalPatient)
                {
                    discount += SystemConfiguration.DefaultLoyaltyDiscountAmount;

                    if (isAfterHours)
                    {
                        surcharge += SystemConfiguration.DefaultAfterHoursSurcharge;
                    }
                    else
                    {
                        surcharge += 0m;
                    }
                }
                else
                {
                    if (isAfterHours)
                    {
                        surcharge += SystemConfiguration.DefaultAfterHoursSurcharge;
                    }
                    else
                    {
                        surcharge += 0m;
                    }
                }
            }
            else
            {
                if (isLoyalPatient)
                {
                    discount += SystemConfiguration.DefaultLoyaltyDiscountAmount;

                    if (isAfterHours)
                    {
                        surcharge += SystemConfiguration.DefaultAfterHoursSurcharge;
                    }
                }
                else
                {
                    if (isAfterHours)
                    {
                        surcharge += SystemConfiguration.DefaultAfterHoursSurcharge;
                    }
                }
            }

            var baseAfterDiscount = subtotal - discount + surcharge;
            if (baseAfterDiscount < 0)
            {
                baseAfterDiscount = 0;
            }

            tax = baseAfterDiscount * (SystemConfiguration.VatPercent / 100m);
            var total = baseAfterDiscount + tax;

            return new LegacyInvoiceSummary
            {
                Subtotal = subtotal,
                DiscountAmount = discount,
                SurchargeAmount = surcharge,
                TaxAmount = tax,
                TotalAmount = total,
                Description = "Legacy invoice calculation completed."
            };
        }
    }

    public class LegacyInvoiceLine
    {
        public string ServiceCode { get; set; } = "";
        public string ServiceName { get; set; } = "";
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
    }

    public class LegacyInvoiceSummary
    {
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal SurchargeAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Description { get; set; } = "";
    }
}
```

## 9) AppointmentService (Logic Notify manual)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HealthySystem.API.Legacy
{
    public class AppointmentService
    {
        private readonly string _connectionString;
        private readonly HttpClient _httpClient;

        public AppointmentService()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();
            _httpClient = new HttpClient();
        }

        public async Task<bool> UpdateStatusAndNotifyAsync(long appointmentId, string newStatus, string updatedBy)
        {
            var appointment = GetAppointmentById(appointmentId);
            if (appointment == null)
            {
                return false;
            }

            var oldStatus = appointment.Status;
            if (string.Equals(oldStatus, newStatus, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                var sql = @"
UPDATE Appointments
SET Status = @Status, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @UpdatedBy
WHERE Id = @Id;
";

                using var command = new SqlCommand(sql, connection);
                command.Parameters.AddWithValue("@Status", newStatus);
                command.Parameters.AddWithValue("@UpdatedBy", updatedBy ?? "system");
                command.Parameters.AddWithValue("@Id", appointmentId);
                command.ExecuteNonQuery();
            }

            // Legacy: notify thu cong tung doi tuong
            if (newStatus == "confirmed")
            {
                await SendEmailToDoctorAsync(appointment.DoctorEmail, "Appointment Confirmed",
                    "Appointment " + appointment.AppointmentCode + " has been confirmed.");

                await SendSmsToPatientAsync(appointment.PatientPhone,
                    "Your appointment " + appointment.AppointmentCode + " has been confirmed.");
            }
            else if (newStatus == "cancelled")
            {
                await SendEmailToDoctorAsync(appointment.DoctorEmail, "Appointment Cancelled",
                    "Appointment " + appointment.AppointmentCode + " has been cancelled.");

                await SendSmsToPatientAsync(appointment.PatientPhone,
                    "Your appointment " + appointment.AppointmentCode + " has been cancelled.");

                await SendEmailToReceptionAsync("reception@healthysystem.local",
                    "Cancelled Appointment",
                    "Please update waiting queue for appointment " + appointment.AppointmentCode + ".");
            }
            else if (newStatus == "completed")
            {
                await SendSmsToPatientAsync(appointment.PatientPhone,
                    "Your visit " + appointment.AppointmentCode + " is completed. Thank you.");

                await SendEmailToDoctorAsync(appointment.DoctorEmail,
                    "Visit Completed",
                    "Visit " + appointment.AppointmentCode + " has been marked as completed.");
            }
            else
            {
                await SendSmsToPatientAsync(appointment.PatientPhone,
                    "Appointment " + appointment.AppointmentCode + " status changed to " + newStatus);
            }

            return true;
        }

        private LegacyAppointmentDto? GetAppointmentById(long appointmentId)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
SELECT TOP 1
    a.Id,
    a.AppointmentCode,
    a.Status,
    d.Email AS DoctorEmail,
    p.Phone AS PatientPhone
FROM Appointments a
LEFT JOIN Users d ON a.DoctorId = d.Id
LEFT JOIN Users p ON a.PatientId = p.Id
WHERE a.Id = @Id;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Id", appointmentId);

            using var reader = command.ExecuteReader();
            if (!reader.Read())
            {
                return null;
            }

            return new LegacyAppointmentDto
            {
                Id = Convert.ToInt64(reader["Id"]),
                AppointmentCode = reader["AppointmentCode"]?.ToString() ?? "",
                Status = reader["Status"]?.ToString() ?? "",
                DoctorEmail = reader["DoctorEmail"]?.ToString() ?? "",
                PatientPhone = reader["PatientPhone"]?.ToString() ?? ""
            };
        }

        private async Task SendEmailToDoctorAsync(string email, string subject, string body)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return;
            }

            var payload = new { to = email, subject, body };
            var json = JsonSerializer.Serialize(payload);
            await _httpClient.PostAsync(
                SystemConfiguration.EmailApiBaseUrl + "/send-email",
                new StringContent(json, Encoding.UTF8, "application/json"));
        }

        private async Task SendEmailToReceptionAsync(string email, string subject, string body)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return;
            }

            var payload = new { to = email, subject, body };
            var json = JsonSerializer.Serialize(payload);
            await _httpClient.PostAsync(
                SystemConfiguration.EmailApiBaseUrl + "/send-email",
                new StringContent(json, Encoding.UTF8, "application/json"));
        }

        private async Task SendSmsToPatientAsync(string phone, string message)
        {
            if (string.IsNullOrWhiteSpace(phone))
            {
                return;
            }

            var payload = new { phone, message };
            var json = JsonSerializer.Serialize(payload);
            await _httpClient.PostAsync(
                SystemConfiguration.SmsApiBaseUrl + "/send-sms",
                new StringContent(json, Encoding.UTF8, "application/json"));
        }
    }

    public class LegacyAppointmentDto
    {
        public long Id { get; set; }
        public string AppointmentCode { get; set; } = "";
        public string Status { get; set; } = "";
        public string DoctorEmail { get; set; } = "";
        public string PatientPhone { get; set; } = "";
    }
}
```

## 10) AppointmentManager (Logic State via massive if-else)
```csharp
using System;

namespace HealthySystem.API.Legacy
{
    public class AppointmentManager
    {
        public AppointmentManager()
        {
        }

        public string ApplyAction(
            string currentStatus,
            string action,
            bool patientArrived,
            bool doctorReady,
            bool paymentCompleted,
            bool hasLabResult,
            bool hasCancelReason)
        {
            var status = (currentStatus ?? "").Trim().ToLowerInvariant();
            var normalizedAction = (action ?? "").Trim().ToLowerInvariant();

            // Legacy logic: if-else rat dai
            if (status == "scheduled" && normalizedAction == "checkin")
            {
                if (patientArrived)
                {
                    status = "checked-in";
                }
                else
                {
                    throw new InvalidOperationException("Cannot check-in because patient is not arrived.");
                }
            }
            else if (status == "scheduled" && normalizedAction == "cancel")
            {
                if (hasCancelReason)
                {
                    status = "cancelled";
                }
                else
                {
                    throw new InvalidOperationException("Cancel reason is required.");
                }
            }
            else if (status == "checked-in" && normalizedAction == "startvisit")
            {
                if (doctorReady && patientArrived)
                {
                    status = "in-progress";
                }
                else
                {
                    throw new InvalidOperationException("Doctor is not ready or patient not arrived.");
                }
            }
            else if (status == "checked-in" && normalizedAction == "cancel")
            {
                if (hasCancelReason)
                {
                    status = "cancelled";
                }
                else
                {
                    throw new InvalidOperationException("Cancel reason is required.");
                }
            }
            else if (status == "in-progress" && normalizedAction == "finish")
            {
                if (hasLabResult)
                {
                    if (paymentCompleted)
                    {
                        status = "completed";
                    }
                    else
                    {
                        status = "awaiting-payment";
                    }
                }
                else
                {
                    status = "awaiting-lab-result";
                }
            }
            else if (status == "awaiting-lab-result" && normalizedAction == "updatelab")
            {
                if (hasLabResult)
                {
                    if (paymentCompleted)
                    {
                        status = "completed";
                    }
                    else
                    {
                        status = "awaiting-payment";
                    }
                }
            }
            else if (status == "awaiting-payment" && normalizedAction == "markpaid")
            {
                if (paymentCompleted)
                {
                    status = "completed";
                }
                else
                {
                    throw new InvalidOperationException("Payment is not completed.");
                }
            }
            else if (status == "completed")
            {
                if (normalizedAction == "reopen")
                {
                    status = "in-progress";
                }
                else
                {
                    throw new InvalidOperationException("Completed appointment cannot do action: " + action);
                }
            }
            else if (status == "cancelled")
            {
                if (normalizedAction == "restore")
                {
                    status = "scheduled";
                }
                else
                {
                    throw new InvalidOperationException("Cancelled appointment cannot do action: " + action);
                }
            }
            else
            {
                throw new InvalidOperationException("Unsupported state/action pair: " + currentStatus + "/" + action);
            }

            return status;
        }
    }
}
```

## 11) PaymentService (giant switch-case by method)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HealthySystem.API.Legacy
{
    public class PaymentService
    {
        private readonly string _connectionString;
        private readonly HttpClient _httpClient;

        public PaymentService()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();
            _httpClient = new HttpClient();
        }

        public async Task<LegacyPaymentResult> ProcessPaymentAsync(LegacyPaymentRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var method = (request.Method ?? "").Trim().ToLowerInvariant();
            var result = new LegacyPaymentResult
            {
                InvoiceCode = request.InvoiceCode,
                Method = request.Method,
                Success = false,
                Message = "Payment failed."
            };

            switch (method)
            {
                case "cash":
                    if (request.Amount <= 0)
                    {
                        result.Message = "Amount must be greater than 0.";
                        break;
                    }

                    SavePaymentRecord(request, "paid", "CASH-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff"));
                    UpdateInvoiceStatus(request.InvoiceCode, "paid");
                    result.Success = true;
                    result.TransactionCode = "CASH-" + request.InvoiceCode;
                    result.Message = "Cash payment completed at cashier.";
                    break;

                case "card":
                    if (string.IsNullOrWhiteSpace(request.CardNumber) || string.IsNullOrWhiteSpace(request.CardHolder))
                    {
                        result.Message = "Card information is incomplete.";
                        break;
                    }

                    if (request.CardNumber.Length < 12)
                    {
                        result.Message = "Invalid card number.";
                        break;
                    }

                    var cardPayload = new
                    {
                        invoiceCode = request.InvoiceCode,
                        amount = request.Amount,
                        cardNumber = request.CardNumber,
                        cardHolder = request.CardHolder,
                        expiry = request.CardExpiry,
                        cvv = request.CardCvv
                    };

                    var cardJson = JsonSerializer.Serialize(cardPayload);
                    var cardResponse = await _httpClient.PostAsync(
                        "https://legacy-card-gateway.local/api/charge",
                        new StringContent(cardJson, Encoding.UTF8, "application/json"));

                    if (cardResponse.IsSuccessStatusCode)
                    {
                        var txCode = "CARD-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
                        SavePaymentRecord(request, "paid", txCode);
                        UpdateInvoiceStatus(request.InvoiceCode, "paid");
                        result.Success = true;
                        result.TransactionCode = txCode;
                        result.Message = "Card payment successful.";
                    }
                    else
                    {
                        SavePaymentRecord(request, "failed", "CARD-FAIL");
                        result.Message = "Card payment rejected by gateway.";
                    }
                    break;

                case "insurance":
                    if (string.IsNullOrWhiteSpace(request.InsuranceNumber))
                    {
                        result.Message = "Insurance number is required.";
                        break;
                    }

                    var claimPayload = new
                    {
                        claimCode = "CLM-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff"),
                        invoiceCode = request.InvoiceCode,
                        patientCode = request.PatientCode,
                        insuranceNumber = request.InsuranceNumber,
                        amount = request.Amount,
                        diagnosisCode = request.DiagnosisCode
                    };

                    var claimJson = JsonSerializer.Serialize(claimPayload);
                    var insuranceResponse = await _httpClient.PostAsync(
                        SystemConfiguration.InsuranceApiBaseUrl + "/submit-claim",
                        new StringContent(claimJson, Encoding.UTF8, "application/json"));

                    if (insuranceResponse.IsSuccessStatusCode)
                    {
                        var txCode = "BHYT-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
                        SavePaymentRecord(request, "paid", txCode);
                        SaveInsuranceClaim(request, txCode, "submitted");
                        UpdateInvoiceStatus(request.InvoiceCode, "paid");
                        result.Success = true;
                        result.TransactionCode = txCode;
                        result.Message = "Insurance payment submitted and accepted.";
                    }
                    else
                    {
                        SavePaymentRecord(request, "failed", "BHYT-FAIL");
                        SaveInsuranceClaim(request, "BHYT-FAIL", "failed");
                        result.Message = "Insurance gateway rejected claim.";
                    }
                    break;

                default:
                    result.Message = "Unsupported payment method: " + request.Method;
                    break;
            }

            if (result.Success)
            {
                await SendPaymentReceiptAsync(request.PatientEmail, request.InvoiceCode, result.TransactionCode, request.Amount, request.Method);
            }

            return result;
        }

        private void SavePaymentRecord(LegacyPaymentRequest request, string status, string transactionCode)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO Payments
(InvoiceCode, PatientCode, Method, Amount, Currency, TransactionCode, Status, CreatedAt)
VALUES
(@InvoiceCode, @PatientCode, @Method, @Amount, @Currency, @TransactionCode, @Status, SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@InvoiceCode", request.InvoiceCode);
            command.Parameters.AddWithValue("@PatientCode", request.PatientCode);
            command.Parameters.AddWithValue("@Method", request.Method);
            command.Parameters.AddWithValue("@Amount", request.Amount);
            command.Parameters.AddWithValue("@Currency", request.Currency ?? "VND");
            command.Parameters.AddWithValue("@TransactionCode", transactionCode);
            command.Parameters.AddWithValue("@Status", status);
            command.ExecuteNonQuery();
        }

        private void SaveInsuranceClaim(LegacyPaymentRequest request, string referenceCode, string status)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO InsuranceClaims
(InvoiceCode, PatientCode, InsuranceNumber, DiagnosisCode, ClaimReference, ClaimStatus, RequestedAmount, CreatedAt)
VALUES
(@InvoiceCode, @PatientCode, @InsuranceNumber, @DiagnosisCode, @ClaimReference, @ClaimStatus, @RequestedAmount, SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@InvoiceCode", request.InvoiceCode);
            command.Parameters.AddWithValue("@PatientCode", request.PatientCode);
            command.Parameters.AddWithValue("@InsuranceNumber", request.InsuranceNumber ?? "");
            command.Parameters.AddWithValue("@DiagnosisCode", request.DiagnosisCode ?? "");
            command.Parameters.AddWithValue("@ClaimReference", referenceCode);
            command.Parameters.AddWithValue("@ClaimStatus", status);
            command.Parameters.AddWithValue("@RequestedAmount", request.Amount);
            command.ExecuteNonQuery();
        }

        private void UpdateInvoiceStatus(string invoiceCode, string status)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
UPDATE Invoices
SET Status = @Status, UpdatedAt = SYSUTCDATETIME()
WHERE InvoiceCode = @InvoiceCode;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Status", status);
            command.Parameters.AddWithValue("@InvoiceCode", invoiceCode);
            command.ExecuteNonQuery();
        }

        private async Task SendPaymentReceiptAsync(string? patientEmail, string invoiceCode, string transactionCode, decimal amount, string method)
        {
            if (string.IsNullOrWhiteSpace(patientEmail))
            {
                return;
            }

            var payload = new
            {
                to = patientEmail,
                subject = "Payment Receipt - " + invoiceCode,
                body = "Payment successful. Invoice: " + invoiceCode +
                       ", Transaction: " + transactionCode +
                       ", Method: " + method +
                       ", Amount: " + amount.ToString("N0") + " VND."
            };

            var json = JsonSerializer.Serialize(payload);
            await _httpClient.PostAsync(
                SystemConfiguration.EmailApiBaseUrl + "/send-email",
                new StringContent(json, Encoding.UTF8, "application/json"));
        }
    }

    public class LegacyPaymentRequest
    {
        public string InvoiceCode { get; set; } = "";
        public string PatientCode { get; set; } = "";
        public decimal Amount { get; set; }
        public string Method { get; set; } = "";
        public string Currency { get; set; } = "VND";
        public string? CardNumber { get; set; }
        public string? CardHolder { get; set; }
        public string? CardExpiry { get; set; }
        public string? CardCvv { get; set; }
        public string? InsuranceNumber { get; set; }
        public string? DiagnosisCode { get; set; }
        public string? PatientEmail { get; set; }
    }

    public class LegacyPaymentResult
    {
        public string InvoiceCode { get; set; } = "";
        public bool Success { get; set; }
        public string Method { get; set; } = "";
        public string TransactionCode { get; set; } = "";
        public string Message { get; set; } = "";
    }
}
```

## 12) TreatmentPlanGenerator (duplicated acute/chronic logic)
```csharp
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;

namespace HealthySystem.API.Legacy
{
    public class TreatmentPlanGenerator
    {
        private readonly string _connectionString;

        public TreatmentPlanGenerator()
        {
            _connectionString = SystemConfiguration.BuildConnectionString();
        }

        public LegacyTreatmentPlanResult GenerateAcutePlan(LegacyTreatmentPlanInput input)
        {
            // Duplicate step 1: validate
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input));
            }

            if (string.IsNullOrWhiteSpace(input.EncounterCode) || string.IsNullOrWhiteSpace(input.PatientCode) || string.IsNullOrWhiteSpace(input.Diagnosis))
            {
                throw new InvalidOperationException("Invalid treatment plan input.");
            }

            // Duplicate step 2: read recent history
            var recentHistory = GetRecentHistory(input.PatientCode);

            // Duplicate step 3: build actions
            var actions = new List<string>();
            actions.Add("Acute protocol for diagnosis: " + input.Diagnosis);
            actions.Add("Provide symptomatic medication for 3-5 days.");
            actions.Add("Recommend hydration and rest.");
            actions.Add("Schedule short follow-up in 3 days if no improvement.");
            actions.Add("Consider emergency escalation if warning signs appear.");
            actions.Add("Recent history summary: " + recentHistory);

            // Duplicate step 4: save
            var planCode = SavePlan(input, "acute", actions);

            // Duplicate step 5: return
            return new LegacyTreatmentPlanResult
            {
                PlanCode = planCode,
                EncounterCode = input.EncounterCode,
                PlanType = "acute",
                Actions = actions,
                Message = "Acute treatment plan generated."
            };
        }

        public LegacyTreatmentPlanResult GenerateChronicPlan(LegacyTreatmentPlanInput input)
        {
            // Duplicate step 1: validate
            if (input == null)
            {
                throw new ArgumentNullException(nameof(input));
            }

            if (string.IsNullOrWhiteSpace(input.EncounterCode) || string.IsNullOrWhiteSpace(input.PatientCode) || string.IsNullOrWhiteSpace(input.Diagnosis))
            {
                throw new InvalidOperationException("Invalid treatment plan input.");
            }

            // Duplicate step 2: read recent history
            var recentHistory = GetRecentHistory(input.PatientCode);

            // Duplicate step 3: build actions
            var actions = new List<string>();
            actions.Add("Chronic protocol for diagnosis: " + input.Diagnosis);
            actions.Add("Define long-term medication adherence strategy.");
            actions.Add("Set monthly monitoring indicators.");
            actions.Add("Recommend lifestyle modifications: diet, sleep, exercise.");
            actions.Add("Schedule periodic follow-up every 1-3 months.");
            actions.Add("Recent history summary: " + recentHistory);

            // Duplicate step 4: save
            var planCode = SavePlan(input, "chronic", actions);

            // Duplicate step 5: return
            return new LegacyTreatmentPlanResult
            {
                PlanCode = planCode,
                EncounterCode = input.EncounterCode,
                PlanType = "chronic",
                Actions = actions,
                Message = "Chronic treatment plan generated."
            };
        }

        public LegacyTreatmentPlanResult GenerateByType(string type, LegacyTreatmentPlanInput input)
        {
            if (string.Equals(type, "acute", StringComparison.OrdinalIgnoreCase))
            {
                return GenerateAcutePlan(input);
            }

            if (string.Equals(type, "chronic", StringComparison.OrdinalIgnoreCase))
            {
                return GenerateChronicPlan(input);
            }

            throw new InvalidOperationException("Unsupported treatment type: " + type);
        }

        private string SavePlan(LegacyTreatmentPlanInput input, string planType, List<string> actions)
        {
            var planCode = "TP-" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
            var actionText = string.Join(" || ", actions);

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
INSERT INTO TreatmentPlans
(PlanCode, EncounterCode, PatientCode, Diagnosis, PlanType, ActionText, CreatedBy, CreatedAt, UpdatedAt)
VALUES
(@PlanCode, @EncounterCode, @PatientCode, @Diagnosis, @PlanType, @ActionText, @CreatedBy, SYSUTCDATETIME(), SYSUTCDATETIME());
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@PlanCode", planCode);
            command.Parameters.AddWithValue("@EncounterCode", input.EncounterCode);
            command.Parameters.AddWithValue("@PatientCode", input.PatientCode);
            command.Parameters.AddWithValue("@Diagnosis", input.Diagnosis);
            command.Parameters.AddWithValue("@PlanType", planType);
            command.Parameters.AddWithValue("@ActionText", actionText);
            command.Parameters.AddWithValue("@CreatedBy", input.CreatedBy ?? "system");
            command.ExecuteNonQuery();

            return planCode;
        }

        private string GetRecentHistory(string patientCode)
        {
            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            var sql = @"
SELECT TOP 1 i.ClinicalImpression
FROM EncounterInsights i
INNER JOIN Encounters e ON i.EncounterCode = e.EncounterCode
WHERE e.PatientCode = @PatientCode
ORDER BY e.CreatedAt DESC;
";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@PatientCode", patientCode);
            var result = command.ExecuteScalar();
            return result?.ToString() ?? "No previous history.";
        }
    }

    public class LegacyTreatmentPlanInput
    {
        public string EncounterCode { get; set; } = "";
        public string PatientCode { get; set; } = "";
        public string Diagnosis { get; set; } = "";
        public List<string> Symptoms { get; set; } = new List<string>();
        public string? CreatedBy { get; set; }
    }

    public class LegacyTreatmentPlanResult
    {
        public string PlanCode { get; set; } = "";
        public string EncounterCode { get; set; } = "";
        public string PlanType { get; set; } = "";
        public List<string> Actions { get; set; } = new List<string>();
        public string Message { get; set; } = "";
    }
}
```

