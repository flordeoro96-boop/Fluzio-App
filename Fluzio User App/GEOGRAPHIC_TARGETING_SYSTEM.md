# Geographic Targeting System - Subscription-Based Reach ✅

## Overview
Fluzio's mission discovery is controlled by **geographic targeting** based on subscription tiers. This determines which customers can see a business's missions based on where the business is located and what subscription level they have.

---

## How Geographic Targeting Works

### Business Location
Every business has a **home city** (`homeCity` field) where they are physically located:
- Example: A coffee shop in Munich has `homeCity: "Munich"`
- This is set during signup or via profile settings

### Customer Discovery
Customers see missions based on:
1. **Their current location** (`currentCity` or `temporaryLocation`)
2. **Business's subscription tier** (determines reach)
3. **Geographic matching logic**

---

## Subscription Tiers & Geographic Reach

### 📍 FREE Tier - City Only
**Target:** `0` countries (city-only)

**Reach:**
- Missions visible ONLY to customers in the same city
- Example: Munich business → only Munich customers see missions

**Use Case:**
- Local cafes, gyms, retail stores
- Neighborhood businesses
- City-specific services

**Logic:**
```typescript
// FREE tier filtering
if (business.subscriptionLevel === 'FREE') {
  const eligibleCustomers = customers.filter(
    customer => customer.currentCity === business.homeCity
  );
}
```

---

### 🇩🇪 SILVER Tier - Country Wide
**Target:** `1` country (home country)

**Reach:**
- Missions visible to all customers in the business's home country
- Example: Berlin business → all German customers see missions

**Use Case:**
- National brands
- Online businesses with nationwide shipping
- Multi-city chains within one country

**Logic:**
```typescript
// SILVER tier filtering
if (business.subscriptionLevel === 'SILVER') {
  const eligibleCustomers = customers.filter(
    customer => customer.country === business.country
  );
}
```

---

### 🌍 GOLD Tier - Multi-Country (10 countries)
**Target:** Up to `10` countries

**Reach:**
- Business selects up to 10 target countries via `targetCountries` array
- Missions visible to customers in any of those countries

**Use Case:**
- European brands targeting specific markets
- International e-commerce (selective markets)
- Regional franchises

**Configuration:**
```typescript
// Example: German business targeting EU markets
{
  homeCity: "Munich",
  country: "Germany",
  targetCountries: [
    "Germany", 
    "Austria", 
    "Switzerland", 
    "France", 
    "Italy", 
    "Spain", 
    "Netherlands", 
    "Belgium", 
    "Poland", 
    "Czech Republic"
  ],
  subscriptionLevel: "GOLD"
}
```

**Logic:**
```typescript
// GOLD tier filtering
if (business.subscriptionLevel === 'GOLD') {
  const eligibleCustomers = customers.filter(
    customer => business.targetCountries?.includes(customer.country)
  );
}
```

---

### 🌐 PLATINUM Tier - Global Reach
**Target:** `999` countries (unlimited/global)

**Reach:**
- Missions visible to customers worldwide
- No geographic restrictions

**Use Case:**
- Global brands
- Digital-first businesses
- International campaigns

**Logic:**
```typescript
// PLATINUM tier filtering
if (business.subscriptionLevel === 'PLATINUM') {
  // Show to all customers globally
  const eligibleCustomers = customers; // No filtering
}
```

---

## Implementation Details

### Type Definitions (`types.ts`)

```typescript
// Geographic targeting limits
export const COUNTRY_LIMITS: Record<SubscriptionLevel, number> = {
  FREE: 0,      // City-only (no country targeting)
  SILVER: 1,    // Single country (home country)
  GOLD: 10,     // Up to 10 countries
  PLATINUM: 999 // Global reach (unlimited countries)
};

// User interface fields
export interface User {
  // Business location
  homeCity?: string;              // Primary city (e.g., "Munich")
  country?: string;               // Business country (e.g., "Germany")
  targetCountries?: string[];     // Countries to target (GOLD/PLATINUM)
  subscriptionScope?: 'CITY' | 'GLOBAL'; // Simplified scope flag
  
  // Customer location
  currentCity?: string;           // Where customer is now
  city?: string;                  // Customer's home city
  
  // Platinum feature: Temporary location override
  temporaryLocation?: {
    city: string;
    country?: string;
    setAt: string;
    expiresAt: string;            // 30 days from setAt
  };
}
```

---

## Discovery Algorithm

### Mission Filtering Logic
When a customer opens the app, missions are filtered as follows:

```typescript
const getVisibleMissions = (customer: User, allMissions: Mission[]) => {
  return allMissions.filter(mission => {
    const business = getBusinessById(mission.businessId);
    
    // Determine customer's current location
    const customerCity = customer.temporaryLocation?.city 
      || customer.currentCity 
      || customer.city;
    const customerCountry = customer.temporaryLocation?.country 
      || customer.country;
    
    // FREE tier: Same city only
    if (business.subscriptionLevel === 'FREE') {
      return customerCity === business.homeCity;
    }
    
    // SILVER tier: Same country
    if (business.subscriptionLevel === 'SILVER') {
      return customerCountry === business.country;
    }
    
    // GOLD tier: Target countries
    if (business.subscriptionLevel === 'GOLD') {
      return business.targetCountries?.includes(customerCountry);
    }
    
    // PLATINUM tier: Global
    if (business.subscriptionLevel === 'PLATINUM') {
      return true; // Visible to everyone
    }
    
    return false;
  });
};
```

---

## Customer Location Features

### 1. Temporary Location (PLATINUM Customers)
PLATINUM tier customers can set a temporary location for 30 days:

```typescript
// Set temporary location
temporaryLocation: {
  city: "Paris",
  country: "France",
  setAt: "2025-12-08T10:00:00Z",
  expiresAt: "2026-01-07T10:00:00Z" // 30 days later
}
```

**Use Case:**
- Digital nomads
- Travelers
- International students
- Remote workers

**Benefits:**
- See missions in visited city
- Discover local businesses
- Access location-specific campaigns

---

### 2. Global Roaming
Customers can be marked as global roamers:

```typescript
isGlobalRoamer: true
```

**Purpose:** See missions from all subscription tiers regardless of location

---

## Business Profile Configuration

### Setting Home City
During signup or in profile settings:

```tsx
<input 
  type="text"
  value={formData.city}
  onChange={(e) => updateField('city', e.target.value)}
  placeholder="Enter your city (e.g., Munich)"
/>
```

This sets:
- `homeCity`: "Munich"
- `country`: "Germany" (auto-detected or manually set)

---

### Configuring Target Countries (GOLD/PLATINUM)

```tsx
{subscriptionLevel === 'GOLD' || subscriptionLevel === 'PLATINUM' && (
  <CountrySelector
    maxCountries={subscriptionLevel === 'GOLD' ? 10 : 999}
    selectedCountries={targetCountries}
    onChange={(countries) => updateField('targetCountries', countries)}
  />
)}
```

**Validation:**
```typescript
const canAddCountry = (business: User): boolean => {
  const limit = COUNTRY_LIMITS[business.subscriptionLevel];
  const current = business.targetCountries?.length || 0;
  return current < limit;
};
```

---

## Real-World Examples

### Example 1: Local Café (FREE)
```typescript
{
  businessName: "Café Central",
  homeCity: "Munich",
  country: "Germany",
  subscriptionLevel: "FREE"
}
```
**Visibility:** Only Munich customers see missions

---

### Example 2: National E-commerce (SILVER)
```typescript
{
  businessName: "German Gadgets Online",
  homeCity: "Berlin",
  country: "Germany",
  subscriptionLevel: "SILVER"
}
```
**Visibility:** All German customers nationwide

---

### Example 3: European Fashion Brand (GOLD)
```typescript
{
  businessName: "EuroStyle",
  homeCity: "Paris",
  country: "France",
  subscriptionLevel: "GOLD",
  targetCountries: [
    "France", "Germany", "Italy", "Spain", "Netherlands",
    "Belgium", "Austria", "Switzerland", "Portugal", "Poland"
  ]
}
```
**Visibility:** Customers in all 10 target countries

---

### Example 4: Global Software Company (PLATINUM)
```typescript
{
  businessName: "CloudTech Inc",
  homeCity: "San Francisco",
  country: "USA",
  subscriptionLevel: "PLATINUM"
}
```
**Visibility:** All customers worldwide

---

## Analytics Impact

### Per-Tier Insights

**FREE Tier:**
- "Your missions reached 2,500 customers in Munich"
- "Top districts: City Center (40%), Schwabing (25%), Giesing (20%)"

**SILVER Tier:**
- "Your missions reached 45,000 customers across Germany"
- "Top cities: Berlin (35%), Hamburg (20%), Munich (15%)"

**GOLD Tier:**
- "Your missions reached 150,000 customers across 10 countries"
- "Top countries: Germany (40%), France (25%), Italy (15%)"

**PLATINUM Tier:**
- "Your missions reached 1.2M customers globally"
- "Top regions: Europe (45%), Asia (30%), Americas (25%)"

---

## Upgrade Prompts

### FREE → SILVER
"Expand your reach nationwide! Upgrade to SILVER and show missions to all customers in Germany."

**Benefits:**
- 20x larger audience
- Nationwide campaigns
- City-by-city analytics

---

### SILVER → GOLD
"Go international! Upgrade to GOLD and target up to 10 countries."

**Benefits:**
- 100x larger potential audience
- Multi-country campaigns
- Country-by-country analytics
- Perfect for EU expansion

---

### GOLD → PLATINUM
"Go global! Upgrade to PLATINUM for unlimited worldwide reach."

**Benefits:**
- 1000x larger potential audience
- Global campaigns
- Regional analytics
- International brand building

---

## Technical Implementation

### Firestore Indexes
Required for efficient geographic filtering:

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "currentCity", "order": "ASCENDING" },
        { "fieldPath": "subscriptionLevel", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "country", "order": "ASCENDING" },
        { "fieldPath": "accountType", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

### Cloud Functions Integration

The backend (`functions/index.js`) already implements this logic:

```javascript
// Line 2971: Customer city detection
const searchCity = userData.temporaryLocation?.city 
  || userData.homeCity 
  || userData.city 
  || userData.location;

// Line 2987: Business city detection
const businessCity = business.homeCity 
  || business.city 
  || business.location;
```

---

## Future Enhancements

### 1. Dynamic Radius (Instead of City-Only)
**Current:** FREE tier = exact city match
**Future:** FREE tier = 50km radius from business

```typescript
if (business.subscriptionLevel === 'FREE') {
  const distance = calculateDistance(customer.geo, business.geo);
  return distance <= 50000; // 50km in meters
}
```

---

### 2. Regional Targeting (GOLD)
**Current:** Select 10 individual countries
**Future:** Select regions (e.g., "EU", "APAC", "North America")

```typescript
targetRegions: ["EU", "North America"]
// Expands to all countries in those regions
```

---

### 3. Smart City Recommendations
Suggest which cities/countries to target based on:
- Customer demographics
- Competition analysis
- Market opportunity

---

## Summary

| Tier | Geographic Reach | Use Case | Monthly Cost |
|------|-----------------|----------|--------------|
| **FREE** | City-only | Local businesses | €0 |
| **SILVER** | Nationwide (1 country) | National brands | €29 |
| **GOLD** | Multi-country (10) | Regional/EU businesses | €99 |
| **PLATINUM** | Global (unlimited) | International brands | €299 |

**Key Insight:** Geographic targeting is NOT about multiple physical locations, but about **how far your missions can reach** based on your subscription tier. Your business has ONE location (`homeCity`), but your missions can be visible in multiple cities/countries depending on your tier.
