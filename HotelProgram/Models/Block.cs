namespace HotelProgram.Models
{
    public class Block
    {
        public int Id { get; set; }

        public string BlockName { get; set; }

        public List<Room> Rooms { get; set; }
    }
}