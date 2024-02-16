function JobItemIdIcon({ ji_id }){
    return  <JobItemNameTagSpan  
                css = "id"
                name = { ji_id } 
            />
}

function JobItemPriceListIconSpan({ price_list_name }){
    return  <JobItemNameTagSpan 
                name = { price_list_name ?? 'TBC' } 
            />
}

function JobItemNameTagSpan({ css, name }){
    return  name === null ?
                null
                :
                <span 
                    class={`name-tag${ css ? " " + css : ""}`}
                >
                    { name }
                </span>
}