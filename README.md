# Social Media Management Dashboard

A comprehensive social media management dashboard built with Next.js 14, TypeScript, and MongoDB for centralized Meta platform management.

## 🌟 Features

### Core Functionality

- **Meta Business OAuth Authentication** - Secure authentication via Meta Business
- **Unified Page Management** - Connect and manage multiple Facebook & Instagram pages
- **Post Creation & Scheduling** - Create, edit, and schedule posts across platforms
- **Real-time Analytics** - Track engagement metrics (likes, comments, shares)
- **Review Management** - Aggregate and analyze reviews with sentiment analysis
- **Real-time Notifications** - Get instant updates via webhooks

### Dashboard Components

- **Analytics Dashboard** - Visual charts and metrics overview
- **Multi-page Switching** - Easy navigation between connected pages
- **Bulk Content Management** - Manage multiple posts efficiently
- **Engagement Tracking** - Monitor performance across all platforms
- **Sentiment Analysis** - AI-powered review sentiment classification

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Meta OAuth
- **UI Components**: Tailwind CSS, Headless UI, Heroicons
- **Charts**: Recharts
- **Real-time**: Webhooks for Meta platform updates

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth.js configuration
│   │   ├── meta/                   # Meta Graph API integration
│   │   ├── notifications/          # Notification management
│   │   ├── analytics/              # Dashboard analytics
│   │   └── webhooks/               # Real-time webhook handlers
│   ├── dashboard/                  # Dashboard pages
│   └── auth/                       # Authentication pages
├── components/
│   ├── dashboard/                  # Dashboard-specific components
│   ├── charts/                     # Chart components
│   ├── layout/                     # Layout components
│   └── providers/                  # Context providers
├── hooks/                          # Custom React hooks
├── lib/                           # Utility libraries
├── models/                        # MongoDB/Mongoose models
└── types/                         # TypeScript type definitions
```

## 🚀 Quick Start

### 1. Meta App Configuration

The app currently uses **basic permissions** (`email`, `public_profile`) which work without business verification. For full functionality, you'll need to upgrade to advanced permissions.

#### Basic Setup (Current)

✅ **Works immediately** - Basic OAuth login
❌ Cannot access Facebook/Instagram pages, posts, or insights

#### Advanced Setup (Required for full features)

To unlock the complete social media management functionality, you need:

1. **Business Verification** (Required)

   - Complete Meta Business Verification: https://developers.facebook.com/docs/development/release/business-verification
   - This typically takes 3-5 business days

2. **App Review** (Required for production)

   - Submit your app for review to get these permissions:
   - `pages_show_list` - List user's Facebook pages
   - `pages_read_engagement` - Read page engagement data
   - `pages_manage_posts` - Create/edit page posts
   - `business_management` - Business-level access
   - `instagram_basic` - Basic Instagram access
   - `instagram_manage_comments` - Manage Instagram comments
   - `instagram_content_publish` - Publish Instagram content

3. **Update Permissions** (After approval)
   ```typescript
   // In src/app/api/auth/[...nextauth]/route.ts
   scope: "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,business_management,instagram_basic,instagram_manage_comments,instagram_content_publish";
   ```

### 2. Environment Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or cloud)
- Meta Developer App with Business permissions

### Environment Setup

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd social-media-dashboard
npm install
```

2. **Configure environment variables:**
   Create `.env.local` with the following:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/social-media-dashboard

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Meta (Facebook) OAuth
META_CLIENT_ID=your-meta-app-id
META_CLIENT_SECRET=your-meta-app-secret

# Meta Graph API
META_GRAPH_API_VERSION=v18.0

# Encryption for tokens
CRYPTO_SECRET=your-crypto-secret-for-token-encryption

# Webhook verification
META_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
META_WEBHOOK_SECRET=your-webhook-secret
```

### Meta App Configuration

1. **Create Meta Developer App:**

   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app with "Business" type
   - Add Facebook Login and Instagram Basic Display products

2. **Configure OAuth:**

   - Set Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/meta`
   - Add required permissions:
     - `pages_show_list`
     - `pages_read_engagement`
     - `pages_manage_posts`
     - `pages_read_user_content`
     - `business_management`
     - `instagram_basic`
     - `instagram_manage_comments`
     - `instagram_manage_insights`

3. **Setup Webhooks:**
   - Configure webhook URL: `http://localhost:3000/api/webhooks/meta`
   - Subscribe to: `page`, `instagram`, `user`

### Database Setup

The application will automatically create the required collections. Ensure MongoDB is running and accessible via the connection string in your environment variables.

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

Access the application at `http://localhost:3000`

## 📊 Database Schema

### Core Models

- **User**: Meta user authentication and token storage
- **Page**: Connected Facebook/Instagram pages
- **Post**: Social media posts with engagement metrics
- **Review**: Page reviews with sentiment analysis
- **Notification**: Real-time user notifications

### Security Features

- **Token Encryption**: All access tokens encrypted at rest
- **Token Refresh**: Automatic refresh of expired tokens
- **Webhook Verification**: Secure webhook signature validation
- **Permission Management**: User-level permission tracking

## 🔌 API Integration

### Meta Graph API

- **User Authentication**: OAuth 2.0 flow with Meta Business
- **Page Management**: Fetch and sync connected pages
- **Post Operations**: Create, read, update posts
- **Analytics**: Retrieve engagement metrics and insights
- **Review Aggregation**: Fetch and process page reviews

### Real-time Updates

- **Webhook Handlers**: Process real-time updates from Meta
- **Notification System**: In-app and push notifications
- **Live Sync**: Automatic data synchronization

## 🎨 UI/UX Features

### Responsive Design

- **Mobile-first**: Optimized for all device sizes
- **Dark/Light Mode**: Automatic theme detection
- **Accessibility**: WCAG compliant components

### Interactive Components

- **Real-time Charts**: Engagement and sentiment visualization
- **Drag & Drop**: Content management interface
- **Live Notifications**: Toast and bell notifications
- **Loading States**: Smooth loading animations

## 🔒 Security

### Data Protection

- **Encrypted Storage**: Sensitive tokens encrypted
- **Secure Headers**: CSRF and XSS protection
- **Input Validation**: Server-side validation
- **Rate Limiting**: API request throttling

### Authentication

- **OAuth 2.0**: Industry-standard authentication
- **Session Management**: Secure session handling
- **Token Refresh**: Automatic token renewal
- **Permission Scopes**: Granular access control

## 📈 Performance

### Optimization

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js image optimization
- **Caching**: API response caching
- **Database Indexing**: Optimized MongoDB queries

### Monitoring

- **Error Handling**: Comprehensive error boundaries
- **Logging**: Structured application logging
- **Analytics**: Performance monitoring hooks

## 🚀 Deployment

### Production Configuration

1. **Environment Variables**: Update for production environment
2. **Database**: Configure production MongoDB instance
3. **Meta App**: Update OAuth redirect URLs for production domain
4. **Webhooks**: Configure production webhook endpoints

### Deployment Options

- **Vercel**: Recommended for Next.js applications
- **Docker**: Containerized deployment
- **Traditional Hosting**: VPS/dedicated server setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation
- Open an issue on GitHub
- Review the troubleshooting guide

## 🔮 Roadmap

### Upcoming Features

- **Multi-platform Support**: Twitter, LinkedIn integration
- **Advanced Analytics**: Custom reporting dashboard
- **Team Collaboration**: Multi-user workspace
- **Content Templates**: Reusable post templates
- **Automated Posting**: AI-powered content scheduling
- **Advanced Sentiment**: ML-based sentiment analysis

# social-media-management-tool
