export function JobItemIdIcon({ ji_id }){
    return  <JobItemNameTagSpan  
                css = "id"
                name = { ji_id } 
            />
}

export function JobItemPriceListIconSpan({ price_list_name }){
    return  <JobItemNameTagSpan 
                name = { price_list_name ?? 'TBC' } 
            />
}

export function JobItemNameTagSpan({ css, name }){
    return  name === null ?
                null
                :
                <span 
                    className={`name-tag${ css ? " " + css : ""}`}
                >
                    { name }
                </span>
}