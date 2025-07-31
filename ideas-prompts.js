// ideas-prompts.js v2.00 steal prompt
function formatTranscriptWithTimestamps(timedTextArray) {
    if (!timedTextArray || !Array.isArray(timedTextArray)) return "";
    return timedTextArray.map(line => `[${line.start.toFixed(1)}s] ${line.text}`).join('\n');
}

export function createComprehensiveAnalysisPrompt(transcriptData) {
    const formattedTranscript = formatTranscriptWithTimestamps(transcriptData.timedText);

    return `
    You are an expert analyst, strategist, and educator. Your task is to perform a comprehensive analysis of the following video transcript and structure your findings in a single JSON object. The transcript is formatted as [timestamp_in_seconds] text.

    **CRITICAL INSTRUCTION:**
    Analyze the content and only include the top-level keys in your JSON response that are RELEVANT to the video. For example:
    - If the video is a tutorial, you MUST include the "guide" key.
    - If the video is a podcast/interview, you MUST include the "podcastDetails" key.
    - If the video contains lists of ideas, strategies, or principles, you MUST include the "insights" key.
    - If a section is not relevant, DO NOT include its key in the final JSON object.
    - You MUST always include the "summary" key.
    When creating the "summary.subTopics", you MUST use the timestamps from the transcript to provide an accurate "startTime" for each sub-topic. The "startTime" must be a number representing the start time in seconds.

    **JSON Object Schema Definition:**
    {
    "summary": {
        "mainTopic": "A short string describing the central theme of the video.",
        "subTopics": [
            { "title": "Title of a distinct section", "startTime": 123.4 }
        ]
    },
    "guide": {
        "goal": "The final outcome of the tutorial.",
        "tools": ["An array of necessary tools, software, or resources."],
        "steps": [
            { "title": "Title of a step", "description": "Detailed description of the step." }
        ]
    },
    "podcastDetails": {
        "guests": [
            { "name": "Guest's name", "credentials": "Their expertise or achievements." }
        ],
        "keyTopics": ["An array of the main topics discussed."],
        "actionableAdvice": ["An array of direct advice or key takeaways."]
    },
    "insights": [
        {
        "category": "MUST be one of: ['Product Idea', 'Marketing Strategy', 'Business Process', 'Core Principle', 'Tool/Resource']",
        "title": "A short, descriptive title for the insight.",
        "description": "A detailed, actionable explanation of the insight."
        }
    ]
    }

    --- TRANSCRIPT START ---
    ${formattedTranscript}
    --- TRANSCRIPT END ---

    Now, provide your complete analysis as a single, valid JSON object, including ONLY the relevant top-level keys based on the content. Ensure all "startTime" values are numbers.
    `;
}

export function createResummarizePrompt(transcriptData) {
    const formattedTranscript = formatTranscriptWithTimestamps(transcriptData.timedText);
    
    return `
    You are an expert summarizer. Your task is to analyze the following timestamped video transcript and generate ONLY a new "summary" object.

    **CRITICAL INSTRUCTION:**
    You MUST use the timestamps from the transcript to provide an accurate "startTime" for each sub-topic. The "startTime" must be a number representing the start time in seconds.

    **JSON Object Schema Definition:**
    {
    "summary": {
        "mainTopic": "A short string describing the central theme of the video.",
        "subTopics": [
            { "title": "Title of a distinct section", "startTime": 123.4 }
        ]
    }
    }

    --- TRANSCRIPT START ---
    ${formattedTranscript}
    --- TRANSCRIPT END ---

    Now, provide your complete analysis as a single, valid JSON object containing only the "summary" key.
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
        "A string array listing several absolute essential features for the Minimum Viable Product. Be specific."
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
            "recommendation": "e.g., PostgreSQL or Firestore or Supabase"
        },
        {
            "component": "Core AI Provider",
            "recommendation": "e.g., OpenAI API for text, Anthropic for reasoning"
        }
        ]
    },
    "goToMarketStrategy": [
        "A string array listing several concrete, actionable steps to get the first 100 users. e.g., 'Post on Indie Hackers with a demo video', 'Engage with target users in relevant subreddits'."
    ]
    }

    Now, generate the complete JSON object for the provided product idea.
    `;
}

export function createMoreIdeasPrompt(existingIdeas) {
    const existingIdeasString = existingIdeas.map(idea => `- ${idea.title}`).join('\n');
    return `
    You are a highly creative product strategist and divergent thinker. Your task is to generate new, innovative product ideas based on a transcript, but you must avoid duplicating existing ideas.

    **Existing Ideas to Avoid:**
    ${existingIdeasString}

    **Instructions:**
    1.  Think about different user segments, business models (B2C, B2B, marketplace), or technology angles (e.g., using vision, audio) that are different from the existing ideas.
    2.  Generate 3-5 new, creative, and actionable product ideas.
    3.  Provide your output ONLY as a valid JSON array of objects. Each object must have the following keys: "category", "title", "description".
    4.  The "category" for all these new ideas MUST be "Product Idea".

    **Example Output:**
    [
    {
        "category": "Product Idea",
        "title": "AI-Powered Competitor Ad Analyzer",
        "description": "A tool for e-commerce stores that uses AI vision to analyze competitors' social media ads, identifying key messaging, visual trends, and calls-to-action to inform the user's own ad strategy."
    }
    ]

    Now, generate the JSON array of new, unique product ideas.
    `;
}

export function createPrdPrompt(ideaTitle, planJson) {
    return `
    You are an expert Senior Product Manager writing a Product Requirements Document (PRD). Your task is to generate a comprehensive PRD in Markdown format based on a product idea and its strategic plan.

    **Product Idea:** ${ideaTitle}

    **Strategic Plan (JSON):**
    ${planJson}

    **Instructions:**
    Generate a world-class PRD in Markdown format. The PRD must be clear, user-centric, and actionable. Use the following structure and headings precisely:

    # Product Requirements Document: ${ideaTitle}

    ## 1. Overview & Vision
    *   **Problem Statement:** Clearly articulate the core problem this product solves, based on the plan's 'marketDemand' reasoning.
    *   **Vision & Solution:** Briefly describe the product and its value proposition.
    *   **Target Audience:** Define the primary user persona(s) this product is for.

    ## 2. Goals & Success Metrics
    *   **Business Goals:** State 1-2 high-level business objectives (e.g., achieve a certain revenue, capture a market segment).
    *   **Product Goals:** State 1-2 product-specific goals (e.g., reduce time spent on X by 50%).
    *   **Key Performance Indicators (KPIs):** List 3-4 measurable metrics to track success (e.g., Daily Active Users, Conversion Rate, Task Success Rate).

    ## 3. User Stories & Core User Flow
    Describe the primary user journey. Then, for each feature in the MVP, write a user story in this format:
    *   **As a** [user type], **I want to** [perform an action], **so that I can** [achieve a benefit].

    ## 4. Scope & Features for MVP
    ### In Scope
    *   List all features from the 'mvp.features' section of the plan.

    ### Out of Scope
    *   Based on the MVP, list 2-3 reasonable features or capabilities that will **not** be included in the initial release to maintain focus.

    ## 5. Technical Considerations
    *   **Proposed Tech Stack:** List the components and recommendations from the 'mvp.techStack' section.
    *   **Dependencies:** Mention any potential external dependencies (e.g., reliance on a specific third-party API).

    ## 6. Go-to-Market Strategy
    *   Summarize the key steps from the 'goToMarketStrategy' section of the plan into a numbered list.
    
    ## 7. Open Questions
    *   List 1-2 critical questions that the team needs to answer during design or development (e.g., "What is the most intuitive way to handle data import errors?").

    ---
    *Document End*
    `;
}

export function createStealIdeasPrompt(pageText) {
    return `
    You are an expert business analyst and venture capitalist with a keen eye for identifying opportunities in text. Analyze the following text content from a webpage. Your task is to extract any potential product ideas, business models, or unique strategies mentioned.

    **Instructions:**
    1. Read through the text and identify all distinct, actionable ideas.
    2. For each idea, create a short title and a one-sentence description.
    3. The "category" for all these ideas MUST be "Stolen Idea".
    4. Provide your output ONLY as a valid JSON array of objects. Do not include any text before or after the JSON.

    **Example Output Format:**
    [
      {
        "category": "Stolen Idea",
        "title": "AI-Powered Meeting Summarizer",
        "description": "A service that connects to Zoom/Google Meet and automatically generates concise meeting notes and action items."
      }
    ]

    --- WEBPAGE TEXT START ---
    ${pageText.substring(0, 15000)}
    --- WEBPAGE TEXT END ---

    Now, generate the JSON array of stolen ideas based on the text provided. If no ideas are found, return an empty array [].
    `;
}

export function createDeepAnalysisPrompt(idea, analysisType) {
    const baseInstruction = `You are a world-class startup analyst. Given the following product idea, provide a detailed analysis for the specified section.
    Product Idea Title: "${idea.title}"
    Product Idea Description: "${idea.description}"
    Respond ONLY with a single, valid JSON object and no other text.`;

    const prompts = {
        swot: `
        ${baseInstruction}
        Analyze its viability. The JSON object must have keys: "opportunity", "problem", "feasibility", "timing". Each key should have a nested object with "score" (a number 1-10) and "reasoning" (a brief string).
        `,
        businessModel: `
        ${baseInstruction}
        Propose a 3-tier value ladder. The JSON object must have keys: "leadMagnet", "introOffer", "coreProduct". Each key should have a nested object with "name" (a string, e.g., "Free Analyzer Tool"), "price" (a string, e.g., "Free" or "$49"), and "description" (a brief string).
        `,
        market: `
        ${baseInstruction}
        Analyze its market position. The JSON object must have keys: "targetAudience" (string), "mainCompetitor" (string), and "supportingTrend" (string).
        `,
        channels: `
        ${baseInstruction}
        Analyze its go-to-market potential on social channels. The JSON object must have keys: "reddit", "facebook", "youtube". Each key should have a nested object with "score" (a number 1-10) and "strategy" (a brief string for that channel).
        `,
        seo: `
        ${baseInstruction}
        Suggest initial SEO keywords. The JSON object must have a single key "keywords", which is an array of 3-5 relevant, long-tail keyword strings.
        `,
        execution: `
        ${baseInstruction}
        Outline an execution plan. The JSON object must have a single key "plan", which is a concise string paragraph outlining the MVP and initial launch strategy.
        `,
        acp: `
        ${baseInstruction}
        Analyze it using the A.C.P. (Audience, Community, Product) framework. The JSON object must have keys: "audience", "community", "product". Each key should have a nested object with "score" (a number 1-10) and "reasoning" (a brief string).
        `
    };

    return prompts[analysisType] || baseInstruction;
}