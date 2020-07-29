const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../../../jest-puppeteer.config');

module.exports = class {
    constructor() {
        this.port = config.server.port;
        this.buildPath = path.join(process.cwd(), 'build');
        this.server = null;
    }

    startServer() {
        if (this.server) return this.server;

        const app = express();

        this.validateBuildPath();
        this.addStaticFiles(app);

        this.server = app.listen(this.port, () => {
            console.log(`Express server listening on port ${this.port}!`);
        });

        return this.server;
    }

    validateBuildPath() {
        if (!fs.existsSync(this.buildPath)) {
            throw new Error(`Failed to start server. Directory ${this.buildPath} does not exist`);
        }
    }

    addStaticFiles(app) {
        app.use(express.static(this.buildPath));
    }
};
