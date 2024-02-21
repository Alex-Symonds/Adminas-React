from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('register', views.register, name='register'),
    path('logout', views.logout_view, name='logout'),
    path('document/<int:doc_id>', views.document_main_page, name='doc_main'),
    path('document/<int:doc_id>/pdf', views.document_pdf, name='doc_display'),
    path('document/editor', views.document_editor_page, name='doc_editor_page'),
    path('job/<int:job_id>/manage_modules', views.manage_modules, name='manage_modules'),
    path('job_editor', views.job_editor_page, name='job_editor_page'),
    path('records', views.records, name='records'),
    path('api/comments', views.api_comments, name='api_comments'),
    path('api/data', views.api_data, name='api_data'),
    path('api/document/draft', views.api_draft_documents, name='api_draft_documents'),
    path('api/documents/issued', views.api_issued_documents, name='api_issued_documents'),
    path('api/items', views.api_items, name='api_items'),
    path('api/job', views.api_job, name='api_job'),
    path('api/module_assignments', views.api_module_assignments, name='api_module_assignments'),
    path('api/price_acceptance', views.api_price_acceptance, name='api_price_acceptance'),
    path('api/purchase_order', views.api_purchase_order, name='api_purchase_order'),
    path('api/todo_list', views.api_todo_list, name='api_todo_list'),
    
    ######################################################################################
    # react-router-dom breaks up the Job page into some tabs/subpages
    # If someone clicks a link to a tab, Django should just render the appropriate Job 
    # page and leave the rest to RRD.
    # TODO: I wanted to just have a single "job/<int:job_id>/*" path, where * is a wildcard, 
    # but that syntax isn't a thing. Tried to accomplish it with regex, but that failed too:
    # I suspect using regex messes up processing of the job_id slug
    path('job/<int:job_id>/details-and-po', views.job, name='jobTabDetails'),
    path('job/<int:job_id>/comments', views.job, name='jobTabComments'),
    path('job/<int:job_id>/documents', views.job, name='jobTabDocuments'),
    path('job/<int:job_id>/items', views.job, name='jobTabItems'),
    path('job/<int:job_id>/price-check', views.job, name='jobTabPriceCheck'),
    #####################################################################################
    path('job/<int:job_id>/summary', views.job, name='job'),
]

