using System.ComponentModel.DataAnnotations.Schema;

namespace HotelProgram.Models
{
    public class RoomsAndCustomer
    {
        public int ID { get; set; }
        public int RoomNumber { get; set; }
        public int BlockID { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal FeePaid { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DepositAmount { get; set; } = 0;

        [NotMapped]
        public decimal RemainingAmount => FeePaid - DepositAmount;

        [Column(TypeName = "char(11)")]
        public string CustomerTC { get; set; } = "";

        [Column(TypeName = "nvarchar(100)")]
        public string NameAndSurname { get; set; } = "";

        [Column(TypeName = "nvarchar(20)")]
        public string? Phone { get; set; }

        public DateTime? BirthdayDate { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public DateTime? CheckInActualDate { get; set; }
        public DateTime? CheckOutActualDate { get; set; }

        // 1=Rezerve, 2=Giriş Yaptı, 3=Çıkış Yaptı, 4=İptal
        public int Status { get; set; } = 1;

        public int? TransferredFromRoom { get; set; }
        public int? TransferredFromBlock { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}