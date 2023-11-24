import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "adminas-project.settings")
import django
django.setup()

from adminas.models import DocumentVersion

d = DocumentVersion.objects.get(id=7)
d.issue_date = None
d.save()