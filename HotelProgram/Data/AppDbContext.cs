using HotelProgram.Models;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace HotelProgram.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions <AppDbContext> options)
            : base(options)
        {
        }
        public DbSet<User> Users { get; set; }

        public DbSet<Room> Rooms{ get; set; }

        public DbSet<Block> Blocks { get; set; }

        public DbSet<RoomTask> RoomTasks { get; set; }
        public DbSet<RoomsAndCustomer> RoomsAndCustomers { get; set; }
        public DbSet<RoomsTasksAndUserList> RoomsTasksAndUserList { get; set; }







    }
}


