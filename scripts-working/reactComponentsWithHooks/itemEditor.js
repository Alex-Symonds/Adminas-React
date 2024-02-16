/*
    JobItems can be created in groups using a formset, but they're
    edited one at a time in a regular form.

    This file contains support for the edit form.

    Contents:
    || Hook
    || Components
*/

// || Hook
function useJobItemEditor(refProps){
    const { data, closeEditor, delete_item, update_item } = refProps.current;

    const [quantity, setQuantity] = React.useState(data.quantity);
    const [sellingPrice, setSellingPrice] = React.useState(data.selling_price);
    const [productId, setProductId] = React.useState(data.product_id);
    const [priceListId, setPriceListId] = React.useState(data.price_list_id);

    function update_quantity(e){
        setQuantity(e.target.value);
    }
    function update_selling_price(e){
        setSellingPrice(e.target.value);
    }
    function update_product(e){
        setProductId(e.target.value);
    }
    function update_price_list(e){
        setPriceListId(e.target.value);
    }

    const controlled = {
        quantity: getter_and_setter(quantity, update_quantity),
        selling_price: getter_and_setter(sellingPrice, update_selling_price),
        product_id: getter_and_setter(productId, update_product),
        price_list_id: getter_and_setter(priceListId, update_price_list)
    };

    const asyncHelper = useAsyncWithError(closeEditor);

    function handle_submit(e){
        e.preventDefault();
        asyncHelper.handleAsync(() => update_item(data.ji_id, state_to_object_fe(), state_to_object_be()));
    }

    async function delete_jobitem(){
        asyncHelper.handleAsync(() => delete_item(data.ji_id));
    }

    function state_to_object_be(){
        return {
            quantity: quantity,
            selling_price: sellingPrice,
            product: productId,
            price_list: priceListId
        }
    }

    function state_to_object_fe(){
        // Creates an object with only the fields which changed
        var result = {}
        if(quantity != data.quantity){
            result['quantity'] = quantity;
        }
        if(sellingPrice != data.selling_price){
            result['selling_price'] = sellingPrice;
        }
        if(productId != data.product_id){
            result['product_id'] = productId;
        }
        if(priceListId != data.price_list_id){
            result['price_list_id'] = priceListId;
        }
        return result;
    }

    return {
        backendError: asyncHelper.backendError,
        controlled,
        handleSubmit: handle_submit,
        handleDelete: delete_jobitem
    }
}


// || Components
function JobItemEditor({ closeEditor, data, delete_item, job_id, update_item }){
    const refProps = React.useRef();
    refProps.current = {
        data, closeEditor, delete_item, update_item
    };
    const {
        backendError,
        controlled,
        handleSubmit,
        handleDelete
    } = useJobItemEditor(refProps);

    return [
        <Modal close={ closeEditor }>
            <div>
                <h3 class="modal_heading">Edit Item</h3>
                <div className={"modal_contents"}>
                    <div className={"formy"}>
                        <JobItemSharedFormFields    
                            controlled = { controlled }
                            initDescription = { data.description }
                            job_id = { job_id }
                            prefix = ''
                        />
                    {  backendError.message ?
                        <ErrorWithClearUI 
                            message = { backendError.message }
                            clear = { backendError.clear } 
                        />
                        : null
                    }
                        <EditorControls     
                            handleDelete = { handleDelete }
                            handleSubmit = { handleSubmit }
                            wantDelete = { true }
                        />
                    </div>
                </div>
            </div>
        </Modal>
    ]
}



