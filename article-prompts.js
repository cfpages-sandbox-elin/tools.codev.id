// article-prompts.js

import { getState, getBulkPlan } from './article-state.js';
import { languageOptions } from './article-config.js';

// --- Single Article Prompts ---

export function getSingleTitlePrompt() {
    const state = getState();
    return `Generate a compelling and SEO-friendly article title for the keyword "${state.keyword}". Consider the target audience: ${state.audience}. The desired tone is: ${state.tone}. The article's main purpose is: ${state.purpose.join(', ')}. ${state.language !== 'English' ? `Generate the title in ${state.language}.` : ''} Output ONLY the title text, without any quotation marks or introductory phrases.`;
}

export function getSingleStructurePrompt(articleTitle) {
    const state = getState();
    return `Generate a detailed article structure/outline for an article titled "${articleTitle}" about the keyword "${state.keyword}".\n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}\n- Target Audience: ${state.audience}\n- Tone: ${state.tone}\n${state.gender ? `- Author Gender Persona: ${state.gender}` : ''}\n${state.age ? `- Author Age Persona: ${state.age}` : ''}\n- Article Purpose(s): ${state.purpose.join(', ')}\n${state.purposeUrl && state.purpose.includes('Promote URL') ? `  - Promotional URL: ${state.purposeUrl}` : ''}\n${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? `  - Desired Call to Action: ${state.purposeCta}` : ''}\n${state.readerName ? `- Address Reader As: ${state.readerName}` : ''}\n${state.customSpecs ? `- Other Details: ${state.customSpecs}` : ''}\n\nInstructions:\n- Create a logical structure covering the topic comprehensively.\n- Output only the structure using clear headings or bullet points.\n- Do not include intro/concluding remarks about the structure itself.`;
}

export function getSingleSectionTextPrompt(section, previousContext, articleTitle) {
    const state = getState();
    let linkingInstructions = '';
    if (state.sitemapUrls && state.sitemapUrls.length > 0) {
         const urlList = state.sitemapUrls.slice(0, 5).join('\n'); // Limit shown URLs
         linkingInstructions = `\n- Consider linking naturally to relevant URLs from this list if appropriate:\n${urlList}\n- Link Type Preference: ${state.linkTypeInternal ? 'Internal (relative paths like /slug)' : 'External (full URLs)'}. Aim for 1-2 relevant links per section if possible.`;
    }
    // Construct prompt using heading and points
    let pointsGuidance = '';
    if (section.points && section.points.length > 0) {
        pointsGuidance = `\nKey points/subtopics to cover in this section:\n- ${section.points.join('\n- ')}\n`;
    }
    const humanizeInstructions = `\n- Humanization Style: Write in a direct and clear style. Prefer shorter sentences and break content into smaller, more digestible paragraphs. Avoid complex sentence structures and obvious AI conversational patterns or procedural rhetoric. Do not use phrases like "In conclusion", "In the world of", "It's important to note", or "delve into". If an author persona (gender/age) is provided, subtly weave in a brief, relevant personal anecdote or observation to build connection with the reader.`;
    const prompt = `Generate the article content ONLY for the section titled or about: "${section.heading}".
    \nThis section is part of a larger article titled "${articleTitle}".
    \n${pointsGuidance}
    \nContinue naturally from the previous context if provided.
    \nPrevious Context (end of last section):
    \n---
    \n${previousContext ? previousContext.slice(-500) : '(Start of article)'}
    \n---
    \n\nOverall Article Specifications:
    \n- Keyword: "${state.keyword}"
    \n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}
    \n- Target Audience: ${state.audience}
    \n- Tone: ${state.tone}
    \n${state.gender ? `- Author Gender: ${state.gender}
    \n` : ''}${state.age ? `- Author Age: ${state.age}
    \n` : ''}- Purpose(s): ${state.purpose.join(', ')}
    \n${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}
    \n` : ''}${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}
    \n` : ''}${state.readerName ? `- Reader Name: ${state.readerName}
    \n` : ''}- Output Format: ${state.format}
    \n${state.customSpecs ? `- Other Details: ${state.customSpecs}
    \n` : ''}${linkingInstructions}
    \n${state.humanizeContent ? humanizeInstructions : ''}
    \n\nInstructions:
    \n- Write ONLY the content for the current section: "${section.heading}".
    \n- Use the provided key points as guidance for the content.
    \n- Do NOT repeat the main section heading ("${section.heading}") unless it fits naturally (e.g., as an <h2>).
    \n- Ensure smooth transition from previous context.
    \n- Adhere strictly to ${state.format} format (${state.format === 'html' ? 'use only <p>, <h2>-<h6>, <ul>, <ol>, <li>, <b>, <i>, <a> tags' : 'use standard Markdown'}).
    \n- Do NOT add introductory or concluding remarks about the writing process or the section itself. Focus solely on generating the body content for this specific section.`;

    return prompt;
}

// --- Bulk Article Prompts ---

export function getPlanPrompt(keywords) {
    const state = getState();
    return `For each keyword provided below, generate a unique and SEO-friendly article Title, a URL-safe Slug (lowercase, hyphen-separated, no stop words, descriptive), and the primary User Intent (e.g., Informational, Commercial Investigation, Transactional, Navigational). Ensure Title, Slug, and Intent are unique across all keywords. If multiple keywords result in the same concept, only include one entry. Format the output strictly as a JSON array of objects, where each object has "keyword", "title", "slug", and "intent" keys.\n\nLanguage for Title/Intent: ${state.language}\nTarget Audience: ${state.audience}\nArticle Purpose(s): ${state.purpose.join(', ')}\n\nKeywords:\n${keywords.join('\n')}\n\nOutput only the JSON array.`;
}

export function getBulkStructurePrompt(planItem) {
    const state = getState();
    return `Generate a detailed article structure/outline for an article titled "${planItem.title}" (intent: ${planItem.intent}) about the keyword "${planItem.keyword}".\n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}\n- Target Audience: ${state.audience}\n- Tone: ${state.tone}\n${state.gender ? `- Author Gender: ${state.gender}` : ''}\n${state.age ? `- Author Age: ${state.age}` : ''}\n- Purpose(s): ${state.purpose.join(', ')}\n${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}` : ''}\n${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}` : ''}\n${state.readerName ? `- Reader Name: ${state.readerName}` : ''}\n${state.customSpecs ? `- Other Details: ${state.customSpecs}` : ''}\nInstructions: Output ONLY the structure using clear headings/bullets. No intro/conclusion.`;
}

export function getBulkSectionTextPrompt(planItem, section, previousContext) {
    const state = getState(); // Get global settings like linking preferences
    const allPlanItems = getBulkPlan(); // Get full plan for internal linking context

    // Internal Linking Context
    const otherSlugs = allPlanItems
        .filter(p => p.slug && p.slug !== planItem.slug) // Exclude self
        .map(p => `/${p.slug}`) // Format as relative paths
        .slice(0, 8); // Limit suggestions

    // External Linking Context (from sitemap)
    const sitemapUrls = state.sitemapUrls || [];
    const externalUrls = sitemapUrls.slice(0, 5); // Limit suggestions

    // Build Linking Instructions
    let linkingInstructions = '\n\nLinking Instructions (Optional):\n';
    const linkTypePref = state.linkTypeInternal ? 'Internal (use relative paths like /slug)' : 'External (use full URLs)';
    linkingInstructions += `- Link Type Preference: ${linkTypePref}.\n`;
    if (otherSlugs.length > 0 && state.linkTypeInternal) {
        linkingInstructions += `- Consider linking naturally to related internal topics: ${otherSlugs.join(', ')}\n`;
    }
    if (externalUrls.length > 0 && !state.linkTypeInternal) {
        linkingInstructions += `- Consider linking naturally to relevant external URLs:\n${externalUrls.join('\n')}\n`;
    }
    linkingInstructions += '- Aim for 1-3 relevant links total within this section, only if contextually appropriate.\n';

    // Build Points Guidance
    let pointsGuidance = '';
    if (section.points && section.points.length > 0) {
        pointsGuidance = `\nKey points/subtopics to cover in this section:\n- ${section.points.join('\n- ')}\n`;
    }

    // Humanize Content
    const humanizeInstructions = `\n- Humanization Style: Write in a direct and clear style. Prefer shorter sentences and break content into smaller, more digestible paragraphs. Avoid complex sentence structures and obvious AI conversational patterns or procedural rhetoric. Do not use phrases like "In conclusion", "In the world of", "It's important to note", or "delve into". If an author persona (gender/age) is provided, subtly weave in a brief, relevant personal anecdote or observation to build connection with the reader.`;

    // Construct the Main Prompt
    const prompt = `Generate the Markdown article content ONLY for the section titled or about: "${section.heading}".
    \nThis section belongs to an article about the keyword "${planItem.keyword}" with the title "${planItem.title}" (User Intent: ${planItem.intent}).
    \n${pointsGuidance}
    \nContinue naturally from the previous context.
    \nPrevious Context (end of last section):
    \n---
    \n${previousContext ? previousContext.slice(-500) : '(Start of article)'}
    \n---\n
    \nOverall Article Specifications:
    \n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}
    \n- Audience: ${state.audience}
    \n- Tone: ${state.tone}
    \n${state.gender ? `- Author Gender: ${state.gender}
    \n` : ''}${state.age ? `- Author Age: ${state.age}
    \n` : ''}- Purpose(s): ${state.purpose.join(', ')}
    \n${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}
    \n` : ''}${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}
    \n` : ''}${state.readerName ? `- Reader Name: ${state.readerName}
    \n` : ''}${state.customSpecs ? `- Other Details: ${state.customSpecs}
    \n` : ''}${linkingInstructions}
    \n${state.humanizeContent ? humanizeInstructions : ''}
    \nInstructions:
    \n- Write ONLY the Markdown content for the current section: "${section.heading}".
    \n- Use the provided key points as essential guidance for the content.
    \n- Do NOT repeat the main section heading ("${section.heading}") unless it fits naturally as a Markdown heading (e.g., ## Sub Heading).
    \n- Ensure smooth transition from previous context.
    \n- Use standard Markdown formatting ONLY.
    \n- Do NOT add introductory or concluding remarks about the writing process or the section itself. Focus solely on generating the body content for this specific section.`;

    return prompt;
}

// --- Idea Generation Prompts ---

export function getIdeaPrompt(seedKeyword, questionType, questionDetail) {
    const state = getState();
    const language = state.language === 'custom' ? state.customLanguage : state.language;
    const audience = state.audience;

    return `You are an expert keyword researcher helping to generate article ideas.
Given the primary seed keyword: "[SEED_KEYWORD]"
And focusing on the "[QUESTION_TYPE]" aspect, specifically: ${questionDetail}

Generate a diverse list of 5 to 10 related long-tail keywords or article ideas.
These keywords should be relevant for an audience interested in "${audience}" and the content will be in ${language}.
Ensure the keywords are practical for creating distinct article topics.

Output ONLY a comma-separated list of the generated keywords. Do not include numbering, bullet points, or any introductory/concluding text.

Example for a seed keyword "Sustainable Gardening" and "What" aspect:
What is organic pest control, What are companion planting techniques, What is soil testing for gardens, What are drought-tolerant plants, What tools are needed for sustainable gardening

Seed Keyword: "${seedKeyword}"
Language: ${language}
Target Audience: ${audience}
Aspect: ${questionType}
`;
}

// --- Spinner Prompts ---

export function getSpintaxPrompt(textToSpin, isSentence = false) {
    const state = getState();
    const language = state.language === 'custom' ? state.customLanguage : languageOptions[state.language]?.name || state.language;
    const dialect = state.dialect;
    const tone = state.tone === 'custom' ? state.customTone : state.tone;

    if (isSentence) {
        return `Take the following text (which is a single sentence without its final punctuation) and generate 3-6 variations (or as much as possible) that mean the same thing, suitable for spintax. Focus on rephrasing or reordering sentence components (subject, predicate, object, information) as shown in the example.

        Example:
        Text to Spin (without punctuation): Budi makan soto di rumah makan
        Spintax Output (without punctuation): {Budi makan soto di rumah makan|Di rumah makan Budi makan soto|Di rumah makan soto dimakan Budi|Budi di rumah makan makan soto|Soto dimakan Budi di rumah makan|Soto di rumah makan dimakan Budi}

        Instructions:
        - Generate 3-6 variations.
        - Maintain the original meaning.
        - Maintain the specified Language (${language}${dialect ? `, ${dialect} dialect` : ''}) and Tone (${tone}).
        - Output Format: Return ONLY the spintax string in the format {original|variation1|variation2|...}.
        - The output should NOT include the final punctuation mark that was removed from the original text.

        Text to Spin (without punctuation):
        ---
        ${textToSpin}
        ---`;
    } else { // For selected text (phrase)
        return `Take the following text and generate 3-6 variations that mean the same thing, suitable for spintax. Exclude the final punctuation mark from the generated spintax.

        Example:
        Text to Spin: Budi makan soto di rumah makan.
        Spintax Output: {Budi makan soto di rumah makan|Di rumah makan Budi makan soto|Di rumah makan soto dimakan Budi|Budi di rumah makan makan soto|Soto dimakan Budi di rumah makan|Soto di rumah makan dimakan Budi}

        Instructions:
        - Generate 3-6 variations.
        - Maintain the original meaning.
        - Maintain the specified Language (${language}${dialect ? `, ${dialect} dialect` : ''}) and Tone (${tone}).
        - Output Format: Return ONLY the spintax string in the format {original|variation1|variation2|...}.
        - DO NOT include the final punctuation mark from the original text in the spintax output.

        Text to Spin:
        ---
        ${textToSpin}
        ---`;
    }
}

console.log("article-prompts.js loaded");