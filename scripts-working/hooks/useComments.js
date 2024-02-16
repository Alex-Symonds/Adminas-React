/*
    Update Comments on the server and in state
*/
function useComments(comments, updateState, reportError){
    // Key for comments array in job state; key used to identify one specific comment
    const JOB_KEY = 'comments';
    const ID_KEY = 'id';

    // Get the URL for the comments API by grabbing the URL list from
    // the generic "get data" endpoint
    const [API_URL, setAPI_URL] = React.useState("");
    const { data } = useFetchWithLoading(url_for_url_list());
    React.useEffect(() => {
        set_if_ok(data, 'api_comments', setAPI_URL);
    }, [data]);

    // CUD
    async function create(feData, beData){
        if(API_URL === ""){
            reportError("Creation of comments is not currently available, sorry!");
            return false;
        }
        
        const url = `${ API_URL }?job_id=${ window.JOB_ID }`;
        const request = getRequestOptions('POST', beData);
        const resp_data = await fetchAndJSON(url, request, 201);

        const newStateObj = {
            ...feData,
            id: resp_data.id,
            user_is_owner: true,
            created_by: "You",
            created_on: resp_data.created_on,
            created_on_str: resp_data.created_on_str,
        }

        if(comments){
            updateState(JOB_KEY, [
                ...comments,
                newStateObj
            ]);
        } else {
            updateState(JOB_KEY, [
                newStateObj
            ]);
        }
        return true;
    };


    async function update(comment_id, feData, beData){
        if(API_URL === ""){
            reportError("Editing comments is not currently available, sorry!");
            return false;
        }
        
        const url = `${ API_URL }?id=${ comment_id }`;
        const request = getRequestOptions('PUT', beData);
        const resp_data = await fetchAndJSON(url, request, 204);
        
        const updatedComment = getUpdatedObjectFromList(
            'comment', comments, ID_KEY, comment_id, feData
        );
        updateState(JOB_KEY, getUpdatedList(comments, ID_KEY, comment_id, updatedComment));
        return true;
    };


    async function remove(comment_id){
        if(API_URL === ""){
            reportError("Deleting comments is not currently available, sorry!");
            return false;
        }

        const url = `${ API_URL }?id=${ comment_id }`;
        const request = getRequestOptions('DELETE', null);
        const resp_data = await fetchAndJSON(url, request, 204);
        updateState(JOB_KEY, comments.filter(ele => ele[ID_KEY] !== comment_id));
        return true;
    }


    return {
        create,
        update,
        remove, 
    }
}