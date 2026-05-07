import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE,
  withCredentials: true,
});

export const apiRequest = async (method, url, data = null, retries = 3) => {
  try {
    const config = data ? { method, url, data } : { method, url };
    const res = await API(config);
    return res;
  } catch (err) {
    if (err.response?.status === 429 && retries > 0) {
      const delay = Math.pow(2, 4 - retries) * 1000; // Exponential backoff
      console.log(`Rate limited, retrying ${method} ${url} in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(method, url, data, retries - 1);
    } else {
      throw err;
    }
  }
};

export default API;