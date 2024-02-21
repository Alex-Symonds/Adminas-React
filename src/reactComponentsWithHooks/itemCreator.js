/*
    JobItems can be created in groups using a formset, but they're
    edited one at a time in a regular form.

    This file contains support for the creation formset.

    Contents:
    || Formset Helper
    || JobItems Creator
*/

import { Modal } from "../reactComponents/modal";

import { getter_and_setter } from "../util";

import { ErrorWithClearUI } from "./errors";
import { FormSet, useFormSet, getFormsetFieldNames } from "./formset";
import { JobItemSharedFormFields } from "./itemFormSharedFields";


// || Formset Helper
// Technically this isn't a hook, but it's hook-adjacent, so I'm going to count it. :)
// Add JobItem-specific functionality to the formset
export function createOneJobItemFormsetKit(actions_formset, data, form_index){
    // Functions for handling controlled inputs
    function update_quantity(e){
        const attr = {quantity: e.target.value};
        update_formset_state(attr);
    }
    function update_selling_price(e){
        const attr = {selling_price: e.target.value};
        update_formset_state(attr);
    }
    function update_product(e){
        const attr = {product_id: e.target.value};
        update_formset_state(attr);
    }
    function update_price_list(e){
        const attr = {price_list_id: e.target.value};
        update_formset_state(attr);
    }

    function update_formset_state(new_attr){
       actions_formset.update(form_index, new_attr);
    }

    const controlled = {
        quantity: getter_and_setter(data.quantity, update_quantity),
        selling_price: getter_and_setter(data.selling_price, update_selling_price),
        product_id: getter_and_setter(data.product_id, update_product),
        price_list_id: getter_and_setter(data.price_list_id, update_price_list)
    }

    function handle_click_remove(e){
        e.preventDefault();
        actions_formset.remove(form_index);
    }

    return {
        controlled,
        handle_click_remove
    }
}


// || JobItems Creator
export function JobItemsCreator({ actions_items, closeEditor, job_id }){
    const MAX_FORMS = 10;
    const KEY_PAIRS = [
        { be: 'quantity',       fe:'quantity',      init: '' },
        { be: 'product',        fe:'product_id',    init: ''  },
        { be: 'selling_price',  fe:'selling_price', init: ''  },
        { be: 'price_list',     fe:'price_list_id', init: ''  },
        { be: 'job',            fe:'job_id',        init: `${job_id}`  },
    ]
    const {
        formSetForms,
        actionsFormSet,
        backendError,
        handleSubmit,
    } = useFormSet(KEY_PAIRS, actions_items, closeEditor, MAX_FORMS);

    return (
        <Modal close={ closeEditor }>
            <div className={"jobItemsCreator"}>
                <h3 className={"modal_heading"}>Add New Items</h3>
                <div className={"modal_contents"}>
                { backendError.message ?
                    <ErrorWithClearUI 
                        message = { backendError.message }
                        clear = { backendError.clear } 
                    />
                    : null
                }
                    <form className={"jobItemsCreator_form"} onSubmit={ handleSubmit }>
                        <FormSet 
                            totalForms = { formSetForms.length }
                            MAX_FORMS = { MAX_FORMS }
                            actionsFormSet = { actionsFormSet }
                        >
                            { formSetForms.map((data, index) =>
                                <JobItemsCreatorRow key = { index }
                                    form_index = { index }
                                    actions_formset = { actionsFormSet }
                                    data = { data }
                                    job_id = { job_id }
                                    num_forms = { formSetForms.length }
                                />
                            )}
                        </FormSet>

                        <input type="submit" action="submit" class="button-primary jobItemsCreator_submit" value="submit"></input>
                    </form>
                </div>
            </div>
        </Modal>
    )
}


function JobItemsCreatorRow({ actions_formset, data, form_index, job_id, num_forms }){
    const {
        controlled,
        handle_click_remove
    } = createOneJobItemFormsetKit(actions_formset, data, form_index);

    return  <JobItemsCreatorRowUI    
                controlled = { controlled }
                form_index = { form_index }
                handle_click = { handle_click_remove }
                job_id = { job_id }
                num_forms = { num_forms }
            />
}


function JobItemsCreatorRowUI({ controlled, form_index, handle_click, job_id, num_forms }){
    // Django formsets require a specific format for names/IDs, so prepare that here
    const prefix = 'form-' + form_index + '-';
    const FFN_JOB = getFormsetFieldNames(prefix, 'job');

    return (
        <div className="formSet_formRow">
            { num_forms > 1
                ? <JobItemsCreatorRowRemoveButton handle_click = { handle_click } />
                : null
            }
            <JobItemSharedFormFields    
                controlled = { controlled }
                initDescription = ''
                job_id = { job_id }
                prefix = { prefix }
            />
            <input 
                type="hidden" 
                name={ FFN_JOB.name } 
                value={job_id} 
                id={ FFN_JOB.id } 
            />
        </div>
    )
}

function JobItemsCreatorRowRemoveButton({ handle_click }){
    return  <button 
                className="delete-panel formSet_removeItemButton" 
                onClick={ handle_click }
                type="button"
            >
                    <span>remove</span>
            </button>
}