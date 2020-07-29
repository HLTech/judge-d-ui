/** global: v8debug */
const IS_NODE_DEBUG =
    typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' ')) || /debug/.test(process.env.NODE_OPTIONS);

module.exports = {
    launch: {
        // Additional arguments to pass to the browser instance.
        args: ['--lang=en-GB', '--start-maximized'],

        // Whether to run browser in headless mode or standard, window mode
        headless: !IS_NODE_DEBUG,

        // auto-open devtools
        devtools: IS_NODE_DEBUG,

        // Slows down Puppeteer operations by the specified amount of milliseconds
        slowMo: 0,

        //  Whether to pipe the browser console
        dumpio: true,

        defaultViewport: {
            width: 1280,
            height: 720,
        },
    },

    // Used to start http server
    server: {
        command: 'node test/functional/server/start-server.js',
        port: 9000,
        usedPortAction: 'error',
    },
};
