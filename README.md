# Textile AI - AI-Powered Fabric Design Generator

> Transform reference images into professional, print-ready textile designs in seconds.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![AI](https://img.shields.io/badge/AI-Flux%20Dev-purple)

## ✨ Features

- **AI Style Transfer** - Upload reference fabric, generate matching designs
- **Instant Variations** - 4-8 unique variations in ~15 seconds
- **Print-Ready Output** - High resolution, professional quality
- **Premium Dark UI** - Apple/Google-level design aesthetics
- **Simple Workflow** - Upload → Describe → Generate → Download

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Add Your API Key

Create `.env.local` file:

```bash
# Copy the template
cp env.template .env.local
```

Edit `.env.local`:

```env
REPLICATE_API_TOKEN=r8_YOUR_API_TOKEN_HERE
```

**Get your API key:** [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
textile-design-mvp/
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Landing page (premium dark theme)
│   │   ├── studio/
│   │   │   └── page.tsx      # AI generation studio
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── route.ts  # Replicate API integration
│   │   ├── globals.css       # Premium design system
│   │   └── layout.tsx        # Root layout with SEO
│   ├── env.template          # Environment variables template
│   └── package.json
└── README.md
```

## 🎨 UI Pages

### Landing Page (`/`)
- Premium dark theme hero
- Feature highlights
- Pricing section
- Animations with Framer Motion

### Generation Studio (`/studio`)
- Drag & drop image upload
- Prompt input with suggestions
- Style strength slider
- Structure strength slider
- Variation count selector
- Real-time generation progress
- Results grid with selection
- Download functionality

## 🔌 API Integration

### Replicate Model

Using [fofr/style-transfer](https://replicate.com/fofr/style-transfer):

- **Cost:** ~$0.007 per image (~140 runs per $1)
- **Speed:** ~8 seconds per generation
- **Quality:** High-resolution output

### API Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `structure_image` | URL | Reference image for structure |
| `style_image` | URL | Reference image for style |
| `prompt` | string | Text description of desired output |
| `style_strength` | 0-1 | How much to match reference style |
| `structure_strength` | 0-1 | How much to preserve structure |
| `num_variations` | 2-8 | Number of designs to generate |

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REPLICATE_API_TOKEN` | Yes | Your Replicate API key |
| `NEXT_PUBLIC_SITE_URL` | No | Your domain for SEO |

## 💰 Pricing Model

| Plan | Price | Credits | Per Design |
|------|-------|---------|------------|
| Free | $0 | 5 | - |
| Pro | $29/mo | 100 | $0.29 |
| Enterprise | Custom | ∞ | Negotiated |

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 3, Custom dark theme
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **AI:** Replicate API (Flux Dev / Style Transfer)

## 📝 Demo Mode

Without a Replicate API key, the app runs in demo mode:
- Shows the full UI flow
- Returns the uploaded image as variations
- Helpful for testing the interface

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

### Docker

```bash
docker build -t textile-ai .
docker run -p 3000:3000 textile-ai
```

## 📄 License

MIT License - See LICENSE file

---

Built with ❤️ for textile professionals
