using HotelProgram.Controllers.Base;
using HotelProgram.Data;
using HotelProgram.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace HotelProgram.Controllers.Users
{

    public class UserPanel : Clock
    {
        private readonly ILogger<UserPanel> _logger;
        private readonly AppDbContext _context;

        public UserPanel(AppDbContext context)
        {
            _context = context;
        }
        public IActionResult UserView()
        {


            return View();
        }
        public IActionResult UserRoomsTasks()
        {
            ViewBag.Authority = HttpContext.Session.GetString("Authority");

            var userIDStr = HttpContext.Session.GetString("ID");

            if (userIDStr == null)
                return RedirectToAction("Login", "Account");

            var userID = int.Parse(userIDStr);

            var tasks = (from rt in _context.RoomTasks
                         join u in _context.Users on rt.UserID equals u.ID
                         join r in _context.Rooms on rt.RoomNumber equals r.RoomNumber
                         join b in _context.Blocks on r.BlockId equals b.Id
                         where rt.UserID == userID
                         orderby rt.AtanmaTarihi descending
                         select new RoomsTasksAndUserList
                         {
                             ID = rt.ID,
                             UserID = rt.UserID,
                             Username = u.Username,
                             UsernameLastname = u.UsernameLastname,
                             RoomNumber = rt.RoomNumber,
                             BlockId = r.BlockId,
                             BlockName = b.BlockName,  // ← artık gerçek isim
                             AtanmaTarihi = rt.AtanmaTarihi,
                             BitmeTarihi = rt.BitmeTarihi
                         }).ToList();

            return View(tasks);
        }
        [HttpPost]
        public async Task<IActionResult> UpdateBitmeTarihi([FromBody] UpdateBitmeTarihiRequest req)
        {
            var task = await _context.RoomTasks.FindAsync(req.ID);

            if (task == null)
                return NotFound();



            // Atanma tarihinden önce olamaz (sunucu tarafı kontrol)
            if (req.BitmeTarihi.HasValue && req.BitmeTarihi.Value <= task.AtanmaTarihi)
                return BadRequest("Bitiş tarihi atanma tarihinden önce olamaz.");

            task.BitmeTarihi = req.BitmeTarihi;
            task.IsActive = req.BitmeTarihi.HasValue ? 0 : 1;

            await _context.SaveChangesAsync();
            return Ok();
        }

        // Request modeli — Controllers klasörünün yanına ya da Models'a ekle
        public class UpdateBitmeTarihiRequest
        {
            public int ID { get; set; }
            public DateTime? BitmeTarihi { get; set; }
        }


        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        ///Resepsiyprivate bool HasAccess()
        private bool HasAccess()
        {
            var auth = HttpContext.Session.GetString("Authority");
            var role = HttpContext.Session.GetString("RoleID");
            return auth == "1" || (auth == "0" && role == "3");
        }

        // ── ANA SAYFA ──────────────────────────────────────────
        public IActionResult ReceptionUserView()
        {
            if (!HasAccess()) return RedirectToAction("Login", "LoginHave");
            ViewBag.Authority = HttpContext.Session.GetString("Authority");
            ViewBag.RoleID = HttpContext.Session.GetString("RoleID");

            var list = _context.RoomsAndCustomers
                .OrderByDescending(r => r.CreatedDate)
                .ToList();

            var blocks = _context.Blocks.ToList();
            ViewBag.Blocks = blocks;

            ViewBag.Rooms = _context.Rooms
                .Include(r => r.Block)
                .Where(r => r.IsActive == 1)
                .OrderBy(r => r.Block.BlockName)
                .ThenBy(r => r.RoomNumber)
                .ToList();

            return View(list);
        }

        // ── YENİ REZERVASYON (çoklu müşteri) ──────────────────
        [HttpPost]
        public IActionResult AddReservations([FromBody] List<RoomsAndCustomer> customers)
        {
            if (!HasAccess()) return Unauthorized();
            if (customers == null || customers.Count == 0) return BadRequest("Müşteri listesi boş.");

            foreach (var c in customers)
            {
                if (c.CheckOutDate <= c.CheckInDate)
                    return BadRequest($"{c.NameAndSurname} için çıkış tarihi giriş tarihinden sonra olmalıdır.");

                bool conflict = _context.RoomsAndCustomers.Any(r =>
                    r.RoomNumber == c.RoomNumber &&
                    r.BlockID == c.BlockID &&
                    r.Status != 3 &&
                    r.Status != 4 &&
                    r.CheckInDate < c.CheckOutDate &&
                    r.CheckOutDate > c.CheckInDate);

                if (conflict)
                    return Conflict($"Oda {c.RoomNumber} seçilen tarihler arasında dolu.");

                if (c.DepositAmount > c.FeePaid)
                    return BadRequest("Ön ödeme toplam ücretten fazla olamaz.");

                c.CreatedDate = DateTime.Now;
                c.Status = 1;
                _context.RoomsAndCustomers.Add(c);
            }

            _context.SaveChanges();
            return Ok();
        }

        // ── REZERVASYON GÜNCELLE ───────────────────────────────
        [HttpPost]
        public IActionResult UpdateReservation([FromBody] RoomsAndCustomer u)
        {
            if (!HasAccess()) return Unauthorized();

            var r = _context.RoomsAndCustomers.FirstOrDefault(x => x.ID == u.ID);
            if (r == null) return NotFound();

            if (u.CheckOutDate <= u.CheckInDate)
                return BadRequest("Çıkış tarihi giriş tarihinden sonra olmalıdır.");

            if (u.DepositAmount > u.FeePaid)
                return BadRequest("Ön ödeme toplam ücretten fazla olamaz.");

            bool conflict = _context.RoomsAndCustomers.Any(x =>
                x.RoomNumber == u.RoomNumber &&
                x.BlockID == u.BlockID &&
                x.Status != 3 &&
                x.Status != 4 &&
                x.ID != u.ID &&
                x.CheckInDate < u.CheckOutDate &&
                x.CheckOutDate > u.CheckInDate);

            if (conflict)
                return Conflict($"Oda {u.RoomNumber} seçilen tarihler arasında dolu.");

            r.RoomNumber = u.RoomNumber;
            r.BlockID = u.BlockID;
            r.FeePaid = u.FeePaid;
            r.DepositAmount = u.DepositAmount;
            r.CustomerTC = u.CustomerTC;
            r.NameAndSurname = u.NameAndSurname;
            r.Phone = u.Phone;
            r.BirthdayDate = u.BirthdayDate;
            r.CheckInDate = u.CheckInDate;
            r.CheckOutDate = u.CheckOutDate;
            r.Status = u.Status;

            _context.SaveChanges();
            return Ok();
        }

        // ── CHECK-IN ───────────────────────────────────────────
        [HttpPost]
        public IActionResult CheckIn([FromBody] int id)
        {
            if (!HasAccess()) return Unauthorized();

            var r = _context.RoomsAndCustomers.FirstOrDefault(x => x.ID == id);
            if (r == null) return NotFound();
            if (r.Status != 1) return BadRequest("Sadece Rezerve durumundaki kayıtlar için check-in yapılabilir.");

            r.Status = 2;
            r.CheckInActualDate = DateTime.Now;
            _context.SaveChanges();
            return Ok();
        }

        // ── CHECK-OUT ──────────────────────────────────────────
        [HttpPost]
        public IActionResult CheckOut([FromBody] int id)
        {
            if (!HasAccess()) return Unauthorized();

            var r = _context.RoomsAndCustomers.FirstOrDefault(x => x.ID == id);
            if (r == null) return NotFound();
            if (r.Status != 2) return BadRequest("Sadece Giriş Yapıldı durumundaki kayıtlar için check-out yapılabilir.");

            r.Status = 3;
            r.CheckOutActualDate = DateTime.Now;
            _context.SaveChanges();
            return Ok();
        }

        // ── ODA DEĞİŞİKLİĞİ (TRANSFER) ────────────────────────
        [HttpPost]
        public IActionResult TransferRoom([FromBody] TransferDto dto)
        {
            if (!HasAccess()) return Unauthorized();

            var r = _context.RoomsAndCustomers.FirstOrDefault(x => x.ID == dto.ID);
            if (r == null) return NotFound();
            if (r.Status != 2) return BadRequest("Oda değişikliği sadece giriş yapılmış misafirler için yapılabilir.");

            // Yeni odada çakışma var mı?
            bool conflict = _context.RoomsAndCustomers.Any(x =>
                x.RoomNumber == dto.NewRoomNumber &&
                x.BlockID == dto.NewBlockID &&
                x.Status != 3 &&
                x.Status != 4 &&
                x.ID != r.ID &&
                x.CheckInDate < r.CheckOutDate &&
                x.CheckOutDate > r.CheckInDate);

            if (conflict)
                return Conflict($"Oda {dto.NewRoomNumber} seçilen tarihler arasında dolu.");

            r.TransferredFromRoom = r.RoomNumber;
            r.TransferredFromBlock = r.BlockID;
            r.RoomNumber = dto.NewRoomNumber;
            r.BlockID = dto.NewBlockID;

            _context.SaveChanges();
            return Ok();
        }

        // ── ÖDEME GÜNCELLE ─────────────────────────────────────
        [HttpPost]
        public IActionResult UpdatePayment([FromBody] PaymentDto dto)
        {
            if (!HasAccess()) return Unauthorized();

            var r = _context.RoomsAndCustomers.FirstOrDefault(x => x.ID == dto.ID);
            if (r == null) return NotFound();

            if (dto.DepositAmount > r.FeePaid)
                return BadRequest("Ön ödeme toplam ücretten fazla olamaz.");

            r.DepositAmount = dto.DepositAmount;
            _context.SaveChanges();
            return Ok(new { remaining = r.FeePaid - r.DepositAmount });
        }

        // ── SİL ────────────────────────────────────────────────
        [HttpPost]
        public IActionResult DeleteReservation([FromBody] int id)
        {
            if (!HasAccess()) return Unauthorized();
            var r = _context.RoomsAndCustomers.FirstOrDefault(x => x.ID == id);
            if (r == null) return NotFound();
            _context.RoomsAndCustomers.Remove(r);
            _context.SaveChanges();
            return Ok();
        }

        // ── DTO'LAR ────────────────────────────────────────────
        public class TransferDto
        {
            public int ID { get; set; }
            public int NewRoomNumber { get; set; }
            public int NewBlockID { get; set; }
        }

        public class PaymentDto
        {
            public int ID { get; set; }
            public decimal DepositAmount { get; set; }
        }
    }
}
