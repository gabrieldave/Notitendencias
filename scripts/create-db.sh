#!/usr/bin/env bash
# Crea la base de datos en el contenedor PostgreSQL del VPS si no existe.
# Ajusta el nombre del contenedor si cambia en Docker.
set -euo pipefail

docker exec -it ys0ocwcwgso8co0ooko8gc4w psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'notitendencias'" | grep -q 1 \
  || docker exec -it ys0ocwcwgso8co0ooko8gc4w psql -U postgres -c "CREATE DATABASE notitendencias OWNER cursor;"

echo "Base notitendencias lista."
