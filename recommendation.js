import { BigQuery } from '@google-cloud/bigquery';

const recommendation = process.argv[2];
if (!recommendation) {
  console.error('Usage: npm run recommendation "the films that you like"');
  process.exit(1);
}

const bigquery = new BigQuery();

async function run() {
  const projectId = 'ai-workshop-448608';
  const datasetId = 'ai_workshop_films';
  const tableId = 'films_with_embeddings';
  const modelId = 'film_embedding';

  const query = `
    SELECT 
      base.title, 
      base.overview,
      base.genre
    FROM 
      VECTOR_SEARCH(
        TABLE \`${projectId}.${datasetId}.${tableId}\`, 
        'ml_generate_embedding_result',
        (
          SELECT 
            ml_generate_embedding_result AS embedding_col 
          FROM 
            ML.GENERATE_EMBEDDING(
              MODEL \`${projectId}.${datasetId}.${modelId}\`,
              (SELECT "${recommendation}" AS content),
              STRUCT(TRUE AS flatten_json_output)
            )
        ),
        top_k => 5
      );
  `;

  const options = {
    query,
  };

  try {
    const [rows] = await bigquery.query(options);

    console.log('Top results:', rows);
  } catch (error) {
    console.error('Error running VECTOR_SEARCH query:', error);
  }
}

run();
