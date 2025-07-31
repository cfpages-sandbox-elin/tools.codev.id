// ideas-prompts.js v1.15 +prd
export function createComprehensiveAnalysisPrompt(transcript) {
    return `
You are an expert analyst, strategist, and educator. Your task is to perform a comprehensive analysis of the following video transcript and structure your findings in a single JSON object.

**CRITICAL INSTRUCTION:**
Analyze the content and only include the top-level keys in your JSON response that are RELEVANT to the video. For example:
- If the video is a tutorial, you MUST include the "guide" key.
- If the video is a podcast/interview, you MUST include the "podcastDetails" key.
- If the video contains lists of ideas, strategies, or principles, you MUST include the "insights" key.
- If a section is not relevant, DO NOT include its key in the final JSON object.
- You MUST always include the "summary" key.

**JSON Object Schema Definition:**

{
  "summary": {
    "mainTopic": "A short string describing the central theme of the video.",
    "subTopics": [
        { "title": "Title of a distinct section", "startTime": "Start time in seconds", "endTime": "End time in seconds" }
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
${transcript}
--- TRANSCRIPT END ---

Now, provide your complete analysis as a single, valid JSON object, including ONLY the relevant top-level keys based on the content.
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
    You are a Senior Product Manager at a top tech company. Your task is to generate a concise but comprehensive Product Requirements Document (PRD) in Markdown format based on an AI-generated strategic plan.

    **Product Name:** ${ideaTitle}

    **AI-Generated Strategic Plan (JSON):**
    ${planJson}

    **Instructions:**
    Generate a PRD in Markdown format. The PRD should include the following sections:

    1.  **Introduction & Vision:**
        *   **Problem:** What problem is this product solving?
        *   **Solution:** Briefly describe the product and its core value proposition.
        *   **Target Audience:** Who are the primary users?

    2.  **Goals & Success Metrics:**
        *   **Business Goals:** What are the high-level business objectives? (e.g., Acquire 1,000 paying users in 6 months).
        *   **Product Goals:** What should the product achieve? (e.g., Automate 90% of the grant proposal drafting process).
        *   **Key Metrics (KPIs):** How will success be measured? (e.g., User Activation Rate, Conversion to Paid, Churn Rate).

    3.  **MVP Feature Set:**
        *   List the core features from the plan as a bulleted list. Provide a one-sentence description for each feature explaining its purpose.

    4.  **Technical & Feasibility Summary:**
        *   Briefly summarize the feasibility analysis from the plan.
        *   List the recommended technical stack.

    5.  **Go-to-Market Strategy:**
        *   Summarize the key steps from the go-to-market plan.

    Now, generate the complete PRD in Markdown format. Use clear headings and formatting.
    `;
}