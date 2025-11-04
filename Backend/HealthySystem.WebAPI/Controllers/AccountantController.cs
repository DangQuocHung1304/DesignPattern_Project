using HealthySystem.WebAPI.Data;
using HealthySystem.WebAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace HealthySystem.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "accountant,admin")]
    public class AccountantController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AccountantController> _logger;

        public AccountantController(ApplicationDbContext context, ILogger<AccountantController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ============================================================
        // Sprint 9 - US-01: Xuất bảng chi phí khám bệnh
        // ============================================================

        /// <summary>
        /// Lấy bảng chi phí khám bệnh theo khoảng thời gian
        /// </summary>
        [HttpGet("billing-report")]
        public async Task<IActionResult> GetBillingReport(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] int? patientId,
            [FromQuery] string? status)
        {
            try
            {
                var query = _context.Encounters
                    .Include(e => e.Patient)
                    .Include(e => e.Doctor)
                    .Include(e => e.LabRequests)
                        .ThenInclude(lr => lr.LabResults)
                    .Include(e => e.ImagingRequests)
                        .ThenInclude(ir => ir.ImagingResults)
                    .Include(e => e.Prescriptions)
                        .ThenInclude(p => p.PrescriptionItems)
                    .Include(e => e.Treatments)
                        .ThenInclude(t => t.TreatmentItems)
                    .AsQueryable();

                // Filter by date range
                if (fromDate.HasValue)
                {
                    query = query.Where(e => e.EncounterDate >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    var endOfDay = toDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(e => e.EncounterDate <= endOfDay);
                }

                // Filter by patient
                if (patientId.HasValue)
                {
                    query = query.Where(e => e.PatientId == patientId.Value);
                }

                // Filter by status
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(e => e.Status == status);
                }

                var encounters = await query
                    .OrderByDescending(e => e.EncounterDate)
                    .ToListAsync();

                var billingData = encounters.Select(e => new
                {
                    EncounterId = e.Id,
                    EncounterDate = e.EncounterDate,
                    PatientId = e.PatientId,
                    PatientName = $"{e.Patient.FirstName} {e.Patient.LastName}",
                    DoctorName = $"{e.Doctor.FirstName} {e.Doctor.LastName}",
                    ChiefComplaint = e.ChiefComplaint,
                    Status = e.Status,

                    // Lab costs
                    LabRequestCount = e.LabRequests?.Count ?? 0,
                    LabTestCount = e.LabRequests?.Sum(lr => lr.LabResults?.Count ?? 0) ?? 0,
                    LabCost = CalculateLabCost(e.LabRequests),

                    // Imaging costs
                    ImagingRequestCount = e.ImagingRequests?.Count ?? 0,
                    ImagingTestCount = e.ImagingRequests?.Sum(ir => ir.ImagingResults?.Count ?? 0) ?? 0,
                    ImagingCost = CalculateImagingCost(e.ImagingRequests),

                    // Prescription costs
                    PrescriptionCount = e.Prescriptions?.Count ?? 0,
                    PrescriptionItemCount = e.Prescriptions?.Sum(p => p.PrescriptionItems?.Count ?? 0) ?? 0,
                    PrescriptionCost = CalculatePrescriptionCost(e.Prescriptions),

                    // Treatment costs
                    TreatmentCount = e.Treatments?.Count ?? 0,
                    TreatmentItemCount = e.Treatments?.Sum(t => t.TreatmentItems?.Count ?? 0) ?? 0,
                    TreatmentCost = CalculateTreatmentCost(e.Treatments),

                    // Consultation fee
                    ConsultationFee = 200000, // Base consultation fee

                    // Total cost
                    TotalCost = 200000 + // Consultation
                               CalculateLabCost(e.LabRequests) +
                               CalculateImagingCost(e.ImagingRequests) +
                               CalculatePrescriptionCost(e.Prescriptions) +
                               CalculateTreatmentCost(e.Treatments)
                }).ToList();

                var summary = new
                {
                    TotalEncounters = billingData.Count,
                    TotalRevenue = billingData.Sum(b => b.TotalCost),
                    TotalLabRevenue = billingData.Sum(b => b.LabCost),
                    TotalImagingRevenue = billingData.Sum(b => b.ImagingCost),
                    TotalPrescriptionRevenue = billingData.Sum(b => b.PrescriptionCost),
                    TotalTreatmentRevenue = billingData.Sum(b => b.TreatmentCost),
                    TotalConsultationRevenue = billingData.Sum(b => b.ConsultationFee),
                    AverageEncounterCost = billingData.Any() ? billingData.Average(b => b.TotalCost) : 0
                };

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        Summary = summary,
                        Details = billingData,
                        FromDate = fromDate,
                        ToDate = toDate,
                        GeneratedAt = DateTime.Now
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating billing report");
                return StatusCode(500, new { success = false, error = "Lỗi khi tạo báo cáo chi phí" });
            }
        }

        /// <summary>
        /// Xuất chi tiết chi phí của một encounter cụ thể
        /// </summary>
        [HttpGet("encounter/{encounterId}/costs")]
        public async Task<IActionResult> GetEncounterCosts(int encounterId)
        {
            try
            {
                var encounter = await _context.Encounters
                    .Include(e => e.Patient)
                    .Include(e => e.Doctor)
                    .Include(e => e.LabRequests)
                        .ThenInclude(lr => lr.LabResults)
                    .Include(e => e.ImagingRequests)
                        .ThenInclude(ir => ir.ImagingResults)
                    .Include(e => e.Prescriptions)
                        .ThenInclude(p => p.PrescriptionItems)
                    .Include(e => e.Treatments)
                        .ThenInclude(t => t.TreatmentItems)
                    .FirstOrDefaultAsync(e => e.Id == encounterId);

                if (encounter == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy thông tin khám bệnh" });
                }

                var costs = new
                {
                    EncounterId = encounter.Id,
                    EncounterDate = encounter.EncounterDate,
                    Patient = new
                    {
                        Id = encounter.PatientId,
                        FullName = $"{encounter.Patient.FirstName} {encounter.Patient.LastName}",
                        Phone = encounter.Patient.Phone
                    },
                    Doctor = new
                    {
                        FullName = $"{encounter.Doctor.FirstName} {encounter.Doctor.LastName}"
                    },

                    // Consultation
                    Consultation = new
                    {
                        Description = "Phí khám bệnh",
                        Fee = 200000
                    },

                    // Lab tests
                    LabTests = encounter.LabRequests?.SelectMany(lr => lr.LabResults ?? new List<LabResult>())
                        .Select(lr => new
                        {
                            TestCode = lr.TestCode,
                            Cost = GetLabTestCost(lr.TestCode)
                        }).ToList() ?? new List<object>(),

                    // Imaging tests
                    ImagingTests = encounter.ImagingRequests?.SelectMany(ir => ir.ImagingResults ?? new List<ImagingResult>())
                        .Select(ir => new
                        {
                            TestCode = ir.TestCode,
                            Cost = GetImagingTestCost(ir.TestCode)
                        }).ToList() ?? new List<object>(),

                    // Medications
                    Medications = encounter.Prescriptions?.SelectMany(p => p.PrescriptionItems ?? new List<PrescriptionItem>())
                        .Select(pi => new
                        {
                            Medication = pi.MedicationName,
                            Quantity = pi.Quantity,
                            UnitPrice = 50000, // Giá mẫu
                            TotalPrice = pi.Quantity * 50000
                        }).ToList() ?? new List<object>(),

                    // Treatments
                    Treatments = encounter.Treatments?.SelectMany(t => t.TreatmentItems ?? new List<TreatmentItem>())
                        .Select(ti => new
                        {
                            Procedure = ti.ProcedureName,
                            Quantity = ti.Quantity,
                            UnitPrice = 100000, // Giá mẫu
                            TotalPrice = ti.Quantity * 100000
                        }).ToList() ?? new List<object>(),

                    // Summary
                    Summary = new
                    {
                        ConsultationFee = 200000,
                        LabCost = CalculateLabCost(encounter.LabRequests),
                        ImagingCost = CalculateImagingCost(encounter.ImagingRequests),
                        MedicationCost = CalculatePrescriptionCost(encounter.Prescriptions),
                        TreatmentCost = CalculateTreatmentCost(encounter.Treatments),
                        TotalCost = 200000 +
                                   CalculateLabCost(encounter.LabRequests) +
                                   CalculateImagingCost(encounter.ImagingRequests) +
                                   CalculatePrescriptionCost(encounter.Prescriptions) +
                                   CalculateTreatmentCost(encounter.Treatments)
                    }
                };

                return Ok(new { success = true, data = costs });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting encounter costs for encounter {EncounterId}", encounterId);
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy thông tin chi phí" });
            }
        }

        // ============================================================
        // Sprint 10 - US-02: Tính toán lương
        // ============================================================

        /// <summary>
        /// Tính lương nhân viên theo tháng
        /// </summary>
        [HttpGet("salary-calculation")]
        public async Task<IActionResult> CalculateSalary(
            [FromQuery] int? month,
            [FromQuery] int? year,
            [FromQuery] int? userId,
            [FromQuery] string? role)
        {
            try
            {
                var targetMonth = month ?? DateTime.Now.Month;
                var targetYear = year ?? DateTime.Now.Year;

                var query = _context.Users
                    .Where(u => u.IsActive)
                    .AsQueryable();

                // Filter by user ID
                if (userId.HasValue)
                {
                    query = query.Where(u => u.Id == userId.Value);
                }

                // Filter by role
                if (!string.IsNullOrEmpty(role))
                {
                    query = query.Where(u => u.Role == role);
                }

                var users = await query.ToListAsync();

                var salaryData = new List<object>();

                foreach (var user in users)
                {
                    decimal baseSalary = GetBaseSalary(user.Role);
                    int workDays = await CalculateWorkDays(user.Id, targetMonth, targetYear);
                    decimal performanceBonus = await CalculatePerformanceBonus(user.Id, user.Role, targetMonth, targetYear);
                    decimal allowance = GetAllowance(user.Role);
                    decimal totalSalary = baseSalary + performanceBonus + allowance;

                    salaryData.Add(new
                    {
                        UserId = user.Id,
                        FullName = $"{user.FirstName} {user.LastName}",
                        Email = user.Email,
                        Role = user.Role,
                        Month = targetMonth,
                        Year = targetYear,
                        BaseSalary = baseSalary,
                        WorkDays = workDays,
                        PerformanceBonus = performanceBonus,
                        Allowance = allowance,
                        TotalSalary = totalSalary,
                        Breakdown = new
                        {
                            BaseSalaryDescription = $"Lương cơ bản ({GetRoleDisplayName(user.Role)})",
                            WorkDaysDescription = $"Số ngày làm việc: {workDays} ngày",
                            BonusDescription = GetBonusDescription(user.Role),
                            AllowanceDescription = GetAllowanceDescription(user.Role)
                        }
                    });
                }

                var summary = new
                {
                    TotalEmployees = salaryData.Count,
                    TotalSalaryExpense = salaryData.Sum(s => (decimal)s.GetType().GetProperty("TotalSalary")!.GetValue(s)!),
                    Month = targetMonth,
                    Year = targetYear,
                    CalculatedAt = DateTime.Now
                };

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        Summary = summary,
                        Details = salaryData
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating salary");
                return StatusCode(500, new { success = false, error = "Lỗi khi tính lương" });
            }
        }

        /// <summary>
        /// Lấy thống kê lương theo role
        /// </summary>
        [HttpGet("salary-statistics")]
        public async Task<IActionResult> GetSalaryStatistics(
            [FromQuery] int? month,
            [FromQuery] int? year)
        {
            try
            {
                var targetMonth = month ?? DateTime.Now.Month;
                var targetYear = year ?? DateTime.Now.Year;

                var users = await _context.Users
                    .Where(u => u.IsActive)
                    .ToListAsync();

                var roles = users.Select(u => u.Role).Distinct().ToList();
                var statistics = new List<object>();

                foreach (var role in roles)
                {
                    var roleUsers = users.Where(u => u.Role == role).ToList();
                    var baseSalary = GetBaseSalary(role);
                    var count = roleUsers.Count;

                    statistics.Add(new
                    {
                        Role = role,
                        RoleDisplayName = GetRoleDisplayName(role),
                        EmployeeCount = count,
                        BaseSalary = baseSalary,
                        TotalBaseSalary = baseSalary * count,
                        AverageBonus = await CalculateAverageBonus(role, targetMonth, targetYear),
                        Allowance = GetAllowance(role)
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        Statistics = statistics,
                        Month = targetMonth,
                        Year = targetYear,
                        GeneratedAt = DateTime.Now
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting salary statistics");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy thống kê lương" });
            }
        }

        // ============================================================
        // Sprint 10 - US-03: Tính chi phí khám chữa bệnh
        // ============================================================

        /// <summary>
        /// Dashboard thống kê tổng quan cho accountant
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var today = DateTime.Today;
                var thisMonth = new DateTime(today.Year, today.Month, 1);
                var lastMonth = thisMonth.AddMonths(-1);

                // Today's statistics
                var todayEncounters = await _context.Encounters
                    .Where(e => e.EncounterDate.Date == today)
                    .Include(e => e.LabRequests).ThenInclude(lr => lr.LabResults)
                    .Include(e => e.ImagingRequests).ThenInclude(ir => ir.ImagingResults)
                    .Include(e => e.Prescriptions).ThenInclude(p => p.PrescriptionItems)
                    .Include(e => e.Treatments).ThenInclude(t => t.TreatmentItems)
                    .ToListAsync();

                var todayRevenue = todayEncounters.Sum(e =>
                    200000 + // Consultation fee
                    CalculateLabCost(e.LabRequests) +
                    CalculateImagingCost(e.ImagingRequests) +
                    CalculatePrescriptionCost(e.Prescriptions) +
                    CalculateTreatmentCost(e.Treatments));

                // This month's statistics
                var thisMonthEncounters = await _context.Encounters
                    .Where(e => e.EncounterDate >= thisMonth)
                    .Include(e => e.LabRequests).ThenInclude(lr => lr.LabResults)
                    .Include(e => e.ImagingRequests).ThenInclude(ir => ir.ImagingResults)
                    .Include(e => e.Prescriptions).ThenInclude(p => p.PrescriptionItems)
                    .Include(e => e.Treatments).ThenInclude(t => t.TreatmentItems)
                    .ToListAsync();

                var thisMonthRevenue = thisMonthEncounters.Sum(e =>
                    200000 +
                    CalculateLabCost(e.LabRequests) +
                    CalculateImagingCost(e.ImagingRequests) +
                    CalculatePrescriptionCost(e.Prescriptions) +
                    CalculateTreatmentCost(e.Treatments));

                // Salary expenses
                var activeEmployees = await _context.Users.CountAsync(u => u.IsActive);
                var totalSalaryExpense = await CalculateTotalSalaryExpense(today.Month, today.Year);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        Today = new
                        {
                            Encounters = todayEncounters.Count,
                            Revenue = todayRevenue,
                            Date = today
                        },
                        ThisMonth = new
                        {
                            Encounters = thisMonthEncounters.Count,
                            Revenue = thisMonthRevenue,
                            Month = today.Month,
                            Year = today.Year
                        },
                        Employees = new
                        {
                            TotalActive = activeEmployees,
                            SalaryExpense = totalSalaryExpense
                        },
                        NetIncome = thisMonthRevenue - totalSalaryExpense
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading accountant dashboard");
                return StatusCode(500, new { success = false, error = "Lỗi khi tải dashboard" });
            }
        }

        // ============================================================
        // Helper Methods
        // ============================================================

        private decimal CalculateLabCost(ICollection<LabRequest>? labRequests)
        {
            if (labRequests == null || !labRequests.Any())
                return 0;

            return labRequests
                .SelectMany(lr => lr.LabResults ?? new List<LabResult>())
                .Sum(lr => GetLabTestCost(lr.TestCode));
        }

        private decimal CalculateImagingCost(ICollection<ImagingRequest>? imagingRequests)
        {
            if (imagingRequests == null || !imagingRequests.Any())
                return 0;

            return imagingRequests
                .SelectMany(ir => ir.ImagingResults ?? new List<ImagingResult>())
                .Sum(ir => GetImagingTestCost(ir.TestCode));
        }

        private decimal CalculatePrescriptionCost(ICollection<Prescription>? prescriptions)
        {
            if (prescriptions == null || !prescriptions.Any())
                return 0;

            return prescriptions
                .SelectMany(p => p.PrescriptionItems ?? new List<PrescriptionItem>())
                .Sum(pi => pi.Quantity * 50000); // Giá mẫu cho thuốc
        }

        private decimal CalculateTreatmentCost(ICollection<Treatment>? treatments)
        {
            if (treatments == null || !treatments.Any())
                return 0;

            return treatments
                .SelectMany(t => t.TreatmentItems ?? new List<TreatmentItem>())
                .Sum(ti => ti.Quantity * 100000); // Giá mẫu cho treatment
        }

        private decimal GetLabTestCost(string testCode)
        {
            // Pricing logic based on test type
            var labPrices = new Dictionary<string, decimal>
            {
                { "CBC", 150000 },
                { "Glucose", 80000 },
                { "HbA1c", 200000 },
                { "Lipid Panel", 250000 },
                { "Liver Function", 180000 },
                { "Kidney Function", 160000 },
                { "Thyroid Panel", 220000 },
                { "Urinalysis", 60000 }
            };

            return labPrices.TryGetValue(testCode, out var price) ? price : 100000;
        }

        private decimal GetImagingTestCost(string testCode)
        {
            var imagingPrices = new Dictionary<string, decimal>
            {
                { "X-Ray Chest", 300000 },
                { "X-Ray Abdomen", 350000 },
                { "Ultrasound", 400000 },
                { "CT Scan", 1200000 },
                { "MRI", 2000000 },
                { "Mammography", 500000 }
            };

            return imagingPrices.TryGetValue(testCode, out var price) ? price : 300000;
        }

        private decimal GetBaseSalary(string role)
        {
            return role?.ToLower() switch
            {
                "doctor" => 20000000,
                "lab" => 12000000,
                "reception" => 8000000,
                "accountant" => 15000000,
                "admin" => 18000000,
                _ => 10000000
            };
        }

        private decimal GetAllowance(string role)
        {
            return role?.ToLower() switch
            {
                "doctor" => 3000000,
                "lab" => 2000000,
                "reception" => 1500000,
                "accountant" => 2500000,
                "admin" => 2500000,
                _ => 1000000
            };
        }

        private string GetRoleDisplayName(string role)
        {
            return role?.ToLower() switch
            {
                "doctor" => "Bác sĩ",
                "lab" => "Bác sĩ xét nghiệm",
                "reception" => "Lễ tân",
                "accountant" => "Kế toán",
                "admin" => "Quản trị viên",
                _ => role
            };
        }

        private string GetBonusDescription(string role)
        {
            return role?.ToLower() switch
            {
                "doctor" => "Thưởng theo số bệnh nhân khám",
                "lab" => "Thưởng theo số xét nghiệm thực hiện",
                "reception" => "Thưởng theo số lượt đăng ký",
                _ => "Thưởng hiệu suất"
            };
        }

        private string GetAllowanceDescription(string role)
        {
            return role?.ToLower() switch
            {
                "doctor" => "Phụ cấp chuyên môn + trách nhiệm",
                "lab" => "Phụ cấp độc hại",
                "reception" => "Phụ cấp ca làm việc",
                _ => "Phụ cấp"
            };
        }

        private async Task<int> CalculateWorkDays(int userId, int month, int year)
        {
            // Simple calculation: count encounters for doctors, use fixed 22 days for others
            var user = await _context.Users.FindAsync(userId);
            
            if (user?.Role == "doctor")
            {
                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);

                var workDays = await _context.Encounters
                    .Where(e => e.DoctorId == userId && e.EncounterDate >= startDate && e.EncounterDate <= endDate)
                    .Select(e => e.EncounterDate.Date)
                    .Distinct()
                    .CountAsync();

                return workDays;
            }

            return 22; // Standard work days per month
        }

        private async Task<decimal> CalculatePerformanceBonus(int userId, string role, int month, int year)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            if (role == "doctor")
            {
                var patientCount = await _context.Encounters
                    .Where(e => e.DoctorId == userId && e.EncounterDate >= startDate && e.EncounterDate <= endDate)
                    .CountAsync();

                return patientCount * 50000; // 50k per patient
            }
            else if (role == "lab")
            {
                var testCount = await _context.LabResults
                    .Where(lr => lr.PerformedBy == userId && lr.PerformedAt >= startDate && lr.PerformedAt <= endDate)
                    .CountAsync();

                return testCount * 20000; // 20k per test
            }
            else if (role == "reception")
            {
                // Count appointments created
                return 500000; // Fixed bonus
            }

            return 0;
        }

        private async Task<decimal> CalculateAverageBonus(string role, int month, int year)
        {
            var users = await _context.Users.Where(u => u.Role == role && u.IsActive).ToListAsync();
            
            if (!users.Any())
                return 0;

            decimal totalBonus = 0;
            foreach (var user in users)
            {
                totalBonus += await CalculatePerformanceBonus(user.Id, role, month, year);
            }

            return totalBonus / users.Count;
        }

        private async Task<decimal> CalculateTotalSalaryExpense(int month, int year)
        {
            var users = await _context.Users.Where(u => u.IsActive).ToListAsync();
            decimal total = 0;

            foreach (var user in users)
            {
                var baseSalary = GetBaseSalary(user.Role);
                var bonus = await CalculatePerformanceBonus(user.Id, user.Role, month, year);
                var allowance = GetAllowance(user.Role);
                total += baseSalary + bonus + allowance;
            }

            return total;
        }
    }
}
