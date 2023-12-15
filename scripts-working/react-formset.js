/*
    Fragment and hook to support Django formsets
*/

function FormSet({ actionsFormSet, MAX_FORMS, totalForms, children }){
    return  <>
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
}


function useFormSet(QUERY_KEY, KEY_PAIRS, actions, editor, MAX_FORMS = 10){
    /*
    Arguments:
        QUERY_KEY       Used in a "GET" after adding items. Added to the URL between actions_items.url and a list of IDs
        KEY_PAIRS       Array of objects with three keys:
                            fe      the key for this property on the frontend
                            be      the key for this property on the backend
                            init    the init value when a new form is created
                        Used for converting between FE and BE, for setting up new forms, and for unchanging form values (i.e. the job_id)
        actions         An "actions" object 
        editor          An "editor" object
        MAX_FORMS       {optional} The max number of forms to allow at once (default  = 10)
    */

    const initFields = getInitFieldsFromKeyPairs();

    // States for the formset
    const [numToAdd, setNumToAdd] = React.useState(0);
    const [formSetForms, setFormSetForms] = React.useState([
        initFields
    ]);

    // State for handling response to backend updates
    const [backendErrorState, setBackendErrorState] = React.useState(null);
    const backendError = get_backend_error_object(backendErrorState, setBackendErrorState);

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
    function handle_submit(e){
        e.preventDefault();
        create_new_items();
    }

    function create_new_items(){
        const url = actions.url;
        const headers = getFetchHeaders('POST', state_to_object_be());

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 201)){
                if(typeof resp_data.id_list !== 'undefined'){
                    add_new_items_to_state(resp_data.id_list);
                }
                else {
                    backendError.set('Page refresh recommended.');
                }
            }
            else {
                backendError.set(get_error_message(resp_data));
            }
        });
    }

    function add_new_items_to_state(id_list){
        const url = actions.url;
        const get_headers = getFetchHeaders('GET', null);

        let id_list_str = id_list.join('.');
        const get_url = `${url}?${QUERY_KEY}=${id_list_str}`;

        update_server(get_url, get_headers, resp_data => {
            if(status_is_good(resp_data, 200)){
                actions.create_f(resp_data.jobitems);
                editor.off();
            }
            else {
                backendError.set(get_error_message(resp_data));
            }
        });
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
        backendError,
        handleSubmit: handle_submit,
        MAX_FORMS,  
    }
}

