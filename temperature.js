import { GoogleGenerativeAI } from '@google/generative-ai';
import cliMarkdown from 'cli-markdown';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

let TEMP = parseFloat(process.argv[2], 2);

if (isNaN(TEMP)) {
  TEMP = 0;
  console.log('No valid temperature provided. Using default 0.');
}

const generationConfig = {
  temperature: TEMP,
  responseMimeType: 'text/plain',
};

const prompt = 'Write the opening sentence of a sci-fi novel.';

const result = await model.generateContent({
  generationConfig,
  contents: {
    parts: [
      {
        text: prompt,
      },
    ],
  },
});

console.log(`Working with temperature ${TEMP.toFixed(1)}\n`);
console.log(cliMarkdown(result.response.text()));
