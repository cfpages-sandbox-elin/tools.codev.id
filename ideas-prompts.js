// ideas-prompts.js
export function createClassificationPrompt(transcript) {
    return `
You are a content classification expert. Based on the provided transcript, determine the primary category of the video.
Respond ONLY with a single, valid JSON object with one key: "videoType".
The value for "videoType" MUST be one of the following exact strings: ["Tutorial", "Podcast", "Ideas List", "Other"].

- "Tutorial": If the video provides step-by-step instructions to achieve a specific outcome.
- "Podcast": If the video is primarily a conversation or interview between two or more people.
- "Ideas List": If the video's main purpose is to present a list of ideas, concepts, or examples.
- "Other": If it does not clearly fit the above categories.

Here is the transcript:
--- TRANSCRIPT START ---
${transcript.substring(0, 4000)}
--- TRANSCRIPT END ---

Now, provide the classification as a single JSON object.
`;
}

export function createIdeasListPrompt(transcript) {
    return `
You are an expert analyst and business strategist. Your task is to dissect the following video transcript, which has been identified as an "Ideas List", and extract structured, actionable insights.

Please adhere strictly to the following instructions:
1.  Provide your analysis ONLY in the form of a single, valid JSON object.
2.  The root of the JSON object must have three keys: "videoType", "summary", and "insights".
3.  Set the "videoType" key to the string "Ideas List".
4.  The "summary" key must be an object with two keys:
    - "mainTopic": A short string describing the central theme of the video.
    - "subTopics": An array of objects, where each object has "title", "startTime", and "endTime" in seconds, representing a distinct section of the video.
5.  The "insights" key must be an array of objects. Each insight object MUST have "category", "title", and "description".
    - "category" must be one of: ["Product Idea", "Marketing Strategy", "Business Process", "Core Principle", "Tool/Resource"].

--- TRANSCRIPT START ---
${transcript}
--- TRANSCRIPT END ---

Provide your complete analysis as a single JSON object now.
`;
}

export function createTutorialPrompt(transcript) {
    return `
You are an expert technical writer and educator. Your task is to deconstruct the following video transcript, which has been identified as a "Tutorial", into a clear, structured guide.

Please adhere strictly to the following instructions:
1.  Provide your analysis ONLY in the form of a single, valid JSON object.
2.  The root of the JSON object must have three keys: "videoType", "summary", and "guide".
3.  Set the "videoType" key to the string "Tutorial".
4.  The "summary" key must be an object with "mainTopic" and an array of "subTopics" (each with "title", "startTime", "endTime").
5.  The "guide" key must be an object with three keys:
    - "goal": A string describing the final outcome of the tutorial.
    - "tools": An array of strings listing the necessary tools, software, or resources.
    - "steps": An array of objects, where each object has a "title" and "description" for a single step in the process.

--- TRANSCRIPT START ---
${transcript}
--- TRANSCRIPT END ---

Provide your complete analysis as a single JSON object now.
`;
}

export function createPodcastPrompt(transcript) {
    return `
You are an expert podcast analyst and researcher. Your task is to analyze the following video transcript, which has been identified as a "Podcast", and extract key information about the speakers and content.

Please adhere strictly to the following instructions:
1.  Provide your analysis ONLY in the form of a single, valid JSON object.
2.  The root of the JSON object must have three keys: "videoType", "summary", and "podcastDetails".
3.  Set the "videoType" key to the string "Podcast".
4.  The "summary" key must be an object with "mainTopic" and an array of "subTopics" (each with "title", "startTime", "endTime").
5.  The "podcastDetails" key must be an object with:
    - "guests": An array of objects, each with "name" and "credentials" (a string describing their expertise or achievements).
    - "keyTopics": An array of strings listing the main topics discussed.
    - "actionableAdvice": An array of strings, where each string is a direct piece of advice or a key takeaway given during the conversation.

--- TRANSCRIPT START ---
${transcript}
--- TRANSCRIPT END ---

Provide your complete analysis as a single JSON object now.
`;
}

export function createAnalysisPrompt(transcript) {
    /**
     * Creates a structured prompt for the AI to analyze a video transcript.
     * @param {string} transcript - The full text content of the video transcript.
     * @returns {string} - The complete prompt to be sent to the AI.
     */
    return `
You are an expert analyst, business strategist, and system designer. Your task is to dissect the following video transcript and extract structured, categorized, and actionable insights.

Please adhere strictly to the following instructions:
1.  Read the entire transcript to deeply understand the content, arguments, and underlying systems.
2.  Provide your analysis ONLY in the form of a single, valid JSON object. Do not include any text, greetings, or explanations before or after the JSON object.
3.  The root of the JSON object must have two keys: "summary" and "insights".
4.  For the "summary" key, provide a concise 2-4 sentence summary of the video.
5.  The "insights" key must be an array of objects. Each object in the array represents a single, distinct, and actionable piece of information.
6.  Each insight object MUST have the following three keys:
    - "category": A string that classifies the insight. You MUST use one of the following exact category names: ["Product Idea", "Marketing Strategy", "Business Process", "Core Principle", "Tool/Resource"].
    - "title": A short, descriptive title for the insight (5-10 words).
    - "description": A detailed, actionable explanation of the insight (2-4 sentences). Explain it clearly enough that someone could start acting on it.

EXAMPLE of a single insight object:
{
  "category": "Product Idea",
  "title": "AI-Powered Podcast Note Generator",
  "description": "Develop a micro-SaaS that takes a podcast audio file and automatically generates comprehensive show notes, timestamps for key topics, and social media teaser clips. This solves the tedious post-production work for content creators."
}

Here are the definitions for each category:
- Product Idea: A specific, buildable product or service concept mentioned or implied in the video.
- Marketing Strategy: A specific tactic or method for acquiring customers, building an audience, or growing a business.
- Business Process: A step-by-step system, workflow, or operational procedure for building, launching, or running a business.
- Core Principle: A high-level concept, mental model, or fundamental belief that guides strategic decisions.
- Tool/Resource: A specific software, book, person, or external resource that was mentioned as being useful.

Now, analyze the following transcript and generate the complete JSON object with "summary" and the array of "insights". List as many high-quality insights as you can find.

--- TRANSCRIPT START ---
${transcript}
--- TRANSCRIPT END ---

Provide your analysis as a single JSON object now.
`;
}

export function createPlanPrompt(idea) {
    return `
You are a world-class startup founder, product manager, and software architect. Your task is to create a comprehensive and actionable blueprint for the following product idea.

**Product Idea:**
- Title: "${idea.title}"
- Description: "${idea.description}"

**Instructions:**
Provide your analysis STRICTLY in the form of a single, valid JSON object. Do not include any text before or after the JSON. The JSON object must have the following structure:

{
  "feasibilityAnalysis": {
    "overallScore": "A single number from 1-10 representing the overall viability of this idea.",
    "aiBuildability": {
      "score": "A number from 1-10. 10 means it's easily and almost fully automatable with current AI tech. 1 means it requires significant human intervention.",
      "reasoning": "A brief explanation for the score."
    },
    "marketDemand": {
      "score": "A number from 1-10. 10 means a large, desperate market exists. 1 means it's a solution looking for a problem.",
      "reasoning": "A brief explanation for the score, considering market size and user pain point."
    },
    "monetizationPotential": {
      "score": "A number from 1-10. 10 means high willingness to pay and clear revenue models (e.g., B2B SaaS). 1 means difficult to monetize.",
      "reasoning": "A brief explanation for the score, suggesting a primary revenue model (e.g., subscription, usage-based)."
    }
  },
  "mvp": {
    "features": [
      "A string array listing the 3-5 absolute essential features for the Minimum Viable Product. Be specific."
    ],
    "techStack": [
      {
        "component": "Frontend",
        "recommendation": "e.g., React with Next.js and Tailwind CSS"
      },
      {
        "component": "Backend",
        "recommendation": "e.g., Node.js with Express, or Python with FastAPI"
      },
      {
        "component": "Database",
        "recommendation": "e.g., PostgreSQL or Firestore"
      },
      {
        "component": "Core AI Provider",
        "recommendation": "e.g., OpenAI API for text, Anthropic for reasoning"
      }
    ]
  },
  "goToMarketStrategy": [
    "A string array listing 3-5 concrete, actionable steps to get the first 100 users. e.g., 'Post on Indie Hackers with a demo video', 'Engage with target users in relevant subreddits'."
  ]
}

Now, generate the complete JSON object for the provided product idea.
`;
}