# 🏠 Household Hub Feature - Design Document

**Created:** October 29, 2025  
**Status:** Planning Phase  
**Priority:** High - Next Major Feature

---

## 📋 Executive Summary

Transform the current household feature into a robust **Collaborative Family Food Command Center** - a persistent, organized space where household members can coordinate meal planning, grocery shopping, recipe sharing, and food-related communication.

---

## 🎯 Vision

A Notion/Todoist-style shared workspace specifically designed for household food management. Think of it as:
- **Slack/Discord** but for families and food
- **Notion** but focused on meal planning & groceries
- **Cozi Family Organizer** with better UX and food-first design

### Key Principles:
1. **Persistent** - Always available, historical reference
2. **Collaborative** - Real-time updates, everyone stays in sync
3. **Organized** - Scoped by household, no confusion
4. **Contextual** - Comments and discussions on specific items
5. **Actionable** - Direct integration with grocery lists & meal plans

---

## 🏢 Similar Products/Concepts

### 1. **Slack/Discord** - Family Communication
- Channels = Households
- Threads = Discussions on recipes/lists
- @mentions = Pings
- **What we'll borrow:** Real-time messaging, threading, mentions

### 2. **Notion** - Collaborative Workspace
- Shared databases (recipes, grocery lists)
- Comments and discussions
- Persistent knowledge base
- **What we'll borrow:** Structured data + conversations

### 3. **Cozi Family Organizer** - Family Coordination
- Shared shopping lists
- Meal planning calendar
- Family messaging
- **What we'll borrow:** Family-first design, calendar integration

### 4. **Todoist/Asana** - Project Collaboration
- Shared lists with assignments
- Comments and updates
- Activity feed
- **What we'll borrow:** Task-based collaboration, activity streams

### 5. **WhatsApp/iMessage Groups** - But Structured
- Family communication
- Media sharing (recipe photos/links)
- Persistent history
- **What we'll borrow:** Familiar messaging patterns

---

## 🎨 Core Features

### 1. Household Feed/Activity Stream (Home Page Integration)

**Example Activity Stream:**
```
Recent Activity:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 Sarah added "milk" to Weekend Shopping
   2 minutes ago

💬 John commented on "Weekend Shopping"
   "Can we do pasta tonight?"
   15 minutes ago

📋 Mom updated Sunday Meal Plan
   1 hour ago

✅ Dad checked off 5 items at store
   2 hours ago

🔗 Sarah shared: "New chicken recipe"
   Yesterday at 3:45 PM
```

**Features:**
- Auto-generated from existing actions (grocery, meal plans)
- Manual posts (comments, links, photos)
- @mentions for direct notifications
- Filtering (all, grocery, meal plans, messages)
- Real-time updates

### 2. Messaging/Comments System

**Comment Locations:**
- Individual grocery items ("Out of stock, get alternative")
- Meal plans ("Let's switch Tuesday and Wednesday")
- Recipes ("We loved this! Make again")
- General household chat

**Features:**
- @mentions to ping specific family members
- Reply threads (keep conversations organized)
- Reactions (👍, ❤️, 😋, ✅)
- Rich text (links, formatting)
- Attachments (photos, external links)

### 3. Shared Resources

**What Can Be Shared:**
- ✅ Grocery lists (already implemented)
- ✅ Meal plans (already implemented)
- 🆕 Recipe library (household-specific favorites)
- 🆕 Saved links/inspirations
- 🆕 Photos (meal photos, recipe screenshots)
- 🆕 External recipe links

**Sharing Flow:**
1. User finds recipe online
2. Shares to household with comment
3. Others can discuss
4. Save to household recipe collection
5. Add to meal plan
6. Auto-generate grocery list

### 4. Calendar Integration

**Features:**
- Visual meal calendar (what's for dinner this week)
- Shopping schedule (who's shopping when)
- Cooking assignments (who's cooking tonight)
- Repeat meals tracking
- Historical view ("What did we eat last month?")

### 5. Smart Organization

**Multiple Households:**
- Home household
- Vacation house
- College apartment
- Each fully isolated

**Scoping:**
- Everything tagged with household_id
- Switch between households easily
- No data bleeding between households

**Historical Reference:**
- "What did we eat in September?"
- "Show me all pasta recipes we've made"
- "When did we last buy milk?"

---

## 🗄️ Technical Architecture

### Database Schema

```sql
-- Households (already exists, may need enhancements)
households
├── id
├── name
├── created_by
├── members[] (user_ids)
├── settings (json)
└── created_at

-- NEW: Activity Feed
household_feed
├── id
├── household_id
├── type (comment, update, share, checklist, etc.)
├── user_id
├── content (text/json)
├── related_resource_type (grocery_list, meal_plan, recipe)
├── related_resource_id
├── metadata (json - for rich data)
└── timestamp

-- NEW: Household Messages/Comments
household_messages
├── id
├── household_id
├── thread_id (optional - for replies)
├── parent_message_id (for threading)
├── user_id
├── message_text
├── mentions[] (user_ids)
├── attachments[] (urls, file_ids)
├── reactions[] (user_id, emoji)
└── timestamp

-- NEW: Household Shared Recipes
household_shared_recipes
├── id
├── household_id
├── recipe_id
├── shared_by (user_id)
├── notes
├── times_used
├── last_made
└── created_at

-- NEW: Household Shared Links
household_shared_links
├── id
├── household_id
├── user_id
├── url
├── title
├── description
├── preview_image
├── category (recipe, article, video)
└── created_at

-- ENHANCE: Add to existing grocery_lists
grocery_lists
├── ... (existing fields)
├── household_id (add if not exists)
└── comments_count

-- ENHANCE: Add to existing meal_plans
meal_plans
├── ... (existing fields)
├── household_id (add if not exists)
└── comments_count

-- NEW: Comments on Resources
resource_comments
├── id
├── household_id
├── resource_type (grocery_list, meal_plan, recipe, general)
├── resource_id
├── user_id
├── comment_text
├── mentions[]
├── parent_comment_id (for replies)
└── timestamp
```

### API Endpoints (Backend)

```python
# Feed/Activity
GET  /api/v2/households/{id}/feed
POST /api/v2/households/{id}/feed/post

# Messages
GET  /api/v2/households/{id}/messages
POST /api/v2/households/{id}/messages
PUT  /api/v2/households/{id}/messages/{message_id}
DEL  /api/v2/households/{id}/messages/{message_id}

# Comments on Resources
GET  /api/v2/households/{id}/comments?resource_type=grocery_list&resource_id=123
POST /api/v2/households/{id}/comments
POST /api/v2/households/{id}/comments/{id}/react

# Shared Recipes
GET  /api/v2/households/{id}/recipes
POST /api/v2/households/{id}/recipes/share
GET  /api/v2/households/{id}/recipes/{recipe_id}

# Shared Links
GET  /api/v2/households/{id}/links
POST /api/v2/households/{id}/links/share

# Calendar
GET  /api/v2/households/{id}/calendar?start_date=2025-10-01&end_date=2025-10-31
POST /api/v2/households/{id}/calendar/meals
```

### Mobile App Components

```javascript
// New Screens
- HouseholdHubScreen (main feed)
- HouseholdMessagesScreen (dedicated chat)
- HouseholdCalendarScreen
- HouseholdRecipesScreen (shared collection)
- HouseholdSettingsScreen

// New Components
- ActivityFeedItem
- MessageThread
- CommentBox
- MentionInput
- HouseholdSwitcher
- CalendarView
- SharedRecipeCard

// Enhanced Components
- HomeScreen (add activity feed section)
- GroceryListScreen (add comments)
- MealPlanScreen (add comments)
```

---

## 🚀 Implementation Phases

### **Phase 1: Basic Hub (Foundation)** - 2 weeks
**Goal:** Get household activity visible on home page

- [ ] Create household_feed table
- [ ] Build activity generation system (auto-create feed items)
- [ ] Design ActivityFeedItem component
- [ ] Add feed section to HomeScreen
- [ ] Basic filtering (grocery, meal plans, all)
- [ ] Pull-to-refresh

**Deliverable:** Users see recent household activity on home page

---

### **Phase 2: Messaging Core** - 2 weeks
**Goal:** Enable basic household communication

- [ ] Create household_messages table
- [ ] Build messaging API endpoints
- [ ] Create HouseholdMessagesScreen
- [ ] Implement MessageThread component
- [ ] Add @mention support
- [ ] Push notifications for mentions
- [ ] Read receipts

**Deliverable:** Users can send messages in household chat

---

### **Phase 3: Comments on Resources** - 1 week
**Goal:** Add context to grocery lists & meal plans

- [ ] Create resource_comments table
- [ ] Add CommentBox component
- [ ] Add comments section to GroceryListScreen
- [ ] Add comments section to MealPlanScreen
- [ ] Comment notifications

**Deliverable:** Users can comment on lists and plans

---

### **Phase 4: Recipe Sharing** - 2 weeks
**Goal:** Share and save household recipes

- [ ] Create household_shared_recipes table
- [ ] Create household_shared_links table
- [ ] Build recipe sharing API
- [ ] Add "Share to Household" button on recipes
- [ ] Create HouseholdRecipesScreen (shared collection)
- [ ] Link preview generation
- [ ] External link sharing (from web browser)

**Deliverable:** Users can share and browse household recipes

---

### **Phase 5: Calendar & Planning** - 2 weeks
**Goal:** Visual meal planning for households

- [ ] Create HouseholdCalendarScreen
- [ ] Calendar view component
- [ ] Drag-and-drop meal assignment
- [ ] Cooking assignments
- [ ] Shopping schedule integration
- [ ] Historical view

**Deliverable:** Household calendar for meal planning

---

### **Phase 6: Intelligence & Polish** - 2 weeks
**Goal:** Smart features and refinements

- [ ] Search household history
- [ ] "What did we eat?" queries
- [ ] Recipe recommendations based on household patterns
- [ ] Shopping pattern analysis
- [ ] Rich notifications
- [ ] Performance optimization
- [ ] UI polish

**Deliverable:** Smart, polished household experience

---

## 💡 UX Design Considerations

### Home Page Layout (Revised)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏠 Tran Family Household ▼  ┃ ← Tap to switch
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────┐
│ 📊 Quick Stats              │
│ • 12 items on grocery list  │
│ • 5 meals planned this week │
│ • 3 new messages            │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 💬 Recent Activity    [All▼]│
├─────────────────────────────┤
│ 🛒 Sarah added "milk"       │
│    to Weekend Shopping      │
│    2 min ago          [→]   │
├─────────────────────────────┤
│ 💬 John: "Get extra eggs"  │
│    on Weekend Shopping      │
│    15 min ago         [→]   │
├─────────────────────────────┤
│ ✅ Mom completed Sunday     │
│    meal plan                │
│    1 hour ago         [→]   │
├─────────────────────────────┤
│ 🔗 Sarah shared a recipe    │
│    "Amazing Lasagna 🍝"     │
│    Yesterday          [→]   │
└─────────────────────────────┘

[View All Activity →]

┌─────────────────────────────┐
│ 🎯 Quick Actions            │
│ [📝 New Message]            │
│ [🔗 Share Link]             │
│ [🛒 View Grocery List]      │
└─────────────────────────────┘
```

### Navigation Enhancement

**Add Household Switcher:**
- Top-left dropdown/modal
- Shows all user's households
- Quick switch
- Create new household option

**Bottom Nav Stays Same:**
- Home (now has feed)
- Grocery List
- My Recipes
- Add Recipe
- Meal Plan
- Friends

### Notification Strategy

**Push Notifications:**
- @mentions
- Direct replies to user's comments
- Items added while user is shopping
- Meal assigned to user

**In-App Notifications:**
- All household activity (badge on Home tab)
- Unread message count

**Email Digest:**
- Daily summary (optional)
- Weekly meal plan summary

---

## 🎬 User Scenarios

### Scenario 1: Sarah Finds a Recipe Online

1. **Sarah** is browsing Pinterest on her phone
2. Finds amazing lasagna recipe
3. Opens YesChef app → "Share to Household"
4. Adds comment: "Found this amazing recipe! 🍝 @Mom what do you think?"
5. **Mom** gets push notification
6. Opens app, sees post in household feed
7. Taps to view recipe preview
8. Replies: "Looks great! Let's do it Sunday?"
9. **Sarah** adds recipe to Sunday meal plan
10. App auto-generates grocery list items
11. **Dad** sees notification, checks items off at store
12. Feed shows all activity in real-time

### Scenario 2: Last-Minute Grocery Store Change

1. **Dad** is at grocery store
2. Sees milk is out of stock
3. Opens grocery list, sees "2% Milk"
4. Comments on item: "Out of stock, getting whole milk instead @Sarah"
5. **Sarah** gets notification while cooking
6. Replies: "👍 Perfect, thanks!"
7. **Dad** checks off item
8. Everyone sees the change in real-time

### Scenario 3: Weekly Meal Planning

1. **Family** opens household calendar on Sunday
2. **Mom** drags "Spaghetti" to Tuesday
3. **John** comments: "Can we do pasta Wednesday instead? I have practice Tuesday"
4. **Mom** moves meal to Wednesday
5. **Dad** gets notification, sees the change
6. App updates grocery list automatically
7. **Sarah** assigns herself to cook Tuesday

### Scenario 4: Discovering Past Meals

1. **John** asks: "What was that chicken thing we made last month?"
2. **Mom** opens household feed
3. Filters to "Meal Plans" + "September"
4. Scrolls through history
5. Finds "Lemon Garlic Chicken"
6. Taps to view full recipe
7. Adds to this week's meal plan
8. Comments: "Making this again! Everyone loved it"

---

## ❓ Key Questions to Answer

### 1. Privacy & Permissions
- **Q:** Can household members see all past activity?
- **A:** TBD - Recommend: Yes, full transparency within household
- **Q:** What about deleted messages?
- **A:** TBD - Recommend: Show "Message deleted" placeholder

### 2. Household Management
- **Q:** Who can invite new members?
- **A:** TBD - Recommend: Any member can invite, admin can remove
- **Q:** Who can delete household?
- **A:** TBD - Recommend: Only creator, requires confirmation

### 3. Multiple Households
- **Q:** How many households can a user join?
- **A:** TBD - Recommend: Unlimited, but show most recent 5
- **Q:** How to handle "Home" vs "Vacation House"?
- **A:** TBD - Each household independent, user switches context

### 4. Notifications
- **Q:** How chatty should notifications be?
- **A:** TBD - Recommend: Configurable per household
- **Options:** All activity, mentions only, important only, none

### 5. Data Retention
- **Q:** How long to keep feed history?
- **A:** TBD - Recommend: Indefinite (it's valuable), add archive feature
- **Q:** What about old grocery lists?
- **A:** TBD - Keep checked lists for 30 days, archive for reference

### 6. Real-time Updates
- **Q:** Use WebSockets or polling?
- **A:** TBD - Recommend: Start with polling (30s), add WebSockets later

### 7. Offline Support
- **Q:** How to handle offline posts?
- **A:** TBD - Recommend: Queue messages, send when online

---

## 🎯 Success Metrics

### Engagement Metrics
- Daily active users per household
- Messages sent per day
- Comments per grocery list/meal plan
- Recipe shares per week

### Feature Usage
- % of households with >1 active member
- % of users who check feed daily
- % of grocery lists with comments
- % of meal plans with comments

### Retention
- Week-over-week household activity
- User return rate (7-day, 30-day)
- Household churn rate

### Quality Metrics
- Average response time to @mentions
- Completion rate of grocery lists
- Success rate of meal plan collaboration

---

## 🚨 Technical Risks & Mitigations

### Risk 1: Real-time Sync Complexity
**Problem:** Multiple users editing same grocery list simultaneously
**Mitigation:** Optimistic updates + conflict resolution, show "X is typing..."

### Risk 2: Notification Overload
**Problem:** Too many notifications annoy users
**Mitigation:** Smart grouping ("3 new updates"), configurable settings

### Risk 3: Data Privacy
**Problem:** Household members see each other's data
**Mitigation:** Clear onboarding about sharing, explicit consent

### Risk 4: Performance at Scale
**Problem:** Large households with long histories slow down
**Mitigation:** Pagination, virtual scrolling, optimize queries

### Risk 5: Message Storage Costs
**Problem:** Storing all messages/comments forever
**Mitigation:** Archive old data, compress images, set retention policies

---

## 💰 Monetization Opportunities (Future)

### Premium Household Features
- Unlimited households (free: 2, premium: unlimited)
- Advanced calendar features
- Recipe AI recommendations
- Shopping analytics
- Priority support
- Custom household themes

### Pricing Ideas
- Free: Basic household (2 households, 5 members each)
- Premium: $4.99/month (unlimited, advanced features)
- Family Plan: $9.99/month (up to 6 premium accounts)

---

## 📚 Resources & References

### Similar Apps to Study
1. **Cozi** - Family organizer
2. **OurGroceries** - Shared shopping lists
3. **AnyList** - Recipe organization + lists
4. **Paprika** - Recipe manager + meal planning
5. **Notion** - Collaborative workspace UX
6. **Slack** - Threading and mentions
7. **Discord** - Server (household) structure

### Technical Resources
- WebSocket libraries (Socket.io, Pusher)
- Real-time sync patterns
- Collaborative editing algorithms
- Push notification best practices

---

## 🎬 Next Steps

### Immediate (When Ready to Start)
1. Review this document with team
2. Prioritize features for MVP
3. Create detailed Phase 1 spec
4. Design mockups for home page feed
5. Set up household_feed table
6. Build activity generation system

### Research Needed
1. Test competitor apps (Cozi, OurGroceries)
2. Interview potential users about household coordination pain points
3. Prototype notification strategy
4. Design comment threading UI

### Dependencies
1. Existing household system (already built)
2. Push notification infrastructure
3. Real-time backend capability
4. Image hosting for shared photos

---

## 📝 Notes & Ideas

- Consider voice messages for quick updates
- Video sharing for recipe techniques
- Integration with smart home (Alexa: "What's for dinner?")
- Barcode scanning integration (add items from pantry)
- Recipe rating system within household
- "Hall of Fame" recipes (most cooked)
- Shopping list template system
- Meal prep mode (batch cooking view)

---

**Document will be updated as features are implemented and requirements evolve.**
