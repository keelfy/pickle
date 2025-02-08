#!/bin/bash
set -e

echo "Starting database migrations..."

# --- Database Connection ---
# The DATABASE_URL should be passed as an environment variable
# (e.g., from GitHub Secrets).  The Railway CLI will automatically
# inject environment variables into the `railway run` command.
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set."
  exit 1
fi

# --- Migration Execution ---
# Assuming you're using golang-migrate/migrate
echo "Running migrations..."
migrate -database "$DATABASE_URL" -path db/migrations up

# Check if migrations were successful
if [ $? -ne 0 ]; then
  echo "Error: Database migrations failed."
  exit 1
fi

echo "Database migrations completed successfully."

# --- SQLc Code Generation ---
echo "Generating SQLc code..."
sqlc generate

# Check if SQLc code generation was successful
if [ $? -ne 0 ]; then
  echo "Error: SQLc code generation failed."
  exit 1
fi

echo "SQLc code generation completed successfully."

echo "Database migration and SQLc code generation process finished."
