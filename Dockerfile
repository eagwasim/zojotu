# Step 1: Base image
FROM node:20-alpine

# Step 2: Install system build dependencies needed for native C++ modules (like better-sqlite3)
RUN apk add --no-cache python3 make g++

# Step 3: Set the working directory
WORKDIR /app

# Step 4: Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Step 5: Install dependencies
RUN npm install

# Step 6: Copy the rest of your application code
COPY . .

# Step 7: Build the Next.js application
RUN npm run build

# Step 8: Expose the port your app runs on
EXPOSE 3000

# Step 9: Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Step 10: Start the Next.js server
CMD ["npm", "start"]