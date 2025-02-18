import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const history = [];

async function handleUserInput() {
  rl.question('You: ', async (userInput) => {
    if (userInput.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    history.push({ role: 'user', parts: [{ text: userInput }] });

    let result = await model
      .startChat({ history })
      .sendMessageStream(userInput);
    console.log('Model:');

    let modelResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
      modelResponse += chunkText;
    }

    history.push({ role: 'model', parts: [{ text: modelResponse }] });

    console.log('\n');
    handleUserInput();
  });
}

console.log(
  "Chatbot initialised. Type your message and press Enter. Type 'exit' to quit."
);
handleUserInput();
