using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travela.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTourRedesignFields : Migration
    {
        // Chỉ bổ sung 4 cột nội dung mới cho tours. Phần Version/idempotency_keys/
        // check constraint/index đã được tạo ở 20260912000002_TourDatesBookingVersion và
        // 20260912000001_AddCompositeIndexes nên không lặp lại (trước đây gây lỗi
        // "Duplicate column name/table" khiến backend không start).
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationConditions",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "CancellationPolicy",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ItineraryDays",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApplicationConditions",
                table: "tours");

            migrationBuilder.DropColumn(
                name: "CancellationPolicy",
                table: "tours");

            migrationBuilder.DropColumn(
                name: "ItineraryDays",
                table: "tours");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "tours");
        }
    }
}
