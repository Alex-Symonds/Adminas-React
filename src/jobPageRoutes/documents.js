/*
    Summary:
    Documents section on Job page

    Contents:
        || Main section
*/

import { useJobContext } from "../hooks/useJobContext";

import { EmptySectionUI } from "../reactComponents/loadingAndEmptiness";
import { InvalidIconUI } from "../reactComponents/warningsInvalid";

import { JobSectionHeadingNarrowUI } from "../reactComponents/jobPageHeadings.js";


// || Main section
export function JobDocumentsUI(){
    return (
        <section className="jobDocsOut jobNarrowSection">
            <JobSectionHeadingNarrowUI text={"Documents"} />
            <div className={"jobDocsOut_contentWrapper"}>
                <JobDocumentsSubsection
                    doc_type = 'WO'
                    title = 'Works Order'
                />
                <JobDocumentsSubsection
                    doc_type = 'OC'
                    title = 'Order Confirmation'
                />  
            </div>                                      
        </section>
    )
}


function JobDocumentsSubsection({ doc_type, title }){
    const { calc, job } = useJobContext();

    const url_builder = job.URL_DOCS + '&type=' + doc_type;
    const unassigned_qty = get_unassigned_quantity(doc_type, job.doc_quantities, calc.total_quantity_all_items);
    const filtered_doclist = job.docList.filter(doc => doc.doc_type == doc_type);

    function get_unassigned_quantity(target_doc_type, docQuantities, totalQuantityAllItems){
        let unassigned_qty = parseInt(totalQuantityAllItems);
        for (let idx in docQuantities){
            const doc_qty_data = docQuantities[idx];
            if(doc_qty_data.doc_type == target_doc_type){
                unassigned_qty -= parseInt(doc_qty_data.qty_on_issued);
                unassigned_qty -= parseInt(doc_qty_data.qty_on_draft);
                return unassigned_qty;
            }
        }
        return unassigned_qty;
    }

    return  <JobDocumentsSubsectionUI    
                doc_list = { filtered_doclist }
                doc_type = { doc_type }
                title = { title }
                unassigned_qty = { unassigned_qty }
                url_builder = { url_builder }
            />
}


function JobDocumentsSubsectionUI({ doc_list, doc_type, title, unassigned_qty, url_builder }){
    return (
        <div className={`subsection jobDocsOut_subsection`}>
            <h4 className={"jobDocsOut_subsectionHeading"}>
                { title }
            </h4>
            <a  href={ url_builder } 
                className="add-button jobDocsOut_subsectionAddButton"
            >
                New { doc_type }
            </a>
        { unassigned_qty == null || isNaN(unassigned_qty) || unassigned_qty <= 0 
            ? <JobDocumentsUnassignedItemsUI />
            : null
        }
        {doc_list === null || doc_list === undefined || doc_list.length == 0 
            ?
            <EmptySectionUI 
                message={`No ${doc_type} documents yet`} 
                css={'jobDocsOut_emptySection'} 
            />
            :
            <JobDocumentsOutgoingTable 
                doc_list = { doc_list } 
            />
        }
        </div>
    )
}

function JobDocumentsUnassignedItemsUI(){
    return (
        <div className="jobDocsOut_unassignedWrapper">
            <span className="jobDocsOut_unassignedIcon">
                ?
            </span>
            <span className="jobDocsOut_unassignedMsg">
                unassigned items
            </span>
        </div>
    )
}


function JobDocumentsOutgoingTable({ doc_list }){
    return (
        <table className={"documentsOutTable banded"}>
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
            { doc_list.map((doc) => {
                return  <JobDocumentsOutgoingTableRow key = { doc.doc_version_id }
                            data = { doc } 
                        />
            })}
            </tbody>
        </table>
    )
}


function JobDocumentsOutgoingTableRow({ data }){
    const doc_date = data.issue_date === null ? data.created_on : data.issue_date;
    const doc_status = data.issue_date === null ? "draft" : "issued";
    return  <tr>
                <td className={"documentsOutTable_referenceCol"}>
                    { data.reference }
                </td>
                <td className={"documentsOutTable_dateCol"}>
                    { doc_date }
                </td>
                <td className={"documentsOutTable_statusCol documentsOutTable_statusCol-" + doc_status.toLowerCase()}>
                    <div className={"documentsOutTable_status documentsOutTable_status-" + doc_status.toLowerCase() }>
                        { data.is_valid
                            ? data.issue_date == null ? 'Draft' : 'Issued'
                            : <InvalidIconUI message = "invalid item assignments" />
                        }
                    </div>
                </td>
                <td className={"documentsOutTable_editCol"}>
                    <a href={ data.url } className={"edit-icon"}>
                        <span>edit</span>
                    </a>
                </td>
            </tr>
}