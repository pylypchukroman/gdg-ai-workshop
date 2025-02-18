import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import natural from 'natural';
import yoctoSpinner from 'yocto-spinner';

const tokenizer = new natural.WordTokenizer();
function tokenize(sentence) {
  return tokenizer.tokenize(sentence.toLowerCase());
}

let model;
async function loadUSEModel() {
  const spinner = yoctoSpinner('Loading Universal Sentence Encoder...');
  spinner.start();
  model = await use.load();
  spinner.stop('✅ Universal Sentence Encoder loaded');
}

async function getEmbeddings(tokens) {
  if (!model) {
    console.error('\n[ERROR] Model is not loaded yet!\n');
    return null;
  }
  const sentence = tokens.join(' ');
  return await model.embed([sentence]);
}

function scaledDotProductAttention(query, key, value) {
  const d_k = query.shape[1];
  const scores = tf.matMul(query, key, false, true).div(Math.sqrt(d_k));
  const attentionWeights = tf.softmax(scores);
  return tf.matMul(attentionWeights, value);
}

// Transformer block: Attention + Feedforward network
async function transformerBlock(tokens) {
  const spinner = yoctoSpinner('Running Transformer Block...');
  spinner.start();
  const embeddings = await getEmbeddings(tokens);

  // Self-Attention
  const attentionOutput = scaledDotProductAttention(
    embeddings,
    embeddings,
    embeddings
  );

  // Feedforward Network (Simple Dense Layer)
  const denseLayer = tf.layers.dense({ units: 512, activation: 'relu' });
  const output = denseLayer.apply(attentionOutput);
  spinner.stop('✅ Transformer Block processing complete');

  return output;
}

const capitalCities = {
  france: 'Paris',
  germany: 'Berlin',
  italy: 'Rome',
  spain: 'Madrid',
  canada: 'Ottawa',
  japan: 'Tokyo',
};

async function getCapitalCityResponse(sentence) {
  const tokens = tokenize(sentence);
  const spinner = yoctoSpinner('Processing capital city query...');
  spinner.start();
  const embeddings = await getEmbeddings(tokens);

  let bestMatch = null;
  let bestScore = -1;

  for (const [country] of Object.entries(capitalCities)) {
    const countryEmbedding = await getEmbeddings([country]);

    // Compute similarity (corrected approach)
    const similarityTensor = tf.losses.cosineDistance(
      embeddings,
      countryEmbedding,
      0
    );
    const similarity = 1 - similarityTensor.dataSync()[0];

    console.log(`\nSimilarity with ${country}:`, similarity.toFixed(6));

    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = country;
    }
  }
  spinner.stop('✅ Capital city query processed');

  return bestMatch
    ? `\n✅ The capital of ${bestMatch.toUpperCase()} is ${
        capitalCities[bestMatch]
      }.\n`
    : "\n❌ I don't know that one!\n";
}

(async () => {
  await loadUSEModel();
  console.log('\n🚀 Model is ready. Processing input...\n');

  const sentence = 'What is the captal of Italy?';
  console.log('\n🔹 Tokens:', tokenize(sentence), '\n');
  console.log(await getCapitalCityResponse(sentence));

  const transformedOutput = await transformerBlock(tokenize(sentence));
  if (transformedOutput) transformedOutput.print();
})();
