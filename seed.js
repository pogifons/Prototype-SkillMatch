const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Employer = require('./models/Employer');
const Job = require('./models/Job');
const Applicant = require('./models/Applicant');
const Training = require('./models/Training');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://skillmatchdb:5killm4tch@skillmatch-cluster.rt9ysnv.mongodb.net/SkillMatch?retryWrites=true&w=majority';

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing data...');
        await Job.deleteMany({});
        await Applicant.deleteMany({});
        await Training.deleteMany({});

        // Get all existing employers or create a default one
        let employers = await Employer.find({});
        
        if (employers.length === 0) {
            // Create default employer if none exist
            const hashedPassword = await bcrypt.hash('password123', 10);
            const defaultEmployer = new Employer({
                companyName: 'TechCorp Inc.',
                email: 'techcorp@example.com',
                password: hashedPassword,
                industry: 'Information Technology',
                address: 'Quezon City, Metro Manila',
                isVerified: true
            });
            await defaultEmployer.save();
            employers = [defaultEmployer];
            console.log('✅ Created default employer: TechCorp Inc.');
        }

        // Use the first employer (or you can specify which one to use)
        // If you want to seed data for ALL employers, we can loop through them
        const employer = employers[0];
        const employerId = employer._id;
        
        console.log(`✅ Seeding data for employer: ${employer.companyName} (${employer.email})`);
        
        // Option: Uncomment the following to seed data for ALL employers
        // for (const emp of employers) {
        //     await seedDataForEmployer(emp._id, emp.companyName);
        // }

        // Seed Jobs
        console.log('📝 Seeding jobs...');
        const jobs = [
            {
                employerId: employerId,
                title: 'Senior Software Developer',
                department: 'Information Technology',
                employmentType: 'fulltime',
                location: 'Quezon City',
                salaryRange: '₱80,000 - ₱120,000',
                description: 'We are looking for an experienced Senior Software Developer to join our dynamic team. You will be responsible for developing and maintaining high-quality software solutions using modern technologies.',
                requiredSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB', 'REST APIs', 'Git'],
                experienceLevel: 'senior',
                status: 'active',
                applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                benefits: 'Health insurance, 13th month pay, HMO, Flexible work hours, Remote work options'
            },
            {
                employerId: employerId,
                title: 'UI/UX Designer',
                department: 'Creative Department',
                employmentType: 'fulltime',
                location: 'Makati City',
                salaryRange: '₱50,000 - ₱80,000',
                description: 'Join our creative team as a UI/UX Designer. You will design intuitive and beautiful user interfaces for web and mobile applications.',
                requiredSkills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'HTML/CSS'],
                experienceLevel: 'mid',
                status: 'active',
                applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                benefits: 'Health insurance, Creative workspace, Design tools provided, Professional development'
            },
            {
                employerId: employerId,
                title: 'BPO Team Leader',
                department: 'Operations',
                employmentType: 'fulltime',
                location: 'Pasig City',
                salaryRange: '₱35,000 - ₱45,000',
                description: 'Lead a team of customer service representatives in our BPO operations. Manage team performance and ensure excellent customer service delivery.',
                requiredSkills: ['Team Leadership', 'Customer Service', 'Performance Management', 'Data Analysis'],
                experienceLevel: 'mid',
                status: 'pending',
                applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                benefits: 'Health insurance, Performance bonuses, Career growth opportunities'
            },
            {
                employerId: employerId,
                title: 'Financial Analyst',
                department: 'Finance',
                employmentType: 'fulltime',
                location: 'Taguig City',
                salaryRange: '₱60,000 - ₱90,000',
                description: 'Analyze financial data and prepare reports to help guide business decisions. Work with cross-functional teams to provide financial insights.',
                requiredSkills: ['Excel', 'Financial Modeling', 'SAP', 'Data Analysis', 'Accounting'],
                experienceLevel: 'mid',
                status: 'active',
                applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                benefits: 'Health insurance, 13th month pay, HMO, Professional certifications support'
            },
            {
                employerId: employerId,
                title: 'TESDA Certified Welder',
                department: 'Construction',
                employmentType: 'fulltime',
                location: 'Quezon City',
                salaryRange: '₱25,000 - ₱35,000',
                description: 'We need a certified welder with TESDA NC II certification. Experience in SMAW (Shielded Metal Arc Welding) required.',
                requiredSkills: ['TESDA NC II', 'SMAW', 'Safety Certified', 'Blueprint Reading'],
                experienceLevel: 'entry',
                status: 'active',
                applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                benefits: 'Safety equipment provided, Overtime pay, Health insurance'
            },
            {
                employerId: employerId,
                title: 'HR Business Partner',
                department: 'Human Resources',
                employmentType: 'fulltime',
                location: 'Makati City',
                salaryRange: '₱55,000 - ₱75,000',
                description: 'Support HR operations including recruitment, employee relations, and organizational development.',
                requiredSkills: ['Recruitment', 'Employee Relations', 'HRIS', 'Labor Law'],
                experienceLevel: 'mid',
                status: 'draft',
                applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                benefits: 'Health insurance, HMO, Professional development, Flexible schedule'
            }
        ];

        const createdJobs = await Job.insertMany(jobs);
        console.log(`✅ Created ${createdJobs.length} jobs`);

        // Seed Applicants
        console.log('👥 Seeding applicants...');
        const applicants = [
            {
                firstName: 'Juan',
                lastName: 'Carlos Rivera',
                email: 'juan.rivera@email.com',
                phone: '+63 912 345 6789',
                location: 'Quezon City',
                skills: [
                    { skill: 'JavaScript/React', level: 'expert', yearsOfExperience: 5 },
                    { skill: 'Node.js', level: 'expert', yearsOfExperience: 4 },
                    { skill: 'TypeScript', level: 'intermediate', yearsOfExperience: 2 },
                    { skill: 'MongoDB', level: 'expert', yearsOfExperience: 4 }
                ],
                certifications: [
                    { name: 'AWS Certified Developer', issuer: 'Amazon', date: new Date('2022-01-15') }
                ],
                experience: [
                    {
                        position: 'Senior Software Developer',
                        company: 'Tech Solutions Inc.',
                        startDate: new Date('2019-01-01'),
                        endDate: null,
                        description: 'Lead development of web applications using React and Node.js'
                    }
                ],
                education: [
                    { degree: 'BS Computer Science', institution: 'University of the Philippines', year: 2018 }
                ],
                applications: [
                    {
                        jobId: createdJobs[0]._id, // Senior Software Developer
                        matchScore: 94,
                        status: 'new',
                        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                    }
                ]
            },
            {
                firstName: 'Maria',
                lastName: 'Angela Santos',
                email: 'maria.santos@email.com',
                phone: '+63 923 456 7890',
                location: 'Makati City',
                skills: [
                    { skill: 'Figma/Adobe XD', level: 'expert', yearsOfExperience: 3 },
                    { skill: 'User Research', level: 'advanced', yearsOfExperience: 3 },
                    { skill: 'Prototyping', level: 'advanced', yearsOfExperience: 3 },
                    { skill: 'HTML/CSS', level: 'basic', yearsOfExperience: 1 }
                ],
                experience: [
                    {
                        position: 'UI/UX Designer',
                        company: 'Creative Agency',
                        startDate: new Date('2021-01-01'),
                        endDate: null,
                        description: 'Design user interfaces for web and mobile applications'
                    }
                ],
                education: [
                    { degree: 'BS Fine Arts', institution: 'De La Salle University', year: 2020 }
                ],
                applications: [
                    {
                        jobId: createdJobs[1]._id, // UI/UX Designer
                        matchScore: 88,
                        status: 'new',
                        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
                    }
                ]
            },
            {
                firstName: 'Ricardo',
                lastName: 'Dela Cruz',
                email: 'ricardo.cruz@email.com',
                phone: '+63 934 567 8901',
                location: 'Pasig City',
                skills: [
                    { skill: 'Team Leadership', level: 'expert', yearsOfExperience: 4 },
                    { skill: 'Customer Service', level: 'expert', yearsOfExperience: 5 },
                    { skill: 'Performance Management', level: 'advanced', yearsOfExperience: 4 },
                    { skill: 'Data Analysis', level: 'intermediate', yearsOfExperience: 2 }
                ],
                experience: [
                    {
                        position: 'BPO Team Leader',
                        company: 'Call Center Solutions',
                        startDate: new Date('2020-01-01'),
                        endDate: null,
                        description: 'Manage team of 15 customer service representatives'
                    }
                ],
                education: [
                    { degree: 'BS Business Administration', institution: 'Ateneo de Manila University', year: 2019 }
                ],
                applications: [
                    {
                        jobId: createdJobs[2]._id, // BPO Team Leader
                        matchScore: 91,
                        status: 'interview',
                        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
                    }
                ]
            },
            {
                firstName: 'Kristine',
                lastName: 'Lim',
                email: 'kristine.lim@email.com',
                phone: '+63 945 678 9012',
                location: 'Quezon City',
                skills: [
                    { skill: 'Welding (SMAW)', level: 'expert', yearsOfExperience: 2 },
                    { skill: 'Blueprint Reading', level: 'basic', yearsOfExperience: 1 }
                ],
                certifications: [
                    { name: 'TESDA NC II - Shielded Metal Arc Welding', issuer: 'TESDA', date: new Date('2022-06-15'), expiryDate: new Date('2025-06-15') },
                    { name: 'Construction Safety', issuer: 'OWWA', date: new Date('2022-03-01'), expiryDate: new Date('2024-03-01') }
                ],
                experience: [
                    {
                        position: 'Welder',
                        company: 'Construction Corp',
                        startDate: new Date('2022-01-01'),
                        endDate: null,
                        description: 'Perform welding operations for construction projects'
                    }
                ],
                education: [
                    { degree: 'High School Diploma', institution: 'Quezon City High School', year: 2021 }
                ],
                applications: [
                    {
                        jobId: createdJobs[4]._id, // TESDA Certified Welder
                        matchScore: 85,
                        status: 'new',
                        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
                    }
                ]
            }
        ];

        const createdApplicants = await Applicant.insertMany(applicants);
        console.log(`✅ Created ${createdApplicants.length} applicants`);

        // Update jobs with applicant references
        await Job.findByIdAndUpdate(createdJobs[0]._id, { $push: { applications: createdApplicants[0]._id } });
        await Job.findByIdAndUpdate(createdJobs[1]._id, { $push: { applications: createdApplicants[1]._id } });
        await Job.findByIdAndUpdate(createdJobs[2]._id, { $push: { applications: createdApplicants[2]._id } });
        await Job.findByIdAndUpdate(createdJobs[4]._id, { $push: { applications: createdApplicants[3]._id } });

        // Seed Training Programs
        console.log('🎓 Seeding training programs...');
        const trainings = [
            {
                title: 'TESDA Web Development NC II',
                category: 'TESDA Certified',
                description: 'Comprehensive web development training covering HTML, CSS, JavaScript, and PHP. Includes hands-on projects and industry-standard practices.',
                duration: 240, // hours
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                endDate: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000), // 60 days from start
                locationType: 'In-Person',
                location: 'Makati Training Center',
                provider: 'TESDA',
                status: 'active',
                completionRate: 83,
                certificationsIssued: 45
            },
            {
                title: 'TESDA Shielded Metal Arc Welding NC II Refresher',
                category: 'TESDA Certified',
                description: 'Refresher course for SMAW welding techniques. Perfect for welders looking to renew their certification or improve their skills.',
                duration: 120,
                startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000),
                locationType: 'In-Person',
                location: 'Quezon City Training Center',
                provider: 'TESDA',
                status: 'active',
                completionRate: 90,
                certificationsIssued: 120
            },
            {
                title: 'OWWA Construction Safety Course',
                category: 'OWWA Program',
                description: 'Online safety certification course for construction workers. Covers OSHA standards, hazard identification, and safety protocols.',
                duration: 40,
                startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
                locationType: 'Online',
                location: 'Online Platform',
                provider: 'OWWA',
                status: 'active',
                completionRate: 75,
                certificationsIssued: 200
            },
            {
                title: 'React & Node.js Bootcamp',
                category: 'Technology',
                description: 'Intensive bootcamp covering modern web development with React and Node.js. Includes real-world projects and portfolio building.',
                duration: 160,
                startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
                locationType: 'Hybrid',
                location: 'Manila Tech Hub',
                provider: 'Tech Academy',
                status: 'active',
                completionRate: 88,
                certificationsIssued: 65
            },
            {
                title: 'UI/UX Design Fundamentals',
                category: 'Design',
                description: 'Learn the fundamentals of user interface and user experience design. Covers design principles, prototyping, and user research.',
                duration: 80,
                startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
                locationType: 'Online',
                location: 'Online Platform',
                provider: 'Design Institute',
                status: 'active',
                completionRate: 82,
                certificationsIssued: 150
            }
        ];

        const createdTrainings = await Training.insertMany(trainings);
        console.log(`✅ Created ${createdTrainings.length} training programs`);

        // Add some applicants as enrollees to training programs
        await Training.findByIdAndUpdate(createdTrainings[0]._id, { $push: { enrollees: createdApplicants[1]._id } }); // Maria to Web Dev
        await Training.findByIdAndUpdate(createdTrainings[3]._id, { $push: { enrollees: createdApplicants[0]._id } }); // Juan to React Bootcamp

        console.log('\n✅ Database seeding completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   - Jobs: ${createdJobs.length}`);
        console.log(`   - Applicants: ${createdApplicants.length}`);
        console.log(`   - Training Programs: ${createdTrainings.length}`);
        console.log(`\n💡 You can now log in with:`);
        console.log(`   Email: techcorp@example.com`);
        console.log(`   Password: password123`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seed function
seedDatabase();

