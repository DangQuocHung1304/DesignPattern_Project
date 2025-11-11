using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    /// <summary>
    /// Bảng giá dịch vụ của phòng khám (để hiển thị trên trang chủ)
    /// </summary>
    [Table("service_prices")]
    public class ServicePrice
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("service_name")]
        [MaxLength(200)]
        public string ServiceName { get; set; } = string.Empty;

        [Column("category")]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty; // Khám bệnh, Xét nghiệm, Chụp chiếu, Phẫu thuật, etc.

        [Column("price")]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        [Column("unit")]
        [MaxLength(50)]
        public string Unit { get; set; } = "VNĐ";

        [Column("description")]
        [MaxLength(500)]
        public string? Description { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("display_order")]
        public int DisplayOrder { get; set; } = 0; // Thứ tự hiển thị

        [Column("created_by")]
        public int CreatedBy { get; set; } // Admin ID

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
