# Lucide Icon Mapping - Replacement Guide
## Replace @expo/vector-icons with Lucide React Native

### Files Using Wrong Library (18 files to fix):
- payment-methods.tsx
- add-job.tsx  
- coin-wallet.tsx
- wallet.tsx
- guild-map.tsx
- And 13 more files...

---

## Icon Mapping Reference

### Ionicons → Lucide Equivalents

| Ionicons | Lucide | Notes |
|----------|--------|-------|
| `arrow-back` | `ArrowLeft` | RTL-aware |
| `arrow-forward` | `ArrowRight` | RTL-aware |
| `add` | `Plus` | Same |
| `close` | `X` | Same |
| `checkmark-circle` | `CheckCircle` | Same |
| `time` | `Clock` | Same |
| `star-outline` | `Star` | Use `fill` prop for outline |
| `create-outline` | `Edit` or `Pencil` | Same |
| `trash-outline` | `Trash2` | Same |
| `chevron-forward` | `ChevronRight` | RTL-aware |
| `home` | `Home` | Same |
| `flash` | `Zap` | Same |
| `shield-checkmark` | `Shield` with `CheckCircle` | Composite |
| `people` | `Users` | Same |
| `card` | `CreditCard` | Same |
| `search` | `Search` | Same |
| `filter` | `Filter` | Same |
| `more-vertical` | `MoreVertical` | Same |
| `refresh` | `RefreshCw` | Same |
| `settings-outline` | `Settings` | Same |
| `card-outline` | `CreditCard` | Same |
| `list` | `List` | Same |
| `close-circle-outline` | `XCircle` | Same |
| `ellipsis-horizontal` | `MoreHorizontal` | Same |

### MaterialIcons → Lucide Equivalents

| MaterialIcons | Lucide | Notes |
|---------------|--------|-------|
| `payment` | `CreditCard` | Same |
| `card` | `CreditCard` | Same |
| `business` | `Building2` | Same |
| `phone-portrait` | `Smartphone` | Same |
| `security` | `Shield` | Same |
| `construction` | `Wrench` or `Wrench` | Same |
| `search` | `Search` | Same |
| `palette` | `Palette` | Same |
| `trending-up` | `TrendingUp` | Same |
| `create` | `Edit` | Same |
| `people` | `Users` | Same |

---

## RTL-Aware Icon Pattern

```typescript
// WRONG - Doesn't flip in RTL
<Ionicons name="arrow-back" size={24} />

// CORRECT - Flips automatically in RTL
{isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}

// Or use RTLIcon component (to be created)
<RTLIcon name="arrow" size={24} />
```

---

## Implementation Priority

### High Priority (Critical Screens):
1. payment-methods.tsx - 14 instances
2. guild.tsx - MaterialIcons usage
3. add-job.tsx - Conditional icons
4. wallet.tsx - Navigation icons

### Medium Priority:
5. coin-wallet.tsx
6. job-search.tsx
7. guild-map.tsx
8. All modal screens

---

## Quick Replace Script

```bash
# Find all files using wrong library
grep -r "@expo/vector-icons" src/app/

# Count occurrences
grep -r "Ionicons\|MaterialIcons" src/app/ | wc -l
```

---

## Benefits of Lucide Only:
✅ No background blur issues
✅ Better RTL support  
✅ Consistent icon style
✅ Smaller bundle size
✅ Better TypeScript support
✅ Native React Native support
✅ More icons available

