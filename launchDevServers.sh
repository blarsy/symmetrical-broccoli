
cd scheduler
yarn build
cd ..
mkdir -p ./docker/local/scheduler/src/ && cp -r scheduler/* ./docker/local/scheduler/src/
cp scheduler/.env.development ./docker/local/scheduler/src/.env
cd docker/local

docker compose down
docker compose build --no-cache
docker compose up -d