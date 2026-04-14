    namespace HotelProgram.Models
    {
        public class Room
        {
            public int Id { get; set; }

            public int RoomNumber { get; set; }

            public int BlockId { get; set; }

            public int IsActive { get; set; }

            public Block Block { get; set; }
        }
    }
