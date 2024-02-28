/* 
    The Edit Job page has dropdowns showing a display name for each address in the database.
    When the user changes the dropdown, this code looks up the actual address on the server 
    and displays it underneath.
 */

import { 
    get_error_message, 
    get_json_with_status, 
    status_is_good 
} from "./util";


document.addEventListener('DOMContentLoaded', () => {
    setupAddressDropdownDescription();
});


function setupAddressDropdownDescription(){
    const CLASS_ADDRESS_DROPDOWN = 'address-dropdown';
    document.querySelectorAll('.' + CLASS_ADDRESS_DROPDOWN).forEach(ele => {
        const dd = ele.querySelector('select');
        update_address(dd);
        dd.addEventListener('change', (e) => {
            update_address(e.target);
        });
    });
}

async function update_address(ele){
    let display_div = ele.closest('.form-row').querySelector('.display-address');

    if(ele.selectedIndex !== 0){
        let json_response = await get_address_from_server(ele.value);

        if(status_is_good(json_response)){
            let display_address = format_address(json_response);
            display_div.innerHTML = display_address;
        }
        else{
            display_div.innerHTML = get_error_message(json_response);
        }
        
    } else {
        display_div.innerHTML = '';
    }
}

async function get_address_from_server(address_id){
    let response = await fetch(`${window.URL_SITE_ADDRESS}?type=site_address&id=${address_id}`)
    .catch(error => {
        console.log('Error: ', error);
    })
    return await get_json_with_status(response);
}

function format_address(data){
    let result = data['address'].replaceAll(',', '<br />');
    result += '<br />';
    result = add_str_and_br_if_not_blank(result, data['region']);
    result = add_str_and_br_if_not_blank(result, data['postcode']);
    result = add_str_and_br_if_not_blank(result, data['country']);

    return result;
}

function add_str_and_br_if_not_blank(result, new_str){
    if(new_str !== ''){
        return result += new_str + '<br />';
    }
    return result;
}

