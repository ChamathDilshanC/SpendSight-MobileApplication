# Services Architecture

This directory contains the refactored service layer with better separation of concerns. Each service handles a specific domain of the financial management system.

## New Service Structure

### 🏦 AccountService

- `initializeDefaultAccounts()` - Create default accounts for new users
- `getUserAccounts()` - Fetch all accounts for a user
- `createAccount()` - Create custom accounts
- `updateAccount()` - Update account details
- `updateAccountBalance()` - Update account balance
- `deleteAccount()` - Soft delete an account
- `subscribeToAccounts()` - Real-time account updates

### 📊 CategoryService

- `initializeDefaultCategories()` - Create default categories
- `getUserCategories()` - Fetch all categories
- `createCategory()` - Create custom categories
- `updateCategory()` - Update category details
- `deleteCategory()` - Soft delete a category
- `getCategoriesByType()` - Filter by income/expense
- `searchCategories()` - Search categories by name

### 💰 TransactionService

- `createTransaction()` - Create new transactions with balance updates
- `getUserTransactions()` - Fetch transactions with filtering
- `updateTransaction()` - Update transaction details
- `deleteTransaction()` - Delete transaction and reverse balance changes
- `getTransactionsByDateRange()` - Filter by date range
- `getRecentTransactions()` - Get recent transactions
- `subscribeToTransactions()` - Real-time transaction updates

### 🎯 GoalService

- `createGoal()` - Create new financial goals
- `getUserGoals()` - Fetch all goals
- `updateGoal()` - Update goal details
- `payTowardGoal()` - Make payments toward goals
- `completeGoal()` - Mark goals as completed
- `getActiveGoals()` - Get incomplete goals
- `getCompletedGoals()` - Get completed goals
- `getGoalsByCategory()` - Filter by category
- `getGoalsDueSoon()` - Get goals approaching deadline
- `calculateGoalProgress()` - Calculate completion percentage

## Migration Complete ✅

The migration from the monolithic `FinanceService` to specialized services has been completed successfully. All application code now uses the new service architecture, providing better organization, maintainability, and testability.

## Usage Examples

### Current Architecture (Recommended)

```typescript
import { AccountService, TransactionService } from "../services";

// Get user accounts
const accounts = await AccountService.getUserAccounts(userId);

// Create a transaction
const transactionId = await TransactionService.createTransaction(userId, {
  type: "expense",
  amount: 100,
  description: "Coffee",
  fromAccountId: "account123",
  // ...
});
```

### Easy Import

```typescript
// Import all services at once
import {
  AccountService,
  CategoryService,
  TransactionService,
  GoalService,
} from "../services";
```

## Benefits

✅ **Better Organization** - Each service has a single responsibility
✅ **Easier Testing** - Smaller, focused services are easier to test
✅ **Better Maintainability** - Changes to one domain don't affect others
✅ **Backward Compatibility** - Existing code continues to work
✅ **Type Safety** - Full TypeScript support with better IntelliSense
✅ **Performance** - Smaller bundles when importing only needed services

## Development Notes

The service architecture follows these principles:

- **Single Responsibility**: Each service handles one domain
- **Dependency Injection**: Services can be easily mocked for testing
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Real-time Updates**: Firebase listeners provide live data synchronization

All services are now actively used throughout the application, providing a clean separation of concerns and improved maintainability.
