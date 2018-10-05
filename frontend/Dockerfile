FROM node:latest

# RUN apk add yarn

# RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
# RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
# RUN sudo apt-get update && sudo apt-get install yarn

COPY package.json /packages/
WORKDIR /packages/
RUN npm install
RUN npm install -g yarn
# RUN rm package.json
# RUN pwd
# ENV NODE_PATH=/install/node_modules

WORKDIR /src/

CMD ["bash", "start.sh"]