const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

wss.on('connection', (ws) => {
    let alifProcess = null;
    let tempFile = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // عند استلام أمر التشغيل
        if (data.type === 'run') {
            if (alifProcess) alifProcess.kill();

            // إنشاء ملف مؤقت
            tempFile = `temp_${crypto.randomBytes(4).toString('hex')}.alif`;
            fs.writeFileSync(tempFile, data.code);

            // --- التعديل الذكي لتحديد نوع النظام (ويندوز أو لينكس) ---
            const enginePath = process.platform === 'win32' ? 'alif.exe' : './aliflang/alif';
            
            // تشغيل محرك ألف 5.3
            alifProcess = spawn(enginePath, [tempFile]);
            // ---------------------------------------------------------

            alifProcess.stdout.on('data', (out) => {
                ws.send(JSON.stringify({ type: 'output', text: out.toString() }));
            });

            alifProcess.stderr.on('data', (err) => {
                ws.send(JSON.stringify({ type: 'error', text: err.toString() }));
            });

            alifProcess.on('close', (code) => {
                ws.send(JSON.stringify({ type: 'done' }));
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                alifProcess = null;
            });
        } 
        
        // عند استلام إدخال من المستخدم في الـ Terminal
        else if (data.type === 'input') {
            if (alifProcess && !alifProcess.killed) {
                alifProcess.stdin.write(data.text + '\n');
            }
        }
    });

    // التنظيف عند إغلاق الاتصال
    ws.on('close', () => {
        if (alifProcess) alifProcess.kill();
        if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    });
});

// استخدام المنفذ السحابي 8080 الذي تطلبه Fly.io
// تحديد المنفذ 8080 بشكل قاطع
const PORT = 8080;

// التأكد من وجود '0.0.0.0' لقبول الاتصالات الخارجية
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 خادم ألف 5.3 التفاعلي يعمل الآن على المنفذ ${PORT}!`);
});