FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_SOCKET_URL=/
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config with try_files for React Router SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
