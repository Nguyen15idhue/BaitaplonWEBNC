using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travela.Api.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(Data.TravelaDbContext))]
    [Migration("20260912000002_TourDatesBookingVersion")]
    public partial class TourDatesBookingVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A4: ngày khởi hành/kết thúc tour (nullable để tương thích data cũ).
            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "tours",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "tours",
                type: "datetime(6)",
                nullable: true);

            // M12: version cho optimistic concurrency của booking status.
            migrationBuilder.AddColumn<long>(
                name: "Version",
                table: "bookings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            // H08: bảng idempotency chống duplicate booking.
            migrationBuilder.CreateTable(
                name: "idempotency_keys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Key = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_idempotency_keys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_idempotency_keys_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_idempotency_keys_bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_keys_user_key",
                table: "idempotency_keys",
                columns: new[] { "UserId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_keys_created",
                table: "idempotency_keys",
                column: "CreatedAt");

            // N09: CHECK chống số âm ở DB.
            migrationBuilder.AddCheckConstraint("CK_tours_max_seats", "tours", "MaxSeats > 0");
            migrationBuilder.AddCheckConstraint("CK_prices_value", "prices", "PriceValue > 0");
            migrationBuilder.AddCheckConstraint("CK_images_sort", "images", "SortOrder > 0");
            migrationBuilder.AddCheckConstraint("CK_bookings_qty", "bookings", "Quantity > 0");
            migrationBuilder.AddCheckConstraint("CK_checkouts_amount", "checkouts", "Amount >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint("CK_tours_max_seats", "tours");
            migrationBuilder.DropCheckConstraint("CK_prices_value", "prices");
            migrationBuilder.DropCheckConstraint("CK_images_sort", "images");
            migrationBuilder.DropCheckConstraint("CK_bookings_qty", "bookings");
            migrationBuilder.DropCheckConstraint("CK_checkouts_amount", "checkouts");

            migrationBuilder.DropTable(name: "idempotency_keys");

            migrationBuilder.DropColumn(name: "Version", table: "bookings");
            migrationBuilder.DropColumn(name: "StartDate", table: "tours");
            migrationBuilder.DropColumn(name: "EndDate", table: "tours");
        }
    }
}
