const http = require('http');
const fs = require('fs');
const path = require('path');

// Dokploy dynamically injects the PORT environment variable.
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    // Split URL to separate pathname from query parameters
    const [urlPath] = req.url.split('?');

    // Sanitize path to prevent directory traversal
    let safeUrl = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    if (safeUrl === '\\' || safeUrl === '/') {
        safeUrl = '/index.html';
    }

    let filePath = path.join(__dirname, safeUrl);

    // Support Clean URLs (e.g., mapping '/programs' to '/programs.html')
    const ext = path.extname(filePath);
    if (!ext) {
        if (fs.existsSync(filePath + '.html')) {
            filePath += '.html';
        } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
            filePath = path.join(filePath, 'index.html');
        }
    }

    const fileExt = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[fileExt] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile(path.join(__dirname, '404.html'), (err404, content404) => {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(content404 || '<h1>404 Not Found</h1>', 'utf-8');
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Server Error: ' + error.code);
            }
        } else {
            const headers = { 'Content-Type': contentType };

            // Leverage Browser Caching: 1 year for static assets, no-cache for HTML
            if (fileExt === '.html') {
                headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
            } else if (['.woff2', '.webp', '.png', '.jpg', '.jpeg', '.css', '.js', '.ico'].includes(fileExt)) {
                headers['Cache-Control'] = 'public, max-age=31536000, immutable';
            }

            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
