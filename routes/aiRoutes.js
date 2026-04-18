import express from 'express';
import protect from '../middlewares/authMiddlewares.js';
import { enhancedJobDescription, enhanceProfessionalSummary, uploadResume, suggestSkills, suggestJobTitles, resumeTips, atsScore } from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/enhance-pro-sum', protect, enhanceProfessionalSummary)
aiRouter.post('/enhance-job-desc', protect, enhancedJobDescription)
aiRouter.post('/upload-resume', protect, uploadResume)
aiRouter.post('/suggest-skills', protect, suggestSkills)
aiRouter.post('/suggest-job-titles', protect, suggestJobTitles)
aiRouter.post('/resume-tips', protect, resumeTips)
aiRouter.post('/ats-score', protect, atsScore)

export default aiRouter