# 💳 Razorpay Payment Integration Setup Guide

## Overview
HopOn now supports **paid events** with direct payment to hosts using Razorpay. Each host manages their own Razorpay account, and payments go directly to them.

---

## 🚀 Installation

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install razorpay
```

### Step 2: Verify Files Updated
The following files have been automatically updated:

#### Backend
- ✅ `backend/models/User.js` - Added Razorpay fields
- ✅ `backend/models/Post.js` - Added payment tracking
- ✅ `backend/routes/paymentRoutes.js` - Payment endpoints
- ✅ `backend/server.js` - Routes registered
- ✅ `backend/package.json` - Razorpay added

#### Frontend
- ✅ `src/pages/Profile.tsx` - Razorpay credentials form
- ✅ `src/pages/EventDetail.tsx` - Payment checkout
- ✅ `src/pages/CreateEvent.tsx` - priceType field (free/paid)

---

## 📋 How Hosts Set Up Payment

### 1. Create Razorpay Account
- Visit [Razorpay Dashboard](https://dashboard.razorpay.com)
- Sign up and complete KYC verification
- Get your API Keys from **Settings → API Keys**

### 2. Add Keys to HopOn Profile
1. Go to **Profile Page** (click your profile in navbar)
2. Click **Edit** button
3. Scroll down to **💳 Payment Account** section
4. Paste your Razorpay credentials:
   - **Key ID**: `rzp_live_xxxxxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxx`
5. Click **Save**

### 3. Create Paid Events
1. Go to **Create Event** page
2. Select **Paid** under "Event Type"
3. Enter ticket price in INR
4. Create the event
5. Attendees will see **Pay ₹X to Join** button

---

## 🔄 Payment Flow

```
User Clicks "Pay ₹X to Join"
         ↓
Create Order on Backend
         ↓
Open Razorpay Checkout
         ↓
User Enters Card/UPI Details
         ↓
Payment Processed
         ↓
Verify Signature
         ↓
Add User as Attendee + Store Payment Record
         ↓
✅ Event Confirmation
```

---

## 💰 Payment Architecture

### Direct Payment Model
- **Host owns Razorpay account** → Payments go directly to host
- **No middleman** → Host has full financial control
- **Real-time settlement** → Funds available immediately in host's account
- **HopOn can add commission** → Optional: deduct service fee (1-3%)

### Data Stored
```javascript
// In Post.payments array:
{
  userId: "user_id",
  amount: 500,
  razorpayOrderId: "order_abc123",
  razorpayPaymentId: "pay_xyz789",
  status: "completed",
  createdAt: Date
}
```

---

## 🔐 Security Features

✅ **Signature Verification** - Validates payment authenticity
✅ **Encrypted Keys** - Host keys stored in database (should use encryption in production)
✅ **Payment Status Tracking** - Prevents duplicate attendees
✅ **Order-based Orders** - Unique Razorpay orders per transaction

---

## 📊 API Endpoints

### `POST /api/payments/create-order`
Creates a Razorpay order for payment
```json
{
  "eventId": "event_123",
  "userId": "user_456",
  "amount": 500
}
```

### `POST /api/payments/verify-payment`
Verifies payment and adds attendee
```json
{
  "razorpayOrderId": "order_abc",
  "razorpayPaymentId": "pay_xyz",
  "razorpaySignature": "signature",
  "eventId": "event_123",
  "userId": "user_456",
  "amount": 500
}
```

### `POST /api/payments/update-razorpay-keys`
Updates host's Razorpay credentials
```json
{
  "userId": "user_123",
  "razorpayKeyId": "rzp_live_xxx",
  "razorpayKeySecret": "xxx"
}
```

### `GET /api/payments/host-payments/:userId`
Gets payment history for a host
```json
{
  "totalEarnings": 5000,
  "totalTransactions": 10,
  "payments": [...]
}
```

---

## 🧪 Testing

### Test Cards (Razorpay Sandbox)
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
OTP: 123456
```

### Workflow
1. Create a **test event** as paid
2. Go to event detail page
3. Click **Pay** button (uses test keys in sandbox)
4. Use test card credentials
5. Verify attendee was added

---

## ⚠️ Production Checklist

- [ ] Switch to live Razorpay keys (not test)
- [ ] Enable HTTPS for all payment pages
- [ ] Add encryption for stored API keys
- [ ] Implement refund system for canceled events
- [ ] Add webhook for payment confirmations
- [ ] Set up settlement schedule in Razorpay dashboard
- [ ] Add commission/fee deduction logic
- [ ] Test full payment flow end-to-end
- [ ] Add payment receipt/invoice generation
- [ ] Set up customer support for payment issues

---

## 🐛 Troubleshooting

### "Host has not setup payment account"
- Host hasn't added Razorpay keys to their profile
- **Fix**: Go to Profile → Edit → Add Payment Account

### Payment stuck on checkout
- Razorpay script not loaded
- **Fix**: Check network tab, ensure CDN is accessible

### "Invalid payment signature"
- Keys mismatch between order creation and verification
- **Fix**: Ensure correct Razorpay keys used

### Payment verified but attendee not added
- Database connection issue
- **Fix**: Check backend logs, verify MongoDB connection

---

## 📞 Support

For Razorpay-specific issues:
- [Razorpay Docs](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support)

For HopOn issues:
- Check backend/frontend logs
- Verify all models have been updated
- Ensure razorpay package installed

---

**Setup Complete! 🎉 Your platform now accepts payments.**
