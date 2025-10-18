# Step 2 Testing Guide: Job Posting Wizard

## Overview
This guide covers testing the implementation of the 3-step job posting wizard with Firebase integration for the Guild app.

## Prerequisites
- Step 1 completed and tested
- Expo Go app on iOS/Android device
- Firebase project configured (optional for initial testing)

## Testing Steps

### 1. Start the Development Server
```bash
npx expo start
```

### 2. Test in Expo Go
1. Open Expo Go on your device
2. Scan the QR code from the terminal
3. Navigate to the job posting wizard

### 3. Navigation Testing

#### Access Job Posting Wizard
- [ ] Tap "Post Job" button on home screen
- [ ] Verify navigation to job posting wizard
- [ ] Check that wizard opens with Step 1

#### Step Navigation
- [ ] Test "Next" button functionality
- [ ] Test "Back" button functionality
- [ ] Verify progress bar updates correctly
- [ ] Check step titles and indicators

### 4. Step 1: Category Selection Testing

#### Category Dropdown
- [ ] Tap category dropdown
- [ ] Verify modal opens with category list
- [ ] Check all 8 categories are displayed
- [ ] Verify category icons and names

#### Category Selection
- [ ] Select different categories
- [ ] Verify selection is highlighted
- [ ] Check "Next" button enables after selection
- [ ] Verify category preview displays correctly

#### RTL Support
- [ ] Test category selection in Arabic mode
- [ ] Verify RTL layout for category items
- [ ] Check text alignment and direction

### 5. Step 2: Job Details Testing

#### Form Validation
- [ ] Test job title validation (minimum 5 characters)
- [ ] Test description validation (minimum 20 characters)
- [ ] Test budget validation (numeric, minimum 10 QAR)
- [ ] Verify error messages display correctly

#### Input Fields
- [ ] Test job title input
- [ ] Test description textarea (multiline)
- [ ] Test budget input (numeric keyboard)
- [ ] Verify character counters work

#### Real-time Validation
- [ ] Check validation updates as user types
- [ ] Verify "Next" button enables when all fields valid
- [ ] Test helper text displays correctly

#### Budget Preview
- [ ] Verify budget preview shows formatted amount
- [ ] Check QAR currency display
- [ ] Test with different budget amounts

### 6. Step 3: Schedule & Location Testing

#### Location Input
- [ ] Test location text input
- [ ] Verify location validation (minimum 5 characters)
- [ ] Check location helper text

#### Date Selection
- [ ] Test date picker functionality
- [ ] Verify minimum date is today
- [ ] Check date formatting in Arabic locale
- [ ] Test date preview display

#### Time Selection
- [ ] Test time picker functionality
- [ ] Verify time formatting (24-hour format)
- [ ] Check time preview display
- [ ] Test combined date/time display

#### Platform Differences
- [ ] Test date/time pickers on iOS
- [ ] Test date/time pickers on Android
- [ ] Verify modal behavior differences

### 7. Firebase Integration Testing

#### Job Creation
- [ ] Complete all steps with valid data
- [ ] Tap "Post Job" button
- [ ] Verify loading state displays
- [ ] Check success message appears

#### Error Handling
- [ ] Test with invalid Firebase config
- [ ] Verify error message displays
- [ ] Check app doesn't crash

#### Data Validation
- [ ] Verify job data is saved correctly
- [ ] Check all fields are included
- [ ] Verify status is set to 'Open'
- [ ] Check timestamps are correct

### 8. Form State Management Testing

#### Data Persistence
- [ ] Navigate between steps
- [ ] Verify form data is preserved
- [ ] Test back navigation maintains data
- [ ] Check form resets after submission

#### Validation State
- [ ] Test validation across all steps
- [ ] Verify "Next" button states
- [ ] Check error message clearing
- [ ] Test form completion requirements

### 9. Accessibility Testing

#### Screen Reader
- [ ] Enable VoiceOver/TalkBack
- [ ] Navigate through all form fields
- [ ] Verify proper labels and hints
- [ ] Test form validation announcements

#### Touch Targets
- [ ] Verify all buttons are 48dp minimum
- [ ] Test dropdown touch targets
- [ ] Check date/time picker accessibility
- [ ] Verify navigation buttons are accessible

#### Keyboard Navigation
- [ ] Test tab order through form fields
- [ ] Verify focus indicators
- [ ] Check keyboard shortcuts work

### 10. Performance Testing

#### Load Times
- [ ] Test wizard initialization speed
- [ ] Verify step transitions are smooth
- [ ] Check modal opening/closing performance
- [ ] Test form submission response time

#### Memory Usage
- [ ] Monitor memory during form usage
- [ ] Test with large text inputs
- [ ] Verify no memory leaks
- [ ] Check app stability during testing

### 11. Cross-Platform Testing

#### iOS Testing
- [ ] Test on iPhone (different screen sizes)
- [ ] Verify iOS-specific date/time pickers
- [ ] Check safe area handling
- [ ] Test iOS-specific behaviors

#### Android Testing
- [ ] Test on Android devices
- [ ] Verify Android-specific date/time pickers
- [ ] Check Android-specific behaviors
- [ ] Test different Android versions

## Common Issues and Solutions

### Date/Time Picker Issues
**Problem**: Date/time pickers not working
**Solution**:
- Check @react-native-community/datetimepicker installation
- Verify platform-specific implementations
- Test with different date formats

### Firebase Connection Issues
**Problem**: Job posting fails
**Solution**:
- Verify Firebase configuration
- Check network connectivity
- Test with valid Firebase credentials
- Verify Firestore rules allow write access

### Form Validation Issues
**Problem**: Validation not working correctly
**Solution**:
- Check validation logic in each step
- Verify error message translations
- Test with edge case inputs
- Check real-time validation updates

### RTL Layout Issues
**Problem**: RTL layout broken in wizard
**Solution**:
- Verify RTL components usage
- Check text direction settings
- Test with Arabic language
- Verify layout direction switches

## Expected Results

### Successful Implementation
- ✅ 3-step wizard works perfectly
- ✅ All form validations work correctly
- ✅ Firebase integration successful
- ✅ RTL support works in Arabic
- ✅ Cross-platform compatibility
- ✅ Accessibility features work
- ✅ Performance is smooth

### Partial Success
- ⚠️ Wizard works but some validations missing
- ⚠️ Firebase connects but with warnings
- ⚠️ RTL works but some UI misaligned
- ⚠️ Performance is good but could be better

### Issues to Report
- ❌ Wizard doesn't load or crashes
- ❌ Form validation completely broken
- ❌ Firebase integration fails
- ❌ RTL layout completely broken
- ❌ Major accessibility issues

## Next Steps
After completing Step 2 testing:
1. Share results with development team
2. Document any issues found
3. Proceed to Step 3: Freelancer Leads Feed
4. Apply lessons learned to subsequent steps

## Testing Checklist

### Navigation
- [ ] Wizard opens from home screen
- [ ] Step navigation works correctly
- [ ] Progress bar updates properly
- [ ] Back/Next buttons function

### Step 1: Category
- [ ] Category dropdown opens
- [ ] All categories display correctly
- [ ] Selection works and shows preview
- [ ] RTL support works

### Step 2: Details
- [ ] All input fields work
- [ ] Validation messages display
- [ ] Budget preview shows correctly
- [ ] Character counters work

### Step 3: Schedule
- [ ] Location input works
- [ ] Date picker functions
- [ ] Time picker functions
- [ ] Preview displays correctly

### Firebase Integration
- [ ] Job creation works
- [ ] Success message displays
- [ ] Error handling works
- [ ] Data saves correctly

### Accessibility
- [ ] Screen reader support
- [ ] Touch targets are adequate
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

### Performance
- [ ] Load times are acceptable
- [ ] Transitions are smooth
- [ ] No memory leaks
- [ ] App remains stable

### Cross-Platform
- [ ] Works on iOS devices
- [ ] Works on Android devices
- [ ] Platform differences handled
- [ ] Consistent experience

