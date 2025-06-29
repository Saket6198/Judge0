# 🔥 Judge0 - Next-Gen Competitive Programming Platform

<div align="center">

![Judge0](https://img.shields.io/badge/Judge0-Powered-orange?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

**A modern competitive programming platform with AI-powered assistance**

</div>

---

## 🎯 Project Overview

**Judge0** is a full-stack competitive programming platform that combines traditional online judge functionality with modern AI assistance and multimedia learning features. Users can solve problems, get AI-powered hints, upload video solutions, and track their progress in a comprehensive coding environment.

---

## ⚡ Key Features

### 🔐 **Authentication System**
- **JWT Token Authentication** - Secure session management with HTTP-only cookies
- **Google OAuth Integration** - One-click sign-in with Google accounts
- **User Profile Management** - Track solved problems and view personal statistics

### � **AI-Powered Problem Generation & Assistance**
- **AI Problem Generator** - Create unlimited custom practice problems using AI
- **Contextual Chat Assistant** - Get hints and explanations while solving problems
- **Smart Problem Recommendations** - AI suggests problems based on your skill level

### 📝 **Problem Management**
- **Custom Problem Creation** - Build your own coding challenges with test cases
- **CRUD Operations** - Full admin panel for problem management
- **Multi-language Support** - Solutions in C++, Java, Python, JavaScript, and C
- **Advanced Test Case System** - Visible and hidden test cases with detailed feedback

### 🎥 **Video Solution System**
- **Upload Video Solutions** - Share your problem-solving approach and explanations via video
- **Cloudinary CDN Integration** - Fast, reliable video streaming and storage with automatic optimization
- **Video Management** - Upload, view, and delete video solutions for any problem with admin controls
- **Real-time Status Updates** - Instant feedback on upload progress and video availability
- **Video Player Integration** - Seamless video playback directly in the problem interface

### � **User Dashboard & Analytics**
- **Personal Statistics** - View total problems solved, difficulty breakdown
- **Progress Tracking** - Monitor your coding journey and improvement
- **Problem History** - Access all previously solved problems
- **Performance Metrics** - Detailed submission history and results

### 💻 **Advanced Code Editor**
- **Monaco Editor Integration** - Professional-grade code editing experience
- **Syntax Highlighting** - Support for multiple programming languages
- **Real-time Code Execution** - Instant feedback with detailed test results
- **Code Submission History** - Track all your submission attempts

### 🛠 **Admin Panel**
- **Problem Management** - Create, update, and delete problems
- **User Management** - Monitor user activities and statistics
- **Video Administration** - Manage video content across the platform
- **System Analytics** - Platform usage and performance insights

---

## 🏗️ Technical Architecture

### 📁 Project Structure

```
Judge0/
├── client/judge0/              # React Frontend
│   ├── src/
│   │   ├── pages/              # Application pages
│   │   ├── store/              # Redux state management
│   │   ├── utils/              # Utility functions
│   │   └── assets/             # Static assets
│   └── package.json
│
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── agents/             # AI problem generation
│   │   ├── config/             # Database configurations
│   │   ├── controllers/        # API controllers
│   │   ├── middleware/         # Authentication & security
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   └── utils/              # Helper utilities
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start Guide

### 📋 Prerequisites

```bash
node >= 18.0.0
npm or pnpm
mongodb >= 6.0
redis >= 7.0
```

### 🔑 Environment Setup

#### Server Environment (`.env`)

```env
# Database
MONGO_URI=mongodb://localhost:27017/judge0
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Judge0 API
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-rapidapi-key

# AI & Cloud Services
GOOGLE_AI_API_KEY=your-google-ai-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server
PORT=8000
```

#### Client Environment (`.env`)

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### ⚡ Installation & Launch

```bash
# Clone repository
git clone https://github.com/your-username/Judge0.git
cd Judge0

# Backend setup
cd server
npm install
npm run dev

# Frontend setup (new terminal)
cd ../client/judge0
npm install
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

---

## 📚 API Endpoints

### Authentication
```
POST /user/register     # User registration
POST /user/login        # User login
POST /user/google-auth  # Google OAuth login
POST /user/logout       # User logout
GET  /user/profile      # Get user profile
```

### Problems
```
GET    /problem/getAllProblem    # Get all problems
GET    /problem/problemById/:id  # Get specific problem
POST   /problem/create           # Create new problem (Admin)
PUT    /problem/update/:id       # Update problem (Admin)
DELETE /problem/delete/:id       # Delete problem (Admin)
GET    /problem/user             # Get user's solved problems
```

### Code Submission
```
POST /submission/submit/:id      # Submit code solution
GET  /submission/submittedProblem/:id  # Get submission history
POST /submission/run/:id         # Run code against test cases
```

### Video Management
```
GET    /video/create             # Get upload signature
POST   /video/save               # Save video metadata
DELETE /video/delete/:problemId  # Delete video
```

### AI Chat
```
POST /chat/problemSolver         # Get AI assistance for problems
```

### Problem Generation
```
POST /problemGenerator/createProblem  # Generate problems with AI
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Monaco Editor** - Code editing
- **DaisyUI + Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - Server framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **Redis** - Caching and sessions
- **JWT** - Authentication
- **Cloudinary** - Video/image storage
- **Google AI SDK** - AI integration
- **Judge0 API** - Code execution

---

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **Google OAuth2** integration
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **CORS** protection
- **Password encryption** with bcrypt
- **Secure file uploads** to Cloudinary

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by Saket Singh**

*Empowering competitive programmers with AI-assisted learning and video solutions*

</div>
