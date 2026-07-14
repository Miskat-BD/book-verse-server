// book-verse-server/src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Db } from 'mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================
// Middlewares
// =====================================
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// =====================================
// MongoDB Native Connection Pool Setup
// =====================================
const uri = process.env.MONGO_DB_URI;
if (!uri) {
    throw new Error('❌ MONGO_DB_URI is missing from .env file!');
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// গ্লোবাল ডাটাবেস অবজেক্ট যা সব রুট ব্যবহার করতে পারবে
export let db: Db;

// ডাটাবেস কানেক্ট করার র্যাপার ফাংশন
async function startServer() {
    try {
        await client.connect();
        // কানেকশন সাকসেস হলে ডিফল্ট ডাটাবেস অ্যাসাইন হবে
        db = client.db('bookverse');
        console.log('🚀 Successfully connected to MongoDB via Native Driver!');

        // ডাটাবেস রেডি হওয়ার পরই কেবল এক্সপ্রেস রিকোয়েস্ট লিসেন করা শুরু করবে
        app.listen(PORT, () => {
            console.log(`📡 BookVerse Server is actively running on: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error);
        process.exit(1);
    }
}

const database = client.db(process.env.DB_NAME)
const userCollection = database.collection('user')


app.get('/', (req: Request, res: Response) => {
    res.send("Hello World");
});

app.get('/users', async (req: Request, res: Response) => {
    const cursor = userCollection.find()
    const result = await cursor.toArray()
    res.send(result)
})

// =====================================
// Global 404 & Error Handlers
// =====================================
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('💥 Server Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Something went wrong inside the server!'
    });
});

startServer();

export default app;