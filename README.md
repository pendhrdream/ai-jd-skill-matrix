# AI Job Description → Skill Matrix

A Next.js application that transforms job descriptions into structured skill matrices using AI or deterministic fallback parsing.

## 🎯 Features

### Core Features (Must-Have)
- ✅ **Next.js App Router** with TypeScript and Tailwind CSS
- ✅ **Dual Extraction Methods**:
  - AI-powered extraction using OpenAI (when API key is available)
  - Deterministic fallback parser (works without any API key)
- ✅ **Zod Schema Validation** with human-readable error messages
- ✅ **Comprehensive Error Handling** with non-blocking UI feedback
- ✅ **Copy JSON Button** for easy export
- ✅ **Structured Output** including:
  - Job title and seniority level
  - Categorized skills (Frontend, Backend, DevOps, Web3, Other)
  - Must-have and nice-to-have requirements
  - Salary range with currency
  - Concise summary (≤60 words)

### Bonus Features
- ✅ **Streaming AI Responses** with SSE (Server-Sent Events)
- ✅ **Web3/Blockchain Detection** (Solidity, Wagmi, Viem, Merkle, Staking, etc.)
- ✅ **Unit Tests** for fallback parser with Jest
- ✅ **Beautiful UI** with modern design and UX best practices
- ✅ **Typing Indicator** during streaming analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-jd-skill-matrix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (optional)**
   ```bash
   # The app works WITHOUT an API key using fallback parser
   # To enable AI features, create a .env.local file:
   echo "OPENAI_API_KEY=your_api_key_here" > .env.local
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Usage

### Without AI API Key (Fallback Mode)
1. Paste any job description into the textarea
2. Click **"Quick Analysis"**
3. View structured results with categorized skills
4. Copy JSON output using the **"Copy JSON"** button

### With OpenAI API Key (AI Mode)
1. Set `OPENAI_API_KEY` in `.env.local`
2. Paste job description
3. Choose between:
   - **"Quick Analysis"**: Fast AI extraction
   - **"AI Streaming"**: Real-time streaming with progress updates
4. View enhanced AI-powered results

## 🏗️ Architecture

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── extract/route.ts         # Standard extraction endpoint
│   │   └── extract-stream/route.ts  # Streaming extraction endpoint
│   ├── page.tsx                      # Main UI component
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── lib/
│   ├── schema.ts                     # Zod schema definitions
│   ├── ai-adapter.ts                 # OpenAI integration with retry logic
│   ├── fallback-parser.ts            # Deterministic parser
│   └── __tests__/
│       └── fallback-parser.test.ts   # Unit tests
```

### Key Components

#### 1. Zod Schema (`src/lib/schema.ts`)
Defines and validates the skill matrix structure:
```typescript
{
  title: string
  seniority: "junior" | "mid" | "senior" | "lead" | "unknown"
  skills: {
    frontend: string[]
    backend: string[]
    devops: string[]
    web3: string[]
    other: string[]
  }
  mustHave: string[]
  niceToHave: string[]
  salary?: { currency, min?, max? }
  summary: string (≤60 words)
}
```

#### 2. AI Adapter (`src/lib/ai-adapter.ts`)
- Integrates with OpenAI GPT-4o-mini
- Automatic JSON validation
- Auto-retry on validation failures
- Graceful error handling

#### 3. Fallback Parser (`src/lib/fallback-parser.ts`)
- Regex-based extraction
- Keyword mapping for skills categorization
- 100+ skill keywords across 4 categories
- Salary range extraction with multiple currency support
- Seniority detection from context

#### 4. API Routes
- **`/api/extract`**: Standard POST endpoint
- **`/api/extract-stream`**: Streaming SSE endpoint
- Both routes support automatic fallback

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

### Test Coverage
- ✅ Skill extraction accuracy
- ✅ Seniority level detection
- ✅ Salary parsing (multiple formats and currencies)
- ✅ Empty input handling

## 🎨 UI Features

### Design
- Clean, modern interface with Tailwind CSS
- Responsive layout (mobile-friendly)
- Color-coded skill categories
- Loading states and animations
- Error handling with inline messages

### User Experience
- Two analysis modes (Quick vs Streaming)
- Real-time progress updates during streaming
- Copy-to-clipboard functionality
- Collapsible raw JSON view
- Method indicator (AI vs Fallback)
- Warning messages for fallback usage

## 🔧 Configuration

### Environment Variables
```bash
# Optional: OpenAI API Key
OPENAI_API_KEY=sk-...
# or
OPENAI_KEY=sk-...
```

### Supported Models
- Default: `gpt-4o-mini` (cost-effective, fast)
- Configurable in `src/lib/ai-adapter.ts`

## 📊 Skill Categories

### Frontend
React, Vue, Angular, Next.js, TypeScript, Tailwind, etc.

### Backend
Node.js, Python, Java, PostgreSQL, MongoDB, GraphQL, etc.

### DevOps
AWS, Azure, Docker, Kubernetes, Terraform, CI/CD, etc.

### Web3
Blockchain, Ethereum, Solidity, Web3.js, Wagmi, Viem, Smart Contracts, DeFi, NFT, etc.

### Other
Any skills not fitting above categories

## 🚨 Error Handling

1. **Network Errors**: Displayed with red alert banner
2. **Validation Errors**: Human-readable messages from Zod
3. **AI Failures**: Automatic fallback to deterministic parser
4. **Empty Input**: Prevents submission with inline validation

## 🔒 Security & Best Practices

- ✅ Server-side API key usage (never exposed to client)
- ✅ Input validation with Zod
- ✅ Type-safe TypeScript throughout
- ✅ Error boundaries and graceful degradation
- ✅ Rate limiting considerations (OpenAI)
- ✅ Environment variable separation

## 📈 Performance

- Fast deterministic fallback (< 100ms)
- AI extraction (~2-5 seconds)
- Streaming mode for better perceived performance
- Efficient regex-based parsing
- No unnecessary re-renders

## 🛠️ Development

### Scripts
```bash
npm run dev          # Development server with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm test             # Jest tests
```

### Adding New Skills
Edit `SKILL_KEYWORDS` in `src/lib/fallback-parser.ts`:
```typescript
const SKILL_KEYWORDS = {
  frontend: [..., 'new-framework'],
  // ...
};
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Deploy

### Environment Variables
- `OPENAI_API_KEY` (optional - app works without it)

## 📚 Dependencies

### Core
- `next`: 15.5.4 (App Router)
- `react`: 19.1.0
- `typescript`: ^5
- `zod`: ^4.1.12
- `openai`: ^6.2.0

### Development
- `jest`: ^30.2.0
- `@testing-library/jest-dom`: ^6.9.1
- `tailwindcss`: ^4

## 📄 License

MIT

---

**Note**: This application works without an API key using the fallback parser. AI features are optional.