from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.db import IntegrityError
from django.urls import reverse
from django.db.models import Sum, Count, Case, When
from django.core.paginator import Paginator
from django.utils import formats

import json
import datetime

# PDF stuff ----------------------------------------------
from wkhtmltopdf.views import PDFTemplateResponse
# --------------------------------------------------------

from adminas.models import  PriceList, User, Job, Address, PurchaseOrder, JobItem, Product, Slot, Price, \
                            JobModule, DocumentData, ProductionData, DocumentVersion, JobComment, Company
from adminas.forms import   DocumentDataForm, JobForm, POForm, JobItemForm, JobItemFormSet, JobItemEditForm, \
                            JobModuleForm, JobItemPriceForm, ProductionReqForm, DocumentVersionForm, JobCommentFullForm
from adminas.constants import DOCUMENT_TYPES, CSS_FORMATTING_FILENAME, HTML_HEADER_FILENAME, HTML_FOOTER_FILENAME, SUPPORTED_CURRENCIES, WO_CARD_CODE
from adminas.util import anonymous_user, error_page, add_jobitem, debug, format_money, get_dict_document_builder, create_document_assignments, create_document_instructions


def login_view(request):
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
    logout(request)
    return HttpResponseRedirect(reverse('index'))


def register(request):
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
    if not request.user.is_authenticated:
        return render(request, 'adminas/index.html')

    user = request.user
    jobs = user.todo_list_jobs.all().order_by('-created_on')

    jobs_list = []
    for j in jobs:
        job = {}
        job['id'] = j.id
        job['name'] = j.name
        job['flag_alt'] = j.country.name
        job['flag_url'] = j.country.flag
        job['customer'] = j.customer.name if j.customer != None else None
        job['agent'] = j.agent.name if j.agent != None else None
        job['currency'] = j.currency
        job['value'] = j.total_value_f()
        job['admin_warnings'] = j.admin_warnings()
        job['pinned_comments'] = j.get_pinned_comments(request.user, '-created_on')
        job['status'] = j.job_status()

        jobs_list.append(job)

    return render(request, 'adminas/index.html', {
        'data': jobs_list
    })


def todo_list_management(request):
    """
        Process changes to the to-do list.
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'message': "You must be logged in to update the to-do list."
        },status=400)   

    posted_data = json.loads(request.body)
    if 'job_id' in posted_data:
        try:
            user = User.objects.get(username=request.user.username)
        except User.DoesNotExist:
            return JsonResponse({
                'message': "Failed to update to-do list."
            }, status=400)

        try:
            job = Job.objects.get(id=posted_data['job_id'])
        except Job.DoesNotExist:
            return JsonResponse({
                'message': "Failed to update to-do list."
            }, status=400)


    if request.method == 'DELETE':
        if job in user.todo_list_jobs.all():
            user.todo_list_jobs.remove(job)
            user.save()
            return JsonResponse({
                'status': 'ok',
                'id': posted_data['job_id']
            }, status=200)

    elif request.method == 'PUT':
        if not job in user.todo_list_jobs.all():
            user.todo_list_jobs.add(job)
            user.save()
            return JsonResponse({
                'status': 'ok'
            }, status=200)

        else:
            return JsonResponse({
                'message': "Failed to update to-do list."
            }, status=400)




def edit_job(request):
    """
        Create/Edit/Delete Job page.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    # Open the edit job page, either blank (creating a new job) or with preset inputs (updating an existing job)
    if request.method == 'GET':
        fallback_get = '-'
        job_id = request.GET.get('job', fallback_get)

        if job_id == fallback_get:
            task_name = 'Create New'
            job_form = JobForm()
            job_id = 0

        else:
            try:
                job = Job.objects.get(id=job_id)
            except:
                return error_page(request, 'Invalid Job.', 400)

            task_name = 'Edit'
            job_form = JobForm(instance=job)
            job_id = job.id

        return render(request, 'adminas/edit.html',{
            'job_form': job_form,
            'task_name': task_name,
            'job_id': job_id
        })


    # Delete the Job
    elif request.method == 'DELETE':
        if request.GET.get('delete_id'):
            try:
                job_to_delete = Job.objects.get(id=request.GET.get('delete_id'))
            except Job.DoesNotExist:
                return JsonResponse({
                    'message': 'Job ID is invalid.'
                }, status=400)

            if job_to_delete.is_safe_to_delete():
                job_to_delete.delete()
                return HttpResponse(status=204)

        return JsonResponse({
            'message': "This Job can't be deleted."
        }, status=400)

        

    # POST = form submission = create or edit a Job
    elif request.method == 'POST':
        posted_form = JobForm(request.POST)

        if posted_form.is_valid():
            job_id = request.POST['job_id']

            if job_id == '0':
                # Create a new job, add it to the creator's todo list and set the ID for the redirect
                new_job = Job(
                    created_by = request.user,
                    name = posted_form.cleaned_data['name'],
                    agent = posted_form.cleaned_data['agent'],
                    customer = posted_form.cleaned_data['customer'],
                    country = posted_form.cleaned_data['country'],
                    language = posted_form.cleaned_data['language'],
                    quote_ref = posted_form.cleaned_data['quote_ref'],
                    currency = posted_form.cleaned_data['currency'],
                    payment_terms = posted_form.cleaned_data['payment_terms'],
                    incoterm_code = posted_form.cleaned_data['incoterm_code'],
                    incoterm_location = posted_form.cleaned_data['incoterm_location'],
                    invoice_to = posted_form.cleaned_data['invoice_to'],
                    delivery_to = posted_form.cleaned_data['delivery_to']
                )

                new_job.save()

                user = User.objects.get(username=request.user.username)
                user.todo_list_jobs.add(new_job)

                redirect_id = new_job.id

            else:
                # Update the job and set the ID for the redirect
                job = Job.objects.get(id=job_id)

                job.created_by = request.user
                job.name = posted_form.cleaned_data['name']
                job.agent = posted_form.cleaned_data['agent']
                job.customer = posted_form.cleaned_data['customer']
                job.country = posted_form.cleaned_data['country']
                job.language = posted_form.cleaned_data['language']
                job.quote_ref = posted_form.cleaned_data['quote_ref']
                job.currency = posted_form.cleaned_data['currency']
                job.payment_terms = posted_form.cleaned_data['payment_terms']
                job.incoterm_code = posted_form.cleaned_data['incoterm_code']
                job.incoterm_location = posted_form.cleaned_data['incoterm_location']
                job.invoice_to = posted_form.cleaned_data['invoice_to']
                job.delivery_to = posted_form.cleaned_data['delivery_to']

                job.save()
                redirect_id = job_id

            return HttpResponseRedirect(reverse('job', kwargs={'job_id': redirect_id}))
        else:
            return error_page(request, 'Invalid form.', 400)

    return render(request, 'adminas/edit.html')


def job(request, job_id):
    """
        "Main" Job page.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    my_job = Job.objects.get(id=job_id)
    item_formset = JobItemFormSet(queryset=JobItem.objects.none(), initial=[{'job':job_id}])
    user_is_watching = my_job.on_todo_list(request.user)

    # Prepare comment dicts
    setting_for_order_by = '-created_on'

    pinned_dict = {}
    pinned_dict['title'] = 'Pinned'
    pinned_dict['class_suffix'] = 'pinned'
    pinned_dict['comments'] = my_job.get_pinned_comments(request.user, setting_for_order_by)

    highlighted_dict = {}
    highlighted_dict['title'] = 'Highlighted'
    highlighted_dict['class_suffix'] = 'highlighted'
    highlighted_dict['comments'] = my_job.get_highlighted_comments(request.user, setting_for_order_by)
    
    comment_data = []
    comment_data.append(pinned_dict)
    comment_data.append(highlighted_dict)

    return render(request, 'adminas/job.html', {
        'job': my_job,
        'po_form': POForm(initial={'job': my_job.id}),
        'item_formset': item_formset,
        'watching': user_is_watching,
        'num_comments': my_job.comments.all().count(),
        'comment_data': comment_data
    })





def get_comment_details(request, need_edit):
    """
    Retrieve a comment based on a GET param "id"
    """
    try:
        comment = JobComment.objects.get(id=request.GET.get('id'))

    except JobComment.DoesNotExist:
        return {
            'error': "Can't find comment.",
            'status': 400
        }
    
    if need_edit and comment.created_by != request.user:
        return {
            'error': "You are not the owner of this comment.",
            'status': 403
        }
    
    return {
        'comment': comment
    }



def get_comment_form_details(request):
    """
    Put request data into a comment form and check validity
    """
    posted_data = json.loads(request.body)
    comment_form = JobCommentFullForm({
        'private': posted_data['private'],
        'contents': posted_data['contents'],
        'pinned': posted_data['pinned'],
        'highlighted': posted_data['highlighted']
    })

    if not comment_form.is_valid():
        debug(comment_form.errors)
        return {
            'error': "Invalid form data.",
            'status': 400
        }

    return {
        'form': comment_form
    }


def update_membership(want_membership, memberlist_includes, member, mtm_list):
    """
    Fix membership of an MTM list, but only if it's wrong
    """
    have_membership = memberlist_includes(member)

    if want_membership and not have_membership:
        mtm_list.add(member)
    elif not want_membership and have_membership:
        mtm_list.remove(member)


def respond_with_error(details):
    """
    JsonResponse based on a dict with "error" and "status"
    """
    # Legacy inconsistency issue: some places expect "message" for error text; some expect "error".
    # Until this is resolved, return both.
    return JsonResponse({
        'message': details['error'],
        'error': details['error']
    }, status = details['status']) 


def get_comment_toggle_details(posted_data):
    """
    Attempt to extract a dict of toggle information (which toggle and desired value) from un-JSONed data
    """
    if 'pinned' in posted_data or 'highlighted' in posted_data:

        if 'pinned' in posted_data:
            result = cleaned_bool_dict(posted_data, 'pinned')
        elif 'highlighted' in posted_data:
            result = cleaned_bool_dict(posted_data, 'highlighted')

        return result

    return {
        'error': 'Invalid request',
        'status': 400
    }

def string_to_bool(str):
    if str.lower() == 'true':
        return True
    elif str.lower() == 'false':
        return False
    return None


def cleaned_bool_dict(data, key):
    """
    Extract a key/value pair from data, where the value is a boolean
    """
    if key in data:
        result = {}

        if isinstance(data[key], bool):
            result[key] = data[key]
            return result

        elif isinstance(data[key], str):
            bool_or_none = string_to_bool(data[key])
            if bool_or_none != None:
                result[key] = bool_or_none
                return result

        result['error'] = 'Invalid request (toggle is not remotely bool-y)'
    else:
        result['error'] = 'Invalid request (toggle key not in data)'
        
    result['status'] = 400
    return result
    
    









def job_comments(request, job_id):
    """
        Job Comments page, plus processing for JobComments.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    # User wants to delete a job comment
    if request.method == 'DELETE':
        comment_details = get_comment_details(request, True)
        if 'error' in comment_details:
            return respond_with_error(comment_details)
        else:
            comment = comment_details['comment']
            comment.delete()
            return HttpResponse(status=204)   

    # User wants to edit an existing job comment
    elif request.method == 'PUT':
        # Check GET parameters in the request to ensure we can get a valid comment from them, then proceed with un-JSONing the data
        comment_details = get_comment_details(request, True)
        if 'error' in comment_details:
            return respond_with_error(comment_details)

        comment = comment_details['comment']
        posted_data = json.loads(request.body)

        # Note: edits come from two places: the comment editor ("full" edits) or icons on a "read-mode" comment ("toggles")
        # Only full edits have a 'contents' key, so use that to distinguish between the two
        if 'contents' in posted_data:
            # Check incoming data against what we expect from a full editor update
            form_details = get_comment_form_details(request)
            if 'error' in form_details:
                return respond_with_error(form_details)

            # Perform full-update-only updates
            comment_form = form_details['form']
            comment.contents = comment_form.cleaned_data['contents']
            comment.private = comment_form.cleaned_data['private']

            # Set desired states for toggle-ables
            want_pinned = comment_form.cleaned_data['pinned']
            want_highlighted = comment_form.cleaned_data['highlighted']
        
        else:
            # Check incoming data against what we expect from a toggle click
            toggle_details = get_comment_toggle_details(posted_data)
            if 'error' in toggle_details:
                return respond_with_error(toggle_details)
            
            # Set desired states for toggle-ables
            want_pinned = comment.is_pinned_by(request.user) if not 'pinned' in toggle_details else toggle_details['pinned']
            want_highlighted = comment.is_highlighted_by(request.user) if not 'highlighted' in toggle_details else toggle_details['highlighted']

        # Regardless of whether this is a toggle or a full update, update the toggle-ables
        update_membership(want_pinned, comment.is_pinned_by, request.user, comment.pinned_by)
        update_membership(want_highlighted, comment.is_highlighted_by, request.user, comment.highlighted_by)

        # Save and report success
        comment.save()
        data = comment.serialise(request.user)  # For Vanilla JS pages, which will use this to populate the edited comment element
        data['ok'] = True   # For React, which just needs the ok to call its setWhatever() hooks
        return JsonResponse(data, status=200)


    # User wants the create  a comment
    elif request.method == 'POST':

        # Stick the data into the form for cleaning and check it's all ok.
        form_details = get_comment_form_details(request)
        if 'error' in form_details:
            return respond_with_error(form_details)

        comment_form = form_details['form']

        # Make sure the Job ID is ok
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return respond_with_error({
                'error': "Can't find Job.",
                'status': 400
            })

        # Create new comment
        comment = JobComment(
            created_by = request.user,
            job = job,
            contents = comment_form.cleaned_data['contents'],
            private = comment_form.cleaned_data['private']
        )
        comment.save()

        want_pinned = comment_form.cleaned_data['pinned']
        if want_pinned:
            comment.pinned_by.add(request.user)

        want_highlighted = comment_form.cleaned_data['highlighted']
        if want_highlighted:
            comment.highlighted_by.add(request.user)

        if want_pinned or want_highlighted:
            comment.save()

        # Respond with all the data needed to display a new comment on the page
        data = comment.serialise(request.user)
        data['job_id'] = job_id
        data['created_on'] = formats.date_format(comment.created_on, "DATETIME_FORMAT")

        return JsonResponse(data, status=200)

    # GET
    # Begin by getting the general purpose info for the heading and subheading.
    my_job = Job.objects.get(id=job_id)
    job = {}
    job['id'] = my_job.id
    job['name'] = my_job.name
    job['flag_alt'] = my_job.country.name
    job['flag_url'] = my_job.country.flag
    job['customer'] = my_job.customer.name if my_job.customer != None else None
    job['agent'] = my_job.agent.name if my_job.agent != None else None
    job['currency'] = my_job.currency
    job['value'] = my_job.total_value_f()

    # Paginate "all comments"
    # (Assumption: users will only pin/highlight a few comments, so pagination won't be needed there)
    # (Assertion: if they pin/highlight a bajillion comments, it's their own fault if they have to scroll a lot)
    setting_for_order_by = '-created_on'

    requested_page_num = request.GET.get('page')
    if(requested_page_num == None):
        requested_page_num = 1
    
    all_comments = my_job.get_all_comments(request.user, setting_for_order_by)
    num_comments_per_page = 10
    if(all_comments != None):
        paginator = Paginator(all_comments, num_comments_per_page)
        requested_page = paginator.page(requested_page_num)
        all_comments = requested_page.object_list
    else:
        all_comments = None
        requested_page = None

    return render(request, 'adminas/job_comments.html', {
        'job': job,
        'pinned': my_job.get_pinned_comments(request.user, setting_for_order_by),
        'highlighted': my_job.get_highlighted_comments(request.user, setting_for_order_by),
        'all_comments': all_comments,
        'page_data': requested_page
    })


def comment_status_toggle(request):
    """
        Process requests to alter the status of a JobComment.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)   

    if request.method == 'POST':
        if 'id' in request.GET:
            comment_id = request.GET.get('id')
        else:
            return JsonResponse({
                'message': "Comment ID not found."
            }, status=400)            

        try:
            comment = JobComment.objects.get(id=comment_id)
        except JobComment.DoesNotExist:
            return JsonResponse({
                'message': "Can't find the comment."
            }, status=400)
        
        user = User.objects.get(username=request.user.username)
        posted_data = json.loads(request.body)

        if 'toggle' == posted_data['task']:
            want_membership = posted_data['toggle_to']

            if 'pinned' == posted_data['mode']:
                have_membership = comment.is_pinned_by(user)

                if want_membership and not have_membership:
                    comment.pinned_by.add(user)
                elif not want_membership and have_membership:
                    comment.pinned_by.remove(user)

            elif 'highlighted' == posted_data['mode']:
                have_membership = comment.is_highlighted_by(user)

                if want_membership and not have_membership:
                    comment.highlighted_by.add(user)
                elif not want_membership and have_membership:
                    comment.highlighted_by.remove(user)                

            return JsonResponse({
                'message': "Invalid task."
            }, status=200) 

        else:
            return JsonResponse({
                'message': "Invalid task."
            }, status=400)            


def price_check(request, job_id):
    """
        Process the Job page's "selling price is {NOT }CONFIRMED" indicator/button
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'PUT':
        try:
            my_job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return JsonResponse({
                'error': 'Job not found'
            }, status=404)

        try:         
            posted_data = json.loads(request.body)
            my_job.price_is_ok = posted_data['new_status']
            my_job.save()
        except:
            return JsonResponse({
                'error': 'Update failed.'
            }, status=400)     

        return JsonResponse({
            'ok': True
        }, status=200)
   

def purchase_order(request):
    """
        Process purchase orders.
    """

    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'DELETE':
        if 'id' in request.GET:
            po_id = request.GET.get('id')

        else:
            return JsonResponse({
                'message': 'Invalid request'
            }, status=400)

        try:
            po_to_delete = PurchaseOrder.objects.get(id=po_id)

            # Deactivate POs rather than deleting them, in case someone needs it as an audit trail
            po_to_delete.active = False
            po_to_delete.save()

            job = po_to_delete.job
            job.price_changed()
            return JsonResponse({
                'ok': True
            }, status=200)
            #return HttpResponseRedirect(reverse('job', kwargs={'job_id': job.pk }))

        except PurchaseOrder.DoesNotExist:
            return JsonResponse({
                'message': 'PO has already been deleted'
            }, status=400)
            #return error_page(request, "Can't find PO.", 400)


    elif request.method == 'POST' or request.method == 'PUT':
        # Create and Update should both submit a JSONed POForm, so handle/check that
        #posted_form = POForm(request.POST)
        incoming_data = json.loads(request.body)
        posted_form = POForm(incoming_data)
        if posted_form.is_valid():


            # Update PO
            if request.method == 'PUT' and request.GET.get('id'):
                po_to_update = PurchaseOrder.objects.get(id=request.GET.get('id'))
                value_has_changed = po_to_update.value != posted_form.cleaned_data['value']
                currency_has_changed = po_to_update.currency != posted_form.cleaned_data['currency']        

                po_to_update.reference = posted_form.cleaned_data['reference']
                po_to_update.date_on_po = posted_form.cleaned_data['date_on_po']
                po_to_update.date_received = posted_form.cleaned_data['date_received']
                po_to_update.currency = posted_form.cleaned_data['currency']
                po_to_update.value = posted_form.cleaned_data['value']
                po_to_update.save()

            # Create PO
            elif request.method == 'POST':

                # Value and currency are considered to have changed, because before there was None and now there is not-None.
                value_has_changed = True
                currency_has_changed = True

                new_po = PurchaseOrder(
                    created_by = request.user,
                    job = posted_form.cleaned_data['job'],
                    reference = posted_form.cleaned_data['reference'],
                    date_on_po = posted_form.cleaned_data['date_on_po'],
                    date_received = posted_form.cleaned_data['date_received'],
                    currency = posted_form.cleaned_data['currency'],
                    value = posted_form.cleaned_data['value']
                )
                new_po.save()

            # If the create or edit means the financial situation has changed, the previous price confirmation is no longer valid
            if value_has_changed or currency_has_changed:
                posted_form.cleaned_data['job'].price_changed()

            return JsonResponse({
                'id': po_to_update.id if request.GET.get('id') else new_po.id
            }, status=200)

        else:
            debug(posted_form.errors)
            return JsonResponse({
                'message': 'PO form was rejected'
            }, status=400)


def items(request):
    """
        Process JobItems.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)
    
    if request.method == 'DELETE':
        ji_id = request.GET.get('id')
        ji = JobItem.objects.get(id=ji_id)

        # Check that this item is not presently assigned as a slot-filler to a modular item.
        new_qty = 0
        if not ji.quantity_is_ok_for_modular_as_child(new_qty):
            return JsonResponse({
                'message': "Delete failed: conflicts with modular item assignments."
            }, status=400)

        if ji.on_issued_document():
            return JsonResponse({
                'message': "Delete failed: conflicts with issued documents."
            }, status=400) 

        ji.job.price_changed()
        ji.delete()
        return JsonResponse({
            'ok': True
        }, status=200)


    # Adding a new item.
    # This can come form two places: the Job page or the ModuleManagement page.
    elif request.method == 'POST':
        # Try processing as a formset with a flexible number of items added at once (i.e. from the multi-item form on the Job page)
        # (Job page is expecting an HTTP response)
        formset = JobItemFormSet(json.loads(request.body))
        if formset.is_valid():
            jobitems = []
            for form in formset:
                new_ji = add_jobitem(request.user, form)
                jobitems.append(new_ji.serialise())
            
            return JsonResponse({
                'ok': True,
                'jobitems': jobitems
            }, status = 200)

        # If that fails, try processing as a non-formset (i.e. from the Module Management page)
        # (ModuleManagement expects a JSON response)
        else:
            try:
                incoming_data = json.loads(request.body)
            
            # If this fails too then idk, the incoming data just ain't right. Try to redirect to the error page while hoping JSON wasn't expected.
            except:
                return JsonResponse({
                    'message': "Invalid data",
                }, status=400)
                #return error_page(request, 'Invalid data.', 400)
            
            # Add a JobItem based on modular info, then return the JobItem ID
            if incoming_data['source_page'] == 'module_management':
                parent = JobItem.objects.get(id=incoming_data['parent'])
                my_product = Product.objects.get(id=incoming_data['product'])
                form = JobItemForm({
                    'job': parent.job,
                    'quantity': incoming_data['quantity'],
                    'product': my_product.id,
                    'price_list': parent.price_list,
                    'selling_price': my_product.get_price(parent.job.currency, parent.price_list)
                })

                if not form.is_valid():
                    return JsonResponse({
                        'message': 'Item form was invalid.'
                    }, status=400)

                ji = add_jobitem(request.user, form)
                parent.job.price_changed()
                
                return JsonResponse({
                    'id': ji.product.id
                }, status=200)
            else:
                return JsonResponse({
                    'message': "Invalid formset",
                }, status=400)


    # Updates can be called from two places:
    #   > JobItem panel (quantity, product, price_list and selling_price)
    #   > Price checker table (selling_price only)
    elif request.method == 'PUT':

        if not request.GET.get('id'):
            return JsonResponse({
                'message': f"Update failed"
            }, status=400)

        ji_id = request.GET.get('id')
        try:
            ji = JobItem.objects.get(id=ji_id)
        except Job.DoesNotExist:
            return JsonResponse({
                'message': f"Job not found."
            }, status=404)                

        # Check for the presence of something other than selling_price to see how much to update.
        # Presence of a field that isn't selling_price means it's a "full" update
        incoming_data = json.loads(request.body)
        if 'product' in incoming_data:
            form = JobItemEditForm(incoming_data)
            if not form.is_valid():
                return JsonResponse({
                    'message': f"Update failed"
                }, status=400)
        
            product_update = get_update_status_dict(form.cleaned_data['product'], ji.product)
            quantity_update = get_update_status_dict(form.cleaned_data['quantity'], ji.quantity)
            selling_price_update = get_update_status_dict(form.cleaned_data['selling_price'], ji.selling_price)
            price_list_update = get_update_status_dict(form.cleaned_data['price_list'], ji.price_list)


            # # Store the original values for the product and quantity so that we can check if they've changed
            # updated_product = form.cleaned_data['product']
            # updated_qty = form.cleaned_data['quantity']
            # updated_selling_price = form.cleaned_data['selling_price']
            # updated_price_list = form.cleaned_data['price_list']

            # # Identify what has changedsw
            # product_has_changed = updated_product != ji.product
            # quantity_has_changed = updated_qty != ji.quantity
            # price_has_changed = updated_selling_price != ji.selling_price
            # price_list_has_changed = updated_price_list != ji.price_list

            # Module assignments relate to products rather than JobItems, so the product matters:
            # if a JobItem had 1 x ProductA and was updated to 1 x ProductB, we need to check if 0 x ProductA 
            # would be acceptable rather than just going "oh, it's still quantity = 1, so that's fine".
            updated_product_quantity = 0 if product_update['has_changed'] else quantity_update['new']

            # Modular items check: Check that the proposed edit wouldn't leave any other items with empty slots
            if not ji.quantity_is_ok_for_modular_as_child(updated_product_quantity):
                return JsonResponse({
                    'message': f"Update failed: conflicts with modular item assignments."
                }, status=400)                             

            # Modular items check: Check that the proposed edit wouldn't leave itself with empty slots
            if ji.product.is_modular() and not product_update['has_changed'] and updated_product_quantity > ji.quantity:
                if not ji.quantity_is_ok_for_modular_as_parent(updated_product_quantity):
                    return JsonResponse({
                        'message': f"Update failed: insufficient items to fill specification."
                    }, status=400)

            # Issued documents check
            # If this item appears on an issued document, nothing can be edited that would affect the issued document.
            num_on_issued = ji.num_required_for_issued_documents()
            if  num_on_issued > 0 and\
                (product_update['has_changed'] or selling_price_update['has_changed'] or quantity_update['new'] < num_on_issued):

                return JsonResponse({
                    'message': f"Update failed: issued documents would be altered."
                }, status=400)


            # The modules are happy (from a backend perspective), so save the changes and perform knock-on updates
            ji.quantity = quantity_update['new']
            ji.product = product_update['new']
            ji.selling_price = selling_price_update['new']
            ji.price_list = price_list_update['new']
            ji.save()
            
            if product_update['has_changed']:
                ji.reset_standard_accessories()

            elif quantity_update['has_changed']:
                ji.update_standard_accessories_quantities()

            ji.job.price_changed()

            # Warn the frontend if this update has had knock-on effects on other fields
            refresh_needed = product_update['has_changed'] or price_list_update['has_changed']

            return JsonResponse({
                'ok': 'true',
                'refresh_needed': refresh_needed
            }, status=200)                        
        
        # If the not-selling_price field isn't there, assume we're only updating the price
        else:
            form = JobItemPriceForm(incoming_data)
            if not form.is_valid():
                return JsonResponse({
                    'message': f"Update failed"
                }, status=400)

            ji.selling_price = form.cleaned_data['selling_price']
            ji.save()
            ji.job.price_changed()

            return JsonResponse({
                'ok': True,
                'reload': 'true'
            }, status=200)  


    # User is fiddling with the product dropdown, so send them the description of the current item
    # in the language chosen for this job.
    elif request.method == 'GET':
        if 'product_id' in request.GET:
            product_id = request.GET.get('product_id')
            job_id = request.GET.get('job_id')
            lang = Job.objects.get(id=job_id).language
            description = Product.objects.get(id=product_id).get_description(lang)

            return JsonResponse({
                'desc': description,
                'ok': True
            }, status=200)

        elif 'ji_id' in request.GET:
            ji_id = request.GET.get('ji_id')

            try:
                ji = JobItem.objects.get(id=ji_id)
            except JobItem.DoesNotExist:
                return JsonResponse({
                    'error': 'JobItem not found'
                }, status=404)

            response_data = ji.serialise()
            response_data['ok'] = True

            return JsonResponse(response_data, status=200)


def get_update_status_dict(new_value, previous_value):
    return {
        'new': new_value,
        'has_changed': new_value != previous_value
    }



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
 
    return render(request, 'adminas/manage_modules.html', {
        'job': job,
        'items': modular_jobitems
    })
    

def module_assignments(request):
    """
        Process Module Assignments
    """

    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'GET':
        data_wanted = request.GET.get('return')

        try:
            parent = JobItem.objects.get(id=request.GET.get('parent'))
        except JobItem.DoesNotExist:
            return JsonResponse({
                'error': "Can't find item."
            }, status=400)            

        try:
            slot = Slot.objects.get(id=request.GET.get('slot'))
        except Slot.DoesNotExist:
            return JsonResponse({
                'error': "Can't find slot."
            }, status=400)               
        
        
        if data_wanted == 'jobitems':
            existing_on_job = slot.fillers_on_job(parent.job)
            prd_list = []
            for product in existing_on_job:
                prd_f = {}
                prd_f['id'] = product.id
                prd_f['quantity_total'] = parent.job.quantity_of_product(product)
                prd_f['quantity_available'] = parent.job.num_unassigned_to_slot(product)
                prd_f['name'] = product.part_number + ': ' + product.name
                prd_list.append(prd_f)

            data_f = {}
            data_f['parent_quantity'] = parent.quantity
            data_f['options'] = prd_list

        elif data_wanted == 'products':
            data_f = []
            for prod in slot.choice_list():
                price_obj = Price.objects.filter(product=prod).filter(price_list=parent.price_list).filter(currency=parent.job.currency)[0]

                pr_f = {}
                pr_f['id'] = prod.id
                pr_f['name'] = prod.part_number + ': ' + prod.name
                pr_f['value'] = price_obj.value
                pr_f['price_f'] = parent.job.currency + ' ' + price_obj.value_f()
                data_f.append(pr_f)
        
            data_f = sorted(data_f, key= lambda pr: pr['value'])
            for d in data_f:
                del d['value']

        return JsonResponse({
            'data': data_f
        }, status=200)


    # user is deleting a module assignment
    elif request.method == 'DELETE':

        if 'id' in request.GET:
            my_id = request.GET.get('id')

        else:
            return JsonResponse({
                'message': 'Invalid request.'
            }, status=400)

        try:
            jm = JobModule.objects.get(id=my_id)
        except:
            return JsonResponse({
                'message': 'Invalid request.'
            }, status=400)

        parent = jm.parent
        slot = jm.slot
        jm.delete()

        return JsonResponse(parent.get_slot_status_dictionary(slot), status=200)

    # User has edited a module (= they changed the quantity, since any other changes are handled via delete-then-recreate)
    elif request.method == 'PUT':
        posted_data = json.loads(request.body)

        # Maybe the user solely entered symbols permitted by 'type=number', but which don't actually result in a number
        # (e.g. e, +, -)
        if posted_data['qty'] == '':
            return JsonResponse({
                'error': 'Invalid quantity.'
            }, status=400)

        # Maybe the new qty is the same as the old qty, so there's nothing to be done
        new_qty = int(posted_data['qty'].strip())
        if int(posted_data['prev_qty']) == new_qty:
            return JsonResponse({
                'message': 'No changes required.'
            }, status=200)

        # Maybe the user entered a new qty of 0 or a negative number
        if new_qty <= 0:
            return JsonResponse({
                'error': 'Edit failed. Quantity must be 1 or more.'
            }, status=400)

        # Ensure valid JobModule ID
        try:
            jm = JobModule.objects.get(id=posted_data['id'])

        except:
            return JsonResponse({
                'error': 'Invalid ID.'
            }, status=400)            

        # Maybe the user entered a qty which exceeds the number of unassigned job items on the order
        num_unassigned = jm.parent.job.num_unassigned_to_slot(jm.child)
        old_qty_total = jm.quantity * jm.parent.quantity
        new_qty_total = new_qty * jm.parent.quantity

        if num_unassigned + old_qty_total < new_qty_total:
            return JsonResponse({
                'message': 'Insufficient unassigned items.',
                'max_qty': num_unassigned
            }, status=400)          

        # Or maybe, just maybe, they entered an actual valid quantity which we can use
        jm.quantity = new_qty
        jm.save()
        return JsonResponse(jm.parent.get_slot_status_dictionary(jm.slot), status=200)

    # User created a new assignment
    elif request.method == 'POST': 
        posted_data = json.loads(request.body)
        posted_form = JobModuleForm(posted_data)

        if not posted_form.is_valid():
            return JsonResponse({
                'message': 'POST data was invalid.'
            }, status=400)

        jm = JobModule(
            parent = posted_form.cleaned_data['parent'],
            child = posted_form.cleaned_data['child'],
            slot = posted_form.cleaned_data['slot'],
            quantity = posted_form.cleaned_data['quantity']
        )

        if jm.parent.job.num_unassigned_to_slot(jm.child) >= jm.parent.quantity * jm.quantity:
            jm.save()
            data_dict = jm.parent.get_slot_status_dictionary(jm.slot)
            data_dict['id'] = jm.id
            return JsonResponse(data_dict, status=201)

        else:
            return JsonResponse({
                'message': 'Not enough items are available.'
            }, status=400)
        








def get_data(request):
    """
        On the Edit Job page, responds to requests to update the automatic address displayed under the address selection dropdowns;
        also populates select dropdowns with options.

    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'GET':
        type_requested = request.GET.get('type')

        if type_requested == 'site_address':
            addr_id = request.GET.get('id')

            try:
                req_addr = Address.objects.get(id=addr_id)
            except:
                return JsonResponse({
                    'error': 'Invalid address ID.'
                }, status=400)
            
            return JsonResponse(req_addr.as_dict(), status=200)

        elif type_requested == 'select_options_list':
            name = request.GET.get('name')

            response_data = {}
            response_data['opt_list'] = []

            if name == 'customers' or name == 'agents':
                if name == 'customers':
                    jobs = Job.objects.values('customer').distinct()

                elif name == 'agents':
                    jobs = Job.objects.values('agent').distinct()

                relevant_companies = Company.objects.filter(id__in=jobs).order_by('name')
                for c in relevant_companies:
                    company_dict = {}
                    company_dict['id'] = c.id
                    company_dict['display_str'] = c.name
                    response_data['opt_list'].append(company_dict)

            elif name == 'price_lists':
                price_lists = PriceList.objects.all().order_by('-valid_from')
                for prl in price_lists:
                    prl_dict = {}
                    prl_dict['id'] = prl.id
                    prl_dict['display_str'] = prl.name
                    response_data['opt_list'].append(prl_dict)

            elif name == 'currencies':
                for currency in SUPPORTED_CURRENCIES:
                    cur_dict = {}
                    cur_dict['id'] = currency[0]
                    cur_dict['display_str'] = currency[1]
                    response_data['opt_list'].append(cur_dict)

            elif name == 'products':
                products = Product.objects.filter(available=True).order_by('part_number')
                for product in products:
                    prod_dict = {}
                    prod_dict['id'] = product.id
                    prod_dict['display_str'] = f'[{product.part_number}] {product.name}'
                    response_data['opt_list'].append(prod_dict)

            return JsonResponse(response_data, status=200)

        elif type_requested == 'urls':
            job_id = request.GET.get('job_id')

            this_job = Job.objects.get(id=job_id)
            response_data = {}
            #response_data['module_management_url'] = reverse('manage_modules', kwargs={'job_id': this_job.id})
            response_data['po_url'] = reverse('purchase_order')
            response_data['price_acceptance_url'] = reverse('price_check', kwargs={'job_id': this_job.id})

            return JsonResponse(response_data, status=200)

        # Packages of data for various React components on the Job page
        elif type_requested == 'page_load':
            name = request.GET.get('name')
            job_id = request.GET.get('job_id')

            this_job = Job.objects.get(id=job_id)
            response_data = {}

            if name == 'heading':
                response_data['names'] = {
                    'job_name': this_job.name,
                    'customer_name': this_job.customer.name
                }

            elif name == 'comments':
                setting_for_order_by = '-created_on'
                response_data['url'] = reverse('job_comments', kwargs={'job_id': job_id})
                response_data['username'] = request.user.username
                response_data['comments'] = this_job.get_all_comments(request.user, setting_for_order_by)

            elif name == 'details':
                response_data['url'] = reverse('edit_job') + '?job=' + job_id
                response_data['name'] = this_job.name
                response_data['agent'] = this_job.agent.name
                response_data['customer'] = this_job.customer.name
                response_data['quote_ref'] = this_job.quote_ref
                response_data['country_name'] = this_job.country.name
                response_data['language'] = this_job.language
                response_data['invoice_to'] = this_job.invoice_to.display_str_newlines()
                response_data['payment_terms'] = this_job.payment_terms
                response_data['delivery_to'] = this_job.delivery_to.display_str_newlines()
                response_data['incoterm_code'] = this_job.incoterm_code
                response_data['incoterm_location'] = this_job.incoterm_location

            elif name == 'documents': 
                doc_list = []
                for doc_version in this_job.related_documents():
                    doc_list.append(doc_version.summary())

                response_data['doc_list'] = doc_list
            
            elif name == 'todo':
                response_data['url'] = reverse('todo_list_management')
                response_data['on_todo'] = this_job.on_todo_list(request.user)

            elif name == 'job_page_root':
                # "Main" contains Job info which can't be altered on the Job page and is used in more than one component.
                response_data['main'] = {
                    'currency': this_job.currency,
                    'doc_quantities': this_job.all_documents_item_quantities(),
                    'URL_MODULE_MANAGEMENT': reverse('manage_modules', kwargs={'job_id': this_job.id})
                }

                # URLs needed by Job component to update state (also JobItems section needs /items for the form)
                response_data['items_url'] = reverse('items')
                response_data['docbuilder_url'] = reverse('doc_builder') + '?job=' + job_id
                
                # Remaining top-level dict fields correspond to a state, since they can be changed on the Job page
                response_data['price_accepted'] = this_job.price_is_ok

                response_data['item_list'] = []
                if this_job.main_item_list() != None:
                    for item in this_job.main_item_list():
                        response_data['item_list'].append(item.serialise())

                response_data['po_list'] = []
                for po in this_job.po.filter(active=True):
                    response_data['po_list'].append(po.serialise())

                response_data['doc_list'] = []
                for doc_version in this_job.related_documents():
                    response_data['doc_list'].append(doc_version.summary())
        
            return JsonResponse(response_data, status=200)

        



def records(request):
    """
        Records page.
    """
    jobs = Job.objects.all().order_by('-created_on')
    total_count = jobs.count()

    if request.GET.get('ref_job'):
        jobs = jobs.filter(name__contains=request.GET.get('ref_job'))

    if request.GET.get('ref_quote'):
        jobs = jobs.filter(name__contains=request.GET.get('ref_quote'))

    if request.GET.get('ref_po'):
        job_ids_with_similar_po_ref = PurchaseOrder.objects.filter(reference__contains=request.GET.get('ref')).values('job')
        jobs = jobs.filter(id__in=job_ids_with_similar_po_ref)

    if request.GET.get('customer'):
        jobs = jobs.filter(customer__id=request.GET.get('customer'))
    
    if request.GET.get('agent'):
        jobs = jobs.filter(agent__id=request.GET.get('agent'))

    if request.GET.get('sdate'):
        jobs = jobs.filter(created_on__gte=request.GET.get('sdate'))

    if request.GET.get('edate'):
        jobs = jobs.filter(created_on__lte=request.GET.get('edate'))

    filter_count = jobs.count()

    num_records_per_page = 20
    paginated = Paginator(jobs, num_records_per_page)

    if request.GET.get('page'):
        req_page_num = request.GET.get('page')
    else:
        req_page_num = 1

    req_page = paginated.page(req_page_num)
    #Sum(Case(When(cost_saving_10th__gt=0, then=F('warranty')), default=0))
    #data = req_page.object_list.annotate(total_po_value=Sum('po__value')).annotate(num_po=Count('po'))
    data = req_page.object_list\
            .annotate(total_po_value=Sum(Case(When(po__active=True, then='po__value')), default=0))\
            .annotate(num_po=Count(Case(When(po__active=True, then='po'), default=0)))

    for j in data:
        j.total_po_value_f = format_money(j.total_po_value)

    return render(request, 'adminas/records.html', {
        'data': data,
        'total_count': total_count,
        'filter_count': filter_count,
        'page_data': req_page
    })



def doc_builder(request):
    """
        Document Builder page.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    # Check GET params and prepare variables relating to the document we want to build
    if request.GET.get('id') != None:
        # Prepare doc variables based on an existing doc_id (used by POST+UPDATE and GET+EXISTING)
        doc_dict = get_dict_document_builder(doc_id=request.GET.get('id'))

    elif request.GET.get('job') != None and request.GET.get('type') != None:
        # Prepare doc variables based on job ID and doc type (used by POST+CREATE and GET+BLANK)
        doc_dict = get_dict_document_builder(job_id=request.GET.get('job'), doc_code=request.GET.get('type'))
    else:
        doc_dict = {}
        doc_dict['error_msg'] = "Invalid GET parameters: can't find document."
        doc_dict['http_code'] = 404

    if 'error_msg' in doc_dict:
        if request.method == 'GET':
            return error_page(request, doc_dict['error_msg'], doc_dict['http_code'])
        else:
            return JsonResponse({
                'message': doc_dict['error_msg']
            }, status=doc_dict['http_code'])

    # Stick doc_obj into a separate variable because it's used a lot
    doc_obj = doc_dict['doc_obj']
    debug(doc_obj)
    if request.method == 'DELETE':
        if doc_obj.issue_date != None:
            return JsonResponse({
                'message': "Forbidden: documents which have been issued cannot be deleted, only replaced with a newer version."
            }, status=400)

        # Deactivate rather than delete so that accidental deletion can be reversed easily
        doc_obj.deactivate()
        doc_obj.save()
        return JsonResponse({
            'redirect': reverse('job', kwargs={'job_id': doc_obj.document.job.id})
        })

    # PUT and POST have similar start-up needs, so let's share
    elif request.method == 'PUT' or request.method == 'POST':
        # Forms common to all doc types.
        incoming_data = json.loads(request.body)
        form = DocumentDataForm({
            'reference': incoming_data['reference']
        })
        version_form = DocumentVersionForm({
            'issue_date': incoming_data['issue_date']
        })

        # Form specific to a certain document type.
        doctype_specific_fields_exist = False
        doctype_specific_fields_are_ok = True
        if 'req_prod_date' in incoming_data:
            doctype_specific_fields_exist = True
            prod_data_form = ProductionReqForm({
                'date_requested': incoming_data['req_prod_date'],
                'date_scheduled': incoming_data['sched_prod_date']
            })
            doctype_specific_fields_are_ok = prod_data_form.is_valid()

        # If the forms aren't valid, stop here
        if not (form.is_valid() and version_form.is_valid() and (not doctype_specific_fields_exist or doctype_specific_fields_are_ok)):
            debug(form.errors)
            debug(version_form.errors)
            debug(prod_data_form.errors)
            return JsonResponse({
                'message': 'Invalid data.'
            }, status=500)  

        # At this point POST or PUT branch off
        response = {}
        if(request.method == 'POST'):
            # Create a new document
            parent_doc = DocumentData(
                reference = form.cleaned_data['reference'],
                doc_type = doc_dict['doc_code'],
                job = doc_dict['job_obj']
            )
            parent_doc.save()

            # Create a new version of a document
            doc_obj = DocumentVersion(
                created_by = request.user,
                document = parent_doc,
                version_number = 1,
                issue_date = version_form.cleaned_data['issue_date'] if 'issue_date' in version_form.cleaned_data else None,
                invoice_to = doc_dict['job_obj'].invoice_to,
                delivery_to = doc_dict['job_obj'].delivery_to
            )
            doc_obj.save()

            # Since it's a new document, all the assigned_items and special_instructions must also be new and therefore require creation.
            new_assignments = incoming_data['assigned_items']
            new_special_instructions = incoming_data['special_instructions']

            # Redirect the user to a page with the doc ID in the GET params so any further work will update the document we just created
            response['redirect'] = f"{reverse('doc_builder')}?id={doc_obj.id}"

        else:
            # Check the document is unissued, just in case the user messed about with the client-side stuff
            if doc_obj.issue_date != None:
                return JsonResponse({
                    'message': "Can't update a document that has already been issued (nice try though)"
                }, status=403)

            # Update the document
            parent = doc_obj.document
            parent.reference = form.cleaned_data['reference']
            parent.doc_type = doc_dict['doc_code']
            parent.job = doc_dict['job_obj']
            parent.save()

            # Update the version with everything except the issue_date
            doc_obj.invoice_to = doc_dict['job_obj'].invoice_to
            doc_obj.delivery_to = doc_dict['job_obj'].delivery_to
            doc_obj.save()

            # Since it's an existing document, updating assigned_items and special_instructions could mean a mixture of creation, 
            # updating and/or deletion.
            # Handle update and delete here. Create is also needed for new documents, so we'll handle that outside of this if statement.
            new_assignments = doc_obj.update_item_assignments_and_get_create_list(incoming_data['assigned_items'])
            new_special_instructions = doc_obj.update_special_instructions_and_get_create_list(incoming_data['special_instructions'])

            # Prevent documents with invalid item assignments from being issued (the issue button is supposed to be greyed out when invalid
            # assignments exist but, y'know, frontend shenanigans...)
            if doc_obj.is_valid():
                doc_obj.issue_date = version_form.cleaned_data['issue_date']
                doc_obj.save()
                response['message'] = 'Document saved'

            elif version_form.cleaned_data['issue_date'] != None:
                response['message'] = 'Document saved, but not issued (invalid item assignments exist)'
            
            # Document validity support
            response['doc_is_valid'] = doc_obj.is_valid()
            response['item_is_valid'] = doc_obj.assignment_validity_by_jiid()

        # Create new assignments and instructions as necessary
        create_document_assignments(new_assignments, doc_obj)
        create_document_instructions(new_special_instructions, doc_obj, request.user)

        # Update/delete document-specific fields. For now, that's only the WO requested date.
        if 'req_prod_date' in incoming_data:
            doc_obj.update_production_dates(prod_data_form)

        # If the document has now been issued, no more "building" is permitted. Save, then exit to doc main.
        if doc_obj.issue_date != None:
            doc_obj.save_issued_state()
            return JsonResponse({
                'redirect': reverse('doc_main', kwargs={'doc_id': doc_obj.id})
            })
        # Otherwise, return "response" dict
        else:
            return JsonResponse(response, status=200)

    # GET response: user could be GETting an existing document or a shiny new blank document
    # Prepare variables for an existing document
    if doc_obj != None:
        included_list = doc_obj.get_included_items()
        excluded_list = doc_obj.get_excluded_items()
        special_instructions = doc_obj.instructions.all().order_by('-created_on')
        version_num = doc_obj.version_number

        # Check for doc_specific fields.
        if doc_obj.document.doc_type == WO_CARD_CODE:
            try:
                doc_specific_obj = ProductionData.objects.filter(version=doc_obj)[0]
            except:
                doc_specific_obj = None

    # Prepare variables for a blank new document
    else:
        included_list = doc_dict['job_obj'].get_items_unassigned_to_doc(doc_dict['doc_code'])
        excluded_list = doc_dict['job_obj'].get_items_assigned_to_doc(doc_dict['doc_code'])
        special_instructions = None
        doc_specific_obj = None
        version_num = 1

    # Pass whichever set of variables to the template
    return render(request, 'adminas/document_builder.html', {
        'doc_title': doc_dict['doc_title'],
        'doc_id': doc_obj.id if doc_obj != None else 0,
        'doc': doc_obj,
        'is_valid': doc_obj.is_valid() if doc_obj != None else True,
        'version_number': version_num,
        'doc_type': doc_dict['doc_code'],
        'reference': doc_dict['doc_ref'],
        'job_id': doc_dict['job_id'],
        'doc_specific': doc_specific_obj,
        'included_items': included_list,
        'excluded_items': excluded_list,
        'special_instructions': special_instructions
    })



def document_pdf(request, doc_id):
    """
        Generates a PDF of a given document and displays it in the browser window.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    my_doc = DocumentVersion.objects.get(id=doc_id)

    if my_doc.issue_date == '' or my_doc.issue_date == None:
        context = my_doc.get_display_data_dict()
    else:
        context = my_doc.get_issued_state()

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

    response = PDFTemplateResponse(request=request,
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
   

def document_main(request, doc_id):
    """
        The read-only Document page.
    """
    if not request.user.is_authenticated:
        return anonymous_user(request)

    if request.method == 'POST':
        posted_data = json.loads(request.body)

        try:
            this_version = DocumentVersion.objects.get(id=doc_id)
        except:
            return JsonResponse({
                'message': "Error: Can't find original document version"
            }, status=500)

        if posted_data['task'] == 'replace':
            try:
                new_version = this_version.get_replacement_version(request.user)
                return JsonResponse({
                    'redirect': f'{reverse("doc_builder")}?id={new_version.pk}'
                })

            except:
                return JsonResponse({
                    'message': 'Replacement failed'
                }, status=500)

        elif posted_data['task'] == 'revert':
            previous_version = this_version.revert_to_previous_version()

            if previous_version == None:
                return JsonResponse({
                    'message': 'Revert version has failed (some items have been assigned to other documents of the same type)'
                }, status=405)

            else:
                # While we're /generally/ deactivating document versions instead of .delete()ing them, it'd be nice if misclicks didn't result in
                # loads of deactivated documents that nobody ever wanted.
                # If the user clicks to revert on the same day as the new version was created, we'll assume it was a misclick.
                if this_version.created_on.date() == datetime.date.today():
                    this_version.delete()

                return JsonResponse({
                    'redirect': reverse('doc_main', kwargs={'doc_id': previous_version.pk})
                }, status=200)

    try:
        doc_obj = DocumentVersion.objects.get(id=doc_id)
    except:
        return error_page(request, "Can't find document.", 400) 

    doc_title = dict(DOCUMENT_TYPES).get(doc_obj.document.doc_type)

    doc_specific_obj = None
    if doc_obj.document.doc_type == WO_CARD_CODE:
        try:
            doc_specific_obj = ProductionData.objects.filter(version=doc_obj)[0]
        except:
            pass

    return render(request, 'adminas/document_main.html', {
        'doc_title': doc_title,
        'doc_id': doc_id,
        'doc_version': doc_obj,
        'doc_specific': doc_specific_obj,
        'special_instructions': doc_obj.instructions.all().order_by('-created_on')
    })
