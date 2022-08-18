# Models for Adminas-React.
# Contents:
#   || Constants
#   || Misc classes
#   || Customers/Agents classes
#   || Products/Prices classes
#   || Modular classes
#   || Case-Specific classes
#      (e.g. POs, Jobs, JobItems, JobComments)
#   || Documents classes

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.deletion import SET_NULL
from django.db.models import Sum
from django.utils import formats
from django.urls import reverse
from django.core.serializers.json import DjangoJSONEncoder

import json

from django_countries.fields import CountryField

from adminas.constants import DOCUMENT_TYPES, KEY_ERROR_MESSAGE, KEY_RESPONSE_CODE, NUM_BODY_ROWS_ON_EMPTY_DOCUMENT, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES, DEFAULT_LANG, INCOTERMS, DOC_CODE_MAX_LENGTH, ERROR_NO_DATA, SUCCESS_CODE
from adminas.util import format_money, get_dict_document_line_item_available, copy_relations_to_new_document_version, debug, update_membership,\
    is_error, create_document_instructions, create_document_assignment, create_document_instructions, error
import datetime

from django.db.models import Q

# || Constants
JOB_NAME_LENGTH = 8 # YYMM-NNN
PART_NUM_LENGTH = 10
DOCS_ONE_LINER = 300 
SYSTEM_NAME_LENGTH = 50
LENGTH_SERIAL_NUMBER = 6
MAX_DIGITS_PRICE = 20
F_PRICE_LENGTH = MAX_DIGITS_PRICE + 1 + (MAX_DIGITS_PRICE / 3) # <- + 1 for the decimal symbol; MAX/3 as a lazy approximation for the thousands separator

COMPANY_NAME_LENGTH = 100
REGION_NAME_LENGTH = 100
PO_NAME_LENGTH = 50
PERSON_NAME_LENGTH = 100

STATUS_CODE_OK = 'status_ok'
STATUS_CODE_ACTION = 'status_action'
STATUS_CODE_ATTN = 'status_attn'

# || Misc classes
class DocAssignment(models.Model):
    """
        Through MTM for line item assignments to documents. 
    """
    version = models.ForeignKey('DocumentVersion', on_delete=models.CASCADE)
    item = models.ForeignKey('JobItem', on_delete=models.CASCADE)
    quantity = models.IntegerField()

    def update(self, new_quantity):
        if int(new_quantity) == self.quantity:
            return

        self.quantity = min(int(new_quantity), self.max_valid_quantity())
        self.save()

    def get_dict(self):
        return {
            'display': self.item.display_str().replace(str(self.item.quantity), str(self.quantity)),
            'doc_id': self.version.id,
            'id': self.pk,
            'is_available': False,
            'is_invalid': not self.quantity_is_valid(),
            'jiid': self.item.pk,
            'used_by': self.version.document.reference
        }

    def max_valid_quantity(self, exclude_drafts = False):
        """
        Get the maximum valid quantity that could be assigned to self.
        """
        assignment_qs = DocAssignment.objects\
                    .filter(item=self.item)\
                    .filter(version__document__doc_type=self.version.document.doc_type)\
                    .filter(version__active=True)\
                    .exclude(id=self.id)

        if exclude_drafts:
            assignment_qs = assignment_qs.exclude(version__issue_date=None)

        if assignment_qs.count() == 0:
            qty_assigned = 0
        else:
            qty_assigned_agg = assignment_qs.aggregate(Sum('quantity'))
            qty_assigned = qty_assigned_agg['quantity__sum']

        return max(self.item.quantity - qty_assigned, 0)


    def quantity_is_valid(self, exclude_drafts = False):
        """
        Check if there are still enough of the JobItem on the Job to cover all the document assignments.
        """
        return self.max_valid_quantity(exclude_drafts) >= self.quantity


    def validated_quantity(self, exclude_drafts = False):
        """
        Get the quantity, excluding invalidly assigned items.
        """
        return min(self.quantity, self.max_valid_quantity(exclude_drafts))


    def __str__(self):
        return f'{self.quantity} x {self.item.product.name} assigned to {self.version.document.doc_type} {self.version.document.reference}'


class User(AbstractUser):
    todo_list_jobs = models.ManyToManyField('Job', related_name='users_monitoring')


class AdminAuditTrail(models.Model):
    created_on = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='%(class)s_added', null=True)

    class Meta:
        abstract = True



# || Customers/Agents classes
class Company(AdminAuditTrail):
    """
        One Company.

        There are incoming FK links from Sites, which in turn have incoming FK links from Addresses.
        In this way a single Company can have multiple locations which can move geographically while 
        causing minimal disruption.
    """
    full_name = models.CharField(max_length=COMPANY_NAME_LENGTH)
    name = models.CharField(max_length=SYSTEM_NAME_LENGTH, blank=True)
    currency = models.CharField(max_length=3, choices=SUPPORTED_CURRENCIES, blank=True)
    is_agent = models.BooleanField(default=False)

    def get_dict(self):
        return {
            'id': self.id,
            'display_str': self.name
        }

    def __str__(self):
        if self.name == '':
            return self.full_name
        return self.name


class Address(AdminAuditTrail):
    """
        One Address, linked to a "Site".
        Note: Address reflects the street location; Site reflects its purpose/function within the Company.

        e.g. the Site record would reflect the concept of "CompanyX's Accounting Office", while 
        the Address reflects the concept of "35 Main Street".
    """
    # The general idea being that users issuing documents are more likely to know they need this 
    # made out to "CompanyX's Accounting Office" rather than a particular geographic location.

    site = models.ForeignKey('Site', on_delete=models.CASCADE, related_name='addresses')
    country = CountryField()
    region = models.CharField(max_length=REGION_NAME_LENGTH)
    postcode = models.CharField(max_length=10, blank=True)
    address = models.TextField()
    contact = models.CharField(max_length=PERSON_NAME_LENGTH, blank=True)

    def display_str_newlines(self):
        return f'{self.address},\n{self.region},\n{self.postcode},\n{self.country.name}'

    def get_dict(self):
        return {
            'address': self.address,
            'region': self.region,
            'postcode': self.postcode,
            'country': self.country.name        
        }


    def __str__(self):
        return f'({self.site.company.name}) {self.site.name} @ {self.created_on - datetime.timedelta(microseconds=self.created_on.microsecond)}'


class Site(AdminAuditTrail):
    """
        One Site, linked to a Company. There are incoming FK links from "Address".
        Note: Address is the street location; Site is its purpose/function within the Company.

        e.g. the Site record would reflect the concept of "CompanyX's Accounting Office", while 
        the Address reflects the concept of "35 Main Street".
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='sites')
    name = models.CharField(max_length=COMPANY_NAME_LENGTH)

    default_invoice = models.BooleanField(default=False)
    default_delivery = models.BooleanField(default=False)

    def current_address(self):
        # If a site has moved around, the database may still contain all their old addresses for record-keeping purposes
        all_addresses = Address.objects.filter(site = self)

        if all_addresses.count() == 0:
            return None

        return Address.objects.filter(site = self).order_by('-created_by')[0]
 
    def __str__(self):
        if self.company.name == '':
            company = self.company.full_name
        else:
            company = self.company.name
        return f'({company}) {self.name}'
















# || Products/Prices classes
class Product(AdminAuditTrail):
    """
        One Product / standard item on sale.
    """

    available = models.BooleanField(default=True)

    name = models.CharField(max_length=SYSTEM_NAME_LENGTH)
    part_number = models.CharField(max_length=PART_NUM_LENGTH) 
    origin_country = CountryField(blank=True)

    # Support for package deals and standard accessories
    includes = models.ManyToManyField('self', through='StandardAccessory')

    # Resale support
    #   resale_category is for "standard" resale discounts (each Product should only be in one category).
    #   special_resale is for when an agent negotiates something different (each Product could appear in multiple categories)
    # System will interpret resale_category = Null as 0% resale discount.
    resale_category = models.ForeignKey('ResaleCategory', on_delete=models.SET_NULL, related_name='members', null=True)
    special_resale = models.ManyToManyField('AgentResaleGroup', related_name='special_deal_products', blank=True)

    def get_price(self, currency, price_list):
        return Price.objects.filter(currency=currency).filter(price_list=price_list).get(product=self).value

    def get_description(self, lang):
        descriptions_qs = self.descriptions.filter(language=lang)

        if descriptions_qs.count() == 0:
            return 'Indescribable'

        return descriptions_qs.order_by('-last_updated')[0].description

    def get_dict(self):
        return {
            'id': self.id,
            'display_str': self.display_str()
        }

    def display_str(self):
        return f'[{self.part_number}] {self.name}'

    # Some products are incomplete in and of themselves: they have empty "slots" which must be filled with selected options.
    def is_modular(self):
        """
            Check for the presence of this Product as a parent in Slots.
        """
        return self.slots.all().count() > 0

    def __str__(self):
        return self.part_number + ': ' + self.name


class StandardAccessory(AdminAuditTrail):
    """
        When Item A is supplied with 2 x Item B at no extra charge, store the link between A, B and 2 right here.
    """
    parent = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    accessory = models.ForeignKey(Product, on_delete=models.SET_NULL, related_name='stdacc_for', null=True)
    quantity = models.IntegerField()

    def __str__(self):
        return f'{self.parent.name} includes {self.quantity} x {self.accessory.name}'


class Description(AdminAuditTrail):
    """
        One-liner document description of a Product, in a given language.
    """
    last_updated = models.DateTimeField(auto_now=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='descriptions')
    language = models.CharField(max_length=2, choices=SUPPORTED_LANGUAGES)
    description = models.CharField(max_length=DOCS_ONE_LINER)

    def __str__(self):
        return f'[{self.language}, {self.product.part_number}] {self.product.name}, {self.last_updated - datetime.timedelta(microseconds=self.last_updated.microsecond)}'


class ResaleCategory(AdminAuditTrail):
    """ 
        Standard resale discount rates by category 
    """
    name = models.CharField(max_length=SYSTEM_NAME_LENGTH)
    resale_perc = models.FloatField()

    def __str__(self):
        return self.name


class AgentResaleGroup(AdminAuditTrail):
    """ 
        Agent-specific resale discount group 
    """
    agent = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='resale_prices')
    name = models.CharField(max_length=SYSTEM_NAME_LENGTH)
    percentage = models.FloatField()

    def __str__(self):
        return f'{self.agent}, {self.percentage} on {self.name}%'


class PriceList(AdminAuditTrail):
    """
        Name for a PriceList. Incoming FK from Prices.
    """
    valid_from = models.DateField()
    name = models.CharField(max_length=SYSTEM_NAME_LENGTH)

    def get_dict(self):
        return {
            'id': self.id,
            'display_str': self.name
        }

    def __str__(self):
        return self.name


class Price(models.Model):
    """
        PriceList line item. Store the link between the product, the numerical value, which currency that is and which 
        price list it belongs to.
    """
    price_list = models.ForeignKey(PriceList, on_delete=models.CASCADE, related_name = 'prices')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='list_prices')
    currency = models.CharField(max_length=3, choices=SUPPORTED_CURRENCIES)
    value = models.DecimalField(max_digits=MAX_DIGITS_PRICE, decimal_places=2)

    def value_f(self):
        return format_money(self.value)

    def __str__(self):
        return f'{self.price_list.name} {self.product.name} @ {self.currency} {self.value}'




















# || Modular classes
class SlotChoiceList(models.Model):
    """
        Set of Products suitable for filling a Slot.
    """
    name = models.CharField(max_length=SYSTEM_NAME_LENGTH)
    choices = models.ManyToManyField(Product, related_name='in_slot_lists')

    def __str__(self):
        return self.name

class Slot(models.Model):
    """
        Describes an "empty spot" in a Product, which can/must be filled by another Product.

        e.g. Suppose the Product is hollow chocolate egg with space for 1 - 4 little toys inside (0 toys is forbidden
        for business reasons). "Toy-filled Chocolate Egg" would be the parent; the name might be something like "Toys Inside";
        required would be 1; optional would be 3; choice_group would be whichever "Choice Group" record reflects a list of all the suitable little toys.
    """
    parent = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='slots')
    name = models.CharField(max_length=SYSTEM_NAME_LENGTH)

    quantity_required = models.IntegerField()
    quantity_optional = models.IntegerField()
    choice_group = models.ForeignKey(SlotChoiceList, on_delete=SET_NULL, related_name='used_by', null=True)

    def choice_list(self):
        """
            List of valid slot fillers.
        """
        return self.choice_group.choices.all()


    def get_dict_choice_list(self, price_list, currency):
        """
            List of valid slot filler dicts, with price info.
        """
        result = []
        for prod in self.choice_list():
            price_obj = Price.objects.filter(product=prod).filter(price_list=price_list).filter(currency=currency)[0]

            # Create a dict, including a field for sorting purposes
            choice_dict = {}
            choice_dict['id'] = prod.id
            choice_dict['name'] = prod.part_number + ': ' + prod.name
            choice_dict['price_f'] = currency + ' ' + price_obj.value_f()
            choice_dict['sort_by'] = price_obj.value
            result.append(choice_dict)
    
        # Sort it, then get rid of the otherwise unnecessary "sort_by" field
        result = sorted(result, key = lambda pr: pr['sort_by'])
        for d in result:
            del d['sort_by']
        
        return result


    def __str__(self):
        return f'[{self.quantity_required} REQ, {self.quantity_optional} opt] {self.name} for {self.parent.name}'












# || Case-Specific classes
class PurchaseOrder(AdminAuditTrail):
    """
        Data as it appeared on the customer's PO.
    """
    job = models.ForeignKey('Job', on_delete=models.CASCADE, related_name='po')
    reference = models.CharField(max_length=PO_NAME_LENGTH)
    date_on_po = models.DateField()
    date_received = models.DateField()
    currency = models.CharField(max_length=3, choices=SUPPORTED_CURRENCIES)
    value = models.DecimalField(max_digits=MAX_DIGITS_PRICE, decimal_places=2)

    # PO records are not deleted (for audit trail reasons); instead they are deactivated
    active = models.BooleanField(default=True)

    def get_dict(self):
        result = {}
        result['reference'] = self.reference
        result['date_on_po'] = self.date_on_po
        result['value'] = self.value
        result['date_received'] = self.date_received
        result['po_id'] = self.id
        result['currency'] = self.currency
        return result

    def update(self, posted_form):
        """
        Update purchase order using a form
        """
        # Check for relevant changes
        value_has_changed = self.value != posted_form.cleaned_data['value']
        currency_has_changed = self.currency != posted_form.cleaned_data['currency']   

        # Perform update
        self.reference = posted_form.cleaned_data['reference']
        self.date_on_po = posted_form.cleaned_data['date_on_po']
        self.date_received = posted_form.cleaned_data['date_received']
        self.currency = posted_form.cleaned_data['currency']
        self.value = posted_form.cleaned_data['value']

        # Handle knock-on effects
        if value_has_changed or currency_has_changed:
            self.job.price_changed()

        self.save()

    def deactivate(self):
        self.active = False
        self.save()
        self.job.price_changed()

    def __str__(self):
        return f'{self.reference} from {self.job.invoice_to.site.company.name}'


class Job(AdminAuditTrail):
    """
     Reflects the concept of "one work thing we must enter into the system".
    """
    name = models.CharField(max_length=JOB_NAME_LENGTH)
    agent = models.ForeignKey(Company, on_delete=models.PROTECT, related_name='jobs_sold',  blank=True, null=True)
    customer = models.ForeignKey(Company, on_delete=models.PROTECT, related_name='jobs_ordered', blank=True, null=True)

    country = CountryField()
    language = models.CharField(max_length=2, choices=SUPPORTED_LANGUAGES, default=DEFAULT_LANG)

    invoice_to = models.ForeignKey(Address, on_delete=models.PROTECT, related_name='jobs_invoiced')
    delivery_to = models.ForeignKey(Address, on_delete=models.PROTECT, related_name='jobs_delivered')
    
    currency = models.CharField(max_length=3, choices=SUPPORTED_CURRENCIES)
    quote_ref = models.CharField(max_length=SYSTEM_NAME_LENGTH)
    payment_terms = models.TextField()
    
    incoterm_code = models.CharField(max_length=3, choices=INCOTERMS)
    incoterm_location = models.CharField(max_length=30)

    price_is_ok = models.BooleanField(default=False)

    # Contents:
    #   || Job.Misc
    #   || Job.Modular
    #   || Job.Comments
    #   || Job.Status
    #   || Job.Financial
    #   || Job.RelevantRelated
    #   || Job.Documents

    # || Job.Misc
    def get_dict(self):
        """
        General purpose dict of (most) fields
        """
        result = {}
        result['agent'] = self.agent.name if self.agent != None else None
        result['country_name'] = self.country.name
        result['customer'] = self.customer.name if self.agent != None else None
        result['delivery_to'] = self.delivery_to.display_str_newlines()
        result['id'] = self.id
        result['incoterm_code'] = self.incoterm_code
        result['incoterm_location'] = self.incoterm_location
        result['invoice_to'] = self.invoice_to.display_str_newlines()
        result['language'] = self.language
        result['name'] = self.name
        result['payment_terms'] = self.payment_terms
        result['quote_ref'] = self.quote_ref
        
        return result


    def update(self, jobform, user):
        """
        Update Job via JobForm
        """
        self.created_by = user
        self.name = jobform.cleaned_data['name']
        self.agent = jobform.cleaned_data['agent']
        self.customer = jobform.cleaned_data['customer']
        self.country = jobform.cleaned_data['country']
        self.language = jobform.cleaned_data['language']
        self.quote_ref = jobform.cleaned_data['quote_ref']
        self.currency = jobform.cleaned_data['currency']
        self.payment_terms = jobform.cleaned_data['payment_terms']
        self.incoterm_code = jobform.cleaned_data['incoterm_code']
        self.incoterm_location = jobform.cleaned_data['incoterm_location']
        self.invoice_to = jobform.cleaned_data['invoice_to']
        self.delivery_to = jobform.cleaned_data['delivery_to']
        self.save()


    def safe_to_delete(self):
        """
            Determine if this Job can be safely deleted or if it's passed the point of no return (from an administrative perspective).
        """
        # Condition #1: Job must not have any issued documents (since we want to keep a record of all documents that have been issued)
        docs = DocumentVersion.objects.filter(document__job=self)
        for d in docs:
            if d.issue_date != None and d.issue_date != '':
                return False

        # Condition #2: Job must not have any active POs (POs have accounting implications, so they must be "deactivated" first)
        porders = PurchaseOrder.objects.filter(job=self).filter(active=True)
        if porders.count() > 0:
            return False

        return True


    def on_todo_list(self, user):
        """
            To-do list. Check if this Job is on the todo list for the specified User
        """
        return self in user.todo_list_jobs.all()

    ## || Job.Modular
    def fillers_for_slot(self, slot):
        """
            List of Products on this Job which are suitable for filling the given Slot.
        """
        result = []
        for product in slot.choice_list():
            product_count = self.quantity_of_product(product)
            if product_count > 0:
                result.append(product)
    
        return result

    def get_dict_slot_fillers(self, slot):
        """
            List of dicts for Products on this Job which are suitable for filling the given Slot.
        """
        prd_list = []
        for product in self.fillers_for_slot(slot):
            prd_f = {}
            prd_f['id'] = product.id
            prd_f['name'] = product.part_number + ': ' + product.name
            prd_f['quantity_available'] = self.num_unassigned_to_slot(product)
            prd_f['quantity_total'] = self.quantity_of_product(product)
            prd_list.append(prd_f)
        return prd_list

    def quantity_of_product(self, product):
        """
            Modular item support. Count how many of a given Product exists on the Job. (It could be split across multiple line items.)
            Note: excludes standard accessories from the count because standard accessories are considered "part" of the parent item.
        """
        instances_of_product = JobItem.objects.filter(job=self).filter(product=product).filter(included_with = None)
        if instances_of_product.count() == 0:
            return 0
        return instances_of_product.aggregate(Sum('quantity'))['quantity__sum']


    def num_unassigned_to_slot(self, product):
        """
            Modular item support (children). How many are still available to be assigned to other slots?
        """
        job_qty = self.quantity_of_product(product)
        assignments = JobModule.objects.filter(parent__job=self).filter(child=product)
        if assignments.count() == 0:
            return job_qty

        a_qty = 0
        for assignment in assignments:
            a_qty += assignment.quantity * assignment.parent.quantity

        return job_qty - a_qty


    def modular_items_incomplete(self):
        """
            Modular item support. Check if any modular items on the Job have any empty "required" slots
        """
        main_items = self.main_item_list()
        if main_items == None:
            return False
    
        for ji in main_items:
            if not ji.item_is_complete():
                return True
        return False

    # || Job.Comments
    def get_all_comments(self, user, setting_for_order_by):
        """
            Comment support. Get all comments the user is entitled to see, regardless of pinned/highlighted status
        """
        all_comments = JobComment.objects.filter(job=self).filter(Q(created_by=user) | Q(private=False)).order_by(setting_for_order_by)
        result = []
        for c in all_comments:
            comm = c.get_dict(user)
            comm['created_on'] = formats.date_format(comm['created_on'], "DATETIME_FORMAT")
            result.append(comm)

        if(len(result) == 0):
            return None

        return result


    def get_pinned_comments(self, user, setting_for_order_by):
        """
            Comment support. Get all comments "pinned" by this User
        """
        all_comments = JobComment.objects.filter(job=self).filter(Q(created_by=user) | Q(private=False)).order_by(setting_for_order_by)
        result = []
        for c in all_comments:
            if c.is_pinned_by(user):
                result.append(c.get_dict(user))

        if(len(result) == 0):
            return None

        return result


    def get_highlighted_comments(self, user, setting_for_order_by):
        """
            Comment support. Get all comments "highlighted" by this User
        """
        all_comments = JobComment.objects.filter(job=self).filter(Q(created_by=user) | Q(private=False)).order_by(setting_for_order_by)
        result = []
        for c in all_comments:
            if c.is_highlighted_by(user):
                result.append(c.get_dict(user))

        if(len(result) == 0):
            return None

        return result        


    # || Job.Status
    def job_status(self):
        """
            List of status codes and brief messages for this job.
        """
        result = []
        result.append(self.status_price())
        result += self.status_items()
        result.append(self.status_po())
        
        for loop_tuple in DOCUMENT_TYPES:
            doc_type = loop_tuple[0]
            result.append(self.status_doc(doc_type))
            if self.has_invalid_documents(doc_type):
                result.append((STATUS_CODE_ACTION, f"Invalid {doc_type}"))
   
        return result


    def status_price(self):
        """
            Status strip on Job page. Status for price authorisation.
        """
        if not self.price_is_ok:
            return (STATUS_CODE_ACTION, 'Price not accepted')
        return (STATUS_CODE_OK, 'Price accepted')


    def status_po(self):
        """
            Status strip on Job page. Status of POs.
        """
        qs = self.related_po()       
        if qs.count() == 0:
            return (STATUS_CODE_ACTION, 'PO missing')
        elif self.has_invalid_currency_po():
            return (STATUS_CODE_ACTION, 'PO currency mismatch')
        elif self.total_difference_value_po_vs_line() != 0:
            return (STATUS_CODE_ACTION, 'PO discrepancy')
        return (STATUS_CODE_OK, 'PO ok')


    def status_items(self):
        """
            Status strip on Job page. Statuses related to items and specifications.
        """
        if self.items.count() == 0:
            return [(STATUS_CODE_ACTION, 'Has no items')]

        result = []
        if self.has_special_modular():
           result.append((STATUS_CODE_ATTN, 'Special item/s'))

        if self.modular_items_incomplete():
            result.append((STATUS_CODE_ACTION, 'Item/s incomplete'))
        else:
            result.append((STATUS_CODE_OK, 'Items ok'))
        
        return result


    def status_doc(self, doc_type):
        """
            Status strip on Job page. Statuses for documents.
        """
        qty_on_job = sum(mi.quantity for mi in self.main_item_list()) if self.main_item_list() != None else None
        if not qty_on_job == None:
            qty_on_issued = self.document_item_quantities(doc_type, True)
            qty_on_draft = self.document_item_quantities(doc_type, False)

            if qty_on_job == qty_on_issued:
                return (STATUS_CODE_OK, f'{doc_type} ok')
            
            if qty_on_job == qty_on_issued + qty_on_draft:
                return (STATUS_CODE_ACTION, f'{doc_type} pending')

        return (STATUS_CODE_ACTION, f'{doc_type} needed')



    def has_special_modular(self):
        """
            Determine if the Job contains any "special" items.
        """
        for ji in self.main_item_list():
            if ji.excess_modules_assigned():
                return True
        return False


    def unissued_documents_exist(self, doc_type):
        """
            Check the Job for for unissued documents of a specific type.
        """
        try:
            qs = self.related_documents()
            dvs = qs.filter(document__doc_type=doc_type)
        except DocumentVersion.DoesNotExist:
            return False

        return dvs.filter(issue_date = None).count() > 0


    def all_documents_item_quantities(self):
        """
            List with an entry for each doc_type, reporting the quantity of items on issued and draft documents of that type.
            e.g. [
                    {doc_type: WO, qty_on_issued: 1, qty_on_draft: 4},
                    {doc_type: OC, qty_on_issued: 0, qty_on_draft: 1}
                ]
            Note: this is summing the quantities expressed in the line items, not counting the number of line items.
            e.g. a document with 1 line item showing quantity=100 would count as 100, rather than 1.
        """
        # This was added to enable the Job status for documents (i.e. "ok", "pending", "missing").
        # Some of these statuses are defined by a comparison between the quantity of items appearing on issued/draft documents
        # versus the quantity existing on the Job as a whole.
        # We need to consider quantity rather than count() because if a Job has a single JobItem with qty=100 and a user 
        # assigns qty=1 to an issued document, we want that to come up as "99 more to go", not 
        # "1 x JobItem on the Job; 1 x JobItem on an issued document: we're done".

        result = []
        for loop_tuple in DOCUMENT_TYPES:
            doc_type = loop_tuple[0]
            doc_quantities = {}
            doc_quantities['doc_type'] = doc_type
            doc_quantities['qty_on_issued'] = self.document_item_quantities(doc_type, True)
            doc_quantities['qty_on_draft'] = self.document_item_quantities(doc_type, False)
            result.append(doc_quantities)
            
        return result


    def document_item_quantities(self, doc_type, want_issued):
        """
            Sum the quantity of items appearing on documents related to this Job, specifying:
                doc_type        (e.g. WO, OC)
                want_issued     (True = only sum issued documents; False = only sum draft)
        """
        doc_versions = self.related_documents().filter(document__doc_type=doc_type)
        if doc_versions == None or doc_versions.count() == 0:
            return 0

        result = 0
        for docv in doc_versions:
            if docv.issue_date == None and not want_issued:
                result += docv.quantity_of_items()

            elif not docv.issue_date == None and want_issued:
                result += docv.quantity_of_items()

        return result


    def has_invalid_documents(self, doc_type = None):
        doc_versions = self.related_documents()
        if not doc_versions == None and not doc_type == None:
            doc_versions = doc_versions.filter(document__doc_type=doc_type)
    
        if doc_versions == None or doc_versions.count() == 0:
            return False

        for dv in doc_versions:
            if not dv.is_valid():
                return True
        return False


    # || Job.Financial
    def price_changed(self):
        """
            Make any necessary adjustments when something just happened that could impact the overall price of the Job.
        """
        if self.price_is_ok:
            self.price_is_ok = False
            self.save()

    def has_invalid_currency_po(self):
        """
            Check if any POs assigned to this Job are in a different currency.
        """
        for po in self.related_po():
            if not po.currency == self.currency:
                return True
        return False

    def total_value(self):
        """
            Get the total value for this Job.
        """
        # This should be whatever is going to be considered the "default" value for the order
        return self.total_po_value()

    def total_list_price(self):
        """
            Get the total list price for this Job.
        """
        try:
            return sum([item.list_price() for item in self.items.filter(included_with=None)])
        except:
            return 0

    def total_line_value(self):
        """
            Get the total JobItem / line item sum for this Job.
        """
        order_value = self.items.aggregate(order_value=Sum('selling_price'))['order_value']
        if order_value == None:
            return 0
        else:
            return order_value

    def total_po_value(self):
        """
            Get the total PO sum for this Job. POs with the 'wrong' currency are excluded.
        """
        relevant_pos = self.po.filter(active=True).filter(currency=self.currency)
        if relevant_pos.count() > 0:
            return sum([po.value for po in relevant_pos])
        return 0

    def total_difference_value_po_vs_line(self):
        """
            Get the difference between the Job's line item sum and the PO sum.
        """
        return self.total_po_value() - self.total_line_value()


    # || Job.RelevantRelated
    def main_item_list(self):
        """
            List of only the JobItems which were entered by the user (i.e. excluding automatically added stdAccs)
        """
        item_list = JobItem.objects.filter(job=self).filter(included_with=None)
        if item_list.count() == 0:
            return None
        return item_list

    def related_documents(self):
        """
            List of documents related to this order
        """
        qs = DocumentVersion.objects.filter(document__job=self).filter(active=True)
        return qs.order_by('issue_date').order_by('document__doc_type')

    def related_po(self):
        """
            List of POs related to this order
        """
        return PurchaseOrder.objects.filter(job=self).filter(active=True).order_by('date_received')


    ## || Job.Documents
    def get_items_unassigned_to_doc(self, doc_type):
        """
            Get a list of JobItem quantities on this Job which have not yet been assigned to a document of the given type.
        """
        jobitems = self.main_item_list()

        if jobitems == None or jobitems.count() == 0:
            return None

        else:
            result = []
            for poss_item in jobitems:
                qty = poss_item.quantity

                assignments = DocAssignment.objects.filter(item=poss_item).filter(version__document__doc_type=doc_type).filter(version__active=True)
                for assignment in assignments:
                    qty = qty - assignment.quantity

                if qty > 0:
                    result.append(get_dict_document_line_item_available(poss_item, qty))    


            if len(result) == 0:
                return None
            else:
                return result


    def get_items_assigned_to_doc(self, doc_type):
        """
            Get a list of JobItems on this Job which have already been assigned to a document of the given type.
        """        
        assigned_elsewhere = DocAssignment.objects\
                            .filter(version__document__job=self)\
                            .filter(version__document__doc_type=doc_type)\
                            .filter(version__active=True)\

        if assigned_elsewhere.all().count() == 0:
            return None

        result = []
        for ae in assigned_elsewhere.all():
            result.append(ae.get_dict())                
        return result

    def __str__(self):
        return f'{self.name} {self.created_on}'








class JobComment(AdminAuditTrail):
    """
        A User's comment regarding a Job. Comments can be "private", "pinned" and/or "highlighted". 
        
        The distinction between "pinned" and "highlighted" is:
            >> "pinned" determines which comments can appear "on the outside" (i.e. pages with 
                information about multiple Jobs might display pinned comments).
            >> "highlighted" emphasises a comment, in a manner appropriate for the current page.
    """

    contents = models.TextField()
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='comments')
    private = models.BooleanField(default=True)
    pinned_by = models.ManyToManyField(User, related_name='pinned_comments')
    highlighted_by = models.ManyToManyField(User, related_name='highlighted_comments')

    def is_highlighted_by(self, user):
        return user in self.highlighted_by.all()

    def is_pinned_by(self, user):
        return user in self.pinned_by.all()

    def get_dict(self, user):
        result = {}
        result['id'] = self.id
        result['user_is_owner'] = self.created_by == user
        result['created_by'] = self.created_by.username if self.created_by != user else 'You'
        result['created_on'] = self.created_on
        result['contents'] = self.contents
        result['private'] = self.private
        result['highlighted'] = self.is_highlighted_by(user)
        result['pinned'] = self.is_pinned_by(user)

        return result

    def update(self, form, user):
        """
        Update comment based on a form.
        """
        self.contents = form.cleaned_data['contents']
        self.private = form.cleaned_data['private']

        want_pinned = form.cleaned_data['pinned']
        want_highlighted = form.cleaned_data['highlighted']
        update_membership(want_pinned, self.is_pinned_by, user, self.pinned_by)
        update_membership(want_highlighted, self.is_highlighted_by, user, self.highlighted_by)
        self.save()

    def update_toggles(self, toggle_details, user):
        want_pinned = toggle_details['pinned'] if 'pinned' in toggle_details else self.is_pinned_by(user) 
        want_highlighted = toggle_details['highlighted'] if 'highlighted' in toggle_details else self.is_highlighted_by(user)  
        update_membership(want_pinned, self.is_pinned_by, user, self.pinned_by)
        update_membership(want_highlighted, self.is_highlighted_by, user, self.highlighted_by)
        self.save()

    def __str__(self):
        return f'{self.created_by} on Job {self.job.name} @ {self.created_on}: "{self.contents[:15]}..."'









class JobItem(AdminAuditTrail):
    """
        One product on a Job.
    """
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='items')

    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True)
    price_list = models.ForeignKey(PriceList, on_delete=models.PROTECT, null=True)
    quantity = models.IntegerField(blank=True)
    selling_price = models.DecimalField(max_digits=MAX_DIGITS_PRICE, decimal_places=2)

    # Support for "nested" Products. e.g. suppose a Pez dispenser includes one "free" packet of Pez; you also sell additional packets of Pez separately;
    # customer has ordered one dispenser and 3 spare packets. Result = two JobItem records for Pez packets: one to cover the packet included 
    # with the dispenser ("included_with" would refer to the JobItem for the dispenser) and one to cover the three spares ("included_with" would be blank).
    included_with = models.ForeignKey('self', on_delete=models.CASCADE, related_name='includes', null=True, blank=True)

    # Method contents:
    #   || JobItem.Read
    #   || JobItem.Update
    #   || JobItem.Documents
    #   || JobItem.Financial
    #   || JobItem.StandardAccessories
    #   || JobItem.Modular

    # || JobItem.Read
    def get_dict(self):
        result = {}

        result['ji_id'] = self.id
        result['product_id'] = self.product.id
        result['part_number'] = self.product.part_number
        result['product_name'] = self.product.name
        result['description'] = self.product.get_description(self.job.language)

        result['quantity'] = self.quantity
        result['selling_price'] = self.selling_price
        result['list_price_each'] = Price.objects.filter(currency=self.job.currency).filter(price_list=self.price_list).get(product=self.product).value
        result['resale_perc'] = self.resale_percentage()

        result['price_list_id'] = self.price_list.id
        result['price_list_name'] = self.price_list.name

        result['standard_accessories'] = []
        for std_acc in self.includes.all():
            sa_dict = {}
            sa_dict['quantity'] = std_acc.quantity
            sa_dict['part_number'] = std_acc.product.part_number
            sa_dict['product_name'] = std_acc.product.name
            result['standard_accessories'].append(sa_dict)

        result['is_modular'] = self.product.is_modular()
        result['is_complete'] = self.item_is_complete()
        result['excess_modules'] = self.excess_modules_assigned()

        result['module_list'] = []
        for jm in self.modules.all():
            jm_dict = {}
            jm_dict['module_id'] = jm.id
            jm_dict['product_id'] = jm.child.id
            jm_dict['quantity'] = jm.quantity
            jm_dict['name'] = jm.child.name
            result['module_list'].append(jm_dict)

        return result


    def display_str(self):
        """
            The "main" description to appear on documents and the webpage.
        """
        return f'{self.quantity} x [{self.product.part_number}] {self.product.name}'


    def display_str_with_money(self):
        """
            Variation on the "main" description to appear on documents and the webpage.
            Adds money information at the end.
        """
        # Used on the Records template
        return f'{self.display_str()} @ {self.job.currency}&nbsp;{self.selling_price_f()}'
 

    # || JobItem.Update
    def safe_to_delete(self):
        """
        Checks possible reasons to forbid the deletion of a JobItem.
        """
        if not self.quantity_is_ok_for_modular_as_child(0):
            return error('Forbidden: conflicts with modular item assignments.', 403)
        
        if self.on_issued_document():
            return error('Forbidden: conflicts with issued documents.', 403)
        
        return True

    def safe_to_update(self, form):
        # Update is forbidden if it'd result in there not being enough slot filler products on the job to
        # fulfill all the existing module assignments. This can occur in two ways:
        #   1) Decreasing the quantity of a slot filling product (or changing the product, which is 
        #      equivalent to decreasing the quantity of the old product to 0)
        #   2) Increasing the quantity of modular items with existing slot assignments
        product_has_changed = form.cleaned_data['product'] != self.product
        new_quantity = form.cleaned_data['quantity']
        quantity_current_product = 0 if product_has_changed else new_quantity

        if not self.quantity_is_ok_for_modular_as_child(quantity_current_product):
            return error("Update failed: conflicts with modular item assignments.", 403)

        if not product_has_changed and quantity_current_product > self.quantity and self.product.is_modular():
            if not self.quantity_is_ok_for_modular_as_parent(quantity_current_product):
                return error("Update failed: insufficient items to fill specification.", 403)

        # Update is forbidden if it'd alter any field which appears on an issued documents
        selling_price_has_changed = form.cleaned_data['selling_price'] != self.selling_price
        num_on_issued = self.num_required_for_issued_documents()
        if  num_on_issued > 0 and\
            (product_has_changed or selling_price_has_changed or new_quantity < num_on_issued):
            return error("Update failed: issued documents would be altered.", 403)

        return True


    def update(self, form):
        """
        Update JobItem based on a form.
        """
        check = self.safe_to_update(form)
        if not check == True:
            return check
    
        product_has_changed = self.product != form.cleaned_data['product']
        quantity_has_changed = self.quantity != form.cleaned_data['quantity']
        price_list_has_changed = self.price_list != form.cleaned_data['price_list']

        self.quantity = form.cleaned_data['quantity']
        self.product = form.cleaned_data['product']
        self.selling_price = form.cleaned_data['selling_price']
        self.price_list = form.cleaned_data['price_list']
        self.save()

        self.job.price_changed()
        
        if product_has_changed:
            self.reset_standard_accessories()

        elif quantity_has_changed or price_list_has_changed:
            self.update_standard_accessories()

        


    def update_price(self, form):
        """
        Update selling price of a JobItem from a form
        """
        self.selling_price = form.cleaned_data['selling_price']
        self.save()
        self.job.price_changed()


    # || JobItem.Documents
    def on_issued_document(self):
        """
            Check if this JobItem appears on a document which has been issued.
        """
        return DocAssignment.objects.filter(item=self).filter(version__active=True).count() > 0


    def num_required_for_issued_documents(self):
        """
            Quantity required to fulfill all assignments to issued documents.
        """
        doc_assignments = DocAssignment.objects.filter(item=self).filter(version__active=True)
        if doc_assignments == None:
            return 0

        # It is expected that each JobItem unit will appear once on each doc_type, so if there
        # are 3 on issued WOs and 4 on issued OCs, we need 4 (since WO and OC can share the 3).
        result = 0
        for loop_tuple in DOCUMENT_TYPES:
            required_by_doc_type = 0
            doc_type = loop_tuple[0]
            docs_this_type = doc_assignments.filter(version__document__doc_type=doc_type)

            for doca in docs_this_type:
                if not doca.version.issue_date == None:
                    required_by_doc_type += doca.quantity
            
            result = required_by_doc_type if required_by_doc_type > result else result

        return result


    # || JobItem.Financial
    def selling_price_f(self):
        """
            Format the selling price for display.
        """
        return format_money(self.selling_price)


    def list_price(self):
        """
            List price for this JobItem (value)
        """
        try:
            return self.quantity * Price.objects.filter(currency=self.job.currency).filter(price_list=self.price_list).get(product=self.product).value

        except:
            return None

    def list_price_f(self):
        """
            List price for this JobItem (formatted string)
        """
        return format_money(self.list_price())


    def resale_percentage(self):
        """ 
            If the invoice is going to an agent, work out and report the resale discount percentage.
        """
        # End early if resale doesn't apply (because we're not invoicing an agent or because the product doesn't have one)
        if not self.job.invoice_to.site.company.is_agent or (self.product.resale_category == None and self.product.special_resale.all().count() == 0):
            return 0

        else:
            # If the agent has their own special deal, handle it
            deal = self.product.special_resale.filter(agent=self.job.invoice_to.site.company)
            if len(deal) != 0:
                return deal[0].percentage
            
            # Handle an agent on standard resale discount
            else:
                return self.product.resale_category.resale_perc


    # || JobItem.StandardAccessories
    def add_standard_accessories(self):
        """
            Consult the product and quantity, then create additional JobItems to reflect the set of standard accessories supplied with this product.
            e.g. Suppose the Thingummy product is supplied with 3 x Widgets. Someone orders 2 x Thingummies. The system will store:
                > JobItem record for 2 x Thingummy
                > JobItem record for 6 x Widgets
        """
        stdAccs = StandardAccessory.objects.filter(parent=self.product)
        for stdAcc in stdAccs:
            sa = JobItem(
                created_by = self.created_by,
                job = self.job,
                product = stdAcc.accessory,
                price_list = self.price_list,
                quantity = stdAcc.quantity * self.quantity,
                selling_price = 0.00,
                included_with = self
            )
            sa.save()
    

    def reset_standard_accessories(self):
        """
            Delete all existing standard accessory JobItems linked to self and replace them with a fresh set.
            (For when a user edits the product on an existing JobItem, necessitating a completely different set)   
        """
        stdAccs = self.includes.all()
        if stdAccs.count() > 0:
            stdAccs.delete()
        self.add_standard_accessories()


    def update_standard_accessories(self):
        """
            Run through existing standard accessory JobItems linked to self and update the quantities and price lists.
            (For when a user edits the quantity on an existing JobItem, necessitating the same set but more/fewer)
        """
        for stdAcc in self.includes.all():
            accessory_data = StandardAccessory.objects.filter(parent=self.product).filter(accessory=stdAcc.product)[0]
            qty_per_parent = accessory_data.quantity
            if qty_per_parent == None:
                qty_per_parent = 0
            stdAcc.quantity = self.quantity * qty_per_parent

            stdAcc.price_list = self.price_list
            stdAcc.save()



 
    # || JobItem.Modular
    def quantity_is_ok_for_modular_as_child(self, new_qty):
        """
            Modular: Child. When editing the qty, check the new qty is compatible with JobModule assignments
            (i.e. user hasn't subtracted so many that there aren't enough to fulfill all existing slot assignments)
        """        
        module_assignments = self.jobmodules_as_child()
        num_needed_for_assignments = 0
        if module_assignments.count() > 0:
            for ma in module_assignments:
                num_needed_for_assignments += ma.quantity * ma.parent.quantity
        
        product_qty_without_me = self.job.quantity_of_product(self.product) - self.quantity
        return product_qty_without_me + new_qty >= num_needed_for_assignments


    def quantity_is_ok_for_modular_as_parent(self, new_qty):
        """
            Modular: Parent. When editing the qty, check the new qty is compatible with JobModule assignments
            (i.e. user hasn't added so many that there aren't enough "children" to fulfill all existing slot assignments)       
        """
        for module_assignment in self.modules.all():
            total_quantity_needed = new_qty * module_assignment.quantity
            total_quantity_exists = self.job.quantity_of_product(module_assignment.child)
            if total_quantity_needed > total_quantity_exists:
                return False
        return True


    def jobmodules_as_child(self):
        """
            Modular: Child. Get a list of relevant JobModules
        """
        return JobModule.objects.filter(parent__job=self.job).filter(child=self.product)


    def item_is_complete(self):
        """
            Modular: Parent. Is this a functional spec, with all required filled?
        """
        if self.product.is_modular():
            for slot in self.product.slots.all():
                if self.num_slot_children(slot) < slot.quantity_required:
                    return False
        return True

    def excess_modules_assigned(self):
        """
            Modular: Parent. The program allows users to exceed the required + optional total: 
            so this is used to find out if the user has taken advantage of that ability.
            
            (The purpose of allowing the user to exceed the maximum is to support the possibility of 
            customers ordering bespoke modifications to increase the slots on a product.)
        """
        if self.product.is_modular():
            for slot in self.product.slots.all():
                if self.get_num_excess(slot) > 0:
                    return True          
        return False   


    def num_slot_children(self, slot):
        """
            Modular: Parent. Use to find out number of children *per parent* for this slot.
        """
        assignments = JobModule.objects.filter(parent=self).filter(slot=slot)
        if assignments.count() == 0:
            qty_assigned = 0
        else:
            qty_assigned = assignments.aggregate(Sum('quantity'))['quantity__sum']
        return qty_assigned


    def get_slot_details_string_required(self, slot):
        """
            Modular: Parent. Slot status string for required, e.g. "1/3" = 1 filled, 3 required.
        """
        if self.product.is_modular():
            num_assignments = self.num_slot_children(slot)
            if num_assignments <= slot.quantity_required:
                result = num_assignments
            else:
                result = slot.quantity_required
            return f'{result}/{slot.quantity_required}'
        return ''


    def get_slot_details_string_optional(self, slot):
        """
            Modular: Parent. Slot status string for optional, e.g. "1/3" = 1 filled, 3 available (as standard).
        """
        if self.product.is_modular():
            num_assignments = self.num_slot_children(slot)    

            if num_assignments <= slot.quantity_required:
                result = 0
            elif num_assignments <= slot.quantity_required + slot.quantity_optional:
                result = num_assignments - slot.quantity_required
            else:
                result = slot.quantity_optional
            return f'{result}/{slot.quantity_optional}'
        return ''
    
    
    def get_num_excess(self, slot):
        """
            Modular: Parent. Get the number of excess assignments to this specific slot
        """
        if self.product.is_modular():
            num_assignments = self.num_slot_children(slot)  
            if num_assignments > slot.quantity_required + slot.quantity_optional:
                return num_assignments - slot.quantity_required - slot.quantity_optional
        return 0


    def get_slot_status_dictionary(self, slot):
        """
            Modular: Parent. Dict for updating the page after something slotty changes.
        """
        return {
            'jobitem_has_excess': self.excess_modules_assigned(),
            'slot_num_excess': self.get_num_excess(slot),
            'required_str': self.get_slot_details_string_required(slot),
            'optional_str': self.get_slot_details_string_optional(slot)
        }


    def __str__(self):
        return f'({self.job.name}) {self.quantity} x {self.product.name}'




class JobModule(models.Model):
    """
        Store one slot filler on a modular item.
    """
    parent = models.ForeignKey(JobItem, on_delete=models.CASCADE, related_name='modules')
    child = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='module_assignment', null=True, blank=True)
    slot = models.ForeignKey(Slot, on_delete=models.CASCADE, related_name='usages')
    quantity = models.IntegerField(default=1)

    def max_quantity(self):
        num_unassigned = self.parent.job.num_unassigned_to_slot(self.child)
        old_qty_total = self.quantity * self.parent.quantity
        return num_unassigned + old_qty_total

    def update(self, new_quantity):
        """
        Update JobModule quantity
        """
        # Maybe the user solely entered symbols permitted by 'type=number', but which don't actually result in a number
        # (e.g. e, +, -)
        if new_quantity == '' or new_quantity == None:
            return error("Invalid quantity.", 400)
        
        new_quantity = int(new_quantity)

        # Maybe the new qty is the same as the old qty, so there's nothing to be done
        if new_quantity == self.quantity:
            return

        # Maybe the user entered a new qty of 0 or a negative number
        if new_quantity <= 0:
            return error("Quantity must be 1 or more", 403)
        
        # Maybe the user entered a qty which exceeds the number of unassigned job items on the order
        new_qty_total = new_quantity * self.parent.quantity
        max_qty = self.max_quantity()
        if max_qty < new_qty_total:
            return error(f"Not enough items on job (max = {max_qty}).", 403)

        # Or maybe, just maybe, they entered an actual valid quantity which we can use
        self.quantity = new_quantity
        self.save()



    def __str__(self):
        return f"[{self.parent.pk}] {self.parent.product.name}: {self.slot.name} slot filled by {self.child.name}"




# || Documents classes
class DocumentData(models.Model):
    """
        This class represents "a single document" in the sentence "Adminas supports multiple versions of a single document".

        Acts as a grouping point for its versions.
    """
    reference = models.CharField(max_length=SYSTEM_NAME_LENGTH, blank=True)
    doc_type = models.CharField(max_length=DOC_CODE_MAX_LENGTH, choices=DOCUMENT_TYPES, null=True)
    job = models.ForeignKey(Job, on_delete=models.PROTECT, related_name='documents')

    def update(self, reference):
        self.reference = reference
        self.save()

    def __str__(self):
        return f'{self.doc_type} {self.reference}'



class DocumentVersion(AdminAuditTrail):
    """
        This class represents one "version" in the sentence "Adminas supports multiple versions of a single document".

        A document where all goes according to plan will only have one version.
    """
    document = models.ForeignKey(DocumentData, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    issue_date = models.DateField(null=True, blank=True)
    issued_json = models.JSONField(encoder=DjangoJSONEncoder, null=True)

    # This should be set to False in two situations: version is deleted; version is replaced.
    active = models.BooleanField(default=True)

    # On draft documents the final text hasn't been created yet, so this is where we store the "instructions" for where to find the text when the time comes to issue it.
    # On an issued document these would allow someone to lookup a list of documents based on the address or the JobItem (YAGNI, but it's here anyway...)
    invoice_to = models.ForeignKey(Address, on_delete=models.PROTECT, null=True, blank=True, related_name='financial_documents')
    delivery_to = models.ForeignKey(Address, on_delete=models.PROTECT, null=True, blank=True, related_name='delivery_documents')
    items = models.ManyToManyField(JobItem, related_name='on_documents', through='DocAssignment')

    def summary(self):
        """
            General info about the document, which can be used to distinguish it from other document (e.g. in a list of documents)
        """
        result = {}
        result['doc_version_id'] = self.id
        result['doc_type'] = self.document.doc_type
        result['issue_date'] = self.issue_date
        result['created_on'] = self.created_on.strftime('%Y-%m-%d')
        result['reference'] = self.document.reference
        result['is_valid'] = self.is_valid()
        result['url'] = reverse('doc_main', kwargs={'doc_id': self.id})

        return result

    def update(self, user, reference, issue_date, assigned_items, special_instructions, prod_data_form):
        """
        Update DocumentVersion and its associated DocumentData and children
        """
        check = self.safe_to_update()
        if check != True:
            return check

        # Update parent
        self.document.update(reference)

        # Update self from Job
        self.invoice_to = self.document.job.invoice_to
        self.delivery_to = self.document.job.delivery_to

        # Update children / MTM fields
        items_outcome = self.update_item_assignments(assigned_items)
        if is_error(items_outcome):
            return items_outcome

        self.update_special_instructions(special_instructions, user)

        if prod_data_form != None:
            self.update_production_dates(prod_data_form)

        self.save()
        # If the user doesn't want to issue the document, we're done now.
        if issue_date == None or issue_date == '':
            return True

        # Otherwise try to issue the document, then respond accordingly
        issue_result = self.issue(issue_date)
        if is_error(issue_result):
            return error(f"Document was not issued ({issue_result[KEY_ERROR_MESSAGE]}), but any other unsaved changes have now been saved.", issue_result[KEY_RESPONSE_CODE])
        return True


    def issue(self, issue_date):
        """
        Issue the document version.
        Note: should only be called after ascertaining that the document should be issued.
        """
        # Prevent the issue date from being "updated" to nothingness, in the event of someone 
        # ignoring the above.
        if issue_date == None or issue_date == '':
            return error("Error: issue date was missing.", 400)

        check = self.safe_to_issue()
        if check != True:
            return check

        self.issue_date = issue_date
        self.issued_json = self.get_current_data()
        self.save()


    def safe_to_delete(self):
        if self.is_issued():
            return error("Forbidden: issued documents can't be deleted", 403)
        return True

    def safe_to_update(self):
        if self.is_issued():
            return error("Forbidden: issued documents can't be updated", 403)
        return True

    def safe_to_issue(self):
        if not self.is_valid():
            return error("Forbidden: invalid item assignments exist.", 403)
        return True

    def is_issued(self):
        return self.issue_date != None and self.issue_date != ''

    def is_valid(self):
        """
            Check document to ensure the quantities of line items are consistent with the quantities entered
        """
        doc_assignments = DocAssignment.objects.filter(version=self)
        if doc_assignments.count() > 0:
            for i in DocAssignment.objects.filter(version=self):
                if not i.quantity_is_valid():
                    return False
        return True

    def assignment_validity_by_jiid(self):
        """
            Dict where each key is a ji_id and each value is a boolean expressing whether the quantities are valid
        """
        result = {}

        for assignment in DocAssignment.objects.filter(version=self):
            id_as_str = str(assignment.item.id)

            if not id_as_str in result:
                result[id_as_str] = assignment.quantity_is_valid()
        
        return result
    
    def get_current_data(self):
        """
            Retrieve data for populating a document, based on the current state of the database 
        """
        data = {}
        data['job_id'] = self.document.job.id
        data['version_id'] = self.id

        data['issue_date'] = self.issue_date if self.issue_date != '' else None
        data['created_by'] = self.created_by.id
        data['doc_ref'] = self.document.reference
        data['title'] = dict(DOCUMENT_TYPES).get(self.document.doc_type)

        data['currency'] = self.document.job.currency
        data['total_value_f'] = self.total_value_f()
        data['invoice_to'] = self.invoice_to.display_str_newlines()
        data['delivery_to'] = self.delivery_to.display_str_newlines()
        data['css_filename'] = f'document_default_{self.document.doc_type.lower()}.css'

        data['fields'] = self.get_doc_fields()

        data['instructions'] = []
        for instr in self.instructions.all():
            data['instructions'].append(instr.instruction)

        data['line_items'] = self.get_body_lines()

        if self.issue_date != '' and self.issue_date != None:
            data['mode'] = 'issued'
        else:
            data['mode'] = 'preview'

        return data     


    def get_doc_fields(self):
        """ 
            List of label/value pairs for a generic "fields" block on a document. ['h'] = label, ['body'] = value 
        """
        fields = []

        # Add purchase order info.
        # While most documents will relate to a single PO, some customers prefer to make modifications via additional PO/s rather than amending the first,
        # so this must also support making a list of POs.
        try:
            str = f'{self.document.job.po.all()[0].reference} dated {self.document.job.po.all()[0].date_on_po}'
            for po in self.document.job.po.all()[1:]:
                str += f', {po.reference} dated {po.date_on_po}'
        except IndexError:
            str = 'N/A'

        fields.append({
            'h': 'PO No.',
            'body': str
        })

        # Add estimated production date.
        try:
            prod_data = ProductionData.objects.filter(version=self)[0]
            date_sched = prod_data.date_scheduled
            date_req = prod_data.date_requested
        except IndexError:
            date_sched = 'TBC'
            date_req = 'Unknown'

        fields.append({
            'h': 'Requested Date',
            'body': date_req,
            'css_id': 'id_requested_date'
        })

        fields.append({
            'h': 'Estimated Date',
            'body': date_sched,
            'css_id': 'id_estimated_date'
        })

        # Add list of origin countries' full names, but only when needed
        if self.document.doc_type == 'OC':
            str = ''
            for i in self.items.all(): 
                if i.product.origin_country.name not in str:
                    if str != '':
                        str += ', '
                    str += i.product.origin_country.name
            fields.append({
                'h': 'Country of Origin',
                'body': str
            })

        return fields

    def get_issued_data(self):
        """
            Data for populating an issued document, based on the JSON record produced when the document was issued.
        """
        data = self.issued_json
        data['issue_date'] = datetime.datetime.strptime(data['issue_date'], "%Y-%m-%d").date()
        data['created_by'] = User.objects.get(id = data['created_by'])

        return data            

    def deactivate(self):
        """ 
            Deactivate instead of really deleting (for restoration purposes) 
        """
        self.active = False
        self.save()

    def reactivate(self):
        """ 
            Undo the deactivation 
        """
        self.active = True
        self.save()

    def get_replacement_version(self, user):
        """ 
            Make a copy of this DocumentVersion, but with the version number incremented and issue date/JSON removed: then deactivate self.

            Purpose:
            It's beneficial to keep a record of *all* PDFs that have been "released into the wild", regardless of whether or not they're correct.
            If anything, the incorrect ones are particularly valuable, since they can help explain why something or other went horribly wrong.
            To this end, edit-via-replacement is required for issued documents (rather than edit-by-overwrite).
        """
        replacement = DocumentVersion(
            created_by = user,
            document = self.document,
            version_number = self.version_number + 1,
            issue_date = None,
            active = True,
            issued_json = None,
            invoice_to = self.document.job.invoice_to,
            delivery_to = self.document.job.delivery_to
        )
        replacement.save()

        copy_relations_to_new_document_version(DocAssignment.objects.filter(version=self), replacement)
        copy_relations_to_new_document_version(self.instructions.all(), replacement)
        copy_relations_to_new_document_version(self.production_data.all(), replacement)

        self.deactivate()

        return replacement

    def revert_to_previous_version(self):
        """ 
            Attempt to revert a replacement DocumentVersion.

            Note: this will fail in the event of the older version being incompatible with other currently active documents.
        """
        previous_qs = DocumentVersion.objects.filter(document=self.document).filter(version_number=self.version_number - 1)
        
        if previous_qs.count() == 0:
            return error('Revert version has failed. There is no previous version.', 404)
        
        previous = previous_qs.order_by('-created_on')[0]

        self.deactivate()
        if previous.item_assignments_clash_with_issued():
            self.reactivate()
            return error('Revert version has failed. Some items have been reassigned to other documents of the same type.', 409)
        else:
            previous_dict = previous.issued_json
            self.document.update(previous_dict['doc_ref'])
            previous.reactivate()
            return previous

    def item_assignments_clash_with_issued(self):
        """
            Check that there are no duplications of JobItems across issued documents of the same type.
        """
        for assignment in DocAssignment.objects.filter(version=self):
            if not assignment.quantity_is_valid(True):
                return True

        return False
       
    def get_included_items(self):
        """
            List of JobItems assigned to this document version.
        """
        if self.items.all().count() == 0:
            return None

        else:
            assignments = DocAssignment.objects.filter(version=self)
            result = []
            for a in assignments:
                this_dict = {}
                this_dict['id'] = a.pk
                this_dict['jiid'] = a.item.id
                this_dict['max_available'] = a.max_valid_quantity()
                this_dict['display'] = a.item.display_str().replace(str(a.item.quantity), str(a.quantity))
                this_dict['invalid_quantity'] = not a.quantity_is_valid()
                result.append(this_dict)
            return result


    def num_items(self):
        return len(self.get_included_items())


    def get_excluded_items(self):
        """
            List of JobItems excluded from this document version.
        """
        available = self.get_available_items()
        unavailable = self.get_unavailable_items()
        if available == None or self.id == None:
            return unavailable
        elif unavailable == None:
            return available
        else:
            return available + unavailable

    def get_empty_body_line(self):
        """
            Make a dict for displaying an empty row on a document.
        """
        empty_body_line = {}
        empty_body_line['quantity'] = ''
        empty_body_line['part_number'] = ''
        empty_body_line['product_description'] = ''
        empty_body_line['origin'] = ''
        empty_body_line['list_price_f'] = ''
        empty_body_line['unit_price_f'] = ''
        empty_body_line['total_price'] = 0
        empty_body_line['total_price_f'] = ''
        empty_body_line['price_list'] = ''

        return empty_body_line


    def get_body_lines(self):
        """
            Format JobItem data in a dict for display on a document.
        """
        # List of items assigned to this particular document.
        if self.items.all().count() == 0:
            result = []
            for _ in range(0, NUM_BODY_ROWS_ON_EMPTY_DOCUMENT):
                result.append(self.get_empty_body_line())

            return result

        else:
            assignments = DocAssignment.objects.filter(version=self)
            result = []
            for a in assignments:
                main_item = {}
                main_item['quantity'] = a.quantity
                main_item['part_number'] = a.item.product.part_number
                main_item['product_description'] = a.item.product.get_description(self.document.job.language)
                main_item['origin'] = a.item.product.origin_country.code
                main_item['list_price_f'] = format_money(a.item.list_price() / a.item.quantity)
                main_item['unit_price_f'] = format_money(a.item.selling_price / a.item.quantity)
                main_item['total_price'] = a.quantity * (a.item.selling_price / a.item.quantity)
                main_item['total_price_f'] = format_money(a.quantity * (a.item.selling_price / a.item.quantity))
                main_item['price_list'] = a.item.price_list.name
                result.append(main_item)

                if a.item.includes.all().count() != 0:
                    std_acc_intro = self.get_empty_body_line()
                    std_acc_intro['product_description'] = 'which includes the following:'
                    result.append(std_acc_intro)

                    for std_acc in a.item.includes.all():
                        std_acc_dict = self.get_empty_body_line()
                        std_acc_dict['product_description'] = std_acc.display_str()
                        result.append(std_acc_dict)

            return result


    def get_available_items(self):
        """
            List of items assigned to this Job which have not yet been assigned to a document of this type.
            On a new document, the assumption is that the user is creating the new document to cover the leftover items, so this is used to populate the default "included" list.
            On an existing document, the user has already indicated which items they wish to include, so this is used to populate the top of the "excluded" list.
        """
        return get_dict_items_available_for_document(self.document.job.main_item_list(), self.document.doc_type)


    def get_unavailable_items(self):
        """
            List of items already assigned to another document of this type.
            Used to populate the "excluded" list.
        """
        assigned_elsewhere = DocAssignment.objects\
                            .filter(version__document__job=self.document.job)\
                            .filter(version__document__doc_type=self.document.doc_type)\
                            .filter(version__active=True)\
                            .exclude(version=self)

        if assigned_elsewhere.all().count() == 0:
            return None

        result = []
        for ae in assigned_elsewhere.all():
            this_dict = {}
            this_dict['id'] = ae.pk
            this_dict['jiid'] = ae.item.pk
            this_dict['total_quantity'] = ae.item.quantity
            this_dict['display'] = ae.item.display_str().replace(str(ae.item.quantity), str(ae.quantity))
            this_dict['is_available'] = False
            this_dict['used_by'] = ae.version.document.reference
            this_dict['doc_id'] = ae.version.id
            this_dict['is_invalid'] = not ae.quantity_is_valid()
            result.append(this_dict)                
        return result


    def update_item_assignments(self, assignment_obj):
        """
        Update, delete or create DocAssignments according to the assignment_obj.

        Note: the assignment_obj argument must be a dict with a key/value pair for each JobItem,
        where key = JobItem ID and value = desired quantity to display on this document.
        """

        # Update or delete existing assignments
        for existing_da in DocAssignment.objects.filter(version=self):
            new_qty = assignment_obj.pop(str(existing_da.item.id), None)
            if new_qty == None:
                return error("Invalid assignment data (UD).", 400)

            if new_qty == 0:
                existing_da.delete()
            else:
                existing_da.update(new_qty)
        
        # Create new assignments from remaining key/values in the assignment_obj
        for key, value in assignment_obj.items():
            if value > 0:
                create_document_assignment(self, key, value)
            

    def update_special_instructions(self, required, user):
        """
            Update or delete SpecialInstructions according to their difference to/absence from the "required" argument (which is a list).

            Following each update, the method removes the relevant dict from "required".
            What remains (and is returned) is a list of new SpecialInstructions requiring creation, for use elsewhere.

            Note: the "required" argument must be a list of dicts with two fields (id and quantity).
        """
        for ei in SpecialInstruction.objects.filter(version=self):
            found = False
            for req in required:
                if 'id' in req and int(req['id']) == ei.id:
                    found = True
                    ei.instruction = req['contents']
                    ei.save()
                    required.remove(req)
                    break
            if not found:
                ei.delete()

        create_document_instructions(required, self, user)


    def update_production_dates(self, form):
        """
            Find the ProductionData associated with this document and update it.
        """
        # Skip if this document type doesn't have production data associated with it under any circumstances
        if self.document.doc_type != 'WO':
            return

        else:
            # Look for ProductionData records for this document.
            proddata_qs = ProductionData.objects.filter(version=self)

            # Found 0: Create a new ProductionData record for this document
            if proddata_qs.count() == 0:              

                # No dates = don't bother
                if '' == form.cleaned_data['date_requested'] and '' == form.cleaned_data['date_scheduled']:
                    return

                if '' != form.cleaned_data['date_requested']:
                    req = form.cleaned_data['date_requested']
                else:
                    req = None

                if '' != form.cleaned_data['date_scheduled']:
                    sched = form.cleaned_data['date_scheduled']
                else:
                    sched = None

                this_pd = ProductionData(
                    version = self,
                    date_requested = req,
                    date_scheduled = sched
                )
                this_pd.save()

            # Found 1: Update/Delete it
            elif proddata_qs.count() == 1:
                this_pd = proddata_qs[0]

                # No dates = no ProductionData, so delete it
                if '' == form.cleaned_data['date_requested'] and '' == form.cleaned_data['date_scheduled']:
                    this_pd.delete()

                # Update the dates if they changed
                else:
                    something_changed = False

                    if this_pd.date_requested != form.cleaned_data['date_requested']:
                        this_pd.date_requested = form.cleaned_data['date_requested']
                        something_changed = True

                    if this_pd.date_scheduled != form.cleaned_data['date_scheduled']:
                        this_pd.date_scheduled = form.cleaned_data['date_scheduled']
                        something_changed = True
                    
                    if something_changed:
                        this_pd.save()   


    def update_requested_production_date(self, prod_data_form):
        """
            Find the ProductionData associated with this document and update it.
        """
        if self.document.doc_type == 'WO':
            proddata_qs = ProductionData.objects.filter(version=self)

            if proddata_qs.count() == 0:
                if '' != prod_data_form.cleaned_data['date_requested']:
                    prod_req = ProductionData(
                        version = self,
                        date_requested = prod_data_form.cleaned_data['date_requested'],
                        date_scheduled = None
                    )
                    prod_req.save()

            elif proddata_qs.count() == 1:
                prod_req = proddata_qs[0]

                if '' == prod_data_form.cleaned_data['date_requested']:
                    prod_req.delete()

                elif prod_req.date_requested != prod_data_form.cleaned_data['date_requested']:
                    prod_req.date_requested = prod_data_form.cleaned_data['date_requested']
                    prod_req.save()
        else:
            return


    def total_value(self):
        """
           Total sum of values of all line items on this specific document (value)
        """
        return sum(item['total_price'] for item in self.get_body_lines() if 'total_price' in item)


    def total_value_f(self):
        """
            Total sum of values of all line items on this specific document (formatted string)
        """
        return format_money(self.total_value())


    def quantity_of_items(self):
        """
            Total sum of valid quantities of all line items on this specific document
        """
        return sum(da.validated_quantity() for da in DocAssignment.objects.filter(version=self))
        

    def __str__(self):
        return f'{self.document.doc_type} {self.document.reference} v{self.version_number} dated {self.issue_date}'



class ProductionData(models.Model):
    """
        Information about production plans, to appear on work orders.
    """
    version = models.ForeignKey(DocumentVersion, on_delete=models.CASCADE, related_name='production_data')
    date_requested = models.DateField(blank=True, null=True)
    date_scheduled = models.DateField(blank=True, null=True)

    def __str__(self):
        return f'Production of {self.version.document.doc_type} {self.version.document.reference}. Req = {self.date_requested}, Sch = {self.date_scheduled}'


class SpecialInstruction(AdminAuditTrail):
    """
        Miscellaneous comments/statements. Can be added to any type of document.
    """
    version = models.ForeignKey(DocumentVersion, on_delete=models.CASCADE, related_name='instructions')
    instruction = models.TextField(blank=True)

    def __str__(self):
        return f'Note on {self.version.document.doc_type} {self.version.document.reference} by {self.created_by.username} on {self.created_on}'
