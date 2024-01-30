/*
    Summary:
    Root file for the Job page

    Contents:
        || Consts (for sections)
        || Hooks
        || Components
        || "Actions" Creators
        || Helpers
        || ReactDOM.render
*/

// || Consts
const TAB_NAMES = {
    summary: "Summary", 
    details: "Job Details",
    comments: "Comments",
    docs_in: "Incoming Docs",
    docs_out: "Outgoing Docs",
    items: "Items",
    pricecheck: "Price Check"
}

const TABS = [
    TAB_NAMES.summary, 
    TAB_NAMES.details,
    TAB_NAMES.comments,
    TAB_NAMES.docs_in,
    TAB_NAMES.docs_out,
    TAB_NAMES.items,
    TAB_NAMES.pricecheck
]

// || Hooks
function useJobMenu(){
    const [menuIsOpen, setMenuIsOpen] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState(TABS[0]);

    function openJobMenu(){
        setMenuIsOpen(true);
    }

    function closeJobMenu(){
        setMenuIsOpen(false);
    }

    function updateActiveTab(tabName){
        if(TABS.findIndex(ele => ele === tabName) !== -1){
            setActiveTab(tabName);
        }

        // These appear in the CSS too, so always update both
        const sidebarWidthOnDesktop = 240;
        const breakpoint_permaShowJobNav = sidebarWidthOnDesktop * 5;

        var w = window.innerWidth;
        if(w < breakpoint_permaShowJobNav){
            closeJobMenu();
        }
    }

    return {
        isOpen: menuIsOpen,
        open: openJobMenu,
        close: closeJobMenu,
        activeTab,
        updateActiveTab,
    }
}


function useCommentsEditor(){
    const [editCommentInSection, setEditCommentInSection] = React.useState(null);

    function open(id){
        setEditCommentInSection(id);
    }

    return {
        activeIDStr: editCommentInSection,
        set: open,
    }

}



function useJobState(URL_GET_DATA, job_id){
    const initialState = {
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
        URL_COMMENTS: '',
        API_COMMENTS: '',
        username: '',
        comments: [],
        names: {
            customer_via_agent: '',
            customer: '',
            job: '',
        },
        error: false,
        isLoaded: false,
        data: false,
    };

    const [job, setJob] = React.useState(initialState);

    const { data, error, isLoaded } = useFetch(url_for_page_load(URL_GET_DATA, job_id, 'job_page_root'));
    React.useEffect(() => {
      const loadedJob = {
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
        URL_COMMENTS: get_if_defined(data, 'comments_url', initialState.URL_COMMENTS),
        API_COMMENTS: get_if_defined(data, 'comments_api', initialState.API_COMMENTS),
        username: get_if_defined(data, 'username', initialState.username),
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


function useErrorReporting(){
    const [errorStr, setErrorStr] = React.useState('');

    function reportError(error){
        if(error === null){
            closeError();
        } 
        else if(typeof error !== 'string'){
            setErrorStr("There was an error with reporting an error. :(");
        }
        else{
            setErrorStr(error);
        }
    }

    function closeError(){
        setErrorStr('');
    }

    return {
        reportError,
        errorStr,
        closeError,
    }
}


// || Components
function JobPage(){
    const job_id = window.JOB_ID;
    const URL_GET_DATA = window.URL_GET_DATA;

    const jobMenu = useJobMenu();
    const commentsEditor = useCommentsEditor();
    const {
        errorStr,
        reportError,
        closeError,
        } = useErrorReporting();
    const {
        job,
        updateKey : updateJobKey,
        fetchProps,
    } = useJobState(URL_GET_DATA, job_id);
    
    function updateWithErrorWrapper(JOB_KEY, new_value){
        try{
            updateJobKey(JOB_KEY, new_value);
        }
        catch(e){
            reportError(e);
        }
    }
    const commentsActions = createCommentsActions(job.comments, updateWithErrorWrapper, job.API_COMMENTS, reportError);
    const poActions = createPOActions(job.poList, updateWithErrorWrapper, reportError);
    const itemsActions = createItemsActions(job.itemsList, updateWithErrorWrapper, job.URL_ITEMS, URL_GET_DATA, job_id, reportError);
    const price_accepted_state = getter_and_setter(job.priceAccepted, (newValue) => {
        updateWithErrorWrapper('priceAccepted', newValue);
    });
    
    const calc = jobCalc(job.poList, job.itemsList, job.currency);
    const statusData = {
        po_count: job.poList.length, 
        value_difference_po_vs_items: calc.value_difference_po_vs_items, 
        total_qty_all_items: calc.total_qty_all_items, 
        has_invalid_currency_po: calc.has_invalid_currency_po,
        price_accepted: job.priceAccepted, 
        items_list: job.itemsList, 
        doc_list: job.docList,
        doc_quantities: job.doc_quantities, 
    };


    return  <JobPageUI
                fetchProps = { fetchProps }
                job = { job }
                job_id = { job_id }
                jobMenu = { jobMenu }
                URL_GET_DATA = { URL_GET_DATA }
                >
                { errorStr !== '' ?
                    <BigErrorMessage 
                        errorStr={errorStr}
                        close={closeError}
                    />
                    : null
                }
                <JobContentsUI  
                    calc = { calc }
                    commentsActions = { commentsActions }
                    commentsEditor = { commentsEditor }
                    itemsActions = { itemsActions }
                    job = { job }
                    job_id = { job_id}                   
                    jobMenu = { jobMenu }                    
                    poActions = { poActions }
                    price_accepted_state = { price_accepted_state }                    
                    status_data = { statusData }
                    URL_GET_DATA = { URL_GET_DATA }
                    URL_MODULE_MANAGEMENT = { job.URL_MODULE_MANAGEMENT } 
                />
            </JobPageUI>
}


function JobPageUI(props){
    if(props.fetchProps.error){
        return <LoadingErrorUI name='page' />
    }
    else if(!props.fetchProps.isLoaded || props.fetchProps.data === null){
        return <LoadingUI />
    }
    return [
        <div className={"jobPage"}>
            <JobSideNav 
                activeTab = { props.jobMenu.activeTab }
                isOpen = { props.jobMenu.isOpen }
                close = { props.jobMenu.close }
                updateActiveTab = { props.jobMenu.updateActiveTab }
                TABS = { TABS }
                names = { props.job.names }
                job_id = { props.job_id}
                URL_GET_DATA = { props.URL_GET_DATA} 
            />

            { !props.jobMenu.isOpen ?
                <BurgerMenuIcon 
                    open = { props.jobMenu.open }
                />
                : null
            }

            <JobPageContentsWrapper>
                <JobHeadingUI
                    customer_via_agent = { props.job.names.customer_via_agent }
                    job_name = { props.job.names.job_name }
                />
                { props.children }
            </JobPageContentsWrapper>
        </div>
    ]
}


function JobPageContentsWrapper(props){
    return  <div className={"jobPageContentsWrapper"}>
                {props.children}
            </div>
}


function JobHeadingUI(props){
    return [
            <div class="jobPageHeading">
                <h2 className={"pageHeading jobPageHeading_heading"}>
                    Job { props.job_name }
                </h2>
                <JobSubHeadingUI  
                    customer_via_agent = { props.customer_via_agent }
                />
            </div>
        ]
}


function JobSubHeadingUI(props){
    if(props.customer_via_agent != ''){
        return <div class="jobPageHeading_subheading subheading">
            { props.customer_via_agent }
        </div>
    }
    return null;
}


function JobSectionHeadingUI(props){
    return <h3 className={"sectionHeading"}>{props.text}</h3>
}


function JobContentsUI(props){
    return props.jobMenu.activeTab === TAB_NAMES.details ?
            <JobDetails 
                currency = { props.job.currency }   
                job_id = { props.job_id }
                URL_GET_DATA = { props.URL_GET_DATA }
            />
        : props.jobMenu.activeTab === TAB_NAMES.comments ?
            <JobComments
                commentsEditor = { props.commentsEditor }
                commentsActions = { props.commentsActions }
                commentsURL = { props.job.URL_COMMENTS }
                comments = { props.job.comments }
                username = {props.job.username }
            />
        : props.jobMenu.activeTab === TAB_NAMES.docs_out ?
            <JobDocumentsUI 
                URL_DOCS = { props.job.URL_DOCS }
                docList = { props.job.docList }
                docQuantities = { props.doc_quantities}
                totalQuantityAllItems = { props.calc.total_qty_all_items }
                job_id = { props.job_id } 
            />
        : props.jobMenu.activeTab === TAB_NAMES.docs_in ?
            <JobPo  
                actions_po = { props.poActions }
                poList = { props.job.poList }
                currency = { props.job.currency }
                difference = { props.calc.difference }
                job_id = { props.job_id }
                total_po_value = { props.calc.total_po_value }
                total_items_value = { props.calc.total_items_value }
                has_invalid_currency_po = { props.calc.has_invalid_currency_po }
                URL_GET_DATA = { props.URL_GET_DATA }
            />
        : props.jobMenu.activeTab === TAB_NAMES.items ?
            <JobItems   
                actions_items = { props.itemsActions }
                items_list = { props.job.itemsList }
                currency = { props.job.currency }
                URL_MODULE_MANAGEMENT = { props.job.URL_MODULE_MANAGEMENT }
                job_id = { props.job_id }
                URL_GET_DATA = { props.URL_GET_DATA } 
            />
        : props.jobMenu.activeTab === TAB_NAMES.pricecheck ?
            <JobPriceCheck  
                has_invalid_currency_po = { props.calc.has_invalid_currency_po }
                total_selling = { props.calc.total_items_value }
                actions_items = { props.itemsActions }
                items_list = { props.job.itemsList }
                currency = { props.job.currency }
                price_accepted_state = { props.price_accepted_state }
                job_id = { props.job_id }
                URL_GET_DATA = { props.URL_GET_DATA }
            />
        : 
        <JobSummary
            actions_comments = { props.commentsActions }
            comments = { props.job.comments }
            commentsEditor = { props.commentsEditor }
            po_list = { props.job.poList }
            value = { props.calc.total_items_value }
            items_list = { props.job.itemsList }
            status_data = { props.status_data }
            timestamp = { props.job.timestamp }
            username = { props.job.username }
            currency = { props.job.currency }  
        />
    ;
}


// || Actions Creators
function createCommentsActions(comments, updateJobKey, apiComments, reportError){
    const JOB_KEY = 'comments';
    const ID_KEY = 'id';

    function create_comment(comment_attributes){
        console.log("create_comment called", comment_attributes);
        updateJobKey(JOB_KEY, [
            ...comments,
            comment_attributes
        ]);
    }


    function update_comment(comment_id, comment_attributes){
        try{
            const updatedComment = getUpdatedObjectFromList(
                'comment', comments, ID_KEY, comment_id, comment_attributes
            );
            updateJobKey(JOB_KEY, getUpdatedList(comments, ID_KEY, comment_id, updatedComment));
        }
        catch(e){
            reportError(e);
        }
    }

    function remove_comment(comment_id){
        updateJobKey(JOB_KEY, comments.filter(ele => ele[ID_KEY] !== comment_id));
    }

    const actions = get_actions_object(apiComments, create_comment, update_comment, remove_comment);

    return actions;
}


function createPOActions(poList, updateJobKey, reportError){
    const JOB_KEY = 'poList';
    const ID_KEY = 'po_id';

    function create_po(po_attributes){
        updateJobKey(JOB_KEY, [
            ...poList,
            po_attributes
        ]);
    }

    function update_po(po_id, po_attributes){
        try{
            const updatedPO = getUpdatedObjectFromList(
                'PO', poList, ID_KEY, po_id, po_attributes
            );
            updateJobKey(JOB_KEY, getUpdatedList(poList, ID_KEY, po_id, updatedPO));
        }
        catch(e){
            reportError(e);
        }
    }

    function delete_po(po_id){
        updateJobKey(JOB_KEY, poList.filter(ele => ele[ID_KEY] !== po_id));
    }

    const actions = get_actions_object(null, create_po, update_po, delete_po);

    return actions;
}


function createItemsActions(itemsList, updateJobKey, urlItems, URL_GET_DATA, job_id, reportError){
    const JOB_KEY = 'itemsList';
    const ID_KEY = 'ji_id';

    function create(new_items){
        var new_items_list = itemsList.concat(new_items);
        updateJobKey(JOB_KEY, new_items_list);
    }

    function update(item_id, item_attributes){
        try{
            // Updating existing items can affect document validity
            update_doc_state(item_id, item_attributes);
            const updatedItem = getUpdatedObjectFromList(
                'item', itemsList, ID_KEY, item_id, item_attributes
            );
            updateJobKey(JOB_KEY, getUpdatedList(itemsList, ID_KEY, item_id, updatedItem));
        }
        catch(e){
            reportError(e);
        }
    }

    function delete_f(item_id){
        // Deleting items can affect document validity
        update_doc_state(item_id, null);
        updateJobKey(JOB_KEY, itemsList.filter(ele => ele[ID_KEY] !== item_id));
    }


    function update_doc_state(item_id, item_attributes){
        /*
        A document is considered "invalid" if it contains one or more line items which have been overcommitted,
        e.g. order confirmations show 5 x JobItemX, but JobItemX has quantity = 3.

        This occurs when a user creates a JobItem, assigns it to documents, then afterwards updates the JobItem 
        such that the new quantity is less than the number assigned.

        Updates are therefore needed in two cases:
            > User changed the quantity of a JobItem (decrease can cause the problem; increase can solve it)
            > User deleted a JobItem (this deletes document assignments too, which would solve an existing problem)
        */
        if(item_attributes === null || item_quantity_has_changed(itemsList, item_id, item_attributes)){
            update_doc_state_from_backend();
        }
    }

    function update_doc_state_from_backend(){
        fetch(url_for_page_load(URL_GET_DATA, job_id, 'documents'))
        .then(response => response.json())
        .then(resp_data => {
            if(resp_data.doc_list !== undefined){
                updateJobKey('docList', resp_data.doc_list);
            }
            else{
                throw Error("Document status failed to update on screen and is unreliable.")
            }
        })
        .catch(error => reportError(error));
    }

    function item_quantity_has_changed(items_list, item_id, item_attributes){
        /*
            Depending on the source of the item update, item_attributes will either be:
                > A full set of item data
                > Only the keys that changed
        */
   
        // Shortcut #1: The absence of a quantity field means the quantity can't change
        if(!('quantity' in item_attributes)){
            return false;
        }
    
        // Shortcut #2: ji_id can't be updated from the front-end, so it shouldn't ever appear in "only keys that changed"
        // If it's absent, we know this is a list of changes-only, which includes quantity: ergo, quantity has changed.
        if(!('ji_id' in item_attributes)){
            return true;
        }
    
        // No more shortcuts: compare the old value to the new
        const new_quantity = item_attributes.quantity;
    
        var index = items_list.findIndex(i => i.ji_id === parseInt(item_id));
        if(index === -1){
            // Fallback to true: better an unnecessary fetch to telling the user everything is ok when it isn't
            return true;
        }
        const old_quantity = items_list[index].quantity;
    
        return parseInt(old_quantity) !== parseInt(new_quantity);
    }

    const actions = get_actions_object(urlItems, create, update, delete_f);

    return actions;
}


// || Helpers
function jobCalc(poList, itemsList, currency){

    const total_po_value = poList.reduce((prev_total_val, po) => { 
        return po.currency == currency ? 
            parseFloat(po.value) + prev_total_val 
            : prev_total_val 
        }, 0);

    const total_items_value = itemsList.reduce((prev_total_val, item) => { 
            return parseFloat(item.selling_price) + prev_total_val 
        }, 0);

    const value_difference_po_vs_items = total_po_value - total_items_value;

    const has_invalid_currency_po = invalid_currency_po_exists(poList, currency);
    function invalid_currency_po_exists(po_list, job_currency){
        for(let idx = 0; idx < po_list.length; idx++){
            let this_po = po_list[idx];
            if(this_po.currency !== job_currency){
                return true;
            }
        }
        return false;
    }

    const total_qty_all_items = itemsList.reduce((prev_total_qty, item) => { 
        return parseInt(item.quantity) + prev_total_qty; 
    }, 0);
    
    return {
        difference: value_difference_po_vs_items,
        total_items_value,
        total_po_value,
        has_invalid_currency_po,
        total_qty_all_items,
    };
}


// || ReactDOM.render
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));

