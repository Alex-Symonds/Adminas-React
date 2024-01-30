function Modal({children, close}){
    const ref = React.useRef();

    React.useLayoutEffect(() => {
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