/*
    Summary:
    Documents section on Job page

    Contents:
        || Main section
*/

// || Main section
function JobDocumentsUI(props){
    return [
        <section class="job-doc-section job-section">
            <JobSectionHeadingUI text={"Documents"} />
            <div className={"jobDocsOut_contentWrapper"}>
                <JobDocumentsSubsection
                    docList = { props.docList }
                    docQuantities = { props.docQuantities}
                    totalQuantityAllItems = { props.totalQuantityAllItems }
                    URL_DOCS = { props.URL_DOCS }
                    doc_type = 'WO'
                    job_id = { props.job_id }
                    title = 'Works Order'
                />
                <JobDocumentsSubsection
		            docList = { props.docList }
                    docQuantities = { props.docQuantities}
                    totalQuantityAllItems = { props.totalQuantityAllItems }
                    URL_DOCS = { props.URL_DOCS }
                    doc_type = 'OC'
                    job_id = { props.job_id }
                    title = 'Order Confirmation'
                />  
            </div>                                      
        </section>
    ]
}

function JobDocumentsSubsection(props){
    const url_builder = props.URL_DOCS + '&type=' + props.doc_type;

    var unassigned_qty = get_unassigned_quantity(props.doc_type, props.docQuantities, props.totalQuantityAllItems);
    var filtered_doclist = props.docList.filter(doc => doc.doc_type == props.doc_type);

    return  <JobDocumentsSubsectionUI    
                doc_list = { filtered_doclist }
                doc_type = { props.doc_type }
                title = { props.title }
                unassigned_qty = { unassigned_qty }
                url_builder = { url_builder }
            />
}


function get_unassigned_quantity(target_doc_type, docQuantities, totalQuantityAllItems){
    var unassigned_qty = parseInt(totalQuantityAllItems);

    for (var idx in docQuantities){
        var doc_qty_data = docQuantities[idx];
        if(doc_qty_data.doc_type == target_doc_type){
            unassigned_qty -= parseInt(doc_qty_data.qty_on_issued);
            unassigned_qty -= parseInt(doc_qty_data.qty_on_draft);
            return unassigned_qty;
        }
    }

    return unassigned_qty;
}

function JobDocumentsSubsectionUI(props){
    return [
        <div className={`subsection jobDocsOutSubsection`}>
            <h4 className={"jobDocsOutSubsection_heading"}>{ props.title }</h4>
            <a href={ props.url_builder } class="add-button jobDocsOutSubsection_addButton">New { props.doc_type }</a>
            <JobDocumentsUnassignedItemsUI  unassigned_qty = { props.unassigned_qty } />
            <JobDocumentsOutgoingTable   doc_list = { props.doc_list } />
        </div>
    ]
}

function JobDocumentsUnassignedItemsUI(props){
    if(props.unassigned_qty == null || isNaN(props.unassigned_qty) || props.unassigned_qty <= 0){
        return null;
    }

    return [
        <div class="jobDocsOutSubsection_unassigned">
            <span class="jobDocsOutSubsection_unassignedIcon">
                ?
            </span>
            <span class="jobDocsOutSubsection_unassignedMsg">
                unassigned items
            </span>
        </div>
    ]
}


function JobDocumentsOutgoingTable(props){
    if(props.doc_list == null || props.doc_list.length == 0){
        return null;
    }
    return [
        <table className={"documentsOutTable banded"}>
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
            { props.doc_list.map((doc) => {
                return  <JobDocumentsOutgoingTableRow   
                            key = { doc.doc_version_id }
                            doc = { doc } 
                        />
            })}
            </tbody>
        </table>
    ]
}


function JobDocumentsOutgoingTableRow(props){
    var doc_date_prefix_string = props.doc.issue_date == null ? "" : "issued";
    var doc_date = props.doc.issue_date == null ? props.doc.created_on : props.doc.issue_date;

    var css_classes = props.doc.issue_date == null ? 'draft' : 'issued';
    css_classes = props.doc.is_valid == true ? css_classes : css_classes + ' invalid';
    
    var doc_status = props.doc.issue_date == null ? 'Draft' : 'Issued';
    if(!props.doc.is_valid){
        doc_status = <InvalidIconUI   is_valid = { props.doc.is_valid }
                                                    message = "invalid item assignments" />
    }

    return  <tr>
                <td className={"documentsOutTable_referenceCol"}>
                    { props.doc.reference }
                </td>
                <td className={"documentsOutTable_dateCol"}>
                    { doc_date_prefix_string } { doc_date }
                </td>
                <td className={"documentsOutTable_statusCol documentsOutTable_statusCol-" + doc_status.toLowerCase()}>
                    <div className={"documentsOutTable_status documentsOutTable_status-" + doc_status.toLowerCase() }>
                        { doc_status }
                    </div>
                </td>
                <td className={"documentsOutTable_editCol"}>
                    <a href={ props.doc.url } className={"edit-icon"}>
                        <span>edit</span>
                    </a>
                </td>
            </tr>
}


function JobDocumentsListOfDocLinksUI(props){
    if(props.doc_list == null || props.doc_list.length == 0){
        return null;
    }
    return [
        <ul>
            {props.doc_list.map((doc) => {
                return <JobDocumentsLiUI    key = { doc.doc_version_id }
                                            doc = { doc } />
            })}
        </ul>
    ]
}


function JobDocumentsLiUI(props){
    var doc_date_prefix_string = props.doc.issue_date == null ? "" : "issued";
    var doc_date = props.doc.issue_date == null ? props.doc.created_on : props.doc.issue_date;

    var css_classes = props.doc.issue_date == null ? 'draft' : 'issued';
    css_classes = props.doc.is_valid == true ? css_classes : css_classes + ' invalid';
    
    var doc_status_icon_contents = props.doc.issue_date == null ? 'D' : 'I';
    if(!props.doc.is_valid){
        doc_status_icon_contents = <InvalidIconUI   is_valid = { props.doc.is_valid }
                                                    message = "invalid item assignments" />
    }

    return [
        <li class={ css_classes }>
            <a href={ props.doc.url }>
                <span class="icon">{ doc_status_icon_contents }</span>
                <div class="doc-details">
                    <span class="name">{ props.doc.doc_type } { props.doc.reference }</span>
                    <span class="doc-date">{ doc_date_prefix_string } { doc_date }</span>
                </div>
            </a>
        </li>
    ]
}