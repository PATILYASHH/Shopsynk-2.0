#!/bin/bash
# Icon Generation Script for Shopping Cart Image
# Run this after you save your shopping cart image as 'source-icon.png' in the public directory

echo "Creating PWA icons from your shopping cart image..."

# Create icons directory if it doesn't exist
mkdir -p public/icons

# List of required icon sizes
sizes=(16 32 48 72 96 128 144 152 192 384 512)

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    for size in "${sizes[@]}"; do
        convert public/source-icon.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png
        echo "Created icon-${size}x${size}.png"
    done
    
    # Create favicon
    convert public/source-icon.png -resize 32x32 public/favicon.png
    echo "Created favicon.png"
    
    echo "✅ All icons generated successfully!"
else
    echo "⚠️  ImageMagick not found. Please install it or use an online tool."
    echo "Manual steps:"
    echo "1. Save your shopping cart image as public/source-icon.png"
    echo "2. Use an online favicon generator like realfavicongenerator.net"
    echo "3. Generate icons for these sizes: ${sizes[*]}"
    echo "4. Place them in public/icons/ directory"
fi

echo ""
echo "📁 Required files:"
for size in "${sizes[@]}"; do
    echo "  public/icons/icon-${size}x${size}.png"
done
echo "  public/favicon.png (32x32)"
