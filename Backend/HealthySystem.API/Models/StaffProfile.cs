using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("staff_profiles")]
    public class StaffProfile
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }

        [Column("staff_code")]
        [MaxLength(100)]
        public string? StaffCode { get; set; }

        [Column("department")]
        [MaxLength(200)]
        public string? Department { get; set; }

        [Column("position")]
        [MaxLength(100)]
        public string? Position { get; set; }

        [Column("qualifications")]
        public string? Qualifications { get; set; }

        [Column("license_number")]
        [MaxLength(200)]
        public string? LicenseNumber { get; set; }

        [Column("work_start_date")]
        public DateOnly? WorkStartDate { get; set; }

        [Column("work_end_date")]
        public DateOnly? WorkEndDate { get; set; }

        [Column("base_salary", TypeName = "decimal(18,2)")]
        public decimal? BaseSalary { get; set; }

        [NotMapped]
        public string? ProfileImageUrl { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Additional properties for API compatibility
        [NotMapped]
        public string? Title => Position;

        [NotMapped]
        public string? Description => Qualifications;

        [NotMapped]
        public int? YearsOfExperience => WorkStartDate.HasValue ? 
            DateTime.Now.Year - WorkStartDate.Value.Year : null;

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}