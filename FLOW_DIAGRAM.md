# Application Flow Diagrams

## Table of Contents
1. [Overall Architecture](#overall-architecture)
2. [Request Flow](#request-flow)
3. [Authentication Flow](#authentication-flow)
4. [User Registration Flow](#user-registration-flow)
5. [Post Creation Flow](#post-creation-flow)
6. [Like Post Flow](#like-post-flow)
7. [Follow User Flow](#follow-user-flow)
8. [Block User Flow](#block-user-flow)
9. [Activity Wall Flow](#activity-wall-flow)
10. [Admin Operations Flow](#admin-operations-flow)
11. [Owner Operations Flow](#owner-operations-flow)
12. [Database Relationships](#database-relationships)

---

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser/App)                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP Requests
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS SERVER (PORT 5000)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      MIDDLEWARE LAYER                      │  │
│  │  • CORS                                                    │  │
│  │  • Body Parser (JSON)                                      │  │
│  │  • Authentication (JWT)                                    │  │
│  │  • Authorization (Role-based)                              │  │
│  │  • Error Handler                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                  │                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       ROUTES LAYER                         │  │
│  │  • /api/auth        - Authentication                       │  │
│  │  • /api/users       - User operations                      │  │
│  │  • /api/posts       - Post operations                      │  │
│  │  • /api/activities  - Activity wall                        │  │
│  │  • /api/admin       - Admin operations                     │  │
│  │  • /api/owner       - Owner operations                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                  │                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLERS LAYER                       │  │
│  │  • authController    - Login/Signup logic                  │  │
│  │  • userController    - User profile, follow, block         │  │
│  │  • postController    - CRUD posts, likes                   │  │
│  │  • activityController- Activity tracking                   │  │
│  │  • adminController   - Admin operations                    │  │
│  │  • ownerController   - Owner operations                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                  │                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      MODELS LAYER                          │  │
│  │  • User Model        - User schema & methods               │  │
│  │  • Post Model        - Post schema                         │  │
│  │  • Activity Model    - Activity schema                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                  │                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      UTILS LAYER                           │  │
│  │  • activityLogger    - Log activities                      │  │
│  │  • auth utilities    - Token generation                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Mongoose ODM
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MongoDB Database                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ users        │  │ posts        │  │ activities   │          │
│  │ collection   │  │ collection   │  │ collection   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

```
CLIENT REQUEST
      │
      ▼
┌──────────────────────┐
│  Express Server      │
│  (server.js)         │
└──────────────────────┘
      │
      ▼
┌──────────────────────┐
│  CORS Middleware     │◄─── Allows cross-origin requests
└──────────────────────┘
      │
      ▼
┌──────────────────────┐
│  Body Parser         │◄─── Parses JSON request body
└──────────────────────┘
      │
      ▼
┌──────────────────────┐
│  Route Matching      │◄─── Matches URL to route handler
└──────────────────────┘
      │
      ├─── Public Routes (No Auth Required)
      │    • POST /api/auth/signup
      │    • POST /api/auth/login
      │
      └─── Protected Routes (Auth Required)
           │
           ▼
      ┌──────────────────────┐
      │  Auth Middleware     │
      │  (protect)           │
      └──────────────────────┘
           │
           ├─── Check JWT Token
           │    • Extract from Authorization header
           │    • Verify token with JWT_SECRET
           │    • Decode user ID
           │
           ▼
      ┌──────────────────────┐
      │  Fetch User from DB  │
      └──────────────────────┘
           │
           ├─── User Found & Active?
           │    • Yes → Continue
           │    • No  → 401 Unauthorized
           │
           ▼
      ┌──────────────────────┐
      │  Authorization Check │◄─── Role-based (if needed)
      │  (isAdmin, isOwner)  │
      └──────────────────────┘
           │
           ▼
      ┌──────────────────────┐
      │  Controller Function │◄─── Execute business logic
      └──────────────────────┘
           │
           ▼
      ┌──────────────────────┐
      │  Database Operation  │◄─── Mongoose queries
      └──────────────────────┘
           │
           ▼
      ┌──────────────────────┐
      │  Response to Client  │◄─── JSON response
      └──────────────────────┘
           │
           ▼
      ┌──────────────────────┐
      │  Error Handler       │◄─── If any error occurs
      │  (error.js)          │
      └──────────────────────┘
```

---

## Authentication Flow

### User Signup Flow

```
CLIENT
  │
  │ POST /api/auth/signup
  │ Body: { username, email, password, bio }
  │
  ▼
┌─────────────────────────────────┐
│  authController.signup()        │
└─────────────────────────────────┘
  │
  ├─── 1. Validate Input
  │    • Check required fields
  │    • Email format validation
  │
  ├─── 2. Check if User Exists
  │    • Query: User.findOne({ $or: [{ email }, { username }] })
  │    • If exists → 400 "User already exists"
  │
  ├─── 3. Create User
  │    • User.create({ username, email, password, bio })
  │    • Password automatically hashed (pre-save hook)
  │
  ▼
┌─────────────────────────────────┐
│  User Model (User.js)           │
│  • Pre-save Hook                │
│  • bcrypt.hash(password, 10)    │
└─────────────────────────────────┘
  │
  ├─── 4. Generate JWT Token
  │    • jwt.sign({ id: user._id }, JWT_SECRET)
  │    • Token expires in 7 days
  │
  ▼
┌─────────────────────────────────┐
│  Response to Client             │
│  {                              │
│    success: true,               │
│    token: "jwt_token...",       │
│    user: { id, username, email, │
│            role, bio }          │
│  }                              │
└─────────────────────────────────┘
```

### User Login Flow

```
CLIENT
  │
  │ POST /api/auth/login
  │ Body: { email, password }
  │
  ▼
┌─────────────────────────────────┐
│  authController.login()         │
└─────────────────────────────────┘
  │
  ├─── 1. Validate Input
  │    • Check email and password present
  │
  ├─── 2. Find User
  │    • User.findOne({ email }).select('+password')
  │    • If not found → 401 "Invalid credentials"
  │
  ├─── 3. Check if Active
  │    • If !user.isActive → 401 "Account deactivated"
  │
  ├─── 4. Compare Password
  │    • bcrypt.compare(password, user.password)
  │    • If not match → 401 "Invalid credentials"
  │
  ├─── 5. Generate JWT Token
  │    • jwt.sign({ id: user._id }, JWT_SECRET)
  │
  ▼
┌─────────────────────────────────┐
│  Response to Client             │
│  {                              │
│    success: true,               │
│    token: "jwt_token...",       │
│    user: { ... }                │
│  }                              │
└─────────────────────────────────┘
  │
  │ Client stores token
  │ Uses in Authorization header: "Bearer <token>"
  │
```

---

## User Registration Flow

```
┌─────────────┐
│   CLIENT    │
└─────────────┘
       │
       │ 1. User fills signup form
       │    (username, email, password)
       │
       ▼
┌─────────────────────────────────┐
│  POST /api/auth/signup          │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Validation Checks              │
│  • All fields present?          │
│  • Valid email format?          │
│  • Username length 3-30 chars?  │
│  • Password min 6 chars?        │
└─────────────────────────────────┘
       │
       ├─── Invalid → 400 Error
       │
       ▼
┌─────────────────────────────────┐
│  Check Duplicate User           │
│  Query: { email } or {username} │
└─────────────────────────────────┘
       │
       ├─── Exists → 400 "Already exists"
       │
       ▼
┌─────────────────────────────────┐
│  Create User Document           │
│  • Hash password (bcrypt)       │
│  • Set role = 'user'            │
│  • Set isActive = true          │
│  • Initialize arrays:           │
│    - followers = []             │
│    - following = []             │
│    - blockedUsers = []          │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Save to MongoDB                │
│  users collection               │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Generate JWT Token             │
│  Payload: { id: user._id }      │
│  Expires: 7 days                │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Return Response                │
│  • 201 Created                  │
│  • Token                        │
│  • User data (without password) │
└─────────────────────────────────┘
```

---

## Post Creation Flow

```
CLIENT (Authenticated User)
  │
  │ POST /api/posts
  │ Headers: Authorization: Bearer <token>
  │ Body: { content: "Hello World!", image: "url" }
  │
  ▼
┌─────────────────────────────────┐
│  Auth Middleware                │
│  • Verify JWT token             │
│  • Load user (req.user)         │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  postController.createPost()    │
└─────────────────────────────────┘
  │
  ├─── 1. Validate Content
  │    • Check content is present
  │    • Max 1000 characters
  │
  ├─── 2. Create Post Document
  │    • author: req.user.id
  │    • content: req.body.content
  │    • image: req.body.image || ''
  │    • likes: []
  │    • likesCount: 0
  │    • isDeleted: false
  │
  ▼
┌─────────────────────────────────┐
│  Save to MongoDB                │
│  posts collection               │
└─────────────────────────────────┘
  │
  ├─── 3. Populate Author Details
  │    • Post.findById().populate('author')
  │
  ├─── 4. Log Activity
  │    • Type: 'post_created'
  │    • Actor: current user
  │    • Target: post._id
  │    • Message: "username made a post"
  │
  ▼
┌─────────────────────────────────┐
│  Create Activity Document       │
│  activities collection          │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Response to Client             │
│  {                              │
│    success: true,               │
│    data: {                      │
│      _id, author: {...},        │
│      content, image,            │
│      likes: [], likesCount: 0,  │
│      createdAt                  │
│    }                            │
│  }                              │
└─────────────────────────────────┘
```

---

## Like Post Flow

```
CLIENT (Authenticated User)
  │
  │ POST /api/posts/:postId/like
  │ Headers: Authorization: Bearer <token>
  │
  ▼
┌─────────────────────────────────┐
│  Auth Middleware                │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  postController.likePost()      │
└─────────────────────────────────┘
  │
  ├─── 1. Find Post
  │    • Post.findById(postId)
  │    • If not found → 404
  │
  ├─── 2. Check if Deleted
  │    • If isDeleted → 400 "Cannot like deleted post"
  │
  ├─── 3. Check Already Liked
  │    • If user.id in post.likes → 400 "Already liked"
  │
  ├─── 4. Check if Author Blocked
  │    • Get current user
  │    • If author in blockedUsers → 403 "Cannot like"
  │
  ├─── 5. Add Like
  │    • post.likes.push(user.id)
  │    • post.likesCount = post.likes.length
  │    • post.save()
  │
  ├─── 6. Log Activity
  │    • Type: 'post_liked'
  │    • Actor: current user
  │    • Target: post._id
  │    • Message: "username liked author's post"
  │
  ▼
┌─────────────────────────────────┐
│  Update Database                │
│  • Update post                  │
│  • Create activity              │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Response to Client             │
│  {                              │
│    success: true,               │
│    message: "Post liked",       │
│    likesCount: 1                │
│  }                              │
└─────────────────────────────────┘
```

---

## Follow User Flow

```
CLIENT (User A)
  │
  │ POST /api/users/:userId/follow
  │ (wants to follow User B)
  │
  ▼
┌─────────────────────────────────┐
│  Auth Middleware                │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  userController.followUser()    │
└─────────────────────────────────┘
  │
  ├─── 1. Find Target User (User B)
  │    • User.findById(userId)
  │    • If not found → 404
  │
  ├─── 2. Get Current User (User A)
  │    • User.findById(req.user.id)
  │
  ├─── 3. Validation Checks
  │    • Cannot follow yourself
  │    • Not already following
  │    • Not blocked by target
  │    • Not blocking target
  │
  ├─── 4. Update Following List (User A)
  │    • currentUser.following.push(userId)
  │    • currentUser.save()
  │
  ├─── 5. Update Followers List (User B)
  │    • targetUser.followers.push(currentUser.id)
  │    • targetUser.save()
  │
  ├─── 6. Log Activity
  │    • Type: 'user_followed'
  │    • Actor: User A
  │    • Target: User B
  │    • Message: "User A followed User B"
  │
  ▼
┌─────────────────────────────────┐
│  Database Updates               │
│  • User A: following array      │
│  • User B: followers array      │
│  • Activity document created    │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Response                       │
│  "You are now following User B" │
└─────────────────────────────────┘

RELATIONSHIP CREATED:
User A → follows → User B
User B ← followed by ← User A
```

---

## Block User Flow

```
CLIENT (User A)
  │
  │ POST /api/users/:userId/block
  │ (wants to block User B)
  │
  ▼
┌─────────────────────────────────┐
│  Auth Middleware                │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  userController.blockUser()     │
└─────────────────────────────────┘
  │
  ├─── 1. Find Target User (User B)
  │    • User.findById(userId)
  │    • If not found → 404
  │
  ├─── 2. Get Current User (User A)
  │    • User.findById(req.user.id)
  │
  ├─── 3. Validation Checks
  │    • Cannot block yourself
  │    • Not already blocked
  │
  ├─── 4. Add to Blocked List
  │    • currentUser.blockedUsers.push(userId)
  │
  ├─── 5. Remove from Following/Followers
  │    • User A: remove B from following/followers
  │    • User B: remove A from following/followers
  │
  ├─── 6. Save Both Users
  │    • currentUser.save()
  │    • targetUser.save()
  │
  ▼
┌─────────────────────────────────┐
│  Database Updates               │
│  • User A: blockedUsers array   │
│  • User A: following/followers  │
│  • User B: following/followers  │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Response                       │
│  "You have blocked User B"      │
└─────────────────────────────────┘

EFFECTS:
• User A cannot see User B's posts
• User B cannot see User A's posts
• Both are automatically unfollowed
• Cannot interact with each other
```

---

## Activity Wall Flow

```
CLIENT (Authenticated User)
  │
  │ GET /api/activities?page=1&limit=20
  │ Headers: Authorization: Bearer <token>
  │
  ▼
┌─────────────────────────────────┐
│  Auth Middleware                │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  activityController.            │
│  getActivityWall()              │
└─────────────────────────────────┘
  │
  ├─── 1. Get Current User
  │    • User.findById(req.user.id)
  │    • Get blockedUsers array
  │
  ├─── 2. Parse Pagination
  │    • page = req.query.page || 1
  │    • limit = req.query.limit || 50
  │    • skip = (page - 1) * limit
  │
  ├─── 3. Query Activities
  │    • Find where actor NOT in blockedUsers
  │    • Sort by createdAt (newest first)
  │    • Skip and limit for pagination
  │    • Populate actor, target, metadata
  │
  ▼
┌─────────────────────────────────┐
│  MongoDB Query                  │
│  Activity.find({                │
│    actor: { $nin: blockedUsers }│
│  })                             │
│  .populate('actor')             │
│  .populate('target')            │
│  .sort('-createdAt')            │
│  .limit(50)                     │
└─────────────────────────────────┘
  │
  ├─── 4. Count Total Activities
  │    • For pagination metadata
  │
  ▼
┌─────────────────────────────────┐
│  Response to Client             │
│  {                              │
│    success: true,               │
│    count: 20,                   │
│    total: 150,                  │
│    page: 1,                     │
│    pages: 8,                    │
│    data: [                      │
│      {                          │
│        type: "post_created",    │
│        actor: { username, ... },│
│        message: "ABC made post",│
│        createdAt: "..."         │
│      },                         │
│      {                          │
│        type: "user_followed",   │
│        message: "DEF followed..." │
│      },                         │
│      ...                        │
│    ]                            │
│  }                              │
└─────────────────────────────────┘

ACTIVITY TYPES SHOWN:
• post_created    - "ABC made a post"
• post_liked      - "PQR liked ABC's post"
• user_followed   - "DEF followed ABC"
• user_deleted    - "User deleted by 'Owner'"
• post_deleted    - "Post deleted by 'Admin'"
```

---

## Admin Operations Flow

### Delete User (Admin)

```
ADMIN USER
  │
  │ DELETE /api/admin/users/:userId
  │ Headers: Authorization: Bearer <admin_token>
  │
  ▼
┌─────────────────────────────────┐
│  Auth Middleware                │
│  • Verify token                 │
│  • Load admin user              │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Authorization Middleware       │
│  • Check role = 'admin' or      │
│    'owner'                      │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  adminController.deleteUser()   │
└─────────────────────────────────┘
  │
  ├─── 1. Find Target User
  │    • User.findById(userId)
  │    • If not found → 404
  │
  ├─── 2. Permission Checks
  │    • Cannot delete owner
  │    • Admin cannot delete admin
  │    • Only owner can delete admin
  │
  ├─── 3. Log Activity
  │    • Type: 'user_deleted'
  │    • Actor: target user
  │    • Message: "User deleted by 'Admin'"
  │    • Store deletedBy: admin.id
  │
  ├─── 4. Soft Delete User
  │    • user.isActive = false
  │    • user.save()
  │
  ▼
┌─────────────────────────────────┐
│  Database Updates               │
│  • User: isActive = false       │
│  • Activity: created            │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Response                       │
│  "User deleted successfully"    │
└─────────────────────────────────┘

EFFECTS:
• User cannot login (isActive = false)
• Data preserved (soft delete)
• Activity logged for transparency
```

### Delete Post (Admin)

```
ADMIN USER
  │
  │ DELETE /api/admin/posts/:postId
  │
  ▼
┌─────────────────────────────────┐
│  Auth + Authorization           │
│  (Admin or Owner)               │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  adminController.deletePost()   │
└─────────────────────────────────┘
  │
  ├─── 1. Find Post
  │    • Post.findById(postId)
  │    • Populate author
  │
  ├─── 2. Check if Already Deleted
  │    • If isDeleted → 400
  │
  ├─── 3. Log Activity
  │    • Type: 'post_deleted'
  │    • Actor: post author
  │    • Message: "Post deleted by 'Admin'"
  │
  ├─── 4. Soft Delete Post
  │    • post.isDeleted = true
  │    • post.deletedBy = admin.id
  │    • post.deletedAt = new Date()
  │    • post.save()
  │
  ▼
┌─────────────────────────────────┐
│  Database Updates               │
│  • Post: marked deleted         │
│  • Activity: created            │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Response                       │
│  "Post deleted successfully"    │
└─────────────────────────────────┘

EFFECTS:
• Post not visible in regular queries
• Data preserved for records
• Activity shows who deleted it
```

---

## Owner Operations Flow

### Create Admin

```
OWNER USER
  │
  │ POST /api/owner/admins
  │ Body: { userId: "user_id_to_promote" }
  │
  ▼
┌─────────────────────────────────┐
│  Auth Middleware                │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Owner Authorization            │
│  • Check role = 'owner'         │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  ownerController.createAdmin()  │
└─────────────────────────────────┘
  │
  ├─── 1. Validate Input
  │    • Check userId provided
  │
  ├─── 2. Find Target User
  │    • User.findById(userId)
  │    • If not found → 404
  │
  ├─── 3. Validation Checks
  │    • Cannot change owner role
  │    • Not already admin
  │
  ├─── 4. Promote User
  │    • user.role = 'admin'
  │    • user.save()
  │
  ▼
┌─────────────────────────────────┐
│  Database Update                │
│  • User: role = 'admin'         │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Response                       │
│  {                              │
│    success: true,               │
│    message: "User is now admin",│
│    data: { id, username,        │
│            email, role }        │
│  }                              │
└─────────────────────────────────┘

ADMIN PRIVILEGES GRANTED:
• Can delete users (except admins/owner)
• Can delete any post
• Can remove likes
• Can view all content
```

---

## Database Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        USER DOCUMENT                        │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                              │
│  username: String (unique)                                  │
│  email: String (unique)                                     │
│  password: String (hashed)                                  │
│  role: 'user' | 'admin' | 'owner'                          │
│  bio: String                                                │
│  profilePicture: String                                     │
│  isActive: Boolean                                          │
│  followers: [ObjectId] ──────────┐                         │
│  following: [ObjectId] ──────────┼─► References other Users│
│  blockedUsers: [ObjectId] ───────┘                         │
│  createdAt: Date                                            │
│  updatedAt: Date                                            │
└─────────────────────────────────────────────────────────────┘
           │
           │ One-to-Many
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                        POST DOCUMENT                        │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                              │
│  author: ObjectId ─────────────► References User           │
│  content: String                                            │
│  image: String                                              │
│  likes: [ObjectId] ────────────► References Users          │
│  likesCount: Number                                         │
│  isDeleted: Boolean                                         │
│  deletedBy: ObjectId ──────────► References User (Admin)   │
│  deletedAt: Date                                            │
│  createdAt: Date                                            │
│  updatedAt: Date                                            │
└─────────────────────────────────────────────────────────────┘
           │
           │ Triggers
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                     ACTIVITY DOCUMENT                       │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                              │
│  type: 'post_created' | 'post_liked' |                     │
│        'user_followed' | 'user_deleted' |                  │
│        'post_deleted'                                       │
│  actor: ObjectId ──────────────► References User           │
│  target: ObjectId ─────────────► References User or Post   │
│  targetModel: 'User' | 'Post'                              │
│  message: String                                            │
│  metadata: {                                                │
│    postContent: String                                      │
│    deletedBy: ObjectId ───────► References User            │
│  }                                                          │
│  createdAt: Date (auto-expires after 30 days)              │
│  updatedAt: Date                                            │
└─────────────────────────────────────────────────────────────┘

RELATIONSHIP SUMMARY:
═══════════════════════════════════════════════════════════════
• User → Post         : One-to-Many (author)
• User → User         : Many-to-Many (followers/following)
• User → Post         : Many-to-Many (likes)
• User → User         : Many-to-Many (blockedUsers)
• Activity → User     : Many-to-One (actor)
• Activity → User/Post: Many-to-One (target, polymorphic)
```

---

## Data Flow Example: Complete User Journey

```
1. USER SIGNUP
   ═══════════════════════════════════════════════
   POST /api/auth/signup
   ↓
   Create User Document (role='user', isActive=true)
   ↓
   Return JWT Token
   
   
2. USER LOGIN
   ═══════════════════════════════════════════════
   POST /api/auth/login
   ↓
   Verify credentials
   ↓
   Return JWT Token
   ↓
   Client stores token


3. CREATE POST
   ═══════════════════════════════════════════════
   POST /api/posts (with JWT)
   ↓
   Verify Token → Load User
   ↓
   Create Post Document (author=user._id)
   ↓
   Log Activity (type='post_created')
   ↓
   Return Post Data
   
   
4. ANOTHER USER LIKES POST
   ═══════════════════════════════════════════════
   POST /api/posts/:id/like (with JWT)
   ↓
   Verify Token → Load User
   ↓
   Check: not already liked, not blocked
   ↓
   Add user._id to post.likes[]
   ↓
   Increment post.likesCount
   ↓
   Log Activity (type='post_liked')
   ↓
   Return Success
   

5. ANOTHER USER FOLLOWS YOU
   ═══════════════════════════════════════════════
   POST /api/users/:yourId/follow (with JWT)
   ↓
   Verify Token → Load User (Follower)
   ↓
   Check: not already following, not blocked
   ↓
   Add your._id to follower.following[]
   ↓
   Add follower._id to your.followers[]
   ↓
   Log Activity (type='user_followed')
   ↓
   Return Success


6. VIEW ACTIVITY WALL
   ═══════════════════════════════════════════════
   GET /api/activities (with JWT)
   ↓
   Verify Token → Load User
   ↓
   Query Activities WHERE actor NOT IN user.blockedUsers
   ↓
   Return Activities:
   • "John made a post"
   • "Jane liked John's post"
   • "Mike followed John"
   
   
7. BLOCK A USER
   ═══════════════════════════════════════════════
   POST /api/users/:userId/block (with JWT)
   ↓
   Verify Token → Load User
   ↓
   Add userId to user.blockedUsers[]
   ↓
   Remove from following/followers (both ways)
   ↓
   Return Success
   
   EFFECT: Their posts won't appear in your feed
           Their activities won't appear in your wall
           You can't interact with each other


8. ADMIN DELETES POST
   ═══════════════════════════════════════════════
   DELETE /api/admin/posts/:id (with Admin JWT)
   ↓
   Verify Token → Load Admin User
   ↓
   Check role='admin' or 'owner'
   ↓
   Set post.isDeleted=true, post.deletedBy=admin._id
   ↓
   Log Activity (type='post_deleted', "Post deleted by 'Admin'")
   ↓
   Return Success
   
   EFFECT: Post hidden from regular queries
           Activity shows admin deleted it


9. OWNER CREATES ADMIN
   ═══════════════════════════════════════════════
   POST /api/owner/admins (with Owner JWT)
   ↓
   Verify Token → Load Owner User
   ↓
   Check role='owner'
   ↓
   Find user by userId
   ↓
   Set user.role='admin'
   ↓
   Return Success
   
   EFFECT: User gains admin privileges
```

---

## Middleware Processing Order

```
REQUEST RECEIVED
      │
      ▼
┌─────────────────────┐
│  1. CORS            │ → Allow cross-origin requests
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  2. Body Parser     │ → Parse JSON body
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  3. Route Handler   │ → Match URL to route
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  4. protect()       │ → Verify JWT token
│     (if required)   │ → Load user into req.user
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  5. authorize()     │ → Check role (if required)
│     (if required)   │ → admin, owner, etc.
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  6. Controller      │ → Execute business logic
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  7. Response        │ → Send JSON response
└─────────────────────┘
      │
      ▼ (if error occurs at any step)
┌─────────────────────┐
│  8. Error Handler   │ → Catch and format errors
└─────────────────────┘
```

---

## Key Design Patterns

### 1. **Soft Delete Pattern**
```
Instead of: DELETE FROM posts WHERE id = ?
We use:     UPDATE posts SET isDeleted=true WHERE id = ?

Benefits:
• Data preservation
• Audit trail
• Reversibility
• Compliance
```

### 2. **Activity Logging Pattern**
```
Every significant action triggers:
1. Main operation (create post, follow user, etc.)
2. Activity creation (for the activity wall)

This creates a complete audit trail
```

### 3. **Blocking Implementation**
```
Blocked users are filtered at query time:
• Posts: WHERE author NOT IN blockedUsers
• Activities: WHERE actor NOT IN blockedUsers

This ensures complete privacy
```

### 4. **Role-Based Access Control**
```
Hierarchy:
Owner (highest)
  → Can create/delete admins
  → All admin capabilities

Admin
  → Can delete users/posts
  → Cannot delete other admins
  
User (default)
  → Standard operations
```

---

## Summary

This application uses a **layered architecture** with clear separation of concerns:

1. **Routes** - Define API endpoints
2. **Middleware** - Handle authentication, authorization, validation
3. **Controllers** - Contain business logic
4. **Models** - Define data structure and database operations
5. **Utils** - Provide helper functions

The flow is always:
```
Request → Middleware → Controller → Model → Database
                                          ↓
Response ← Controller ← Model ← Database
```

Every user action is tracked in the activity wall for transparency, and privacy is maintained through the blocking system that filters content at the query level.
