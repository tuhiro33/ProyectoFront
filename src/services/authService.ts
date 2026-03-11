import apiClient from "../api/apiClient";

export async function login(email: string, password: string) {
  const response = await apiClient.post("/login", {
    email,
    password
  });

  const token = response.data.token;

  localStorage.setItem("token", token);

  return response.data;
}