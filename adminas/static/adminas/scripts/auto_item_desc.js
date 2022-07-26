/*
    Automatic JobItem product descriptions.
        > Add event listener to any/all product dropdowns
        > Add an element underneath each for displaying the result
*/

const AUTO_DESC_CLASS = 'desc';
const AUTO_PRICE_CLASS = 'item-price-results';

document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('[id^="id_form-"][id$="-product"]').forEach(dd => {
        auto_item_desc_listener(dd);
        dd.after(get_auto_desc_element());
    });

})

function get_auto_desc_element(){
    let span = document.createElement('span');
    span.classList.add(AUTO_DESC_CLASS);
    span.classList.add('hide');
    return span;
}

function auto_item_desc_listener(dropdown){
    dropdown.addEventListener('change', (e) => {
        update_auto_description(e);
    });
}

function update_auto_description(e){
    e.preventDefault();

    if(e.target.value === ''){
        let pretend_response = {};
        pretend_response['desc'] = '';
        display_auto_description(e, pretend_response);
    }
    else{
        product_id = e.target.value;
        job_id = JOB_ID;

        fetch(`${URL_ITEMS}?product_id=${product_id}&job_id=${job_id}`)
        .then(response => response.json())
        .then(item_info => {
            display_auto_description(e, item_info);
        })
        .catch(error =>{
            console.log('Error: ', error);
        });
    }
}

function display_auto_description(e, data){
    const expected_key = 'desc';
    let desc_span = e.target.nextElementSibling;

    if(expected_key in data) {
        desc_span.innerHTML = data[expected_key];

        if(desc_span.classList.contains('hide') && data[expected_key].trim() !== ''){
            desc_span.classList.remove('hide');
    
        } else if(!desc_span.classList.contains('hide') && data[expected_key].trim() === ''){
            desc_span.classList.add('hide');
        }

    } else if(responded_with_error(data)){
        desc_span.innerHTML = get_error_message(data);
        
    } else {
        desc_span.innerHTML = 'Error retrieving description.'
    }
}


