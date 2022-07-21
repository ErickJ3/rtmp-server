FROM node:12-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apk update && apk upgrade
RUN apk add python3 g++ make

COPY . /usr/src/app/
RUN yarn install

EXPOSE 8888
EXPOSE 1935

CMD yarn start