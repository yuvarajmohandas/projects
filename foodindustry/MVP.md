# FoodIndustry — MVP Brief: Online Grocery Website

> Filled in from our Q&A. Items marked **[OPEN]** still need your decision — I've added a recommendation for each so you can just confirm or override.

## 1. Problem Statement
- **Who has the problem?** Everyday consumers in Belgium who want to buy groceries online instead of going to a physical supermarket.
- **What pain point are they facing today?** Time spent traveling to/queuing at stores; difficulty comparing/reordering regular items; limited flexibility on when/how they receive groceries.
- **How do they solve it now (workarounds)?** Existing players (Colruyt Collect&Go, Delhaize, ...) — need to differentiate on speed, price, or convenience.

## 2. Target Users / Personas
| Persona | Description | Primary Need |
|---|---|---|
| Busy household shopper | Works full-time, shops weekly for family | Fast reorder of a regular "basket", reliable delivery slot |
| Budget-conscious shopper | Price-sensitive, watches promos | Clear pricing, discounts/loyalty points |
| Pickup-preferred shopper | Wants to avoid delivery fees/wait | Easy in-store/curbside pickup slot booking |

## 3. Value Proposition
- **One-sentence pitch:** We help everyday consumers in Belgium buy their groceries online — with the choice of home delivery or pickup — so they save time and never run out of essentials.
- **Why now?** [OPEN — e.g. growing online grocery adoption, gap in local market, underserved region/segment]
- **Why us?** [OPEN — e.g. lower fees, better UX, faster slots, local focus]

## 4. Core Features (MVP Scope Only)
| # | Feature | Description | Priority |
|---|---|---|---|
| 1 | Product catalog & search | Browse/search groceries by category, filter, view product detail (price, image, unit, allergens) | Must |
| 2 | Cart & checkout | Add/remove items, adjust quantity, view order total | Must |
| 3 | Delivery **or** Pickup selection | Customer chooses fulfillment method + time slot at checkout | Must |
| 4 | Online payment | Card / iDEAL / Bancontact via payment provider | Must |
| 5 | Cash/card on delivery-pickup | Pay on receipt as an alternative to online payment | Must |
| 6 | User accounts | Register/login, saved addresses, order history | Must |
| 7 | Promo codes & discounts | Apply promo code at checkout, % or fixed discounts | Must |
| 8 | Loyalty points | Earn points per order, redeem against future orders | Must |
| 9 | Order tracking status | Placed → Preparing → Out for delivery/Ready for pickup → Completed | Must |
| 10 | Admin/back-office panel | Staff manage products, stock levels, orders, promo codes | Must |
| 11 | Manual stock management | Staff update stock quantities directly in admin panel (no external POS sync yet) | Must |
| 12 | Delivery slot & zone management | Define delivery zones/time slots (Belgium regions/cities), pickup locations | Should |
| 13 | Email/SMS order notifications | Confirmation, status updates | Should |
| 14 | Ratings/reviews on products | Customer feedback on products | Could |

## 5. Out of Scope (for now)
- Native mobile apps (iOS/Android) — planned for **after** web MVP validates the model
- Real-time POS/warehouse inventory sync (start manual; revisit once source of stock is decided)
- Multi-vendor marketplace (multiple independent grocery stores on one platform)
- Subscription plans (e.g. monthly unlimited free delivery)
- Personalized recommendations / AI-driven suggestions
- Multi-country expansion beyond Belgium

## 6. Key User Flows
1. **Browse & order groceries**
   - Step 1: Customer searches/browses catalog, adds items to cart
   - Step 2: Customer proceeds to checkout, chooses **delivery** or **pickup**
   - Step 3: Customer picks a time slot/location, applies promo code if any
   - Step 4: Customer pays online, or selects cash/card on receipt
   - Step 5: Customer receives confirmation + order tracking updates
2. **Staff fulfills an order**
   - Step 1: Staff sees new order in admin panel
   - Step 2: Staff updates stock, marks order "Preparing" → "Ready/Out for delivery"
   - Step 3: Order marked "Completed" once delivered/picked up
3. **Returning customer reorders**
   - Step 1: Customer logs in, views past order
   - Step 2: Re-adds previous basket to cart with one click
   - Step 3: Checks loyalty points balance, redeems if desired

## 7. Tech & Platform
- **Platform:** Web app (responsive, mobile-friendly browser experience) for MVP; native iOS/Android app planned as a fast-follow.
- **Recommended stack:**
  - **Frontend:** React (Next.js) — SSR/SEO-friendly for product pages, responsive out of the box
  - **Backend:** Node.js (NestJS) or alternatively .NET — REST/GraphQL API
  - **Database:** PostgreSQL (relational data: products, orders, users, stock, loyalty points)
  - **Payments:** Stripe or Mollie (both support Bancontact/iDEAL — important for Belgium) + "pay on delivery/pickup" as a manual payment method
  - **Hosting:** Azure or AWS (containerized, e.g. Docker + a managed Postgres)
  - **Notifications:** SendGrid/Postmark (email), Twilio (SMS) — Should-have
  - **Admin panel:** Custom-built within same app (role-protected routes) rather than a 3rd-party tool, to keep stock/orders/promo logic in one place
- **Integrations needed:** Payment provider (Stripe/Mollie), email/SMS provider; **[OPEN]** POS/warehouse system — deferred until sourcing model is decided.
- **Data to store:** Products (name, price, unit, category, allergens, stock qty), Orders (items, status, fulfillment type, slot), Users (profile, addresses, loyalty balance), Promo codes, Delivery zones/pickup locations, Payments/transactions.

## 8. Success Metrics
- **North star metric:** Number of completed orders per week
- **Other KPIs:** Cart-to-checkout conversion rate, repeat order rate (loyalty engagement), average order value, delivery/pickup on-time rate, promo code redemption rate

## 9. Risks & Open Questions
- **[OPEN] Sourcing model:** Own inventory/warehouse vs. sourcing from partner store(s) — affects stock management, fulfillment logistics, and legal/supplier agreements. Needs deciding before the backend data model is finalized.
- **[OPEN] Monetization:** Delivery fees, subscription, or product markup only — affects checkout flow and admin config (fee rules).
- **Food safety/compliance (Belgium/EU):** Allergen labeling (EU Regulation 1169/2011), best-before dates, cold-chain handling for delivery, VAT rules for food (reduced rate in Belgium).
- **Delivery logistics:** Own delivery fleet vs. third-party courier partner — impacts cost and MVP timeline.
- **Payment compliance:** PCI-DSS handled by using Stripe/Mollie hosted checkout rather than storing card data ourselves.

## 10. Rough Timeline / Milestones
| Milestone | Target Date | Notes |
|---|---|---|
| Decide sourcing model & monetization | [ ] | Blocks data model & checkout design |
| MVP scoped & designed (wireframes) | [ ] | Catalog, checkout, admin panel |
| MVP built (web) | [ ] | Core features from section 4 |
| Pilot launch — 1 city/region in Belgium | [ ] | Validate demand before wider rollout |
| Native mobile app | [ ] | Post-MVP, after web validates model |

---
### Notes / Brain dump
- Launch scope: Belgium, web first, mobile app later.
- Fulfillment: both delivery and pickup from day one.
- Payments: online + cash/card on delivery/pickup.
- Promo codes + loyalty points are must-haves, not nice-to-haves.
- Inventory sourcing (own stock vs. partner store) and stock sync approach: **still to be decided.**
- Monetization model (fees/subscription/markup only): **still to be decided.**
