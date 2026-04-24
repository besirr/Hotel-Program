using HotelProgram.Data;
using HotelProgram.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace HotelProgram.Controllers.Auth
{
    public class LoginHave : Controller
    {
        private readonly AppDbContext _context;

        public LoginHave(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet] //sayfa ilk açıldıgında çalışan kod
        public IActionResult Login()
        {
            return View();
        }
        [HttpPost] //gönder butonuna basılınca çıkan yer
        public IActionResult Login(LoginModels model) //modelsin içinde ki değerleri alıyor
        {
            if (!ModelState.IsValid) // burada da tam olarak boş olup olmadıgını kontrol ediyor
            {
                return View(model);
            }

            var user = _context.Users.FirstOrDefault(o => o.Username == model.Username && o.Password == model.Password);

            if (user != null)
            {
                if (user.IsActive == 0)
                {
                    ViewBag.Error = "Hesabınız aktif değil. Lütfen yöneticiniz ile iletişime geçiniz.";
                    return View(model);
                }
                else
                {
                    if (user.Authority == 1)
                    {

                        HttpContext.Session.SetString("Username", user.Username.ToString());
                        HttpContext.Session.SetString("UsernameLastname", user.UsernameLastname.ToString());//"" içinde ki username stringi Username.ToString kaydediyr
                        HttpContext.Session.SetString("Authority", user.Authority.ToString());
                        HttpContext.Session.SetString("ID", user.ID.ToString());
                        HttpContext.Session.SetString("RoleID", user.RoleID.ToString());

                        return RedirectToAction("AdminView", "AdminPanel");
                    }
                    else if (user.Authority == 0 && user.IsActive == 1 && user.RoleID == 3)
                    {
                        HttpContext.Session.SetString("Username", user.Username.ToString());
                        HttpContext.Session.SetString("UsernameLastname", user.UsernameLastname.ToString());
                        HttpContext.Session.SetString("Authority", user.Authority.ToString());
                        HttpContext.Session.SetString("ID", user.ID.ToString());
                        HttpContext.Session.SetString("RoleID", user.RoleID.ToString());
                        return RedirectToAction("UserView", "UserPanel");
                    }
                    else if (user.Authority == 0 && user.IsActive == 1 && user.RoleID == 1 || user.RoleID == 2)
                    {
                        HttpContext.Session.SetString("Username", user.Username.ToString());//"" içinde ki username stringi Username.ToString kaydediyr
                        HttpContext.Session.SetString("UsernameLastname", user.UsernameLastname.ToString());
                        HttpContext.Session.SetString("Authority", user.Authority.ToString());
                        HttpContext.Session.SetString("RoleID", user.RoleID.ToString());
                        HttpContext.Session.SetString("ID", user.ID.ToString());
                        return RedirectToAction("UserView", "UserPanel");

                    }
                    else
                    {
                        ViewBag.Error = "Kullanıcı adı veya şifre hatalı";
                        return View(model);
                    }
                }
            }
            ViewBag.Error = "Kullanıcı adı veya şifre hatalı";
            return View(model);

        }

        // REGISTER GET
        public IActionResult Back()
        {
            return RedirectToAction("Login", "LoginHave");
        }
        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        // REGISTER POST
        [HttpPost]
        public IActionResult Register(RegisterModels model)
        {

            bool exists = _context.Users.Any(u =>
            u.Username == model.Username ||
            u.TC == model.TC);

            if (exists)
            {
                ViewBag.Error = "Kullanıcı zaten bulunmakta";
                return View(model);
            }

            User user = new User()
            {
                TC = model.TC,
                Username = model.Username,
                UsernameLastname = model.UsernameLastname,
                Password = model.Password,
                RoleID = int.Parse(model.RoleID)
            };

            _context.Users.Add(user);
            _context.SaveChanges();


            ViewBag.Success = "Kullanıcı Başarıyla eklendi.";
            return View();
        }



        // Profili göster
        public IActionResult Profile()
        {
            var userId = HttpContext.Session.GetString("ID"); // string olarak alıyoruz
            if (userId == null) return RedirectToAction("Login"); // session yoksa login’e yönlendir
            ViewBag.Authority = HttpContext.Session.GetString("Authority"); // bunu ekle

            var user = _context.Users.Find(int.Parse(userId));
            return View(user);
        }
        public IActionResult ChangePassword([FromBody] PasswordReset dto)
        {
            var user = _context.Users.Find(dto.Id);
            if (user == null || user.Password != dto.CurrentPassword)
            {
                return BadRequest("Kullanıcı bulunamadı veya mevcut şifre yanlış.");
            }
            user.Password = dto.NewPassword;
            _context.SaveChanges();
            return Ok("Şifre başarıyla değiştirildi.");
        }

    }
}

