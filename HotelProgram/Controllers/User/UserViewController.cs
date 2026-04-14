using HotelProgram.Data;
using Microsoft.AspNetCore.Mvc;
using HotelProgram.Models;
using HotelProgram.Controllers.Base;


namespace HotelProgram.Controllers.Users
{
    public class UserViewController : Clock
    {

        private readonly ILogger<UserViewController> _logger;
        private readonly AppDbContext _context;

        public UserViewController(AppDbContext context)
        {
            _context = context;
        }
        public IActionResult UserView()
        {
            ViewBag.Authority = HttpContext.Session.GetString("Authority");
            ViewBag.RoleID = HttpContext.Session.GetString("RoleID");

            return View();
        }

    }

}