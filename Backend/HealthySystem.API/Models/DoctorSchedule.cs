using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("doctor_schedules")]
    public class DoctorSchedule
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("doctor_id")]
        [Required]
        public long DoctorId { get; set; }

        [Column("day_of_week")]
        [Required]
        [Range(0, 6)] // 0=Sunday, 1=Monday, ..., 6=Saturday
        public int DayOfWeek { get; set; }

        [Column("start_time")]
        [Required]
        public TimeOnly StartTime { get; set; }

        [Column("end_time")]
        [Required]
        public TimeOnly EndTime { get; set; }

        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;

        [Column("max_appointments_per_slot")]
        public int MaxAppointmentsPerSlot { get; set; } = 4;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        [ForeignKey("DoctorId")]
        public virtual User? Doctor { get; set; }
    }
}
