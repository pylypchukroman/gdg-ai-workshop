import { BigQuery } from '@google-cloud/bigquery';

// IDs of the films the user has watched
/*
6574 - Star Wars: The Rise of Skywalker
6568 - Star Wars: Episode I - The Phantom Menace
6570 - Star Wars: Episode III - Revenge of the Sith

410 - Alien vs Predator: Requiem
301 - AVP Alien vs. Predator

5242 - PAW Patrol: The Mighty Movie
8199 - The Smurfs

*/
// const filmsWatched = [6574, 6568, 6570];
// const filmsWatched = [410, 301];
const filmsWatched = [5242, 8199];

const bigquery = new BigQuery();

async function run() {
  const projectId = 'ai-workshop-448608';
  const datasetId = 'ai_workshop_films';
  const filmsTable = 'films';
  const tableId = 'films_with_embeddings';
  const modelId = 'film_embedding';

  // Step 1: Retrieve information about watched films
  const watchedQuery = `
  SELECT 
    id, 
    title, 
    overview,
    genre,
  FROM \`${projectId}.${datasetId}.${filmsTable}\`
   WHERE id IN UNNEST(@filmsWatched);
`;

  const watchedOptions = {
    query: watchedQuery,
    params: { filmsWatched },
  };

  const [watchedRows] = await bigquery.query(watchedOptions);

  if (!watchedRows.length) {
    console.error('No information found for the films watched.');
    return;
  }

  const watchedContent = watchedRows
    .map((row) => `${row.title}. ${row.overview}`)
    .join(' ');

  // Step 2: Generate a combined embedding for watched films
  const embeddingQuery = `
      SELECT
        ml_generate_embedding_result AS embedding_col
      FROM
        ML.GENERATE_EMBEDDING(
          MODEL \`${projectId}.${datasetId}.${modelId}\`,
          (SELECT @watchedContent AS content),
          STRUCT(TRUE AS flatten_json_output)
        );
    `;

  const embeddingOptions = {
    query: embeddingQuery,
    params: { watchedContent },
  };

  const [embeddingResult] = await bigquery.query(embeddingOptions);

  if (!embeddingResult.length) {
    console.error('Failed to generate embedding for watched films.');
    return;
  }

  const combinedEmbedding = embeddingResult[0].embedding_col;

  const recommendationQuery = `
      SELECT
        base.title,
        base.overview,
        base.genre
      FROM
        VECTOR_SEARCH(
          (SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE id NOT IN UNNEST(@filmsWatched)),
          'ml_generate_embedding_result',
          (SELECT @combinedEmbedding AS embedding_col),
          'embedding_col',
          top_k => 5
        )
    `;

  const recommendationOptions = {
    query: recommendationQuery,
    params: { combinedEmbedding, filmsWatched },
  };

  const [recommendationRows] = await bigquery.query(recommendationOptions);

  console.log('Recommended films:', recommendationRows);
}

run();
