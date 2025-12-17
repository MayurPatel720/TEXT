# 🎨 Textile Design AI - MVP

An AI-powered textile design generation platform built with Next.js, featuring authentication, credit-based usage, and Razorpay payment integration.

## ✨ Features

- 🎨 **AI-Powered Design Generation** - Generate textile designs using Replicate's Flux Kontext Fast model
- 🔐 **Authentication** - NextAuth with Google OAuth and email/password
- 💳 **Credit System** - Track and manage user credits
- 💰 **Payment Integration** - Razorpay for purchasing credits
- 📊 **Generation History** - View and manage all generated designs
- 🎯 **Production Ready** - Optimized build, security headers, and image optimization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Replicate API account
- (Optional) Google OAuth credentials
- (Optional) Razorpay account

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd textile-design-mvp/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp env.template .env.local
```

Edit `.env.local` with your credentials:
```env
# Required
REPLICATE_API_TOKEN=your-replicate-api-token
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your-mongodb-connection-string

# Optional
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_RAZORPAY_KEY=your-razorpay-key
RAZORPAY_SECRET=your-razorpay-secret
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Production Build

```bash
npm run build
npm start
```

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **AI**: Replicate API (Flux Kontext Fast)
- **Payment**: Razorpay
- **Deployment**: Vercel

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── api/             # API routes
│   ├── studio/          # Design studio page
│   ├── history/         # Generation history
│   └── layout.tsx       # Root layout
├── components/          # React components
├── lib/                 # Utilities
├── models/              # MongoDB models
├── types/               # TypeScript types
└── public/              # Static assets
```

## 🔑 Environment Variables

See [`env.template`](env.template) for all available environment variables and setup instructions.

### Generate NextAuth Secret
```bash
openssl rand -base64 32
```

## 🎯 Key Features

### Authentication
- Email/password registration and login
- Google OAuth integration
- Secure session management with JWT

### AI Generation
- Upload reference images
- Custom prompts for design variations
- Style strength control
- Multiple variations per generation
- Credit-based usage (1 credit per image)

### Credit System
- Track user credits in real-time
- Automatic deduction on generation
- Purchase credits via Razorpay
- Free credits on signup

### Generation History
- View all generated designs
- Download images
- Filter and search
- Pagination support

## 🔒 Security Features

- Security headers (X-Frame-Options, CSP, etc.)
- Input validation and sanitization
- Authentication required for API routes
- MongoDB injection protection
- HTTPS enforcement in production

## 🎨 API Routes

- `POST /api/generate` - Generate textile designs
- `GET /api/history` - Get generation history
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email your-email@example.com or open an issue.

---

Built with ❤️ using Next.js and AI
