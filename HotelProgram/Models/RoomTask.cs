namespace HotelProgram.Models
{
    public class RoomTask
    {
        public int ID { get; set; }
        public int UserID { get; set; }
        public int RoomNumber { get; set; }
        public DateTime AtanmaTarihi { get; set; }
        public DateTime? BitmeTarihi { get; set; }
        public int BlockId { get; set; }
        public int IsActive { get; set; } = 1;
    }
}
