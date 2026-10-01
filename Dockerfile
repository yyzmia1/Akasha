FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

ARG VITE_GIT_COMMIT=""
ARG VITE_GIT_BRANCH=""
ENV VITE_GIT_COMMIT=${VITE_GIT_COMMIT}
ENV VITE_GIT_BRANCH=${VITE_GIT_BRANCH}

COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
