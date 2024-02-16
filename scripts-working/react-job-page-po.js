/*
    Summary:
    PO section on the Job page

    Contents:
        || Main PO section
        || Create PO section
        || Discrepancy Warning
        || Existing POs
*/

// || Main section
function JobPo({ actions_po, currency, difference, has_invalid_currency_po, job_id, modalKit, poList, total_items_value, total_po_value }){
    return [
        <section class="jobPO jobPanelSection">
            <h3 className={"jobPanelSection_headingWrapper"}>
                <span className={"jobPO_headerContent jobPanelSection_headingContent"}>
                    Purchase Orders
                </span>
            </h3>
            <div className="jobPO_content">
                <JobPoCreate    
                    actions_po = { actions_po }
                    currency = { currency }
                    modalKit = { modalKit }
                />
            { has_invalid_currency_po ?
                <WarningSubSubsectionUI
                    message = {"All POs should be in the same currency as the job."}
                    title = {"Error: Currency Mismatch"}
                />
                : null
            }
            { difference === 0 || poList.length === 0 ?
                null
                :
                <WarningSubSubsectionUI
                    message = {"Sum of PO values does not match sum of line item selling prices."}
                    title = {"Discrepancy"}
                >
                    <JobPoDiscrepancyUI 
                        currency = { currency}
                        difference = { difference }
                        poList = { poList }
                        total_po_value = { total_po_value }
                        total_items_value = { total_items_value }
                    />
                </WarningSubSubsectionUI>
            }
                <JobPOReceived 
                    actions_po = { actions_po }
                    currency = { currency } 
                    modalKit = { modalKit }
                    poList = { poList }
                    job_id = { job_id }
                />
            </div>
        </section>
    ]
}


// || Create PO section
function JobPoCreate({ actions_po, currency, modalKit }){
    // Either the button or the form should be visible, never both.
    const ID_FOR_MODAL = 'create_po_form';

    return [
        <div class="jobPO_addPO">
            <button 
                id="toggle_po_form_btn" 
                class="add-button" 
                onClick={ () => { console.log("click!"); modalKit.open(ID_FOR_MODAL) } }
                disabled = { modalKit.isOpen() }
            >
                New PO
            </button>
            { modalKit.isOpenedBy(ID_FOR_MODAL) ?
                <JobPoAddNew        
                    actions_po = { actions_po }
                    closePOCreator = { () => modalKit.close() }
                    currency = { currency }
                />
                : null
            }
        </div>
    ]
}


function JobPoAddNew({ actions_po, closePOCreator, currency }){
    // Make a "blank" data object for passing into the editor
    const data = {
        'po_id': null,
        'currency': currency,
        'date_on_po': null,
        'date_received': null,
        'reference': null,
        'value': null
    }

    return <JobPoEditor 
            closeFn = { closePOCreator }
            data = { data }
            form_id = 'po_form'
            onDelete = { null }
            onSubmit = { actions_po.create }
            title = 'Add PO'
        />
}



// || Discrepancy Warning
// Subsection showing the difference between total PO value and total line items value. Conditionally displayed when there's a mismatch with prices.
function JobPoDiscrepancyUI({ currency, difference, total_items_value, total_po_value }){
    return [
            <div class="jobPO_comparisonTableWrapper">
                <h5 class="jobPO_comparisonTableHeading">Comparison: Items to PO</h5>
                <PriceComparisonTable   
                    currency = {currency}
                    difference = {difference}
                    first_title = 'PO Sum'
                    first_value = {total_po_value}
                    second_title = 'Line Items Sum'
                    second_value = {total_items_value}
                />
            </div>
    ]
}


// || Existing POs
// Container to hold the elements for each individual PO
function JobPOReceived({ actions_po, currency, modalKit, poList }){
    return  <div className={"jobPO_receivedSection"}>
                <h4 className={"jobPO_subsectionHeading jobPanelSection_subsectionHeading"}>Received</h4>
                { poList === null || poList === undefined || poList.length === 0 ?
                    <EmptySectionUI 
                        css={'jobPage_emptySection'} 
                        message={'No purchase orders have been entered'} 
                    />
                :
                    <JobPoTableUI       
                        actions_po = { actions_po }
                        currency = { currency } 
                        modalKit = { modalKit }
                        poList = { poList }
                    />
                }
            </div>
}


function JobPoTableUI({ actions_po, currency, modalKit, poList }){
    return [
        <div class="jobPO_poListWrapper">
            <table id="po_table" class="banded">
                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Date on PO</th>
                        <th>Received</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                {poList.map((po) =>
                    <JobPoRow key = { po.po_id.toString() }
                        actions_po = { actions_po }
                        currency = { currency }
                        data = { po }
                        modalKit = { modalKit }
                    />
                )}
                </tbody>
            </table>
        </div>
    ]
}


// Element displaying info for a single PO
function JobPoRow({ actions_po, currency, data, modalKit }){
    // JobPoEditor is shared with the Update/Delete form
    // It requires the parent to pass in functions to "handle_submit" and "handle_delete"
    // on the frontend. Make submit = update and delete = ... well, delete.
    async function handle_edit(feData, beData){
        return await actions_po.update(data.po_id, feData, beData);
    }

    async function handle_delete(){
        return await actions_po.remove(data.po_id);
    }

    const ID_FOR_MODAL = `po_editor_for_id_${data.po_id}`;
    return modalKit.isOpenedBy(ID_FOR_MODAL) ?
        <JobPoRowEditUI
            data = { data }
            closePOEditor = { () => modalKit.close() }
            onDelete = { handle_delete }
            onSubmit = { handle_edit }
        />
    :
        <JobPoRowReadUI 
            currency = { currency }
            data = { data }
            openPOEditor = { () => modalKit.open(ID_FOR_MODAL) } 
            poEditorIsUnavailable = { modalKit.isOpen() }
        />
}


// Element for reading info of a single PO
function JobPoRowReadUI({ currency, data, openPOEditor, poEditorIsUnavailable }){
    const currency_matches_job = data.currency === currency;
    return [
        <tr class={currency_matches_job ? null : "invalid"}>
            <td class="ref">{ data.reference }</td>
            <td class="date_on_po">{ data.date_on_po }</td>
            <td class="date_received">{ data.date_received }</td>
            <td class="value">
                { currency_matches_job
                    ? null
                    : <InvalidIconUI message = "job has different currency" />
                }
                <span class="display-text">
                    { data.currency + nbsp() + format_money(parseFloat(data.value)) }
                </span>
            </td>
            <td class="edit">
                <button 
                    type="button" 
                    class="po-edit edit-icon" 
                    disabled = { poEditorIsUnavailable }
                    onClick={ openPOEditor }
                >
                    <span>edit</span>
                </button>
            </td>
        </tr>
    ]
}

function JobPoRowEditUI({ closePOEditor, data, handle_delete, handle_edit }){
    return [
        <tr>
            <td colspan={5}>
                <JobPoEditor 
                    closeFn = { closePOEditor }
                    data = { data }
                    form_id = 'po_edit_form'
                    onDelete = { handle_delete }
                    onSubmit = { handle_edit }
                    title = 'Edit PO'
                />
            </td>
        </tr>
    ]
}


