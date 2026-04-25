import type { User } from "@/types/tender";

// Mock credentials — in production replace with real auth.
// login + password pairs for the demo:
//   admin / admin123       → Admin
//   acme / acme123         → Company "Acme Corp"
//   nova / nova123         → Company "Nova Solutions"
export interface MockCredential {
  user: User;
  password: string;
}

export const mockCredentials: MockCredential[] = [
  {
    password: "admin123",
    user: { id: "u-admin", login: "admin", name: "System Admin", role: "admin" },
  },
  {
    password: "acme123",
    user: { id: "c-acme", login: "acme", name: "Acme Corp", role: "company" },
  },
  {
    password: "nova123",
    user: { id: "c-nova", login: "nova", name: "Nova Solutions", role: "company" },
  },
];
