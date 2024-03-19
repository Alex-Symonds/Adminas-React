from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import adminas.models
from adminas.constants import ERROR_NO_DATA, DOCUMENT_TYPES, KEY_ERROR_MESSAGE, KEY_RESPONSE_CODE
import json
from django.urls import reverse
from django.core.paginator import Paginator

# Contents:
#   || Errors
#   || Retrieve
#   || Formatting
#   || Paginate
#   || Get Dict
#   || Creators
#   || Helpers

# || Errors
def error(reason, status_code):
    return {
        KEY_ERROR_MESSAGE: reason,
        KEY_RESPONSE_CODE: status_code
    }


def is_error(result_or_err):
    if not type(result_or_err) is type(error('', 0)):
        return False

    return KEY_ERROR_MESSAGE in result_or_err


def respond_with_error(details):
    if(details[KEY_RESPONSE_CODE] == 403 or details[KEY_RESPONSE_CODE] == 409):
        return JsonResponse({
            'error': details[KEY_ERROR_MESSAGE]
        }, status = details[KEY_RESPONSE_CODE])

    return HttpResponse(status = details[KEY_RESPONSE_CODE])


def render_with_error(request, details):
    status = details[KEY_RESPONSE_CODE]

    message = "Error: something went wrong."

    if status == 400:
        message = "Invalid inputs."
    elif status == 401:
        message = 'You must be logged in.'
    elif status == 403:
        if(KEY_ERROR_MESSAGE in details):
            message = details[KEY_ERROR_MESSAGE]
        else:
            message = 'Request was forbidden by the server.'
    elif status == 404:
        message = "Requested information was not found."
    elif status == 409:
        if(KEY_ERROR_MESSAGE in details):
            message = details[KEY_ERROR_MESSAGE]
        else:
            message = 'Request clashed with information on server. (The server won.)'
    elif status == 500:
        message = 'A server error has occurred.'

    return error_page(request, message, details[KEY_RESPONSE_CODE])


def error_page(request, message, error_code):
    return render(request, 'adminas/error.html', {
        'message': message
    }, status = error_code)


def anonymous_user(request):
    return error_page(request, 'You must be logged in to view this page.', 401)


def anonymous_user_json():
    return respond_with_error(error('You must be logged in.', 401))


def invalid_kwargs():
    return error("Invalid kwargs.", 500)


def valid_option(tuple_list, proposed):
    for opt in tuple_list:
        if opt[0] == proposed:
            return True
    return False


# || Retrieve
def dict_from_json(json_data):
    try:
        dict = json.loads(json_data)
    except:
        return error('Invalid data', 400)
    return dict


def get_value_from_json(json_data, key):
    dict = dict_from_json(json_data)
    if is_error(dict):
        return dict

    result = get_param_from_dict(key, dict)
    if is_error(result):
        return result
    return result


def get_param_from_dict(key, posted_data):
    if not key in posted_data:
        return error(f'{key} not found', 404)
    return posted_data[key]
    
    
def get_param_from_get_params(key, get_params):
    fallback_get = '-----'
    result = get_params.get(key, fallback_get)
    if result == fallback_get:
        return error(f'{key} not found.', 404)    
    return result


def get_object(model_class, **kwargs):
    """
    Get a model object or a standardised error.
    Model class is required.
    Valid kwargs are:
        id                  = if you already have an ID as a variable
        key + get_params    = ID key and the request.GET which should contain it
        key + dict          = ID key and the result of a successful json.loads()
    """

    # Set id, one way or another
    if 'id' in kwargs:
        id = kwargs['id']

    elif 'key' in kwargs and 'get_params' in kwargs:
        id = get_param_from_get_params(kwargs['key'], kwargs['get_params'])
        if is_error(id):
            return id


    elif 'key' in kwargs and 'dict' in kwargs:
        id = get_param_from_dict(kwargs['key'], kwargs['dict'])
        if is_error(id):
            return id

    else:
       return invalid_kwargs() 


    # Attempt to use that ID to get an actual object
    try:
        obj = model_class.objects.get(id=id)
    except model_class.DoesNotExist:
        return error(f"{model_class.__name__} not found.", 404)

    return obj


def get_comment(request, need_edit = False):
    """
    Retrieve a comment based on a GET param "id"
    """
    try:
        comment = adminas.models.JobComment.objects.get(id=request.GET.get('id'))

    except adminas.models.JobComment.DoesNotExist:
        return error("Can't find comment.", 404)

    if need_edit and comment.created_by != request.user:
        return error("You do not own this comment.", 403)

    return comment


def extract_toggle_data(posted_data):
    """
    Attempt to extract a key/value pair of comment toggle information from un-JSONed data
    """

    if 'pinned' in posted_data:
        return {
            'pinned': posted_data['pinned']
        }

    if 'highlighted' in posted_data:
        return {
            'highlighted': posted_data['highlighted']
        }

    return error('Invalid request', 400)


def get_page(sorted_items, get_params, num_per_page = 10):
    if(sorted_items != None):
        paginator = Paginator(sorted_items, num_per_page)

        # Get the requested page number (fallback to 1 if this wasn't specified)
        requested_page_num = get_param_from_get_params('page', get_params)
        if is_error(requested_page_num):
            requested_page_num = 1

        return paginator.page(requested_page_num)

    return None


# || Formatting
def format_money(value):
    if value == None:
        return ERROR_NO_DATA
    try:
        return f'{value:,.2f}'
    except:
        return value


def get_plus_prefix(value):
    if value > 0:
        return '+'
    else:
        return ''


def get_customer_via_agent_string(job):
    has_customer = job.customer != None
    has_agent = job.agent != None

    result = ''
    if has_customer:
        result += job.customer.name
    if has_customer and has_agent:
        result += " (via "
    if has_agent:
        result += job.agent.name
    if has_customer and has_agent:
        result += ")"
    
    return result




    

# || Get Dict
def get_dict_currency(currency_tuple):
    return {
        'id': currency_tuple[0],
        'display_str': currency_tuple[1]
    }


def get_dict_document_editor_settings(get_params):
    result = {}
    if 'id' in get_params:
        doc_obj = get_object(adminas.models.DocumentVersion, id = get_params['id'])
        if is_error(doc_obj):
            return doc_obj

        doc_obj = doc_obj
        if doc_obj.issue_date != None:
            return error("Forbidden: documents which have been issued cannot be updated.", 403)

        result['doc_obj'] = doc_obj
        result['job_obj'] = doc_obj.document.job
        result['doc_code'] = doc_obj.document.doc_type
        result['doc_ref'] = doc_obj.document.reference
        result['doc_title'] = dict(DOCUMENT_TYPES).get(result['doc_code'])
        return result

    elif 'job' in get_params and 'type' in get_params:
        job = get_object(adminas.models.Job, id = get_params['job'])
        if is_error(job):
            return job
        
        doc_code = get_param_from_get_params('type', get_params)
        if is_error(doc_code):
            return doc_code

        result['doc_obj'] = None
        result['job_obj'] = job
        result['doc_code'] = doc_code
        result['doc_ref'] = ''
        result['doc_title'] = f"Create New {dict(DOCUMENT_TYPES).get(doc_code)}"
        return result
    
    return error("Invalid GET parameters.", 400)


def get_dict_document_line_item_available(jobitem, qty_available):
    return {
        'display': jobitem.display_str().replace(str(jobitem.quantity), str(qty_available)),
        'is_available': True,
        'jiid': jobitem.pk,
        'total_quantity': jobitem.quantity,
        'max_available': qty_available
    }


def get_dict_job_page_root(job):
    """
    Dict for Job page root React component.
    """
    result = {}
    result['docbuilder_url'] = reverse('doc_editor_page') + '?job=' + str(job.id)

    result['doc_list'] = []
    for doc_version in job.related_documents():
        result['doc_list'].append(doc_version.summary()) 

    result['item_list'] = []
    if job.main_item_list() != None:
        for item in job.main_item_list():
            result['item_list'].append(item.get_dict())

    result['items_url'] = reverse('api_items')

    # result['main'] = {
    #     'currency': job.currency,
    #     'doc_quantities': job.all_documents_item_quantities(),
    #     'timestamp': job.created_on,
    #     'URL_MODULE_MANAGEMENT': reverse('manage_modules', kwargs={'job_id': job.id})
    # }
    result['currency'] = job.currency
    result['doc_quantities'] = job.all_documents_item_quantities()
    result['timestamp'] = job.created_on
    result['URL_MODULE_MANAGEMENT'] = reverse('manage_modules', kwargs={'job_id': job.id})

    result['po_list'] = []
    for po in job.po.filter(active=True):
        result['po_list'].append(po.get_dict())

    result['price_accepted'] = job.price_is_ok

    result['names'] = {
        'customer_via_agent': get_customer_via_agent_string(job),
        'customer_name': job.customer.name,
        'job_name': job.name
    }

    return result   


def get_dict_manage_modules(job, modular_jobitems):
    customer_via_agent = get_customer_via_agent_string(job)

    subheading = f"Job {job.name}"
    subheading += f": {customer_via_agent}" if customer_via_agent != '' else ''

    return {
        'items': [get_dict_modular_jobitem_for_module_management(mji) for mji in modular_jobitems],
        'job_id': job.id,
        'subheading': subheading   
    }


def get_dict_modular_jobitem_for_module_management(jobitem):
    return {
        'description': jobitem.product.get_description(jobitem.job.language),
        'has_excess': jobitem.excess_modules_assigned(),
        'id': jobitem.id,
        'product': jobitem.product.display_str(),
        'quantity': jobitem.quantity,
        'slots': [get_dict_slot_for_module_management(slot, jobitem) for slot in jobitem.product.slots.all()]
    }


def get_dict_record(job, user):
    po_list = [po.reference for po in job.po.filter(active=True)]

    return {
        'agent': job.agent.name if job.agent != None else None,
        'country': job.country.name,
        'created_on': job.created_on,
        'currency': job.currency,
        'customer': job.customer.name if job.agent != None else None,
        'delivery_to_name': job.delivery_to.site.company.name,
        'flag_alt': job.country.name,
        'flag_url': job.country.flag,
        'incoterm_code': job.incoterm_code,
        'invoice_to_name': job.invoice_to.site.company.name,
        'is_todo': None if user == None else user in job.users_monitoring.all(),
        'item_list': [item.get_display_str_dict() for item in job.main_item_list()] if job.main_item_list() != None else None,
        'job_id': job.id,
        'language': job.language,
        'name': job.name,
        'num_po': len(po_list),
        'po_list': po_list,
        'quote_ref': job.quote_ref,
        'total_po_value': format_money(job.total_po_value())
    }


def get_dict_slot_fillers_for_module_management(target_slot, parent):
    fillers = parent.modules.filter(slot=target_slot)
    if fillers.count() == 0:
        return None

    result = []
    for filler in fillers:
        result.append({
            'child': filler.child.display_str(),
            'id': filler.id,
            'quantity': filler.quantity
        })
    
    return result


def get_dict_slot_for_module_management(slot, jobitem):
    return {
        'fillers': get_dict_slot_fillers_for_module_management(slot, jobitem),
        'id': slot.id,
        'name': slot.name,
        'num_assigned': jobitem.num_slot_children(slot),
        'num_excess': jobitem.get_num_excess(slot),
        'num_required': slot.quantity_required,
        'optional_is_full': jobitem.num_slot_children(slot) >= slot.quantity_required + slot.quantity_optional,
        'status_str_for_optional': jobitem.get_slot_details_string_optional(slot),
        'status_str_for_required': jobitem.get_slot_details_string_required(slot)
    }


def get_dict_todo(job, user = None):
    """
    Get dict for element in "todo" list
    """
    result = {}
    result['agent'] = job.agent.name if job.agent != None else None
    result['currency'] = job.currency
    result['customer'] = job.customer.name if job.customer != None else None
    result['flag_alt'] = job.country.name
    result['flag_url'] = job.country.flag
    result['id'] = job.id
    result['name'] = job.name
    result['pinned_comments'] = None if user == None else job.get_pinned_comments(user, '-created_on')
    result['status'] = job.job_status()
    result['value'] = format_money(job.total_value())
    
    return result







# || Creators
def create_comment(comment_form, user, job):
    """
        Add one Comment, based on a pre-validated form.
    """
    comment = adminas.models.JobComment(
        created_by = user,
        job = job,
        contents = comment_form.cleaned_data['contents'],
        private = comment_form.cleaned_data['private']
    )
    comment.save()
    comment.update_toggles(comment_form.cleaned_data, user)

    return comment





def create_document(user, job_obj, doc_code, data_form, version_form, assigned_items, special_instructions, prod_data_form):
    """
    Create one new "document", consisting of: the "main" document; version 1 of that document;
    production data (if applicable); item assignments (if applicable); special instructions (if applicable).
    """
    doc_data = create_document_data(data_form, doc_code, job_obj)
    doc_version = create_document_version(doc_data, user, version_form)
    
    doc_version.update_production_dates(prod_data_form)
    doc_version.add_special_instructions(special_instructions, user)

    items_result = doc_version.assign_items(assigned_items)
    if is_error(items_result):
        return items_result
    
    return doc_version


def create_document_data(form, doc_code, job_obj):
    """
    Create and save one DocumentData object (= a labelled bucket into which we throw DocumentVersions)
    """
    new_document = adminas.models.DocumentData(
        reference = form.cleaned_data['reference'],
        doc_type = doc_code,
        job = job_obj
    )
    new_document.save()

    return new_document


def create_document_version(parent_doc, user, version_form):
    """
    Create and save one DocumentVersion object
    """
    new_version = adminas.models.DocumentVersion(
        created_by = user,
        document = parent_doc,
        version_number = 1,
        issue_date = version_form.cleaned_data['issue_date'] if 'issue_date' in version_form.cleaned_data else None,
        invoice_to = parent_doc.job.invoice_to,
        delivery_to = parent_doc.job.delivery_to
    )
    new_version.save()
    return new_version


def create_job(jobform, user):
    """
    Add one Job, based on a pre-validated form.
    """
    new_job = adminas.models.Job(
        created_by = user,
        name = jobform.cleaned_data['name'],
        agent = jobform.cleaned_data['agent'],
        customer = jobform.cleaned_data['customer'],
        country = jobform.cleaned_data['country'],
        language = jobform.cleaned_data['language'],
        quote_ref = jobform.cleaned_data['quote_ref'],
        currency = jobform.cleaned_data['currency'],
        payment_terms = jobform.cleaned_data['payment_terms'],
        incoterm_code = jobform.cleaned_data['incoterm_code'],
        incoterm_location = jobform.cleaned_data['incoterm_location'],
        invoice_to =  jobform.cleaned_data['invoice_to'],
        delivery_to = jobform.cleaned_data['delivery_to'],
    )

    new_job.save()
    user.todo_list_jobs.add(new_job)
    return new_job


def create_jobitem(admin_user, form):
    """
    Add one JobItem, based on a pre-validated form.
    """
    ji = adminas.models.JobItem(
        created_by = admin_user,
        job = form.cleaned_data['job'],
        product = form.cleaned_data['product'],
        price_list = form.cleaned_data['price_list'],
        quantity = form.cleaned_data['quantity'],
        selling_price = form.cleaned_data['selling_price']
    )
    ji.save()
    ji.add_standard_accessories()
    ji.job.price_changed()

    return ji


def create_jobmodule(form):
    new_jm = adminas.models.JobModule(
        parent = form.cleaned_data['parent'],
        child = form.cleaned_data['child'],
        slot = form.cleaned_data['slot'],
        quantity = form.cleaned_data['quantity']
    )
    if new_jm.parent.quantity * new_jm.quantity > new_jm.parent.job.num_unassigned_to_slot(new_jm.child):
        return error("Not enough items available.", 403)
    
    new_jm.save()
    return new_jm


def create_po(user, posted_form):
    """
    Add one PO, based on a pre-validated form.
    """
    new_po = adminas.models.PurchaseOrder(
        created_by = user,
        job = posted_form.cleaned_data['job'],
        reference = posted_form.cleaned_data['reference'],
        date_on_po = posted_form.cleaned_data['date_on_po'],
        date_received = posted_form.cleaned_data['date_received'],
        currency = posted_form.cleaned_data['currency'],
        value = posted_form.cleaned_data['value']
    )
    new_po.save()

    # Knock-on effects
    new_po.job.price_changed()

    return new_po




# || Helpers
def debug(print_this):
    print("------------- here comes something you're checking on! --------------------")
    print(print_this)
    print('---------------------------------------------------------------------------')


def update_membership(want_membership, memberlist_includes, member, memberlist):
    """
    Fix membership of an MTM list, but only if it's wrong
    """
    have_membership = memberlist_includes(member)

    if want_membership and not have_membership:
        memberlist.add(member)
    elif not want_membership and have_membership:
        memberlist.remove(member)


def copy_relations_to_new_document_version(existing_relations, new_version):
    """
    Support for replacement documents. Go through a set of relations making copies, assigning a new 
    PK to the copy, then replacing the version FK.
    """
    for record in existing_relations:
        r = record
        r.pk = None
        r.version = new_version
        r.save()
    return


def filter_jobs(get_params):
    """
    Filter jobs based on GET parameters
    """
    jobs = adminas.models.Job.objects.all().order_by('-created_on')

    if get_params.get('ref_job'):
        jobs = jobs.filter(name__contains=get_params.get('ref_job'))

    if get_params.get('ref_quote'):
        jobs = jobs.filter(name__contains=get_params.get('ref_quote'))

    if get_params.get('ref_po'):
        job_ids_with_similar_po_ref = adminas.models.PurchaseOrder.objects.filter(reference__contains=get_params.get('ref')).values('job')
        jobs = jobs.filter(id__in=job_ids_with_similar_po_ref)

    if get_params.get('customer'):
        jobs = jobs.filter(customer__id=get_params.get('customer'))
    
    if get_params.get('agent'):
        jobs = jobs.filter(agent__id=get_params.get('agent'))

    if get_params.get('sdate'):
        jobs = jobs.filter(created_on__gte=get_params.get('sdate'))

    if get_params.get('edate'):
        jobs = jobs.filter(created_on__lte=get_params.get('edate'))

    return jobs

