/**
 * ideas-prompts.js
 * 
 * This file contains prompt templates for the AI.
 * Keeping them separate makes them easier to manage and refine.
 */

function createAnalysisPrompt(transcript) {
    /**
     * Creates a structured prompt for the AI to analyze a video transcript.
     * @param {string} transcript - The full text content of the video transcript.
     * @returns {string} - The complete prompt to be sent to the AI.
     */
    return `
You are an expert analyst and creative strategist. Your task is to analyze the following video transcript and extract valuable insights.

Please adhere strictly to the following instructions:
1.  Read the entire transcript carefully to understand the main topics, arguments, and tone.
2.  Provide your analysis ONLY in the form of a valid JSON object. Do not include any text, greetings, or explanations before or after the JSON object.
3.  The JSON object must have the following keys: "summary", "takeaways", "extracted_ideas", and "further_ideas".
4.  "summary": Write a concise, 2-4 sentence summary of the video's content.
5.  "takeaways": List 3-5 main key points or learning lessons from the video as an array of strings.
6.  "extracted_ideas": List 2-4 direct or implied ideas, projects, or concepts mentioned within the video as an array of strings.
7.  "further_ideas": Based on the video's content, generate 3-5 new, creative, and actionable ideas that expand upon the video's themes as an array of strings.

Here is the transcript:
--- TRANSCRIPT START ---
${transcript}
--- TRANSCRIPT END ---

Now, provide your analysis as a JSON object.
`;
}