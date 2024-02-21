/*
    Summary:
    PO section on the Job page

    Contents:
        || Main PO section
        || Create PO section
        || Discrepancy Warning
        || Existing POs
*/

import { nbsp, format_money } from "../util";

import { EmptySectionUI } from "../reactComponents/loadingAndEmptiness";
import { PriceComparisonTable } from "../reactComponents/priceComparisonTable";
import { InvalidIconUI, WarningSubSubsectionUI } from "../reactComponents/warningsInvalid";

import { JobPoEditor } from "../reactComponentsWithHooks/poEditor";

import { useJobContext } from "../hooks/useJobContext";

// || Main section
export function JobPo(){
    const { calc, job } = useJobContext();

    return (
        <section className="jobPO jobPanelSection">
            <h3 className={"jobPanelSection_headingWrapper"}>
                <span className={"jobPO_headerContent jobPanelSection_headingContent"}>
                    Purchase Orders
                </span>
            </h3>
            <div className="jobPO_content">
                <JobPoCreate />
            { calc.has_invalid_currency_po ?
                <WarningSubSubsectionUI
                    message = {"All POs should be in the same currency as the job."}
                    title = {"Error: Currency Mismatch"}
                />
                : null
            }
            { calc.difference === 0 || job.poList.length === 0 ?
                null
                :
                <WarningSubSubsectionUI
                    message = {"Sum of PO values does not match sum of line item selling prices."}
                    title = {"Discrepancy"}
                >
                    <JobPoDiscrepancyUI />
                </WarningSubSubsectionUI>
            }
                <JobPOReceived />
            </div>
        </section>
    )
}


// || Create PO section
function JobPoCreate(){
    const { modalKit } = useJobContext();

    // Either the button or the form should be visible, never both.
    const ID_FOR_MODAL = 'create_po_form';

    return (
        <div className="jobPO_addPO">
            <button 
                id="toggle_po_form_btn" 
                className="add-button" 
                onClick={ () => { modalKit.open(ID_FOR_MODAL) } }
                disabled = { modalKit.isOpen() }
            >
                New PO
            </button>
            { modalKit.isOpenedBy(ID_FOR_MODAL) ?
                <JobPoAddNew />
                : null
            }
        </div>
    )
}


function JobPoAddNew(){
    const { actions, currency, modalKit } = useJobContext();

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
            closeFn = { modalKit.close }
            data = { data }
            form_id = 'po_form'
            onDelete = { null }
            onSubmit = { actions.po.create }
            title = 'Add PO'
        />
}



// || Discrepancy Warning
// Subsection showing the difference between total PO value and total line items value. Conditionally displayed when there's a mismatch with prices.
function JobPoDiscrepancyUI(){
    const { calc, currency,  } = useJobContext();

    return (
            <div className="jobPO_comparisonTableWrapper">
                <h5 className="jobPO_comparisonTableHeading">Comparison: Items to PO</h5>
                <PriceComparisonTable   
                    currency = { currency }
                    difference = { calc.difference }
                    first_title = 'PO Sum'
                    first_value = { calc.total_po_value }
                    second_title = 'Line Items Sum'
                    second_value = { calc.total_items_value }
                />
            </div>
    )
}


// || Existing POs
// Container to hold the elements for each individual PO
function JobPOReceived(){
    const { actions, currency, job, modalKit } = useJobContext();

    return  <div className={"jobPO_receivedSection"}>
                <h4 className={"jobPO_subsectionHeading jobPanelSection_subsectionHeading"}>Received</h4>
                { job.poList === null || job.poList === undefined || job.poList.length === 0 ?
                    <EmptySectionUI 
                        css={'jobPage_emptySection'} 
                        message={'No purchase orders have been entered'} 
                    />
                :
                    <JobPoTableUI       
                        actions_po = { actions.po }
                        currency = { currency } 
                        modalKit = { modalKit }
                        poList = { job.poList }
                    />
                }
            </div>
}


function JobPoTableUI(){
    const { job } = useJobContext();

    return (
        <div className="jobPO_poListWrapper">
            <table id="po_table" className="banded">
                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Date on PO</th>
                        <th>Received</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                { job.poList.map((po) =>
                    <JobPoRow key = { po.po_id.toString() }
                        data = { po }
                    />
                )}
                </tbody>
            </table>
        </div>
    )
}


// Element displaying info for a single PO
function JobPoRow({ data }){
    const { actions, modalKit } = useJobContext();

    // JobPoEditor is shared with the Update/Delete form
    // It requires the parent to pass in functions to "handle_submit" and "handle_delete"
    // on the frontend. Make submit = update and delete = ... well, delete.
    async function handle_edit(feData, beData){
        return await actions.po.update(data.po_id, feData, beData);
    }

    async function handle_delete(){
        return await actions.po.remove(data.po_id);
    }

    const ID_FOR_MODAL = `po_editor_for_id_${data.po_id}`;
    return modalKit.isOpenedBy(ID_FOR_MODAL) ?
        <JobPoRowEditUI
            data = { data }
            closePOEditor = { () => modalKit.close() }
            handle_delete = { handle_delete }
            handle_edit = { handle_edit }
        />
    :
        <JobPoRowReadUI 
            data = { data }
            openPOEditor = { () => modalKit.open(ID_FOR_MODAL) } 
            poEditorIsUnavailable = { modalKit.isOpen() }
        />
}


// Element for reading info of a single PO
function JobPoRowReadUI({ data, openPOEditor, poEditorIsUnavailable }){
    const { currency } = useJobContext();

    const currency_matches_job = data.currency === currency;
    return (
        <tr className={currency_matches_job ? null : "invalid"}>
            <td className="ref">{ data.reference }</td>
            <td className="date_on_po">{ data.date_on_po }</td>
            <td className="date_received">{ data.date_received }</td>
            <td className="value">
                { currency_matches_job
                    ? null
                    : <InvalidIconUI message = "job has different currency" />
                }
                <span className="display-text">
                    { data.currency + nbsp() + format_money(parseFloat(data.value)) }
                </span>
            </td>
            <td className="edit">
                <button 
                    type="button" 
                    className="po-edit edit-icon" 
                    disabled = { poEditorIsUnavailable }
                    onClick={ openPOEditor }
                >
                    <span>edit</span>
                </button>
            </td>
        </tr>
    )
}

function JobPoRowEditUI({ closePOEditor, data, handle_delete, handle_edit }){
    return (
        <tr>
            <td colSpan={5}>
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
    )
}


