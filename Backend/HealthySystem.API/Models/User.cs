using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("public_id")]
        public Guid PublicId { get; set; } = Guid.NewGuid();

        [Column("email")]
        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Column("phone")]
        [MaxLength(50)]
        public string? Phone { get; set; }

        [Column("password_hash")]
        [Required]
        [MaxLength(512)]
        public string PasswordHash { get; set; } = string.Empty;

        [Column("role")]
        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = string.Empty; // patient, doctor, reception, lab, radiology, accountant, admin

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "active";

        [Column("first_name")]
        [MaxLength(150)]
        public string? FirstName { get; set; }

        [Column("last_name")]
        [MaxLength(150)]
        public string? LastName { get; set; }

        [Column("dob")]
        public DateOnly? DateOfBirth { get; set; }

        [Column("gender")]
        [MaxLength(1)]
        public string? Gender { get; set; } // M/F/O

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset? UpdatedAt { get; set; }

        [Column("deleted_at")]
        public DateTimeOffset? DeletedAt { get; set; }

        // Additional properties for API compatibility
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}".Trim();

        [NotMapped]
        public bool IsActive => Status == "active" && DeletedAt == null;

        [NotMapped]
        public DateTime CreatedDate => CreatedAt.DateTime;

        [NotMapped]
        public DateTime UpdatedDate => UpdatedAt?.DateTime ?? CreatedAt.DateTime;

        // Navigation properties
        public PatientProfile? PatientProfile { get; set; }
        public StaffProfile? StaffProfile { get; set; }
        public ICollection<Appointment> PatientAppointments { get; set; } = new List<Appointment>();
        public ICollection<Appointment> DoctorAppointments { get; set; } = new List<Appointment>();
        public ICollection<DoctorSpecialty> DoctorSpecialties { get; set; } = new List<DoctorSpecialty>();
        public ICollection<Rating> PatientRatings { get; set; } = new List<Rating>();
        public ICollection<Rating> DoctorRatings { get; set; } = new List<Rating>();
    }
}