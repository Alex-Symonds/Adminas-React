import { useRef, useLayoutEffect } from 'react';

export function Modal({children, close}){
    const ref = useRef();

    useLayoutEffect(() => {
        ref.current.show();
    }, []);

    function dialogClose(){
        ref.current.close();
        close();
    }

    return  <div className={"modalWrapper"}>
                <dialog className={"modal"} ref={ref}>
                    <button 
                            className={"modal_closeButton close"}
                            onClick={ () => dialogClose() }
                        >
                        <span>close</span>
                    </button>
                    { children }
                </dialog>
            </div>

}