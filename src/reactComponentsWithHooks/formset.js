/*
    Django-Compatible Formset
    || Hook
    || Fragment
        > inputs to enable Django to process the formset
        > Wrapper around { children } for the individual forms
        > Formset-specific controls:
            > Add 1 more button
            > Add N more input and button
    || Helpers
        > Generate a unique name and ID for a fieldset member
*/
import { useState } from 'react';

import { getter_and_setter } from '../util';

import { useAsyncWithError } from '../hooks/useAsyncWithError';

// || Hook
export function useFormSet(KEY_PAIRS, actions, closeFn, MAX_FORMS = 10){
    /*
    Arguments:
        KEY_PAIRS       Array of objects with three keys:
                            fe      the key for this property on the frontend
                            be      the key for this property on the backend
                            init    the init value when a new form is created
                        Used for converting between FE and BE, for setting up new forms, and for unchanging form values (i.e. the job_id)
        actions         An "actions" object 
        closeFn         A function to run when it's time to close the formset
        MAX_FORMS       {optional} The max number of forms to allow at once (default  = 10)
    */

    const initFields = getInitFieldsFromKeyPairs();

    // States for the formset
    const [numToAdd, setNumToAdd] = useState(0);
    const [formSetForms, setFormSetForms] = useState([
        initFields
    ]);

    // Support for increasing/decreasing the number of items on the form
    function add_field_set(e){
        e.preventDefault();
        if(formSetForms.length >= MAX_FORMS){
            return;
        }
        setFormSetForms([...formSetForms, initFields]);
    }

    function add_n_field_sets(e){
        e.preventDefault();
        if(numToAdd === 0){
            return;
        }

        var new_fields = [];
        var counter = 0;
        while(counter < numToAdd){
            new_fields.push(initFields);
            counter++;
        }
        
        setFormSetForms(formSetForms.concat(new_fields));
        setNumToAdd(0);
    }

    function handle_num_add_change(e){
        var num = e.target.value;
        if(num < 0){
            setNumToAdd(0);
            return;
        }
        setNumToAdd(num);
    }

    function remove_field_set(index){
        setFormSetForms(formSetForms.filter((_, i) => i !== index));
    }

    function update_fields(index, fld_attributes){
        if(formSetForms.length <= index){
            throw Error("Formset fields were not updated");
        }

        const newFields = {
            ...formSetForms[index],
            ...fld_attributes,
        };

        const newState = formSetForms.map((ele, idx) => {
            return idx === index ?
                newFields
                : ele;
        })

        setFormSetForms(newState);
    }

    const actionsFormSet = {
        'add_one': add_field_set,
        'add_multiple': add_n_field_sets,
        'num_to_add': getter_and_setter(numToAdd, handle_num_add_change),
        'remove': remove_field_set,
        'update': update_fields
    }

    // Support for the submit button
    const asyncHelper = useAsyncWithError(closeFn);
    function handle_submit(e){
        e.preventDefault();
        asyncHelper.handleAsync(() => actions.create(state_to_object_be()));
    }

    // Format the formset state info so that Django will understand it
    function state_to_object_be(){
        const obj = {
            'form-TOTAL_FORMS': `${ formSetForms.length }`,
            'form-INITIAL_FORMS': '0',
            'form-MIN_NUM_FORMS': '0',
            'form-MAX_NUM_FORMS': `${ MAX_FORMS }`,
        }

        for(var index in formSetForms){
            var item_form = formSetForms[index];
            var prefix = `form-${ index }-`;

            for(let kpidx in KEY_PAIRS){
                const kp = KEY_PAIRS[kpidx];
                obj[prefix + kp.be] = item_form[kp.fe];
            }
        }

        return obj;
    }

    function getInitFieldsFromKeyPairs(){
        return KEY_PAIRS.reduce((result, ele) => {
            return {
                ...result,
                [ele.fe]: ele.init,
            }
        }, {} );
    }

    // Users who didn't specify MAX_FORMS and allowed it to fallback to the default might need to know what 
    // that default was, so pass that out
    return {
        formSetForms,
        actionsFormSet,
        backendError: asyncHelper.asyncError,
        handleSubmit: handle_submit,
        MAX_FORMS,  
    }
}

// || Fragment
export function FormSet({ actionsFormSet, MAX_FORMS, totalForms, children }){
    return  [
        <>
        <input type="hidden" name="form-TOTAL_FORMS" value={ totalForms } id="id_form-TOTAL_FORMS" />
        <input type="hidden" name="form-INITIAL_FORMS" value="0" id="id_form-INITIAL_FORMS" />
        <input type="hidden" name="form-MIN_NUM_FORMS" value="0" id="id_form-MIN_NUM_FORMS" />
        <input type="hidden" name="form-MAX_NUM_FORMS" value={ MAX_FORMS } id="id_form-MAX_NUM_FORMS" />

        <div className={"formSet_formRowsContainer"}>
            { children }
        </div>

        <div className={"formSet_addMoreContainer"}>
            <button class="formSet_addOne add-button" onClick={ actionsFormSet.add_one }>
                <span>add 1 more</span>
            </button>
            <div class="formSet_addNMore">
                <label className={"formSet_addNMoreLabel"}>
                    add more
                    <input type="number" className={"formSet_inputNMore"} id="add_multi_items" value={ actionsFormSet.num_to_add.get } onChange={ actionsFormSet.num_to_add.set } />
                </label>
                <button type="button" class="formSet_submitNMore button-primary" onClick={ actionsFormSet.add_multiple }>
                    add
                </button>
            </div>
        </div>
        </>
    ]
}

// || Helper
export function getFormsetFieldNames(prefix, fieldName){
    return {
        name: prefix + fieldName,
        id: 'id_' + prefix + fieldName
    }
}


