
# Qimbo Kiosk - Guide d'Installation

Ce guide vous aidera à installer et configurer votre kiosque de commande Qimbo pour votre restaurant.

## Méthode 1: Installation sur un hébergement o2switch

### Prérequis
- Un compte d'hébergement o2switch
- Accès FTP à votre hébergement
- Les identifiants de base de données MySQL fournis par o2switch

### Étapes d'installation

1. **Téléchargez les fichiers**
   - Téléchargez l'archive ZIP du kiosque Qimbo depuis votre espace client
   - Décompressez l'archive sur votre ordinateur

2. **Transférez les fichiers via FTP**
   - Connectez-vous à votre hébergement o2switch via FTP
   - Transférez tous les fichiers du dossier `dist` vers le répertoire web de votre hébergement (généralement `www` ou `public_html`)

3. **Configuration de la base de données**
   - Accédez à votre panneau de contrôle o2switch
   - Créez une nouvelle base de données MySQL si vous n'en avez pas déjà une
   - Importez le fichier SQL initial (`01_initial_schema.sql` et `02_multi_tenant_schema.sql`) dans votre base de données

4. **Configuration du .htaccess**
   - Assurez-vous que le fichier `.htaccess` est présent à la racine de votre site
   - Ce fichier est essentiel pour le bon fonctionnement de l'application

5. **Initialisation du kiosque**
   - Ouvrez votre navigateur et accédez à votre site (https://votre-domaine.com/setup)
   - Suivez l'assistant d'installation pour configurer votre kiosque:
     - Informations du restaurant
     - Compte administrateur
     - Paramètres de base (devise, TVA, etc.)

6. **Finalisation**
   - Après avoir terminé l'assistant d'installation, vous serez redirigé vers la page d'accueil
   - Connectez-vous à l'interface d'administration (https://votre-domaine.com/admin) pour personnaliser davantage votre kiosque

## Méthode 2: Installation avec Docker (pour serveurs dédiés)

### Prérequis
- Un serveur Linux avec Docker et Docker Compose installés
- Accès SSH au serveur

### Étapes d'installation

1. **Clonez le dépôt Git ou téléchargez les fichiers**
   ```bash
   git clone <url-du-repo> qimbo-kiosk
   cd qimbo-kiosk
   ```

2. **Configuration des variables d'environnement**
   ```bash
   # Créez un fichier .env avec les informations nécessaires
   touch .env
   echo "SUPABASE_URL=http://db:8000" >> .env
   echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZxZHBvZXNqdmJsdWZmd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjUwMzMsImV4cCI6MjA1ODYwMTAzM30.EZY4vaHzt11hJhV2MR8S1c9PJHhZpbv0NZIdBm24QZI" >> .env
   ```

3. **Lancez les conteneurs Docker**
   ```bash
   docker-compose up -d
   ```

4. **Initialisation du kiosque**
   - Ouvrez votre navigateur et accédez à http://localhost:8080/setup
   - Suivez l'assistant d'installation pour configurer votre kiosque

## Support technique

Si vous rencontrez des problèmes durant l'installation, veuillez contacter notre équipe de support:

- Email: support@qimbo-kiosk.com
- Téléphone: +33 1 23 45 67 89
- Documentation en ligne: https://docs.qimbo-kiosk.com

## Dépannage

### Problèmes courants

1. **Page blanche après installation**
   - Vérifiez que le fichier `.htaccess` est correctement transféré
   - Assurez-vous que le module mod_rewrite est activé sur votre hébergement

2. **Erreurs de base de données**
   - Vérifiez vos identifiants de connexion à la base de données
   - Assurez-vous que les tables ont été correctement créées

3. **Images non affichées**
   - Vérifiez les permissions des dossiers d'upload
   - Le dossier `public/uploads` doit être accessible en écriture
