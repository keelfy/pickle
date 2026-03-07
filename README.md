# Pickle API

This is the API for the Pickle app.

## What is Pickle?

Pickle is a platform for collecting and sharing a content that users find interesting or worth remembering.
Also, it is a platform for content-makers to communicate with their audience by sharing opinions.

## Brief overview of the pickle infrastructure

Note that this is a first version of the infrastructure, and it will be changed in the future.

![Pickle Infrastructure](./docs/architecture%20v1.png)

## Useful links

- [DEPLOYED DEMO](https://pickle.pw/keelfy)
- [frontend repo](https://github.com/keelfy/pickle-front)
- [Swagger](https://staging.api.pickle.pw/swagger/index.html)
- [figma design](https://www.figma.com/design/2X3MAm8ddAmANWGLQHiP5h/Pickle)
- [tasks board on linear](https://linear.app/rubedo/team/PIC)

## Mise quick start

This project ships with `mise.toml` to manage tool versions and common tasks.

1. Install mise: <https://mise.jdx.dev/getting-started.html>
2. Activate mise in your shell (zsh):
   - `echo 'eval "$(mise activate zsh)"' >> ~/.zshrc`
   - `source ~/.zshrc`
3. Install tools from this repo config:
   - `mise install`
4. Run tasks:
   - Start API locally: `mise run run-dev`
   - SQL migrations up: `mise run migrate-up`
   - SQL migrations down: `mise run migrate-down`
   - Add SQL migration: `mise run add-migration -- <migration_name>`
   - Run Elasticsearch migrations: `mise run es-migrate-up`
   - Add Elasticsearch migration: `mise run add-es-migration -- <migration_name>`

## Elasticsearch migrations

Elasticsearch index migrations are managed by a dedicated one-shot CLI binary (`./migrate`).

- Migration files live in `./db/elasticsearch/migration`
- Create a new migration file: `make es-add-migration name=<migration_name>`
- Run migrations locally (containerized): `make es-migrate-up`
- Production flow: run `./migrate` from the image before starting/restarting API containers

Example deployment sequence:

```bash
docker run --rm --env-file .env ghcr.io/<owner>/monolith:latest ./migrate
docker compose up -d
```

## Short-term goals for the API only (2025-01-21)

1. Implement the same logic as for games for the movies, series, anime, and videos.
2. A complete cache layer for the API, using Redis (only imgproxy URLs cached at the moment).
3. Payment processing for the content orders using Paddle.
4. An option to switch on/off the orders.
5. Support for moderators to help content makers to moderate their content.
6. Integration with the DonationAlerts, DonatePay, Streamlabs and StreamElements (maybe other services too, but these for starters).
7. OpenTelementry to track usage.
8. Rate limiting.

-- That's it for the next couple of months :)
