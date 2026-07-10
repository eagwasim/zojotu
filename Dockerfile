# Step 1: Base image
FROM node:18-alpine

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Step 4: Install dependencies
# Using npm ci is faster and more reliable for automated builds
RUN npm ci

# Step 5: Copy the rest of your application code
COPY . .

# Step 6: Build the Next.js application
RUN npm run build

# Step 7: Expose the port your app runs on
EXPOSE 3000

# Step 8: Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Step 9: Start the Next.js server
CMD ["npm", "start"]