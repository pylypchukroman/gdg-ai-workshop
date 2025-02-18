import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function eventApi({ query, htichips = 'date:today' }) {
  const SERP_API_KEY = process.env.SERPAPI;
  const URL = `https://serpapi.com/search.json?api_key=${SERP_API_KEY}&engine=google_events&q=${query}&htichips=${htichips}&hl=en&gl=us`;

  try {
    const response = await fetch(URL);
    const data = await response.json();
    return data.events_results || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

async function hotelApi({
  check_out_date,
  check_in_date,
  adults = 2,
  query,
  hotelClass = 4,
}) {
  const SERP_API_KEY = process.env.SERPAPI;
  const URL = `https://serpapi.com/search.json?api_key=${SERP_API_KEY}&engine=google_hotels&q=${query}&check_in_date=${check_in_date}.&check_out_date=${check_out_date}.&adults=${parseInt(
    adults
  )}&hotel_class=${parseInt(hotelClass)}&currency=USD&gl=us&hl=en`;

  try {
    const response = await fetch(URL);
    const data = await response.json();
    return data.properties || [];
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }
}

const eventFunction = {
  name: 'event_api',
  description:
    'Retrieves event information based on a query and optional filters.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          "The query you want to search for (e.g., 'Events in Austin, TX').",
      },
      htichips: {
        type: 'string',
        description: `Optional filters used for search. Default: 'date:today'.
        
        Options:
        - 'date:today' - Today's events
        - 'date:tomorrow' - Tomorrow's events
        - 'date:week' - This week's events
        - 'date:weekend' - This weekend's events
        - 'date:next_week' - Next week's events
        - 'date:month' - This month's events
        - 'date:next_month' - Next month's events
        - 'event_type:Virtual-Event' - Online events`,
      },
    },
    required: ['query'],
  },
};

const hotelFunction = {
  name: 'hotel_api',
  description:
    'Retrieves hotel information based on location, dates, and optional preferences.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Parameter defines the search query. You can use anything that you would use in a regular Google Hotels search.',
      },
      check_in_date: {
        type: 'string',
        description: "Check-in date in YYYY-MM-DD format (e.g., '2024-04-30').",
      },
      check_out_date: {
        type: 'string',
        description:
          "Check-out date in YYYY-MM-DD format (e.g., '2024-05-01').",
      },
      hotel_class: {
        type: 'integer',
        description: `Hotel class.
        
        Options:
        - 2: 2-star
        - 3: 3-star
        - 4: 4-star
        - 5: 5-star
        
        For multiple classes, separate with commas (e.g., '2,3,4').`,
      },
      adults: {
        type: 'integer',
        description:
          'Number of adults. Only integers, no decimals or floats (e.g., 1 or 2).',
      },
    },
    required: ['query', 'check_in_date', 'check_out_date'],
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  tools: [{ functionDeclarations: [eventFunction, hotelFunction] }],
  toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
});

const chat = model.startChat({ history: [] });

const CallableFunctions = {
  event_api: eventApi,
  hotel_api: hotelApi,
};

function missionPrompt(prompt) {
  const today = new Date().toISOString().split('T')[0];
  return `
  Thought: Determine if the user needs API calls for weather, events, or hotels.
  Action: 
  - Call API if enough parameters are provided.
  - Ask for missing details if needed.
  - Otherwise, respond using chat history.
  - Respond with the final answer only.

  [QUESTION] 
  ${prompt}

  [DATETIME]
  ${today}
  `.trim();
}

async function agent(userPrompt) {
  const prompt = missionPrompt(userPrompt);
  let response = await chat.sendMessage(prompt);

  let tools = response?.response?.candidates?.[0]?.content?.parts || [];

  while (tools.length) {
    let newTools = [];

    for (const tool of tools) {
      if (!tool.functionCall) {
        continue;
      }

      const functionName = tool.functionCall.name;
      const functionArgs = tool.functionCall.args;

      if (!(functionName in CallableFunctions)) {
        continue;
      }

      console.log(`Calling API: ${functionName} with args:`, functionArgs);
      const functionRes = await CallableFunctions[functionName](functionArgs);

      response = await chat.sendMessage([
        {
          functionResponse: {
            name: functionName,
            response: { result: functionRes },
          },
        },
      ]);

      // Only add new tools if they exist in the response
      const nextTools =
        response?.response?.candidates?.[0]?.content?.parts || [];
      if (nextTools.length) {
        newTools = nextTools;
      }
    }

    // If no new tools are detected, break the loop
    if (newTools.length === 0) {
      break;
    }

    tools = newTools;
  }

  // Extract and return the final text response
  const finalResponse =
    response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'No response from model.';
  return finalResponse;
}

// User input loop
async function run() {
  rl.question('You: ', async (userInput) => {
    if (userInput.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(1);
    }

    const result = await agent(userInput);
    console.log('Model: ', result, '\n');
    run();
  });
}

console.log(
  "Chatbot initialised. Type your message and press Enter. Type 'exit' to quit."
);
run();
