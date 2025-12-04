# Social Media Application

A complete social media backend application built with Node.js, Express, MongoDB, and JWT authentication.

## Features

### User Management
- ✅ User signup and login with JWT authentication
- ✅ User profile creation and updates
- ✅ Role-based access control (User, Admin, Owner)

### Social Features
- ✅ Create, read, update, and delete posts
- ✅ Like and unlike posts
- ✅ Follow and unfollow users
- ✅ Block and unblock users
- ✅ User feed (posts from non-blocked users)

### Activity Wall
- ✅ Track all user activities
- ✅ Display activities such as:
  - User made a post
  - User followed another user
  - User liked a post
  - User deleted by Admin/Owner
  - Post deleted by Admin/Owner

### Admin Features
- ✅ Delete user profiles
- ✅ Delete posts
- ✅ Remove likes from posts
- ✅ View all users and posts (including deleted)

### Owner Features
- ✅ All admin capabilities
- ✅ Create new admins
- ✅ Remove admin privileges
- ✅ View all admins

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Environment Variables:** dotenv
- **Process Manager:** Nodemon (development)
- **Package Manager:** Yarn

## Project Structure

```
assigment/
├── src/
│   ├── config/
│   │   └── database.js         # Database connection
│   ├── controllers/
│   │   ├── activityController.js
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── ownerController.js
│   │   ├── postController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication & authorization
│   │   └── error.js            # Error handling
│   ├── models/
│   │   ├── Activity.js         # Activity schema
│   │   ├── Post.js             # Post schema
│   │   ├── User.js             # User schema
│   │   └── index.js            # Models export
│   ├── routes/
│   │   ├── activities.js
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── owner.js
│   │   ├── posts.js
│   │   └── users.js
│   ├── utils/
│   │   ├── activityLogger.js   # Activity logging utility
│   │   └── auth.js             # Auth utility functions
│   └── server.js               # Main application file
├── .env.example                # Environment variables template
├── .gitignore
├── nodemon.json
├── package.json
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   cd assigment
   ```

2. **Install dependencies using Yarn**
   ```bash
   yarn install
   ```

3. **Create environment file**
   ```bash
   copy .env.example .env
   ```

4. **Configure environment variables**
   Edit `.env` file and update the following:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key for JWT
   - `PORT`: Server port (default: 5000)

5. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas

6. **Run the application**
   
   Development mode with Nodemon:
   ```bash
   yarn dev
   ```
   
   Production mode:
   ```bash
   yarn start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### User Routes (`/api/users`)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user profile by ID
- `PUT /api/users/profile` - Update own profile
- `POST /api/users/:id/follow` - Follow a user
- `DELETE /api/users/:id/unfollow` - Unfollow a user
- `POST /api/users/:id/block` - Block a user
- `DELETE /api/users/:id/unblock` - Unblock a user

### Post Routes (`/api/posts`)
- `GET /api/posts` - Get all posts (feed)
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update own post
- `DELETE /api/posts/:id` - Delete own post
- `GET /api/posts/user/:userId` - Get user's posts
- `POST /api/posts/:id/like` - Like a post
- `DELETE /api/posts/:id/unlike` - Unlike a post

### Activity Routes (`/api/activities`)
- `GET /api/activities` - Get activity wall (paginated)
- `GET /api/activities/user/:userId` - Get user's activities

### Admin Routes (`/api/admin`)
*Requires Admin or Owner role*
- `GET /api/admin/users` - Get all users (including inactive)
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/posts` - Get all posts (including deleted)
- `DELETE /api/admin/posts/:id` - Delete post
- `DELETE /api/admin/posts/:postId/likes/:userId` - Remove like

### Owner Routes (`/api/owner`)
*Requires Owner role*
- `GET /api/owner/admins` - Get all admins
- `POST /api/owner/admins` - Create admin (body: { userId })
- `DELETE /api/owner/admins/:id` - Remove admin

## Request/Response Examples

### Signup
**Request:**
```json
POST /api/auth/signup
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "bio": "Hello, I'm John!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "bio": "Hello, I'm John!"
  }
}
```

### Create Post
**Request:**
```json
POST /api/posts
Authorization: Bearer <token>
{
  "content": "This is my first post!",
  "image": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "post_id",
    "author": {
      "_id": "user_id",
      "username": "johndoe",
      "profilePicture": ""
    },
    "content": "This is my first post!",
    "image": "https://example.com/image.jpg",
    "likes": [],
    "likesCount": 0,
    "createdAt": "2025-12-04T10:00:00.000Z"
  }
}
```

### Activity Wall
**Request:**
```json
GET /api/activities?page=1&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "activity_id",
      "type": "post_created",
      "actor": {
        "_id": "user_id",
        "username": "johndoe"
      },
      "message": "johndoe made a post",
      "createdAt": "2025-12-04T10:00:00.000Z"
    }
  ]
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## User Roles

1. **User (default):** Can create posts, like, follow, block users
2. **Admin:** User capabilities + delete users/posts/likes
3. **Owner:** Admin capabilities + create/remove admins

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Role-based authorization
- Input validation
- Error handling middleware
- Blocked user privacy (posts not visible)

## Database Models

### User Schema
- username, email, password
- bio, profilePicture
- role (user/admin/owner)
- followers, following, blockedUsers arrays
- isActive flag

### Post Schema
- author (User reference)
- content, image
- likes array, likesCount
- isDeleted flag, deletedBy, deletedAt

### Activity Schema
- type (post_created, post_liked, user_followed, etc.)
- actor (User reference)
- target (Post/User reference)
- message, metadata
- Auto-expires after 30 days

## Development

Run in development mode with auto-restart:
```bash
yarn dev
```

## Environment Variables

Required variables in `.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/social-media-app
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

## Error Handling

The API uses consistent error responses:
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Notes

- First user can be promoted to owner manually in database
- Activities auto-delete after 30 days (configurable)
- Soft delete for users (isActive flag)
- Soft delete for posts (isDeleted flag)
- Blocked users cannot see each other's content
- Admins cannot delete other admins (only owner can)

## License

ISC

## Author

Your Name
#   s o c i a l - a c t i v i t y  
 