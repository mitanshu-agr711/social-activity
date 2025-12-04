Social Media Backend

A complete social media backend application built with Node.js, Express, MongoDB, and JWT authentication.
It supports user interactions, role-based access, activity tracking, and admin/owner management.

Features
👤 User Management

User signup and login with JWT authentication

User profile creation and updates

Role-based access control:

user

admin

owner

🌐 Social Features

Create, read, update, and delete posts

Like and unlike posts

Follow and unfollow users

Block and unblock users

User feed showing posts from non-blocked users

📜 Activity Wall

Tracks important actions such as:

User created a post

User followed another user

User liked a post

User deleted by Admin/Owner

Post deleted by Admin/Owner

🛠 Admin Features

Delete user profiles (soft delete)

Delete posts (soft delete)

Remove likes from posts

View all users (including inactive) and all posts (including deleted)

👑 Owner Features

All admin capabilities

Create new admins

Remove admin privileges

View all admins

Tech Stack

Runtime: Node.js

Framework: Express.js

Database: MongoDB (Mongoose ODM)

Authentication: JWT (JSON Web Tokens)

Password Hashing: bcryptjs

Environment Management: dotenv

Dev Tooling: Nodemon

Package Manager: Yarn

Project Structure
assignment/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── controllers/
│   │   ├── activityController.js
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── ownerController.js
│   │   ├── postController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT auth & role-based authorization
│   │   └── error.js             # Global error handling
│   ├── models/
│   │   ├── Activity.js          # Activity schema
│   │   ├── Post.js              # Post schema
│   │   ├── User.js              # User schema
│   │   └── index.js             # Models export
│   ├── routes/
│   │   ├── activities.js
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── owner.js
│   │   ├── posts.js
│   │   └── users.js
│   ├── utils/
│   │   ├── activityLogger.js    # Activity logging helper
│   │   └── auth.js              # Auth utility functions (token, etc.)
│   └── server.js                # Application entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── nodemon.json
├── package.json
└── README.md

Installation & Setup

Clone the repository

git clone <repo-url>
cd assignment


Install dependencies

yarn install


Create environment file

cp .env.example .env


Configure environment variables

In .env:

PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/social-media-app
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d


Ensure MongoDB is running

Either locally, or

Use MongoDB Atlas and update MONGODB_URI.

Run the application

Development (with Nodemon):

yarn dev


Production:

yarn start

API Endpoints
🔐 Auth Routes (/api/auth)

POST /api/auth/signup – Register a new user

POST /api/auth/login – Login user

GET /api/auth/me – Get current logged-in user profile

👤 User Routes (/api/users)

GET /api/users – Get all users

GET /api/users/:id – Get user profile by ID

PUT /api/users/profile – Update own profile

POST /api/users/:id/follow – Follow a user

DELETE /api/users/:id/unfollow – Unfollow a user

POST /api/users/:id/block – Block a user

DELETE /api/users/:id/unblock – Unblock a user

📝 Post Routes (/api/posts)

GET /api/posts – Get all posts (feed)

POST /api/posts – Create a new post

GET /api/posts/:id – Get a single post

PUT /api/posts/:id – Update own post

DELETE /api/posts/:id – Delete own post

GET /api/posts/user/:userId – Get posts by a specific user

POST /api/posts/:id/like – Like a post

DELETE /api/posts/:id/unlike – Unlike a post

📊 Activity Routes (/api/activities)

GET /api/activities – Get activity wall (paginated)

GET /api/activities/user/:userId – Get activities of a specific user

🛡 Admin Routes (/api/admin)

Requires admin or owner role

GET /api/admin/users – Get all users (including inactive)

DELETE /api/admin/users/:id – Soft delete a user

GET /api/admin/posts – Get all posts (including deleted)

DELETE /api/admin/posts/:id – Soft delete a post

DELETE /api/admin/posts/:postId/likes/:userId – Remove a like from a post

👑 Owner Routes (/api/owner)

Requires owner role

GET /api/owner/admins – Get all admins

POST /api/owner/admins – Promote a user to admin

Body: { "userId": "<userId>" }

DELETE /api/owner/admins/:id – Remove admin privileges from a user

Request / Response Examples
🔐 Signup

Request

POST /api/auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "bio": "Hello, I'm John!"
}


Response

{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "bio": "Hello, I'm John!",
    "profilePicture": ""
  }
}

📝 Create Post

Request

POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is my first post!",
  "image": "https://example.com/image.jpg"
}


Response

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

📜 Activity Wall

Request

GET /api/activities?page=1&limit=20
Authorization: Bearer <token>


Response

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

Authentication

All protected routes require a JWT token in the Authorization header:

Authorization: Bearer <your_jwt_token>

User Roles

User (default):

Create posts, like posts

Follow/unfollow

Block/unblock users

Admin:

All user capabilities

Delete users (soft delete; cannot delete admins/owner)

Delete posts (soft delete)

Remove likes

Owner:

All admin capabilities

Create and remove admins

View all admins

Note: The first owner is typically created manually (e.g., via database update).

Security Features

Password hashing using bcryptjs

JWT-based authentication

Role-based authorization for protected routes

Consistent error handling

Block system:

Blocked users cannot see each other’s content or interact

Soft delete for:

Users (isActive flag)

Posts (isDeleted, deletedBy, deletedAt)

Database Models (Overview)
👤 User Schema

username, email, password

bio, profilePicture

role: user | admin | owner

followers: [ObjectId<User>]

following: [ObjectId<User>]

blockedUsers: [ObjectId<User>]

isActive: Boolean

Timestamps: createdAt, updatedAt

📝 Post Schema

author: ObjectId<User>

content, image

likes: [ObjectId<User>]

likesCount: Number

isDeleted: Boolean

deletedBy: ObjectId<User> (admin/owner)

deletedAt: Date

Timestamps: createdAt, updatedAt

📜 Activity Schema

type: e.g. post_created, post_liked, user_followed, user_deleted, post_deleted

actor: ObjectId<User>

target: ObjectId<User | Post>

targetModel: "User" or "Post"

message: String

metadata: Object (optional extra details)

Auto-expiration (e.g. after 30 days, if configured)

Timestamps: createdAt, updatedAt

Error Handling

All errors follow a consistent JSON format:

{
  "success": false,
  "message": "Error message here"
}

Notes

The first owner can be created manually by changing a user’s role to "owner" in the database.

Activities can be configured to auto-delete after 30 days.

Soft delete is used instead of hard delete for users and posts.

Blocked users are fully isolated from each other’s content.

License

ISC

Author

Mitanshu Agrawal
