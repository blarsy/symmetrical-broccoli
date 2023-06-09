cd /home/symbro
rm -rf web
mkdir -p web
unzip ./web.zip -d ./web/
cd /home/symbro/docker
docker compose down
docker compose build --no-cache
docker compose up -d