
# Qimbo Kiosk Docker Installation Guide

This guide will help you set up the Qimbo Kiosk application locally using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Installation Steps

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd qimbo-kiosk
   ```

2. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   Open your browser and navigate to `http://localhost:8080`

## Database Setup

The Postgres database is automatically initialized with the Supabase schema. If you need to run custom migrations:

1. Place your SQL files in the `supabase/migrations` directory
2. Ensure they have a `.sql` extension and are numbered for execution order (e.g., `01_create_tables.sql`)
3. Restart the database container:
   ```bash
   docker-compose restart db
   ```

## Environment Variables

You can customize the following environment variables in a `.env` file:

- `SUPABASE_URL`: Your Supabase URL (defaults to local db)
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Stopping the Application

To stop the containers:
```bash
docker-compose down
```

To stop the containers and remove volumes:
```bash
docker-compose down -v
```

## Troubleshooting

- **Database connection issues**: Check if the database container is running with `docker-compose ps`
- **Application not loading**: Check Docker logs with `docker-compose logs app`
- **Database logs**: Check with `docker-compose logs db`
