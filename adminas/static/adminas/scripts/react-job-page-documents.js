


function JobDocuments(props){
    // fetch these from the server onload: they can't change
    var doc_list = [];
    doc_list[0] = {
        doc_version_id: 1,
        doc_type: 'WO',
        issue_date: '25/05/2022',
        created_on: '24/05/2022',
        reference: '00001',
        num_items: 1,
        url: '/document/1'
    };
    doc_list[1] = {
        doc_version_id: 2,
        doc_type: 'WO',
        issue_date: null,
        created_on: '25/05/2022',
        reference: '00002',
        num_items: 1,
        url: '/document/2'
    };
    doc_list[2] = {
        doc_version_id: 3,
        doc_type: 'WO',
        issue_date: null,
        created_on: '26/05/2022',
        reference: '00003',
        num_items: 3,
        url: '/document/3'
    };


    return [
        <section class="job-doc-section item">
            <h3>Documents</h3>
            <JobDocumentsSubsection     title = 'Works Order'
                                        doc_type = 'WO'
                                        job_id = {props.job_id}
                                        job_total_qty = {props.job_total_qty}
                                        doc_quantities = {props.doc_quantities} 
                                        doc_list = {doc_list} />
            <JobDocumentsSubsection     title ='Order Confirmation'
                                        doc_type ='OC'
                                        job_id = {props.job_id}
                                        job_total_qty = {props.job_total_qty}
                                        doc_quantities = {props.doc_quantities} 
                                        doc_list = {doc_list} />
        </section>
    ]
}

function JobDocumentsSubsection(props){
    const URL_DOC_BUILDER = '/document/builder';
    const url_builder = URL_DOC_BUILDER + '?job=' + props.job_id + '&type=' + props.doc_type;

    var unassigned_qty = props.job_total_qty;
    for (var idx in props.doc_quantities){
        if(props.doc_quantities[idx].doc_type == props.doc_type){
            unassigned_qty -= props.doc_quantities[idx].issued_qty;
            unassigned_qty -= props.doc_quantities[idx].draft_qty;
        }
    }
    
    var filtered_doclist = props.doc_list.filter(doc => doc.doc_type == props.doc_type);

    return [
        <div class="subsection">
            <h4>{props.title}</h4>
            <a href={url_builder} class="add-button">New {props.doc_type}</a>
            <JobDocumentsUnassignedItems    unassigned_qty = {unassigned_qty} />
            <JobDocumentsListOfDocLinks     doc_list = {filtered_doclist} />
        </div>
    ]
}

function JobDocumentsUnassignedItems(props){
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

function JobDocumentsListOfDocLinks(props){
    if(props.doc_list == null || props.doc_list.length == 0){
        return null;
    }
    return [
        <ul>
            {props.doc_list.map((document) => {
                return <JobDocumentsLi  key={document.doc_version_id}
                                        doc={document} />
            })}
        </ul>
    ]
}

function JobDocumentsLi(props){
    var doc_issue_status_display = props.doc.issue_date == null ? 'D' : 'I';
    var css_class = props.doc.issue_date == null ? 'draft' : 'issued';
    var doc_date = props.doc.issue_date == null ? props.doc.created_on : props.doc.issue_date;

    return [
        <li class={css_class}>
            <a href={props.doc.url}>
                <span class="icon">
                    {doc_issue_status_display}
                </span>
                <span class="name">{props.doc.doc_type } { props.doc.reference } dtd {doc_date}</span>
            </a>
        </li>
    ]
}