using System.ComponentModel.DataAnnotations;

namespace HotelProgram.Models
{
    public class LoginModels
    {
        [Required(ErrorMessage = "Kullanıcı adı boş bırakılamaz")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "Şifre boş bırakılamaz")]
        public required string Password { get; set; }

    }
}