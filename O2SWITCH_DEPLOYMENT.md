
# Qimbo Kiosk Deployment Guide for o2switch

This guide will help you deploy the Qimbo Kiosk application on an o2switch hosting server.

## Prerequisites

- An o2switch hosting account
- FTP access credentials for your o2switch account
- MySQL database credentials for your o2switch account

## Option 1: Traditional Deployment (Recommended for o2switch)

### 1. Build your application locally

```bash
# Install dependencies
npm install

# Build the production version
npm run build
```

### 2. Upload to o2switch via FTP

Use an FTP client (like FileZilla) to upload the contents of the `dist` folder to your o2switch server's web directory (usually `www` or `public_html`).

### 3. Database Setup

1. Log in to your o2switch cPanel
2. Navigate to the MySQL Databases section
3. Create a new database
4. Create a database user and assign it to the database
5. Use the SQL import tool to import the database schema from `supabase/migrations/01_initial_schema.sql`

### 4. Environment Configuration

Create a `.env` file in your web directory with the following variables:

```
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Alternatively, if you're using the MySQL database on o2switch directly (without Supabase):
1. Set up connection details in your application
2. Modify your database client code to connect directly to MySQL

## Option 2: Docker Deployment (If supported by your o2switch plan)

If your o2switch plan supports Docker:

1. Upload your entire project directory to o2switch
2. SSH into your o2switch server
3. Navigate to your project directory
4. Run the following commands:

```bash
# Build and start the Docker containers
docker-compose up -d
```

## Multi-Tenant Setup for Multiple Restaurants

If you plan to sell this app to multiple restaurants:

1. Create a separate database for each restaurant
2. Create a configuration file that points to the specific restaurant's database
3. For each installation, update the configuration with the specific restaurant's details

## Troubleshooting

- **Database Connection Issues**: Verify that your database credentials are correct
- **API Errors**: Check that your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correctly set
- **CORS Errors**: You may need to configure CORS rules in your o2switch .htaccess file

## Support

For assistance with deploying on o2switch, contact o2switch support or refer to their documentation at [https://faq.o2switch.fr/](https://faq.o2switch.fr/)
