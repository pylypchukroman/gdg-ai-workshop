import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const chat = model.startChat();

// Function to handle user input and process responses
async function handleUserInput() {
  rl.question('You: ', async (userInput) => {
    if (userInput.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    let result = await chat.sendMessageStream(userInput);
    console.log('Model:');

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
    }

    console.log('\n');
    handleUserInput();
  });
}

console.log(
  "Chatbot initialised. Type your message and press Enter. Type 'exit' to quit."
);
handleUserInput();
