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
    path('job/<int:job_id>', views.job, name='job'),
    path('job/<int:job_id>/manage_modules', views.manage_modules, name='manage_modules'),
    path('job/comments', views.comments_page, name='comments_page'),
    path('job_editor', views.job_editor_page, name='job_editor_page'),
    path('records', views.records, name='records'),
    path('api/comments', views.api_comments, name='api_comments'),
    path('api/data', views.api_data, name='api_data'),
    path('api/document/draft', views.api_draft_documents, name='api_draft_documents'),
    path('api/documents/issued', views.api_issued_documents, name='api_issued_documents'),
    path('api/items', views.api_items, name='api_items'),
    path('api/job', views.api_job, name='api_job'),
    path('api/module_assignments', views.api_module_assignments, name='api_module_assignments'),
    path('api/purchase_order', views.api_purchase_order, name='api_purchase_order'),
    path('api/price_acceptance/<int:job_id>', views.api_price_acceptance, name='api_price_acceptance'),
    path('api/todo_list', views.api_todo_list, name='api_todo_list')
]