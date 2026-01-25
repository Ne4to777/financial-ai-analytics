#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 8000;
const WS_PORT = 8001;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.md': 'text/markdown',
};

// WebSocket server for hot reload
const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('📱 Client connected');
    clients.add(ws);
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log('📱 Client disconnected');
    });
});

function notifyClients() {
    clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send('reload');
        }
    });
}

// Watch for file changes
const watchDirs = ['../diagrams', '../prototypes', '.'];
const watchExtensions = ['.md', '.html', '.js', '.css'];

watchDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
            if (filename) {
                const ext = path.extname(filename);
                if (watchExtensions.includes(ext)) {
                    console.log(`🔄 File changed: ${filename}`);
                    setTimeout(() => notifyClients(), 100);
                }
            }
        });
        console.log(`👀 Watching: ${dir}`);
    }
});

// HTTP Server
const server = http.createServer((req, res) => {
    // Remove query parameters from URL
    const urlPath = req.url.split('?')[0];
    
    let filePath = '.' + urlPath;
    if (filePath === './') {
        filePath = './view-diagram-full.html';
    }
    
    // Handle /diagrams/* requests - redirect to ../diagrams/
    if (filePath.startsWith('./diagrams/')) {
        filePath = '.' + filePath.replace('./diagrams/', '/../diagrams/');
    }
    
    // Handle /prototypes/* requests - redirect to ../prototypes/
    if (filePath.startsWith('./prototypes/')) {
        filePath = '.' + filePath.replace('./prototypes/', '/../prototypes/');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            // Inject WebSocket script for hot reload
            if (extname === '.html') {
                const injectedContent = content.toString().replace(
                    '</body>',
                    `
<script>
    (function() {
        const ws = new WebSocket('ws://localhost:${WS_PORT}');
        ws.onmessage = (msg) => {
            if (msg.data === 'reload') {
                console.log('🔄 Hot reload triggered');
                location.reload();
            }
        };
        ws.onopen = () => console.log('✅ Live reload connected');
        ws.onerror = () => console.log('❌ Live reload connection failed');
    })();
</script>
</body>`
                );
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(injectedContent, 'utf-8');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        }
    });
});

server.listen(PORT, () => {
    console.log('\n🚀 Live Server with Hot Reload Started!\n');
    console.log(`📡 HTTP Server:      http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server: ws://localhost:${WS_PORT}`);
    console.log(`\n🌐 Open in browser:  http://localhost:${PORT}/view-diagram-full.html\n`);
    console.log('Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    wss.close();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
