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