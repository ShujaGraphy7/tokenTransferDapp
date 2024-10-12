// src/api/apiUtils.js
import { jsonApi, formDataApi } from './axiosInit';

// Utility function to perform a GET request
export const fetchDataParams = async (url, params = {}) => {
    try {
        const response = await jsonApi.get(url, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

// Utility function to perform a GET request
export const fetchData = async (url, ) => {
    try {
        const response = await jsonApi.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export const fetchDataPost = async (url,data) => {
    try {
        const response = await jsonApi.get(url, data);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

// Utility function to perform a POST request with JSON data
export const postJsonData = async (url, data) => {
    try {
        const response = await jsonApi.post(url, data);
        return response.data;
    } catch (error) {
        console.error('Error posting JSON data:', error);
        throw error;
    }
};

// Utility function to perform a POST request with FormData
export const postFormData = async (url, data) => {
    try {
        const response = await formDataApi.post(url, data);
        return response.data;
    } catch (error) {
        console.error('Error posting FormData:', error);
        throw error;
    }
};
