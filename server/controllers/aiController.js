import OpenAI from "openai";
import sql from '../configs/db.js';
import { clerkClient } from "@clerk/express";


const AI = new OpenAI({
    apiKey:  process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});



export const generateArticle = async (req, res) => { 
   
    try {
  
        const {userId} = req.auth();

        const {prompt , length} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

          if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required.'
            });
        }

        if(plan !== 'premium' && free_usage >= 10) { 
            return res.json({
                success: false,
                message: 'Free usage limit reached. Please upgrade to premium.'
            })
        }
    const estimatedTokens = Math.min(Math.floor((length || 600) * 1.5), 2000);
    const response = await AI.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [

        {
             role: "system",
             content: "You are a professional article writer. Write well-structured, engaging articles based on the user's topic. Always write the complete article without stopping in between. Never leave the article incomplete or cut off mid-sentence."
        },

        {
            role: "user",
            content: prompt
        }
    ],

    temperature: 0.7,
    max_tokens: estimatedTokens
    
});

     const content = response.choices[0].message.content;

        if (!content || content.trim() === '') {
            return res.status(500).json({
                success: false,
                message: 'AI returned an empty response. Please try again.'
            });
        }
      
     await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`; 
     
     if(plan !== 'premium') {
        await clerkClient.users.updateUserMetadata(userId, { 
            
           privateMetadata: {  

            free_usage: free_usage + 1
           }

        
        });
     }
     
        res.json({
        success: true,
        content
     })


    } catch (error) {

    console.error("FULL ERROR =>", error);

    return res.status(500).json({
        success: false,
        message: error.message,
    });
    }
}