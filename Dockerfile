# ==============================================================================
# ATK LIGHT - DOCKERFILE CHẠY 24/24 TRÊN CLOUD / VPS / RENDER / RAILWAY
# Đóng gói toàn bộ Frontend (React Vite) & Backend (NestJS + SQLite) vào 1 Container duy nhất
# ==============================================================================

# ----------------- GIAI ĐOẠN 1: Build Frontend -----------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ----------------- GIAI ĐOẠN 2: Build Backend ------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ----------------- GIAI ĐOẠN 3: Runtime Sản Phẩm 24/24 ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/prod.db"
ENV JWT_SECRET="atk-light-super-secure-production-key-2026"
ENV JWT_REFRESH_SECRET="atk-light-refresh-secure-production-key-2026"
ENV JWT_EXPIRES_IN="15m"
ENV JWT_REFRESH_EXPIRES_IN="7d"

# Cài đặt công cụ cần thiết
RUN apk add --no-cache openssl

# Thư mục lưu database SQLite lâu dài
RUN mkdir -p /app/data

# Copy backend dependencies & code đã build
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

# Copy static frontend vào thư mục client để Backend phục vụ trực tiếp
COPY --from=frontend-builder /app/dist ./client

# Mở cổng 3001 (hoặc cổng do Cloud quy định)
EXPOSE 3001

# Khởi động DB và chạy hệ thống 24/24
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && node prisma/seed.js && node dist/main"]
