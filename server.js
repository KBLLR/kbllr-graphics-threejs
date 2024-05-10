import http from 'http';
import fs from 'fs';
import path from 'path';

const port = 3000;

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? 'index.html' : req.url;
    filePath = path.join(__dirname, 'public', filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404);
                res.end('404 - File Not Found');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`500 - Internal Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        }
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});

export default server;
