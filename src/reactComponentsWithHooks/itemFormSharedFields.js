/*
    JobItems can be created in groups using a formset, but they're
    edited one at a time in a regular form.

    The actual inputs for a single JobItem are the same regardless
    of whether it's being created in a group or edited by itself. 
    
    This file contains those shared inputs so they can be dunked
    into either wrapper (as many times as needed).
*/

import { useState } from 'react';

import { url_for_product_description } from '../util';

import { FormLabel, LabelFieldContainer } from '../reactComponents/formLabels';
import { SelectBackendOptions } from '../reactComponents/selectWithBackendOptions';

import { getFormsetFieldNames } from './formset';

// || Hook
export function useProductDescription(initDescription, job_id){
    const [description, setDescription] = useState(initDescription);

    function update_product_description(product_id){
        // Note: the server uses the Job ID to determine the correct language for the description
        const url = url_for_product_description(product_id, job_id);
        fetch(url)
        .then(response => response.json())
        .then(resp_data => {
            // This feature is only a "nice to have", so if there's an error then desired behaviour = don't display anything
            if('desc' in resp_data){
                setDescription(resp_data.desc)
            }
        })
        .catch(error => setDescription(""))
    }

    return {
        description,
        update_product_description
    }
}


// || Shared JobItem form fields
export function JobItemSharedFormFields({ controlled, initDescription, job_id, prefix }){
    const {
        description,
        update_product_description
    } = useProductDescription(initDescription, job_id)

    function handle_product_change(e){
        controlled.product_id.set(e);
        update_product_description(e.target.value);
    }

    return  <JobItemSharedFormFieldsUI   
                controlled = { controlled }
                description = { description }
                handle_product_change = { handle_product_change }
                prefix = { prefix } 
            />
}


// "prefix" is there to support the formset, creating a unique name and ID for each set
function JobItemSharedFormFieldsUI({ controlled, description, handle_product_change, prefix }){
    const FFN_QUANTITY = getFormsetFieldNames(prefix, 'quantity');
    const FFN_PRODUCT = getFormsetFieldNames(prefix, 'product');
    const FFN_SELLING_PRICE = getFormsetFieldNames(prefix, 'selling_price');
    const FFN_PRICE_LIST = getFormsetFieldNames(prefix, 'price_list');

    return (
        <div className={"formy_inputsContainer"}>
            <LabelFieldContainer>
                <FormLabel inputID={ FFN_QUANTITY.id }>
                    Quantity
                </FormLabel>
                <input  
                    className={"formy_input"}
                    id={ FFN_QUANTITY.id } 
                    name={ FFN_QUANTITY.name } 
                    onChange={ controlled.quantity.set }
                    type="number" 
                    value={ controlled.quantity.get }
                />
            </LabelFieldContainer>

            <div className={"formy_labelFieldContainerWithAutoDesc"}>
                <LabelFieldContainer>
                    <FormLabel inputID={ FFN_PRODUCT.id }>
                        Item
                    </FormLabel>
                    <SelectBackendOptions   
                        get_param = 'products'
                        handle_change = { handle_product_change }
                        is_required = { true }
                        select_id = { FFN_PRODUCT.id }
                        select_name = { FFN_PRODUCT.name }
                        selected_opt_id = { controlled.product_id.get }
                    />
                </LabelFieldContainer> 
            { description === '' || description === null || description === undefined
                ? null
                : <span className='formy_productDesc'>
                    { description }
                </span>
            }
            </div>

            <LabelFieldContainer>
                <FormLabel inputID={ FFN_SELLING_PRICE.id }>
                    Selling Price
                </FormLabel>
                <input  
                    className={"formy_input"}
                    id={ FFN_SELLING_PRICE.id } 
                    name={ FFN_SELLING_PRICE.name } 
                    onChange={ controlled.selling_price.set }
                    step="0.01" 
                    type="number" 
                    value={ controlled.selling_price.get } 
                />
            </LabelFieldContainer>
            <LabelFieldContainer>
                <FormLabel inputID={ FFN_PRICE_LIST.id }>
                    Price List
                </FormLabel>
                <SelectBackendOptions   
                    get_param = 'price_lists'
                    handle_change = { controlled.price_list_id.set }
                    is_required = { true }
                    select_id = { FFN_PRICE_LIST.id }
                    select_name = { FFN_PRICE_LIST.name }
                    selected_opt_id = { controlled.price_list_id.get }
                />
            </LabelFieldContainer>
        </div>
    )
}

