/*
    Sometimes there's a component which is used for more than
    one purpose, but only one should be using it at any one time.

    Think: full screen modal, or a busy tooltip on a page with
    many potential tooltip-users.

    So far those components are usually holding some sort of 
    form/editor, hence the name.

    This hook is intended to manage that sort of thing.

    Usage:
    * Call the hook in the root component of everything that's 
      competing for use of the same "editor component"

    * When you want to add a new way of using the editor, declare
      a uniqueID for it in the component and use that as follows:

        ** onClick for opening buttons =
            useEditorResult.open(uniqueID)

        ** Display of editor-using components = 
            { useEditorResult.isOpenedBy(uniqueID) ?
                <ComponentUsingTheModalOrTooltipOrWhatever />
                : null
            }   

    * isOpen() is there to help with disabling buttons when unavailable
        disabled = { useEditorResult.isOpen() }

    * close() is pretty self-explanatory
*/
function useEditor(){
    const [active, setActive] = React.useState(null);

    function open(id){
        if(!isOpen()){
            setActive(id);
        } else {
            throw new Error("Close the existing editor before opening a new one.")
        }
    }

    function close(){
        setActive(null);
    }

    function isOpen(){
        return active !== null;
    }

    function isOpenedBy(id){
        return isOpen() && id === active;
    }

    return {
        open,
        close,
        isOpen,
        isOpenedBy,
    }
}