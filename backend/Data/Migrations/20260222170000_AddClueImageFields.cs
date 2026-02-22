using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jeopareddy.Api.Data.Migrations
{
    [DbContext(typeof(JeopareddyDbContext))]
    [Migration("20260222170000_AddClueImageFields")]
    public partial class AddClueImageFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageBase64",
                table: "Clues",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageMimeType",
                table: "Clues",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageBase64",
                table: "Clues");

            migrationBuilder.DropColumn(
                name: "ImageMimeType",
                table: "Clues");
        }
    }
}
