import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Db, Collection, Document, ObjectId } from 'mongodb';

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
// ভেরিফাই করছি MONGO_DB_URI অথবা MONGO_URI যে কোনো একটি আছে কিনা
const uri = process.env.MONGO_DB_URI || process.env.MONGO_URI;
if (!uri) {
    throw new Error('❌ Database URI is missing from .env file!');
}

let client: MongoClient | null = null;
let db: Db | null = null;

async function getCollections(): Promise<{ userCollection: Collection<Document>; booksCollection: Collection<Document> }> {
    const dbName = process.env.DB_NAME || 'book-verse';

    if (client && db) {
        return {
            userCollection: db.collection('user'),
            booksCollection: db.collection('books')
        };
    }

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

// ফিক্সড ডাইনামিক রাউট
app.get('/api/books/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // ফিক্সড: getCollections() থেকে অবজেক্ট ডেসট্রাকচার করা হয়েছে
        const { booksCollection } = await getCollections();

        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.findOne(query);

        if (!result) {
            return res.status(404).json({ message: "Book not found" });
        }

        res.send(result);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// app.get('/books/:userId', async (req: Request, res: Response) => {
//     const { userId } = req.params
//     const query = {
//         userId: new ObjectId(userId)
//     }
//     const result = await booksCollection.findOne(query)
//     res.send(result)
// })

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

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`📡 BookVerse Server is actively running on: http://localhost:${PORT}`);
    });
}

export default app;