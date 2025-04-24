# WhatsApp Clone Backend

A full-featured backend implementation for a WhatsApp-like messaging application with real-time capabilities.

## 🌟 Features

### Authentication

- User registration and login with JWT authentication
- Profile management (update profile, upload profile picture)
- Secure password handling with bcrypt
- Token blacklisting for logout

### Messaging

- Private and group chat support
- Message delivery status (sent, delivered, read)
- Media messaging (images, videos, documents, audio)
- Message deletion (for me/for everyone)
- Message reactions with emojis
- Message replies/threading
- Real-time typing indicators

### Contacts

- Contact request system (send, accept, reject)
- Contact blocking and unblocking
- Search for users with relationship status
- Notification for contact activities

### Notifications

- Real-time notification system
- Unread message counts
- Contact request notifications
- Notification clearing

### Multi-device

- Support for multiple devices per account
- Device registration and management
- Synchronized messaging across devices
- Online status across multiple devices

### Performance

- Redis caching for frequently accessed data
- Efficient cache invalidation
- Real-time event propagation
- Database optimizations

## 🛠️ Technology Stack

- **Node.js & Express.js**: Server framework
- **PostgreSQL**: Primary database
- **Prisma ORM**: Database access and migrations
- **Redis**: Caching and pub/sub for real-time events
- **Socket.io**: Real-time bidirectional communication
- **JWT**: Authentication token management
- **Cloudinary**: File storage for media messages
- **Multer**: File upload handling

## 📦 Database Schema

The application uses PostgreSQL with the following main entities:

- **User**: User account information
- **Chat**: Conversation container (private or group)
- **Message**: Individual messages with type support
- **MessageStatus**: Tracking message delivery status
- **Contact**: User relationships and status
- **MessageReaction**: Emoji reactions on messages
- **UserDevice**: Tracking multiple devices per user
- **ChatNotification**: Unread message counters

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- Redis
- Cloudinary account

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/whatsapp-clone-backend.git
   cd whatsapp-clone-backend
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_clone"

   # JWT
   JWT_SECRET="your-secret-key"

   # Redis
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   REDIS_PASSWORD="your-redis-password" # Optional
   REDIS_USERNAME="your-redis-username" # Optional

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Server
   PORT=8080
   ```

4. Run Prisma migrations

   ```
   npx prisma migrate dev
   ```

5. Start the server
   ```
   npm start
   ```

## 📌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/update-profile` - Update user profile
- `POST /api/auth/logout` - Logout user
- `DELETE /api/auth/delete-profile` - Delete user account

### Chats

- `POST /api/chats` - Create a new chat
- `GET /api/chats` - Get all user chats
- `GET /api/chats/:chatId` - Get a specific chat
- `POST /api/chats/:chatId/messages` - Send a message
- `GET /api/chats/:chatId/messages` - Get chat messages
- `DELETE /api/chats/messages/:messageId` - Delete a message
- `POST /api/chats/messages/:messageId/reactions` - React to a message
- `GET /api/chats/messages/:messageId/replies` - Get message replies
- `PATCH /api/chats/messages/:messageId/status` - Update message status
- `POST /api/chats/:chatId/messages/delivered` - Mark messages as delivered
- `POST /api/chats/:chatId/messages/read` - Mark messages as read

### Contacts

- `POST /api/contacts/request` - Send a contact request
- `PATCH /api/contacts/request/:contactId/accept` - Accept a contact request
- `DELETE /api/contacts/request/:contactId/reject` - Reject a contact request
- `POST /api/contacts/block` - Block a contact
- `PATCH /api/contacts/unblock/:contactId` - Unblock a contact
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/pending` - Get pending contact requests
- `GET /api/contacts/blocked` - Get blocked contacts
- `GET /api/contacts/search` - Search for users

### Notifications

- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/count` - Get total notification count
- `GET /api/notifications/all-counts` - Get all notification counts
- `POST /api/notifications/clear/:chatId` - Clear chat notifications
- `POST /api/notifications/mark-contacts-viewed` - Mark contact requests as viewed

## 🔌 Socket.io Events

### Client to Server

- `app-opened` - Emitted when the user opens the app
- `join-chat` - Join a specific chat room
- `leave-chat` - Leave a chat room
- `typing` - Indicate user is typing
- `register-device` - Register a new device
- `remove-device` - Remove a device
- `contact-request-sent` - Notify when contact request is sent

### Server to Client

- `new-message` - New message received
- `message-status-update` - Message status changed
- `message-reaction` - Message reaction added/removed
- `message-deleted` - Message was deleted
- `new-chat` - New chat created
- `user-typing` - User is typing in chat
- `new-contact-request` - New contact request received
- `contact-request-accepted` - Contact request was accepted
- `contact-request-rejected` - Contact request was rejected
- `blocked-by-contact` - User was blocked
- `unblocked-by-contact` - User was unblocked
- `notifications-cleared` - Notifications were cleared
- `contact-requests-viewed` - Contact requests were viewed
- `devices-updated` - Device list was updated
- `messages-delivered` - Messages were delivered

## 💡 Message Delivery Logic

Message delivery works in stages:

1. **Sent**: When a message is first sent, its status is set to `SENT`
2. **Delivered**:
   - When the recipient opens the app (through the `app-opened` event)
   - All undelivered messages are automatically marked as `DELIVERED`
   - This happens in the background without any manual action required
3. **Read**:
   - When the recipient opens a specific chat
   - All messages in that chat are marked as `READ`

This follows WhatsApp's behavior where messages are only marked as delivered when the recipient's app is opened.

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- Authentication uses JWT with token blacklisting for logout
- Routes are protected with authentication middleware
- Chat access is verified for each request
- Message reactions and deletions have proper access control

## 📋 Caching Strategy

The application uses Redis for efficient caching:

- User profiles: Cached for 1 hour
- Chat data: Basic chat info cached for 1 hour
- Messages: Recent messages cached for 1 hour
- Chat lists: User's chat list cached for 1 hour
- Contacts & Requests: Cached with appropriate TTLs
- Notification counts: Cached for 5 minutes
- Search results: Cached for 10 minutes

Cache invalidation happens automatically when the underlying data changes.

## 📱 Multi-device Support

The application supports multiple devices per user:

- Each device is registered with a unique device ID
- All devices receive the same real-time updates
- A user is considered online if any of their devices is active
- Last seen timestamp is updated when all devices are offline
- Device list can be managed through the socket connection

## ⚙️ Configuration Options

The application can be configured through environment variables:

- Database connection
- Redis connection
- JWT secret and expiration
- Cloudinary credentials
- File upload limits
- Server port

## 📊 Performance Considerations

- Use connection pooling for database access
- Implement pagination for message retrievals
- Cache frequently accessed data with Redis
- Use WebSockets for real-time updates instead of polling
- Implement proper indexes on database tables
- Use transactions for complex operations

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
