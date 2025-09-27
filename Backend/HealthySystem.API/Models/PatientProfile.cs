using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("patient_profiles")]
    public class PatientProfile
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }

        [Column("medical_record_number")]
        [MaxLength(100)]
        public string? MedicalRecordNumber { get; set; }

        [Column("insurance_provider")]
        [MaxLength(200)]
        public string? InsuranceProvider { get; set; }

        [Column("insurance_number")]
        [MaxLength(200)]
        public string? InsuranceNumber { get; set; }

        [Column("address")]
        [MaxLength(1000)]
        public string? Address { get; set; }

        [Column("emergency_contact_name")]
        [MaxLength(200)]
        public string? EmergencyContactName { get; set; }

        [Column("emergency_contact_phone")]
        [MaxLength(50)]
        public string? EmergencyContactPhone { get; set; }

        [Column("allergies")]
        public string? Allergies { get; set; }

        [Column("chronic_conditions")]
        public string? ChronicConditions { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Additional properties for API compatibility
        [NotMapped]
        public DateTime CreatedDate => CreatedAt.DateTime;

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}