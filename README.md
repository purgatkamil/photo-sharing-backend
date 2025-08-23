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

# Unit tests
npm i -D jest ts-jest @types/jest supertest @types/supertest
npm i -D @types/jest

# QR codes
npm i qrcode
npm i -D @types/qrcode
npm i -D tsx

# Connecting with frontend
npm i --save-dev @types/cors

