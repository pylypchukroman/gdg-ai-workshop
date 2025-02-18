import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function run() {
  const result = await model.embedContent('king');
  console.log('Dimensions:', result.embedding.values.length);
  console.log(result.embedding.values);
}

run();
