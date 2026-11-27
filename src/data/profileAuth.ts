import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileAuth } from '../application/profileAuth';

export function createProfileAuth(client: SupabaseClient): ProfileAuth {
  return {
    async changePassword({ password, nonce, currentPassword }) {
      try {
        if (!currentPassword) return { error: 'Ingresa tu contraseña actual.' };
        const { data, error: userError } = await client.auth.getUser();
        if (userError || !data.user?.email) return { error: 'Tu sesión ha vencido. Vuelve a iniciar sesión.' };
        const { error: verificationError } = await client.auth.signInWithPassword({ email: data.user.email, password: currentPassword });
        if (verificationError) return { error: verificationError.code === 'invalid_credentials' ? 'La contraseña actual no es correcta.' : 'No pudimos verificar tu contraseña actual. Inténtalo de nuevo.' };
        const { error } = await client.auth.updateUser({ password,
          ...(nonce ? { nonce } : {}),
          ...(currentPassword ? { current_password: currentPassword } : {}),
        });
        if (!error) return {};
        switch (error.code as string) {
          case 'reauthentication_needed': return { requiresReauthentication: true };
          case 'reauthentication_not_valid': return { error: 'El código no es válido o venció. Revisa el código o solicita otro.' };
          case 'current_password_required': return { requiresCurrentPassword: true, error: 'Confirma tu contraseña actual para continuar.' };
          case 'invalid_credentials': return { error: 'La contraseña actual no es correcta.' };
          case 'same_password': return { error: 'Elige una contraseña distinta de la actual.' };
          case 'weak_password': return { error: 'La contraseña no cumple los requisitos de seguridad. Usa una más larga y combina mayúsculas, minúsculas, números y símbolos.' };
          case 'session_not_found': case 'refresh_token_not_found': case 'user_not_found':
            return { error: 'Tu sesión ha vencido. Vuelve a iniciar sesión.' };
          default: return { error: 'No pudimos cambiar la contraseña. Revisa tu conexión e inténtalo de nuevo.' };
        }
      } catch { return { error: 'No pudimos conectar. Inténtalo de nuevo.' }; }
    },
    async reauthenticate() {
      try {
        const { error } = await client.auth.reauthenticate();
        return error ? { error: 'No pudimos enviar el código. Espera un momento y vuelve a intentarlo.' } : {};
      } catch { return { error: 'No pudimos conectar para enviar el código. Inténtalo de nuevo.' }; }
    },
  };
}
