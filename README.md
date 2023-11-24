# Adminas by Alex Symonds

## Introduction
Adminas is an internal tool for office employees to enter purchase orders; check the order against prices and product specifications; then produce one or more order confirmation PDFs (for the customer) and one or more work order PDFs (for whoever prepares the orders).

The program assumes that:
- A system admin will modify some HTML/CSS files to create a company header/footer for document PDFs
- A system admin will make use of Django's admin pages to enter and maintain some supporting "system data" (i.e. an address book; prices, including special resale deals; products, including details about modular products and standard accessories)
- All users are employees of the same company and have access to all the data
- All users are trusted to enter any price for any item[^1]
- When completing modular items[^2], users are trusted to exceed the allowed quantity of selections, but are restricted to adding only "valid" items[^3]

Expected workflow is: New > Add Items => Complete Modular Items => Add PO > Check and confirm prices > Create and Issue documents. However, other than requiring some details to be entered when creating the job, Adminas doesn't mind if users wish to do things in a different order. It's up to the user to use the warnings/information Adminas gives them to judge what actions are appropriate.

[^1]: Adminas does not police pricing because high, low, zero or negative prices can be correct under certain circumstances, e.g. customer is paying extra for a special modification; salesperson offered a special discount to win an order; warranty replacement; a line item intended to remove something.

[^2]: For the purposes of Adminas, a "modular item" is a method of handling products with multiple variations. For example, suppose a company is selling a testing instrument which requires at least one magnification lens to function and has space for two more, with seven different lenses to choose between. The company could choose to handle this situation by making the testing instrument a "modular item": have one product for a lense-less testing instrument, seven products for the lenses, then require all customers who order the instrument to also order 1 - 3 lenses. In comparison to other methods, utilising modular items results in fewer products in the database than making a separate instrument product for each possible combination of 1 - 3 lenses (though Adminas would support this approach as well) and less complexity than having a "default" set of lenses and allowing substitutions (Adminas does not currently support substitutions).

[^3]: Exceeding the quantity is permitted -- with a warning -- because assigning "too many" of a slot filler could be reasonable if the customer also wants some extras "on the side" (e.g. spare parts, or perhaps the product is designed for users to be able to swap out slot fillers themselves) and the user wants to assign on-the-side child items to their parent item for clarity. The warning is there to remind the user to check the customer understands that some of the items will be on the side.

    Entering invalid items is not permitted for two reasons. First, the most common reason for an invalid item is an error on the PO, so it's a defence against users entering nonsense by mistake. Second, if it isn't an error on the PO, the absence of a valid item from the choice list could reflect an oversight in the system data: preventing users from entering the "invalid" item will hopefully encourage them to seek out the system admin and prompt them to consider if an update to the system data is required.


## How to run the application
1. Install modules as per requirements.txt
2. Setup SECRET_KEY as an ".env" variable (open sample.env.txt, input a suitable SECRET_KEY, then save the file as ".env")
2. ```python manage.py runserver``` (or the equivalent for your OS)
3. Check if the settings in constants.py are to your liking
4. ```python manage.py makemigrations```
5. ```python manage.py migrate```
6. (Optional) To add Admin (superuser), Demo and System user accounts and some dummy data (with a "super-villain supplies" theme):
- Input the other .env variables in sample.env.txt
- ```python dummy_data.py``` to populate the database with some addresses, products, prices and one job (all with a "super-villain supplies" theme)
7. (If you didn't perform step 6) ```python manage.py createsuperuser``` and go through the normal process (for access to Django admin)
8. Open your preferred web browser and go to http://127.0.0.1:8000/

User Configuration:
* Adjusting the company letterhead (colours/arrangement): ```doc_user.css``` is intended for the user to add their own CSS formatting. It's the only way to apply formatting to the header and footer, but it can also be used to override the CSS settings applied to the "default" documents. The user can choose to rename this file so long as they update ```CSS_FORMATTING_FILENAME``` in ```adminas/constants.py```.
* Adjusting the company letterhead (contents): replacing ```adminas/static/adminas/logo.png``` with a different PNG with the same name will change the logo. The rest of the letterhead contents are in ```adminas/templates/adminas/pdf/``` in two files named "pdf_doc_2_user_*.html" where the * is "h" for the file containing the header and "f" for the one with the footer. The user can choose to rename these files so long as they update ```HTML_HEADER_FILENAME``` and ```HTML_FOOTER_FILENAME``` in ```adminas/constants.py```.
* constants.py also allows the user to adjust which currencies, languages and INCOTERMS are acceptable to them
* "Business data" (i.e. addresses, products, prices: the stuff loaded by dummy_data.py) can be added / amended via Django admin (details as per the section below)


## Additional Information: Data Handled Exclusively via Django Admin (Addresses, Products and Prices)
### Background Info: Address Models
The address book is split across three models, Company, Site and Address.
* Company stores information about the company itself and relevant account details (e.g. agreed currency)
* Address stores only a physical address
* Site links Addresses to Companies and gives context to that Addresses role in the Company (users can give the site a name and indicate if it's the default invoice or delivery address)

This allows a single Company to have as many different locations as are needed and offers continuity in the event of a physical move (e.g. if a company moves their accounting office to the other side of town, the Company and Site records will remain the same, only the Address record needs to change or be replaced).

### Background Info: Product Models
Product information is split across five models: Product, Description, StandardAccessory, Slot and SlotChoiceList.
* Product is used to represent one item which should get its own line on documents (that is, it's either something on sale or something included with something on sale)
* Description is a one-line description to appear on documents
* StandardAccessory allows users to nest specific child Products within a parent Product
* Slot and SlotChoiceList allow users to describe Products where the customer has a range of options to choose between. The SlotChoiceList contains a list of interchangeable child Product options; Slot links that list to the parent and sets how many are required/optional

Descriptions are separated from Products to allow a single Product to have more than one description (allowing multiple languages, or to keep a record of old descriptions).

The main use cases for StandardAccessories are expected to be:
1. Adding small sundry Products to a "main" Product, e.g. making a charger Product and a headphones Product StandardAccessories of a smartphone Product.
2. Creating "packages" of Products, e.g. making a new "Flavour Pouch Sampler Set" Product, then using StandardAccessories to include one each of a range of different flavour pouches

Suppose a user sells customisable bicycles where customers can pick from a range of frames, wheels and saddles: creating a separate Product-with-StandardAccessories for every possible combination could become unmanageable as their product range grows. Slots and SlotChoiceLists are intended to help in this type of situation. Our bicycle seller could instead setup SlotChoiceLists for "Frames", "Wheels" and "Saddles", then use Slots to link those lists to a "Bicycle" Product. Now the user doesn't need to worry about all the different combinations: they simply manage the lists.

#### Differences between StandardAccessories and Slots
Broadly, StandardAccessories are considered an integral part of the parent item, while Slot fillers are independent items.

* Pricing: child StandardAccessories are included in the price of the parent; Slot fillers are priced separately.
* Deleting the parent: deleting a parent with StandardAccessories will also delete all the children; deleting a parent with Slot fillers will only delete the parent
* Deleting the child: child StandardAccessories can't be deleted (except by deleting the parent); child Slot fillers can't be deleted while they're filling a Slot, so it's necessary to go to the parent and remove the child item from the Slot first (this is intended to prevent users from unknowingly invalidating the specification of a parent item)

### Background Info: Price Models
Pricing information is split across four models, Price, PriceList, ResaleCategory and AgentResaleGroup.
* Price stores the Product, currency, value and the FK of a PriceList
* PriceList has a "valid from" date and a name. Otherwise it's just used to separate Prices into groups
* ResaleCategory allows users to apply a specified resale discount to a defined list of Products
* AgentResaleGroup allows users to apply Agent-specific resale discounts to a defined list of Products

The two "Resale" models are for situations where the company sells directly to customers, but also via resellers/agents. Chances are there'll be some sort of resale discount on offer for the resellers/agents, but not necessarily the same resale discount on all Products and also not necessarily the same resale discount to all agents.

ResaleCategory is used for "default" resale discounts, ones which are based solely on the Product: it has fields for a category name and the percentage. Adminas assumes that each Product will only have one default resale discount category [^4].

AgentResaleGroup is used for agent-and-product resale discounts. One AgentResaleGroup will probably contain multiple Products and one Product could appear in multiple AgentResaleGroups.

[^4]: If a Product is in more than one category but they all have the same discount, there was no point in it being in multiple categories. If the categories have different discounts, this is a recipe for wasting time arguing with agents about which discount applies. Hence, a single discount for each Product seems reasonable.

[^5]: Maybe the user sells dynamite at 20% standard resale, but Quality Mining Supplies gets 30% for being bulk-buyers, while Acme were only offered 5% because their customers keep misusing the dynamite to target roadrunners, bringing shame and legal challenges to the user.

### Django Admin: Addresses, Products and Prices
#### Companys
Includes Sites and AgentResaleGroups in tabular format.
Sites are included to provide an overview of all Sites affiliated with the Company and to facilitate the management of the flags for default invoice/delivery address.
AgentResaleGroups are included to to provide an overview of all deals offered to the agent Company and to facilitate the management of the percentages (e.g. if a 5% discount increase is negotiated, it would be more convenient to go to the Company page and run down the table adding +5 to each row than it would be to individually access AgentResaleGroup records).

#### Sites (for Addresses)
Includes Addresses in tabular format.
Sites has its own tab due to its role as a contextual wrapper around Addresses (which are not included on the Job page). When a user wishes to work with Addresses, they would do it via the Sites page.

#### AgentResaleGroups
Includes list of included Products in tabular fomat.
This allows modifications to the list of Products included in each AgentResaleGroup (this is not accessible on the Companys page).

#### Products
Includes Descriptions, StandardAccessories and Slots displayed tabularly
All three of these models can only be accessed via Products in Django admin. Description would've been a field in the Product class/table if it weren't for different languages, so it's an obvious inclusion. StandardAccessories and Slots are describing more complex Products so again, this is the logical location for them.

#### SlotChoiceLists
Only contain themselves, allowing users to modify the names and which Products are valid options for each choice list. 

#### PriceList
Includes Prices displayed tabularly.
This allows users to adjust the name of the price list and see its contents in one location. This is the only place where Prices are displayed in Django admin.

#### ResaleCategorys
Each record shows a read-only list of Products assigned to that category. If the user wishes to modify which Products appear in a category, it's necessary to do this via Products, due to resale_category being an FK field on the Product model.

## Additional Information: Other Data
### Job Models
Job is the main "bucket" for each job. All models relating to a specific Job will have a field with an FK referring back to it.

A PurchaseOrder reflects one purchase order document, as received from a customer. Usually the receipt of a purchase order is what will initiate the creation of a Job, so I considered having an "Order" model instead of a "Job" model and including PO fields in it, but this approach would go horribly wrong under certain rare-but-not-rare-enough circumstances: when a colleague wants something prepared for an exhibition or demonstration, so there's no purchase order but work is required; if the company wants to start work before the PO arrives to meet a tight lead time; if a customer modifies their order via issuing additional POs instead of revising the original one. As such, it's better to have a bucket that represents nothing beyond "one project in Adminas" -- i.e. Job -- and have a separate model for PurchaseOrders.

JobComments enable users to add notes to Jobs. The private/public, pinned and highlighted settings allow users to determine where comments appear and who can see them. Private comments are for reminders and memos that mean something to the author, but wouldn't to anyone else; public is for information about the order which should be shared with anyone working on it. Both "pinned" and "highlighted" comments get a special panel on the Job page and the JobComments page. In addition to this, "pinned" status also adds notes to the to-do list page, where they can best help the user distinguish between Jobs or remind them of outstanding tasks. "Highlighted" status adds formatting to make the comment stand out when scrolling through all the comments on the JobComments page.

JobItems are the means by which instances of Products are added to Jobs, with the ability to also state the selling price, the applicable price list, and how many are required. JobItems are used as the basis for document line items and filling modular items.


## Modular JobItems Model
JobModule is used to describe one slot filler on a modular JobItem. Via FK fields it links the parent JobItem, the child JobItem and the Slot being filled, to which it adds a quantity (necessary because JobItem has a quantity field and users won't necessarily want all of them filling the same slot).


### Document Models
There are five models related to documents: DocumentData, DocumentVersion, DocAssignment, ProductionData and SpecialInstruction.

DocumentData represents "one document", storing all information about the document which will remain constant across any/all revisions that might be needed. This turns out to be limited to the type of document, the FK to the associated Job, and a reference name.

DocumentVersion represents "one version of one document", it stores information about a document which could change across revisions. The remaining models related to documents have a field for the FK of the associated DocumentVersion (rather than the DocumentData) because they all contain information which could vary across versions.

DocAssignment is a through MTM model, used to link a JobItem to a DocumentVersion, alongside a quantity (necessary because JobItem has a quantity field and users won't necessarily want all of them to appear on the same document).

SpecialInstruction allows users to communicate unusual details with the folks preparing the order (on the works order) and the customer (on the order confirmation). Some orders will have none, while others could have dozens, hence this being a separate model.

Not all documents need production dates, so to avoid lots of "null" in DocumentVersion, it's stored as "ProductionData".



## Additional Information: Design Decisions
### Address Book Dropdown
Users must select addresses from an address book and are not given the ability to create or update addresses via the New or Job pages. This is because when a user's mind is on the task of processing an order they're probably not giving much consideration to how they can help maintain a pristine address book. Adminas keeps these two tasks completely separate in the hope of avoiding the same Site appearing half a dozen times under slightly different names because users kept forgetting what they'd called it and decided it'd be faster to re-enter the Site than find it.

### Restrictive product descriptions on documents
Adminas doesn't allow users to edit product descriptions on individual Jobs because of the two types of documents output by Adminas and how these interact with the most common reasons for wanting to edit a product description.

The most common reasons for wanting to amend a product description are:
1. To match the customer's description or layout
2. The level of detail which is useful to the user would be confusing to third-parties, such as customs or export control
3. The product is being supplied with modifications which affect the description

Work orders (WO) are internal documents, meaning there's no need to consider the needs of customers or third-parties, only those of the user's company. Over time company employees will learn to recognise the standard descriptions at a glance, meaning they'll stop taking the time to read every word. Embedding critical information about modifications in the middle of such a blob of standard text is therefore likely to result in the information being overlooked and the Product supplied without the agreed modifications. This is why Adminas prohibits adjustments to the descriptions on the WO card and instead provides "SpecialInstructions", so any modifications can be described in a big obvious box at the top of the page.

Order confirmations (OC) are external documents but they're usually just between the company and the customer, third-parties rarely take an interest. Rewording the OC to match the customer's PO is rarely requested by customers and would defeat one of the primary purposes of the OC: confirming the supplier's understanding of the order matches the customer's, which doesn't happen if you simply parrot back their PO. Editing a product description to reflect modifications makes more sense on an OC than on a WO (the customer might not even realise their modification _is_ a modification): the question is whether this would come up often enough to be worth implementing the feature. Given that modified Products could also be handled by adding a new Product to the system; adding Slots to a Product; adding SpecialInstructions to describe the modification; it was deemed to not be worth it.

If Adminas were expanded to output more documents -- particularly ones of interest to third-parties, such as invoices -- then it would require additional functionality when it comes to customising the body content.


## Additional Information: Ideas for Extension
* Have different types of users with different levels of access (e.g. maybe some employees aren't trusted with entering non-standard prices and are limited to selecting list or calculated resale prices)
* Add Adminas modules for managing addresses, products and prices, so nobody needs to use Django admin
* Order entry data and reports/graphs. Adminas could take information added for PurchaseOrders (on creation, update and deletion), modify this as needed for storing OE figures, then output this as a CSV and/or use it to produce reports and graphs.
* Quotation module. The "module management" page could also be helpful for salespeople, as it would help guide them through the options and requirements of modular items. In the event of a successful sale, the quote could be used to populate a Job, saving admin users from pointless duplication of work. It could also allow automatic confirmation of unusual prices offered on the quote.
* Production module. It would be convenient for admin users if Adminas could automatically notify production users of new orders and requested dates, then notify the admin users when production users respond with a scheduled date. Unfortunately it wouldn't be so convenient for production users if they have to keep logging into Adminas solely to see if any new orders have come in, so it'd be better if Adminas also provides them with their own reasons to log in: perhaps a calendar/kanban board so they can block in labour for each order, a stock control system, a production to-do list, etc.
* Expansion to other types of PDFs. Adminas could also handle invoices, packing lists, receipts, shipping documents, case marks, etc. Though in the case of invoices, this would involve a lot more flexibility over the contents and a lot of business logic controlling when they can be created, edited and deleted.
* In the event of more documents being involved, add a visual progress indicator on each Job on the to-do list and Records, so users can see at a glance that this Job needs an invoice and that Job is waiting for shipping arrangements
* Complete its conversion to a SPA with React
* Give users a selection of different PDF templates for documents
* Give users a code-less means of adjusting the company-specific HTML/CSS of the PDFs
* Refactor Adminas to work as a website used by multiple different companies, instead of as an in-house tool. Obviously this would require big changes to company-specific settings, data and contents to ensure they're only viewable and editable by the right users.
* Split Job page into multiple different pages/modes by task: for example, the price check information is only needed when checking/confirming prices.
* Redesign of todo list. Using rows instead of cards would allow more active Jobs to appear at once.
* Redesign of mobile Records page to arrange the data more compactly

## What's in each file
### Main Folder
#### dummy_data.py
Run from the command line ```python dummy_data.py``` to populate the database with some dummy data (with a "super-villain supplies" theme) for everything which an office worker tasked with entering a purchase order would expect to be "on the system" already. That is:
* Companies, both customers and agents (including addresses, sites, and special resale discount agreements)
* Products (including descriptions, standard accessories and setting up modular items with slots)
* Price lists (including standard resale discounts)
* One Job, including item assignments, comments and a demo document

#### populate_pricelist.py
Adding a new empty price list via Django admin is easy enough, but populating it would be a painful process of manually adding a new Price record for each combination of active_product and supported currency. populate_pricelist.py is intended to help with the population step: it creates a set of Price records for every active_product/currency combination and assigns them to the most recent PriceList (assuming it's empty). This means the admin user only needs to:
1. Create the empty price list
2. Run the script
3. Enter the new prices via Django admin
Alternatively, if the new prices are a straightforward "X% increase on whatever it was last time", the user can enter "X" as an optional argument and the program will apply that increase to the previous price for the same product&currency pair, if possible.

### Subfolder adminas/
#### "Standard" Django files
* admin.py has the settings for Django's admin page
* forms.py has the settings for any/all forms
* models.py contains the models, including many methods
* urls.py sets up the URLs and how they correspond to the fucntions in views.py
* views.py contains page views, api views and some helper functions relating to forms and identifying request types
 
#### constants.py 
Contains "business-y" constants: CSS settings for their document stationery, currencies they accept, languages they support, INCOTERMS they allow, etc.

#### util.py
* Error-related functions, to pass errors around and then respond (via JSON or render) accordingly and consistently
* Helper functions to take information from GET parameters or JSON bodies and extract the required objects/variables
* String formatting (money, plus prefix, agent/customer string)
* Preparing dictionaires for various purposes
* Creating new database objects
* Tools


### Subfolder adminas/templatetags/ 
query_transform.py is used by the pagination navigation. The records page uses GET parameters for both pagination and filter settings, so using ```"?page={{ page.next_page_number }}"``` in the pagination navigation (as suggested in the Django docs) would result in it losing all the filter settings, making it impossible to ever see past the first page of filtered records. query_transform.py solves this problem by copying the entire current URL and updating only the GET parameter passed in as an argument.


### Subfolder adminas/templates/adminas/
layout.html is the base for all webpages. Then there's one html file for each page on Adminas.

#### Subfolder components/
* comment_base.html, comment_collapse.html and comment_full.html contain the HTML for a single comment. comment_base.html has the parts common to all comments; comment_collapse.html and comment_full.html extend it in different ways to create the "slimline" version (where you click to expand the section with the buttons) and the full version (where you don't). This is used on the pages with comments which have not yet been converted to React.
* pagination_nav.html is the pagination navigation strip, used on the job_comments and records pages.

#### Subfolder pdf/
Contains the HTML files used for generating PDFs. wkhtmltopdf paginates the main/body HTML file; it also allows users to pass in two other HTML files to serve as a static header and footer across every page of the PDF. For Adminas PDFs, the header and footer will each require two parts: a "company" header/footer (with logos, addresses, contact details etc.) and a "document" header/footer (with any document-specific content that should be repeated on each page, rather than paginated, e.g. reference numbers).

* pdf_doc_0_layout.html contains HTML common to all three of the "final" HTML files used by wkhtmltopdf (that is, the body, the header and the footer).
* pdf_doc_1_*.html extends the layout for each of the three "final" HTML files. It brings together the company and document components (plus anything else needed by all headers, all footers or all bodies).
* pdf_doc_2_user_*.html files contain the company header/footer (aka their letterhead).
* pdf_doc_2_{ doc_type }_*.html files are for the actual document contents ( title, fields, line items, etc.).




### Subfolder adminas/static/adminas/
#### Images
* Everything named "i_*.svg" is an icon.
* logo.png is the company logo used in the PDF company header.

#### CSS
##### styles.css
Used by: all webpages.
"Main" CSS file containing all common CSS

##### doc_preview.css
Used by: PDFs
Formatting to clearly distinguish a "preview" (aka draft) copy of a document from the final, issued version.

##### doc_default_oc.css, doc_default_wo.css
Used by: PDFs.
Formatting for the main contents of each PDF.
Note: wkhtmltopdf doesn't support some CSS features (e.g. flexbox and grid).

##### doc_user.css
Used by: PDFs.
Formatting for user-specific page content, i.e. the company header and footer. In principle, a user could also use this to override the colours on the documents in order to better reflect their corporate branding (though I haven't utilised this in the example).
Note: wkhtmltopdf doesn't support some CSS features (e.g. flexbox and grid).

##### Others
Page-specific CSS named accordingly.


#### Javascript
##### auto_address.js
Used by: edit.
On changing a dropdown of address names, request the full address from the server and display it on the page.

##### document_builder_main.js
Used by: document_builder.
1. Save, issue and delete buttons at the top of the page, plus the "unsaved changes" warning box.
2. Special Instructions: hide/show of the "create new" form, plus "edit mode" and updating the page without a reload afterwards.

##### document_items.js
Used by: document_builder.
Adds functionality to the "split" and "incl/excl" buttons on the item lists.

##### document_main.js
Used by: document_main.
Adds functionality to the two "version" buttons, replace and revert. (Note: "replace" only available on issued documents; revert only available on issued documents with >1 version)

##### job_comments.js
Used by: job_comments, index
Comment functionality: create, edit, delete and toggling statuses.

##### job_delete.js
Used by: edit.
Enables the "delete" button when editing an existing Job.

##### manage_modules.js
Used by: module_management.
Allows users to edit an existing slot filler; add space for an additional slot filler (via the "+ slot" button); fill an empty slot with an existing JobItem or by creating a new JobItem.

##### react-job-page-X.js
Used by: job.
As an exercise, the Job page is now constructed using React. The various files cover components, states and helper functions for the all the various sections, forms and error messages which can appear on the Job page.

Inevitably there is some overlap between the React files and the "vanilla" files: comments and todo list toggles also appear on other, non-React pages.

##### react-util.js
Used by: job.
Components and functions to help more than one section of the Job page.

##### records_filter.js
Used by: records.
Enables the filter: opens the "form-like", turns the inputs into appropriate GET parameters, then reloads the page with the parameters.

##### records_list_toggle.js
Used by: records.
Handles the "view" buttons. (If there are multiple POs or items on an order, users can view them in a pop-up by clicking "view").

##### todo_management.js
Used by: home, records.
Allows users to adjust which Jobs appear on the to-do list in three ways: add via the "plus" buttons on the Records page; remove via the "minus" circles on the homepage to-do list; toggle via the "indicator" on the Job page.

##### util.js
Used by: any/all pages.
A selection of general-purpose functions available to all pages.
