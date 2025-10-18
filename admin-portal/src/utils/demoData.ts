/**
 * Qatar-Based Demo Data for Admin Portal
 * Realistic data for testing the Guild platform
 */

export interface DemoUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  company?: string;
  jobTitle?: string;
  skills: string[];
  guildCoins: number;
  rank: string;
  guild?: string;
  guildRole?: string;
  completedJobs: number;
  earnings: number;
  status: 'active' | 'suspended' | 'banned';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  joinDate: Date;
}

export interface DemoJob {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number | { min: number; max: number };
  clientName: string;
  clientCompany?: string;
  location: string;
  skills: string[];
  timeNeeded: string;
  isUrgent: boolean;
  status: string;
  adminStatus: 'pending_review' | 'approved' | 'rejected';
  createdAt: Date;
  offers?: Array<{
    freelancerName: string;
    amount: number;
    message: string;
    deliveryTime: string;
    createdAt: Date;
  }>;
}

export interface DemoGuild {
  id: string;
  name: string;
  description: string;
  guildMaster: string;
  memberCount: number;
  level: number;
  isActive: boolean;
  createdAt: Date;
  specialization: string;
}

/**
 * Generate realistic Qatar-based demo users
 */
export function generateDemoUsers(): DemoUser[] {
  return [
    {
      id: 'demo-user-1',
      fullName: 'Ahmed Al-Rashid',
      email: 'ahmed.alrashid@gmail.com',
      phoneNumber: '+974 5512 3456',
      location: 'West Bay, Doha',
      company: 'TechCorp Qatar',
      jobTitle: 'Senior Mobile Developer',
      skills: ['React Native', 'TypeScript', 'Firebase', 'Mobile UI/UX'],
      guildCoins: 300,
      rank: 'S',
      guild: 'Qatar Tech Masters',
      guildRole: 'Guild Master',
      completedJobs: 45,
      earnings: 15000,
      status: 'active',
      verificationStatus: 'verified',
      joinDate: new Date('2024-01-15')
    },
    {
      id: 'demo-user-2',
      fullName: 'Sarah Al-Mansouri',
      email: 'sarah.mansouri@qmail.qa',
      phoneNumber: '+974 5523 7890',
      location: 'Lusail City',
      company: 'HealthTech Solutions',
      jobTitle: 'UI/UX Designer',
      skills: ['Figma', 'Adobe XD', 'UI Design', 'Prototyping'],
      guildCoins: 300,
      rank: 'A',
      guild: 'Qatar Tech Masters',
      guildRole: 'Vice Master',
      completedJobs: 38,
      earnings: 12500,
      status: 'active',
      verificationStatus: 'verified',
      joinDate: new Date('2024-02-20')
    },
    {
      id: 'demo-user-3',
      fullName: 'Omar Al-Kuwari',
      email: 'omar.kuwari@outlook.com',
      phoneNumber: '+974 5534 5678',
      location: 'Al Rayyan',
      company: 'Qatar Properties Ltd',
      jobTitle: 'Digital Marketing Specialist',
      skills: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
      guildCoins: 300,
      rank: 'A',
      guild: 'Marketing Guild Qatar',
      guildRole: 'Member',
      completedJobs: 29,
      earnings: 9800,
      status: 'active',
      verificationStatus: 'verified',
      joinDate: new Date('2024-03-10')
    },
    {
      id: 'demo-user-4',
      fullName: 'Fatima Al-Thani',
      email: 'fatima.thani@gmail.com',
      phoneNumber: '+974 5545 9012',
      location: 'The Pearl-Qatar',
      jobTitle: 'Freelance Graphic Designer',
      skills: ['Graphic Design', 'Branding', 'Illustration', 'Adobe Suite'],
      guildCoins: 300,
      rank: 'B',
      guild: 'Design Guild Qatar',
      guildRole: 'Member',
      completedJobs: 22,
      earnings: 7200,
      status: 'active',
      verificationStatus: 'verified',
      joinDate: new Date('2024-04-05')
    },
    {
      id: 'demo-user-5',
      fullName: 'Khalid Al-Attiyah',
      email: 'khalid.attiyah@qmail.qa',
      phoneNumber: '+974 5556 3421',
      location: 'Aspire Zone, Doha',
      jobTitle: 'Full Stack Developer',
      skills: ['Node.js', 'React', 'MongoDB', 'AWS'],
      guildCoins: 300,
      rank: 'A',
      completedJobs: 31,
      earnings: 11400,
      status: 'active',
      verificationStatus: 'pending',
      joinDate: new Date('2024-05-12')
    },
    {
      id: 'demo-user-6',
      fullName: 'Maryam Al-Sulaiti',
      email: 'maryam.sulaiti@gmail.com',
      phoneNumber: '+974 5567 8901',
      location: 'Katara Cultural Village',
      jobTitle: 'Content Writer',
      skills: ['Arabic Content', 'English Content', 'Copywriting', 'Blogging'],
      guildCoins: 300,
      rank: 'B',
      completedJobs: 18,
      earnings: 5600,
      status: 'active',
      verificationStatus: 'verified',
      joinDate: new Date('2024-06-01')
    }
  ];
}

/**
 * Generate realistic Qatar-based demo jobs
 */
export function generateDemoJobs(): DemoJob[] {
  return [
    {
      id: 'demo-job-1',
      title: 'Mobile App Development for Real Estate Company',
      description: 'We need a React Native mobile app for our real estate business in Qatar. The app should include property listings, virtual tours, and booking system.',
      category: 'Mobile Development',
      budget: { min: 8000, max: 12000 },
      clientName: 'Abdullah Al-Baker',
      clientCompany: 'Qatar Properties Ltd',
      location: 'West Bay, Doha',
      skills: ['React Native', 'Firebase', 'Google Maps', 'Payment Integration'],
      timeNeeded: '2-3 months',
      isUrgent: false,
      status: 'open',
      adminStatus: 'pending_review',
      createdAt: new Date('2024-10-12'),
      offers: [
        {
          freelancerName: 'Ahmed Al-Rashid',
          amount: 10000,
          message: 'I have 5 years experience in React Native development with similar projects in Qatar.',
          deliveryTime: '2 months',
          createdAt: new Date('2024-10-13')
        }
      ]
    },
    {
      id: 'demo-job-2',
      title: 'UI/UX Design for Healthcare Platform',
      description: 'Looking for an experienced UI/UX designer to create a modern healthcare booking platform. Must understand Arabic and English interfaces.',
      category: 'UI/UX Design',
      budget: 5000,
      clientName: 'Dr. Nasser Al-Marri',
      clientCompany: 'HealthTech Solutions',
      location: 'Al Sadd, Doha',
      skills: ['Figma', 'Adobe XD', 'User Research', 'Arabic UI'],
      timeNeeded: '1 month',
      isUrgent: true,
      status: 'open',
      adminStatus: 'pending_review',
      createdAt: new Date('2024-10-13'),
      offers: [
        {
          freelancerName: 'Sarah Al-Mansouri',
          amount: 4800,
          message: 'I specialize in healthcare UI/UX design with bilingual interfaces.',
          deliveryTime: '3 weeks',
          createdAt: new Date('2024-10-13')
        },
        {
          freelancerName: 'Fatima Al-Thani',
          amount: 4500,
          message: 'Portfolio includes 3 healthcare platforms in Qatar.',
          deliveryTime: '4 weeks',
          createdAt: new Date('2024-10-14')
        }
      ]
    },
    {
      id: 'demo-job-3',
      title: 'SEO & Digital Marketing for E-commerce',
      description: 'Need a digital marketing expert to optimize our e-commerce website for Qatar market. Focus on Arabic SEO and local search optimization.',
      category: 'Digital Marketing',
      budget: { min: 3000, max: 4500 },
      clientName: 'Hamad Al-Thani',
      clientCompany: 'Qatar Online Store',
      location: 'Lusail',
      skills: ['SEO', 'Google Ads', 'Social Media Marketing', 'Arabic Content'],
      timeNeeded: '2 months',
      isUrgent: false,
      status: 'open',
      adminStatus: 'approved',
      createdAt: new Date('2024-10-10')
    },
    {
      id: 'demo-job-4',
      title: 'Videography for Corporate Event',
      description: 'Professional videographer needed for corporate event at Qatar National Convention Centre. Must have experience with high-profile events.',
      category: 'Videography',
      budget: 2500,
      clientName: 'Events Qatar',
      location: 'Qatar National Convention Centre',
      skills: ['Videography', 'Video Editing', 'Adobe Premiere', 'Event Coverage'],
      timeNeeded: '2 days',
      isUrgent: true,
      status: 'open',
      adminStatus: 'approved',
      createdAt: new Date('2024-10-11')
    },
    {
      id: 'demo-job-5',
      title: 'Arabic-English Translation for Legal Documents',
      description: 'Certified translator needed for legal contract translation. Must be certified by Qatar government.',
      category: 'Translation',
      budget: 1800,
      clientName: 'Legal Associates Qatar',
      location: 'Doha',
      skills: ['Arabic Translation', 'Legal Translation', 'Certified Translation'],
      timeNeeded: '1 week',
      isUrgent: false,
      status: 'open',
      adminStatus: 'rejected',
      createdAt: new Date('2024-10-09')
    }
  ];
}

/**
 * Generate demo guilds
 */
export function generateDemoGuilds(): DemoGuild[] {
  return [
    {
      id: 'demo-guild-1',
      name: 'Qatar Tech Masters',
      description: 'Elite technology professionals in Qatar specializing in software development and digital solutions.',
      guildMaster: 'Ahmed Al-Rashid',
      memberCount: 15,
      level: 5,
      isActive: true,
      createdAt: new Date('2024-01-10'),
      specialization: 'Technology & Software'
    },
    {
      id: 'demo-guild-2',
      name: 'Design Guild Qatar',
      description: 'Creative professionals focusing on UI/UX, graphic design, and branding for Qatar market.',
      guildMaster: 'Sarah Al-Mansouri',
      memberCount: 12,
      level: 4,
      isActive: true,
      createdAt: new Date('2024-02-15'),
      specialization: 'Design & Creative'
    },
    {
      id: 'demo-guild-3',
      name: 'Marketing Guild Qatar',
      description: 'Digital marketing experts helping businesses grow in Qatar and GCC region.',
      guildMaster: 'Omar Al-Kuwari',
      memberCount: 10,
      level: 3,
      isActive: true,
      createdAt: new Date('2024-03-01'),
      specialization: 'Marketing & Business'
    },
    {
      id: 'demo-guild-4',
      name: 'Qatar Freelance Alliance',
      description: 'General freelancers across multiple disciplines supporting local businesses.',
      guildMaster: 'Khalid Al-Attiyah',
      memberCount: 8,
      level: 2,
      isActive: true,
      createdAt: new Date('2024-04-20'),
      specialization: 'General Services'
    }
  ];
}

/**
 * Generate demo transactions
 */
export interface DemoTransaction {
  id: string;
  type: 'job_payment' | 'withdrawal' | 'deposit' | 'guild_fee';
  amount: number;
  currency: 'Guild Coins' | 'QAR';
  from: string;
  to: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  jobId?: string;
  jobTitle?: string;
}

export function generateDemoTransactions(): DemoTransaction[] {
  return [
    {
      id: 'demo-tx-1',
      type: 'job_payment',
      amount: 150,
      currency: 'Guild Coins',
      from: 'Abdullah Al-Baker',
      to: 'Ahmed Al-Rashid',
      status: 'completed',
      createdAt: new Date('2024-10-13'),
      jobId: 'demo-job-1',
      jobTitle: 'Mobile App Development'
    },
    {
      id: 'demo-tx-2',
      type: 'job_payment',
      amount: 120,
      currency: 'Guild Coins',
      from: 'Dr. Nasser Al-Marri',
      to: 'Sarah Al-Mansouri',
      status: 'completed',
      createdAt: new Date('2024-10-12'),
      jobId: 'demo-job-2',
      jobTitle: 'UI/UX Design for Healthcare'
    },
    {
      id: 'demo-tx-3',
      type: 'deposit',
      amount: 300,
      currency: 'Guild Coins',
      from: 'System',
      to: 'Omar Al-Kuwari',
      status: 'completed',
      createdAt: new Date('2024-10-11')
    }
  ];
}

/**
 * PSP Provider options
 */
export const PSP_PROVIDERS = [
  { id: 'stripe', name: 'Stripe', description: 'Global payment processing', setupFee: 0, transactionFee: 2.9 },
  { id: 'paypal', name: 'PayPal', description: 'Trusted worldwide payments', setupFee: 0, transactionFee: 3.4 },
  { id: 'square', name: 'Square', description: 'All-in-one payment solution', setupFee: 0, transactionFee: 2.6 },
  { id: 'checkout', name: 'Checkout.com', description: 'Enterprise payment gateway', setupFee: 0, transactionFee: 2.5 },
  { id: 'custom', name: 'Custom PSP', description: 'Your own payment provider', setupFee: 0, transactionFee: 0 }
];

/**
 * Qatar currency support
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'COINS', name: 'Guild Coins', symbol: '🪙' }
];

/**
 * Payment methods
 */
export const PAYMENT_METHODS = [
  { id: 'manual', name: 'Manual Payment', description: 'Admin manually distributes payments' },
  { id: 'bank_transfer', name: 'Bank Transfer', description: 'Direct bank transfers' },
  { id: 'card', name: 'Credit/Debit Card', description: 'Card payments via PSP' },
  { id: 'wallet', name: 'Digital Wallet', description: 'PayPal, Apple Pay, Google Pay' },
  { id: 'cash', name: 'Cash Payment', description: 'In-person cash payments' }
];

/**
 * Demo mode statistics
 */
export interface DemoStats {
  totalUsers: number;
  activeUsers: number;
  totalGuildCoins: number;
  totalTransactions: number;
  averageJobValue: number;
  conversionRate: number;
}

export function calculateDemoStats(users: DemoUser[], transactions: DemoTransaction[]): DemoStats {
  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalGuildCoins: users.reduce((sum, u) => sum + u.guildCoins, 0),
    totalTransactions: transactions.length,
    averageJobValue: transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
      : 0,
    conversionRate: 1.0
  };
}




