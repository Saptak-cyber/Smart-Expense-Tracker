# AI Chatbot Actions Guide

Your AI chatbot can now perform actions! It's no longer just read-only.

## What Your Chatbot Can Do

### 1. Create Budgets 💰
Ask the chatbot to set budgets for different categories.

**Examples:**
- "Set a budget of ₹5000 for food this month"
- "Create a ₹10000 budget for transportation in March"
- "I want to budget ₹3000 for entertainment"

### 2. Add Expenses 📝
Record expenses through natural conversation.

**Examples:**
- "Add an expense of ₹150 for groceries today"
- "I spent ₹500 on fuel yesterday"
- "Record ₹1200 for dinner at a restaurant"

### 3. Update Budgets 🔄
Modify existing budget amounts.

**Examples:**
- "Increase my food budget to ₹6000"
- "Change my entertainment budget to ₹4000"
- "Update the transportation budget to ₹8000"

### 4. Answer Questions 💬
Still does everything it did before!

**Examples:**
- "How much did I spend this month?"
- "What's my top spending category?"
- "Show my budget status"
- "Analyze my spending trends"

## How It Works

### Function Calling
The chatbot uses Google Gemini's **function calling** feature to:
1. Understand your intent
2. Extract necessary information (amount, category, date)
3. Execute the appropriate action
4. Confirm the result

### Smart Defaults
If you don't specify certain details, the chatbot uses smart defaults:
- **Date:** Today's date
- **Month:** Current month
- **Year:** Current year

### Category Matching
The chatbot automatically matches category names to IDs:
- "food" → Food category
- "transportation" or "transport" → Transportation category
- "entertainment" → Entertainment category

## Response Format

When the chatbot performs actions, you'll see:

✅ **Success:**
```
✅ Successfully completed 1 action(s):

• Created budget of ₹5000 for Food
```

❌ **Failure:**
```
❌ 1 action(s) failed:

• Budget for this category and month already exists
```

## Example Conversations

### Creating a Budget
**You:** "Set a budget of ₹5000 for food this month"

**Chatbot:** 
```
✅ Successfully completed 1 action(s):

• Created budget of ₹5000 for Food
```

### Adding an Expense
**You:** "I spent ₹150 on groceries today"

**Chatbot:**
```
✅ Successfully completed 1 action(s):

• Added expense of ₹150 for groceries
```

### Multiple Actions
**You:** "Set a ₹5000 food budget and add a ₹200 grocery expense"

**Chatbot:**
```
✅ Successfully completed 2 action(s):

• Created budget of ₹5000 for Food
• Added expense of ₹200 for groceries
```

## Available Categories

Your chatbot knows about these categories:
- Food
- Transportation
- Entertainment
- Shopping
- Bills
- Healthcare
- Education
- Other

(Check your database for the complete list)

## Technical Details

### Functions Available
1. `create_budget` - Creates a new budget
2. `add_expense` - Adds a new expense
3. `update_budget` - Updates an existing budget

### Security
- All actions require authentication
- Users can only modify their own data
- Rate limiting is applied to prevent abuse

## Limitations

### What It CAN'T Do (Yet)
- ❌ Delete budgets
- ❌ Delete expenses
- ❌ Create new categories
- ❌ Generate reports
- ❌ Export data

### Error Handling
If something goes wrong, the chatbot will tell you:
- Duplicate budgets
- Invalid categories
- Missing information
- Database errors

## Tips for Best Results

1. **Be Specific:** Include amounts, categories, and dates
2. **Use Natural Language:** Talk normally, the AI understands context
3. **One Action at a Time:** For complex operations, break them down
4. **Check Results:** Review the confirmation messages

## Troubleshooting

### "Budget already exists"
You already have a budget for that category and month. Use "update" instead.

### "Category not found"
Make sure you're using a valid category name from the list above.

### "Missing information"
The chatbot will ask you for clarification if it needs more details.

## Future Enhancements

Potential features to add:
- Delete budgets and expenses
- Create recurring expenses
- Set spending alerts
- Generate custom reports
- Export data to CSV
- Bulk operations

---

**Last Updated:** February 14, 2026
