namespace HotelProgram.Models
{
    public class RoomsTasksAndUserList
    {

        public int ID { get; set; }
        public int UserID { get; set; }
        public string Username { get; set; }
        public string UsernameLastname { get; set; }
        public int RoomNumber { get; set; }
        public int BlockId { get; set; }
        public string BlockName { get; set; }
        public DateTime AtanmaTarihi { get; set; }
        public DateTime? BitmeTarihi { get; set; }
    }
}
