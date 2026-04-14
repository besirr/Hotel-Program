using HotelProgram.Controllers.Base;
using HotelProgram.Data;
using HotelProgram.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace HotelProgram.Controllers.Home
{
    public class HomeController : Clock
    {
        private readonly ILogger<HomeController> _logger;
        private readonly AppDbContext _context; // BURASI EKLENDİ


        public HomeController(ILogger<HomeController> logger, AppDbContext context)
        {
            _logger = logger;
            _context = context; // BURASI EKLENDİ

        }
        public IActionResult Index()
        {
            var Authority = HttpContext.Session.GetString("Authority");

            if (string.IsNullOrEmpty(Authority))
            {
                return RedirectToAction("Login", "LoginHave");
            }

            if(Authority != "1") //sadece admin kullanıcısı buraya girebiliyor
            {
                    return RedirectToAction("Privacy", "Home");
            }
            return View();
        }
        public IActionResult Privacy()
        {
            var authority = HttpContext.Session.GetString("Authority");

            if (string.IsNullOrEmpty(authority))
            {
                return RedirectToAction("Login", "LoginHave");
            }
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
        public IActionResult vLogout()
        {
            HttpContext.Session.Clear(); 
            return RedirectToAction("Login", "LoginHave");
        }

    }
}
