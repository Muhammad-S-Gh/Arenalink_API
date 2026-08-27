FROM node:22-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./

# Execute this while constructing the image.

RUN npm ci

FROM deps AS development

COPY . .

ENV NODE_ENV=development

EXPOSE 3000

# Execute this when a container starts.

CMD ["npm", "run", "start:dev"] 

FROM deps AS builder

COPY . .

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p \
    uploads/profile_pictures \
    uploads/categories \
    uploads/facilities

EXPOSE 3000

CMD ["node", "dist/main.js"]
