const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read data
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { categories: [], tasks: [], events: [] };
    }
};

// Helper to write data
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// API: Get all data
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// API: Replace entire data state (useful for syncing from frontend)
app.post('/api/data', (req, res) => {
    const newData = req.body;

    // Validate structure (basic validation)
    if (!newData.categories || !newData.tasks || !newData.events) {
        return res.status(400).json({ error: 'Invalid data structure' });
    }

    writeData({
        categories: newData.categories,
        tasks: newData.tasks,
        events: newData.events
    });

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
