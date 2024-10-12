// src/api/axios.js
import axios from 'axios';

// JSON API instance
const jsonApi = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL,// Replace with your API's base URL
    //timeout: 10000, // Set a timeout for requests (optional)
    headers: {
        'Content-Type': 'application/json',
    },
});

// FormData API instance
const formDataApi = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL, // Replace with your API's base URL
    //timeout: 10000, // Set a timeout for requests (optional)
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

// Interceptors for JSON API
jsonApi.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

jsonApi.interceptors.response.use(
    response => response,
    error => Promise.reject(error)
);

// Interceptors for FormData API
formDataApi.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

formDataApi.interceptors.response.use(
    response => response,
    error => Promise.reject(error)
);

export { jsonApi, formDataApi };
