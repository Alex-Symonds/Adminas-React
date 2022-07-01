/*
    Summary:
    Documents section on Job page

    Contents:
        || Main section
*/

// || Main section
function JobDocumentsUI(props){
    return [
        <section class="job-doc-section item">
            <h3>Documents</h3>
            <JobDocumentsSubsection doc_data = { props.doc_data }
                                    doc_type = 'WO'
                                    job_id = { props.job_id }
                                    title = 'Works Order'
                                    />
            <JobDocumentsSubsection doc_data = { props.doc_data }
                                    doc_type = 'OC'
                                    job_id = { props.job_id }
                                    title = 'Order Confirmation'
                                    />                                        
        </section>
    ]
}

function JobDocumentsSubsection(props){
    const url_builder = props.doc_data.URL_DOCS + '&type=' + props.doc_type;

    var unassigned_qty = get_unassigned_quantity(props.doc_data, props.doc_type);
    var filtered_doclist = props.doc_data.doc_list.filter(doc => doc.doc_type == props.doc_type);

    return <JobDocumentsSubsectionUI    doc_list = { filtered_doclist }
                                        doc_type = {props.doc_type}
                                        title = {props.title}
                                        unassigned_qty = { unassigned_qty }
                                        url_builder = { url_builder }
                                        />
}

// Look for the current doctype's info in the doc_data and compare its quantities to the total quantity
function get_unassigned_quantity(doc_data, target_doc_type){
    var unassigned_qty = parseInt(doc_data.total_quantity_items);

    for (var idx in doc_data.doc_quantities){
        var doc_qty_data = doc_data.doc_quantities[idx];
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
        <div class="subsection">
            <h4>{ props.title }</h4>
            <a href={ props.url_builder } class="add-button">New { props.doc_type }</a>
            <JobDocumentsUnassignedItemsUI  unassigned_qty = { props.unassigned_qty } />
            <JobDocumentsListOfDocLinksUI   doc_list = { props.doc_list } />
        </div>
    ]
}

function JobDocumentsUnassignedItemsUI(props){
    if(props.unassigned_qty == null || props.unassigned_qty == 0 || isNaN(props.unassigned_qty)){
        return null;
    }
    return [
        <div class="status-ele status_warning">
            <span class="icon">
                ?
            </span>
            <span class="message">
                unassigned items exist
            </span>
        </div>
    ]
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
    var doc_issue_status_display = props.doc.issue_date == null ? 'D' : 'I';
    var doc_date = props.doc.issue_date == null ? props.doc.created_on : props.doc.issue_date;

    var css_classes = props.doc.issue_date == null ? 'draft' : 'issued';
    css_classes = props.doc.is_valid == true ? css_classes : css_classes + ' invalid';
    
    return [
        <li class={ css_classes }>
            <a href={ props.doc.url }>
                <span class="icon">{ doc_issue_status_display }</span>
                <span class="name">{ props.doc.doc_type } { props.doc.reference } dtd { doc_date }</span>
                <InvalidIconUI  is_valid = { props.doc.is_valid }/>
            </a>
        </li>
    ]
}

function InvalidIconUI(props){
    if(props.is_valid){
        return null;
    }
    return <div class="invalid-icon"><span>invalid item assignments</span></div>
}