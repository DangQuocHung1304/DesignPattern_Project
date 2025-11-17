using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("doctor_schedules")]
    public class DoctorSchedule
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }  // Changed to long to match database bigint

        [Column("doctor_user_id")]  // Changed from doctor_id
        [Required]
        public long DoctorId { get; set; }

        [Column("schedule_date")]  // Changed from day_of_week - storing actual date
        [Required]
        public DateTime ScheduleDate { get; set; }

        [Column("start_time")]
        [Required]
        public TimeOnly StartTime { get; set; }

        [Column("end_time")]
        [Required]
        public TimeOnly EndTime { get; set; }

        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;

        [Column("slot_length_minutes")]  // Changed from max_appointments_per_slot
        public int SlotLengthMinutes { get; set; } = 15;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Note: updated_at column doesn't exist in DB, removed
        // public DateTime? UpdatedAt { get; set; }

        // Navigation property
        [ForeignKey("DoctorId")]
        public virtual User? Doctor { get; set; }
        
        // Computed property cho frontend - tính từ ScheduleDate
        [NotMapped]
        public int DayOfWeek => (int)ScheduleDate.DayOfWeek;
    }
}
