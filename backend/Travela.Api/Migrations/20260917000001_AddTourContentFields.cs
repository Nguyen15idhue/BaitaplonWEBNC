using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travela.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTourContentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Route",
                table: "tours",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Itinerary",
                table: "tours",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Transport",
                table: "tours",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Accommodation",
                table: "tours",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Meals",
                table: "tours",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Sightseeing",
                table: "tours",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Guide",
                table: "tours",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Included",
                table: "tours",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Excluded",
                table: "tours",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Audience",
                table: "tours",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Insurance",
                table: "tours",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Terms",
                table: "tours",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContactInfo",
                table: "tours",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Route", table: "tours");
            migrationBuilder.DropColumn(name: "Itinerary", table: "tours");
            migrationBuilder.DropColumn(name: "Transport", table: "tours");
            migrationBuilder.DropColumn(name: "Accommodation", table: "tours");
            migrationBuilder.DropColumn(name: "Meals", table: "tours");
            migrationBuilder.DropColumn(name: "Sightseeing", table: "tours");
            migrationBuilder.DropColumn(name: "Guide", table: "tours");
            migrationBuilder.DropColumn(name: "Included", table: "tours");
            migrationBuilder.DropColumn(name: "Excluded", table: "tours");
            migrationBuilder.DropColumn(name: "Audience", table: "tours");
            migrationBuilder.DropColumn(name: "Insurance", table: "tours");
            migrationBuilder.DropColumn(name: "Terms", table: "tours");
            migrationBuilder.DropColumn(name: "ContactInfo", table: "tours");
        }
    }
}
