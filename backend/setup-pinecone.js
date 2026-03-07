import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'codigo-trabajo-chile';

if (!PINECONE_API_KEY) {
    console.error('Missing PINECONE_API_KEY in .env');
    process.exit(1);
}

const pc = new Pinecone({
    apiKey: PINECONE_API_KEY
});

async function setup() {
    console.log(`Checking if index "${INDEX_NAME}" exists...`);
    try {
        const existingIndexes = await pc.listIndexes();
        const indexExists = existingIndexes.indexes.some(idx => idx.name === INDEX_NAME);

        if (indexExists) {
            console.log(`Index "${INDEX_NAME}" already exists. Setup complete.`);
        } else {
            console.log(`Creating index "${INDEX_NAME}"... this might take a minute.`);
            await pc.createIndex({
                name: INDEX_NAME,
                dimension: 1536, // OpenAI text-embedding-ada-002 dimension
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`Index "${INDEX_NAME}" created successfully!`);
        }
    } catch (error) {
        console.error('Error setting up Pinecone:', error);
        process.exit(1);
    }
}

setup();
