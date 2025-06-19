# Crates Database

PostgreSQL database for the Crates application.

## Quick Start

```bash
# Start database
./start-database.sh

# Stop database  
./stop-database.sh

# Restart database
./restart-database.sh
```

## Database Connection

- **Host**: localhost (or `crates-database` from within Docker network)
- **Port**: 5432
- **Database**: crates
- **Username**: crates
- **Password**: cratesforfun

## Docker Configuration

- **Container Name**: crates-database
- **Network**: crates-network
- **Volume**: crates-database (persistent storage)
- **Image**: postgres:12-bullseye

## Useful Commands

```bash
# View logs
docker logs -f crates-database

# Connect to database
docker exec -it crates-database psql -U crates -d crates

# Remove volume (deletes all data)
docker volume rm crates-database
```