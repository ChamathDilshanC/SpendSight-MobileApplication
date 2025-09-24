import { Goal } from "../types/finance";
import { GoalNotificationData } from "../types/notifications";
import { NotificationService } from "./NotificationService";

export class GoalNotificationService {
  static async updateGoalProgress(
    userId: string,
    goalId: string,
    addedAmount: number
  ): Promise<void> {
    try {
      const { GoalService } = await import("./GoalService");
      const goals = await GoalService.getUserGoals(userId);
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) {
        console.log("❌ Goal not found for progress update:", goalId);
        return;
      }

      const previousProgress = this.calculateProgress(
        goal.currentAmount - addedAmount,
        goal.targetAmount
      );
      const newProgress = this.calculateProgress(
        goal.currentAmount,
        goal.targetAmount
      );

      console.log(
        `📈 Goal progress: ${goal.name} ${previousProgress}% → ${newProgress}%`
      );

      await this.checkProgressMilestones(
        goal,
        previousProgress,
        newProgress,
        addedAmount
      );

      if (newProgress >= 100 && previousProgress < 100) {
        await this.notifyGoalCompleted(goal);
      }
    } catch (error) {
      console.error("❌ Error updating goal progress:", error);
    }
  }

  private static async checkProgressMilestones(
    goal: Goal,
    previousProgress: number,
    newProgress: number,
    addedAmount: number
  ): Promise<void> {
    const milestones = [25, 50, 75];

    for (const milestone of milestones) {
      if (previousProgress < milestone && newProgress >= milestone) {
        await this.notifyGoalMilestone(goal, milestone, addedAmount);
      }
    }
  }

  static async notifyGoalCompleted(goal: Goal): Promise<void> {
    const data: GoalNotificationData = {
      type: "goal_completed",
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress: 100,
    };

    await NotificationService.sendNotification(
      "🎉 Goal Achieved!",
      `Congratulations! You've reached your "${goal.name}" goal of $${goal.targetAmount.toFixed(2)}!`,
      data
    );

    console.log("✅ Goal completion notification sent:", goal.name);
  }

  static async notifyGoalMilestone(
    goal: Goal,
    milestone: number,
    addedAmount: number
  ): Promise<void> {
    const remaining = goal.targetAmount - goal.currentAmount;

    const data: GoalNotificationData = {
      type: "goal_milestone",
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress: milestone,
      addedAmount,
      remaining: remaining > 0 ? remaining : 0,
    };

    let title = "";
    let body = "";

    switch (milestone) {
      case 25:
        title = "🌱 Great Start!";
        body = `You've reached 25% of your "${goal.name}" goal. Keep it up!`;
        break;
      case 50:
        title = "📈 Halfway There!";
        body = `Amazing! You're 50% towards your "${goal.name}" goal of $${goal.targetAmount.toFixed(2)}.`;
        break;
      case 75:
        title = "🚀 Almost There!";
        body = `You're 75% towards "${goal.name}". Only $${remaining.toFixed(2)} to go!`;
        break;
    }

    await NotificationService.sendNotification(title, body, data);
    console.log(
      `✅ Goal milestone notification sent: ${goal.name} - ${milestone}%`
    );
  }

  static async notifyGoalPayment(
    goal: Goal,
    amount: number,
    isWithdrawal: boolean = false
  ): Promise<void> {
    const progress = this.calculateProgress(
      goal.currentAmount,
      goal.targetAmount
    );
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    const data: GoalNotificationData = {
      type: "goal_update",
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress,
      addedAmount: amount,
      remaining,
    };

    if (isWithdrawal) {
      await NotificationService.sendNotification(
        "💸 Goal Withdrawal",
        `$${amount.toFixed(2)} withdrawn from "${goal.name}". Remaining balance: $${goal.currentAmount.toFixed(2)}`,
        data
      );
    } else {
      await NotificationService.sendNotification(
        "💰 Goal Payment",
        `$${amount.toFixed(2)} added to "${goal.name}". Progress: ${progress.toFixed(1)}% ($${remaining.toFixed(2)} remaining)`,
        data
      );
    }

    console.log(`✅ Goal payment notification sent: ${goal.name} - $${amount}`);
  }

  static async notifyAutoTransfer(
    goal: Goal,
    amount: number,
    fromAccountName: string
  ): Promise<void> {
    const progress = this.calculateProgress(
      goal.currentAmount,
      goal.targetAmount
    );
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    const data: GoalNotificationData = {
      type: "goal_update",
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress,
      addedAmount: amount,
      remaining,
    };

    await NotificationService.sendNotification(
      "🤖 Auto-Transfer Complete",
      `$${amount.toFixed(2)} automatically transferred from ${fromAccountName} to "${goal.name}". Progress: ${progress.toFixed(1)}%`,
      data
    );

    console.log(
      `✅ Auto-transfer notification sent: ${goal.name} - $${amount}`
    );
  }

  static async notifyGoalCreated(goal: Goal): Promise<void> {
    const data: GoalNotificationData = {
      type: "goal_update",
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress: 0,
    };

    await NotificationService.sendNotification(
      "🎯 New Goal Created",
      `"${goal.name}" goal created with target of $${goal.targetAmount.toFixed(2)}. Start saving today!`,
      data
    );

    console.log("✅ Goal creation notification sent:", goal.name);
  }

  static async notifyGoalDeadline(
    goal: Goal,
    daysRemaining: number
  ): Promise<void> {
    const progress = this.calculateProgress(
      goal.currentAmount,
      goal.targetAmount
    );
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    const data: GoalNotificationData = {
      type: "goal_update",
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress,
      remaining,
    };

    let title = "";
    let body = "";

    if (daysRemaining <= 0) {
      title = "⏰ Goal Deadline Reached";
      body = `Your "${goal.name}" goal deadline is today! Current progress: ${progress.toFixed(1)}%`;
    } else if (daysRemaining <= 7) {
      title = "⚠️ Goal Deadline Soon";
      body = `Only ${daysRemaining} days left for "${goal.name}"! You're ${progress.toFixed(1)}% there.`;
    } else if (daysRemaining <= 30) {
      title = "📅 Goal Reminder";
      body = `${daysRemaining} days left for "${goal.name}". Current progress: ${progress.toFixed(1)}%`;
    }

    if (title && body) {
      await NotificationService.sendNotification(title, body, data);
      console.log(
        `✅ Goal deadline notification sent: ${goal.name} - ${daysRemaining} days`
      );
    }
  }

  static async checkGoalDeadlines(userId: string): Promise<void> {
    try {
      const { GoalService } = await import("./GoalService");
      const activeGoals = await GoalService.getActiveGoals(userId);
      const now = new Date();

      for (const goal of activeGoals) {
        const timeDiff = goal.targetDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (
          daysRemaining === 30 ||
          daysRemaining === 7 ||
          daysRemaining === 1 ||
          daysRemaining === 0
        ) {
          await this.notifyGoalDeadline(goal, daysRemaining);
        }
      }
    } catch (error) {
      console.error("❌ Error checking goal deadlines:", error);
    }
  }

  static async sendProgressSummary(userId: string): Promise<void> {
    try {
      const { GoalService } = await import("./GoalService");
      const activeGoals = await GoalService.getActiveGoals(userId);

      if (activeGoals.length === 0) return;

      const totalTargetAmount = activeGoals.reduce(
        (sum, goal) => sum + goal.targetAmount,
        0
      );
      const totalCurrentAmount = activeGoals.reduce(
        (sum, goal) => sum + goal.currentAmount,
        0
      );
      const overallProgress = (totalCurrentAmount / totalTargetAmount) * 100;

      const nearCompletionGoals = activeGoals.filter((goal) => {
        const progress = this.calculateProgress(
          goal.currentAmount,
          goal.targetAmount
        );
        return progress >= 75 && progress < 100;
      });

      let body = `Overall progress: ${overallProgress.toFixed(1)}% across ${activeGoals.length} goals.`;

      if (nearCompletionGoals.length > 0) {
        body += ` ${nearCompletionGoals.length} goal(s) are almost complete!`;
      }

      await NotificationService.sendNotification(
        "📊 Goals Progress Summary",
        body,
        {
          type: "goal_update",
          goalId: "summary",
          goalName: "All Goals",
          targetAmount: totalTargetAmount,
          currentAmount: totalCurrentAmount,
          progress: overallProgress,
        }
      );

      console.log("✅ Goals progress summary sent");
    } catch (error) {
      console.error("❌ Error sending goals progress summary:", error);
    }
  }

  private static calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }

  static async scheduleWeeklyReminder(userId: string): Promise<void> {
    try {
      const reminderTime = 7 * 24 * 60 * 60;

      await NotificationService.scheduleNotification(
        "🎯 Weekly Goal Check-in",
        "How are your goals progressing? Take a moment to review and make a contribution!",
        reminderTime,
        {
          type: "goal_update",
          goalId: "reminder",
          goalName: "Weekly Check-in",
          targetAmount: 0,
          currentAmount: 0,
          progress: 0,
        }
      );

      console.log("✅ Weekly goal reminder scheduled");
    } catch (error) {
      console.error("❌ Error scheduling weekly goal reminder:", error);
    }
  }
}
