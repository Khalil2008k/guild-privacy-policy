/**
 * Detox E2E Test: Complete Job Lifecycle
 * Tests: Post job → Submit offer → Accept → Complete → Review
 */

import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Job Lifecycle Flow', () => {
  
  beforeAll(async () => {
    await device.launchApp();
  });
  
  beforeEach(async () => {
    // Login as client
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    await element(by.id('input-email')).typeText('client1@test.com');
    await element(by.id('input-password')).typeText('TestPass123!');
    await element(by.id('btn-submit-signin')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });
  
  // Test 1: Post New Job
  it('should post a new job successfully', async () => {
    // Navigate to post job
    await element(by.id('btn-post-job')).tap();
    await waitFor(element(by.id('add-job-screen'))).toBeVisible();
    
    // Fill job title
    await element(by.id('input-job-title')).typeText('E2E Test Job - Mobile Development');
    
    // Fill description
    await element(by.id('input-job-description')).typeText(
      'Looking for an experienced mobile developer to build a React Native app. Must have 3+ years experience.'
    );
    
    // Select category
    await element(by.id('select-category')).tap();
    await element(by.text('Development')).tap();
    
    // Enter budget
    await element(by.id('input-budget')).typeText('2500');
    
    // Select duration
    await element(by.id('select-duration')).tap();
    await element(by.text('2 weeks')).tap();
    
    // Submit job
    await element(by.id('btn-submit-job')).tap();
    
    // Wait for success message
    await waitFor(element(by.text(/job.*posted|success/i)))
      .toBeVisible()
      .withTimeout(5000);
    
    // Should navigate to job details
    await waitFor(element(by.id('job-details-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });
  
  // Test 2: Browse Jobs
  it('should browse and filter jobs', async () => {
    // Navigate to jobs tab
    await element(by.id('tab-jobs')).tap();
    await waitFor(element(by.id('jobs-screen'))).toBeVisible();
    
    // Check jobs are displayed
    await detoxExpect(element(by.id('job-list'))).toBeVisible();
    
    // Apply filter
    await element(by.id('btn-filter')).tap();
    await waitFor(element(by.id('filter-modal'))).toBeVisible();
    
    await element(by.id('filter-category')).tap();
    await element(by.text('Development')).tap();
    
    await element(by.id('btn-apply-filter')).tap();
    
    // Verify filtered results
    await waitFor(element(by.id('job-list')))
      .toBeVisible()
      .withTimeout(3000);
  });
  
  // Test 3: Submit Offer (as Freelancer)
  it('should submit an offer to a job', async () => {
    // Logout and login as freelancer
    await element(by.id('tab-settings')).tap();
    await element(by.id('btn-logout')).tap();
    
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    await element(by.id('input-email')).typeText('freelancer1@test.com');
    await element(by.id('input-password')).typeText('TestPass123!');
    await element(by.id('btn-submit-signin')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    
    // Browse jobs
    await element(by.id('tab-jobs')).tap();
    await waitFor(element(by.id('jobs-screen'))).toBeVisible();
    
    // Tap on first job
    await element(by.id('job-card-0')).tap();
    await waitFor(element(by.id('job-details-screen'))).toBeVisible();
    
    // Submit offer
    await element(by.id('btn-submit-offer')).tap();
    await waitFor(element(by.id('offer-modal'))).toBeVisible();
    
    await element(by.id('input-offer-budget')).typeText('2000');
    await element(by.id('input-offer-timeline')).typeText('10 days');
    await element(by.id('input-offer-message')).typeText(
      'I have 5 years of React Native experience and can deliver this project on time.'
    );
    
    await element(by.id('btn-confirm-offer')).tap();
    
    // Wait for success
    await waitFor(element(by.text(/offer.*submitted/i)))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  // Test 4: Accept Offer (as Client)
  it('should accept an offer and create escrow', async () => {
    // Login as client
    await element(by.id('tab-settings')).tap();
    await element(by.id('btn-logout')).tap();
    
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    await element(by.id('input-email')).typeText('client1@test.com');
    await element(by.id('input-password')).typeText('TestPass123!');
    await element(by.id('btn-submit-signin')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    
    // Go to my jobs
    await element(by.id('tab-profile')).tap();
    await element(by.id('btn-my-jobs')).tap();
    await waitFor(element(by.id('my-jobs-screen'))).toBeVisible();
    
    // Tap on job with offers
    await element(by.id('job-with-offers-0')).tap();
    await waitFor(element(by.id('job-details-screen'))).toBeVisible();
    
    // View offers
    await element(by.id('btn-view-offers')).tap();
    await waitFor(element(by.id('offers-list'))).toBeVisible();
    
    // Accept first offer
    await element(by.id('btn-accept-offer-0')).tap();
    
    // Confirm acceptance
    await waitFor(element(by.id('confirm-accept-modal'))).toBeVisible();
    await element(by.id('btn-confirm-accept')).tap();
    
    // Wait for escrow creation
    await waitFor(element(by.text(/escrow.*created/i)))
      .toBeVisible()
      .withTimeout(10000);
    
    // Should navigate to payment screen
    await waitFor(element(by.id('payment-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });
  
  // Test 5: Submit Work (as Freelancer)
  it('should submit work deliverables', async () => {
    // Login as freelancer
    // (Assume job is already in progress)
    
    await element(by.id('tab-jobs')).tap();
    await element(by.id('tab-my-active-jobs')).tap();
    await waitFor(element(by.id('active-jobs-list'))).toBeVisible();
    
    // Tap on in-progress job
    await element(by.id('active-job-0')).tap();
    await waitFor(element(by.id('job-workspace-screen'))).toBeVisible();
    
    // Submit work
    await element(by.id('btn-submit-work')).tap();
    await waitFor(element(by.id('submit-work-modal'))).toBeVisible();
    
    await element(by.id('input-submission-message')).typeText(
      'All work has been completed as per requirements. Please review.'
    );
    
    // Upload file (simulated)
    await element(by.id('btn-attach-file')).tap();
    // Note: File picker would require native interaction
    
    await element(by.id('btn-confirm-submit')).tap();
    
    // Wait for success
    await waitFor(element(by.text(/work.*submitted/i)))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  // Test 6: Review Work & Release Payment (as Client)
  it('should review work and release escrow', async () => {
    // Login as client
    // (Assume work has been submitted)
    
    // Go to job details
    await element(by.id('tab-jobs')).tap();
    await element(by.id('tab-my-jobs')).tap();
    await element(by.id('job-pending-review-0')).tap();
    await waitFor(element(by.id('job-review-screen'))).toBeVisible();
    
    // View submitted work
    await element(by.id('btn-view-deliverables')).tap();
    await waitFor(element(by.id('deliverables-list'))).toBeVisible();
    
    // Approve work
    await element(by.id('btn-approve-work')).tap();
    
    // Confirm release
    await waitFor(element(by.id('confirm-release-modal'))).toBeVisible();
    await element(by.id('btn-confirm-release')).tap();
    
    // Wait for payment release
    await waitFor(element(by.text(/payment.*released/i)))
      .toBeVisible()
      .withTimeout(10000);
    
    // Should prompt for review
    await waitFor(element(by.id('review-modal'))).toBeVisible();
    
    // Leave review
    await element(by.id('rating-5-stars')).tap();
    await element(by.id('input-review-text')).typeText('Excellent work! Very professional.');
    await element(by.id('btn-submit-review')).tap();
    
    // Wait for success
    await waitFor(element(by.text(/review.*submitted/i)))
      .toBeVisible()
      .withTimeout(3000);
  });
  
  // Test 7: Job Search
  it('should search for jobs with keywords', async () => {
    await element(by.id('tab-jobs')).tap();
    await waitFor(element(by.id('jobs-screen'))).toBeVisible();
    
    // Tap search bar
    await element(by.id('input-search')).tap();
    await element(by.id('input-search')).typeText('React Native');
    
    // Wait for search results
    await waitFor(element(by.id('search-results')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Verify results contain search term
    await detoxExpect(element(by.text(/React Native/i))).toBeVisible();
  });
  
  // Test 8: Infinite Scroll
  it('should load more jobs on scroll', async () => {
    await element(by.id('tab-jobs')).tap();
    await waitFor(element(by.id('jobs-screen'))).toBeVisible();
    
    // Get initial job count
    // Scroll to bottom
    await element(by.id('job-list')).scrollTo('bottom');
    
    // Wait for loading indicator
    await waitFor(element(by.id('loading-more')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Wait for new jobs to load
    await waitFor(element(by.id('loading-more')))
      .not.toBeVisible()
      .withTimeout(5000);
    
    // Verify more jobs loaded
    await detoxExpect(element(by.id('job-card-20'))).toBeVisible();
  });
});






