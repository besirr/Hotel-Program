using System.ComponentModel.DataAnnotations;

namespace HotelProgram.Models
{
    public class RegisterModels
    {
        [Required(ErrorMessage = "Kullanıcı adı boş bırakılamaz")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "Kullanıcı adı boş bırakılamaz")]
        public required string UsernameLastname { get; set; }

        [Required(ErrorMessage = "TC boş bırakılamaz")]
        [StringLength(11, MinimumLength = 11, ErrorMessage = "TC 11 haneli olmalıdır")]
        public required string TC { get; set; }

        [Required(ErrorMessage = "Şifre boş bırakılamaz")]
        [MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalı")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Ünvan boş bırakılamaz")]
        [MinLength(6, ErrorMessage = "Ünvan boş bırakılamaz")]
        public string RoleID { get; set; } // string olarak al    }
    }
}
