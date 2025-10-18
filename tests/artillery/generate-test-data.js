/**
 * Generate Test Data for Artillery Load Tests
 * Creates realistic test users, jobs, and scenarios
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  users: {
    clients: 500,
    freelancers: 1000,
    total: 1500
  },
  jobs: {
    count: 5000,
    categories: ['Development', 'Design', 'Writing', 'Marketing', 'Admin Support', 'Customer Service'],
    skills: {
      Development: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'PHP', 'Ruby', 'Go'],
      Design: ['Photoshop', 'Illustrator', 'Figma', 'UI/UX', 'Branding', '3D Modeling'],
      Writing: ['Copywriting', 'Technical Writing', 'Content Strategy', 'SEO', 'Editing'],
      Marketing: ['Social Media', 'Email Marketing', 'SEO', 'PPC', 'Analytics'],
      'Admin Support': ['Data Entry', 'Excel', 'Email Management', 'Scheduling'],
      'Customer Service': ['Communication', 'Problem Solving', 'CRM', 'Chat Support']
    }
  }
};

/**
 * Generate random user
 */
function generateUser(id, type = 'freelancer') {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Jessica', 'Daniel', 'Ashley'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${id}`;
  const email = `${type}${id}@test.com`;
  
  return {
    id,
    email,
    password: 'TestPass123!',
    username,
    firstName,
    lastName,
    type,
    bio: `Experienced ${type} with ${Math.floor(Math.random() * 10) + 1} years in the field.`,
    phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    governmentId: `GOV${String(id).padStart(10, '0')}`
  };
}

/**
 * Generate random job posting
 */
function generateJob(id, posterId) {
  const category = CONFIG.jobs.categories[Math.floor(Math.random() * CONFIG.jobs.categories.length)];
  const skills = CONFIG.jobs.skills[category];
  const selectedSkills = skills
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 3) + 2);
  
  const titles = {
    Development: ['Build a Modern Web Application', 'API Development', 'Mobile App Development', 'Fix Bugs in React App'],
    Design: ['Logo Design', 'UI/UX Design for Mobile App', 'Brand Identity Package', 'Website Redesign'],
    Writing: ['Write Blog Posts', 'Technical Documentation', 'Product Descriptions', 'Email Campaign Copy'],
    Marketing: ['Social Media Campaign', 'SEO Optimization', 'Email Marketing Strategy', 'PPC Ad Management'],
    'Admin Support': ['Data Entry Project', 'Email Management', 'Calendar Scheduling', 'Document Organization'],
    'Customer Service': ['Live Chat Support', 'Email Support', 'Customer Onboarding', 'Help Desk Management']
  };
  
  const title = titles[category][Math.floor(Math.random() * titles[category].length)];
  const budget = Math.floor(Math.random() * 4900) + 100;
  const durations = ['1 day', '3 days', '1 week', '2 weeks', '1 month', '3 months'];
  const duration = durations[Math.floor(Math.random() * durations.length)];
  
  const description = `
We are looking for a talented ${category.toLowerCase()} professional to help us with ${title.toLowerCase()}.

**Requirements:**
${selectedSkills.map(skill => `- Proficiency in ${skill}`).join('\n')}
- Strong communication skills
- Ability to meet deadlines
- Portfolio or previous work samples

**Project Details:**
This project requires ${duration} to complete. We expect high-quality work and regular updates throughout the project lifecycle.

**Budget:**
Our budget for this project is $${budget}.

**What We Offer:**
- Clear project requirements
- Timely payments through escrow
- Potential for ongoing work
- 5-star review for quality work

Please submit your proposal with relevant portfolio samples and estimated timeline.
  `.trim();
  
  return {
    id,
    posterId,
    title,
    description,
    category,
    budget,
    duration,
    skills: selectedSkills,
    status: 'DRAFT',
    createdAt: new Date().toISOString()
  };
}

/**
 * Generate CSV file for Artillery
 */
function generateCSV(users, filename) {
  const headers = ['email', 'password', 'username', 'firstName', 'lastName'];
  const rows = users.map(user => 
    headers.map(key => user[key]).join(',')
  );
  
  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(filename, csv);
  console.log(`✅ Generated CSV: ${filename} (${users.length} users)`);
}

/**
 * Generate JSON file
 */
function generateJSON(data, filename) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`✅ Generated JSON: ${filename} (${data.length} records)`);
}

/**
 * Main execution
 */
function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ARTILLERY TEST DATA GENERATOR                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const outputDir = __dirname;
  
  // Generate users
  console.log('📊 Generating users...');
  const clients = Array.from({ length: CONFIG.users.clients }, (_, i) => 
    generateUser(i + 1, 'client')
  );
  const freelancers = Array.from({ length: CONFIG.users.freelancers }, (_, i) => 
    generateUser(i + 1, 'freelancer')
  );
  const allUsers = [...clients, ...freelancers];
  
  generateCSV(allUsers, path.join(outputDir, 'test-users.csv'));
  generateJSON(allUsers, path.join(outputDir, 'test-users.json'));
  
  // Generate jobs
  console.log('\n📊 Generating jobs...');
  const jobs = Array.from({ length: CONFIG.jobs.count }, (_, i) => {
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    return generateJob(i + 1, randomClient.id);
  });
  
  generateJSON(jobs, path.join(outputDir, 'test-jobs.json'));
  
  // Generate chat scenarios
  console.log('\n📊 Generating chat scenarios...');
  const chatPairs = [];
  for (let i = 0; i < 500; i++) {
    const user1 = allUsers[Math.floor(Math.random() * allUsers.length)];
    const user2 = allUsers[Math.floor(Math.random() * allUsers.length)];
    
    if (user1.id !== user2.id) {
      chatPairs.push({
        chatId: `chat-${i + 1}`,
        users: [user1.id, user2.id],
        messages: Math.floor(Math.random() * 100) + 10
      });
    }
  }
  
  generateJSON(chatPairs, path.join(outputDir, 'test-chat-pairs.json'));
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    GENERATION COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Generated:`);
  console.log(`   - ${clients.length} clients`);
  console.log(`   - ${freelancers.length} freelancers`);
  console.log(`   - ${jobs.length} jobs`);
  console.log(`   - ${chatPairs.length} chat pairs`);
  console.log(`\n📁 Files:`);
  console.log(`   - test-users.csv (for Artillery)`);
  console.log(`   - test-users.json`);
  console.log(`   - test-jobs.json`);
  console.log(`   - test-chat-pairs.json`);
  console.log(`\n🚀 Ready for load testing!`);
  console.log(`\nRun: artillery run load-test-auth.yml\n`);
}

// Execute
if (require.main === module) {
  main();
}

module.exports = { generateUser, generateJob, generateCSV, generateJSON };






