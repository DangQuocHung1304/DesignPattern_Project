using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("walk_in_patients")]
    public class WalkInPatient
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("public_id")]
        public Guid PublicId { get; set; } = Guid.NewGuid();

        [Column("full_name")]
        [Required]
        [MaxLength(255)]
        public string FullName { get; set; } = "";

        [Column("phone")]
        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = "";  // No unique constraint - allow duplicates

        [Column("email")]
        [MaxLength(255)]
        public string? Email { get; set; }

        [Column("date_of_birth")]
        public DateOnly? DateOfBirth { get; set; }

        [Column("gender")]
        [MaxLength(1)]
        public string? Gender { get; set; }  // M/F/O

        [Column("address")]
        [MaxLength(500)]
        public string? Address { get; set; }

        [Column("insurance_number")]
        [MaxLength(50)]
        public string? InsuranceNumber { get; set; }

        [Column("medical_record_number")]
        [MaxLength(50)]
        public string? MedicalRecordNumber { get; set; }

        [Column("registered_user_id")]
        public long? RegisteredUserId { get; set; }  // Link to user if they register later

        [Column("created_by")]
        public long CreatedBy { get; set; }  // Reception staff

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset? UpdatedAt { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey("CreatedBy")]
        public virtual User? Creator { get; set; }

        [ForeignKey("RegisteredUserId")]
        public virtual User? RegisteredUser { get; set; }

        public virtual ICollection<Appointment>? Appointments { get; set; }
    }
}
