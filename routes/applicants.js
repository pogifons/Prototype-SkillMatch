const express = require('express');
const router = express.Router();
const Applicant = require('../models/Applicant');
const Job = require('../models/Job');
const Training = require('../models/Training');
const { verifyToken } = require('./auth');

// Compute skill match score for an applicant and job
function computeSkillMatchScore(applicant, job) {
    if (!job?.requiredSkills || job.requiredSkills.length === 0) return 0;

    const requiredSkills = (job.requiredSkills || [])
        .map(s => String(s || '').trim())
        .filter(Boolean);
    if (requiredSkills.length === 0) return 0;

    const applicantSkillRows = (applicant?.skills || []).map((s) => ({
        raw: String(s?.skill || ''),
        norm: String(s?.skill || '').toLowerCase(),
        level: s?.level,
        years: Number(s?.yearsOfExperience || 0)
    }));

    // simple matching: exact OR token/substring match (handles "JavaScript/React" vs "React")
    function hasSkill(requiredSkill) {
        const req = String(requiredSkill || '').toLowerCase();
        if (!req) return null;
        // exact
        const exact = applicantSkillRows.find(r => r.norm === req);
        if (exact) return exact;
        // substring / token split
        const tokenMatch = applicantSkillRows.find(r => {
            if (!r.norm) return false;
            if (r.norm.includes(req) || req.includes(r.norm)) return true;
            const tokens = r.norm.split(/[^a-z0-9]+/i).filter(Boolean);
            return tokens.includes(req);
        });
        return tokenMatch || null;
    }

    const levelWeight = (level) => {
        const l = String(level || '').toLowerCase();
        if (l === 'expert') return 1.0;
        if (l === 'advanced') return 0.85;
        if (l === 'intermediate') return 0.7;
        if (l === 'basic') return 0.55;
        return 0.65;
    };

    const yearsWeight = (years) => {
        // cap at 8 yrs; 0 yrs => 0.6, 8+ yrs => 1.0
        const y = Math.max(0, Math.min(8, Number(years || 0)));
        return 0.6 + (y / 8) * 0.4;
    };

    // Skill score: each required skill contributes up to 1.0 (weighted by level+years)
    let totalSkillScore = 0;
    requiredSkills.forEach((req) => {
        const found = hasSkill(req);
        if (!found) return;
        totalSkillScore += levelWeight(found.level) * yearsWeight(found.years);
    });

    const base = (totalSkillScore / requiredSkills.length) * 100;

    // Experience weighting based on overall work history
    let experienceBonus = 0;
    if (job.experienceLevel && applicant.experience && applicant.experience.length > 0) {
        const applicantYears = applicant.experience.reduce((sum, exp) => {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
            return sum + (Number.isFinite(years) ? years : 0);
        }, 0);

        const requiredYears = { entry: 0, mid: 3, senior: 7, lead: 10 };
        const need = requiredYears[job.experienceLevel] ?? 0;

        // up to +15: meeting requirement gives +10, exceeding gives up to +5 more
        if (applicantYears >= need) {
            const extra = Math.min(5, Math.max(0, applicantYears - need) * 0.75);
            experienceBonus = 10 + extra;
        } else if (need > 0) {
            // partial credit if close
            experienceBonus = Math.max(0, (applicantYears / need) * 6);
        }
    }

    return Math.min(100, Math.round(base + experienceBonus));
}

// Get all applicants for employer's jobs
router.get('/', verifyToken, async (req, res) => {
    try {
        // Get all jobs for this employer
        const jobs = await Job.find({ employerId: req.employerId }).select('_id');
        const jobIds = jobs.map(job => job._id);

        // Get all applicants who applied to these jobs
        const applicants = await Applicant.find({
            'applications.jobId': { $in: jobIds }
        }).populate('applications.jobId', 'title');

        res.json(applicants);
    } catch (error) {
        console.error('Get applicants error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get applicants for a specific job with sorting and filtering
router.get('/job/:jobId', verifyToken, async (req, res) => {
    try {
        // Verify job belongs to employer
        const job = await Job.findOne({
            _id: req.params.jobId,
            employerId: req.employerId
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const { status, sortBy = 'appliedAt', sortOrder = 'desc', minScore } = req.query;
        
        let query = { 'applications.jobId': req.params.jobId };
        
        // Filter by status
        if (status && status !== 'all') {
            query['applications.status'] = status;
        }
        
        // Filter by minimum match score
        if (minScore) {
            query['applications.matchScore'] = { $gte: parseInt(minScore) };
        }

        let applicants = await Applicant.find(query)
            .populate('applications.jobId', 'title department location')
            .populate('applications.notes.addedBy', 'companyName email');

        // Sort applicants
        applicants = applicants.sort((a, b) => {
            const appA = a.applications.find(app => app.jobId._id.toString() === req.params.jobId);
            const appB = b.applications.find(app => app.jobId._id.toString() === req.params.jobId);
            
            if (!appA || !appB) return 0;
            
            let valueA, valueB;
            if (sortBy === 'matchScore') {
                valueA = appA.matchScore || 0;
                valueB = appB.matchScore || 0;
            } else if (sortBy === 'appliedAt') {
                valueA = new Date(appA.appliedAt);
                valueB = new Date(appB.appliedAt);
            } else if (sortBy === 'name') {
                valueA = `${a.firstName} ${a.lastName}`.toLowerCase();
                valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
            } else {
                valueA = appA.status;
                valueB = appB.status;
            }
            
            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        res.json(applicants);
    } catch (error) {
        console.error('Get job applicants error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get assessment history for an applicant (from Training.assessments)
router.get('/:id/assessment-history', verifyToken, async (req, res) => {
    try {
        // Ensure applicant is related to this employer (via applications to employer jobs)
        const jobs = await Job.find({ employerId: req.employerId }).select('_id');
        const jobIds = jobs.map(j => j._id.toString());

        const applicant = await Applicant.findById(req.params.id).select('applications');
        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        const hasRelatedApplication = (applicant.applications || []).some(app =>
            app.jobId && jobIds.includes(app.jobId.toString())
        );

        if (!hasRelatedApplication) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const trainings = await Training.find(
            { 'assessments.applicantId': req.params.id },
            { title: 1, assessments: 1 }
        ).lean();

        const assessmentHistory = [];
        trainings.forEach(t => {
            (t.assessments || []).forEach(a => {
                if (a.applicantId && a.applicantId.toString() === req.params.id) {
                    assessmentHistory.push({
                        trainingId: t._id,
                        trainingTitle: t.title,
                        score: a.score,
                        completedAt: a.completedAt,
                    });
                }
            });
        });

        assessmentHistory.sort((a, b) => {
            const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return db - da;
        });

        res.json({ assessmentHistory });
    } catch (error) {
        console.error('Get assessment history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single applicant details
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id)
            .populate('applications.jobId', 'title department location')
            .populate('applications.notes.addedBy', 'companyName email')
            .populate('assignedTrainings.trainingId')
            .populate('assignedTrainings.assignedBy', 'companyName');

        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        res.json(applicant);
    } catch (error) {
        console.error('Get applicant error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Compute and update skill match score for an applicant-job pair
router.post('/:id/compute-match/:jobId', verifyToken, async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id);
        const job = await Job.findById(req.params.jobId);

        if (!applicant || !job) {
            return res.status(404).json({ error: 'Applicant or job not found' });
        }

        // Verify job belongs to employer
        if (job.employerId.toString() !== req.employerId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const matchScore = computeSkillMatchScore(applicant, job);
        
        // Update or create application with match score
        let application = applicant.applications.find(
            app => app.jobId.toString() === req.params.jobId
        );

        if (application) {
            application.matchScore = matchScore;
        } else {
            applicant.applications.push({
                jobId: req.params.jobId,
                matchScore,
                status: 'new'
            });
        }

        await applicant.save();

        res.json({ matchScore, applicant });
    } catch (error) {
        console.error('Compute match score error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get recommended trainings for an applicant based on skill gaps
router.get('/:id/recommended-trainings', verifyToken, async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        // Get all jobs this applicant applied to
        const jobIds = applicant.applications.map(app => app.jobId);
        const jobs = await Job.find({ _id: { $in: jobIds } });

        // Find missing skills
        const applicantSkills = new Set(
            applicant.skills.map(s => s.skill.toLowerCase())
        );
        const requiredSkills = new Set();
        jobs.forEach(job => {
            job.requiredSkills.forEach(skill => {
                if (!applicantSkills.has(skill.toLowerCase())) {
                    requiredSkills.add(skill);
                }
            });
        });

        // Find trainings that match missing skills
        const trainings = await Training.find({
            requiredSkills: { $in: Array.from(requiredSkills) },
            status: 'active'
        }).limit(5);

        res.json({ recommendedTrainings: trainings, skillGaps: Array.from(requiredSkills) });
    } catch (error) {
        console.error('Get recommended trainings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update applicant status
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { jobId, status, interviewDate } = req.body;

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        // Update application status
        const application = applicant.applications.find(
            app => app.jobId.toString() === jobId
        );

        if (application) {
            application.status = status;
            if (interviewDate && status === 'interview') {
                application.interviewDate = new Date(interviewDate);
            }
            if (status === 'hired') {
                application.hiredAt = new Date();
            }
            await applicant.save();
        }

        res.json(applicant);
    } catch (error) {
        console.error('Update applicant status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add note to applicant
router.post('/:id/notes', verifyToken, async (req, res) => {
    try {
        const { jobId, note } = req.body;

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        const application = applicant.applications.find(
            app => app.jobId.toString() === jobId
        );

        if (application) {
            application.notes.push({
                note,
                addedBy: req.employerId,
                addedAt: new Date()
            });
            await applicant.save();
        }

        res.json(applicant);
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send message to applicant (placeholder - would integrate with email service)
router.post('/:id/message', verifyToken, async (req, res) => {
    try {
        const { jobId, subject, message } = req.body;

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        // In a real implementation, this would send an email
        // For now, we'll just log it and return success
        console.log(`Message to ${applicant.email} about job ${jobId}:`, { subject, message });

        res.json({ 
            message: 'Message sent successfully',
            recipient: applicant.email,
            subject,
            sentAt: new Date()
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get applicant statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
    try {
        const jobs = await Job.find({ employerId: req.employerId }).select('_id');
        const jobIds = jobs.map(job => job._id);

        const totalApplicants = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds }
        });

        const newApplicants = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'new'
        });

        const shortlisted = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'shortlisted'
        });

        const interviews = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'interview'
        });

        const hired = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'hired'
        });

        res.json({
            totalApplicants,
            newApplicants,
            shortlisted,
            interviews,
            hired
        });
    } catch (error) {
        console.error('Get applicant stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

