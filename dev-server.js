import express from 'express';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dynamic route handler for /api/*
app.all('/api/*', async (req, res) => {
    const apiPath = req.path.replace(/^\/api/, '');

    // Try to resolve the handler file
    const candidates = [
        join(__dirname, 'api', `${apiPath}.js`),
        join(__dirname, 'api', apiPath, 'index.js'),
    ];

    let filePath = null;
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            filePath = candidate;
            break;
        }
    }

    if (!filePath) {
        console.error(`API route not found: ${req.path}`);
        return res.status(404).json({ error: `API route not found: ${req.path}` });
    }

    try {
        console.log(`[API] ${req.method} ${req.path} -> ${filePath}`);

        // Use pathToFileURL for Windows compatibility
        const moduleUrl = pathToFileURL(resolve(filePath)).href;
        const mod = await import(moduleUrl);
        const handler = mod.default;

        if (typeof handler === 'function') {
            await handler(req, res);
        } else {
            console.error(`No default export found in ${filePath}`);
            res.status(500).json({ error: 'Internal Server Error: No handler found' });
        }
    } catch (error) {
        console.error(`Error handling ${req.path}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

app.listen(port, () => {
    console.log(`\n✅ Dev API server running at http://localhost:${port}`);
    console.log(`   Vite proxy will forward /api requests here.\n`);
    console.log(`   ENV loaded:`);
    console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log('');
});
