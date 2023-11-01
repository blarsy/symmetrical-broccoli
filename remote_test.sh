cd /home/symbro_test
rm -rf web
mkdir -p web
unzip ./web_test.zip -d ./web/
cd /home/symbro_test/docker
docker compose down
docker compose build --no-cache
docker compose up -d

#Restart the dockerized proxy, as it seems to lose its ways when a container responding to a proxied url is recreated
docker stop docker-sb_proxy-1
docker start docker-sb_proxy-1
