import { GoogleAICacheManager } from '@google/generative-ai/server';
const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY);

const cacheResults = await cacheManager.list();

// cacheResults.cachedContents.forEach(async (cacheResult) => {
//   await cacheManager.delete(cacheResult.name);
// });
// console.log('Done');
console.log(cacheResults.cachedContents);
