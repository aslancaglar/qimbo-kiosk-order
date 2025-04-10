
#!/bin/bash

# Qimbo Kiosk Installer for o2switch
# This script helps to set up the kiosk app on an o2switch server

echo "Qimbo Kiosk Installer for o2switch"
echo "=================================="

# Check if running as root (not recommended for shared hosting)
if [ "$(id -u)" = "0" ]; then
    echo "Warning: Running as root. This is not recommended on shared hosting."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if we're in the right directory
if [ ! -f "setup.php" ]; then
    echo "Error: setup.php not found in the current directory."
    echo "Please run this script from the root directory of the Qimbo Kiosk application."
    exit 1
fi

# Set up file permissions
echo "Setting file permissions..."
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 755 *.sh

# Make config directory if it doesn't exist
if [ ! -d "config" ]; then
    echo "Creating config directory..."
    mkdir -p config
    chmod 755 config
fi

# Check for PHP
echo "Checking for PHP..."
if ! command -v php &> /dev/null; then
    echo "PHP not found. This isn't necessarily an error on shared hosting."
    echo "The server will likely have PHP installed system-wide."
else
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1-2)
    echo "PHP version $PHP_VERSION found."
fi

# Check for PostgreSQL client
echo "Checking for PostgreSQL client..."
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL client not found. This isn't necessarily an error on shared hosting."
    echo "You'll need to create the database using phpPgAdmin or a similar tool."
else
    PSQL_VERSION=$(psql --version | cut -d " " -f 3)
    echo "PostgreSQL client version $PSQL_VERSION found."
fi

# Print installation instructions
echo
echo "Installation Preparation Complete!"
echo "=================================="
echo
echo "Next steps:"
echo "1. Create a PostgreSQL database using phpPgAdmin in your o2switch control panel"
echo "2. Access setup.php in your web browser to complete the installation:"
echo "   https://your-domain.com/setup.php"
echo
echo "For manual installation, you can also edit these files directly:"
echo "- config/config.php - Database and restaurant settings"
echo "- public/env.js - Frontend environment variables"
echo "- .htaccess - Apache configuration"
echo
echo "Thank you for installing Qimbo Kiosk!"

# Make this script executable after download
chmod +x "$0"
