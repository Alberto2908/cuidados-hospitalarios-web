// Requisitos de contraseña: los mismos que valida el backend (RegistroRequest,
// CambiarContrasenaRequest y RestablecerContrasenaRequest).
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const REQUISITOS_PASSWORD = [
  { label: "Al menos 8 caracteres", cumple: (p: string) => p.length >= 8 },
  { label: "Una letra mayúscula", cumple: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", cumple: (p: string) => /\d/.test(p) },
  { label: "Un símbolo", cumple: (p: string) => /[^A-Za-z0-9]/.test(p) },
];
