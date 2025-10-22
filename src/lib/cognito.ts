import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';

// Configure Amplify
const amplifyConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_AWS_COGNITO_REGION || 'us-east-1',
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_WEB_CLIENT_ID || '',
    }
  }
};

Amplify.configure(amplifyConfig);

export interface CognitoUser {
  username: string;
  email?: string;
  sub: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

export class CognitoAuth {
  static async signIn(username: string, password: string): Promise<void> {
    try {
      await signIn({ username, password });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<CognitoUser | null> {
    try {
      const user = await getCurrentUser();
      return {
        username: user.username,
        email: user.signInDetails?.loginId,
        sub: user.userId,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async getAuthTokens(): Promise<AuthTokens | null> {
    try {
      const session = await fetchAuthSession();

      if (!session.tokens) {
        return null;
      }

      return {
        accessToken: session.tokens.accessToken.toString(),
        idToken: session.tokens.idToken?.toString() || '',
        refreshToken: (session.tokens as any).refreshToken?.toString(),
      };
    } catch (error) {
      console.error('Get auth tokens error:', error);
      return null;
    }
  }

  static async getBearerToken(): Promise<string | null> {
    try {
      const tokens = await this.getAuthTokens();
      return tokens?.accessToken || null;
    } catch (error) {
      console.error('Get bearer token error:', error);
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }
}