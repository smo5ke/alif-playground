# استخدام نسخة خفيفة وسريعة من Node.js
FROM node:20-bookworm-slim

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملفات المكتبات وتثبيتها
COPY package*.json ./
RUN npm install

# نسخ السيرفر وملف محرك ألف 5.3 (نسخة لينكس)
COPY . .

# إعطاء صلاحية التشغيل لمحرك لغة ألف
RUN chmod +x ./aliflang/alif

# فتح المنفذ وتشغيل السيرفر
EXPOSE 8080
CMD ["node", "server.js"]