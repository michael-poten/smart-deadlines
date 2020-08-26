FROM node:12
WORKDIR /usr/src/app
COPY package*.json ./
ENV DOCKER_MODE=true
RUN npm install
COPY . .
EXPOSE 49024
CMD [ "node", "server.js" ]