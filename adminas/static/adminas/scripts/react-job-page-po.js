// PO section on the Job page

function JobPo(props){
    const [formVisible, setFormVisible] = React.useState(null);

    return [
        <section id="job_po_section" class="item">
            <h3>Purchase Orders</h3>
            <div class="job-po-form-container">
                <JobPoAddButton     form_vis = {formVisible}
                                    update_form_vis = {setFormVisible} />
                <JobPoAddNew        form_vis = {formVisible}
                                    update_form_vis = {setFormVisible}
                                    job_id =  {props.job_id}
                                    URL_GET_DATA = {props.URL_GET_DATA} />
            </div>
            <JobPoDiscrepancy   currency = {props.currency}
                                data = {props.po_data}
                                num_po = {props.po_list.length} />
            <JobPoList          currency = {props.currency} 
                                po_list = {props.po_list} />
        </section>
    ]
}

function JobPoAddButton(props){
    if(props.form_vis){
        return null;
    }
    function show_form(){
        props.update_form_vis(true);
    }
    return [
        <button id="toggle_po_form_btn" class="add-button" onClick={show_form}>New PO</button>
    ]
}
function JobPoAddNew(props){
    // Exit early if it's not wanted
    if(props.form_vis === null || !props.form_vis){
        return null;
    }
    function hide_form(){
        props.update_form_vis(false);
    }

    // Fetch the action URL for Purchase Order form from server
    const [actionUrl, setActionUrl] = React.useState('');
    const { data, error, isLoaded } = useFetch(url_for_url_list(props.URL_GET_DATA, props.job_id));
    React.useEffect(() => {
        if(typeof data.po_url !== 'undefined'){
            setActionUrl(data.po_url);
        }
    }, [data]);

    // Display
    if(error){
        return <LoadingErrorEle name='form' />
    }
    else if(!isLoaded){
        return <LoadingEle />
    }
    return [
        <form method="POST" action={actionUrl} class="form-like panel" id="po_form">
            <button type="button" class="cancel-po-form close" onClick={hide_form}><span>cancel</span></button>
            <h5 class="panel-header">Add PO</h5>

            <label for="id_reference">Customer PO Number:</label><input type="text" name="reference" maxlength="50" required="" id="id_reference" />
            <label for="id_date_on_po">Date on PO:</label><input type="text" name="date_on_po" required="" id="id_date_on_po" />
            <label for="id_date_received">Date received:</label><input type="text" name="date_received" required="" id="id_date_received" />
            <label for="id_currency">Currency:</label>
            <SelectBackendOptions   select_id = {'id_currency'}
                                    select_name = {'currency'}
                                    is_required = {true}
                                    api_url = {props.URL_GET_DATA}
                                    get_param = 'currencies'
                                    selected_opt_id = {null}
                                    default_opt_id = {null} />
            <label for="id_value">Value:</label><input type="number" name="value" step="0.01" required="" id="id_value" />
            <input type="hidden" name="job" value={props.job_id} id="id_job" />
            <div class="controls">
                <input type='submit' action='submit' id='po_submit_button' value='submit' class='button-primary' />
            </div>
        </form>
    ]
}

// Conditionally displayed when there's a mismatch with prices
function JobPoDiscrepancy(props){
    if(props.data.difference === 0 || props.num_po === 0){
        return null;
    }

    return [
        <div class="po-discrepancy warning subsection">
            <h4>Discrepancy</h4>
            <p>Sum of PO values does not match sum of line item selling prices.</p>
            <div class="subsection">
                <h5 class="subsection-heading">Comparison: Items to PO</h5>
                <PriceComparisonTable   currency = {props.currency}
                                        difference = {props.data.difference}
                                        first_title = 'PO Sum'
                                        first_value = {props.data.total_po_value}
                                        second_title = 'Line Items Sum'
                                        second_value = {props.data.total_items_value}
                                        />
            </div>
        </div>
    ]
}




// Actual list of POs
function JobPoList(props){
    if(props.po_list.length === 0){
        return <p class="empty-section-notice">No purchase orders have been entered.</p>
    }

    return [
        <div class="job-po-container">
            {props.po_list.map((po) =>
                <JobPoElement   key = {po.po_id.toString()}
                                currency = {props.currency}
                                data = {po}/>
            )}
        </div>
    ]
}
function JobPoElement(props){
    return [
        <div class="po-row">
            <div class="details">
                <span class="reference">{props.data.reference}</span> dated <span class="date_on_po">{props.data.date_on_po}</span> for <span class="currency">{props.currency}</span> <span class="value">{props.data.value}</span> (received <span class="date_received">{format_money(props.data.date_received)}</span>)
                <button type="button" class="po-edit edit-icon" data-po={props.data.po_id}><span>edit</span></button>
            </div>
        </div>
    ]
}



