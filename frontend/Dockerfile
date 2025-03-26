FROM node:16-alpine

WORKDIR /app

# Kullanıcı izinleri için node_modules klasörünü oluştur
RUN mkdir -p /app/node_modules && chown -R node:node /app

# node kullanıcısına geç
USER node

# npm yapılandırması
RUN npm config set network-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000

# package.json ve package-lock.json kopyala
COPY --chown=node:node package*.json ./

# npm install ve cache temizleme
RUN npm cache clean --force && \
    npm install --legacy-peer-deps && \
    npm install -D tailwindcss@3.3.0 postcss@8.4.21 autoprefixer@10.4.14 postcss-import@15.1.0 && \
    npm cache clean --force

# Kaynak kodları kopyala
COPY --chown=node:node . .

# Build
RUN npm run build

EXPOSE 3000

# Production modunda çalıştır
CMD ["npm", "start"] 