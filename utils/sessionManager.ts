import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "user_session";
const SESSION_EXPIRY_KEY = "user_session_expiry";
const SESSION_DURATION_DAYS = 10;

export interface SessionData {
  userId: string;
  email: string;
  loginTimestamp: number;
  expiryTimestamp: number;
}

export class SessionManager {

  static async saveSession(userId: string, email: string): Promise<void> {
    try {
      const now = Date.now();
      const expiryTime = now + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

      const sessionData: SessionData = {
        userId,
        email,
        loginTimestamp: now,
        expiryTimestamp: expiryTime,
      };

      await AsyncStorage.multiSet([
        [SESSION_KEY, JSON.stringify(sessionData)],
        [SESSION_EXPIRY_KEY, expiryTime.toString()],
      ]);

      console.log(
        `💾 Session saved for ${email}, expires in ${SESSION_DURATION_DAYS} days`
      );
    } catch (error) {
      console.error("❌ Failed to save session:", error);
    }
  }


  static async getValidSession(): Promise<SessionData | null> {
    try {
      const [sessionDataString, expiryString] = await AsyncStorage.multiGet([
        SESSION_KEY,
        SESSION_EXPIRY_KEY,
      ]);

      if (!sessionDataString[1] || !expiryString[1]) {
        console.log("🔍 No session found");
        return null;
      }

      const expiryTime = parseInt(expiryString[1]);
      const now = Date.now();

      if (now > expiryTime) {
        console.log("⏰ Session expired, clearing...");
        await this.clearSession();
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionDataString[1]);
      const daysLeft = Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000));
      console.log(
        `✅ Valid session found for ${sessionData.email}, ${daysLeft} days remaining`
      );

      return sessionData;
    } catch (error) {
      console.error("❌ Failed to get session:", error);
      await this.clearSession();
      return null;
    }
  }


  static async isSessionValid(): Promise<boolean> {
    const session = await this.getValidSession();
    return session !== null;
  }


  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SESSION_KEY, SESSION_EXPIRY_KEY]);
      console.log("🗑️ Session cleared");
    } catch (error) {
      console.error("❌ Failed to clear session:", error);
    }
  }


  static async extendSession(): Promise<void> {
    const currentSession = await this.getValidSession();
    if (currentSession) {
      await this.saveSession(currentSession.userId, currentSession.email);
      console.log("⏰ Session extended for another 10 days");
    }
  }


  static async getSessionInfo(): Promise<string> {
    const session = await this.getValidSession();
    if (!session) {
      return "No active session";
    }

    const now = Date.now();
    const timeLeft = session.expiryTimestamp - now;
    const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
    const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000)) % 24;

    return `Session active for ${session.email} - ${daysLeft}d ${hoursLeft}h remaining`;
  }
}
