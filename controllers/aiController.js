import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

//controller for enhancing a resume's professional summary
//POST: /api/ai/enhance-pro-sum 
export const enhanceProfessionalSummary = async (req, res) => {
    try {
        const { userContent } = req.body;

        if(!userContent ){
            return res.status(400).json({message:'Missing required fields'})
        }

        const response = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
            {   role: "system",
                content: "You are an expert in resume writing. Your task is to enhance the professional summary of a resume. The summary should be 1-2 sentences highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly. Return ONLY the enhanced text with absolutely no prefix, label, or extra words.",
            },
            {
                role: "user",
                content: userContent,
            },
    ],
        })

        const enhancedContent = response.choices[0].message.content.replace(/^(result[-:]?\s*)/i, '').trim();
        return res.status(200).json({enhancedContent})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

//controller for enhancing a resume's job description
//POST: /api/ai/enhanced-job-desc
export const enhancedJobDescription = async (req, res) => {
    try {
        const { userContent } = req.body;

        if(!userContent ){
            return res.status(400).json({message:'Missing required fields'})
        }

        let response;
        for(let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await ai.chat.completions.create({
                    model: process.env.OPENAI_MODEL,
                    messages: [
                        { role: "system", content: "You are an expert in resume writing. Your task is to enhance the job description of a resume. The job description should be only 1-2 sentences highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly. Return ONLY the enhanced text with absolutely no prefix, label, or extra words."},
                        { role: "user", content: userContent },
                    ],
                })
                break;
            } catch(err) {
                if(err.message.includes('429') && attempt < 3) {
                    await new Promise(r => setTimeout(r, attempt * 5000))
                } else {
                    throw err
                }
            }
        }

        const enhancedContent = response.choices[0].message.content.replace(/^(result[-:]?\s*)/i, '').trim();
        return res.status(200).json({enhancedContent})
    } catch (error) {
        console.log('enhancedJobDescription error:', error.message)
        return res.status(400).json({message: error.message})
    }
}

//controller for ATS score
//POST: /api/ai/ats-score
export const atsScore = async (req, res) => {
    try {
        const { resumeData } = req.body;
        if (!resumeData) return res.status(400).json({ message: 'Missing resumeData' });

        const summary = `
            Profession: ${resumeData.personal_info?.profession || 'N/A'}
            Email: ${resumeData.personal_info?.email ? 'yes' : 'no'}
            Phone: ${resumeData.personal_info?.phone ? 'yes' : 'no'}
            Location: ${resumeData.personal_info?.location ? 'yes' : 'no'}
            LinkedIn: ${resumeData.personal_info?.linkedin ? 'yes' : 'no'}
            Summary: ${resumeData.professional_summary || ''}
            Experience: ${resumeData.experience?.map(e => e.position + ' ' + e.description).join(' ') || 'none'}
            Skills: ${resumeData.skills?.join(', ') || 'none'}
            Education: ${resumeData.education?.map(e => e.degree + ' ' + e.institution).join(' ') || 'none'}
        `;

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: 'system', content: 'You are an ATS expert. Analyze the resume and return ONLY a valid JSON object like this: { "score": 72, "feedback": [ { "status": "pass", "text": "..." }, { "status": "warn", "text": "..." }, { "status": "fail", "text": "..." } ] }. Include 5-6 feedback items. status must be pass, warn, or fail. No markdown, no explanation, just the JSON.' },
                { role: 'user', content: summary },
            ],
        });
        const raw = response.choices[0].message.content.replace(/```json|```/g, '').trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI returned invalid response');
        const result = JSON.parse(jsonMatch[0]);
        return res.json(result);
    } catch (error) {
        console.log('atsScore error:', error.message);
        return res.status(400).json({ message: error.message });
    }
}

//controller for suggesting skills based on job title
//POST: /api/ai/suggest-skills
export const suggestSkills = async (req, res) => {
    try {
        const { profession } = req.body;
        if (!profession) return res.status(400).json({ message: 'Missing profession' });

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: 'system', content: 'You are a resume expert. Return ONLY a JSON array of 8 relevant skills (strings) for the given job title. No explanation, no markdown, just the array.' },
                { role: 'user', content: profession },
            ],
        });
        const raw = response.choices[0].message.content.replace(/```json|```/g, '').trim();
        const skills = JSON.parse(raw);
        return res.json({ skills });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

//controller for suggesting job titles
//POST: /api/ai/suggest-job-titles
export const suggestJobTitles = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: 'Missing query' });

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: 'system', content: 'You are a career expert. Return ONLY a JSON array of 6 relevant job title suggestions (strings) based on the input. No explanation, no markdown, just the array.' },
                { role: 'user', content: query },
            ],
        });
        const raw = response.choices[0].message.content.replace(/```json|```/g, '').trim();
        const titles = JSON.parse(raw);
        return res.json({ titles });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

//controller for resume tips based on current resume data
//POST: /api/ai/resume-tips
export const resumeTips = async (req, res) => {
    try {
        const { resumeData } = req.body;
        if (!resumeData) return res.status(400).json({ message: 'Missing resumeData' });

        const summary = `
            Name: ${resumeData.personal_info?.full_name || 'N/A'}
            Profession: ${resumeData.personal_info?.profession || 'N/A'}
            Summary length: ${resumeData.professional_summary?.length || 0} chars
            Experience entries: ${resumeData.experience?.length || 0}
            Education entries: ${resumeData.education?.length || 0}
            Projects: ${resumeData.project?.length || 0}
            Skills count: ${resumeData.skills?.length || 0}
        `;

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: 'system', content: 'You are a resume coach. Based on the resume stats provided, return ONLY a JSON array of 3 short actionable tip strings to improve the resume. No explanation, no markdown, just the array.' },
                { role: 'user', content: summary },
            ],
        });
        const raw = response.choices[0].message.content.replace(/```json|```/g, '').trim();
        const tips = JSON.parse(raw);
        return res.json({ tips });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

//controller for uploading a resume to the database
//POST: /api/ai//upload-resume
export const uploadResume = async (req, res) => {
    try {
        const {resumeText, title} = req.body;
        const userId = req.userId;

        if(!resumeText){
            return res.status(400).json({message:'Missing required fields'})
        }

        const systemPrompt = "You are an expert AI agent that extracts data from resumes and returns only valid JSON with no extra text."
        const userPrompt = `Extract data from this resume text and return ONLY a valid JSON object:
        {
            "professional_summary": "",
            "skills": [],
            "personal_info": {
                "image": "",
                "full_name": "",
                "profession": "",
                "email": "",
                "phone": "",
                "location": "",
                "linkedin": "",
                "website": ""
            },
            "experience": [
                {
                    "company": "",
                    "position": "",
                    "start_date": "",
                    "end_date": "",
                    "description": "",
                    "is_current": false
                }
            ],
            "project": [
                {
                    "name": "",
                    "type": "",
                    "description": ""
                }
            ],
            "education": [
                {
                    "institution": "",
                    "degree": "",
                    "field": "",
                    "graduation_date": "",
                    "gpa": ""
                }
            ]
        }
        Resume text: ${resumeText}`

        const response = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ]
        })

        const extractedData = response.choices[0].message.content;
        const cleaned = extractedData.replace(/```json|```/g, '').trim()
        const parsedData = JSON.parse(cleaned)
        const newResume = await Resume.create({userId, title, ...parsedData})

        res.json({resumeId: newResume._id})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}
