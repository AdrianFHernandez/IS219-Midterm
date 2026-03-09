import express from 'express';
import cors from 'cors';
import { RateMyProfessorService } from './src/services/RateMyProfessorService';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the RMP service
const rmpService = new RateMyProfessorService();

// Route to search professors
app.get('/api/search-professors', async (req, res) => {
    try {
        const { name, max } = req.query;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                error: 'Professor name is required',
                results: []
            });
        }

        const requestedMax = typeof max === 'string' ? Number.parseInt(max, 10) : NaN;
        const maxResults = Number.isFinite(requestedMax)
            ? Math.min(Math.max(requestedMax, 10), 300)
            : 150;

        // Call the existing RateMyProfessorService
        const searchResult = await rmpService.searchProfessor(name, maxResults);
        const professors = searchResult.professors;

        res.json({
            success: true,
            query: name,
            results: professors,
            count: professors.length
        });
    } catch (error) {
        console.error('Error searching professors:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
            results: []
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'RMP API Server is running' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`▶️  RMP API Server running on http://localhost:${PORT}`);
    console.log(`📚 Search endpoint: GET http://localhost:${PORT}/api/search-professors?name=John`);
});
