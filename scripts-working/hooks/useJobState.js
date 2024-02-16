function useJobState(){
    const job_id = window.JOB_ID;

    const initialState = {
        id: job_id,
        itemsList: [],
        poList: [],
        docList: [],
        priceAccepted: [],
        currency: '',
        timestamp: null,
        doc_quantities: [],
        URL_MODULE_MANAGEMENT: '',
        URL_ITEMS: '',
        URL_DOCS: '',
        API_COMMENTS: '',
        comments: [],
        names: {
            customer_via_agent: '',
            customer: '',
            job: '',
        },
    };

    const [job, setJob] = React.useState(initialState);

    const { data, error, isLoaded } = useFetchWithLoading(url_for_page_load(job_id, 'job_page_root'));
    React.useEffect(() => {
      const loadedJob = {
        id: window.JOB_ID,
        itemsList: get_if_defined(data, 'item_list', initialState.itemsList),
        poList: get_if_defined(data, 'po_list', initialState.poList),
        docList: get_if_defined(data, 'doc_list', initialState.docList),
        priceAccepted: get_if_defined(data, 'price_accepted', initialState.priceAccepted),
        currency: get_if_defined(data, 'currency',  initialState.currency),
        timestamp: get_if_defined(data, 'timestamp', initialState.timestamp),
        doc_quantities: get_if_defined(data, 'doc_quantities', initialState.doc_quantities),
        URL_MODULE_MANAGEMENT: get_if_defined(data, 'URL_MODULE_MANAGEMENT', initialState.URL_MODULE_MANAGEMENT),
        URL_ITEMS: get_if_defined(data, 'items_url', initialState.URL_ITEMS),
        URL_DOCS: get_if_defined(data, 'docbuilder_url', initialState.URL_DOCS),
        API_COMMENTS: get_if_defined(data, 'comments_api', initialState.API_COMMENTS),
        comments: get_if_defined(data, 'comments', initialState.comments),
        names: get_if_defined(data, 'names', initialState.names),
      }
      setJob(loadedJob);
    }, [data]);

    function updateKey(key, contents){
        if(!(key in job)){
            throw Error("Failed to update Job")
        }
        setJob(prev => { 
            return {
                ...prev,
                [key]: contents,
            }
        });
        return;
    }


    function get_if_defined(data, key, fallback){
        if(typeof data[key] !== 'undefined'){
            return data[key];
        }
        return fallback;
    }
    

    return {
        job,
        updateKey,
        fetchProps: {
            data, 
            error, 
            isLoaded,
        }
    }
}