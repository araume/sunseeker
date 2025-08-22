# Sunseeker - File Looking Services

A modern web application with a Node.js backend and MongoDB Atlas integration for managing user requests.

## Features

- **User Request System**: Modal form for users to submit requests
- **Admin Dashboard**: Secure admin panel to monitor and manage requests
- **MongoDB Integration**: Persistent data storage with MongoDB Atlas
- **JWT Authentication**: Secure admin authentication system
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Auto-refresh functionality

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn package manager

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd sunseeker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server Port (optional, defaults to 3000)
PORT=3000
```

### 4. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Replace the `MONGODB_URI` in your `.env` file

### 5. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## Usage

### User Interface

1. Open `http://localhost:3000` in your browser
2. Click the "Request" button to open the form modal
3. Fill in your name, email, and message
4. Submit the form

### Admin Dashboard

1. Navigate to `http://localhost:3000/admin`
2. **First Time Setup**: Enter your desired username and password
   - This will create your admin account
   - Only one admin account can exist
3. **Subsequent Logins**: Use your credentials to access the dashboard
4. View, manage, and delete user requests
5. Use the logout button to end your session

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create admin account (first time only)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get admin profile (protected)

### Requests
- `POST /api/requests` - Submit new request (public)
- `GET /api/requests` - Get all requests (protected)
- `GET /api/requests/:id` - Get specific request (protected)
- `DELETE /api/requests/:id` - Delete request (protected)
- `GET /api/requests/stats/overview` - Get request statistics (protected)

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Cross-origin resource sharing protection

## File Structure

```
sunseeker/
├── models/
│   ├── Admin.js          # Admin user model
│   └── Request.js        # User request model
├── routes/
│   ├── auth.js           # Authentication routes
│   └── requests.js       # Request management routes
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── fonts/                # Custom fonts
├── index.html            # Main user interface
├── admin.html            # Admin dashboard
├── style.css             # Main styles
├── admin-style.css       # Admin styles
├── script.js             # Main JavaScript
├── admin.js              # Admin JavaScript
├── server.js             # Express server
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Server port number | No (default: 3000) |

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify your connection string in `.env`
   - Check if your IP is whitelisted in MongoDB Atlas
   - Ensure your database user has correct permissions

2. **JWT Secret Error**
   - Make sure `JWT_SECRET` is set in your `.env` file
   - Use a strong, random string for security

3. **Port Already in Use**
   - Change the `PORT` in your `.env` file
   - Or kill the process using the current port

### Getting Help

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check MongoDB Atlas connection

## License

ISC License
