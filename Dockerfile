FROM node:10-alpine

ENV PORT 80
EXPOSE 80

WORKDIR /app/

COPY package.json package-lock.json /app/
# RUN apk update && \
# 	apk --no-cache add python build-base && \
# 	npm install --only=production && \
# 	apk del python build-base
RUN npm install --only=production

COPY lib /app/lib
COPY server /app/server

CMD npm start