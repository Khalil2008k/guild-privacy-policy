# 🎨 Chat Screen - Visual Feature Reference

## 📱 Complete Feature Showcase

### 1. **Profile Pictures & Status**
```
┌──────────┐
│  [IMG]   │  ← Profile picture (56x56)
│    🟢    │  ← Online indicator (green dot, bottom-right)
│  📌      │  ← Pinned indicator (top-right)
└──────────┘
```

**States:**
- 🟢 **Online:** Green dot (14x14, #00C853)
- ⚫ **Offline:** No indicator
- 📌 **Pinned:** Pin icon badge (20x20)

---

### 2. **Message Status Icons**
```
✓   Sent       (single check, gray)
✓✓  Delivered  (double check, gray)
✓✓  Read       (double check, blue/primary)
⏱️  Pending    (clock icon, gray)
```

**Implementation:**
- Shows only for user's own messages
- Updates in real-time
- Color: Gray → Primary (when read)

---

### 3. **Message Type Icons**
```
🎤  Voice message
📷  Image
📄  File/Document
📍  Location
💬  Text (no icon)
```

**Size:** 14x14
**Color:** theme.textSecondary
**Position:** Before message preview

---

### 4. **Typing Indicator**
```
● ● ●  typing...
```

**Animation:**
- 3 dots bouncing
- Staggered animation (0ms, 200ms, 400ms)
- Loop duration: 1200ms
- Color: theme.primary

---

### 5. **Unread Badge**
```
┌────┐
│ 3  │  ← Small count (< 10)
└────┘

┌─────┐
│ 99+ │  ← Large count (≥ 100)
└─────┘
```

**Specs:**
- Min width: 22px
- Height: 22px
- Border radius: 11px
- Background: theme.primary
- Text: #000000, bold, 11px
- Max display: 99+

---

### 6. **Pinned Chat Background**
```
┌─────────────────────────────────────┐
│ [Pinned Chat]  ← Light background   │
│                  (primary + 8%)     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Regular Chat] ← Normal background  │
│                  (theme.surface)    │
└─────────────────────────────────────┘
```

---

### 7. **Unread Border**
```
▌ [Chat Item]  ← 3px left border (primary color)
  [Chat Item]  ← No border (read)
```

**Specs:**
- Width: 3px
- Color: theme.primary
- Position: Left side
- Shows only when unread > 0

---

### 8. **Quick Actions Menu**
```
Long Press ↓

┌─────────────────────────────────────┐
│ [📌 Pin] [🔕 Mute] [📦 Archive] [🗑️ Delete] │
└─────────────────────────────────────┘
```

**Features:**
- Appears below chat item
- Horizontal layout
- Icons + text labels
- Haptic feedback on press
- Auto-dismiss after action

---

### 9. **Chat Item Layout**
```
┌─────────────────────────────────────────┐
│ ┌────┐  Name              12:30 PM     │
│ │IMG │  ✓✓ 🎤 Voice message    [3]     │
│ │ 🟢 │                                  │
│ └────┘                                  │
└─────────────────────────────────────────┘

Components:
├── Avatar (56x56)
│   ├── Image or fallback
│   ├── Online indicator
│   └── Pinned badge
├── Content
│   ├── Top row
│   │   ├── Name (bold if unread)
│   │   ├── Muted icon (if muted)
│   │   └── Time
│   └── Bottom row
│       ├── Status icon
│       ├── Type icon
│       ├── Message preview
│       └── Unread badge
```

---

### 10. **Pinned Section**
```
┌─────────────────────────────────────┐
│ 📌 PINNED                           │
├─────────────────────────────────────┤
│ [Pinned Chat 1] ← Highlighted BG   │
│ [Pinned Chat 2] ← Highlighted BG   │
├─────────────────────────────────────┤
│ ALL CHATS                           │
├─────────────────────────────────────┤
│ [Regular Chat 1]                    │
│ [Regular Chat 2]                    │
│ [Regular Chat 3]                    │
└─────────────────────────────────────┘
```

---

### 11. **Muted Chat Indicator**
```
Name 🔕  ← Bell off icon (14x14)
```

**Position:** Next to name
**Color:** theme.textSecondary
**Shows:** Only when chat is muted

---

### 12. **Draft Message**
```
Draft: Hey, how are you...
```

**Format:** "Draft: " prefix + message text
**Color:** theme.textSecondary
**Font:** Italic (optional)
**Shows:** When user has unsent message

---

### 13. **Empty State**
```
┌─────────────────────────────────────┐
│                                     │
│           💬                        │
│                                     │
│     No messages yet                 │
│                                     │
│   Start a conversation              │
│                                     │
│     [Start Chat]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 Color Specifications

### Status Colors:
```typescript
const colors = {
  online: '#00C853',      // Green
  typing: '#FF9800',      // Orange
  primary: theme.primary, // App primary
  error: theme.error,     // Red
  success: '#4CAF50',     // Green
};
```

### Text Colors:
```typescript
const textColors = {
  primary: theme.textPrimary,     // Main text
  secondary: theme.textSecondary, // Subtle text
  unread: theme.textPrimary,      // Bold for unread
  muted: theme.textSecondary,     // Muted chats
};
```

### Background Colors:
```typescript
const backgrounds = {
  surface: theme.surface,              // Normal chat
  pinned: theme.primary + '08',        // Pinned chat (8% opacity)
  hover: theme.primary + '10',         // Hover state (10% opacity)
  pressed: theme.primary + '15',       // Pressed state (15% opacity)
};
```

---

## 📏 Spacing & Sizing

### Chat Item:
```
Padding: 12px
Margin: 4px vertical, 8px horizontal
Border radius: 12px
Min height: 72px
```

### Avatar:
```
Size: 56x56
Border radius: 28px
Online indicator: 14x14 (bottom-right, -2px)
Pinned badge: 20x20 (top-right, 0px)
```

### Typography:
```
Name: 16px, bold (700) if unread, semi-bold (600) if read
Message: 14px, semi-bold (600) if unread, regular (400) if read
Time: 12px, medium (500)
Badge: 11px, bold (700)
```

### Icons:
```
Status icons: 16x16
Type icons: 14x14
Action icons: 18x18
Badge icons: 10x10
```

---

## 🎬 Animations

### Entrance Animation:
```
Fade: 0 → 1 (300ms)
Slide: 20px → 0px (300ms, spring)
Stagger: 50ms between items
```

### Press Animation:
```
Scale: 1 → 0.98 → 1 (200ms total)
Haptic: Light impact
```

### Badge Pulse:
```
Scale: 1 → 1.2 → 1 (2000ms loop)
Only when unread > 0
```

### Typing Dots:
```
Opacity: 0 → 1 → 0 (800ms)
Stagger: 200ms between dots
Infinite loop
```

---

## 🔄 State Transitions

### Online Status:
```
Offline → Online: Fade in green dot (300ms)
Online → Offline: Fade out green dot (300ms)
```

### Message Status:
```
Pending (⏱️) → Sent (✓) → Delivered (✓✓) → Read (✓✓ blue)
Each transition: 200ms fade
```

### Unread Badge:
```
0 → 1: Scale from 0 to 1 (300ms spring)
1 → 0: Scale from 1 to 0 (200ms)
Count change: Number flip animation (150ms)
```

---

## 📱 Responsive Behavior

### Small Screens (< 360px):
```
Avatar: 48x48
Name: 15px
Message: 13px
Padding: 10px
```

### Large Screens (> 600px):
```
Avatar: 64x64
Name: 17px
Message: 15px
Padding: 14px
```

### Tablet/Desktop:
```
Max width: 800px
Centered layout
Hover effects enabled
```

---

## ♿ Accessibility

### Touch Targets:
```
Minimum: 44x44 (iOS guidelines)
Recommended: 48x48 (Material Design)
Chat item: Full width, 72px+ height
```

### Screen Reader:
```
Avatar: "Profile picture of [Name]"
Online: "Online"
Unread: "[Count] unread messages"
Pinned: "Pinned conversation"
Muted: "Muted"
```

### High Contrast:
```
Border: 2px solid when focused
Text: Minimum 4.5:1 contrast ratio
Icons: Minimum 3:1 contrast ratio
```

---

## 🎯 Interactive States

### Normal:
```
Background: theme.surface
Scale: 1
Opacity: 1
```

### Hover (Web):
```
Background: theme.primary + '10'
Scale: 1
Cursor: pointer
```

### Pressed:
```
Background: theme.primary + '15'
Scale: 0.98
Haptic: Light
```

### Long Press:
```
Background: theme.primary + '15'
Scale: 0.98
Haptic: Medium
Show: Quick actions
```

### Disabled:
```
Background: theme.surface
Opacity: 0.5
Cursor: not-allowed
```

---

## 📊 Performance Guidelines

### Rendering:
```
Use React.memo for chat items
Virtualize list (FlatList)
Max render batch: 10 items
Window size: 10 items
```

### Images:
```
Avatar cache: 50 items
Lazy load: Below fold
Placeholder: Colored circle with initials
Format: WebP preferred, fallback to PNG
```

### Animations:
```
Use native driver: true (when possible)
Target: 60fps
Budget: 16ms per frame
Reduce motion: Respect system preference
```

---

## ✅ Quality Checklist

### Visual:
- [ ] All icons display correctly
- [ ] Colors match design system
- [ ] Spacing is consistent
- [ ] Typography is readable
- [ ] Animations are smooth

### Functional:
- [ ] Tap opens chat
- [ ] Long press shows actions
- [ ] Actions work correctly
- [ ] Real-time updates work
- [ ] Offline mode works

### Accessibility:
- [ ] Screen reader support
- [ ] Keyboard navigation
- [ ] Touch targets ≥ 44px
- [ ] Contrast ratios pass
- [ ] Focus indicators visible

### Performance:
- [ ] 60fps scrolling
- [ ] < 100ms interactions
- [ ] < 500ms updates
- [ ] No memory leaks
- [ ] Efficient re-renders

---

**This visual reference covers every detail of the modern chat screen! Use it alongside the implementation guide for perfect results. 🎨**

