(async () => {
    // imports dan setup seperti biasa
    const express = require('express');
    const path = require('path');
    const chalk = require('chalk');
    const { consola } = require('consola');
    const loader = require('./lib/loader');
    const scraper = require('./lib/scrape');
    const minim = require('./lib/func');
    const axios = require('axios');
    const config = require('./lib/config');
    const PORT = process.env.PORT || 7860;

    const app = express();
    app.set('json spaces', 2);
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, './views'));
    app.use(express.static(path.join(__dirname, './public')));
    app.use(express.json({ limit: '1gb' }));
    app.use(express.urlencoded({ limit: '1gb', extended: true }));
    app.use(minim);

    // sediakan res.reply jika belum ada
    if (!express.response.reply) {
      express.response.reply = function(data, options) {
        if (options && options.code) this.status(options.code);
        return this.json(data);
      };
    }

    consola.start('Starting server initialization...');

    // Middleware log tiap request
    app.use((req, res, next) => {
        req.startTime = Date.now();
        res.on('finish', () => {
            const statusColor = res.statusCode >= 400 ? 'red' : res.statusCode >= 300 ? 'yellow' : 'green';
            const methodColor = req.method === 'POST' ? 'blue' : req.method === 'GET' ? 'green' : 'cyan';
            consola.info(`${chalk[methodColor](req.method)} ${req.path} [${chalk[statusColor](res.statusCode)}]`);
        });
        next();
    });

    // Helpers
    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    Array.prototype.randomize = function () {
        return this[Math.floor(Math.random() * this.length)];
    };

    consola.start('Loading scraper module...');
    global.scrape = (name) => scraper(name);

    consola.start('Loading API endpoints...');
    global.allEndpoints = loader.loadEndpointsFromDirectory('api', app);

    consola.ready(`Loaded ${allEndpoints.reduce((t, c) => t + c.items.length, 0)} endpoints`);

    // Kirim endpoints ke semua views via locals supaya sidebar bisa akses endpoints tanpa perlu passing manual
    app.use((req, res, next) => {
      res.locals.endpoints = global.allEndpoints;
      next();
    });

    // HOME PAGE
    app.get('/', async (req, res) => {
        const { type } = req.query;

        if (type === 'json') {
            return res.reply({
                meta: config.meta,
                baseURL: `${req.protocol}://${req.get('host')}`
            });
        }

        res.render('home', {
            name: config.meta.name,
            version: config.meta.version,
            description: config.meta.description,
            icon: config.meta.icon
        });
    });

    // API EXPLORER (list kategori)
    app.get('/api', async (req, res) => {
        const { type } = req.query;

        if (type === 'json') {
            return res.reply({
                meta: config.meta,
                baseURL: `${req.protocol}://${req.get('host')}`,
                endpoints: allEndpoints
            });
        }

        res.render('index', {
            name: config.meta.name,
            version: config.meta.version,
            description: config.meta.description,
            current_status: config.current_status,
            icon: config.meta.icon,
            endpoints: allEndpoints,
            categories: config.categories,
            links: config.links
        });
    });

    // CATEGORY DETAIL
    app.get('/category/:categoryName', async (req, res) => {
        const { type } = req.query;
        const { categoryName } = req.params;

        const normalizedInput = categoryName
            .toLowerCase()
            .replace(/-/g, ' ')
            .trim();

        const category = allEndpoints.find(cat => {
            const normalizedCatName = cat.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            return normalizedCatName === normalizedInput;
        });

        if (!category) return res.reply('Category not found.', { code: 404 });

        if (type === 'json') {
            return res.reply({
                meta: config.meta,
                baseURL: `${req.protocol}://${req.get('host')}`,
                category
            });
        }

        res.render('category', {
            name: config.meta.name,
            description: config.meta.description,
            icon: config.meta.icon,
            categoryName: category.name,
            categoryDesc:
                config.categories[categoryName.toLowerCase()]?.description ||
                `${category.items.length} endpoints available.`,
            category
        });
    });

    // === IMPORTANT ===
    // Daftarkan semua endpoints ke express agar bisa diakses,
    // mis. menggunakan data dari loader, ini contoh logika sederhana:
    allEndpoints.forEach(category => {
      category.items.forEach(ep => {
        const methods = ep.method.toUpperCase().split('/').map(m => m.trim());
        methods.forEach(method => {
          const routeHandler = (req, res) => {
            // Cari handler dari loader (asumsi loader sudah menambahkan route di app)
            // Kalaupun loader tidak menambahkan route, bisa tambahkan route disini sesuai path dan handler
            // Jika loader tdk tambahkan router, tambahkan penanganan error disini:
            res.status(404).json({
              error: `Endpoint ${ep.path} dengan method ${method} belum diimplementasikan di server.`
            });
          };
          switch (method) {
            case 'GET':
              app.get(ep.path, routeHandler);
              break;
            case 'POST':
              app.post(ep.path, routeHandler);
              break;
            // Tambah method lain jika perlu
          }
        });
      });
    });

    // 404 fallback
    app.use((req, res) => {
        consola.info(`404: ${chalk.red(req.method)} ${req.path}`);
        res.reply('Not Found.', { code: 404 });
    });

    // Error middleware
    app.use((err, req, res, next) => {
        if (err.code === 'LIMIT_FILE_SIZE')
            return res.reply('File size exceeds limit.', { code: 413 });

        consola.error(`500: ${chalk.red(err.message)}`);
        res.reply(err.message, { code: 500 });
    });

    app.listen(PORT, () => {
        consola.success(`Server started at http://localhost:${PORT}`);
        consola.info(`Total endpoints: ${chalk.green(
            allEndpoints.reduce((t, c) => t + c.items.length, 0)
        )}`);
        consola.info(`Categories: ${chalk.blue(allEndpoints.length)}`);
    });

    module.exports = app;
})();