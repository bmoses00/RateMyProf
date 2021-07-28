const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const app = express();

const port = 3002;
app.use(cors());

app.get('/', async (req, res) => {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db('professors');
    const collection = db.collection('professors');

    const data = await collection.find().next();
    await client.close();
    res.send(data);
});
