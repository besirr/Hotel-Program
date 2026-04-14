using HotelProgram.Controllers.Base;
using HotelProgram.Data;
using HotelProgram.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace HotelProgram.Controllers.Admin
{
    public class AdminPanelController : Clock
    {
        private readonly ILogger<AdminPanelController> _logger;
        private readonly AppDbContext _context;
        public AdminPanelController(AppDbContext context)
        {
            _context = context;
        }

        // Yetki kontrolü için yardımcı metot
        private bool IsAdmin() => HttpContext.Session.GetString("Authority") == "1";
        private IActionResult RedirectToUser() => RedirectToAction("UserView", "UserPanel");

        public IActionResult AdminView(LoginModels model)
        {
            if (!IsAdmin()) return RedirectToUser();

            return View();
        }

        public IActionResult AdminUsersPanel(LoginModels model)
        {
            if (!IsAdmin()) return RedirectToUser();

            ViewBag.Authority = HttpContext.Session.GetString("Authority");
            var users = _context.Users.ToList();
            return View(users);
        }

        public IActionResult AdminRoomsPanel()
        {
            if (!IsAdmin()) return RedirectToUser();

            ViewBag.Authority = HttpContext.Session.GetString("Authority");
            var rooms = _context.Rooms
                            .Include(r => r.Block)
                            .OrderBy(r => r.Block.BlockName)
                            .ThenBy(r => r.RoomNumber)
                            .ToList();
            ViewBag.Blocks = _context.Blocks.OrderBy(b => b.BlockName).ToList();
            return View(rooms);
        }

        [HttpPost]
        public IActionResult UpdateUser([FromBody] User updatedUser)
        {
            if (!IsAdmin()) return Unauthorized();

            var user = _context.Users.FirstOrDefault(u => u.ID == updatedUser.ID);
            if (user == null) return NotFound();

            bool exists = _context.Users.Any(u =>
                (u.Username == updatedUser.Username ||
                u.TC == updatedUser.TC) && u.ID != updatedUser.ID);

            if (exists)
                return Conflict("Bu TC veya kullanıcı adı zaten başka bir kullanıcıda var.");

            user.TC = updatedUser.TC;
            user.Username = updatedUser.Username;
            user.UsernameLastname = updatedUser.UsernameLastname;
            user.Authority = updatedUser.Authority;
            user.IsActive = updatedUser.IsActive;
            user.RoleID = updatedUser.RoleID;
            user.Password = updatedUser.Password;

            _context.SaveChanges();
            return Ok();
        }

        [HttpPost]
        public IActionResult AddUser([FromBody] User newUser)
        {
            if (!IsAdmin()) return Unauthorized();
            if (newUser == null) return BadRequest();

            bool exists = _context.Users.Any(u => u.Username == newUser.Username || u.TC == newUser.TC);
            if (exists)
                return Conflict("Bu TC veya kullanıcı adı zaten mevcut.");

            _context.Users.Add(newUser);
            _context.SaveChanges();
            return Ok();
        }

        [HttpPost]
        public IActionResult AddRoom([FromBody] Room newRoom)
        {
            if (!IsAdmin()) return Unauthorized();
            if (newRoom == null) return BadRequest();

            bool exists = _context.Rooms.Any(r => r.RoomNumber == newRoom.RoomNumber && r.BlockId == newRoom.BlockId);
            if (exists)
                return Conflict("Oda zaten mevcut.");

            _context.Rooms.Add(newRoom);
            _context.SaveChanges();
            return Ok();
        }

        [HttpPost]
        public IActionResult UpdateRoom([FromBody] Room updatedRoom)
        {
            if (!IsAdmin()) return Unauthorized();

            var room = _context.Rooms.FirstOrDefault(r => r.Id == updatedRoom.Id);
            if (room == null) return NotFound();

            bool exists = _context.Rooms.Any(r =>
                r.RoomNumber == updatedRoom.RoomNumber &&
                r.BlockId == updatedRoom.BlockId &&
                r.Id != updatedRoom.Id);

            if (exists)
                return Conflict("Oda zaten mevcut.");

            room.RoomNumber = updatedRoom.RoomNumber;
            room.BlockId = updatedRoom.BlockId;
            room.IsActive = updatedRoom.IsActive;
            _context.SaveChanges();
            return Ok();
        }

        public IActionResult DeleteRoom(int id)
        {
            if (!IsAdmin()) return RedirectToUser();

            var room = _context.Rooms.FirstOrDefault(r => r.Id == id);
            if (room != null)
            {
                _context.Rooms.Remove(room);
                _context.SaveChanges();
            }
            return RedirectToAction("AdminRoomsPanel");
        }

        public IActionResult Delete(int ID)
        {
            if (!IsAdmin()) return RedirectToUser();

            int control = Convert.ToInt32(HttpContext.Session.GetString("ID"));
            if (control == ID)
                return RedirectToAction("AdminUsersPanel");

            var user = _context.Users.FirstOrDefault(u => u.ID == ID);
            if (user != null)
            {
                _context.Users.Remove(user);
                _context.SaveChanges();
            }

            return RedirectToAction("AdminUsersPanel");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login", "LoginHave");
        }

        public IActionResult AdminRoomAssignment()
        {
            if (!IsAdmin()) return RedirectToUser();

            ViewBag.Authority = HttpContext.Session.GetString("Authority");


            ViewBag.ActiveTasks = _context.RoomTasks
            .Where(rt => rt.IsActive == 1)
            .Select(rt => new { rt.RoomNumber, rt.BlockId, rt.UserID })
            .ToList();

            ViewBag.OccupiedRooms = _context.RoomsAndCustomers
            .Where(r => r.Status == 1 || r.Status == 2)
            .Select(r => new { r.RoomNumber, r.BlockID, r.Status, r.NameAndSurname })
            .ToList();

            var users = _context.Users.Where(u => u.IsActive == 1).ToList();
            var rooms = _context.Rooms
                    .Include(r => r.Block)
                    .Where(r => r.IsActive == 1)
                    .OrderBy(r => r.Block.BlockName)
                    .ThenBy(r => r.RoomNumber)
                    .ToList();
            var blocks = _context.Blocks.ToList();

            var viewmodel = new RoomAssignmentViewModel
            {
                Users = users,
                Rooms = rooms,
                Blocks = blocks
            };
            return View(viewmodel);
        }

        [HttpPost]
        public async Task<IActionResult> Assign([FromBody] List<AssignRequest> payload)
        {
            if (!IsAdmin()) return Unauthorized();

            foreach (var item in payload)
            {
                bool roomAlreadyAssigned = await _context.RoomTasks
                    .AnyAsync(t => t.RoomNumber == item.RoomNumber
                                && t.BlockId == item.BlockId
                                && t.BitmeTarihi == null);

                if (roomAlreadyAssigned)
                    return Conflict($"{item.RoomNumber} numaralı oda zaten atanmış.");

                _context.RoomTasks.Add(new RoomTask
                {
                    UserID = item.UserID,
                    RoomNumber = item.RoomNumber,
                    BlockId = item.BlockId,
                    AtanmaTarihi = DateTime.Now
                });
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        public class AssignRequest
        {
            public int UserID { get; set; }
            public int RoomId { get; set; }
            public int RoomNumber { get; set; }
            public int BlockId { get; set; }
        }

        public IActionResult RoomsTasksAndUserList()
        {
            if (!IsAdmin()) return RedirectToUser();

            ViewBag.Authority = HttpContext.Session.GetString("Authority");

            var tasks = (from rt in _context.RoomTasks
                         join u in _context.Users on rt.UserID equals u.ID
                         join r in _context.Rooms on new { rt.RoomNumber, rt.BlockId } equals new { r.RoomNumber, r.BlockId }
                         join b in _context.Blocks on r.BlockId equals b.Id
                         select new RoomsTasksAndUserList
                         {
                             ID = rt.ID,
                             UserID = rt.UserID,
                             Username = u.Username,
                             UsernameLastname = u.UsernameLastname,
                             RoomNumber = rt.RoomNumber,
                             BlockId = rt.BlockId,
                             BlockName = b.BlockName,
                             AtanmaTarihi = rt.AtanmaTarihi,
                             BitmeTarihi = rt.BitmeTarihi
                         }).ToList();

            ViewBag.UserList = _context.Users
                .Where(u => u.IsActive == 1)
                .Select(u => new { u.ID, u.Username, u.UsernameLastname })
                .ToList();

            ViewBag.RoomList = _context.Rooms
                .Include(r => r.Block)
                .Where(r => r.IsActive == 1)
                .OrderBy(r => r.Block.BlockName)
                .ThenBy(r => r.RoomNumber)
                .Select(r => new { r.Id, r.RoomNumber, r.BlockId, r.Block.BlockName })
                .ToList();

            return View(tasks);
        }

        public IActionResult RoomAndUserDelete(int ID)
        {
            if (!IsAdmin()) return RedirectToUser();

            int control = Convert.ToInt32(HttpContext.Session.GetString("Id"));
            if (control == ID)
                return RedirectToAction("AdminUsersPanel");

            var roomandtasks = _context.RoomTasks.FirstOrDefault(u => u.ID == ID);
            if (roomandtasks != null)
            {
                _context.RoomTasks.Remove(roomandtasks);
                _context.SaveChanges();
            }

            return RedirectToAction("RoomsTasksAndUserList");
        }

        [HttpPost]
        public IActionResult UpdateRoomsAndUserTask([FromBody] RoomTask updatedUser)
        {
            if (!IsAdmin()) return Unauthorized();
            var updatetasks = _context.RoomTasks.FirstOrDefault(u => u.ID == updatedUser.ID);
            if (updatetasks == null) return NotFound();
            updatetasks.UserID = updatedUser.UserID;
            updatetasks.RoomNumber = updatedUser.RoomNumber;
            updatetasks.BlockId = updatedUser.BlockId;
            updatetasks.AtanmaTarihi = updatedUser.AtanmaTarihi;
            updatetasks.BitmeTarihi = updatedUser.BitmeTarihi;
            // BitmeTarihi girilmişse IsActive = 0, yoksa IsActive = 1
            updatetasks.IsActive = updatedUser.BitmeTarihi.HasValue ? 0 : 1;
            _context.SaveChanges();
            return Ok();
        }
    }
}