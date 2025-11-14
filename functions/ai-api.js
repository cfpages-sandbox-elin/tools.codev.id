/**
 * =================================================================================
 * AI API Proxy for Cloudflare Functions
 * =================================================================================
 * This is a self-contained Cloudflare Function that securely proxies AI API calls.
 * It combines both the API logic and the configuration into a single file to
 * prevent module resolution errors during the build process.
 *
 * Actions: 'generate', 'check_status', 'fetch_sitemap', 'generate_image', 'upload_image'
 * Endpoint: /ai-api
 */
const createOpenRouterModel = (modelData) => ({
    provider: 'OpenRouter',
    modality: ['text'],
    knowledgeCutoff: null,
    maxOutputTokens: null,
    pricing: null,
    rateLimits: null,
    features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
    performance: null,
    ...modelData,
});

const aiTextProviders = {
    openrouter: {
        models: [
            createOpenRouterModel({
                id: 'deepseek/deepseek-r1-0528-qwen3-8b',
                name: 'DeepSeek R1 0528 Qwen3 8B',
                developer: 'DeepSeek',
                contextWindow: 131072,
                parameters: '8B',
                description: `A distilled 8B model with advanced reasoning and chain-of-thought capabilities, derived from the larger DeepSeek R1. Excels at math, programming, and logic.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'meta-llama/llama-3.2-11b-vision-instruct',
                name: 'Llama 3.2 11B Vision Instruct',
                developer: 'Meta',
                contextWindow: 131072,
                parameters: '11B',
                description: `A multimodal model designed for tasks combining visual and textual data, such as image captioning and visual QA.`,
                modality: ['multimodal'],
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'meta-llama/llama-3.2-3b-instruct',
                name: 'Llama 3.2 3B Instruct',
                developer: 'Meta',
                contextWindow: 131072,
                parameters: '3B',
                description: `A 3B parameter multilingual LLM supporting eight languages, optimized for dialogue, reasoning, and summarization.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'moonshotai/kimi-vl-a3b-thinking',
                name: 'Moonshot AI Kimi VL A3B Thinking',
                developer: 'Moonshot AI',
                contextWindow: 131072,
                parameters: '3B (2.8B active)',
                description: `A lightweight MoE vision-language model delivering strong performance on multimodal reasoning and long-context tasks.`,
                modality: ['multimodal'],
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: false },
            }),
            createOpenRouterModel({
                id: 'qwen/qwen3-4b',
                name: 'Qwen3 4B',
                developer: 'Qwen',
                contextWindow: 40960,
                parameters: '4B',
                description: `A 4B parameter model with a dual-mode architecture for both general-purpose chat and reasoning-intensive tasks.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'google/gemini-2.0-flash-experimental',
                name: 'Gemini 2.0 Flash Experimental',
                developer: 'Google',
                contextWindow: 1048576,
                parameters: '4B',
                description: `An experimental model focused on extremely fast time-to-first-token (TTFT). Strong in multimodality, coding, and function calling.`,
                modality: ['multimodal'],
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'qwen/qwen3-30b-a3b',
                name: 'Qwen3 30B A3B',
                developer: 'Qwen',
                contextWindow: 40960,
                parameters: '30B (3.3B active)',
                description: `A MoE model with 30.5B total parameters (3.3B active) setting a new standard for open-source models in its class.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'mistralai/mistral-7b-instruct',
                name: 'Mistral 7B Instruct',
                developer: 'Mistral AI',
                contextWindow: 32768,
                parameters: '7.3B',
                description: `A high-performing and widely adopted 7.3B parameter model, optimized for speed and long context.`,
            }),
            createOpenRouterModel({
                id: 'qwen/qwen3-8b',
                name: 'Qwen3 8B',
                developer: 'Qwen',
                contextWindow: 40960,
                parameters: '8.2B',
                description: `An 8.2B model with a "thinking" mode for complex math, coding, and logical inference, and a "non-thinking" mode for general chat.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'qwen/qwen3-235b-a22b-instruct-2507',
                name: 'Qwen3 235B A22B 2507',
                developer: 'Qwen',
                contextWindow: 262144,
                parameters: '235B (22B active)',
                description: `A large multilingual MoE model optimized for instruction following, reasoning, math, code, and tool usage. Activates 22B parameters per pass.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'sarvamai/sarvam-m',
                name: 'Sarvam-M',
                developer: 'Sarvam AI',
                contextWindow: 32768,
                parameters: '24B',
                description: `A 24B model post-trained on English plus eleven major Indic languages, featuring an optional "think" mode for reasoning.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'microsoft/mai-ds-r1',
                name: 'Microsoft MAI DS R1',
                developer: 'Microsoft',
                contextWindow: 163840,
                parameters: 'Unknown',
                description: `A variant of DeepSeek-R1 post-trained by Microsoft to enhance safety and responsiveness on previously blocked topics.`,
            }),
            createOpenRouterModel({
                id: 'agentica/deepcoder-14b-preview',
                name: 'Agentica Deepcoder 14B Preview',
                developer: 'Agentica',
                contextWindow: 98304,
                parameters: '14B',
                description: `A 14B parameter model fine-tuned from DeepSeek-R1 for advanced code generation tasks.`,
                modality: ['code'],
            }),
            createOpenRouterModel({
                id: 'moonshotai/kimi-dev-72b',
                name: 'Moonshot AI Kimi Dev 72b',
                developer: 'Moonshot AI',
                contextWindow: 131072,
                parameters: '72B',
                description: `An open-source 72B model based on Qwen2.5, fine-tuned for software engineering and issue resolution.`,
                modality: ['code'],
            }),
            createOpenRouterModel({
                id: 'mistralai/devstral-small-2505',
                name: 'Mistral Devstral Small 2505',
                developer: 'Mistral AI',
                contextWindow: 32768,
                parameters: '24B',
                description: `A 24B parameter agentic LLM fine-tuned for advanced software engineering tasks.`,
                modality: ['code'],
            }),
            createOpenRouterModel({
                id: 'tencent/hunyuan-a13b-instruct',
                name: 'Tencent Hunyuan A13B Instruct',
                developer: 'Tencent',
                contextWindow: 32768,
                parameters: '80B (13B active)',
                description: `A MoE model with 13B active parameters, supporting reasoning via Chain-of-Thought.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'moonshotai/kimi-k2-instruct',
                name: 'MoonshotAI Kimi K2',
                developer: 'Moonshot AI',
                contextWindow: 65536,
                parameters: '1T (32B active)',
                description: `A massive 1T parameter MoE model (32B active) for complex reasoning and instruction following.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: false },
            }),
            createOpenRouterModel({
                id: 'meta-llama/llama-3.3-70b-instruct',
                name: 'Llama 3.3 70B Instruct',
                developer: 'Meta',
                contextWindow: 65536,
                parameters: '70B',
                description: `A 70B parameter multilingual model instruction-tuned and optimized for dialogue use cases.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'deepseek/deepseek-r1',
                name: 'DeepSeek R1',
                developer: 'DeepSeek',
                contextWindow: 163840,
                parameters: '671B (37B active)',
                description: `A 671B parameter MoE model (37B active) with open-sourced reasoning tokens, with performance on par with top-tier models.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'mistralai/mistral-nemo',
                name: 'Mistral Nemo',
                developer: 'Mistral AI',
                contextWindow: 131072,
                parameters: '12B',
                description: `A 12B parameter multilingual model with a 128k context, built in collaboration with NVIDIA. Supports function calling.`,
            }),
            createOpenRouterModel({
                id: 'google/gemma-3-12b-it',
                name: 'Google Gemma 3 12B',
                developer: 'Google',
                contextWindow: 98304,
                parameters: '12B',
                description: `A multimodal model supporting vision-language input, 128k context, 140+ languages, and improved math/reasoning.`,
                modality: ['multimodal'],
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'qwen/qwen3-235b-a22b',
                name: 'Qwen3 235B A22B',
                developer: 'Qwen',
                contextWindow: 131072,
                parameters: '235B (22B active)',
                description: `A 235B MoE model (22B active) with a "thinking" mode for complex reasoning and a "non-thinking" mode for general chat.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'google/gemma-3n-4b-it',
                name: 'Google Gemma 3n 4B',
                developer: 'Google',
                contextWindow: 8192,
                parameters: '4B',
                description: `A multimodal model optimized for mobile and low-resource devices, supporting text, visual, and audio inputs.`,
                modality: ['multimodal'],
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'qwen/qwen3-coder-480b-a35b-instruct',
                name: 'Qwen3 Coder',
                developer: 'Qwen',
                contextWindow: 262144,
                parameters: '480B (35B active)',
                description: `A MoE code generation model (35B active) optimized for agentic coding tasks, tool use, and long-context reasoning over codebases.`,
                modality: ['code'],
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: false },
            }),
            createOpenRouterModel({
                id: 'qwen/qwen2.5-vl-72b-instruct',
                name: 'Qwen2.5 VL 72B Instruct',
                developer: 'Qwen',
                contextWindow: 32768,
                parameters: '72B',
                description: `A vision-language model proficient in recognizing common objects and analyzing texts, charts, icons, and layouts within images.`,
                modality: ['multimodal'],
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'google/gemma-2-9b-it',
                name: 'Google Gemma 2 9B',
                developer: 'Google',
                contextWindow: 8192,
                parameters: '9B',
                description: `Google's advanced 9B open-source model, setting a new standard for performance and efficiency in its size class.`,
            }),
            createOpenRouterModel({
                id: 'meta-llama/llama-3.1-405b-instruct',
                name: 'Meta Llama 3.1 405B Instruct',
                developer: 'Meta',
                contextWindow: 65536,
                parameters: '405B',
                description: `Meta's largest Llama 3 model, this 405B instruct-tuned version is optimized for high-quality, complex dialogue.`,
            }),
            createOpenRouterModel({
                id: 'google/gemma-3-27b-it',
                name: 'Google Gemma 3 27B',
                developer: 'Google',
                contextWindow: 98304,
                parameters: '27B',
                description: `The 27B version of Gemma 3, supporting multimodal vision-language input and text output. Successor to Gemma 2.`,
                modality: ['multimodal'],
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
                name: 'NVIDIA Llama 3.1 Nemotron Ultra 253B v1',
                developer: 'NVIDIA',
                contextWindow: 131072,
                parameters: '253B',
                description: `A 253B LLM optimized for advanced reasoning, RAG, and tool-calling tasks, developed with Meta's Llama 3.1.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
            createOpenRouterModel({
                id: 'nousresearch/deephermes-3-llama-3-8b-preview',
                name: 'Nous DeepHermes 3 Llama 3 8B Preview',
                developer: 'Nous Research',
                contextWindow: 131072,
                parameters: '8B',
                description: `One of the first models to unify long-chain-of-thought reasoning and normal response modes into a single model.`,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            }),
        ]
    },
    openai: {
        models: [
            {
                id: 'gpt-5-pro',
                name: 'GPT-5 pro',
                developer: 'OpenAI',
                provider: 'OpenAI',
                description: 'The most intelligent and precise version of GPT-5, ideal for tasks requiring deep understanding and accuracy.',
                modality: ['text'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: 16384,
                knowledgeCutoff: null, // Often updated, check docs
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 10.00, output: 40.00, tiers: null },
                rateLimits: null, // Tier-dependent, check docs
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Moderate', tokensPerSecond: null },
            },
            {
                id: 'gpt-5.1',
                name: 'GPT-5.1',
                developer: 'OpenAI',
                provider: 'OpenAI',
                description: "The best model for coding and agentic tasks with configurable reasoning effort.",
                modality: ['text', 'code'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: 16384,
                knowledgeCutoff: null, // Often updated, check docs
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 5.00, output: 20.00, tiers: null },
                rateLimits: null, // Tier-dependent, check docs
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Moderate', tokensPerSecond: null },
            },
            {
                id: 'o3-pro-2025-06-10',
                name: 'o3-pro',
                developer: 'OpenAI',
                provider: 'OpenAI',
                description: "OpenAI's most powerful reasoning model with extra compute for superior responses on complex tasks.",
                modality: ['text'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: 8192,
                knowledgeCutoff: '2025-06',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 20.00, output: 80.00, tiers: null },
                rateLimits: { requestsPerMinute: 10000, tokensPerMinute: 2000000, requestsPerDay: null, tokensPerDay: 200000000, notes: null },
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Moderate', tokensPerSecond: null },
            },
            {
                id: 'gpt-4o-2024-08-06',
                name: 'GPT-4o',
                developer: 'OpenAI',
                provider: 'OpenAI',
                description: "The flagship 'omni' model, balancing speed, intelligence, and multimodality (text, vision, audio).",
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: 4096,
                knowledgeCutoff: '2024-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 2.50, output: 10.00, tiers: [{ name: 'vision_pricing', input: 1.25, output: null, notes: "Pricing for vision input." }] },
                rateLimits: { requestsPerMinute: 10000, tokensPerMinute: 2000000, requestsPerDay: null, tokensPerDay: 200000000, notes: null },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fast', tokensPerSecond: null },
            },
            {
                id: 'gpt-5-mini',
                name: 'GPT-5 mini',
                developer: 'OpenAI',
                provider: 'OpenAI',
                description: 'A faster, cost-efficient version of GPT-5 for well-defined or high-volume tasks.',
                modality: ['text'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: 16384,
                knowledgeCutoff: null, // Often updated, check docs
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.25, output: 1.00, tiers: null },
                rateLimits: null, // Tier-dependent, check docs
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fast', tokensPerSecond: null },
            },
            {
                id: 'gpt-4o-mini-2024-07-18',
                name: 'GPT-4o mini',
                developer: 'OpenAI',
                provider: 'OpenAI',
                description: "A fast, affordable, and highly capable small model, designed for scaled or low-latency tasks.",
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: 16384,
                knowledgeCutoff: '2024-07',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.15, output: 0.60, tiers: [{ name: 'vision_pricing', input: 0.075, output: null, notes: "Pricing for vision input." }] },
                rateLimits: { requestsPerMinute: 10000, tokensPerMinute: 10000000, requestsPerDay: null, tokensPerDay: 1000000000, notes: null },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fastest', tokensPerSecond: null },
            },
            {
                id: 'gpt-5-nano',
                name: 'GPT-5 nano',
                developer: 'OpenAI',
                provider: 'OpenAI',
                description: 'The fastest and most cost-efficient version of GPT-5, optimized for speed in simple tasks.',
                modality: ['text'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: 16384,
                knowledgeCutoff: null, // Often updated, check docs
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.05, output: 0.20, tiers: null },
                rateLimits: null, // Tier-dependent, check docs
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fastest', tokensPerSecond: null },
            },
        ]
    },
    anthropic: {
        models: [
            {
                id: 'claude-opus-4-20250514',
                name: 'Claude Opus 4',
                developer: 'Anthropic',
                provider: 'Anthropic',
                description: "Anthropic's most powerful model, excelling at complex reasoning, advanced coding, and sophisticated analysis.",
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 200000,
                maxOutputTokens: 32000,
                knowledgeCutoff: '2025-03',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 15.00, output: 75.00, tiers: null },
                rateLimits: null,
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Moderate', tokensPerSecond: null },
            },
            {
                id: 'claude-sonnet-4-20250514',
                name: 'Claude Sonnet 4',
                developer: 'Anthropic',
                provider: 'Anthropic',
                description: "A high-performance model balancing strong intelligence with speed, ideal for enterprise workloads.",
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 200000,
                maxOutputTokens: 64000,
                knowledgeCutoff: '2025-03',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 3.00, output: 15.00, tiers: null },
                rateLimits: null,
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Fast', tokensPerSecond: null },
            },
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude Sonnet 3.5 (Upgraded)',
                developer: 'Anthropic',
                provider: 'Anthropic',
                description: "An intelligent and capable model with a high level of performance and a more recent knowledge cutoff.",
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 200000,
                maxOutputTokens: 8192,
                knowledgeCutoff: '2024-04',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 3.00, output: 15.00, tiers: null },
                rateLimits: null,
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fast', tokensPerSecond: null },
            },
            {
                id: 'claude-3-haiku-20240307',
                name: 'Claude Haiku 3',
                developer: 'Anthropic',
                provider: 'Anthropic',
                description: "A fast and compact model designed for near-instant responsiveness in lightweight applications.",
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 200000,
                maxOutputTokens: 4096,
                knowledgeCutoff: '2023-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.25, output: 1.25, tiers: null },
                rateLimits: null,
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fastest', tokensPerSecond: null },
            },
        ]
    },
    deepseek: {
        models: [
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek Reasoner',
                developer: 'DeepSeek',
                provider: 'DeepSeek',
                description: "Points to DeepSeek-R1-0528. Optimized for reasoning tasks. Output includes Chain-of-Thought tokens.",
                modality: ['text', 'code'],
                parameters: '671B (37B active)',
                contextWindow: 65536,
                maxOutputTokens: 65536,
                knowledgeCutoff: '2024-05',
                pricing: {
                    currency: 'USD',
                    unit: 'per_1m_tokens',
                    input: null, // Tiered pricing applies
                    output: null,
                    tiers: [
                        { name: 'standard_cache_miss', input: 0.55, output: 2.19, notes: 'Time UTC: 00:30-16:30' },
                        { name: 'standard_cache_hit', input: 0.14, output: 2.19, notes: 'Time UTC: 00:30-16:30' },
                        { name: 'discount_cache_miss', input: 0.135, output: 0.55, notes: 'Time UTC: 16:30-00:30' },
                        { name: 'discount_cache_hit', input: 0.035, output: 0.55, notes: 'Time UTC: 16:30-00:30' },
                    ]
                },
                rateLimits: null,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Moderate', tokensPerSecond: null },
            },
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                developer: 'DeepSeek',
                provider: 'DeepSeek',
                description: "Points to DeepSeek-V3-0324. Optimized for general chat, JSON output, and function calling.",
                modality: ['text', 'code'],
                parameters: '685B',
                contextWindow: 65536,
                maxOutputTokens: 8192,
                knowledgeCutoff: '2024-03',
                pricing: {
                    currency: 'USD',
                    unit: 'per_1m_tokens',
                    input: null, // Tiered pricing applies
                    output: null,
                    tiers: [
                        { name: 'standard_cache_miss', input: 0.27, output: 1.10, notes: 'Time UTC: 00:30-16:30' },
                        { name: 'standard_cache_hit', input: 0.07, output: 1.10, notes: 'Time UTC: 00:30-16:30' },
                        { name: 'discount_cache_miss', input: 0.135, output: 0.55, notes: 'Time UTC: 16:30-00:30' },
                        { name: 'discount_cache_hit', input: 0.035, output: 0.55, notes: 'Time UTC: 16:30-00:30' },
                    ]
                },
                rateLimits: null,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fast', tokensPerSecond: null },
            }
        ]
    },
    xai: {
        models: [
            {
                id: 'grok-4-0709',
                name: 'Grok 4',
                developer: 'xAI',
                provider: 'xAI',
                description: "xAI's most capable model for advanced reasoning, structured outputs, and function calling.",
                modality: ['text'],
                parameters: 'Unknown',
                contextWindow: 256000,
                maxOutputTokens: null,
                knowledgeCutoff: '2024-07',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 3.00, output: 15.00, tiers: null },
                rateLimits: { requestsPerMinute: 480, tokensPerMinute: 2000000, requestsPerDay: null, tokensPerDay: null, notes: "2,000,000 TPM, 480 RPM" },
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Moderate', tokensPerSecond: null },
            },
            {
                id: 'grok-3-mini',
                name: 'Grok 3 Mini',
                developer: 'xAI',
                provider: 'xAI',
                description: "A smaller, more cost-effective version of Grok 3 for general-purpose tasks.",
                modality: ['text'],
                parameters: 'Unknown',
                contextWindow: 131072,
                maxOutputTokens: null,
                knowledgeCutoff: null,
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.30, output: 0.50, tiers: null },
                rateLimits: { requestsPerMinute: 480, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null, notes: "480 RPM" },
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fast', tokensPerSecond: null },
            }
        ]
    },
    groq: {
        models: [
            {
                id: 'llama-3.3-70b-versatile',
                name: 'Llama 3.3 70B',
                developer: 'Meta',
                provider: 'Groq',
                description: "Meta's 70B multilingual model on Groq's LPU, optimized for code, math, and complex language tasks at high speed.",
                modality: ['text', 'code'],
                parameters: '70B',
                contextWindow: 131072,
                maxOutputTokens: 32768,
                knowledgeCutoff: null,
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.59, output: 0.79, tiers: null },
                rateLimits: { requestsPerMinute: 30, tokensPerMinute: 12000, requestsPerDay: 1000, tokensPerDay: 100000, notes: "Free tier limits." },
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fastest', tokensPerSecond: 280 },
            },
            {
                id: 'llama-3.1-8b-instant',
                name: 'Llama 3.1 8B',
                developer: 'Meta',
                provider: 'Groq',
                description: "A fast 8B model for real-time conversational interfaces, offering a balance of speed and performance with function calling.",
                modality: ['text'],
                parameters: '8B',
                contextWindow: 131072,
                maxOutputTokens: 131072,
                knowledgeCutoff: null,
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.05, output: 0.08, tiers: null },
                rateLimits: { requestsPerMinute: 30, tokensPerMinute: 6000, requestsPerDay: 14400, tokensPerDay: 500000, notes: "Free tier limits." },
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fastest', tokensPerSecond: 560 },
            },
            {
                id: 'gemma2-9b-it',
                name: 'Gemma 2 9B Instruct',
                developer: 'Google',
                provider: 'Groq',
                description: "Google's lightweight 9B model on Groq, optimized for conversational use cases like Q&A and reasoning at extreme speed.",
                modality: ['text'],
                parameters: '9B',
                contextWindow: 8192,
                maxOutputTokens: 8192,
                knowledgeCutoff: null,
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.20, output: 0.20, tiers: null },
                rateLimits: { requestsPerMinute: 30, tokensPerMinute: 15000, requestsPerDay: 14400, tokensPerDay: 500000, notes: "Free tier limits." },
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fastest', tokensPerSecond: 560 },
            },
        ]
    },
    huggingface: {
        models: [
            { id: 'meta-llama/Meta-Llama-3-8B-Instruct', name: 'Llama 3 8B Instruct', developer: 'Meta', provider: 'HuggingFace', description: 'Instruction-tuned version of Meta\'s Llama 3 8B model.', modality: ['text'], parameters: '8B', contextWindow: 8192, maxOutputTokens: null, knowledgeCutoff: null, pricing: null, rateLimits: null, features: null, performance: null },
            { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B Instruct v0.2', developer: 'Mistral AI', provider: 'HuggingFace', description: 'Version 0.2 of the popular Mistral 7B instruction-tuned model.', modality: ['text'], parameters: '7B', contextWindow: 32768, maxOutputTokens: null, knowledgeCutoff: null, pricing: null, rateLimits: null, features: null, performance: null },
            { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B IT', developer: 'Google', provider: 'HuggingFace', description: 'Instruction-tuned version of Google\'s Gemma 2 9B model.', modality: ['text'], parameters: '9B', contextWindow: 8192, maxOutputTokens: null, knowledgeCutoff: null, pricing: null, rateLimits: null, features: null, performance: null }
        ]
    },
    mistral: {
        models: [
            {
                id: 'mistral-large-latest',
                name: 'Mistral Large',
                developer: 'Mistral AI',
                provider: 'Mistral AI',
                description: "Top-tier reasoning model for high-complexity tasks. Multilingual and supports function calling.",
                modality: ['text'],
                parameters: 'Unknown',
                contextWindow: 128000,
                maxOutputTokens: null,
                knowledgeCutoff: '2024-11',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 2.00, output: 6.00, tiers: null },
                rateLimits: null,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
                performance: { latency: 'Moderate', tokensPerSecond: null },
            },
            {
                id: 'codestral-latest',
                name: 'Codestral',
                developer: 'Mistral AI',
                provider: 'Mistral AI',
                description: "A fast, lightweight model proficient in over 80 programming languages, designed for code generation and completion.",
                modality: ['code'],
                parameters: '22B',
                contextWindow: 256000,
                maxOutputTokens: null,
                knowledgeCutoff: '2025-01',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.30, output: 0.90, tiers: null },
                rateLimits: null,
                features: { vision: false, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: false },
                performance: { latency: 'Fast', tokensPerSecond: null },
            },
            {
                id: 'mistral-small-latest',
                name: 'Mistral Small 3.2',
                developer: 'Mistral AI',
                provider: 'Mistral AI',
                description: "State-of-the-art small model. Multimodal, multilingual, and released under Apache 2.0 license.",
                modality: ['multimodal'],
                parameters: '24B',
                contextWindow: 128000,
                maxOutputTokens: null,
                knowledgeCutoff: '2025-06',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.10, output: 0.30, tiers: null },
                rateLimits: null,
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
                performance: { latency: 'Fastest', tokensPerSecond: null },
            }
        ]
    },
    google: {
        models: [
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                developer: 'Google',
                provider: 'Google',
                description: 'Best for complex coding, reasoning, and multimodal understanding, with a very long context window.',
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 2000000, // 2M tokens
                maxOutputTokens: 8192,
                knowledgeCutoff: '2025-01',
                pricing: {
                    currency: 'USD', unit: 'per_1m_tokens', input: null, output: null,
                    tiers: [
                        { name: 'Up to 200K tokens', input: 1.25, output: 10.00 },
                        { name: 'Over 200K tokens', input: 2.50, output: 15.00 }
                    ]
                },
                rateLimits: { requestsPerMinute: 150, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            },
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                developer: 'Google',
                provider: 'Google',
                description: 'Best for large scale processing, agentic use cases, and tasks requiring low latency and high volume.',
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 1000000, // 1M tokens
                maxOutputTokens: 8192,
                knowledgeCutoff: '2025-01',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.30, output: 2.50 },
                rateLimits: {
                    requestsPerMinute: 1000, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 10, requestsPerDay: 500 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: true, multilingual: true },
            },
            {
                id: 'gemini-2.5-flash-lite',
                name: 'Gemini 2.5 Flash-Lite',
                developer: 'Google',
                provider: 'Google',
                description: 'A lower-cost version of Flash, ideal for data transformation, translation, and summarization at scale.',
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 1000000, // 1M tokens
                maxOutputTokens: 8192,
                knowledgeCutoff: '2025-01',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.10, output: 0.40 },
                rateLimits: {
                    requestsPerMinute: 4000, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 15, requestsPerDay: 500 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            },
            {
                id: 'gemini-2.0-flash',
                name: 'Gemini 2.0 Flash',
                developer: 'Google',
                provider: 'Google',
                description: 'Excellent for multimodal understanding, realtime streaming, and native tool use.',
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 1000000, // 1M tokens
                maxOutputTokens: 8192,
                knowledgeCutoff: '2024-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.10, output: 0.40 },
                rateLimits: {
                    requestsPerMinute: 2000, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 15, requestsPerDay: 1500 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            },
            {
                id: 'gemini-2.0-flash-lite',
                name: 'Gemini 2.0 Flash-Lite',
                developer: 'Google',
                provider: 'Google',
                description: 'Optimized for long context, realtime streaming, and native tool use at a lower cost.',
                modality: ['multimodal'],
                parameters: 'Unknown',
                contextWindow: 1000000, // 1M tokens
                maxOutputTokens: 8192,
                knowledgeCutoff: '2024-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.075, output: 0.30 },
                rateLimits: {
                    requestsPerMinute: 4000, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 30, requestsPerDay: 1500 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            },
            {
                id: 'gemma-3-27b-it',
                name: 'Gemma 3 27B',
                developer: 'Google',
                provider: 'Google',
                description: 'Free-to-use multimodal model for visual/text processing, translation, and summarization.',
                modality: ['multimodal'],
                parameters: '27B',
                contextWindow: 98304,
                maxOutputTokens: 16384,
                knowledgeCutoff: '2024-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.00, output: 0.00 },
                rateLimits: {
                    requestsPerMinute: null, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 30, requestsPerDay: 14400 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            },
            {
                id: 'gemma-3-12b-it',
                name: 'Gemma 3 12B',
                developer: 'Google',
                provider: 'Google',
                description: 'Free-to-use multimodal model for visual/text processing, translation, and summarization.',
                modality: ['multimodal'],
                parameters: '12B',
                contextWindow: 98304,
                maxOutputTokens: 16384,
                knowledgeCutoff: '2024-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.00, output: 0.00 },
                rateLimits: {
                    requestsPerMinute: null, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 30, requestsPerDay: 14400 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            },
            {
                id: 'gemma-3n-e4b-it',
                name: 'Gemma 3n E4B',
                developer: 'Google',
                provider: 'Google',
                description: 'Free-to-use, low-latency model for data transformation, translation, and summarization.',
                modality: ['multimodal'],
                parameters: '4B',
                contextWindow: 32768, // A reasonable estimate, though not specified
                maxOutputTokens: 8192,
                knowledgeCutoff: '2024-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.00, output: 0.00 },
                rateLimits: {
                    requestsPerMinute: null, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 30, requestsPerDay: 14400 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            },
            {
                id: 'gemma-3n-e2b-it',
                name: 'Gemma 3n E2B',
                developer: 'Google',
                provider: 'Google',
                description: 'Free-to-use, low-latency model for data transformation, translation, and summarization.',
                modality: ['multimodal'],
                parameters: '2B',
                contextWindow: 32768, // A reasonable estimate, though not specified
                maxOutputTokens: 8192,
                knowledgeCutoff: '2024-08',
                pricing: { currency: 'USD', unit: 'per_1m_tokens', input: 0.00, output: 0.00 },
                rateLimits: {
                    requestsPerMinute: null, tokensPerMinute: null, requestsPerDay: null, tokensPerDay: null,
                    tiers: [{ name: 'Free Tier', requestsPerMinute: 30, requestsPerDay: 14400 }]
                },
                features: { vision: true, toolUse: true, jsonMode: true, extendedThinking: false, multilingual: true },
            },
        ]
    },
};

const aiImageProviders = {
    google: {
        provider: 'Google',
        models: [
            { id: 'gemini-2.0-flash-exp-image-generation', name: 'Gemini 2.0 Flash Image Generation', developer: 'Google' },
            { id: 'imagen-3.0-generate-002', name: 'Imagen 3.0', developer: 'Google' },
        ],
        aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"]
    },
    openai: {
        provider: 'OpenAI',
        models: [
            { id: 'dall-e-3', name: 'DALL-E 3', developer: 'OpenAI' }
        ],
        aspectRatios: ["1024x1024", "1792x1024", "1024x1792"]
    }
};

const aiAudioProviders = {
    openai: {
        provider: 'OpenAI',
        models: [
            {
                id: 'gpt-4o-audio-preview-2025-06-03',
                name: 'GPT-4o Audio Preview',
                developer: 'OpenAI',
                description: "GPT-4o model capable of audio inputs and outputs.",
                modality: ['audio', 'text'],
                pricing: {
                    currency: 'USD',
                    unit: 'per_1m_tokens',
                    input: 2.50, // For text input
                    output: 10.00, // For text output
                    tiers: [{ name: 'audio_input', input: 15.00, output: null, notes: "Per million tokens of audio input (approx $0.0025/min)." }]
                },
                rateLimits: { requestsPerMinute: 3000, tokensPerMinute: 250000, requestsPerDay: null, tokensPerDay: null, notes: null }
            },
        ]
    },
    mistral: {
        provider: 'Mistral AI',
        models: [
            {
                id: 'voxtral-mini-latest-transcribe',
                name: 'Voxtral Mini Transcribe',
                developer: 'Mistral AI',
                description: "State-of-the-art model fine-tuned and optimized for transcription purposes only.",
                modality: ['audio-to-text'],
                endpoint: "/v1/audio/transcriptions",
                pricing: { currency: 'USD', unit: 'per_minute', input: 0.002, output: null, tiers: null }
            },
            {
                id: 'voxtral-small-latest',
                name: 'Voxtral Small',
                developer: 'Mistral AI',
                description: "High-performance speech and audio understanding for instruct/chat use cases.",
                modality: ['audio', 'text'],
                contextWindow: 32000,
                endpoint: "/v1/chat/completions",
                pricing: {
                    currency: 'USD',
                    unit: null, // Mixed units
                    input: null,
                    output: null,
                    tiers: [
                        { name: 'audio_input', input: 0.004, output: null, notes: 'Price per minute of audio input.' },
                        { name: 'text_input', input: 0.10, output: null, notes: 'Price per 1M text tokens.' },
                        { name: 'text_output', input: null, output: 0.30, notes: 'Price per 1M text tokens.' },
                    ]
                }
            }
        ]
    }
};

const createOpenAICompatibleHandler = (apiKeyEnvVar, endpointUrl, extraHeaders = {}) => ({
    apiKeyEnvVar,
    text: {
        buildRequest: (modelConfig, apiKey, prompt, isCheck) => {
            const body = {
                model: modelConfig.id,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: isCheck ? 10 : (modelConfig.maxOutputTokens || 4096),
                temperature: isCheck ? 0.1 : 0.7,
            };
            return {
                url: endpointUrl,
                options: {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        ...extraHeaders
                    },
                    body: JSON.stringify(body)
                }
            };
        },
        parseResponse: (data) => data?.choices?.[0]?.message?.content,
    }
});

const apiProviderHandlers = {
    google: {
        apiKeyEnvVar: 'GOOGLE_API_KEY',
        text: {
            buildRequest: (modelConfig, apiKey, prompt, isCheck) => {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${apiKey}`;
                const body = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: isCheck ? 0.1 : 0.7,
                        maxOutputTokens: isCheck ? 10 : (modelConfig.maxOutputTokens || 8192),
                    }
                };
                return { url: endpoint, options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } };
            },
            parseResponse: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text,
        },
        image: {
            buildRequest: (modelConfig, apiKey, payload) => {
                const { prompt, numImages, aspectRatio } = payload;
                if (modelConfig.id.includes('imagen')) {
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateImage?key=${apiKey}`;
                    const body = { prompt, ...(numImages && { number_of_images: numImages }), ...(aspectRatio && { aspect_ratio: aspectRatio }) };
                    return { url: endpoint, options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } };
                }
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${apiKey}`;
                const body = { contents: [{ parts: [{ text: `Generate an image of: ${prompt}` }] }], generationConfig: { responseMimeType: "image/png" } };
                return { url: endpoint, options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } };
            },
            parseResponse: (data, modelConfig) => {
                 if (modelConfig.id.includes('imagen')) return data?.generatedImages?.[0]?.image?.imageBytes;
                 return data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            },
        }
    },
    anthropic: {
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        text: {
            buildRequest: (modelConfig, apiKey, prompt, isCheck) => {
                const body = {
                    model: modelConfig.id,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: isCheck ? 5 : (modelConfig.maxOutputTokens || 4096),
                };
                return {
                    url: `https://api.anthropic.com/v1/messages`,
                    options: { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) }
                };
            },
            parseResponse: (data) => data?.content?.[0]?.text,
        }
    },
    openai: {
        ...createOpenAICompatibleHandler('OPENAI_API_KEY', 'https://api.openai.com/v1/chat/completions'),
        image: {
             apiKeyEnvVar: 'OPENAI_API_KEY',
             buildRequest: (modelConfig, apiKey, payload) => {
                const { prompt, numImages, aspectRatio } = payload;
                const body = {
                    model: modelConfig.id,
                    prompt: prompt,
                    n: numImages || 1,
                    size: aspectRatio || "1024x1024",
                    response_format: "b64_json",
                };
                return {
                    url: `https://api.openai.com/v1/images/generations`,
                    options: { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify(body) }
                };
            },
            parseResponse: (data) => data?.data?.[0]?.b64_json,
        }
    },
    openrouter: createOpenAICompatibleHandler(
        'OPENROUTER_API_KEY',
        'https://openrouter.ai/api/v1/chat/completions',
        {
            'HTTP-Referer': 'https://tools.codev.id',
            'X-Title': 'Codev AI Tool'
        }
    ),
    mistral: createOpenAICompatibleHandler('MISTRAL_API_KEY', 'https://api.mistral.ai/v1/chat/completions'),
    groq: createOpenAICompatibleHandler('GROQ_API_KEY', 'https://api.groq.com/openai/v1/chat/completions'),
    deepseek: createOpenAICompatibleHandler('DEEPSEEK_API_KEY', 'https://api.deepseek.com/v1/chat/completions'),
    xai: createOpenAICompatibleHandler('XAI_API_KEY', 'https://api.x.ai/v1/chat/completions'),
    huggingface: createOpenAICompatibleHandler(
        'HF_API_KEY',
        'https://api-inference.huggingface.co/v1/chat/completions'
    ),
};

// --- Constants ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 10000;

// --- Helper Functions ---
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function findModelConfig(providerKey, modelId, modality) {
    const providers = modality === 'image' ? aiImageProviders : aiTextProviders;
    const providerData = providers[providerKey];
    if (!providerData) return null;

    if (Array.isArray(providerData.models) && typeof providerData.models[0] === 'string') {
        const found = providerData.models.find(id => id === modelId);
        return found ? { id: found, provider: providerKey } : null;
    }
    
    return providerData.models.find(m => m.id === modelId) || null;
}

async function fetchWithRetry(url, options, retryCount = 0) {
    try {
        const response = await fetch(url, options);
        if ([429, 500, 502, 503, 504].includes(response.status) && retryCount < MAX_RETRIES) {
            const delayTime = response.status === 429 ? RATE_LIMIT_DELAY_MS : INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url.split('?')[0]} failed (${response.status}). Retrying in ${delayTime}ms...`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url.split('?')[0]} failed with network error. Retrying in ${delayTime}ms...`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        console.error(`Request failed after ${MAX_RETRIES} retries: ${error.message}`);
        throw error;
    }
}

// --- Main Request Handler ---
export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
        return new Response(`Method Not Allowed`, { status: 405 });
    }

    let requestData;
    try {
        requestData = await request.json();
    } catch (error) {
        return jsonResponse({ success: false, error: 'Invalid JSON.' }, 400);
    }

    const { action, providerKey, model, prompt, ...otherParams } = requestData;

    if (action === 'get_all_providers') {
        // This new action returns all the configuration data to the frontend
        console.log("Action: get_all_providers. Returning full provider configuration.");
        return jsonResponse({
            success: true,
            textProviders: aiTextProviders,
            imageProviders: aiImageProviders,
            // You can add audioProviders etc. here in the future
        });
    }

    if (!action) {
        return jsonResponse({ success: false, error: 'Missing action.' }, 400);
    }

    function parseSitemapXml(xmlString) {
        const urls = [];
        const locRegex = /<loc>(.*?)<\/loc>/g;
        let match;
        while ((match = locRegex.exec(xmlString)) !== null) {
            const url = match[1]
                .replace(/&/g, '&')
                .replace(/</g, '<')
                .replace(/>/g, '>')
                .replace(/"/g, '"')
                .replace(/'/g, "'")
                .trim();
            urls.push(url);
        }
        return urls;
    }

    if (action === 'fetch_sitemap') {
        const { sitemapUrl } = requestData;
        if (!sitemapUrl) {
            return jsonResponse({ success: false, error: 'Missing sitemapUrl' }, 400);
        }
        try {
            console.log(`Fetching sitemap: ${sitemapUrl}`);
            const response = await fetchWithRetry(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0; +http://www.google.com/bot.html)' } });

            if (!response.ok) {
                throw new Error(`Fetch failed with status ${response.status}: ${response.statusText}`);
            }

            const xmlText = await response.text();
            const allUrls = parseSitemapXml(xmlText);

            const finalUrls = allUrls.filter(url => !url.endsWith('.xml'));
            const sitemapIndexUrls = allUrls.filter(url => url.endsWith('.xml'));

            for (const indexUrl of sitemapIndexUrls.slice(0, 5)) {
                try {
                    console.log(`Fetching nested sitemap index: ${indexUrl}`);
                    const indexResponse = await fetchWithRetry(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} });
                    if (indexResponse.ok) {
                        const indexXmlText = await indexResponse.text();
                        finalUrls.push(...parseSitemapXml(indexXmlText).filter(url => !url.endsWith('.xml')));
                    }
                } catch (indexError) {
                    console.warn(`Failed to parse nested sitemap index ${indexUrl}: ${indexError.message}`);
                }
            }

            console.log(`Successfully parsed ${finalUrls.length} page URLs from ${sitemapUrl}`);
            return jsonResponse({ success: true, urls: finalUrls });

        } catch (error) {
            console.error(`Sitemap fetch/parse error: ${error.message}`);
            return jsonResponse({ success: false, error: `Sitemap error: ${error.message}` }, 500);
        }
    }

    if (action === 'upload_image') {
        const { owner, repo, path, content, message } = otherParams;
        if (!owner || !repo || !path || !content || !message) {
            return jsonResponse({ success: false, error: 'Missing required parameters for GitHub upload (owner, repo, path, content, message).' }, 400);
        }

        const githubToken = env.GITHUB_PAT_API_KEY;
        if (!githubToken) {
            console.error('GitHub PAT Error: GITHUB_PAT_API_KEY environment variable is not set.');
            return jsonResponse({ success: false, error: 'GitHub upload is not configured on the server.' }, 500);
        }

        const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        console.log(`Uploading image to GitHub repository: ${githubApiUrl}`);

        try {
            const response = await fetchWithRetry(githubApiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'User-Agent': 'Cloudflare-Worker-AI-Tool/1.0'
                },
                body: JSON.stringify({
                    message: message,
                    content: content,
                    committer: {
                        name: 'AI Content Worker',
                        email: 'worker@your-domain.com'
                    }
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.message || JSON.stringify(responseData);
                console.error(`GitHub Upload Error (${response.status}):`, errorMsg);
                throw new Error(`GitHub API Error (${response.status}): ${errorMsg}`);
            }

            const downloadUrl = responseData.content?.download_url;

            if (!downloadUrl) {
                console.warn('GitHub API response did not contain a download_url:', responseData);
                throw new Error('Could not determine the public image URL after a successful upload.');
            }

            console.log(`GitHub Upload Successful. Public URL: ${downloadUrl}`);
            return jsonResponse({ success: true, download_url: downloadUrl });

        } catch (error) {
            console.error(`GitHub Upload Action Failed: ${error.message}`);
            return jsonResponse({ success: false, error: `GitHub upload failed: ${error.message}` }, 500);
        }
    }

    if (['generate', 'check_status', 'generate_image'].includes(action)) {
        const modality = action === 'generate_image' ? 'image' : 'text';
        
        if (!providerKey || !model) {
            return jsonResponse({ success: false, error: `Missing providerKey or model for ${action}.` }, 400);
        }

        const modelConfig = findModelConfig(providerKey, model, modality);
        if (!modelConfig) {
            return jsonResponse({ success: false, error: `Model '${model}' not found for provider '${providerKey}'.` }, 404);
        }

        const handler = apiProviderHandlers[providerKey];
        if (!handler) {
            return jsonResponse({ success: false, error: `API handler not configured for provider: ${providerKey}` }, 500);
        }

        const apiKey = env[handler.apiKeyEnvVar];
        if (!apiKey) {
            console.error(`API Key Env Var ${handler.apiKeyEnvVar} not set.`);
            return jsonResponse({ success: false, error: `API key for ${providerKey} not configured on the server.` }, 500);
        }
        
        const isCheck = action === 'check_status';
        const checkPrompt = "Please respond with 'OK'.";

        try {
            const modalityHandler = handler[modality];
            if (!modalityHandler) return jsonResponse({ success: false, error: `${modality} generation not supported by ${providerKey}.` }, 400);

            const payload = modality === 'image' ? { prompt, ...otherParams } : (isCheck ? checkPrompt : prompt);
            const { url, options } = modalityHandler.buildRequest(modelConfig, apiKey, payload, isCheck);

            console.log(`${isCheck ? 'Checking status' : 'Generating ' + modality} for ${providerKey} (${model})...`);

            const apiResponse = await fetchWithRetry(url, options);
            const responseData = await apiResponse.json();

            if (!apiResponse.ok) {
                const errorDetail = responseData?.error?.message || JSON.stringify(responseData);
                throw new Error(`API Error (${apiResponse.status}): ${errorDetail}`);
            }
            
            if (isCheck) {
                console.log(`API Status OK for ${providerKey}`);
                return jsonResponse({ success: true, status: 'OK' });
            }
            
            const generatedContent = modalityHandler.parseResponse(responseData, modelConfig);

            if (generatedContent === undefined || generatedContent === null) {
                console.warn(`No content found in API response:`, responseData);
                throw new Error('AI returned an empty or unexpected structure.');
            }

            const responseKey = modality === 'image' ? 'imageData' : 'text';
            return jsonResponse({ success: true, [responseKey]: generatedContent });

        } catch (error) {
            console.error(`Action '${action}' Error for ${providerKey}: ${error.message}`);
            return jsonResponse({ success: false, error: `Action failed: ${error.message}` }, 500);
        }
    }

    return jsonResponse({ success: false, error: `Unknown or malformed action: ${action}` }, 400);
}
