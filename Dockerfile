# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Build the project
RUN npm run build

# Make port 80 available to the world outside this container
EXPOSE 80

# Run the app when the container launches
CMD [ "npm", "start" ]
