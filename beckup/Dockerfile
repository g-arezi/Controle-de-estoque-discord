FROM node:18

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "until node -e \"const net=require('net'); const s=net.createConnection({host:'postgres', port:5432}, () => { s.end(); process.exit(0); }); s.on('error', () => process.exit(1));\"; do echo 'Aguardando PostgreSQL...'; sleep 2; done && npx prisma migrate deploy && npm start"]
