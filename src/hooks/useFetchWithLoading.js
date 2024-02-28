import { useEffect, useState } from 'react';

import {
    get_error_message,
    get_json_with_status,
    status_is_good,
} from '../util';

// GET only, reports on loading status
export const useFetchWithLoading = url => {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const [isLoaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const my_fetch = await fetch(url)
            .then(response => get_json_with_status(response))
            .then(resp_json => {
                if(!status_is_good(resp_json)){
                    setError(get_error_message(resp_json));
                }
                setData(resp_json);
                setLoaded(true);
            })
            .catch(error => {
                setError(error);
                setLoaded(true);
            });
        };
        fetchData();
    }, [url]);

    return { data, error, isLoaded };
};
