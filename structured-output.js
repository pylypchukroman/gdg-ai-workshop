// import { GoogleGenerativeAI } from '@google/generative-ai';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// const prompt = `Display information about the original three Star Wars films. Respond using this JSON schema:
// Film = {'title': string, 'released': string, 'characters': string, 'plot': string}
// Return: Array<Film>
// `;

// const result = await model.generateContent(prompt);
// console.log(result.response.text());

import { inspect } from 'node:util';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const schema = {
  description: 'Array of original Star Wars films with details',
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: 'Title of the film',
        nullable: false,
      },
      released: {
        type: SchemaType.STRING,
        description: 'Release date of the film',
        nullable: false,
      },
      characters: {
        type: SchemaType.STRING,
        description: 'Notable characters in the film',
        nullable: false,
      },
      plot: {
        type: SchemaType.STRING,
        description: "Short summary of the film's plot",
        nullable: false,
      },
    },
    required: ['title', 'released', 'characters', 'plot'],
  },
};

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: schema,
  },
});

const result = await model.generateContent(
  'Display information about the original three Star Wars films.'
);
console.log(JSON.parse(result.response.text()));
