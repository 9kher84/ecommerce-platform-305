const http = require('http');
const listEndpoints = require('express-list-endpoints');
const fs = require('fs');

const oldListen = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) {
    console.log("Mocking http server listen. Extracting routes...");
    try {
        // Find the Express app instance attached to this server (often as request handler)
        const app = require('./server'); // Assuming app is exported from server.js
        const endpoints = listEndpoints(app);
        fs.writeFileSync('runtime_routes.json', JSON.stringify(endpoints, null, 2));
        console.log(`Successfully extracted ${endpoints.length} runtime endpoints.`);
        process.exit(0);
    } catch(e) {
        console.error("Error extracting endpoints:", e);
        process.exit(1);
    }
};

// Now load the server
const app = require('./server');
app.startServer();
