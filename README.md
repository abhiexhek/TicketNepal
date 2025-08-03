# 🎫 TicketNepal

A modern event ticketing platform built with Next.js frontend and Spring Boot backend, featuring QR code generation, email notifications, and real-time seat management.

## 🌐 Live Demo

### Frontend Application
- **Primary URL**: [https://ticketnepal-frontend.onrender.com/](https://ticketnepal-frontend.onrender.com/)
- **Backend API**: [https://ticketnepal.onrender.com/](https://ticketnepal.onrender.com/)

> **Note**: The backend URL may show "unauthorized" when accessed directly - this is expected as it's an API endpoint.

## 🚀 Features

- **Event Management**: Create, update, and manage events with detailed information
- **Ticket Booking**: Real-time seat selection and booking system
- **QR Code Generation**: Unique QR codes for each ticket
- **Email Notifications**: Automated email confirmations and password reset
- **User Authentication**: JWT-based authentication system
- **Admin Dashboard**: Comprehensive admin panel for event management
- **Responsive Design**: Mobile-friendly interface
- **Image Upload**: Cloudinary integration for event images

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Context
- **Form Handling**: React Hook Form + Zod

### Backend
- **Framework**: Spring Boot 3.5.3
- **Language**: Java 17
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Email**: Spring Mail
- **File Storage**: Cloudinary
- **QR Code**: ZXing

## 📋 Prerequisites

Before running this project locally, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Java** (JDK 17 or higher)
- **Maven** (3.6 or higher)
- **Git**

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/abhiexhek/TicketNepal.git
cd TicketNepal
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd "Backend Ticket Nepal/Backend"
```

#### Create Environment File
Create a `.env` file in the backend root directory:

```env
# MongoDB Configuration
SPRING_DATA_MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/ticketnepal?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Email Configuration (Gmail Example)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_app_password

# Server Configuration
SERVER_PORT=8080

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Application Base URL
APP_BASE_URL=http://localhost:8080
```

#### Run the Backend
```bash
# Using Maven
mvn spring-boot:run

# Or using the Maven wrapper
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd "Frontend Ticket Nepal/TicketNepal"
```

#### Create Environment File
Create a `.env.local` file in the frontend root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# Optional: Cloudinary Configuration (if needed for local development)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

#### Install Dependencies
```bash
npm install
```

#### Run the Frontend
```bash
# Development mode
npm run dev

# Or build and start
npm run build
npm start
```

The frontend will start on `http://localhost:3000`

## 🐳 Docker Setup (Alternative)

If you prefer using Docker, you can run the entire application using Docker Compose:

```bash
# From the root directory
docker-compose up --build
```

This will start both services:
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`

## 📝 Environment Variables Explained

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_DATA_MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT token generation | `your_super_secret_key_here` |
| `SPRING_MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `SPRING_MAIL_PORT` | SMTP server port | `587` |
| `SPRING_MAIL_USERNAME` | Email username | `your_email@gmail.com` |
| `SPRING_MAIL_PASSWORD` | Email app password | `your_app_password` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080` |

## 🔐 Getting Required Credentials

### MongoDB Atlas
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string

### Gmail (for email notifications)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in your environment variables

### Cloudinary (for image uploads)
1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from the dashboard

## 🚀 Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Backend
```bash
mvn spring-boot:run  # Start development server
mvn clean install    # Clean and install dependencies
mvn test            # Run tests
```

## 📁 Project Structure

```
TicketNepal/
├── Backend Ticket Nepal/
│   └── Backend/
│       ├── src/main/java/com/ticketnepal/
│       │   ├── config/          # Configuration classes
│       │   ├── controller/       # REST controllers
│       │   ├── model/           # Entity models
│       │   ├── repository/      # Data access layer
│       │   ├── security/        # JWT and security config
│       │   ├── service/         # Business logic
│       │   └── util/           # Utility classes
│       └── src/main/resources/
│           └── application.properties
├── Frontend Ticket Nepal/
│   └── TicketNepal/
│       ├── src/
│       │   ├── app/            # Next.js app router pages
│       │   ├── components/     # React components
│       │   ├── context/        # React context providers
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/           # Utility functions
│       │   └── styles/        # Global styles
│       └── package.json
└── docker-compose.yml
```

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the frontend framework
- [Spring Boot](https://spring.io/projects/spring-boot) for the backend framework
- [MongoDB Atlas](https://www.mongodb.com/atlas) for the database
- [Cloudinary](https://cloudinary.com/) for image storage
- [Render](https://render.com/) for hosting

---

**Happy Coding! 🎉** 