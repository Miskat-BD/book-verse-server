import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Db, Collection, Document } from 'mongodb';

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
// MongoDB Connection Setup
// =====================================
const uri = process.env.MONGO_DB_URI;
if (!uri) {
    throw new Error('❌ MONGO_DB_URI is missing from .env file!');
}

// সার্ভারলেস আর্কিটেকচারের জন্য গ্লোবাল কানেকশন ক্যাশ
let client: MongoClient | null = null;
let db: Db | null = null;

// রাউটের ভেতর কল করার জন্য ডাইনামিক ডাটাবেস ম্যানেজার
async function getCollections(): Promise<{ userCollection: Collection<Document>; booksCollection: Collection<Document> }> {
    const dbName = process.env.DB_NAME || 'book-verse';
    
    // যদি অলরেডি কানেকশন চালু থাকে, তবে নতুন করে কানেক্ট না করে ক্যাশড অবজেক্ট রিটার্ন করবে
    if (client && db) {
        return {
            userCollection: db.collection('user'),
            booksCollection: db.collection('books')
        };
    }

    // কানেকশন না থাকলে সার্ভারলেস ইনস্ট্যান্সের জন্য নতুন কানেকশন তৈরি করবে
    client = new MongoClient(uri!, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    await client.connect();
    db = client.db(dbName);
    console.log(`🚀 Successfully connected to MongoDB Database: ${dbName}`);

    return {
        userCollection: db.collection('user'),
        booksCollection: db.collection('books')
    };
}

// =====================================
// API Routes
// =====================================
app.get('/', (req: Request, res: Response): void => {
    res.send("Hello World");
});

app.get('/users', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userCollection } = await getCollections();
        const cursor = userCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/books', async (req: Request, res: Response): Promise<void> => {
    try {
        const { booksCollection } = await getCollections();
        const cursor = booksCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/books', async (req: Request, res: Response): Promise<void> => {
    try {
        const { booksCollection } = await getCollections();
        const data = req.body as Document;
        const result = await booksCollection.insertOne(data);
        res.send(result);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// =====================================
// Global 404 & Error Handlers
// =====================================
app.use((req: Request, res: Response): void => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('💥 Server Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Something went wrong inside the server!'
    });
});

// লোকালহোস্টে রান করার জন্য অ্যাপ লিসেনার (ভার্সেলে এটি অটো ইগনোরড হবে)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`📡 BookVerse Server is actively running on: http://localhost:${PORT}`);
    });
}

export default app;