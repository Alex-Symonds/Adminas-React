/*
    Summary:
    Root file for the Job page

    Contents:
        || Components
        || Helpers
        || ReactDOM.render
*/


// || Components
function JobPage(){
    // Job data initial loading and storing in state
    const {
        job,
        updateKey : updateJobKey,
        fetchProps,
    } = useJobState();

    // The Job page should only show one modal at a time, so setup management of that here
    const modalKit = useEditor();

    // Setup some Job state updaters, with any errors to be displayed in the shared modal
    const jobStateUpdaterKit = useJobStateUpdater(job, updateJobKey, modalKit);

    // Derive some numbers from the Job state data
    const calc = jobCalc(job.poList, job.itemsList, job.currency);

    // Management for the Job page's "tabs"
    const jobMenu = useJobMenu();

    return fetchProps.error
        ? <LoadingErrorUI name='page' />
        : (!fetchProps.isLoaded || fetchProps.data === null)
            ? <LoadingUI />
            : <JobPageUI 
                calc = { calc }
                job = { job }               
                jobMenu = { jobMenu }   
                modalKit = { modalKit }
                jobStateUpdaterKit = { jobStateUpdaterKit }
            />
}


function JobPageUI({ calc, job, jobMenu, modalKit, jobStateUpdaterKit }){
    return [
        <JobPageWrapperUI
            job = { job }
            jobMenu = { jobMenu }
        >
            { jobStateUpdaterKit.errors.showError ?
                <ErrorModal 
                    message = { jobStateUpdaterKit.errors.message }
                    clear = { jobStateUpdaterKit.errors.clear }
                />
                : null
            }
            <JobContentsUI  
                calc = { calc }
                job = { job }               
                jobMenu = { jobMenu }   
                modalKit = { modalKit }                 
                jobStateUpdaterKit = { jobStateUpdaterKit }
            />
        </JobPageWrapperUI>
    ]
}


function JobPageWrapperUI({ job, jobMenu, children}){
    return [
        <div className={"jobPage"}>
            <JobSideNav 
                activeTab = { jobMenu.activeTab }
                close = { jobMenu.close }
                isOpen = { jobMenu.isOpen }
                job_id = { job.id }
                names = { job.names }
                TABS = { jobMenu.TABS }
                updateActiveTab = { jobMenu.updateActiveTab }
            />

            { !jobMenu.isOpen ?
                <BurgerMenuIcon 
                    open = { jobMenu.open }
                />
                : null
            }

            <JobPageContentsWrapper>
                <JobHeadingUI
                    customer_via_agent = { job.names.customer_via_agent }
                    job_name = { job.names.job_name }
                />

                { children }

            </JobPageContentsWrapper>
        </div>
    ]
}


function JobPageContentsWrapper({ children }){
    return  <div className={"jobPageContentsWrapper"}>
                { children }
            </div>
}


function JobHeadingUI({ customer_via_agent, job_name }){
    return [
        <div class="jobPageHeading">
            <h2 className={"pageHeading jobPageHeading_heading"}>
                Job { job_name }
            </h2>
            <JobSubHeadingUI  
                customer_via_agent = { customer_via_agent }
            />
        </div>
    ]
}


function JobSubHeadingUI({ customer_via_agent }){
    return customer_via_agent === '' 
        ? null
        :
        <div class="jobPageHeading_subheading subheading">
            { customer_via_agent }
        </div>
}


function JobSectionHeadingUI({ text }){
    return <h3 className={"sectionHeading"}>{ text }</h3>
}

function JobSectionHeadingNarrowUI({ text }){
    return  <h3 className={"sectionHeading jobNarrowSection_header"}>
                <span className={"jobNarrowSection_headerText"}>
                    { text }
                </span>
            </h3>
}


function JobContentsUI({ calc, job, jobMenu, modalKit, jobStateUpdaterKit }){
    const TAB_NAMES = jobMenu.TAB_NAMES;

    return jobMenu.activeTab === TAB_NAMES.detailsAndPO ?
            <JobDetailsAndPO 
                actions_po = { jobStateUpdaterKit.po }
                currency = { job.currency }
                difference = { calc.difference }  
                has_invalid_currency_po = { calc.has_invalid_currency_po }
                job_id = { job.id } 
                modalKit = { modalKit }
                poList = { job.poList }
                total_po_value = { calc.total_po_value }
                total_items_value = { calc.total_items_value }  
            />
        : jobMenu.activeTab === TAB_NAMES.comments ?
            <JobComments
                comments = { job.comments }
                commentsActions = { jobStateUpdaterKit.comments }
                modalKit = { modalKit }
            />
        : jobMenu.activeTab === TAB_NAMES.docs_out ?
            <JobDocumentsUI 
                docList = { job.docList }
                docQuantities = { job.doc_quantities}
                totalQuantityAllItems = { calc.total_qty_all_items }
                URL_DOCS = { job.URL_DOCS }
            />
        : jobMenu.activeTab === TAB_NAMES.items ?
            <JobItemsUI   
                actions_items = { jobStateUpdaterKit.jobItems }
                items_list = { job.itemsList }
                job_id = { job.id }
                currency = { job.currency }
                modalKit = { modalKit }
                URL_MODULE_MANAGEMENT = {job.URL_MODULE_MANAGEMENT }
            />
        : jobMenu.activeTab === TAB_NAMES.pricecheck ?
            <JobPriceCheck  
                currency = { job.currency }
                has_invalid_currency_po = { calc.has_invalid_currency_po }
                itemsActions = { jobStateUpdaterKit.jobItems }
                items_list = { job.itemsList }
                job_id = { job.id }
                priceAccepted = { job.priceAccepted }
                priceAcceptedActions = { jobStateUpdaterKit.priceAccepted }
                total_selling = { calc.total_items_value }
            />
        : 
        <JobSummary
            actions_comments = { jobStateUpdaterKit.comments }
            currency = { job.currency }  
            comments = { job.comments }
            items_list = { job.itemsList }
            modalKit = { modalKit }
            po_list = { job.poList }
            status_data = { createStatusData(calc, job) }
            timestamp = { job.timestamp }
            username = { job.username }
            value = { calc.total_items_value }
        />
    ;
}


// || Helpers
function jobCalc(poList, itemsList, currency){

    const total_po_value = poList.reduce((prev_total_val, po) => { 
        return po.currency === currency ? 
            parseFloat(po.value) + prev_total_val 
            : prev_total_val 
        }, 0);

    const total_items_value = itemsList.reduce((prev_total_val, item) => { 
            return parseFloat(item.selling_price) + prev_total_val 
        }, 0);

    const value_difference_po_vs_items = total_po_value - total_items_value;

    const has_invalid_currency_po = !poList.every(po => po.currency === currency);
    
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


function createStatusData(calc, job){
    return {
        po_count: job.poList.length, 
        value_difference_po_vs_items: calc.value_difference_po_vs_items, 
        total_qty_all_items: calc.total_qty_all_items, 
        has_invalid_currency_po: calc.has_invalid_currency_po,
        price_accepted: job.priceAccepted, 
        items_list: job.itemsList, 
        doc_list: job.docList,
        doc_quantities: job.doc_quantities, 
    }
}


// || ReactDOM.render
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));

