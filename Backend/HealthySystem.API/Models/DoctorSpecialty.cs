using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("doctor_specialties")]
    public class DoctorSpecialty
    {
        [Column("doctor_user_id")]
        public long DoctorUserId { get; set; }

        [Column("specialty_id")]
        public long SpecialtyId { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(DoctorUserId))]
        public User Doctor { get; set; } = null!;

        [ForeignKey(nameof(SpecialtyId))]
        public Specialty Specialty { get; set; } = null!;
    }
}