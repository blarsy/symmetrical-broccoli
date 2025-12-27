cd /home/deploy/symbro/docker/environments/prod/
docker compose down
cd maintenance
docker compose build --no-cache
docker compose up -d