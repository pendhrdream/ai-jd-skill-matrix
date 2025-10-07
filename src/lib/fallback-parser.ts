import { SkillMatrix } from './schema';

// Skill keyword mappings for deterministic parsing
const SKILL_KEYWORDS = {
  frontend: [
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby',
    'typescript', 'javascript', 'js', 'ts', 'html', 'css', 'scss', 'sass',
    'tailwind', 'bootstrap', 'material-ui', 'chakra', 'styled-components',
    'webpack', 'vite', 'parcel', 'rollup', 'babel', 'eslint', 'prettier',
    'jest', 'cypress', 'playwright', 'testing-library', 'storybook'
  ],
  backend: [
    'node.js', 'nodejs', 'express', 'fastify', 'koa', 'nest', 'nestjs',
    'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'spring boot',
    'c#', 'dotnet', '.net', 'asp.net', 'php', 'laravel', 'symfony',
    'ruby', 'rails', 'go', 'golang', 'rust', 'c++', 'c#',
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
    'graphql', 'rest', 'api', 'microservices', 'docker', 'kubernetes'
  ],
  devops: [
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
    'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci',
    'circleci', 'travis', 'vercel', 'netlify', 'heroku', 'digital ocean',
    'nginx', 'apache', 'linux', 'ubuntu', 'centos', 'debian',
    'monitoring', 'logging', 'prometheus', 'grafana', 'datadog', 'newrelic'
  ],
  web3: [
    'blockchain', 'ethereum', 'bitcoin', 'solidity', 'web3', 'defi', 'nft',
    'smart contract', 'smart contracts', 'metamask', 'wallet', 'walletconnect',
    'ipfs', 'polygon', 'arbitrum', 'optimism', 'layer 2', 'l2',
    'wagmi', 'viem', 'ethers', 'web3.js', 'hardhat', 'truffle', 'foundry',
    'merkle', 'merkle tree', 'staking', 'staking rewards', 'governance',
    'dao', 'dapp', 'dapps', 'cryptocurrency', 'crypto', 'token', 'tokens'
  ]
};

const SENIORITY_KEYWORDS = {
  junior: ['junior', 'jr', 'entry', 'entry-level', 'intern', 'internship', 'trainee'],
  mid: ['mid', 'middle', 'intermediate', '2-3 years', '2+ years', '3+ years'],
  senior: ['senior', 'sr', 'lead', 'principal', 'staff', '5+ years', '6+ years', '7+ years'],
  lead: ['lead', 'tech lead', 'team lead', 'engineering lead', 'principal', 'staff', 'architect']
};

// Currency symbols mapping (currently unused but kept for future enhancements)
// const CURRENCY_SYMBOLS = {
//   '$': 'USD',
//   '€': 'EUR',
//   '£': 'GBP',
//   'zł': 'PLN',
//   'PLN': 'PLN'
// };

export class FallbackParser {
  private text: string;

  constructor(text: string) {
    this.text = text.toLowerCase();
  }

  parse(): SkillMatrix {
    const title = this.extractTitle();
    const seniority = this.extractSeniority();
    const skills = this.extractSkills();
    const mustHave = this.extractMustHave();
    const niceToHave = this.extractNiceToHave();
    const salary = this.extractSalary();
    const summary = this.generateSummary();

    return {
      title,
      seniority,
      skills,
      mustHave,
      niceToHave,
      salary,
      summary
    };
  }

  private extractTitle(): string {
    // Look for common title patterns
    const titlePatterns = [
      /(?:position|role|job|title)[:\s]+([^\n\r]+)/i,
      /(?:looking for|seeking)[:\s]+([^\n\r]+)/i,
      /(?:we (?:are )?need|need)[:\s]+([^\n\r]+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = this.text.match(pattern);
      if (match && match[1]) {
        // Clean up the title by capitalizing properly
        const title = match[1].trim();
        return title.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    // Fallback: use first line or "Software Developer"
    const firstLine = this.text.split('\n')[0].trim();
    if (firstLine.length > 0) {
      // Capitalize the first line properly
      return firstLine.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'Software Developer';
  }

  private extractSeniority(): 'junior' | 'mid' | 'senior' | 'lead' | 'unknown' {
    // Check for lead first (most specific)
    for (const keyword of SENIORITY_KEYWORDS.lead) {
      if (this.text.includes(keyword)) {
        return 'lead';
      }
    }
    
    // Then check for senior
    for (const keyword of SENIORITY_KEYWORDS.senior) {
      if (this.text.includes(keyword)) {
        // Make sure it's not a "lead" disguised as senior
        if (!SENIORITY_KEYWORDS.lead.some(k => this.text.includes(k))) {
          return 'senior';
        }
      }
    }
    
    // Then check for mid
    for (const keyword of SENIORITY_KEYWORDS.mid) {
      if (this.text.includes(keyword)) {
        return 'mid';
      }
    }
    
    // Finally check for junior
    for (const keyword of SENIORITY_KEYWORDS.junior) {
      if (this.text.includes(keyword)) {
        return 'junior';
      }
    }
    
    return 'unknown';
  }

  private extractSkills() {
    const skills = {
      frontend: [] as string[],
      backend: [] as string[],
      devops: [] as string[],
      web3: [] as string[],
      other: [] as string[]
    };

    // Special case handling for specific keywords
    const specialCasing: Record<string, string> = {
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'nextjs': 'Next.js',
      'next.js': 'Next.js',
      'nestjs': 'NestJS',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'graphql': 'GraphQL',
      'aws': 'AWS',
      'gcp': 'GCP',
      'api': 'API',
      'css': 'CSS',
      'html': 'HTML',
      'js': 'JS',
      'ts': 'TS',
    };

    for (const [category, keywords] of Object.entries(SKILL_KEYWORDS)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(this.text)) {
          // Use special casing if available, otherwise capitalize first letter
          const normalizedKeyword = specialCasing[keyword.toLowerCase()] || 
            keyword.charAt(0).toUpperCase() + keyword.slice(1);
          
          if (!skills[category as keyof typeof skills].includes(normalizedKeyword)) {
            skills[category as keyof typeof skills].push(normalizedKeyword);
          }
        }
      }
    }

    return skills;
  }

  private extractMustHave(): string[] {
    const mustHavePatterns = [
      /(?:must have|required|mandatory|essential)[:\s]*([^.!?]+)/gi,
      /(?:requirements?)[:\s]*([^.!?]+)/gi
    ];

    const mustHave: string[] = [];
    
    for (const pattern of mustHavePatterns) {
      const matches = [...this.text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          const requirements = match[1].split(/[,;]/).map(req => req.trim());
          mustHave.push(...requirements.filter(req => req.length > 0));
        }
      }
    }

    return [...new Set(mustHave)]; // Remove duplicates
  }

  private extractNiceToHave(): string[] {
    const niceToHavePatterns = [
      /(?:nice to have|preferred|bonus|plus)[:\s]*([^.!?]+)/gi,
      /(?:would be nice|advantage)[:\s]*([^.!?]+)/gi
    ];

    const niceToHave: string[] = [];
    
    for (const pattern of niceToHavePatterns) {
      const matches = [...this.text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          const preferences = match[1].split(/[,;]/).map(pref => pref.trim());
          niceToHave.push(...preferences.filter(pref => pref.length > 0));
        }
      }
    }

    return [...new Set(niceToHave)]; // Remove duplicates
  }

  private extractSalary() {
    const salaryPatterns = [
      /\$(\d+(?:,\d{3})*(?:k|000)?)\s*[-–—]\s*\$?(\d+(?:,\d{3})*(?:k|000)?)/gi,
      /(\d+(?:,\d{3})*(?:k|000)?)\s*[-–—]\s*(\d+(?:,\d{3})*(?:k|000)?)\s*(?:usd|dollars?)/gi,
      /€(\d+(?:,\d{3})*(?:k|000)?)\s*[-–—]\s*€?(\d+(?:,\d{3})*(?:k|000)?)/gi,
      /£(\d+(?:,\d{3})*(?:k|000)?)\s*[-–—]\s*£?(\d+(?:,\d{3})*(?:k|000)?)/gi,
      /(\d+(?:,\d{3})*(?:k|000)?)\s*[-–—]\s*(\d+(?:,\d{3})*(?:k|000)?)\s*(?:eur|euros?|gbp|pounds?)/gi
    ];

    for (const pattern of salaryPatterns) {
      const match = this.text.match(pattern);
      if (match) {
        const fullMatch = match[0];
        const numbers = fullMatch.match(/\d+(?:,\d{3})*(?:k|000)?/g);
        
        if (numbers && numbers.length >= 2) {
          const min = this.parseSalaryNumber(numbers[0]);
          const max = this.parseSalaryNumber(numbers[1]);
          
          let currency: 'USD' | 'EUR' | 'PLN' | 'GBP' = 'USD';
          
          if (fullMatch.includes('€') || fullMatch.toLowerCase().includes('eur')) {
            currency = 'EUR';
          } else if (fullMatch.includes('£') || fullMatch.toLowerCase().includes('gbp')) {
            currency = 'GBP';
          } else if (fullMatch.toLowerCase().includes('pln')) {
            currency = 'PLN';
          }

          return { currency, min, max };
        }
      }
    }

    return undefined;
  }

  private parseSalaryNumber(numStr: string): number {
    const cleanNum = numStr.replace(/,/g, '');
    if (cleanNum.toLowerCase().includes('k')) {
      return parseInt(cleanNum.replace(/k/gi, '')) * 1000;
    }
    return parseInt(cleanNum);
  }

  private generateSummary(): string {
    const skills = this.extractSkills();
    const totalSkills = Object.values(skills).flat().length;
    const seniority = this.extractSeniority();
    
    const skillCategories = Object.entries(skills)
      .filter(([, skillList]) => skillList.length > 0)
      .map(([category]) => category)
      .join(', ');

    return `This ${seniority} position requires ${totalSkills} skills across ${skillCategories || 'various'} domains. ${this.extractMustHave().length > 0 ? 'Key requirements identified.' : 'Requirements to be clarified.'}`;
  }
}
