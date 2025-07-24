// ai-config.js (Contains AI provider and model data with detailed model attributes)

// --- AI Provider Configurations ---
export const aiTextProviders = {
    // --- OpenRouter with Detailed and Updated Model Info ---
    openrouter: {
        models: [
            // Note: The 'id' is the identifier used in API calls.
            {
                id: 'deepseek/deepseek-r1-0528-qwen3-8b',
                name: 'DeepSeek: Deepseek R1 0528 Qwen3 8B',
                developer: 'DeepSeek',
                context: 131072,
                params: '8B',
                description: `DeepSeek-R1-0528 is a lightly upgraded release of DeepSeek R1 that taps more compute and smarter post-training tricks, pushing its reasoning and inference to the brink of flagship models like O3 and Gemini 2.5 Pro. It now tops math, programming, and logic leaderboards, showcasing a step-change in depth-of-thought. The distilled variant, DeepSeek-R1-0528-Qwen3-8B, transfers this chain-of-thought into an 8 B-parameter form, beating standard Qwen3 8B by +10 pp and tying the 235 B “thinking” giant on AIME 2024.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'meta-llama/llama-3.2-11b-vision-instruct',
                name: 'Meta: Llama 3.2 11B Vision Instruct',
                developer: 'Meta',
                context: 131072,
                params: '11B',
                description: `Llama 3.2 11B Vision is a multimodal model with 11 billion parameters, designed to handle tasks combining visual and textual data. It excels in tasks such as image captioning and visual question answering, bridging the gap between language generation and visual reasoning.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'meta-llama/llama-3.2-3b-instruct',
                name: 'Meta: Llama 3.2 3B Instruct',
                developer: 'Meta',
                context: 131072,
                params: '3B',
                description: `Llama 3.2 3B is a 3-billion-parameter multilingual large language model, optimized for advanced natural language processing tasks like dialogue generation, reasoning, and summarization. Designed with the latest transformer architecture, it supports eight languages.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'moonshotai/kimi-vl-a3b-thinking',
                name: 'Moonshot AI: Kimi VL A3B Thinking',
                developer: 'Moonshot AI',
                context: 131072,
                params: '3B',
                description: `Kimi-VL is a lightweight Mixture-of-Experts vision-language model that activates only 2.8B parameters per step while delivering strong performance on multimodal reasoning and long-context tasks.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen3-4b',
                name: 'Qwen: Qwen3 4B',
                developer: 'Qwen',
                context: 40960,
                params: '4B',
                description: `Qwen3-4B is a 4 billion parameter dense language model from the Qwen3 series, designed to support both general-purpose and reasoning-intensive tasks. It introduces a dual-mode architecture—thinking and non-thinking.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'google/gemini-2.0-flash-experimental',
                name: 'Google: Gemini 2.0 Flash Experimental',
                developer: 'Google',
                context: 1048576,
                params: '4B',
                description: `Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen3-30b-a3b',
                name: 'Qwen: Qwen3 30B A3B',
                developer: 'Qwen',
                context: 40960,
                params: '30B',
                description: `The Qwen3-30B-A3B variant includes 30.5 billion parameters (3.3 billion activated), 48 layers, 128 experts (8 activated per task), and supports up to 131K token contexts with YaRN, setting a new standard among open-source models.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'mistralai/mistral-7b-instruct',
                name: 'Mistral: Mistral 7B Instruct',
                developer: 'Mistral AI',
                context: 32768,
                params: '7.3B',
                description: `A high-performing, industry-standard 7.3B parameter model, with optimizations for speed and context length. Mistral 7B Instruct has multiple version variants, and this is intended to be the latest version.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen3-8b',
                name: 'Qwen: Qwen3 8B',
                developer: 'Qwen',
                context: 40960,
                params: '8.2B',
                description: `Qwen3-8B is a dense 8.2B parameter causal language model from the Qwen3 series, designed for both reasoning-heavy tasks and efficient dialogue. It supports seamless switching between "thinking" mode for math, coding, and logical inference, and "non-thinking" mode for general conversation.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen3-235b-a22b-instruct-2507',
                name: 'Qwen: Qwen3 235B A22B 2507',
                developer: 'Qwen',
                context: 262144,
                params: '235B',
                description: `Qwen3-235B-A22B-Instruct-2507 is a multilingual, instruction-tuned mixture-of-experts language model based on the Qwen3-235B architecture, with 22B active parameters per forward pass. It is optimized for general-purpose text generation, including instruction following, logical reasoning, math, code, and tool usage.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'sarvamai/sarvam-m',
                name: 'Sarvam AI: Sarvam-M',
                developer: 'Sarvam AI',
                context: 32768,
                params: '24B',
                description: `Sarvam-M is a 24 B-parameter, instruction-tuned derivative of Mistral-Small-3.1-24B-Base-2503, post-trained on English plus eleven major Indic languages. The model introduces a dual-mode interface: “non-think” for low-latency chat and an optional “think” phase for more demanding reasoning.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'microsoft/mai-ds-r1',
                name: 'Microsoft: MAI DS R1',
                developer: 'Microsoft',
                context: 163840,
                params: 'Unknown',
                description: `MAI-DS-R1 is a post-trained variant of DeepSeek-R1 developed by the Microsoft AI team to improve the model’s responsiveness on previously blocked topics while enhancing its safety profile.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'tngtech/deepseek-r1t-chimera',
                name: 'TNG: DeepSeek R1T Chimera',
                developer: 'TNG',
                context: 163840,
                params: 'MoE',
                description: `DeepSeek-R1T-Chimera is created by merging DeepSeek-R1 and DeepSeek-V3 (0324), combining the reasoning capabilities of R1 with the token efficiency improvements of V3.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'agentica/deepcoder-14b-preview',
                name: 'Agentica: Deepcoder 14B Preview',
                developer: 'Agentica',
                context: 98304,
                params: '14B',
                description: `DeepCoder-14B-Preview is a 14B parameter code generation model fine-tuned from DeepSeek-R1-Distill-Qwen-14B using reinforcement learning with GRPO+ and iterative context lengthening.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'moonshotai/kimi-dev-72b',
                name: 'Moonshot AI: Kimi Dev 72b',
                developer: 'Moonshot AI',
                context: 131072,
                params: '72B',
                description: `Kimi-Dev-72B is an open-source large language model fine-tuned for software engineering and issue resolution tasks. Based on Qwen2.5-72B, it is optimized using large-scale reinforcement learning.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'mistralai/devstral-small-2505',
                name: 'Mistral: Devstral Small 2505',
                developer: 'Mistral AI',
                context: 32768,
                params: '24B',
                description: `Devstral-Small-2505 is a 24B parameter agentic LLM fine-tuned from Mistral-Small-3.1, jointly developed by Mistral AI and All Hands AI for advanced software engineering tasks.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'tencent/hunyuan-a13b-instruct',
                name: 'Tencent: Hunyuan A13B Instruct',
                developer: 'Tencent',
                context: 32768,
                params: '13B',
                description: `Hunyuan-A13B is a 13B active parameter Mixture-of-Experts (MoE) language model developed by Tencent, with a total parameter count of 80B and support for reasoning via Chain-of-Thought.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'moonshotai/kimi-k2-instruct',
                name: 'MoonshotAI: Kimi K2',
                developer: 'Moonshot AI',
                context: 65536,
                params: '1T',
                description: `Kimi K2 Instruct is a large-scale Mixture-of-Experts (MoE) language model developed by Moonshot AI, featuring 1 trillion total parameters with 32 billion active per forward pass.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'mistralai/mistral-small-3.2-24b-instruct-2506',
                name: 'Mistral: Mistral Small 3.2 24B',
                developer: 'Mistral AI',
                context: 98304,
                params: '24B',
                description: `Mistral-Small-3.2-24B-Instruct-2506 is an updated 24B parameter model from Mistral optimized for instruction following, repetition reduction, and improved function calling.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen3-14b',
                name: 'Qwen: Qwen3 14B',
                developer: 'Qwen',
                context: 40960,
                params: '14.8B',
                description: `Qwen3-14B is a dense 14.8B parameter causal language model from the Qwen3 series, designed for both complex reasoning and efficient dialogue.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b',
                name: 'Cognitive Computations: Dolphin3.0 R1 Mistral 24B',
                developer: 'Cognitive Computations',
                context: 32768,
                params: '24B',
                description: `Dolphin 3.0 R1 is the next generation of the Dolphin series of instruct-tuned models. Designed to be the ultimate general purpose local model, enabling coding, math, agentic, function calling, and general use cases.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'meta-llama/llama-3.3-70b-instruct',
                name: 'Meta: Llama 3.3 70B Instruct',
                developer: 'Meta',
                context: 65536,
                params: '70B',
                description: `The Meta Llama 3.3 multilingual large language model (LLM) is a pretrained and instruction tuned generative model in 70B (text in/text out). Optimized for multilingual dialogue use cases.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'deepseek/deepseek-r1',
                name: 'DeepSeek: R1',
                developer: 'DeepSeek',
                context: 163840,
                params: '671B',
                description: `DeepSeek R1 is here: Performance on par with OpenAI o1, but open-sourced and with fully open reasoning tokens. It's 671B parameters in size, with 37B active in an inference pass.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'mistralai/mistral-nemo',
                name: 'Mistral: Mistral Nemo',
                developer: 'Mistral AI',
                context: 131072,
                params: '12B',
                description: `A 12B parameter model with a 128k token context length built by Mistral in collaboration with NVIDIA. The model is multilingual and supports function calling.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen2.5-72b-instruct',
                name: 'Qwen: Qwen2.5 72B Instruct',
                developer: 'Qwen',
                context: 32768,
                params: '72B',
                description: `Qwen2.5 72B is the latest series of Qwen large language models. Qwen2.5 brings significant improvements in instruction following, generating long texts, understanding structured data, and is more resilient to the diversity of system prompts.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'mistralai/mistral-small-3',
                name: 'Mistral: Mistral Small 3',
                developer: 'Mistral AI',
                context: 32768,
                params: '24B',
                description: `Mistral Small 3 is a 24B-parameter language model optimized for low-latency performance across common AI tasks. Released under the Apache 2.0 license, it features both pre-trained and instruction-tuned versions.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'google/gemma-3-12b-it',
                name: 'Google: Gemma 3 12B',
                developer: 'Google',
                context: 98304,
                params: '12B',
                description: `Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'deepseek/deepseek-r1-0528',
                name: 'DeepSeek: R1 0528',
                developer: 'DeepSeek',
                context: 163840,
                params: '671B',
                description: `May 28th update to the original DeepSeek R1. Performance on par with OpenAI o1, but open-sourced and with fully open reasoning tokens. It's 671B parameters in size, with 37B active in an inference pass.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'deepseek/deepseek-r1-distill-llama-70b',
                name: 'DeepSeek: R1 Distill Llama 70B',
                developer: 'DeepSeek',
                context: 8192,
                params: '70B',
                description: `DeepSeek R1 Distill Llama 70B is a distilled large language model based on Llama-3.3-70B-Instruct, using outputs from DeepSeek R1.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'mistralai/mistral-small-3.1-24b-instruct',
                name: 'Mistral: Mistral Small 3.1 24B',
                developer: 'Mistral AI',
                context: 131072,
                params: '24B',
                description: `Mistral Small 3.1 24B Instruct is an upgraded variant of Mistral Small 3, featuring 24 billion parameters with advanced multimodal capabilities. It provides state-of-the-art performance in text-based reasoning and vision tasks.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'cognitivecomputations/dolphin3.0-mistral-24b',
                name: 'Cognitive Computations: Dolphin3.0 Mistral 24B',
                developer: 'Cognitive Computations',
                context: 32768,
                params: '24B',
                description: `Dolphin 3.0 is the next generation of the Dolphin series of instruct-tuned models. Designed to be the ultimate general purpose local model, enabling coding, math, agentic, function calling, and general use cases.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'thudm/glm-z1-32b',
                name: 'THUDM: GLM Z1 32B',
                developer: 'THUDM',
                context: 32768,
                params: '32B',
                description: `GLM-Z1-32B-0414 is an enhanced reasoning variant of GLM-4-32B, built for deep mathematical, logical, and code-oriented problem solving.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen3-235b-a22b',
                name: 'Qwen: Qwen3 235B A22B',
                developer: 'Qwen',
                context: 131072,
                params: '235B',
                description: `Qwen3-235B-A22B is a 235B parameter mixture-of-experts (MoE) model developed by Qwen, activating 22B parameters per forward pass. It supports seamless switching between a "thinking" mode for complex reasoning and a "non-thinking" mode for general conversational efficiency.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'google/gemma-3n-4b-it',
                name: 'Google: Gemma 3n 4B',
                developer: 'Google',
                context: 8192,
                params: '4B',
                description: `Gemma 3n E4B-it is optimized for efficient execution on mobile and low-resource devices, such as phones, laptops, and tablets. It supports multimodal inputs—including text, visual data, and audio.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'tngtech/deepseek-tng-r1t2-chimera',
                name: 'TNG: DeepSeek R1T2 Chimera',
                developer: 'TNG',
                context: 163840,
                params: '671B',
                description: `DeepSeek-TNG-R1T2-Chimera is the second-generation Chimera model from TNG Tech. It is a 671 B-parameter mixture-of-experts text-generation model assembled from DeepSeek-AI’s R1-0528, R1, and V3-0324 checkpoints.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'google/gemma-3n-2b-it',
                name: 'Google: Gemma 3n 2B',
                developer: 'Google',
                context: 8192,
                params: '2B',
                description: `Gemma 3n E2B IT is a multimodal, instruction-tuned model developed by Google DeepMind, designed to operate efficiently at an effective parameter size of 2B while leveraging a 6B architecture.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen3-coder-480b-a35b-instruct',
                name: 'Qwen: Qwen3 Coder',
                developer: 'Qwen',
                context: 262144,
                params: '480B',
                description: `Qwen3-Coder-480B-A35B-Instruct is a Mixture-of-Experts (MoE) code generation model developed by the Qwen team. It is optimized for agentic coding tasks such as function calling, tool use, and long-context reasoning over repositories.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'cognitivecomputations/venice-uncensored',
                name: 'Venice: Uncensored',
                developer: 'Cognitive Computations',
                context: 32768,
                params: '24B',
                description: `Venice Uncensored Dolphin Mistral 24B Venice Edition is a fine-tuned variant of Mistral-Small-24B-Instruct-2501, designed as an “uncensored” instruct-tuned LLM, preserving user control over alignment, system prompts, and behavior.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen2.5-vl-32b-instruct',
                name: 'Qwen: Qwen2.5 VL 32B Instruct',
                developer: 'Qwen',
                context: 8192,
                params: '32B',
                description: `Qwen2.5-VL-32B is a multimodal vision-language model fine-tuned through reinforcement learning for enhanced mathematical reasoning, structured outputs, and visual problem-solving capabilities.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen2.5-coder-32b-instruct',
                name: 'Qwen: Qwen2.5 Coder 32B Instruct',
                developer: 'Qwen',
                context: 32768,
                params: '32B',
                description: `Qwen2.5-Coder is the latest series of Code-Specific Qwen large language models. Qwen2.5-Coder brings significant improvements in code generation, code reasoning and code fixing.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwen2.5-vl-72b-instruct',
                name: 'Qwen: Qwen2.5 VL 72B Instruct',
                developer: 'Qwen',
                context: 32768,
                params: '72B',
                description: `Qwen2.5-VL is proficient in recognizing common objects such as flowers, birds, fish, and insects. It is also highly capable of analyzing texts, charts, icons, graphics, and layouts within images.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'arliai/qwq-32b-rpr-v1',
                name: 'ArliAI: QwQ 32B RpR v1',
                developer: 'ArliAI',
                context: 32768,
                params: '32B',
                description: `QwQ-32B-ArliAI-RpR-v1 is a 32B parameter model fine-tuned from Qwen/QwQ-32B using a curated creative writing and roleplay dataset.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'qwen/qwq-32b',
                name: 'Qwen: QwQ 32B',
                developer: 'Qwen',
                context: 32768,
                params: '32B',
                description: `QwQ is the reasoning model of the Qwen series. Compared with conventional instruction-tuned models, QwQ, which is capable of thinking and reasoning, can achieve significantly enhanced performance in downstream tasks.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'google/gemma-2-9b-it',
                name: 'Google: Gemma 2 9B',
                developer: 'Google',
                context: 8192,
                params: '9B',
                description: `Gemma 2 9B by Google is an advanced, open-source language model that sets a new standard for efficiency and performance in its size class.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'shisa-ai/shisa-v2-llama-3.3-70b',
                name: 'Shisa AI: Shisa V2 Llama 3.3 70B',
                developer: 'Shisa AI',
                context: 32768,
                params: '70B',
                description: `Shisa V2 Llama 3.3 70B is a bilingual Japanese-English chat model fine-tuned by Shisa.AI on Meta’s Llama-3.3-70B-Instruct base.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'meta-llama/llama-3.1-405b-instruct',
                name: 'Meta: Llama 3.1 405B Instruct',
                developer: 'Meta',
                context: 65536,
                params: '405B',
                description: `The highly anticipated 400B class of Llama3 is here! This 405B instruct-tuned version is optimized for high quality dialogue usecases.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'deepseek/deepseek-v3-0324',
                name: 'DeepSeek: DeepSeek V3 0324',
                developer: 'DeepSeek',
                context: 32768,
                params: '685B',
                description: `DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'google/gemma-3-27b-it',
                name: 'Google: Gemma 3 27B',
                developer: 'Google',
                context: 98304,
                params: '27B',
                description: `Gemma 3 introduces multimodality, supporting vision-language input and text outputs. Gemma 3 27B is Google's latest open source model, successor to Gemma 2.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'thudm/glm-4-32b',
                name: 'THUDM: GLM 4 32B',
                developer: 'THUDM',
                context: 32768,
                params: '32B',
                description: `GLM-4-32B-0414 is a 32B bilingual (Chinese-English) open-weight language model optimized for code generation, function calling, and agent-style tasks.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'featherless/qwerky-72b',
                name: 'Featherless: Qwerky 72B',
                developer: 'Featherless',
                context: 32768,
                params: '72B',
                description: `Qwerky-72B is a linear-attention RWKV variant of the Qwen 2.5 72B model, optimized to significantly reduce computational cost at scale.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
                name: 'NVIDIA: Llama 3.1 Nemotron Ultra 253B v1',
                developer: 'NVIDIA',
                context: 131072,
                params: '253B',
                description: `Llama-3.1-Nemotron-Ultra-253B-v1 is a large language model (LLM) optimized for advanced reasoning, human-interactive chat, retrieval-augmented generation (RAG), and tool-calling tasks.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'google/gemma-3-4b-it',
                name: 'Google: Gemma 3 4B',
                developer: 'Google',
                context: 32768,
                params: '4B',
                description: `Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'rekaai/reka-flash-3',
                name: 'Reka: Flash 3',
                developer: 'Reka',
                context: 32768,
                params: '21B',
                description: `Reka Flash 3 is a general-purpose, instruction-tuned large language model with 21 billion parameters, developed by Reka. It excels at general chat, coding tasks, instruction-following, and function calling.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'deepseek/deepseek-r1-distill-qwen-14b',
                name: 'DeepSeek: R1 Distill Qwen 14B',
                developer: 'DeepSeek',
                context: 65536,
                params: '14B',
                description: `DeepSeek R1 Distill Qwen 14B is a distilled large language model based on Qwen 2.5 14B, using outputs from DeepSeek R1. It outperforms OpenAI's o1-mini across various benchmarks.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            },
            {
                id: 'nousresearch/deephermes-3-llama-3-8b-preview',
                name: 'Nous: DeepHermes 3 Llama 3 8B Preview',
                developer: 'Nous Research',
                context: 131072,
                params: '8B',
                description: `DeepHermes 3 Preview is the latest version of our flagship Hermes series of LLMs by Nous Research, and one of the first models in the world to unify Reasoning (long chains of thought) and normal LLM response modes into one model.`,
                input_cost_per_mtok: 0,
                output_cost_per_mtok: 0
            }
        ]
    },

    // --- Other providers (can be updated to the new detailed format later) ---
    google: {
        models: [
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                developer: 'Google',
                description: "Best for coding, reasoning, and multimodal understanding. Use to reason over complex problems, tackle difficult code, math and STEM problems, or analyze large datasets, codebases or documents.",
                knowledge_cutoff: 'Jan 2025',
                pricing: {
                    // Per 1M tokens
                    input: { low_context: 1.25, high_context: 2.50 },
                    output: { low_context: 10.00, high_context: 15.00 }
                },
                rate_limits: {
                    paid: '150 RPM'
                    // Free tier details not specified in provided text
                }
            },
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                developer: 'Google',
                description: "Best for large scale processing (e.g. multiple PDFs), low latency/high volume tasks which require thinking, and agentic use cases. Use to reason over complex problems, show the thinking process, and call tools natively.",
                knowledge_cutoff: 'Jan 2025',
                pricing: {
                    // Per 1M tokens
                    input: 0.30,
                    output: 2.50
                },
                rate_limits: {
                    paid: '1000 RPM',
                    free: '10 RPM, 500 req/day'
                }
            },
            {
                id: 'gemini-2.5-flash-lite-preview-06-17',
                name: 'Gemini 2.5 Flash-Lite Preview 06-17',
                developer: 'Google',
                description: "Best for large scale processing, low latency/high volume tasks, and lower cost. Use for data transformation, translation, and summarization.",
                knowledge_cutoff: 'Jan 2025',
                pricing: {
                    // Per 1M tokens
                    input: 0.10,
                    output: 0.40
                },
                rate_limits: {
                    paid: '4000 RPM',
                    free: '15 RPM, 500 req/day'
                }
            },
            {
                id: 'gemini-2.0-flash',
                name: 'Gemini 2.0 Flash',
                developer: 'Google',
                description: "Best for multimodal understanding, realtime streaming, and native tool use. Use to process 10,000 lines of code, call tools natively (like Search), and stream images/video in realtime. Alias for gemini-2.0-flash-001.",
                knowledge_cutoff: 'Aug 2024',
                pricing: {
                    // Per 1M tokens
                    input: 0.10,
                    output: 0.40
                },
                rate_limits: {
                    paid: '2000 RPM',
                    free: '15 RPM, 1500 req/day'
                }
            },
            {
                id: 'gemini-2.0-flash-lite',
                name: 'Gemini 2.0 Flash-Lite',
                developer: 'Google',
                description: "Best for long context, realtime streaming, and native tool use. Use to process 10,000 lines of code and call tools natively. Alias for gemini-2.0-flash-lite-001.",
                knowledge_cutoff: 'Aug 2024',
                pricing: {
                    // Per 1M tokens
                    input: 0.075,
                    output: 0.30
                },
                rate_limits: {
                    paid: '4000 RPM',
                    free: '30 RPM, 1500 req/day'
                }
            },
            {
                id: 'gemma-3n-e2b-it',
                name: 'Gemma 3n E2B',
                developer: 'Google',
                description: "Best for low latency, multilingual tasks, and summarization. Use for data transformation, text translation, and summarizing research content.",
                knowledge_cutoff: 'Aug 2024',
                pricing: { input: 0.00, output: 0.00 },
                rate_limits: {
                    free: '30 RPM, 14400 req/day'
                }
            },
            {
                id: 'gemma-3n-e4b-it',
                name: 'Gemma 3n E4B',
                developer: 'Google',
                description: "Best for low latency, multilingual tasks, and summarization. Use for data transformation, text translation, and summarizing research content.",
                knowledge_cutoff: 'Aug 2024',
                pricing: { input: 0.00, output: 0.00 },
                rate_limits: {
                    free: '30 RPM, 14400 req/day'
                }
            },
            {
                id: 'gemma-3-4b-it',
                name: 'Gemma 3 4B',
                developer: 'Google',
                description: "Best for multimodal, multilingual, and low latency tasks. Use for visual and text processing, text translation, and summarizing text research content.",
                knowledge_cutoff: 'Aug 2024',
                pricing: { input: 0.00, output: 0.00 },
                rate_limits: {
                    free: '30 RPM, 14400 req/day'
                }
            },
            {
                id: 'gemma-3-12b-it',
                name: 'Gemma 3 12B',
                developer: 'Google',
                description: "Best for multimodal, multilingual, and summarization tasks. Use for visual and text processing, text translation, and summarizing text research content.",
                knowledge_cutoff: 'Aug 2024',
                pricing: { input: 0.00, output: 0.00 },
                rate_limits: {
                    free: '30 RPM, 14400 req/day'
                }
            },
            {
                id: 'gemma-3-27b-it',
                name: 'Gemma 3 27B',
                developer: 'Google',
                description: "Best for multimodal, multilingual, and summarization tasks. Use for visual and text processing, text translation, and summarizing image and text content.",
                knowledge_cutoff: 'Aug 2024',
                pricing: { input: 0.00, output: 0.00 },
                rate_limits: {
                    free: '30 RPM, 14400 req/day'
                }
            }
        ]
    },
    openai: {
        models: [
            {
                id: 'gpt-4.1-2025-04-14',
                name: 'GPT-4.1',
                developer: 'OpenAI',
                description: "Flagship GPT model for complex tasks.",
                pricing: { // Per 1M tokens
                    input: 2.00,
                    input_alt: 0.50,
                    output: 8.00
                },
                rate_limits: {
                    standard: '2,000,000 TPM, 10,000 RPM, 200,000,000 TPD',
                    long_context: '5,000,000 TPM, 1,000 RPM, 100,000,000 TPD'
                }
            },
            {
                id: 'gpt-4.1-mini-2025-04-14',
                name: 'GPT-4.1 mini',
                developer: 'OpenAI',
                description: "Balanced for intelligence, speed, and cost.",
                pricing: { // Per 1M tokens
                    input: 0.40,
                    input_alt: 0.10,
                    output: 1.60
                },
                rate_limits: {
                    standard: '10,000,000 TPM, 10,000 RPM, 1,000,000,000 TPD',
                    long_context: '10,000,000 TPM, 2,000 RPM, 200,000,000 TPD'
                }
            },
            {
                id: 'gpt-4.1-nano-2025-04-14',
                name: 'GPT-4.1 nano',
                developer: 'OpenAI',
                description: "Fastest, most cost-effective GPT-4.1 model.",
                pricing: { // Per 1M tokens
                    input: 0.10,
                    input_alt: 0.025,
                    output: 0.40
                },
                rate_limits: {
                    standard: '10,000,000 TPM, 10,000 RPM, 1,000,000,000 TPD',
                    long_context: '10,000,000 TPM, 2,000 RPM, 200,000,000 TPD'
                }
            },
            {
                id: 'gpt-4o-2024-08-06',
                name: 'GPT-4o',
                developer: 'OpenAI',
                description: "Fast, intelligent, flexible GPT model.",
                pricing: { // Per 1M tokens
                    input: 2.50,
                    input_alt: 1.25,
                    output: 10.00
                },
                rate_limits: {
                    standard: '2,000,000 TPM, 10,000 RPM, 200,000,000 TPD'
                }
            },
            {
                id: 'gpt-4o-audio-preview-2025-06-03',
                name: 'GPT-4o Audio Preview',
                developer: 'OpenAI',
                description: "GPT-4o model capable of audio inputs and outputs.",
                pricing: { // Per 1M tokens
                    input: 2.50,
                    input_alt: null, // No value provided
                    output: 10.00
                },
                rate_limits: {
                    standard: '250,000 TPM, 3,000 RPM'
                }
            },
            {
                id: 'gpt-4o-mini-2024-07-18',
                name: 'GPT-4o mini',
                developer: 'OpenAI',
                description: "Fast, affordable small model for focused tasks.",
                pricing: { // Per 1M tokens
                    input: 0.15,
                    input_alt: 0.075,
                    output: 0.60
                },
                rate_limits: {
                    standard: '10,000,000 TPM, 10,000 RPM, 1,000,000,000 TPD'
                }
            },
            {
                id: 'gpt-4o-mini-audio-preview-2024-12-17',
                name: 'GPT-4o mini Audio Preview',
                developer: 'OpenAI',
                description: "Smaller model capable of audio inputs and outputs.",
                pricing: { // Per 1M tokens
                    input: 0.15,
                    input_alt: null, // No value provided
                    output: 0.60
                },
                rate_limits: {
                    standard: '10,000,000 TPM, 10,000 RPM, 1,000,000,000 TPD'
                }
            },
            {
                id: 'o1-2024-12-17',
                name: 'o1',
                developer: 'OpenAI',
                description: "Previous full o-series reasoning model.",
                pricing: { // Per 1M tokens
                    input: 15.00,
                    input_alt: 7.50,
                    output: 60.00
                },
                rate_limits: {
                    standard: '2,000,000 TPM, 10,000 RPM, 200,000,000 TPD'
                }
            },
            {
                id: 'o1-pro-2025-03-19',
                name: 'o1-pro',
                developer: 'OpenAI',
                description: "Version of o1 with more compute for better responses.",
                pricing: { // Per 1M tokens
                    input: 150.00,
                    input_alt: null, // No value provided
                    output: 600.00
                },
                rate_limits: {
                    standard: '2,000,000 TPM, 10,000 RPM, 200,000,000 TPD'
                }
            },
            {
                id: 'o3-2025-04-16',
                name: 'o3',
                developer: 'OpenAI',
                description: "Our most powerful reasoning model.",
                pricing: { // Per 1M tokens
                    input: 2.00,
                    input_alt: 0.50,
                    output: 8.00
                },
                rate_limits: {
                    standard: '2,000,000 TPM, 10,000 RPM, 200,000,000 TPD'
                }
            },
            {
                id: 'o3-pro-2025-06-10',
                name: 'o3-pro',
                developer: 'OpenAI',
                description: "Version of o3 with more compute for better responses.",
                pricing: { // Per 1M tokens
                    input: 20.00,
                    input_alt: null, // No value provided
                    output: 80.00
                },
                rate_limits: {
                    standard: '2,000,000 TPM, 10,000 RPM, 200,000,000 TPD'
                }
            },
            {
                id: 'o4-mini-2025-04-16',
                name: 'o4-mini',
                developer: 'OpenAI',
                description: "Faster, more affordable reasoning model.",
                pricing: { // Per 1M tokens
                    input: 1.10,
                    input_alt: 0.275,
                    output: 4.40
                },
                rate_limits: {
                    standard: '10,000,000 TPM, 10,000 RPM, 1,000,000,000 TPD'
                }
            },
            {
                id: 'o3-mini-2025-01-31',
                name: 'o3-mini',
                developer: 'OpenAI',
                description: "A small model alternative to o3.",
                pricing: { // Per 1M tokens
                    input: 1.10,
                    input_alt: 0.55,
                    output: 4.40
                },
                rate_limits: {
                    standard: '10,000,000 TPM, 10,000 RPM, 1,000,000,000 TPD'
                }
            },
            {
                id: 'o1-mini-2024-09-12',
                name: 'o1-mini',
                developer: 'OpenAI',
                description: "A small model alternative to o1. Deprecated.",
                pricing: { // Per 1M tokens
                    input: 1.10,
                    input_alt: 0.55,
                    output: 4.40
                },
                rate_limits: {
                    standard: '10,000,000 TPM, 10,000 RPM, 1,000,000,000 TPD'
                }
            }
        ]
    },
    anthropic: {
        models: [
            {
                id: 'claude-opus-4-20250514',
                name: 'Claude Opus 4',
                developer: 'Anthropic',
                description: "Our most capable model, with the highest level of intelligence and capability. Superior at complex reasoning and advanced coding.",
                knowledge_cutoff: 'Mar 2025',
                context: 200000,
                max_output: 32000,
                pricing: { // Per 1M tokens
                    input: 15.00,
                    output: 75.00
                },
                features: {
                    vision: true,
                    extended_thinking: true,
                    latency: "Moderately Fast"
                }
            },
            {
                id: 'claude-sonnet-4-20250514',
                name: 'Claude Sonnet 4',
                developer: 'Anthropic',
                description: "High-performance model with high intelligence and balanced performance.",
                knowledge_cutoff: 'Mar 2025',
                context: 200000,
                max_output: 64000,
                pricing: { // Per 1M tokens
                    input: 3.00,
                    output: 15.00
                },
                features: {
                    vision: true,
                    extended_thinking: true,
                    latency: "Fast"
                }
            },
            {
                id: 'claude-3-7-sonnet-20250219',
                name: 'Claude Sonnet 3.7',
                developer: 'Anthropic',
                description: "High-performance model with high intelligence and toggleable extended thinking.",
                knowledge_cutoff: 'Nov 2024',
                context: 200000,
                max_output: 64000,
                pricing: { // Per 1M tokens
                    input: 3.00,
                    output: 15.00
                },
                features: {
                    vision: true,
                    extended_thinking: true,
                    latency: "Fast"
                }
            },
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude Sonnet 3.5 (Upgraded)',
                developer: 'Anthropic',
                description: "An intelligent and capable model with a high level of performance.",
                knowledge_cutoff: 'Apr 2024',
                context: 200000,
                max_output: 8192,
                pricing: { // Per 1M tokens
                    input: 3.00,
                    output: 15.00
                },
                features: {
                    vision: true,
                    extended_thinking: false,
                    latency: "Fast"
                }
            },
            {
                id: 'claude-3-5-haiku-20241022',
                name: 'Claude Haiku 3.5',
                developer: 'Anthropic',
                description: "Our fastest model, delivering intelligence at blazing speeds.",
                knowledge_cutoff: 'July 2024',
                context: 200000,
                max_output: 8192,
                pricing: { // Per 1M tokens
                    input: 0.80,
                    output: 4.00
                },
                features: {
                    vision: true,
                    extended_thinking: false,
                    latency: "Fastest"
                }
            },
            {
                id: 'claude-3-haiku-20240307',
                name: 'Claude Haiku 3',
                developer: 'Anthropic',
                description: "Fast and compact model for near-instant responsiveness and quick, accurate targeted performance.",
                knowledge_cutoff: 'Aug 2023',
                context: 200000,
                max_output: 4096,
                pricing: { // Per 1M tokens
                    input: 0.25,
                    output: 1.25
                },
                features: {
                    vision: true,
                    extended_thinking: false,
                    latency: "Fast"
                }
            }
        ]
    },
    deepseek: {
        models: [
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                developer: 'DeepSeek',
                description: "Points to DeepSeek-V3-0324. Optimized for general chat, JSON output, and function calling.",
                context: 65536, // 64K
                max_output: {
                    default: 4096,
                    max: 8192
                },
                features: [
                    "JSON Output",
                    "Function Calling",
                    "Chat Prefix Completion (Beta)",
                    "FIM Completion (Beta)"
                ],
                pricing: { // Per 1M tokens
                    standard: {
                        time_utc: '00:30-16:30',
                        input_cache_hit: 0.07,
                        input_cache_miss: 0.27,
                        output: 1.10
                    },
                    discount: {
                        time_utc: '16:30-00:30',
                        input_cache_hit: 0.035,
                        input_cache_miss: 0.135,
                        output: 0.550
                    }
                }
            },
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek Reasoner',
                developer: 'DeepSeek',
                description: "Points to DeepSeek-R1-0528. Optimized for reasoning tasks. Output token count includes Chain-of-Thought (CoT) and final answer.",
                context: 65536, // 64K (note: output length does not count towards this limit)
                max_output: {
                    default: 32768,
                    max: 65536
                },
                features: [
                    "JSON Output",
                    "Function Calling",
                    "Chat Prefix Completion (Beta)"
                ],
                pricing: { // Per 1M tokens
                    standard: {
                        time_utc: '00:30-16:30',
                        input_cache_hit: 0.14,
                        input_cache_miss: 0.55,
                        output: 2.19
                    },
                    discount: {
                        time_utc: '16:30-00:30',
                        input_cache_hit: 0.035,
                        input_cache_miss: 0.135,
                        output: 0.550
                    }
                }
            }
        ]
    },
    xai: {
        models: [
            {
                id: 'grok-4-0709',
                name: 'Grok 4',
                developer: 'xAI',
                description: "xAI's most capable model, currently supporting text modality with features like function calling, structured outputs, and advanced reasoning.",
                context: 256000,
                rate_limits: "2,000,000 TPM, 480 RPM",
                pricing: { // Per 1M tokens
                    input: 3.00,
                    output: 15.00
                }
            },
            {
                id: 'grok-3',
                name: 'Grok 3',
                developer: 'xAI',
                description: "A powerful, general-purpose language model.",
                context: 131072,
                rate_limits: "600 RPM",
                pricing: { // Per 1M tokens
                    input: 3.00,
                    output: 15.00
                }
            },
            {
                id: 'grok-3-mini',
                name: 'Grok 3 Mini',
                developer: 'xAI',
                description: "A smaller, more cost-effective version of Grok 3.",
                context: 131072,
                rate_limits: "480 RPM",
                pricing: { // Per 1M tokens
                    input: 0.30,
                    output: 0.50
                }
            },
            {
                id: 'grok-3-fastus-east-1',
                name: 'Grok 3 Fast (US East 1)',
                developer: 'xAI',
                description: "A faster, region-specific version of Grok 3, hosted in US East 1.",
                context: 131072,
                rate_limits: "600 RPM",
                pricing: { // Per 1M tokens
                    input: 5.00,
                    output: 25.00
                }
            },
            {
                id: 'grok-3-fasteu-west-1',
                name: 'Grok 3 Fast (EU West 1)',
                developer: 'xAI',
                description: "A faster, region-specific version of Grok 3, hosted in EU West 1.",
                context: 131072,
                rate_limits: "600 RPM",
                pricing: { // Per 1M tokens
                    input: 5.00,
                    output: 25.00
                }
            },
            {
                id: 'grok-3-mini-fast',
                name: 'Grok 3 Mini Fast',
                developer: 'xAI',
                description: "A faster version of the Grok 3 Mini model.",
                context: 131072,
                rate_limits: "180 RPM",
                pricing: { // Per 1M tokens
                    input: 0.60,
                    output: 4.00
                }
            }
        ]
    },
    groq: {
        models: [
            {
                id: 'qwen/qwen3-32b',
                name: 'Qwen3 32B',
                developer: 'Alibaba Cloud',
                description: "Qwen 3 32B offers advancements in reasoning and instruction-following, featuring a unique dual-mode system for complex reasoning ('thinking mode') and efficient dialogue.",
                context: 131072,
                max_output: 40960,
                pricing: { // Per 1M tokens
                    input: 0.29,
                    output: 0.59
                },
                rate_limits: {
                    free: '60 RPM, 1,000 RPD, 6,000 TPM, 500,000 TPD'
                },
                features: {
                    capabilities: "Tool Use, JSON Object Mode, Reasoning",
                    tps: "~400"
                }
            },
            {
                id: 'moonshotai/kimi-k2-instruct',
                name: 'Kimi K2 Instruct',
                developer: 'Moonshot AI',
                description: "A state-of-the-art 1T parameter Mixture-of-Experts (MoE) model with 32B active parameters. Designed for agentic intelligence, it excels at tool use, coding, and autonomous problem-solving.",
                context: 131072,
                max_output: 16384,
                pricing: { // Per 1M tokens
                    input: 1.00,
                    output: 3.00
                },
                rate_limits: {
                    free: '60 RPM, 1,000 RPD, 10,000 TPM, 300,000 TPD'
                },
                features: {
                    capabilities: "Tool Use, JSON Object Mode, JSON Schema Mode",
                    tps: "~200"
                }
            },
            {
                id: 'gemma2-9b-it',
                name: 'Gemma 2 Instruct',
                developer: 'Google',
                description: "A lightweight, state-of-the-art 9B parameter open model from Google, optimized for conversational use cases like question answering, summarization, and reasoning.",
                context: 8192,
                max_output: 8192,
                pricing: { // Per 1M tokens
                    input: 0.20,
                    output: 0.20
                },
                rate_limits: {
                    free: '30 RPM, 14,400 RPD, 15,000 TPM, 500,000 TPD'
                },
                features: {
                    capabilities: "Tool Use, JSON Object Mode",
                    tps: "~560"
                }
            },
            {
                id: 'llama-3.1-8b-instant',
                name: 'Llama 3.1 8B',
                developer: 'Meta',
                description: "Provides low-latency, high-quality responses for real-time conversational interfaces. Offers a balance of speed and performance with native function calling and a 128K context window.",
                context: 131072,
                max_output: 131072,
                pricing: { // Per 1M tokens
                    input: 0.05,
                    output: 0.08
                },
                rate_limits: {
                    free: '30 RPM, 14,400 RPD, 6,000 TPM, 500,000 TPD'
                },
                features: {
                    capabilities: "Tool Use, JSON Object Mode",
                    tps: "~560"
                }
            },
            {
                id: 'llama-3.3-70b-versatile',
                name: 'Llama 3.3 70B',
                developer: 'Meta',
                description: "Meta's advanced 70B parameter multilingual model, optimized for a wide range of NLP tasks. It offers high performance in code generation, mathematical problem-solving, and complex language understanding.",
                context: 131072,
                max_output: 32768,
                pricing: { // Per 1M tokens
                    input: 0.59,
                    output: 0.79
                },
                rate_limits: {
                    free: '30 RPM, 1,000 RPD, 12,000 TPM, 100,000 TPD'
                },
                features: {
                    capabilities: "Tool Use, JSON Object Mode",
                    tps: "~280"
                }
            }
        ]
    },
    huggingface: { models: ['meta-llama/Meta-Llama-3-8B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.2', 'google/gemma-2-9b-it'] },
    mistral: {
        models: [
            {
                id: 'mistral-medium-2505',
                name: 'Mistral Medium 3',
                developer: 'Mistral AI',
                description: "Frontier-class multimodal model with state-of-the-art performance. Cost-efficient and simplified for enterprise deployments.",
                context: 128000,
                pricing: { // Per 1M tokens
                    input: 0.40,
                    output: 2.00
                },
                type: "Premier"
            },
            {
                id: 'magistral-medium-2506',
                name: 'Magistral Medium',
                developer: 'Mistral AI',
                description: "Frontier-class reasoning model excelling in domain-specific, transparent, and multilingual reasoning.",
                context: 40000,
                pricing: { // Per 1M tokens
                    input: 2.00,
                    output: 5.00
                },
                type: "Premier"
            },
            {
                id: 'mistral-large-latest', // Alias for mistral-large-2411
                name: 'Mistral Large',
                developer: 'Mistral AI',
                description: "Top-tier reasoning model for high-complexity tasks and sophisticated problems.",
                context: 128000,
                pricing: { // Per 1M tokens
                    input: 2.00,
                    output: 6.00
                },
                type: "Premier"
            },
            {
                id: 'devstral-medium-2507',
                name: 'Devstral Medium',
                developer: 'Mistral AI',
                description: "Enhanced, enterprise-grade model for advanced coding agents that can explore codebases and edit multiple files.",
                context: 128000,
                pricing: { // Per 1M tokens
                    input: 0.40,
                    output: 2.00
                },
                type: "Premier"
            },
            {
                id: 'codestral-latest', // Alias for codestral-2501
                name: 'Codestral',
                developer: 'Mistral AI',
                description: "Lightweight and fast model, proficient in over 80 programming languages.",
                context: 256000,
                pricing: { // Per 1M tokens
                    input: 0.30,
                    output: 0.90
                },
                type: "Premier"
            },
            {
                id: 'mistral-small-latest', // Alias for mistral-small-2506
                name: 'Mistral Small 3.2',
                developer: 'Mistral AI',
                description: "State-of-the-art small model. Multimodal, multilingual, and released under Apache 2.0 license.",
                context: 128000,
                pricing: { // Per 1M tokens
                    input: 0.10,
                    output: 0.30
                },
                type: "Open"
            },
            {
                id: 'magistral-small-latest', // Alias for magistral-small-2506
                name: 'Magistral Small',
                developer: 'Mistral AI',
                description: "A small thinking model excelling in domain-specific, transparent, and multilingual reasoning.",
                context: 40000,
                pricing: { // Per 1M tokens
                    input: 0.50,
                    output: 1.50
                },
                type: "Open"
            },
            {
                id: 'devstral-small-2507',
                name: 'Devstral Small',
                developer: 'Mistral AI',
                description: "The best open-source model for coding agents.",
                context: 128000,
                pricing: { // Per 1M tokens
                    input: 0.10,
                    output: 0.30
                },
                type: "Open"
            }
        ]
    },
};

export const aiImageProviders = {
    google: {
        models: ['gemini-2.0-flash-exp-image-generation', 'imagen-3.0-generate-002'],
        aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"]
    },
    openai: {
        models: ['gpt-image-1'],
        aspectRatios: ["1024x1024", "1024x1536", "1536x1024"]
    }
};

export const aiAudioProviders = {
    mistral: {
        models: [
            {
                id: 'voxtral-mini-latest', // for /v1/audio/transcriptions endpoint
                name: 'Voxtral Mini Transcribe',
                developer: 'Mistral AI',
                description: "State-of-the-art transcription model, fine-tuned and optimized for transcription purposes only.",
                io_type: "Audio-to-Text",
                endpoint: "/v1/audio/transcriptions",
                pricing: {
                    per_minute_input: 0.002
                }
            },
            {
                id: 'voxtral-small-latest',
                name: 'Voxtral Small',
                developer: 'Mistral AI',
                description: "State-of-the-art performance on speech and audio understanding for instruct use cases.",
                context: 32000,
                io_type: "Audio/Text-to-Text",
                endpoint: "/v1/chat/completions",
                pricing: {
                    per_minute_audio_input: 0.004,
                    per_mtok_text_input: 0.10,
                    per_mtok_output: 0.30
                }
            },
            {
                id: 'voxtral-mini-latest', // for /v1/chat/completions endpoint
                name: 'Voxtral Mini (Chat)',
                developer: 'Mistral AI',
                description: "Low-latency speech recognition for edge and devices, usable in a chat context.",
                context: 32000,
                io_type: "Audio/Text-to-Text",
                endpoint: "/v1/chat/completions",
                pricing: {
                    per_minute_audio_input: 0.001,
                    per_mtok_text_input: 0.04,
                    per_mtok_output: 0.04
                }
            }
        ]
    }
};

console.log("ai-config.js loaded with detailed and updated model info for OpenRouter.");