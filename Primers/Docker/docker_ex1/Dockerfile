# Example Dockerfile. You can find documentation at https://docs.docker.com/reference/dockerfile/

# FROM baseImage:tag - this specifies the base image and its version
FROM node:14
# WORKDIR /the/workdir/path - path to use as the working directory
WORKDIR /usr/src/app
# Copy files or folders from source (on your laptop) to the dest path (in the image)
COPY package*.json ./
# RUN is used to run commands inside the container. Here we want to install all required modules from package.json before we actually run our program
RUN npm install
# Here we want to copy all files from our laptop code to the container
COPY . .
# EXPOSE is used to specify all ports in the container that we will need
EXPOSE 3000
# CMD specifies the command used to start the application. We can only have one CMD statement in our Dockerfile
CMD ["node", "app.js"]
