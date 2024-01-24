# Use an official Node.js runtime as a parent image
FROM node:lts-buster AS Development

# Set the working directory in the container
WORKDIR /src

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the application code to the container
COPY . .

COPY prisma ./prisma/

RUN npx prisma generate
RUN npm run build 

# Expose the port that the application will run on
EXPOSE 8080

# Define the command to run the application

CMD ["npm", "run", "start:prod"]
