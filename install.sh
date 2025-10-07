#!/bin/bash

# DownThemAll Research - Quick Install Script
# Automated deployment to Chrome browser

set -e  # Exit on any error

echo "🚀 DownThemAll Research - Quick Install Script"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓ SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠ WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    echo "Visit: https://git-scm.com/downloads"
    exit 1
fi

# Check if Chrome is installed
if ! command -v google-chrome &> /dev/null && ! command -v chrome &> /dev/null; then
    print_warning "Chrome command not found in PATH."
    print_status "Please ensure Chrome is installed for extension deployment."
fi

# Set installation directory
INSTALL_DIR="$HOME/downthemall-research"

print_status "Installation directory: $INSTALL_DIR"

# Check if directory already exists
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory $INSTALL_DIR already exists."
    read -p "Do you want to update the existing installation? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Updating existing installation..."
        cd "$INSTALL_DIR"
        git pull origin main
        print_success "Extension updated successfully!"
    else
        print_status "Using existing installation."
        cd "$INSTALL_DIR"
    fi
else
    # Clone the repository
    print_status "Cloning DownThemAll Research repository..."
    git clone https://github.com/GlacierEQ/downthemall-research.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    print_success "Repository cloned successfully!"
fi

# Verify all required files exist
print_status "Verifying extension files..."

REQUIRED_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "background.js"
    "content.js"
    "icons/icon16.png"
    "icons/icon32.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    print_success "All required files are present."
else
    print_error "Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# Validate manifest.json
print_status "Validating manifest.json..."
if command -v python3 &> /dev/null; then
    python3 -c "import json; json.load(open('manifest.json'))" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "manifest.json is valid JSON."
    else
        print_error "manifest.json contains invalid JSON."
        exit 1
    fi
else
    print_warning "Python3 not found. Skipping JSON validation."
fi

# Display installation instructions
echo ""
echo "=================================================" 
echo "🏆 INSTALLATION READY!"
echo "================================================="
echo ""
print_success "Extension files are ready for deployment."
echo ""
print_status "To install in Chrome:"
echo "  1. Open Chrome and navigate to: chrome://extensions/"
echo "  2. Enable 'Developer mode' (toggle in top-right)"
echo "  3. Click 'Load unpacked'"
echo "  4. Select this directory: $INSTALL_DIR"
echo "  5. Extension will be loaded and ready to use!"
echo ""
print_status "To install in Edge:"
echo "  1. Open Edge and navigate to: edge://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked'"
echo "  4. Select this directory: $INSTALL_DIR"
echo ""
print_status "To install in Brave:"
echo "  1. Open Brave and navigate to: brave://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked'"
echo "  4. Select this directory: $INSTALL_DIR"
echo ""

# Attempt to open Chrome extensions page (if possible)
if command -v xdg-open &> /dev/null; then
    read -p "Open Chrome extensions page now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Opening Chrome extensions page..."
        xdg-open "chrome://extensions/" 2>/dev/null || {
            print_warning "Could not open Chrome automatically."
            print_status "Please manually navigate to chrome://extensions/"
        }
    fi
elif command -v open &> /dev/null; then  # macOS
    read -p "Open Chrome extensions page now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Opening Chrome extensions page..."
        open "chrome://extensions/" 2>/dev/null || {
            print_warning "Could not open Chrome automatically."
            print_status "Please manually navigate to chrome://extensions/"
        }
    fi
fi

# Display feature summary
echo ""
print_status "Extension Features:"
echo "  • Automatic page scanning for downloadable content"
echo "  • Academic site detection (arXiv, PubMed, Google Scholar)"
echo "  • Batch download capabilities with rate limiting"
echo "  • Citation format support (BibTeX, RIS, EndNote)"
echo "  • DOI resolution and metadata extraction"
echo "  • Research data export and statistics tracking"
echo "  • Context menu integration for quick access"
echo ""

# Display next steps
print_status "Next Steps:"
echo "  1. Install extension using instructions above"
echo "  2. Look for the 🚀 icon in your browser toolbar"
echo "  3. Right-click on any webpage to see context menu options"
echo "  4. Visit academic sites to test research features"
echo "  5. Check out DEPLOYMENT.md for detailed usage guide"
echo ""

# Display troubleshooting
print_status "Troubleshooting:"
echo "  • If extension doesn't load: Check Developer mode is enabled"
echo "  • If features don't work: Check browser permissions"
echo "  • For detailed help: See DEPLOYMENT.md and PRODUCTION_CHECKLIST.md"
echo "  • Report issues: https://github.com/GlacierEQ/downthemall-research/issues"
echo ""

print_success "Installation preparation complete!"
echo "Installation directory: $INSTALL_DIR"
echo ""
echo "🎉 Ready to revolutionize your research workflow!"

exit 0