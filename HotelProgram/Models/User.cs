using System.ComponentModel.DataAnnotations.Schema;

namespace HotelProgram.Models
{
    public class User
    {
        public  int ID { get; set; }
        public required string TC { get; set; }
        public required string Username { get; set; }
        public string UsernameLastname { get; set; }
        [Column("Passwordd")]
        public  string Password { get; set; }
        public int Authority { get; set; }
        public int IsActive { get; set; } = 1;
        public int RoleID { get; set; } = 1;

    }
}
