import { BalanceNotificationData } from "../types/notifications";
import { NotificationService } from "./NotificationService";

export class BalanceNotificationService {
  private static readonly LOW_BALANCE_THRESHOLD = 50;
  private static readonly CRITICAL_BALANCE_THRESHOLD = 20;
  private static readonly LARGE_TRANSACTION_THRESHOLD = 200;

  static async checkLowBalance(
    userId: string,
    accountId: string,
    currentBalance: number,
    accountName: string
  ): Promise<void> {
    try {
      if (
        currentBalance <= this.CRITICAL_BALANCE_THRESHOLD &&
        currentBalance > 0
      ) {
        const data: BalanceNotificationData = {
          type: "balance_critical",
          accountId,
          accountName,
          balance: currentBalance,
        };

        await NotificationService.sendNotification(
          "🚨 Critical Balance Alert",
          `Your ${accountName} balance is critically low: $${currentBalance.toFixed(2)}. Consider adding funds soon.`,
          data
        );

        console.log(
          `✅ Critical balance notification sent for ${accountName}: $${currentBalance}`
        );
      } else if (
        currentBalance <= this.LOW_BALANCE_THRESHOLD &&
        currentBalance > this.CRITICAL_BALANCE_THRESHOLD
      ) {
        const data: BalanceNotificationData = {
          type: "balance_low",
          accountId,
          accountName,
          balance: currentBalance,
        };

        await NotificationService.sendNotification(
          "⚠️ Low Balance Warning",
          `Your ${accountName} balance is getting low: $${currentBalance.toFixed(2)}`,
          data
        );

        console.log(
          `✅ Low balance notification sent for ${accountName}: $${currentBalance}`
        );
      } else if (currentBalance < 0) {
        const data: BalanceNotificationData = {
          type: "balance_critical",
          accountId,
          accountName,
          balance: currentBalance,
        };

        await NotificationService.sendNotification(
          "🔴 Negative Balance Alert",
          `Your ${accountName} has a negative balance: $${currentBalance.toFixed(2)}. Immediate attention required!`,
          data
        );

        console.log(
          `✅ Negative balance notification sent for ${accountName}: $${currentBalance}`
        );
      }
    } catch (error) {
      console.error("❌ Error checking low balance:", error);
    }
  }

  static async checkLargeTransaction(
    amount: number,
    accountName: string,
    transactionType: "income" | "expense"
  ): Promise<void> {
    try {
      const absoluteAmount = Math.abs(amount);

      if (absoluteAmount >= this.LARGE_TRANSACTION_THRESHOLD) {
        const data: BalanceNotificationData = {
          type: "large_transaction",
          accountId: "unknown",
          accountName,
          amount: absoluteAmount,
        };

        const emoji = transactionType === "income" ? "💰" : "💸";
        const typeText = transactionType === "income" ? "received" : "spent";

        await NotificationService.sendNotification(
          `${emoji} Large Transaction Alert`,
          `You just ${typeText} $${absoluteAmount.toFixed(2)}${accountName ? ` from ${accountName}` : ""}`,
          data
        );

        console.log(
          `✅ Large transaction notification sent: $${absoluteAmount} (${transactionType})`
        );
      }
    } catch (error) {
      console.error("❌ Error checking large transaction:", error);
    }
  }

  static async sendBalanceSummary(
    userId: string,
    accounts: Array<{
      id: string;
      name: string;
      balance: number;
      type: string;
    }>
  ): Promise<void> {
    try {
      if (accounts.length === 0) return;

      const totalBalance = accounts.reduce(
        (sum, account) => sum + account.balance,
        0
      );
      const lowBalanceAccounts = accounts.filter(
        (account) =>
          account.balance <= this.LOW_BALANCE_THRESHOLD && account.balance > 0
      );
      const negativeAccounts = accounts.filter(
        (account) => account.balance < 0
      );

      let title = "📊 Account Balance Summary";
      let body = `Total across ${accounts.length} accounts: $${totalBalance.toFixed(2)}`;

      if (negativeAccounts.length > 0) {
        body += `\n⚠️ ${negativeAccounts.length} account(s) have negative balances`;
        title = "🚨 Balance Summary - Action Required";
      } else if (lowBalanceAccounts.length > 0) {
        body += `\n⚠️ ${lowBalanceAccounts.length} account(s) have low balances`;
        title = "⚠️ Balance Summary - Low Balances";
      }

      const data: BalanceNotificationData = {
        type:
          negativeAccounts.length > 0
            ? "balance_critical"
            : lowBalanceAccounts.length > 0
              ? "balance_low"
              : "large_transaction",
        accountId: "summary",
        accountName: "All Accounts",
        balance: totalBalance,
      };

      await NotificationService.sendNotification(title, body, data);
      console.log("✅ Balance summary notification sent");
    } catch (error) {
      console.error("❌ Error sending balance summary:", error);
    }
  }

  static async checkAllAccountBalances(
    userId: string,
    accounts: Array<{
      id: string;
      name: string;
      balance: number;
      type: string;
    }>
  ): Promise<void> {
    try {
      let alertsSent = 0;

      for (const account of accounts) {
        const previousAlertsSent = alertsSent;

        await this.checkLowBalance(
          userId,
          account.id,
          account.balance,
          account.name
        );

        if (
          account.balance <= this.LOW_BALANCE_THRESHOLD ||
          account.balance < 0
        ) {
          alertsSent++;
        }
      }

      if (alertsSent > 1) {
        const problemAccounts = accounts.filter(
          (account) =>
            account.balance <= this.LOW_BALANCE_THRESHOLD || account.balance < 0
        );

        await NotificationService.sendNotification(
          "📊 Multiple Balance Issues",
          `${alertsSent} of your accounts need attention. Check your account balances.`,
          {
            type: "balance_critical",
            accountId: "multiple",
            accountName: "Multiple Accounts",
            balance: 0,
          }
        );
      }

      console.log(
        `✅ Checked ${accounts.length} accounts, sent ${alertsSent} balance alerts`
      );
    } catch (error) {
      console.error("❌ Error checking all account balances:", error);
    }
  }

  static async sendWeeklyBalanceReport(
    userId: string,
    accounts: Array<{
      id: string;
      name: string;
      balance: number;
      type: string;
    }>,
    weeklySpending: number,
    weeklyIncome: number
  ): Promise<void> {
    try {
      const totalBalance = accounts.reduce(
        (sum, account) => sum + account.balance,
        0
      );
      const netChange = weeklyIncome - weeklySpending;
      const healthyAccounts = accounts.filter(
        (account) => account.balance > this.LOW_BALANCE_THRESHOLD
      );

      let healthStatus = "";
      let emoji = "";

      if (netChange > 0) {
        healthStatus = "improving";
        emoji = "📈";
      } else if (netChange < -100) {
        healthStatus = "declining";
        emoji = "📉";
      } else {
        healthStatus = "stable";
        emoji = "📊";
      }

      const title = `${emoji} Weekly Balance Report`;
      const body =
        `Your finances are ${healthStatus}. Total balance: $${totalBalance.toFixed(2)}. ` +
        `Net change: ${netChange >= 0 ? "+" : ""}$${netChange.toFixed(2)}. ` +
        `${healthyAccounts.length}/${accounts.length} accounts healthy.`;

      const data: BalanceNotificationData = {
        type: netChange < -100 ? "balance_critical" : "large_transaction",
        accountId: "weekly-report",
        accountName: "Weekly Report",
        balance: totalBalance,
        amount: Math.abs(netChange),
      };

      await NotificationService.sendNotification(title, body, data);
      console.log("✅ Weekly balance report sent");
    } catch (error) {
      console.error("❌ Error sending weekly balance report:", error);
    }
  }

  static setBalanceThresholds(
    lowBalanceThreshold: number,
    criticalBalanceThreshold: number,
    largeTransactionThreshold: number
  ): void {
    console.log("⚙️ Balance thresholds updated:", {
      low: lowBalanceThreshold,
      critical: criticalBalanceThreshold,
      large: largeTransactionThreshold,
    });
  }

  static shouldNotifyBalanceChange(
    previousBalance: number,
    newBalance: number,
    accountName: string
  ): { shouldNotify: boolean; type: "improvement" | "decline" | "critical" } {
    const change = newBalance - previousBalance;
    const crossedLowThreshold =
      previousBalance > this.LOW_BALANCE_THRESHOLD &&
      newBalance <= this.LOW_BALANCE_THRESHOLD;
    const crossedCriticalThreshold =
      previousBalance > this.CRITICAL_BALANCE_THRESHOLD &&
      newBalance <= this.CRITICAL_BALANCE_THRESHOLD;
    const wentNegative = previousBalance >= 0 && newBalance < 0;
    const recoveredFromNegative = previousBalance < 0 && newBalance >= 0;

    if (wentNegative || crossedCriticalThreshold) {
      return { shouldNotify: true, type: "critical" };
    } else if (crossedLowThreshold) {
      return { shouldNotify: true, type: "decline" };
    } else if (
      recoveredFromNegative ||
      (previousBalance <= this.LOW_BALANCE_THRESHOLD &&
        newBalance > this.LOW_BALANCE_THRESHOLD)
    ) {
      return { shouldNotify: true, type: "improvement" };
    }

    return { shouldNotify: false, type: "decline" };
  }

  static async notifyBalanceImprovement(
    accountId: string,
    accountName: string,
    newBalance: number,
    improvement: number
  ): Promise<void> {
    try {
      const data: BalanceNotificationData = {
        type: "large_transaction",
        accountId,
        accountName,
        balance: newBalance,
        amount: improvement,
      };

      await NotificationService.sendNotification(
        "📈 Balance Improved",
        `Great news! Your ${accountName} balance increased by $${improvement.toFixed(2)} to $${newBalance.toFixed(2)}`,
        data
      );

      console.log(
        `✅ Balance improvement notification sent for ${accountName}`
      );
    } catch (error) {
      console.error(
        "❌ Error sending balance improvement notification:",
        error
      );
    }
  }

  static getBalanceThresholds(): {
    lowBalance: number;
    criticalBalance: number;
    largeTransaction: number;
  } {
    return {
      lowBalance: this.LOW_BALANCE_THRESHOLD,
      criticalBalance: this.CRITICAL_BALANCE_THRESHOLD,
      largeTransaction: this.LARGE_TRANSACTION_THRESHOLD,
    };
  }
}
