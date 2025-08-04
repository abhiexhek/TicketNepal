# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY . .

# Add these two lines for build-time env injection
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm install
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "next start -p $PORT"] 