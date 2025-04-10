
# Installing Qimbo Kiosk on o2switch

This guide walks you through installing the Qimbo Kiosk application on an o2switch shared hosting account.

## Prerequisites

- An active o2switch hosting account
- FTP or SSH access to your hosting
- Ability to create a PostgreSQL database via o2switch's control panel

## Installation Steps

### 1. Create a PostgreSQL Database

1. Log in to your o2switch control panel
2. Go to the Databases section
3. Create a new PostgreSQL database and note the following:
   - Database name
   - Username
   - Password
   - Host (typically 'localhost')

### 2. Upload the Application Files

#### Using FTP:

1. Connect to your o2switch hosting using an FTP client
2. Upload all the application files to your desired directory (either the root public_html or a subdirectory)

#### Using SSH and Git (if available):

```bash
# Connect to your o2switch hosting via SSH
ssh username@your-o2switch-server

# Navigate to your desired directory
cd public_html

# Clone the repository
git clone https://your-repository-url.git .

# Set permissions
chmod +x install.sh
./install.sh
```

### 3. Run the Setup Wizard

1. In your web browser, navigate to the setup page:
   ```
   https://your-domain.com/setup.php
   ```
   (Replace 'your-domain.com' with your actual domain)

2. Follow the on-screen instructions to:
   - Verify system requirements
   - Enter database credentials
   - Configure your restaurant information
   - Complete the installation

### 4. Post-Installation

After successful installation:

1. **Delete the setup file**: For security, remove the setup.php file from your server
2. **Log in to the admin panel**: Access your new kiosk's admin interface at:
   ```
   https://your-domain.com/admin
   ```
3. **Configure your menu**: Add categories, items, and customize the appearance

### Troubleshooting

If you encounter issues during installation:

1. **Check permissions**: Make sure the 'config' directory is writable
2. **Verify database credentials**: Double-check your PostgreSQL connection details
3. **Check server requirements**: Ensure PHP version 7.4+ and required extensions are available
4. **Review error logs**: Check the o2switch error logs in your control panel

## Manual Installation

If the automatic setup doesn't work, you can manually install by:

1. Create a `config/config.php` file with your database and restaurant settings
2. Create a `public/env.js` file with your frontend environment variables
3. Import the SQL from `supabase/migrations/01_initial_schema.sql` to your database using phpPgAdmin
4. Modify the SQL to add the restaurant_id column to all tables

## Additional Support

For additional support, please contact us at help@qimbokiosk.com or visit our support forum at https://support.qimbokiosk.com.

---

Thank you for choosing Qimbo Kiosk!
