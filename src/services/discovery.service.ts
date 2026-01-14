
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Business } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class DiscoveryService {
  private ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || '' });

  async discoverVillageEconomy(villageName: string): Promise<Business[]> {
    try {
      // Config rules for googleSearch grounding: 
      // 1. DO NOT set responseMimeType
      // 2. DO NOT set responseSchema
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a detailed intelligence report on local assets for the village of ${villageName}, Royal Bafokeng Nation, Rustenburg region, South Africa. 
        List 8-10 real entities including:
        - Schools (Primary, High, or Technical)
        - Businesses (Retail, Mining contractors, or Local services)
        - Community landmarks or Health clinics
        
        CRITICAL: Provide the data as a valid JSON array inside a markdown code block labeled "JSON".
        Each object must have keys: "name", "category", and "detail".
        Example:
        \`\`\`JSON
        [{"name": "Lebone II College", "category": "Education", "detail": "A prestigious independent school."}]
        \`\`\``,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      
      // Extract JSON from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      let businesses: Business[] = [];
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          businesses = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.error('Failed to parse JSON from grounded response', e);
        }
      }

      // Mandatory Grounding Attribution: Extract URLs from groundingChunks
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sourceUrl = groundingChunks?.[0]?.web?.uri || '';

      // Append source URL to discovered businesses for compliance
      return businesses.map(b => ({
        ...b,
        sourceUrl: b.sourceUrl || sourceUrl
      }));

    } catch (error) {
      console.error('Discovery failed:', error);
      return [];
    }
  }
}
