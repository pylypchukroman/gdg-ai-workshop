import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'node:readline';

import { getWeather } from './get-weather.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  tools: [
    {
      functionDeclarations: [
        {
          name: 'getWeather',
          description:
            'gets the weather for a city and returns the forecast using the metric system.',
          parameters: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: 'the city for which the weather is requested',
              },
            },
            required: ['city'],
          },
        },
      ],
    },
  ],
  toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
});

const generationConfig = {
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const chat = model.startChat({
  generationConfig,
  history: [],
});

async function run() {
  rl.question('You: ', async (userInput) => {
    if (userInput.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    const result = await chat.sendMessage(userInput);
    const parts = await result.response.candidates[0].content.parts;
    const functionCalls = parts.filter((part) => part.functionCall);

    if (functionCalls.length !== 0) {
      const functionResponses = [];

      for (const call of functionCalls) {
        const { name, args } = call.functionCall;
        const { city } = args;
        const response = await getWeather(city);
        functionResponses.push({
          functionResponse: {
            name: name,
            response: { [name]: response },
          },
        });
      }

      const result2 = await chat.sendMessage(
        `This is the result from the function call, incorporate this into your response please: ${JSON.stringify(
          functionResponses
        )}`
      );
      console.log('Model: ', result2.response.text());
      console.log('\n');
      run();
    } else {
      console.log('Model: ', result.response.text());
      console.log('\n');
      run();
    }
  });
}

console.log(
  "Chatbot initialised. Type your message and press Enter. Type 'exit' to quit."
);
run();
