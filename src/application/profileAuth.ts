export interface PasswordChange {
  password: string;
  nonce?: string;
  currentPassword?: string;
}
export interface PasswordResult {
  error?: string;
  requiresReauthentication?: boolean;
  requiresCurrentPassword?: boolean;
}
export interface ProfileAuth {
  changePassword(input: PasswordChange): Promise<PasswordResult>;
  reauthenticate(): Promise<{ error?: string }>;
}
