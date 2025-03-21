FROM node:16

WORKDIR /app

# Kullanıcı izinleri için node_modules klasörünü oluştur
RUN mkdir -p /app/node_modules && chown -R node:node /app

# node kullanıcısına geç
USER node

# npm yapılandırması
RUN npm config set network-timeout 300000

COPY --chown=node:node package*.json ./
RUN npm cache clean --force && npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "start"] 