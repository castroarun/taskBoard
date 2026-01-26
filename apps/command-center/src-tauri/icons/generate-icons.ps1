# Klarity Icon Generator
# Converts icon-square.svg to all required Tauri icon formats
#
# Prerequisites:
#   - ImageMagick (winget install ImageMagick.ImageMagick)
#   OR
#   - Use online converter: https://realfavicongenerator.net/
#
# Usage: .\generate-icons.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$svgFile = "icon-square.svg"

# Check if ImageMagick is installed
$magick = Get-Command "magick" -ErrorAction SilentlyContinue

if ($magick) {
    Write-Host "Using ImageMagick to generate icons..." -ForegroundColor Green

    # Generate PNG files
    Write-Host "  Creating 32x32.png..."
    magick convert -background none -density 384 -resize 32x32 $svgFile 32x32.png

    Write-Host "  Creating 128x128.png..."
    magick convert -background none -density 384 -resize 128x128 $svgFile 128x128.png

    Write-Host "  Creating 128x128@2x.png..."
    magick convert -background none -density 384 -resize 256x256 $svgFile "128x128@2x.png"

    Write-Host "  Creating icon.png (512x512)..."
    magick convert -background none -density 384 -resize 512x512 $svgFile icon.png

    # Generate ICO (Windows) - contains multiple sizes
    Write-Host "  Creating icon.ico..."
    magick convert -background none -density 384 $svgFile `
        -define icon:auto-resize=256,128,96,64,48,32,16 `
        icon.ico

    # For ICNS (macOS), we need iconutil on macOS or use ImageMagick
    # ImageMagick can create ICNS directly on some systems
    Write-Host "  Creating icon.icns..."
    try {
        magick convert -background none -density 384 $svgFile `
            -resize 1024x1024 `
            icon.icns
        Write-Host "  icon.icns created (may need refinement on macOS)" -ForegroundColor Yellow
    } catch {
        Write-Host "  icon.icns creation failed - create manually on macOS" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Icon generation complete!" -ForegroundColor Green
    Write-Host "Files created:" -ForegroundColor Cyan
    Get-ChildItem -Filter "*.png" | ForEach-Object { Write-Host "  $_" }
    Get-ChildItem -Filter "*.ico" | ForEach-Object { Write-Host "  $_" }
    Get-ChildItem -Filter "*.icns" | ForEach-Object { Write-Host "  $_" }

} else {
    Write-Host "ImageMagick not found. Install it or use manual conversion:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install ImageMagick" -ForegroundColor Cyan
    Write-Host "  winget install ImageMagick.ImageMagick"
    Write-Host "  Then re-run this script"
    Write-Host ""
    Write-Host "Option 2: Use Online Converter" -ForegroundColor Cyan
    Write-Host "  1. Go to https://realfavicongenerator.net/"
    Write-Host "  2. Upload icon-square.svg"
    Write-Host "  3. Download the generated favicon package"
    Write-Host "  4. Extract and copy icons to this folder"
    Write-Host ""
    Write-Host "Option 3: Use Figma/Illustrator" -ForegroundColor Cyan
    Write-Host "  1. Open icon-square.svg in design tool"
    Write-Host "  2. Export at required sizes:"
    Write-Host "     - 32x32.png"
    Write-Host "     - 128x128.png"
    Write-Host "     - 128x128@2x.png (256x256)"
    Write-Host "     - icon.png (512x512)"
    Write-Host "     - icon.ico (use ico converter)"
    Write-Host "     - icon.icns (macOS only)"
}
