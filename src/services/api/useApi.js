import { useCallback, useState,useMemo } from "react"
import { fetchDataPost,postJsonData } from "./apiUtils"
export const useApi = () => {
    // State to hold the API call results and statuses
    const [apiStates, setApiStates] = useState({});


    
    // Function to fetch data from an endpoint and update state
    const fetchData = useCallback(async (endpoint, key) => {
        // Set the loading state for the given key
        setApiStates(prevState => ({
            ...prevState,
            [key]: { data: null, loading: true, error: null }
        }));

        try {
            // Fetch data from the API
            const response = await fetchDataPost(endpoint);
            // Set the fetched data and update loading state
            setApiStates(prevState => ({
                ...prevState,
                [key]: { data: response, loading: false, error: null }
            }));
        } catch (err) {
            // Set the error state if the fetch fails
            setApiStates(prevState => ({
                ...prevState,
                [key]: { data: null, loading: false, error: err }
            }));
        }
    }, []); // The empty array means fetchData won't change unless apiStates does

    // Function to get the current state for a specific key
    const getState = useCallback((key) => apiStates[key] || { data: null, loading: false, error: null }, [apiStates]);
    // getState will change if apiStates changes

    // Memoize the returned object to avoid re-creation on every render
    return useMemo(() => ({ fetchData, getState }), [fetchData, getState]);
    // useMemo ensures the returned object only changes if fetchData or getState changes



    
};