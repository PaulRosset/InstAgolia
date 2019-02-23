FROM node:10-alpine

COPY . /app
WORKDIR /app
RUN apk update
RUN apk add py3-setuptools
RUN /usr/bin/pip3.6 install instagram-scraper

RUN npm install
CMD ["yarn", "start"]