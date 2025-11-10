# 🔍 SYSTEMATIC BUG HUNT - IN PROGRESS

**Date:** November 9, 2025  
**Objective:** Find and fix all similar bugs like the QR scanner black screen issue  
**Status:** 🟢 ACTIVE

---

## 🎯 BUG PATTERNS TO LOOK FOR

### **1. Navigation State Issues**
- Screens that set state to `false` and navigate away
- Missing `useFocusEffect` hooks
- State not resetting when returning to screen

### **2. Modal/Camera Issues**
- Camera permissions not resetting
- Modals not reopening after dismissal
- Scanner/camera components not remounting

### **3. Form State Issues**
- Form data persisting after submission
- Input fields not clearing
- Validation state not resetting

### **4. Loading State Issues**
- Loading indicators stuck
- Infinite loading states
- Missing loading state resets

---

## 🔍 SCANNING CODEBASE...


