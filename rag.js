import {
  GoogleAICacheManager,
  GoogleAIFileManager,
} from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import readline from 'node:readline';
import yoctoSpinner from 'yocto-spinner';

const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const mediaPath = './documents';
const files = [
  {
    name: 'comprehensive.pdf',
    mimeType: 'application/pdf',
  },
  {
    name: 'quickstart_totr.pdf',
    mimeType: 'application/pdf',
  },
  {
    name: 'quickstart_sog.pdf',
    mimeType: 'application/pdf',
  },
  {
    name: 'quickstart_sor.pdf',
    mimeType: 'application/pdf',
  },
];

const cacheFilePath = './local_cache_for_rag.json';

function loadLocalCache() {
  if (existsSync(cacheFilePath)) {
    return JSON.parse(readFileSync(cacheFilePath, 'utf8'));
  }
  return null;
}

function saveToLocalCache(cache) {
  writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
}

async function initialiseChat() {
  let cacheName;
  const localCache = loadLocalCache();
  const currentTime = new Date().toISOString();

  const needsNewCache =
    !localCache ||
    !localCache.name ||
    !localCache.expireTime ||
    new Date(localCache.expireTime) < new Date(currentTime);

  if (needsNewCache) {
    console.log('Creating new cache...');

    const uploadSpinner = yoctoSpinner({ text: 'Uploading files...' }).start();
    const uploadResults = [];

    try {
      for (const file of files) {
        const uploadResult = await fileManager.uploadFile(
          `${mediaPath}/${file.name}`,
          {
            mimeType: file.mimeType,
          }
        );
        uploadResults.push({
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        });
      }
      uploadSpinner.success('Files uploaded successfully!');
    } catch (error) {
      uploadSpinner.error('File upload failed!');
      throw new Error(`Failed to upload files: ${error.message}`);
    }

    const cacheSpinner = yoctoSpinner({ text: 'Creating cache...' }).start();
    try {
      const contents = uploadResults.map((file) => ({
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri: file.fileUri,
              mimeType: file.mimeType,
            },
          },
        ],
      }));

      const cacheResult = await cacheManager.create({
        model: 'models/gemini-1.5-flash-001',
        displayName: 'Star Wars Unlimited',
        ttl: '7884000s',
        systemInstruction: {
          parts: [
            {
              text: `You are an expert rules advisor for the Star Wars Unlimited card game.
                    Answer the users question using the PDF documents, and only them.
                    Keep your answer ground in the facts of the PDF documents.
                    When answering, always display the exact PDF document (or documents) where you have sourced the information from and also provide as much citation as possible.
                    If the PDF documents do not contain the facts to answer the question, simply respond with "I find your question... disturbing."`,
            },
          ],
        },
        contents,
      });

      cacheName = cacheResult.name;
      saveToLocalCache({
        name: cacheResult.name,
        expireTime: cacheResult.expireTime,
      });

      cacheSpinner.success('Cache created successfully!');
    } catch (error) {
      cacheSpinner.error('Cache creation failed!');
      throw new Error(`Failed to create cache: ${error.message}`);
    }
  } else {
    console.log('Using existing cache...');
    cacheName = localCache.name;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModelFromCachedContent(
    await cacheManager.get(cacheName)
  );
}

async function startChatSession() {
  const model = await initialiseChat();
  const history = [];

  const generationConfig = {
    temperature: 0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
  };

  const chat = await model.startChat(generationConfig, history);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt:
      "You may present your inquiry... or face the consequences of typing 'exit.' Choose wisely.\n",
  });

  console.log('Chat session started.');
  rl.prompt();

  rl.on('line', async (line) => {
    const question = line.trim();

    if (question.toLowerCase() === 'exit') {
      console.log('Exiting chat. Goodbye!');
      rl.close();
      return;
    }

    history.push({ role: 'user', content: question });

    try {
      const chatSpinner = yoctoSpinner({
        text: 'mechanical breathing intensifies "I am... contemplating... the power of the dark side.',
      }).start();
      const result = await chat.sendMessage(question);
      const answer = result.response.text();
      chatSpinner.stop();

      history.push({ role: 'assistant', content: answer });

      console.log(`Answer\n${answer}`);
    } catch (error) {
      console.error('Error generating response:', error);
    }

    rl.prompt();
  });
}

startChatSession().catch((error) => {
  console.error('Failed to start chat session:', error);
});
