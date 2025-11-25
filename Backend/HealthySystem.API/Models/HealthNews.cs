using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    /// <summary>
    /// Tin tức y tế (để hiển thị trên trang chủ)
    /// </summary>
    [Table("health_news")]
    public class HealthNews
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("title")]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [Column("summary")]
        [MaxLength(500)]
        public string Summary { get; set; } = string.Empty; // Tóm tắt ngắn

        [Column("content")]
        public string Content { get; set; } = string.Empty; // Nội dung đầy đủ

        [Column("image_url")]
        public string? ImageUrl { get; set; } // URL ảnh đại diện hoặc base64

        [Column("category")]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty; // Sức khỏe, Dinh dưỡng, Bệnh lý, Phòng bệnh, etc.

        [Column("author")]
        [MaxLength(200)]
        public string Author { get; set; } = string.Empty;

        [Column("is_featured")]
        public bool IsFeatured { get; set; } = false; // Tin nổi bật

        [Column("is_published")]
        public bool IsPublished { get; set; } = false; // Đã xuất bản

        [Column("view_count")]
        public int ViewCount { get; set; } = 0;

        [Column("published_date")]
        public DateTime? PublishedDate { get; set; }

        [Column("created_by")]
        public int CreatedBy { get; set; } // Admin ID

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
