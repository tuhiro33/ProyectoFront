import apiClient from "../api/apiClient";

export async function login(email: string, password: string) {
  const response = await apiClient.post("/login", {
    email,
    password
  });

  const token = response.data.token;
  const user = response.data.usuario; // 👈 importante

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return response.data;
}