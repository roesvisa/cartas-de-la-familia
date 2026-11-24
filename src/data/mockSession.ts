export const DEMO_EMAIL = "mariel@familia.demo";
export const DEMO_PASSWORD = "familia123";
export async function login(email: string, password: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD)
    throw new Error(
      "Correo o contraseña incorrectos. Usa los datos de la demo.",
    );
}
