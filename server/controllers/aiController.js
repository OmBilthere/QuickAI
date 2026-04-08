import OpenAI from "openai";
import sql from '../configs/db.js';
import { clerkClient } from "@clerk/express";
import axios from "axios";   
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';

const safeUnlink = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Failed to delete temp upload:', filePath, error.message);
        }
    }
};

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

export const generateBlogTitle = async (req, res) => { 
   
    try {
  
        const {userId} = req.auth();
        const {prompt , category} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

          if (!prompt || prompt.trim() === '' || !category || category.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Prompt and category are required.'
            });
        }

        if(plan !== 'premium' && free_usage >= 10) { 
            return res.json({
                success: false,
                message: 'Free usage limit reached. Please upgrade to premium.'
            })
        }

    const response = await AI.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [

        {
             role: "system",
             content: `You are a professional blog title generator for ${category}. Return exactly 10 catchy blog titles. Output only a numbered list (1 to 10). Do not add any intro text like "Here are a few" and do not add any explanation.`
        },

        {
            role: "user",
            content: prompt
        }
    ],

    temperature: 0.7,
    max_tokens: 1000 
    
});

     const content = response.choices[0].message.content;

        if (!content || content.trim() === '') {
            return res.status(500).json({
                success: false,
                message: 'AI returned an empty response. Please try again.'
            });
        }
      
     await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`; 
     
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

export const generateImage = async (req, res) => { 
   
    try {
  
        const {userId} = req.auth();
        const {prompt , publish } = req.body;
        const plan = req.plan;
        if(plan !== 'premium') {
            return res.json({ 
                success: false,
                message: 'Image generation is only available for premium users. Please upgrade to access this feature.'
            })
        }

          if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required.'
            });
        }


        const formData = new FormData();
        formData.append('prompt', prompt);
        
        const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1" , formData, {
            headers: {
                 'x-api-key': process.env.CLIPDROP_API_KEY,
            },
            responseType: 'arraybuffer'
        })
        
        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;


        if (!base64Image) {
            return res.status(500).json({
                success: false,
                message: 'AI returned an empty response. Please try again.'
            });
        }
        
       const { secure_url } = await cloudinary.uploader.upload(base64Image, { folder: 'quickai' });
       
      
       await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish})`; 
     
     
        res.json({
        success: true,
        content: secure_url
     })


    } catch (error) {

    console.error("FULL ERROR =>", error);

    return res.status(500).json({
        success: false,
        message: error.message,
    });
    }
}

export const removeImageBackground = async (req, res) => { 
    const image = req.file;

    try {
  
        const {userId} = req.auth();
        const plan = req.plan;
        if(plan !== 'premium') {
            return res.json({ 
                success: false,
                message: 'Image generation is only available for premium users. Please upgrade to access this feature.'
            })
        }

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required.'
            });
        }
        
       const { secure_url } = await cloudinary.uploader.upload(image.path, { folder: 'quickai' , transformation: [
         {
            effect: "background_removal",
            background_removal: 'remove_the_background'
         }
      ] 
     
    });
       
      
       await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove Background from image', ${secure_url}, 'image')`; 
     
        res.json({
        success: true,
        content: secure_url
     })


    } catch (error) {

    console.error("FULL ERROR =>", error);

    return res.status(500).json({
        success: false,
        message: error.message,
    });
    } finally {
        await safeUnlink(image?.path);
    }
}

export const removeImageObject = async (req, res) => { 
    const image = req.file;

    try {
  
        const {userId} = req.auth();
        const {object} = req.body;
        const plan = req.plan;
        if(plan !== 'premium') {
            return res.json({ 
                success: false,
                message: 'Image generation is only available for premium users. Please upgrade to access this feature.'
            })
        }

          if (!object || object.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Object is required.'
            });
        }

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required.'
            });
        }

        const normalizedObject = object.trim();
        const effectPrompt = normalizedObject.toLowerCase().replace(/\s+/g, '_');

        const { secure_url } = await cloudinary.uploader.upload(image.path, {
            folder: 'quickai',
            resource_type: 'image',
            transformation: [
                {
                    effect: `gen_remove:prompt_${effectPrompt}`
                }
            ]
        });


         await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${normalizedObject} from image`}, ${secure_url}, 'image')`; 
     
        res.json({
        success: true,
          content: secure_url
     })


    } catch (error) {

    console.error("FULL ERROR =>", error);

    return res.status(500).json({
        success: false,
        message: error.message,
    });
    } finally {
        await safeUnlink(image?.path);
    }
}

export const resumeReview = async (req, res) => { 
    const resume = req.file;

    try {
  
        const {userId} = req.auth();
        const plan = req.plan;
        
        if(plan !== 'premium') {
            return res.json({ 
                success: false,
                message: 'Resume review is only available for premium users. Please upgrade to access this feature.'
            })
        }

          if (!resume) {
            return res.status(400).json({
                success: false,
                message: 'Resume is required.'
            });
        }
        
        
        if(resume.size > 5 *1024*1024) {
            return res.status(400).json({
                success: false, 
                message: 'Resume file size exceeds the 5MB limit.'
            })
        }

        const dataBuffer = fs.readFileSync(resume.path);
        const parser = new PDFParse({ data: dataBuffer });
        let pdfData;

        try {
            pdfData = await parser.getText();
        } finally {
            await parser.destroy();
        }

        const prompt = `Review the following resume and provide feedback on how to improve it:\n\n${pdfData.text}`;
       
       
      const response = await AI.chat.completions.create({
       model: "gemini-2.5-flash",
       messages: [

        {
             role: "system",
               content: "You are a professional career advisor. Always return complete, concise, and actionable resume feedback in markdown. Do not leave sentences incomplete."
        },

        {
            role: "user",
            content: prompt
        }
      ],

    temperature: 0.4,
    max_tokens: 3000
    
     });

     const content = response.choices[0].message.content;

        if (!content || content.trim() === '') {
            return res.status(500).json({
                success: false,
                message: 'AI returned an empty response. Please try again.'
            });
        }
      
       await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Review the uploaded resume`}, ${content}, 'resume-review')`; 
     
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
    } finally {
        await safeUnlink(resume?.path);
    }
}


