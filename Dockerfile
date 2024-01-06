# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Install necessary libraries for the 'canvas' module
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config

# Pull the latest version of the code from the repository
RUN git clone https://github.com/HayHay404/Gaming84.git

# Copy package.json and package-lock.json (or yarn.lock) into the container
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# Copy the rest of your application's code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Define the command to run your app
CMD ["npm", "run", "start"]
