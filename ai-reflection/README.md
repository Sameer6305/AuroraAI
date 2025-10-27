# AI Reflection - Daily Mindfulness Tracker

A modern Next.js 15 application for daily reflection and AI-powered personal growth insights.

## 🌟 Features

- **Daily Reflection Form** - Structured form to capture your mood, gratitude, challenges, and goals
- **AI-Powered Insights** - Get personalized recommendations based on your reflections
- **Reflection History** - Track and review your personal growth journey over time
- **Dark Theme** - Beautiful dark mode interface for comfortable viewing
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Font:** Inter (Google Fonts)
- **Theme:** Dark mode enabled by default

## 📁 Project Structure

```
ai-reflection/
├── app/
│   ├── components/
│   │   └── Navigation.tsx      # Main navigation component
│   ├── daily-form/
│   │   └── page.tsx           # Daily reflection form page
│   ├── result/
│   │   └── page.tsx           # AI analysis results page
│   ├── history/
│   │   └── page.tsx           # Reflection history page
│   ├── globals.css            # Global styles with dark theme
│   ├── layout.tsx             # Root layout with Inter font
│   └── page.tsx               # Home page
├── public/                     # Static assets
├── .github/
│   └── copilot-instructions.md # Project setup documentation
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # TailwindCSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🛠️ Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Pages

### Home Page (`/`)
Landing page with overview of features and call-to-actions for each section.

### Daily Form (`/app/daily-form`)
Interactive form to capture:
- Daily mood selection
- Gratitude reflections
- Challenges faced
- Goals for tomorrow

### Results (`/app/result`)
Display AI-generated insights including:
- Mood summary with visual indicators
- Key insights and recommendations
- Actionable suggestions for personal growth

### History (`/app/history`)
View and filter past reflections with:
- Search functionality
- Mood filtering
- Detailed entry viewing
- Export capabilities

## 🎨 Design Features

- **Dark Theme:** Optimized for reduced eye strain with carefully chosen color palette
- **Inter Font:** Professional, highly readable Google Font
- **Responsive Layout:** Mobile-first design approach
- **Gradient Accents:** Modern gradient effects for visual appeal
- **Smooth Transitions:** Polished hover and interaction states

## 🔧 Configuration

### Dark Theme
The app uses a dark theme by default, configured in:
- `app/layout.tsx` - HTML class and body styling
- `app/globals.css` - CSS custom properties and theme colors

### TailwindCSS
Custom color scheme with gray-based dark palette:
- Background: `#0a0a0a`
- Foreground: `#ededed`
- Accent colors: Blue, Purple, Pink gradients

## 📦 Dependencies

### Production
- `next` (^16.0.0)
- `react` (^19.0.0)
- `react-dom` (^19.0.0)

### Development
- `typescript` (^5)
- `@types/node`, `@types/react`, `@types/react-dom`
- `tailwindcss`
- `eslint`, `eslint-config-next`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**Note:** This is a frontend template. For full AI functionality, you'll need to integrate with an AI service like OpenAI, Anthropic Claude, or similar.

