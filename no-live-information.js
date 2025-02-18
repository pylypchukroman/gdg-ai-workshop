import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const city = process.argv[2];

if (!city) {
  console.log('Please provide a city - e.g.: `npm run weather Rome`');
  process.exit();
}

const prompt = `What is the weather like in ${city} right now?`;

const result = await model.generateContent(prompt);
console.log(result.response.text());
