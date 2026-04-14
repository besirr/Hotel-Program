using System.ComponentModel.DataAnnotations;

namespace HotelProgram.Models
{
    public class PasswordReset 
    {
        public int Id { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
