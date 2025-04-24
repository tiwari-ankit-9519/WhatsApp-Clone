import axios from "axios";

const url = "http://localhost:8080";
export const registerUser = async (data) => {
  const result = await axios.post(`${url}/api/auth/register`, data);
  return result.data;
};

export const loginUser = async (data) => {
  const result = await axios.post(`${url}/api/auth/login`, data);
  return result.data;
};

export const logoutUser = async () => {
  const result = await axios.post(`${url}/api/auth/logout`);
  return result.data;
};

export const userProfile = async () => {
  const result = await axios.get(`${url}/api/auth/profile`);
  return result.data;
};
