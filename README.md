# SkillMatch - AI-Powered Job & Skills Matching Portal

A comprehensive job matching platform that connects employers with qualified candidates through AI-powered matching and prescriptive analytics.

## Features

- **Employer Dashboard**: Manage job postings, review applicants, and track hiring metrics
- **AI-Powered Matching**: Intelligent skill matching between job requirements and candidate profiles
- **Prescriptive Analytics**: Data-driven insights for better hiring decisions
- **Training Programs**: Integration with TESDA and OWWA training programs
- **Applicant Management**: Comprehensive applicant tracking and status management

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   The `.env` file is already configured with the MongoDB connection string. If you need to modify it, edit the `.env` file:
   ```
   MONGODB_URI=mongodb+srv://skillmatchdb:5killm4tch@skillmatch-cluster.rt9ysnv.mongodb.net/skillmatch?retryWrites=true&w=majority
   PORT=3000
   JWT_SECRET=your-secret-key-change-this-in-production
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application:**
   
   Open your browser and navigate to:
   - http://localhost:3000 (Login page)
   - http://localhost:3000/employer (Dashboard)
   - http://localhost:3000/jobs (Job Postings)
   - http://localhost:3000/applicants (Applicants)
   - http://localhost:3000/training (Training Programs)
   - http://localhost:3000/analytics (Analytics & Reports)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new employer
- `POST /api/auth/login` - Login employer
- `GET /api/auth/me` - Get current employer (requires authentication)

### Jobs
- `GET /api/jobs` - Get all jobs for employer
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/stats/summary` - Get job statistics

### Applicants
- `GET /api/applicants` - Get all applicants
- `GET /api/applicants/job/:jobId` - Get applicants for specific job
- `GET /api/applicants/:id` - Get single applicant details
- `PUT /api/applicants/:id/status` - Update applicant status
- `GET /api/applicants/stats/summary` - Get applicant statistics

### Training
- `GET /api/training` - Get all training programs
- `GET /api/training/:id` - Get single training program
- `POST /api/training` - Create new training program
- `PUT /api/training/:id` - Update training program
- `DELETE /api/training/:id` - Delete training program
- `GET /api/training/stats/summary` - Get training statistics

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/insights` - Get prescriptive insights

### Employer
- `GET /api/employer/dashboard` - Get employer dashboard data

## Database Models

- **Employer**: Company information and authentication
- **Job**: Job postings with requirements and status
- **Applicant**: Candidate profiles with skills and applications
- **Training**: Training programs and enrollment data

## Project Structure

```
Prototype-SkillMatch/
├── SkillMatch/
│   ├── public/          # HTML files
│   ├── css/            # CSS files
│   └── js/             # JavaScript files
├── models/             # MongoDB models
├── routes/             # API routes
├── server.js           # Express server
├── package.json        # Dependencies
└── .env               # Environment variables
```

## Security Notes

- Change the JWT_SECRET in production
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Use HTTPS in production

## License

ISC
