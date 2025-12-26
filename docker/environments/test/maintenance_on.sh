cd /home/deploy/symbro_test/docker/environments/test/
docker compose down
cd maintenance
docker compose build --no-cache
docker compose up -d