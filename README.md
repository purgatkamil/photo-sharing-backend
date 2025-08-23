# Backend init
npm init -y
npm install express
npm install -D typescript ts-node @types/node @types/express nodemon
npx tsc --init


Add in tsconfig.json:
"rootDir": "./src",
"outDir": "./dist",
"strict": true,
"esModuleInterop": true,
"type": "module"

# Database init
npm i -D prisma
npm i @prisma/client
npx prisma init --datasource-provider sqlite

npx prisma migrate dev --name init

npm i morgan dotenv
npm i --save-dev @types/morgan

# Files upload
npm i multer sharp uuid mime-types
npm i -D @types/multer @types/mime-types

npx prisma studio

