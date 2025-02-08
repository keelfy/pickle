#!/bin/bash
set -e

echo "Starting database migrations..."

if [ -z "$DATABASE_PUBLIC_URL" ]; then
  echo "Error: DATABASE_PUBLIC_URL environment variable not set."
  exit 1
fi

echo "Running migrations..."
migrate -database "$DATABASE_PUBLIC_URL" -path $ROOT_DIR/db/migration up

if [ $? -ne 0 ]; then
  echo "Error: Database migrations failed."
  exit 1
fi

echo "Database migrations completed successfully."

echo "Generating SQLc code..."
sqlc generate

if [ $? -ne 0 ]; then
  echo "Error: SQLc code generation failed."
  exit 1
fi

echo "SQLc code generation completed successfully."

echo "Database migration and SQLc code generation process finished."
