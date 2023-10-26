cd /home/symbro_test
rm -rf web
mkdir -p web
unzip ./web_test.zip -d ./web/
cd /home/symbro_test/docker
docker compose down
docker compose build --no-cache
docker compose up -d