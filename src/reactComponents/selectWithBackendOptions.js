import { 
    url_for_select_options, 
    useFetchWithLoading, 
} from '../util';
import { LoadingUI, LoadingErrorUI } from './loadingAndEmptiness';

export function SelectBackendOptions({ cssClasses, get_param, handle_change, is_required, select_id, select_name, selected_opt_id }){
    const url = url_for_select_options(get_param);
    const { data, error, isLoaded } = useFetchWithLoading(url);
    
    return error
            ? <LoadingErrorUI name='dropdown' />
            : !isLoaded || typeof data.opt_list === 'undefined'
                ? <LoadingUI />
                : 
                <SelectWrapper
                    cssClasses = { cssClasses }
                    data = { data }
                    handle_change = { handle_change }
                    is_required = { is_required }
                    select_id = { select_id }
                    select_name = { select_name }
                    selected_opt_id = { selected_opt_id }
                >
                    <OptionEmptyDefaultUI />
                { data.opt_list.map((option) => 
                    <OptionIdAndNameUI key = { option.id.toString() }
                        value = { option.id }
                        name = { option.display_str }
                    />
                )}
                </SelectWrapper>
}

function SelectWrapper({ cssClasses, handle_change, is_required, select_id, select_name, selected_opt_id, children }){
    return  <select 
                className = {`formy_select${cssClasses === undefined ? "" : " " + cssClasses}`} 
                name = { select_name } 
                id = { select_id } 
                required = { is_required } 
                onChange  = { handle_change }
                value = { selected_opt_id ?? "" }
            >
                { children }
            </select>
}

function OptionEmptyDefaultUI(){
    return  <option value="">---------</option>
}

function OptionIdAndNameUI({ name, value }){
    return  <option value={value} >
                { name }
            </option>
}

