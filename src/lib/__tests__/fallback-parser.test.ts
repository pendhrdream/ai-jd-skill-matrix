import { FallbackParser } from '../fallback-parser';

describe('FallbackParser', () => {
  const sampleJobDescription = `
    Senior Full Stack Developer
    
    We are looking for a Senior Full Stack Developer with 5+ years of experience.
    
    Must have:
    - React, TypeScript, Node.js
    - PostgreSQL, MongoDB
    - AWS, Docker, Kubernetes
    - Smart contracts, Solidity, Web3
    
    Nice to have:
    - Next.js, Tailwind CSS
    - GraphQL, Redis
    - Blockchain experience
    
    Salary: $80,000 - $120,000 USD
  `;

  it('should extract skills correctly', () => {
    const parser = new FallbackParser(sampleJobDescription);
    const result = parser.parse();

    expect(result.title).toContain('Senior Full Stack Developer');
    expect(result.seniority).toBe('senior');
    
    // Check frontend skills
    expect(result.skills.frontend).toContain('React');
    expect(result.skills.frontend).toContain('TypeScript');
    
    // Check backend skills
    expect(result.skills.backend).toContain('Node.js');
    expect(result.skills.backend).toContain('PostgreSQL');
    expect(result.skills.backend).toContain('MongoDB');
    
    // Check devops skills
    expect(result.skills.devops).toContain('AWS');
    expect(result.skills.devops).toContain('Docker');
    expect(result.skills.devops).toContain('Kubernetes');
    
    // Check web3 skills
    expect(result.skills.web3).toContain('Smart contracts');
    expect(result.skills.web3).toContain('Solidity');
    expect(result.skills.web3).toContain('Web3');
    
    // Check salary extraction
    expect(result.salary).toEqual({
      currency: 'USD',
      min: 80000,
      max: 120000
    });
    
    // Check requirements
    expect(result.mustHave.length).toBeGreaterThan(0);
    expect(result.niceToHave.length).toBeGreaterThan(0);
    
    // Check summary
    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('should handle empty job description', () => {
    const parser = new FallbackParser('');
    const result = parser.parse();

    expect(result.title).toBe('Software Developer');
    expect(result.seniority).toBe('unknown');
    expect(result.skills.frontend).toEqual([]);
    expect(result.skills.backend).toEqual([]);
    expect(result.skills.devops).toEqual([]);
    expect(result.skills.web3).toEqual([]);
    expect(result.skills.other).toEqual([]);
  });

  it('should extract salary with different formats', () => {
    const salaryTests = [
      { input: 'Salary: $50k - $80k', expected: { currency: 'USD', min: 50000, max: 80000 } },
      { input: '€60,000 - €90,000', expected: { currency: 'EUR', min: 60000, max: 90000 } },
      { input: '£45,000 - £70,000', expected: { currency: 'GBP', min: 45000, max: 70000 } },
    ];

    salaryTests.forEach(({ input, expected }) => {
      const parser = new FallbackParser(input);
      const result = parser.parse();
      expect(result.salary).toEqual(expected);
    });
  });

  it('should detect seniority levels correctly', () => {
    const seniorityTests = [
      { input: 'Junior Developer position', expected: 'junior' },
      { input: 'Mid-level engineer with 3+ years', expected: 'mid' },
      { input: 'Senior Software Engineer', expected: 'senior' },
      { input: 'Lead Engineer position for tech lead', expected: 'lead' },
    ];

    seniorityTests.forEach(({ input, expected }) => {
      const parser = new FallbackParser(input);
      const result = parser.parse();
      expect(result.seniority).toBe(expected);
    });
  });
});
