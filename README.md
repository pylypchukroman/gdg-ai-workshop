To run most of these examples you'll need to have a valid Gemini API key which you can obtain by visiting https://ai.google.dev/gemini-api/docs/api-key.

For the function calling and the agent examples you'll need to have a Weather API Key as well as a SERP API key which you can obtain from https://www.weatherapi.com/docs/ and https://serpapi.com.

If you plan on running your own fine tuned model, that will require a separate API key, please refer to the Gemini documentation.

To run the Bigquery example from Node.js you'll need to also download your Google Application Credentials (a `.json`) file.

Once you have all these API keys, you need to create a `.env` file at the root of the project folder and add your values:

```
GEMINI_API_KEY=""
GOOGLE_APPLICATION_CREDENTIALS=""
WEATHER_API=""
GEMINI_API_KEY_FOR_FINE_TUNED_MODEL=""
SERPAPI=''
```

These are the various `npm` commands that you can run - please refer to the slides on what they do and how to use them exactly:

* npm run agent ^
* npm run chat ^
* npm run chat-stream ^
* npm run chat-with-history ^
* npm run embedding ^
* npm run ecommerce
* npm run fine-tuning ^^
* npm run function ^^^
* npm run prompt ^
* npm run prompt-stream ^
* npm run rag ^^^^
* npm run recommendation ^^^^^
* npm run recommendation-advanced ^^^^^
* npm run structured ^
* npm run temperature ^
* npm run weather ^

```
^     Requires a Gemini API key
^^    Requires Fine Tuning Gemini API key for the fine tuned model
^^^   Requires Weather API key
^^^^  Requires SERP API key
^^^^^ Requires Google Application Credentials
```
