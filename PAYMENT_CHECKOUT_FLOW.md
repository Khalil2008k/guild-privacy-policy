# 💳 Payment Checkout Flow with Saved Cards

## Overview

Users can save cards locally on their device for faster checkout. When paying with Fatora, saved cards are shown as options. If using a new card, user is prompted to save it.

---

## 🔄 Flow

### **Scenario 1: User has saved cards**

```
User clicks "Pay Now"
    ↓
Show payment method selector
    ↓
Display saved cards as options
    ↓
User selects saved card OR "Use New Card"
    ↓
If saved card selected → Auto-fill Fatora form
If new card → Show new card form
```

### **Scenario 2: User uses new card**

```
User enters new card details
    ↓
Complete payment with Fatora
    ↓
Check if card is already saved
    ↓
If NOT saved → Show "Save Card?" alert
    ↓
User chooses:
  - Save → Card saved to device
  - Cancel → Card not saved
```

---

## 📝 Implementation Guide

### **Step 1: Import the service**

```typescript
import { 
  getSavedCards, 
  promptSaveCardAfterPayment,
  isCardSaved,
  SavedCard,
  CardDetails 
} from '../services/paymentCheckoutService';
```

### **Step 2: Load saved cards on checkout**

```typescript
const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
const [selectedCard, setSelectedCard] = useState<string | null>(null);

useEffect(() => {
  loadSavedCards();
}, []);

const loadSavedCards = async () => {
  const cards = await getSavedCards();
  setSavedCards(cards);
  
  // Set default card if exists
  const defaultCard = cards.find(c => c.isDefault);
  if (defaultCard) {
    setSelectedCard(defaultCard.id);
  }
};
```

### **Step 3: Show card selector UI**

```typescript
{/* Saved Cards */}
{savedCards.map(card => (
  <TouchableOpacity
    key={card.id}
    onPress={() => setSelectedCard(card.id)}
    style={[
      styles.cardOption,
      selectedCard === card.id && styles.cardOptionSelected
    ]}
  >
    <CreditCard size={24} color={theme.primary} />
    <View>
      <Text>{card.name}</Text>
      <Text>•••• {card.lastFour}</Text>
    </View>
    {card.isDefault && <Badge text="Default" />}
  </TouchableOpacity>
))}

{/* Use New Card Option */}
<TouchableOpacity
  onPress={() => setSelectedCard('new')}
  style={[
    styles.cardOption,
    selectedCard === 'new' && styles.cardOptionSelected
  ]}
>
  <Plus size={24} color={theme.primary} />
  <Text>Use New Card</Text>
</TouchableOpacity>
```

### **Step 4: Handle payment completion**

```typescript
const handlePaymentComplete = async (cardDetails: CardDetails) => {
  try {
    // Process payment with Fatora
    const result = await processFatoraPayment(cardDetails);
    
    if (result.success) {
      // Check if card is new (not saved)
      const alreadySaved = await isCardSaved(cardDetails.cardNumber);
      
      if (!alreadySaved) {
        // Prompt to save card
        promptSaveCardAfterPayment(
          cardDetails,
          () => {
            // Card saved callback
            Alert.alert('Success', 'Card saved for faster checkout!');
          },
          () => {
            // Cancelled callback
            console.log('User chose not to save card');
          }
        );
      }
    }
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

---

## 🎨 Alert Component

The alert uses `CustomAlert` component matching the frontend style:

```typescript
<CustomAlert
  visible={showSaveCardAlert}
  title="Save Card?"
  message="Would you like to save this card for faster checkout next time? Your card will be stored securely on your device only."
  type="info"
  buttons={[
    { text: 'Cancel', style: 'cancel', onPress: handleCancel },
    { text: 'Save', style: 'default', onPress: handleSave }
  ]}
/>
```

---

## 🔐 Security & Privacy

✅ **Cards stored on device only** (AsyncStorage)  
✅ **No backup** - Cards lost if device is reset  
✅ **GUILD doesn't store cards** - Only on user's phone  
✅ **Fatora is just a PSP** - Card info auto-fills their form  

---

## 📍 Where to Implement

### **Checkout Screens:**
- `src/app/(modals)/coin-store.tsx` - Coin purchase checkout
- `src/app/(modals)/checkout.tsx` - General checkout
- `src/app/(modals)/pay-job.tsx` - Job payment checkout

### **Service File:**
- `src/services/paymentCheckoutService.ts` - Contains all checkout logic

---

## 🧪 Testing

### Test Scenario 1: No saved cards
1. Clear saved cards
2. Go to checkout
3. Should show "Use New Card" option only

### Test Scenario 2: Has saved cards
1. Add a card in Payment Methods screen
2. Go to checkout
3. Should show saved card(s) as options
4. Can select saved card or use new card

### Test Scenario 3: Save new card
1. Use new card for payment
2. Complete payment
3. Should see "Save Card?" alert
4. Click "Save" → Card saved
5. Click "Cancel" → Card not saved

---

## 📝 Translation Keys

### English (`src/locales/en.json`):
- `saveCardAlertTitle`: "Save Card?"
- `saveCardAlertMessage`: "Would you like to save this card for faster checkout next time? Your card will be stored securely on your device only."
- `cardSavedSuccessfully`: "Card saved successfully!"

### Arabic (`src/locales/ar.json`):
- `saveCardAlertTitle`: "حفظ البطاقة؟"
- `saveCardAlertMessage`: "هل تريد حفظ هذه البطاقة للدفع السريع في المرة القادمة؟ سيتم تخزين بطاقتك بشكل آمن على جهازك فقط."
- `cardSavedSuccessfully`: "تم حفظ البطاقة بنجاح!"

---

## ✅ Status

✅ **Service Created** - `paymentCheckoutService.ts`  
✅ **Alert Component** - CustomAlert with frontend style  
✅ **Translation Keys** - English & Arabic  
✅ **Documentation** - Complete usage guide  

**Ready for integration into checkout screens!** 🚀

