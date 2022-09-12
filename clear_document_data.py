import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "adminas-project.settings")
import django
django.setup()

from adminas.models import DocumentData, DocAssignment, DocumentVersion, SpecialInstruction, ProductionData



counts = []
x = DocumentData.objects.all()
x.delete()
counts.append(DocumentData.objects.all().count())

x = DocAssignment.objects.all()
x.delete()
counts.append(DocAssignment.objects.all().count())

x = DocumentVersion.objects.all()
x.delete()
counts.append(DocumentVersion.objects.all().count())

x = SpecialInstruction.objects.all()
x.delete()
counts.append(SpecialInstruction.objects.all().count())

x = ProductionData.objects.all()
x.delete()
counts.append(ProductionData.objects.all().count())

str = f'Counts after: {counts[0]}'

for c in counts[1:]:
    str += f', {c}'

print(str)


