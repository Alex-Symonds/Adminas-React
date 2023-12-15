# Views for Adminas_React
# Contents:
#   || Page views
#   || API views
#   || Helpers
#   || Form helpers

from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.db import IntegrityError
from django.urls import reverse
from django.utils import formats

from wkhtmltopdf.views import PDFTemplateResponse

from adminas.models import  PriceList, User, Job, Address, JobItem, Product, Slot, PurchaseOrder,\
                            JobModule, ProductionData, DocumentVersion, Company
from adminas.forms import   DocumentDataForm, JobForm, POForm, JobItemForm, JobItemFormSet, JobItemEditForm, \
                            JobModuleForm, JobItemPriceForm, ProductionReqForm, DocumentVersionForm, JobCommentFullForm
from adminas.constants import MAX_NUM_FORMS, DOCUMENT_TYPES, CSS_FORMATTING_FILENAME, HTML_HEADER_FILENAME, HTML_FOOTER_FILENAME, SUPPORTED_CURRENCIES, WO_CARD_CODE
from adminas.util import anonymous_user, dict_from_json, error_page, debug, get_dict_document_editor_settings,\
    get_dict_job_page_root, get_dict_todo, get_dict_record, get_dict_manage_modules, get_page, get_customer_via_agent_string, \
    filter_jobs, get_dict_currency, create_jobmodule, get_object, anonymous_user_json, get_param_from_dict, get_value_from_json, \
    get_param_from_get_params, is_error, render_with_error, create_job, create_comment, create_po, create_jobitem, create_document, \
    error, respond_with_error, get_comment, extract_toggle_data


# || Page views
def login_view(request):
    """
    Log in page
    """
    if request.method == 'POST':

        # Attempt to sign user in
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse('index'))
        else:
            return render(request, 'adminas/login.html', {
                'message': 'Invalid username and/or password.'
            })
    else:
        return render(request, 'adminas/login.html')


def logout_view(request):
    """
    Log out
    """
    logout(request)
    return HttpResponseRedirect(reverse('index'))


def register(request):
    """
    Register new user page
    """
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']

        # Ensure password matches confirmation
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        if password != confirmation:
            return render(request, 'adminas/register.html', {
                'message': 'Passwords must match.'
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, 'adminas/register.html', {
                'message': 'Username already taken.'
            })
        login(request, user)
        return HttpResponseRedirect(reverse('index'))
    else:
        return render(request, 'adminas/register.html')


def index(request):
    """
        Index page, containing to-do list.
    """
    # Show anon users the sales pitch
    if not request.user.is_authenticated:
        return render(request, 'adminas/sales_pitch.html')

    # Show known users their todo list
    user = request.user
    jobs = user.todo_list_jobs.all().order_by('-created_on')

    jobs_list = []
    for job in jobs:
        jobs_list.append(get_dict_todo(job, user))

    return render(request, 'adminas/index.html', {
        'data': jobs_list
    })


def document_main_page(request, doc_id):
    """
        The read-only Document page.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    doc_obj = get_object(DocumentVersion, id = doc_id)
    if is_error(doc_obj):
        return respond_with_error(doc_obj)

    doc_title = dict(DOCUMENT_TYPES).get(doc_obj.document.doc_type)

    doc_specific_obj = None
    if doc_obj.document.doc_type == WO_CARD_CODE:
        try:
            doc_specific_obj = ProductionData.objects.filter(version=doc_obj)[0]
        except:
            doc_specific_obj = None

    return render(request, 'adminas/document_main.html', {
        'doc_title': doc_title,
        'doc_id': doc_id,
        'doc_version': doc_obj,
        'doc_specific': doc_specific_obj,
        'doc_type': doc_obj.document.doc_type,
        'excluded_items': doc_obj.get_excluded_items(),
        'included_items': doc_obj.get_included_items(),
        'job_id': doc_obj.document.job.id,
        'reference': doc_obj.document.reference,
        'show_validity_error': not doc_obj.issue_date and doc_obj.active and not doc_obj.is_valid(),
        'special_instructions': doc_obj.instructions.all().order_by('-created_on')
    })


def document_pdf(request, doc_id):
    """
        Generates a PDF of a given document and displays it in the browser window.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    # Get the document being PDFed and a context dict of its contents.
    # Draft docs get the current state; issued get the state as it was when the document was issued.
    my_doc = DocumentVersion.objects.get(id=doc_id)

    if my_doc.issue_date == '' or my_doc.issue_date == None:
        context = my_doc.get_draft_data()
    else:
        context = my_doc.get_issued_data()

    # Sort out file names/paths
    context['css_doc_type'] = f'adminas/styles/{context["css_filename"]}'
    if CSS_FORMATTING_FILENAME != '':
        context['css_doc_user'] = f'adminas/styles/{CSS_FORMATTING_FILENAME}.css'
    if HTML_HEADER_FILENAME != '':
        context['company_header_file'] = f'adminas/pdf/{HTML_HEADER_FILENAME}.html'
    if HTML_FOOTER_FILENAME != '':
        context['company_footer_file'] = f'adminas/pdf/{HTML_FOOTER_FILENAME}.html'

    template_body = f'adminas/pdf/pdf_doc_2_{my_doc.document.doc_type.lower()}_b.html'
    template_header = f'adminas/pdf/pdf_doc_2_{my_doc.document.doc_type.lower()}_h.html'
    template_footer = f'adminas/pdf/pdf_doc_2_{my_doc.document.doc_type.lower()}_f.html'

    # Default value is the height of the user's footer
    margin_bottom_setting = 20
    if my_doc.document.doc_type == 'WO':
        margin_bottom_setting = 35

    response = PDFTemplateResponse( request=request,
                                    template=template_body,
                                    filename=f"{my_doc.document.doc_type} {my_doc.document.reference}.pdf",
                                    header_template = template_header,
                                    footer_template = template_footer,
                                    context=context,
                                    show_content_in_browser=True,
                                    cmd_options={
                                            'dpi': 77,
                                            'margin-bottom': margin_bottom_setting,
                                            "zoom":1,
                                            'quiet': None,
                                            'enable-local-file-access': True},
                                )
    return response



def document_editor_page(request):
    """
        Document Editor page.
    """
    settings = get_dict_document_editor_settings(request.GET)
    if is_error(settings):
        return render_with_error(request, settings)

    # Prepare additional variables for an existing document
    doc_obj = settings['doc_obj']
    if doc_obj != None:
        included_list = doc_obj.get_included_items()
        excluded_list = doc_obj.get_excluded_items()
        special_instructions = doc_obj.instructions.all().order_by('-created_on')
        version_num = doc_obj.version_number

        doc_specific_obj = None
        if doc_obj.document.doc_type == WO_CARD_CODE:
            doc_specific_obj = ProductionData.objects.filter(version=doc_obj)[0]

    # Prepare additional variables for a blank new document
    else:
        included_list = settings['job_obj'].get_items_unassigned_to_doc(settings['doc_code'])
        excluded_list = settings['job_obj'].get_items_assigned_to_doc(settings['doc_code'])
        special_instructions = None
        doc_specific_obj = None
        version_num = 1

    return render(request, 'adminas/document_builder.html', {
        'doc_title': settings['doc_title'],
        'doc_id': doc_obj.id if doc_obj != None else 0,
        'doc': doc_obj,
        'is_valid': doc_obj.is_valid() if doc_obj != None else True,
        'version_number': version_num,
        'doc_type': settings['doc_code'],
        'reference': settings['doc_ref'],
        'job_id': settings['job_obj'].id,
        'doc_specific': doc_specific_obj,
        'included_items': included_list,
        'excluded_items': excluded_list,
        'special_instructions': special_instructions
    })


def job(request, job_id):
    """
        "Main" Job page.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    job = get_object(Job, id = job_id)
    if is_error(job):
        return render_with_error(request, job)

    return render(request, 'adminas/job.html', {
        'job_id': job.id
    })


def manage_modules(request, job_id):
    """
        Module Management page.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    job = Job.objects.get(id=job_id)

    # Get a list of JobItems in this Job which have modules
    job_items = JobItem.objects.filter(job=job)
    modular_jobitems = []
    for ji in job_items:
        if ji.product.is_modular():
            modular_jobitems.append(ji)

    if len(modular_jobitems) == 0:
        return error_page('This job has no modular items, so there are no modules to manage.')

    data = get_dict_manage_modules(job, modular_jobitems)

    return render(request, 'adminas/manage_modules.html', data)


def comments_page(request):
    job = get_object(Job, key = 'job_id', get_params = request.GET)
    if is_error(job):
        return render_with_error(job)

    # Paginate "all comments"
    # (Assumption: users will only pin/highlight a few comments, so pagination won't be needed there)
    # (Assertion: if they pin/highlight a bajillion comments, it's their own fault if they have to scroll a lot)
    setting_for_order_by = '-created_on'
    all_comments = job.get_all_comments(request.user, setting_for_order_by)

    page = get_page(all_comments, request.GET)
    if is_error(page):
        return render_with_error(page)

    return render(request, 'adminas/job_comments.html', {
        'customer_via_agent': get_customer_via_agent_string(job),
        'job': job.get_dict(),
        'pinned': job.get_pinned_comments(request.user, setting_for_order_by),
        'highlighted': job.get_highlighted_comments(request.user, setting_for_order_by),
        'all_comments': None if page == None else page.object_list,
        'page_data': page
    })


def job_editor_page(request):
    # Use cases:
    #   1) Blank form for a new job
    #   2) Filled form for editing an existing job
    # We distinguish between these by the presence of a "job" key in the GET params
    fallback_get = '-'
    job_id = request.GET.get('job', fallback_get)

    # Settings for a new job with a blank form
    if job_id == fallback_get:
        task_name = 'Create New'
        job_form = JobForm()
        job_id = 0

    # Setting for an existing job with a filled form
    else:
        job = get_object(Job, id = job_id)
        if is_error(job):
            return render_with_error(request, job)

        task_name = 'Edit'
        job_form = JobForm(instance=job)
        job_id = job.id


    return render(request, 'adminas/edit.html',{
        'job_form': job_form,
        'task_name': task_name,
        'job_id': job_id
    }) 


def records(request):
    """
        Records page.
    """

    # Filter jobs according to GET parameters, paginate, then get dict
    filtered_jobs = filter_jobs(request.GET)

    num_records_per_page = 20
    req_page = get_page(filtered_jobs, request.GET, num_records_per_page)

    records = [get_dict_record(job, request.user) for job in req_page.object_list]

    return render(request, 'adminas/records.html', {
        'records': records,
        'total_count': Job.objects.all().count(),
        'filter_count': filtered_jobs.count(),
        'page_data': req_page
    })



# || API views
def api_comments(request):
    """
        Processing for JobComments.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'DELETE':
        comment = get_comment(request, True)

        if is_error(comment):
            return respond_with_error(comment)
        else:
            comment.delete()
            return HttpResponse(status = 204)


    elif request.method == 'PUT':
        posted_data = dict_from_json(request.body)
        if is_error(posted_data):
            return respond_with_error(posted_data)

        # Note: edits come from two places: the comment editor ("full" edits) or icons on a "read-mode" comment ("toggles")
        # Only full edits have a 'contents' key, so use that to distinguish between the two
        if 'contents' in posted_data:

            comment = get_comment(request, True)
            if is_error(comment):
                return respond_with_error(comment)

            form = get_form_from_request(request, get_comment_form)
            if is_error(form):
                return respond_with_error(form)

            comment.update(form, request.user)

        else:
            comment = get_comment(request, False)
            if is_error(comment):
                return respond_with_error(comment)

            toggle_details = extract_toggle_data(posted_data)
            if is_error(toggle_details):
                return respond_with_error(toggle_details)

            comment.update_toggles(toggle_details, request.user)

        return HttpResponse(status = 204)


    elif request.method == 'POST':

        comment_form = get_form_from_request(request, get_comment_form)
        if is_error(comment_form):
            return respond_with_error(comment_form)

        job = get_object(Job, key = 'job_id', get_params = request.GET)
        if is_error(job):
            respond_with_error(job)

        comment = create_comment(comment_form, request.user, job)
        return JsonResponse({
            'id': comment.id,
            'created_on': formats.date_format(comment.created_on, "DATETIME_FORMAT")
        }, status = 201)



def api_draft_documents(request):
    """
    Process working documents
    """

    if not request.user.is_authenticated:
        return anonymous_user(request)


    if request.method == 'DELETE':
        doc_obj = get_object(DocumentVersion, key = 'id', get_params = request.GET)
        if is_error(doc_obj):
            return respond_with_error(doc_obj)

        is_safe = doc_obj.safe_to_delete()
        if is_error(is_safe):
            return respond_with_error(is_safe)

        doc_obj.deactivate()
        doc_obj.save()

        return HttpResponse(status = 204)


    elif request.method == 'PUT':
        doc_obj = get_object(DocumentVersion, key = 'id', get_params = request.GET)
        if is_error(doc_obj):
            return respond_with_error(doc_obj)

        doc_request_data = get_document_details_from_request(request)
        if is_error(doc_request_data):
            return respond_with_error(doc_request_data)

        update_result = doc_obj.update(
                            request.user,\
                            doc_request_data['doc_data_form'].cleaned_data['reference'],\
                            doc_request_data['version_form'].cleaned_data['issue_date'],\
                            doc_request_data['assigned_items'],\
                            doc_request_data['special_instructions'],\
                            doc_request_data['prod_data_form']
                            )
        if is_error(update_result):
            return respond_with_error(update_result)

        return HttpResponse(status = 204)


    elif request.method == 'POST':

        doc_request_data = get_document_details_from_request(request)
        if is_error(doc_request_data):
            return respond_with_error(doc_request_data)

        job = get_object(Job, key = 'job', get_params = request.GET)
        if is_error(job):
            return job

        doc_code = get_param_from_get_params('type', request.GET)
        if is_error(doc_code):
            return doc_code

        doc_obj = create_document(  request.user, job, doc_code,\
                                    doc_request_data['doc_data_form'],\
                                    doc_request_data['version_form'],\
                                    doc_request_data['assigned_items'],\
                                    doc_request_data['special_instructions'],\
                                    doc_request_data['prod_data_form'])

        return JsonResponse({
            'id': doc_obj.id
        }, status = 201, headers = {'Location': f"{reverse('doc_editor_page')}?id={doc_obj.id}"})


    # GET
    doc_obj = get_object(DocumentVersion, key = 'id', get_params = request.GET)
    if is_error(doc_obj):
        return respond_with_error(doc_obj)

    return JsonResponse({
        'doc_is_issued': doc_obj.is_issued(),
        'doc_is_valid': doc_obj.is_valid(),
        'item_is_valid': doc_obj.assignment_validity_by_jiid()
    }, status = 200) 



def api_issued_documents(request):
    """
    Process requests to replace or revert issued documents
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'POST':
        this_version = get_object(DocumentVersion, key = 'doc_id', get_params = request.GET)
        if is_error(this_version):
            return respond_with_error(this_version)

        task = get_param_from_get_params('task', request.GET)
        if is_error(task):
            return respond_with_error(task)

        if task == 'replace':
            try:
                new_version = this_version.get_replacement_version(request.user)
                return JsonResponse({
                    'id': new_version.id
                }, status = 201, headers = {'Location': f"{reverse('doc_editor_page')}?id={new_version.id}"})

            except:
                return respond_with_error(error('Replacement failed', 500))

        elif task == 'revert':
            previous_version = this_version.revert_to_previous_version()
            if is_error(previous_version):
                return respond_with_error(previous_version)

            return JsonResponse({
                'id': previous_version.id
            }, status = 200, headers = {'Location': reverse('doc_main', kwargs={'doc_id': previous_version.pk})})

    return respond_with_error(error("Invalid request.", 400))



def api_items(request):
    """
        Process JobItems
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'DELETE':

        jobitem = get_object(JobItem, key = 'id', get_params = request.GET)
        if is_error(jobitem):
            return respond_with_error(jobitem)

        is_safe = jobitem.safe_to_delete()
        if not is_safe == True:
            return respond_with_error(is_safe)

        jobitem.job.price_changed()
        jobitem.delete()
        return HttpResponse(status = 204)


    elif request.method == 'POST':
        contains_formset_data = request_contains_formset(request)
        if is_error(contains_formset_data):
            return respond_with_error(contains_formset_data)

        if contains_formset_data:
            formset = get_form_from_request(request, JobItemFormSet)
            if is_error(formset):
                return respond_with_error(formset)

            jobitems = []
            for form in formset:
                new_ji = create_jobitem(request.user, form)
                jobitems.append(new_ji.id)

            return JsonResponse({
                'id_list': jobitems
            }, status = 201)
        
        else:
            form = get_form_from_request(request, get_jobitem_form)
            if is_error(form):
                return respond_with_error(form)

            jobitem = create_jobitem(request.user, form)
            return JsonResponse({
                'id': jobitem.id
            }, status = 201)


    elif request.method == 'PUT':

        jobitem = get_object(JobItem, key = 'id', get_params = request.GET)
        if is_error(jobitem):
            return respond_with_error(jobitem)

        # Updates can be called from two places:
        #   > JobItem panel ("full" edit, i.e. quantity, product, price_list and selling_price)
        #   > Price checker table (selling_price only)
        full_edit_requested = is_full_edit_of_jobitem(request)
        if is_error(full_edit_requested):
            return respond_with_error(full_edit_requested)

        if full_edit_requested:
            form = get_form_from_request(request, JobItemEditForm)
            if is_error(form):
                return respond_with_error(form)

            update_result = jobitem.update(form)
            if is_error(update_result):
                return respond_with_error(update_result)

            return HttpResponse(status = 204)

        else:
            form = get_form_from_request(request, JobItemPriceForm)
            if is_error(form):
                return respond_with_error(form)

            jobitem.update_price(form)

            return HttpResponse(status = 204)

    # GET
    ji_id_list_string = get_param_from_get_params('ji_id_list', request.GET)
    ji_id = get_param_from_get_params('ji_id', request.GET)
    if is_error(ji_id_list_string) and is_error(ji_id):
        return respond_with_error(error('Necessary GET parameter is missing', 400))

    elif not is_error(ji_id_list_string):

        ji_id_list = ji_id_list_string.split('.')
        if len(ji_id_list) <= 0 or len(ji_id_list) > MAX_NUM_FORMS:
            my_error = error("Invalid item list", 400)
            return respond_with_error(my_error)
        
        jobitems = []
        for id in ji_id_list:
            jobitem = get_object(JobItem, id = id)
            if is_error(jobitem):
                return respond_with_error(jobitem)
            jobitems.append(jobitem.get_dict())
        
        return JsonResponse({
            'jobitems': jobitems
        }, status = 200)

    elif not is_error(ji_id):
        jobitem = get_object(JobItem, id = ji_id)
        if is_error(jobitem):
            return respond_with_error(jobitem)

        return JsonResponse(jobitem.get_dict(), status = 200)



def api_job(request):
    """
        Processing for Jobs
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)


    if request.method == 'DELETE':

        job_to_delete = get_object(Job, key = 'delete_id', get_params = request.GET)
        if is_error(job_to_delete):
            return render_with_error(request, job_to_delete)

        is_safe = job_to_delete.safe_to_delete()
        if is_error(is_safe):
            return respond_with_error(is_safe)
        
        job_to_delete.delete_draft_documents()
        job_to_delete.delete()
        return HttpResponse(status = 204)


    # POST = form submission = create or edit a Job
    elif request.method == 'POST':

        posted_form = JobForm(request.POST)
        if not posted_form.is_valid():
            return error_page(request, 'Invalid form.', 400)

        job_id = request.POST['job_id']

        # Handle create
        if job_id == '0':
            user = request.user
            new_job = create_job(posted_form, user)
            redirect_id = new_job.id

        # Handle update
        else:
            job = Job.objects.get(id=job_id)
            job.update(posted_form, request.user)
            redirect_id = job.id

        return HttpResponseRedirect(reverse('job', kwargs={'job_id': redirect_id}))


def api_module_assignments(request):
    """
        Process Module Assignments
    """

    if not request.user.is_authenticated:
        return anonymous_user_json()


    if request.method == 'DELETE':

        jobmodule = get_object(JobModule, key = 'id', get_params = request.GET)
        if is_error(jobmodule):
            return respond_with_error(jobmodule)

        parent = jobmodule.parent
        slot = jobmodule.slot
        jobmodule.delete()
        return HttpResponse(status = 204)


    elif request.method == 'PUT':
        posted_data = dict_from_json(request.body)
        if is_error(posted_data):
            return respond_with_error(posted_data)

        jobmodule = get_object(JobModule, key = 'id', dict = posted_data)
        if is_error(jobmodule):
            return respond_with_error(jobmodule)

        jm_update_result = jobmodule.update(posted_data['qty'])
        if is_error(jm_update_result):
            return respond_with_error(jm_update_result)

        return HttpResponse(status = 204)


    elif request.method == 'POST':
        posted_form = get_form_from_request(request, JobModuleForm)
        if is_error(posted_form):
            return respond_with_error(posted_form)

        jobmodule = create_jobmodule(posted_form)
        if is_error(jobmodule):
            return respond_with_error(jobmodule)

        return JsonResponse({
            'id': jobmodule.id
        }, status = 201)


    parent = get_object(JobItem, key = 'parent_id', get_params = request.GET)
    if is_error(parent):
        return respond_with_error(parent)

    slot = get_object(Slot, key = 'slot_id', get_params = request.GET)
    if is_error(slot):
        return respond_with_error(slot)
    
    response_dict = parent.get_slot_status_dictionary(slot)
    return JsonResponse(response_dict, status = 200)



def api_price_acceptance(request):
    """
    Process the Job page's "selling price is {NOT }CONFIRMED" indicator/button
    """
    if not request.user.is_authenticated:
        return anonymous_user_json()

    if request.method == 'PUT':
        job = get_object(Job, key = 'job_id', get_params = request.GET)
        if is_error(job):
            return respond_with_error(job)

        new_status = get_value_from_json(request.body, 'new_status')
        if is_error(new_status):
            return respond_with_error(new_status)

        job.price_is_ok = new_status
        job.save()

        return HttpResponse(status = 204)
    
    error_obj = error('Invalid HTTP verb', 405)
    return respond_with_error(error_obj)



def api_purchase_order(request):
    """
    Process purchase orders.
    """
    if not request.user.is_authenticated:
        return anonymous_user_json()

    if request.method == 'DELETE':
        po = get_object(PurchaseOrder, key ='id', get_params = request.GET)
        if is_error(po):
            return respond_with_error(po)

        po.deactivate()
        return HttpResponse(status = 204)


    elif request.method == 'POST':
        form = get_form_from_request(request, POForm)
        if is_error(form):
            return respond_with_error(form)

        new_po = create_po(request.user, form)
        return JsonResponse({
            'id': new_po.id
        }, status = 201)


    elif request.method == 'PUT':
        form = get_form_from_request(request, POForm)
        if is_error(form):
            return respond_with_error(form)

        po = get_object(PurchaseOrder,key = 'id', get_params = request.GET)
        if is_error(po):
            return respond_with_error(po)

        po.update(form)
        return HttpResponse(status = 204)



def api_todo_list(request):
    """
        Process changes to the to-do list.
    """
    if not request.user.is_authenticated:
        return anonymous_user_json()

    posted_data = dict_from_json(request.body)
    if is_error(posted_data):
        return respond_with_error(posted_data)

    job = get_object(Job, key = 'job_id', dict = posted_data)
    if is_error(job):
        return respond_with_error(job)

    user = request.user

    if request.method == 'DELETE':

        if job in user.todo_list_jobs.all():
            user.todo_list_jobs.remove(job)
            user.save()

        return HttpResponse(status = 204)

    elif request.method == 'PUT':
        if not job in user.todo_list_jobs.all():
            user.todo_list_jobs.add(job)
            user.save()

        return HttpResponse(status = 204)

    # Return a generic failure message if this was a POST or GET
    error_obj = error("Invalid HTTP verb", 405)
    return respond_with_error(error_obj)



def api_data(request):
    """
    General-purpose API
    """
    if not request.user.is_authenticated:
        return anonymous_user_json()

    data_category = get_param_from_get_params('type', request.GET)
    if is_error(data_category):
        return respond_with_error(data_category)

    if data_category == 'site_address':
        address = get_object(Address, key = 'id', get_params = request.GET)
        if is_error(address):
            return respond_with_error(address)

        return JsonResponse(address.get_dict(), status = 200)

    elif data_category == 'product_description':
        job = get_object(Job, key = 'job_id', get_params = request.GET)
        if is_error(job):
            return respond_with_error(job)

        product = get_object(Product, key = 'product_id', get_params = request.GET)
        if is_error(product):
            return respond_with_error(product)

        description= product.get_description(job.language)

        return JsonResponse({
            'desc': description
        }, status = 200)

    elif data_category == 'select_options_list':
        key_options_list = 'opt_list'

        select_name = get_param_from_get_params('name', request.GET)
        if is_error(select_name):
            return respond_with_error(select_name)

        response_data = {}
        response_data[key_options_list] = []

        if select_name == 'customers':
            jobs = Job.objects.values('customer').distinct()
            relevant_companies = Company.objects.filter(id__in=jobs).order_by('name')
            for c in relevant_companies:
                response_data[key_options_list].append(c.get_dict())

        elif select_name == 'agents':
            jobs = Job.objects.values('agent').distinct()
            relevant_companies = Company.objects.filter(id__in=jobs).order_by('name')
            for c in relevant_companies:
                response_data[key_options_list].append(c.get_dict())

        elif select_name == 'price_lists':
            price_lists = PriceList.objects.all().order_by('-valid_from')
            for prl in price_lists:
                response_data[key_options_list].append(prl.get_dict())

        elif select_name == 'currencies':
            for currency in SUPPORTED_CURRENCIES:
                cur_dict = get_dict_currency(currency)
                response_data[key_options_list].append(cur_dict)

        elif select_name == 'products':
            products = Product.objects.filter(available=True).order_by('part_number')
            for product in products:
                response_data[key_options_list].append(product.get_dict())


        elif select_name == 'slot_options_jobitems':
            parent = get_object(JobItem, key = 'parent', get_params = request.GET)
            if is_error(parent):
                return respond_with_error(parent)

            slot = get_object(Slot, key = 'slot', get_params = request.GET)
            if is_error(slot):
                return respond_with_error(slot)

            response_data[key_options_list] = parent.job.get_dict_slot_fillers(slot)
            response_data['parent_quantity'] = parent.quantity


        elif select_name == 'slot_options_products':
            parent = get_object(JobItem, key = 'parent', get_params = request.GET)
            if is_error(parent):
                return respond_with_error(parent)

            slot = get_object(Slot, key = 'slot', get_params = request.GET)
            if is_error(slot):
                return respond_with_error(slot)

            response_data[key_options_list] = slot.get_dict_choice_list(parent.price_list, parent.job.currency)

        return JsonResponse(response_data, status = 200)


    elif data_category == 'urls':
        response_data = {}
        response_data['po_url'] = reverse('api_purchase_order')
        response_data['price_acceptance_url'] = reverse('api_price_acceptance')

        return JsonResponse(response_data, status = 200)

    # Packages of data for various React components on the Job page
    elif data_category == 'page_load':

        job = get_object(Job, key = 'job_id', get_params = request.GET)
        if is_error(job):
            return respond_with_error(job)

        component_name = get_param_from_get_params('name', request.GET)
        if is_error(component_name):
            return respond_with_error(component_name)

        response_data = {}
        # if component_name == 'comments':
            # setting_for_order_by = '-created_on'
            # response_data['url'] = f"{reverse('comments_page')}?job_id={job.id}"
            # response_data['api'] = reverse('api_comments')
            # response_data['username'] = request.user.username
            # response_data['comments'] = job.get_all_comments(request.user, setting_for_order_by)

        if component_name == 'details':
            response_data = job.get_dict()
            response_data['url'] = reverse('job_editor_page') + '?job=' + str(job.id)

        elif component_name == 'documents':
            doc_list = []
            for doc_version in job.related_documents():
                doc_list.append(doc_version.summary())

            response_data['doc_list'] = doc_list

        elif component_name == 'heading':
            jobDict = job.get_dict()
            response_data['names'] = {
                'job_name': jobDict['name'],
                'customer_name': jobDict['customer'],
                'agent_name': jobDict['agent']
            }

        elif component_name == 'job_page_root':
            response_data = get_dict_job_page_root(job)

            setting_for_order_by = '-created_on'
            response_data['comments_url'] = f"{reverse('comments_page')}?job_id={job.id}"
            response_data['comments_api'] = reverse('api_comments')
            response_data['username'] = request.user.username
            response_data['comments'] = job.get_all_comments(request.user, setting_for_order_by)


        elif component_name == 'todo':
            response_data['url'] = reverse('api_todo_list')
            response_data['on_todo'] = job.on_todo_list(request.user)

        else:
            return respond_with_error(error("Invalid component name.", 400))

        return JsonResponse(response_data, status = 200)



# || Helpers
def request_contains_formset(request):
    posted_data = dict_from_json(request.body)
    if is_error(posted_data):
        return posted_data
    return 'form-TOTAL_FORMS' in posted_data


def is_full_edit_of_jobitem(request):
    posted_data = dict_from_json(request.body)
    if is_error(posted_data):
        return posted_data

    # Check for the presence of any JobItem field other than selling_price
    # ("partial" edits = selling_price only)
    return 'product' in posted_data


def dict_contains_production_data(dict):
    return 'req_prod_date' in dict


# || Form helpers
def invalid_form_error():
    return error("Invalid form data.", 400)

def get_form_from_request(request, form_funct):
    dict = dict_from_json(request.body)
    if is_error(dict):
        return dict
    return get_validated_form(dict, form_funct)


def get_validated_form(dict, form_funct):
    form = form_funct(dict)
    if is_error(form):
        return form

    check = check_form_validity(form)
    if is_error(check):
        return check

    return form


def check_form_validity(form):
    if not form.is_valid():
        debug(form.errors)
        return invalid_form_error()
    return True


def get_comment_form(posted_data):
    comment_form = JobCommentFullForm({
        'private': posted_data['private'],
        'contents': posted_data['contents'],
        'pinned': posted_data['pinned'],
        'highlighted': posted_data['highlighted']
    })

    return comment_form


def get_jobitem_form(posted_data):
    parent = get_object(JobItem, key = 'parent', dict = posted_data)
    if is_error(parent):
        return parent

    product = get_object(Product, key = 'product', dict = posted_data)
    if is_error(product):
        return product

    quantity = get_param_from_dict('quantity', posted_data)
    if is_error(quantity):
        return quantity

    form = JobItemForm({
        'job': parent.job,
        'quantity': quantity,
        'product': product.id,
        'price_list': parent.price_list,
        'selling_price': product.get_price(parent.job.currency, parent.price_list)
    })

    return form


def get_document_details_from_request(request):
    incoming_data = dict_from_json(request.body)
    if is_error(incoming_data):
        return incoming_data
    return get_document_details(incoming_data)


def get_document_details(incoming_data):
    doc_data_form = get_validated_form({
        'reference': incoming_data['reference']
    }, DocumentDataForm)
    if is_error(doc_data_form):
        return doc_data_form

    version_form = get_validated_form({
        'issue_date': incoming_data['issue_date']
    }, DocumentVersionForm)
    if is_error(version_form):
        return version_form

    if dict_contains_production_data(incoming_data):
        prod_data_form = get_validated_form({
            'date_requested': incoming_data['req_prod_date'],
            'date_scheduled': incoming_data['sched_prod_date']
        }, ProductionReqForm)

        if is_error(prod_data_form):
            return prod_data_form
    else:
        prod_data_form = None

    return {
        'doc_data_form': doc_data_form,
        'version_form': version_form,
        'prod_data_form': prod_data_form,
        'assigned_items': incoming_data['assigned_items'],
        'special_instructions': incoming_data['special_instructions']
    }








