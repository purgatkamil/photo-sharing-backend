npm init -y
npm install express
npm install -D typescript ts-node @types/node @types/express nodemon
npx tsc --init


Add in tsconfig.json:
"rootDir": "./src",
"outDir": "./dist",
"strict": true,
"esModuleInterop": true,