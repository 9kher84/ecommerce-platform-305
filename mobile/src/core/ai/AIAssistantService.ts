import { NetworkSecurity } from '../core/security/NetworkSecurity';

/**
 * Handles interactions with the backend AI features (Learning Bot, Support, Payment Assistant).
 */

export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export const AIAssistantService = {
    /**
     * Send a message to the Learning Bot.
     */
    async askLearningBot(question: string): Promise<string> {
        try {
            const response = await NetworkSecurity.secureFetch('https://api.ecommerce.com/api/ai/learn', {
                method: 'POST',
                body: JSON.stringify({ question }),
            });

            // Mock response for POC (since backend returns 503 if disabled)
            if (response.status === 503) {
                return "🤖 I'm currently undergoing maintenance to serve you better. Please check back later!";
            }

            const data = await response.json();
            return data.answer;
        } catch (error) {
            console.error('AI Service Error:', error);
            return "⚠️ I'm having trouble connecting to the brain. Please try again.";
        }
    },

    /**
     * Get help from the Smart Support Bot.
     */
    async getSupport(issue: string): Promise<string> {
        try {
            const response = await NetworkSecurity.secureFetch('https://api.ecommerce.com/api/ai/support', {
                method: 'POST',
                body: JSON.stringify({ issue }),
            });

            if (response.status === 503) return "Support Bot is offline.";

            const data = await response.json();
            return data.solution;
        } catch (error) {
            return "Support system unreachable.";
        }
    }
};
