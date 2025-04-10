
<?php
/**
 * Qimbo Kiosk Installation Setup
 * 
 * This is the installation setup file for the Qimbo Kiosk application.
 * Similar to WordPress's install process, this will guide you through
 * setting up your database and initial configuration.
 */

// Prevent direct access unless we're doing an actual install
if (!defined('QIMBO_INSTALLING') && (!isset($_GET['step']) || 'install' !== $_GET['step'])) {
    // Define the installation flag
    define('QIMBO_INSTALLING', true);
}

// Basic environment checks
$php_version_required = '7.4.0';
$extensions_required = ['pdo', 'pdo_pgsql', 'json', 'mbstring'];
$writable_paths = ['./config', './public'];

// Function to check requirements
function check_requirements() {
    global $php_version_required, $extensions_required, $writable_paths;
    $errors = [];
    
    // Check PHP version
    if (version_compare(PHP_VERSION, $php_version_required, '<')) {
        $errors[] = "PHP version {$php_version_required} or higher is required. You are running " . PHP_VERSION;
    }
    
    // Check required extensions
    foreach ($extensions_required as $ext) {
        if (!extension_loaded($ext)) {
            $errors[] = "Required PHP extension not found: {$ext}";
        }
    }
    
    // Check writable directories
    foreach ($writable_paths as $path) {
        if (!is_writable($path)) {
            $errors[] = "Directory not writable: {$path}";
        }
    }
    
    return $errors;
}

// Function to create basic config file
function create_config_file($db_host, $db_name, $db_user, $db_pass, $restaurant_name, $restaurant_id) {
    // Create a config file with database information
    $config_content = <<<EOT
<?php
/**
 * Qimbo Kiosk Configuration
 * Generated on: {$date}
 */

// Database configuration
define('DB_HOST', '{$db_host}');
define('DB_NAME', '{$db_name}');
define('DB_USER', '{$db_user}');
define('DB_PASS', '{$db_pass}');

// Restaurant configuration
define('RESTAURANT_NAME', '{$restaurant_name}');
define('RESTAURANT_ID', '{$restaurant_id}');

// API configuration
define('SUPABASE_URL', 'https://rdjfqdpoesjvbluffwzm.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZxZHBvZXNqdmJsdWZmd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjUwMzMsImV4cCI6MjA1ODYwMTAzM30.EZY4vaHzt11hJhV2MR8S1c9PJHhZpbv0NZIdBm24QZI');

// Debug mode (set to false in production)
define('DEBUG_MODE', false);
EOT;

    $config_file = './config/config.php';
    if (!is_dir('./config')) {
        mkdir('./config', 0755, true);
    }
    
    file_put_contents($config_file, $config_content);
    
    if (file_exists($config_file)) {
        return true;
    }
    
    return false;
}

// Function to set up the database
function setup_database($db_host, $db_name, $db_user, $db_pass, $restaurant_id) {
    try {
        // Connect to the database
        $dsn = "pgsql:host={$db_host};dbname={$db_name}";
        $pdo = new PDO($dsn, $db_user, $db_pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Read the SQL file
        $sql_file = file_get_contents('./supabase/migrations/01_initial_schema.sql');
        
        // Add restaurant_id column to tables to support multi-tenancy
        $tenant_sql = <<<EOT
        
-- Add restaurant_id column to all tables to support multi-tenancy
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS restaurant_id TEXT NOT NULL DEFAULT '{$restaurant_id}';
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS restaurant_id TEXT NOT NULL DEFAULT '{$restaurant_id}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_id TEXT NOT NULL DEFAULT '{$restaurant_id}';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS restaurant_id TEXT NOT NULL DEFAULT '{$restaurant_id}';

-- Create indexes for faster lookups by restaurant_id
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON public.menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_restaurant_id ON public.order_items(restaurant_id);

-- Create restaurant settings table
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id SERIAL PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, setting_key)
);

-- Insert basic settings for this restaurant
INSERT INTO public.restaurant_settings (restaurant_id, setting_key, setting_value)
VALUES 
('{$restaurant_id}', 'ordering_settings', '{"requireTableSelection": true}'),
('{$restaurant_id}', 'appearance_settings', '{"logo": "", "primaryColor": "#f43f5e", "fontFamily": "system-ui"}')
ON CONFLICT (restaurant_id, setting_key) DO NOTHING;

-- Modify RLS policies to include restaurant_id
DROP POLICY IF EXISTS "Allow public read access for menu_categories" ON public.menu_categories;
CREATE POLICY "Allow public read access for menu_categories" ON public.menu_categories
    FOR SELECT USING (restaurant_id = '{$restaurant_id}');

DROP POLICY IF EXISTS "Allow public read access for menu_items" ON public.menu_items;
CREATE POLICY "Allow public read access for menu_items" ON public.menu_items
    FOR SELECT USING (restaurant_id = '{$restaurant_id}');

DROP POLICY IF EXISTS "Allow public read access for orders" ON public.orders;
CREATE POLICY "Allow public read access for orders" ON public.orders
    FOR SELECT USING (restaurant_id = '{$restaurant_id}');

DROP POLICY IF EXISTS "Allow public insert access for orders" ON public.orders;
CREATE POLICY "Allow public insert access for orders" ON public.orders
    FOR INSERT WITH CHECK (restaurant_id = '{$restaurant_id}');

DROP POLICY IF EXISTS "Allow public read access for order_items" ON public.order_items;
CREATE POLICY "Allow public read access for order_items" ON public.order_items
    FOR SELECT USING (restaurant_id = '{$restaurant_id}');

DROP POLICY IF EXISTS "Allow public insert access for order_items" ON public.order_items;
CREATE POLICY "Allow public insert access for order_items" ON public.order_items
    FOR INSERT WITH CHECK (restaurant_id = '{$restaurant_id}');
EOT;

        // Append the multi-tenant SQL to the initial schema
        $sql_file .= $tenant_sql;
        
        // Execute SQL statements (simplified execution - in production you'd want to split and execute separately)
        $pdo->exec($sql_file);
        
        return true;
    } catch (PDOException $e) {
        return $e->getMessage();
    }
}

// Function to generate a unique restaurant ID
function generate_restaurant_id($restaurant_name) {
    $base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $restaurant_name));
    if (empty($base)) {
        $base = 'restaurant';
    }
    return $base . '_' . substr(md5(uniqid(rand(), true)), 0, 8);
}

// Determine what step we're on
$step = isset($_GET['step']) ? $_GET['step'] : 'check';

// CSS for the setup pages
$css = <<<EOT
<style>
    body {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
    }
    .logo {
        text-align: center;
        margin-bottom: 30px;
    }
    .logo img {
        max-width: 180px;
    }
    h1 {
        color: #f43f5e;
        text-align: center;
    }
    .step-container {
        background: white;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .form-group {
        margin-bottom: 20px;
    }
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
    }
    input[type="text"],
    input[type="password"] {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
    }
    .button {
        background-color: #f43f5e;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
    }
    .button:hover {
        background-color: #e11d48;
    }
    .error {
        color: #e11d48;
        padding: 10px;
        background: #ffe4e6;
        border-radius: 4px;
        margin-bottom: 20px;
    }
    .success {
        color: #16a34a;
        padding: 10px;
        background: #dcfce7;
        border-radius: 4px;
        margin-bottom: 20px;
    }
    .steps {
        display: flex;
        margin-bottom: 30px;
        justify-content: center;
    }
    .step {
        padding: 10px 15px;
        margin: 0 5px;
        border-radius: 4px;
        background: #ddd;
    }
    .step.active {
        background: #f43f5e;
        color: white;
    }
</style>
EOT;

// Header HTML
$header = <<<EOT
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qimbo Kiosk Installation</title>
    {$css}
</head>
<body>
    <div class="logo">
        <img src="public/lovable-uploads/6837434a-e5ba-495a-b295-9638c9b5c27f.png" alt="Qimbo Kiosk">
    </div>
    <h1>Qimbo Kiosk Installation</h1>
EOT;

// Footer HTML
$footer = <<<EOT
</body>
</html>
EOT;

// Show the currently active step
function show_steps($current_step) {
    $steps = [
        'check' => 'Requirements Check',
        'db' => 'Database Setup',
        'restaurant' => 'Restaurant Info',
        'finish' => 'Complete'
    ];
    
    $html = '<div class="steps">';
    foreach ($steps as $key => $label) {
        $active = ($key === $current_step) ? ' active' : '';
        $html .= "<div class=\"step{$active}\">{$label}</div>";
    }
    $html .= '</div>';
    
    return $html;
}

// Handle each step
echo $header;

switch ($step) {
    case 'check':
        echo show_steps('check');
        echo '<div class="step-container">';
        
        $errors = check_requirements();
        
        if (empty($errors)) {
            echo '<div class="success">All requirements are met! You can proceed with the installation.</div>';
            echo '<form method="get">';
            echo '<input type="hidden" name="step" value="db">';
            echo '<div style="text-align: center;">';
            echo '<button type="submit" class="button">Continue to Database Setup</button>';
            echo '</div>';
            echo '</form>';
        } else {
            echo '<div class="error">';
            echo '<strong>Please fix the following issues before continuing:</strong>';
            echo '<ul>';
            foreach ($errors as $error) {
                echo "<li>{$error}</li>";
            }
            echo '</ul>';
            echo '</div>';
            echo '<a href="?step=check" class="button">Check Again</a>';
        }
        
        echo '</div>';
        break;
        
    case 'db':
        echo show_steps('db');
        echo '<div class="step-container">';
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['db_submit'])) {
            $db_host = $_POST['db_host'] ?? '';
            $db_name = $_POST['db_name'] ?? '';
            $db_user = $_POST['db_user'] ?? '';
            $db_pass = $_POST['db_pass'] ?? '';
            
            $connection_result = true; // Simplified - you'd want to actually test the connection
            
            if ($connection_result === true) {
                // Save temporarily in session (in production you'd use a more secure method)
                session_start();
                $_SESSION['db_info'] = [
                    'host' => $db_host,
                    'name' => $db_name,
                    'user' => $db_user,
                    'pass' => $db_pass
                ];
                
                // Redirect to next step
                header('Location: ?step=restaurant');
                exit;
            } else {
                echo '<div class="error">Database connection failed: ' . $connection_result . '</div>';
            }
        }
        
        echo '<h2>Database Configuration</h2>';
        echo '<p>Enter your database connection details below. You should have already created a PostgreSQL database on your o2switch hosting.</p>';
        
        echo '<form method="post">';
        
        echo '<div class="form-group">';
        echo '<label for="db_host">Database Host</label>';
        echo '<input type="text" id="db_host" name="db_host" value="localhost" required>';
        echo '</div>';
        
        echo '<div class="form-group">';
        echo '<label for="db_name">Database Name</label>';
        echo '<input type="text" id="db_name" name="db_name" required>';
        echo '</div>';
        
        echo '<div class="form-group">';
        echo '<label for="db_user">Database Username</label>';
        echo '<input type="text" id="db_user" name="db_user" required>';
        echo '</div>';
        
        echo '<div class="form-group">';
        echo '<label for="db_pass">Database Password</label>';
        echo '<input type="password" id="db_pass" name="db_pass" required>';
        echo '</div>';
        
        echo '<div style="text-align: center;">';
        echo '<button type="submit" name="db_submit" class="button">Continue</button>';
        echo '</div>';
        
        echo '</form>';
        echo '</div>';
        break;
        
    case 'restaurant':
        echo show_steps('restaurant');
        echo '<div class="step-container">';
        
        session_start();
        if (!isset($_SESSION['db_info'])) {
            echo '<div class="error">Please complete the database setup first.</div>';
            echo '<a href="?step=db" class="button">Go to Database Setup</a>';
            break;
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['restaurant_submit'])) {
            $restaurant_name = $_POST['restaurant_name'] ?? '';
            $restaurant_id = generate_restaurant_id($restaurant_name);
            
            $_SESSION['restaurant_info'] = [
                'name' => $restaurant_name,
                'id' => $restaurant_id
            ];
            
            // Redirect to next step
            header('Location: ?step=finish');
            exit;
        }
        
        echo '<h2>Restaurant Information</h2>';
        echo '<p>Enter the details about your restaurant.</p>';
        
        echo '<form method="post">';
        
        echo '<div class="form-group">';
        echo '<label for="restaurant_name">Restaurant Name</label>';
        echo '<input type="text" id="restaurant_name" name="restaurant_name" required>';
        echo '</div>';
        
        echo '<div style="text-align: center;">';
        echo '<button type="submit" name="restaurant_submit" class="button">Continue</button>';
        echo '</div>';
        
        echo '</form>';
        echo '</div>';
        break;
        
    case 'finish':
        echo show_steps('finish');
        echo '<div class="step-container">';
        
        session_start();
        if (!isset($_SESSION['db_info']) || !isset($_SESSION['restaurant_info'])) {
            echo '<div class="error">Please complete the previous steps first.</div>';
            echo '<a href="?step=check" class="button">Start Over</a>';
            break;
        }
        
        $db_info = $_SESSION['db_info'];
        $restaurant_info = $_SESSION['restaurant_info'];
        
        // Create config file
        $config_created = create_config_file(
            $db_info['host'],
            $db_info['name'],
            $db_info['user'],
            $db_info['pass'],
            $restaurant_info['name'],
            $restaurant_info['id']
        );
        
        // Set up database
        $db_setup = setup_database(
            $db_info['host'],
            $db_info['name'],
            $db_info['user'],
            $db_info['pass'],
            $restaurant_info['id']
        );
        
        // Create or update .htaccess to add restaurant_id to all requests
        $htaccess_content = <<<EOT
# Qimbo Kiosk .htaccess
# Generated during installation

# Enable rewrite engine
RewriteEngine On

# Set restaurant ID for this installation
SetEnv RESTAURANT_ID {$restaurant_info['id']}

# Handle SPA routing - send all requests to index.html except for existing files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# Cache static assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    Header set Cache-Control "max-age=2592000, public"
</FilesMatch>

# Don't cache HTML
<FilesMatch "\.(html)$">
    Header set Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
</FilesMatch>
EOT;
        
        file_put_contents('.htaccess', $htaccess_content);
        
        // Update env.js in public folder to be able to access restaurant_id in the frontend
        $env_js_content = <<<EOT
// This file is generated during installation
window.env = {
    RESTAURANT_ID: "{$restaurant_info['id']}",
    RESTAURANT_NAME: "{$restaurant_info['name']}",
    SUPABASE_URL: "https://rdjfqdpoesjvbluffwzm.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZxZHBvZXNqdmJsdWZmd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjUwMzMsImV4cCI6MjA1ODYwMTAzM30.EZY4vaHzt11hJhV2MR8S1c9PJHhZpbv0NZIdBm24QZI"
};
EOT;
        
        if (!is_dir('./public')) {
            mkdir('./public', 0755, true);
        }
        file_put_contents('./public/env.js', $env_js_content);
        
        // Display result
        if ($config_created && $db_setup === true) {
            echo '<div class="success">';
            echo '<h2>Installation Successful!</h2>';
            echo '<p>Your Qimbo Kiosk installation has been completed successfully for:</p>';
            echo '<p><strong>' . htmlspecialchars($restaurant_info['name']) . '</strong></p>';
            echo '<p>Restaurant ID: <code>' . htmlspecialchars($restaurant_info['id']) . '</code></p>';
            
            echo '<h3>Next Steps:</h3>';
            echo '<ol>';
            echo '<li>Delete the setup.php file for security.</li>';
            echo '<li>Access your kiosk admin at <a href="./admin">./admin</a> to complete your menu setup.</li>';
            echo '<li>Your customer-facing kiosk is available at the root URL.</li>';
            echo '</ol>';
            
            // Clear the session
            session_destroy();
            
            echo '<div style="text-align: center; margin-top: 20px;">';
            echo '<a href="./" class="button">Go to My Kiosk</a>';
            echo '</div>';
            
            echo '</div>';
        } else {
            echo '<div class="error">';
            echo '<h2>Installation Failed</h2>';
            echo '<p>There was an error during the installation process:</p>';
            
            if (!$config_created) {
                echo '<p>Could not create config file. Please check directory permissions.</p>';
            }
            
            if ($db_setup !== true) {
                echo '<p>Database setup error: ' . $db_setup . '</p>';
            }
            
            echo '<div style="text-align: center; margin-top: 20px;">';
            echo '<a href="?step=check" class="button">Start Over</a>';
            echo '</div>';
            
            echo '</div>';
        }
        
        echo '</div>';
        break;
        
    default:
        // Redirect to first step
        header('Location: ?step=check');
        exit;
}

echo $footer;
