using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace HotelProgram.Controllers.Base
{
    public class Clock : Controller
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var user = context.HttpContext.Session.GetString("Username");
            if (user == null)
            {
                context.Result = new RedirectToActionResult("Login", "LoginHave", null);
            }

            base.OnActionExecuting(context);
        }

    }
}
