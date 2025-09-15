// Help and Support utilities for SpendSight

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category:
    | "getting-started"
    | "categories"
    | "accounts"
    | "security"
    | "troubleshooting";
  tags: string[];
  lastUpdated: Date;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website: string;
  businessHours: {
    weekdays: string;
    weekends: string;
  };
}

export class HelpService {
  static readonly CONTACT_INFO: ContactInfo = {
    email: "support@spendsight.com",
    phone: "+1-555-SPEND-24",
    website: "https://www.spendsight.com/support",
    businessHours: {
      weekdays: "Monday - Friday: 9 AM - 6 PM EST",
      weekends: "Saturday - Sunday: 10 AM - 4 PM EST",
    },
  };

  static readonly QUICK_TIPS = [
    {
      title: "Set Up Your Budget",
      description:
        "Let SpendSight create your initial budget allocation based on your salary",
      action: "Enter your monthly income when prompted",
    },
    {
      title: "Track Daily Expenses",
      description:
        "Add transactions regularly to get accurate spending insights",
      action: "Use the + button to add expenses and income",
    },
    {
      title: "Review Your Categories",
      description: "Customize categories to match your spending habits",
      action: "Go to Categories to add, edit, or organize",
    },
    {
      title: "Monitor Your Goals",
      description: "Set financial goals and track your progress",
      action: "Create goals for savings, purchases, or debt reduction",
    },
  ];

  /**
   * Generate support email template
   */
  static generateSupportEmail(
    issue: string,
    userInfo?: { email?: string; version?: string }
  ) {
    const subject = `SpendSight Support Request: ${issue}`;
    const body = `
Hi SpendSight Support Team,

I need help with: ${issue}

Device Information:
- App Version: ${userInfo?.version || "1.0.0"}
- User Email: ${userInfo?.email || "Not provided"}
- Platform: Mobile

Description of the issue:
[Please describe your issue in detail here]

Steps I've already tried:
[Please list any troubleshooting steps you've already attempted]

Thank you for your assistance!

Best regards,
A SpendSight User
    `.trim();

    return { subject, body };
  }

  /**
   * Get help articles by category
   */
  static getHelpByCategory(category: HelpArticle["category"]): HelpArticle[] {
    // In a real implementation, this would fetch from a database
    const articles: HelpArticle[] = [
      {
        id: "1",
        title: "Creating Your First Budget",
        content: "Learn how to set up your initial budget allocation...",
        category: "getting-started",
        tags: ["budget", "setup", "beginner"],
        lastUpdated: new Date(),
      },
      {
        id: "2",
        title: "Managing Custom Categories",
        content: "How to create, edit, and organize your expense categories...",
        category: "categories",
        tags: ["categories", "customization"],
        lastUpdated: new Date(),
      },
      // Add more articles as needed
    ];

    return articles.filter((article) => article.category === category);
  }

  /**
   * Search help articles
   */
  static searchHelp(query: string): HelpArticle[] {
    const allArticles = [
      ...this.getHelpByCategory("getting-started"),
      ...this.getHelpByCategory("categories"),
      ...this.getHelpByCategory("accounts"),
      ...this.getHelpByCategory("security"),
      ...this.getHelpByCategory("troubleshooting"),
    ];

    return allArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(query.toLowerCase())
        )
    );
  }

  /**
   * Check if user needs onboarding help
   */
  static shouldShowOnboardingHelp(userCreatedAt: Date): boolean {
    const daysSinceJoined = Math.floor(
      (new Date().getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceJoined <= 7; // Show onboarding help for first week
  }

  /**
   * Get contextual help based on current screen
   */
  static getContextualHelp(
    screenName: string
  ): { title: string; tip: string } | null {
    const contextualTips: Record<string, { title: string; tip: string }> = {
      dashboard: {
        title: "Dashboard Overview",
        tip: "Your dashboard shows your budget overview. Tap account cards to see details and transactions.",
      },
      categories: {
        title: "Managing Categories",
        tip: "Create custom categories to better organize your expenses. Default categories cannot be deleted.",
      },
      accounts: {
        title: "Account Management",
        tip: "Transfer money between accounts to rebalance your budget allocation as needed.",
      },
    };

    return contextualTips[screenName] || null;
  }
}

export default HelpService;
