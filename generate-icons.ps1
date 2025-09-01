# PowerShell Icon Generation Script for Shopping Cart Image
# Run this after you save your shopping cart image as 'source-icon.png' in the public directory

Write-Host "Creating PWA icons from your shopping cart image..." -ForegroundColor Green

# Create icons directory if it doesn't exist
$iconsDir = "public\icons"
if (!(Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force
    Write-Host "Created icons directory" -ForegroundColor Blue
}

# List of required icon sizes
$sizes = @(16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512)

# Check if source image exists
$sourceImage = "public\source-icon.png"
if (Test-Path $sourceImage) {
    Write-Host "Found source image: $sourceImage" -ForegroundColor Green
    
    # You'll need to use an image editing tool or online service to create these sizes
    Write-Host "⚠️  Please use an online tool to generate the following icon sizes:" -ForegroundColor Yellow
    
    foreach ($size in $sizes) {
        Write-Host "  📁 public\icons\icon-$size" + "x$size.png ($size x $size pixels)"
    }
    
    Write-Host "  📁 public\favicon.png (32x32 pixels)" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "🔗 Recommended online tools:" -ForegroundColor Magenta
    Write-Host "  • https://realfavicongenerator.net/"
    Write-Host "  • https://www.favicon-generator.org/"
    Write-Host "  • https://favicon.io/"
    
} else {
    Write-Host "❌ Source image not found: $sourceImage" -ForegroundColor Red
    Write-Host "Please save your shopping cart image as 'source-icon.png' in the public directory first."
}

Write-Host ""
Write-Host "✅ After generating all icons, your shopping cart image will appear as:" -ForegroundColor Green
Write-Host "  • Browser favicon"
Write-Host "  • PWA app icon"  
Write-Host "  • Bookmarks icon"
Write-Host "  • Home screen icon (mobile)"
Write-Host "  • App shortcuts icons"
