using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travela.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingContactFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "bookings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContactName",
                table: "bookings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "bookings",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "bookings",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "ContactName",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "bookings");
        }
    }
}
