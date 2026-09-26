"""Structured extraction schemas exposed to Needle 3.

Each schema is a JSON Schema object handed to the engine as the single
available tool; the model fills one record per request.
"""


SCHEMAS = {
    "invoice": {
        "label": "Invoice",
        "description": "Vendor, dates, total, line items.",
        "record_description": "Record the fields of one invoice.",
        "schema": {
            "type": "object",
            "properties": {
                "vendor": {"type": "string", "description": "Company that issued the invoice"},
                "invoice_number": {"type": "string", "description": "Invoice identifier, only when stated"},
                "issue_date": {"type": "string",
                               "description": "Issue date in YYYY-MM-DD format, for example 2026-01-12, only when stated"},
                "due_date": {"type": "string",
                             "description": "Payment due date in YYYY-MM-DD format, for example 2026-02-11, only when stated"},
                "total": {"type": "number", "description": "Total amount due"},
                "currency": {"type": "string", "enum": ["USD", "EUR", "GBP", "RUB"],
                             "description": "Currency of the total"},
                "items": {"type": "array",
                          "items": {
                              "type": "object",
                              "properties": {
                                  "description": {"type": "string"},
                                  "quantity": {"type": "integer", "minimum": 1,
                                               "description": "Number of units; use 1 for services and fees"},
                                  "unit_price": {"type": "number"},
                              },
                              "required": ["description", "quantity", "unit_price"],
                          },
                          "description": "Line items, only when stated"},
            },
            "required": ["vendor", "total", "currency"],
        },
    },
    "contact": {
        "label": "Contact card",
        "description": "Name, phone, e-mail, company, role.",
        "record_description": "Record the contact details of one person.",
        "schema": {
            "type": "object",
            "properties": {
                "company": {"type": "string", "description": "Employer organization named in the text, only when stated"},
                "role": {"type": "string", "description": "Job title named in the text, only when stated"},
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "phone": {"type": "string", "description": "Phone number as written in the text"},
                "email": {"type": "string"},
            },
            "required": ["first_name", "phone"],
        },
    },
    "meeting_request": {
        "label": "Meeting request",
        "description": "Title, date, time, attendees from an e-mail or message.",
        "record_description": "Record the details of one meeting request.",
        "schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Meeting subject"},
                "date": {"type": "string",
                         "description": "Meeting date in YYYY-MM-DD format, for example 2026-10-01"},
                "start_time": {"type": "string",
                               "description": "Start time in HH:MM 24-hour format, for example 10:30"},
                "duration_minutes": {"type": "integer", "minimum": 5, "maximum": 480,
                                     "description": "Only when stated"},
                "location": {"type": "string", "description": "Room or call link, only when stated"},
                "attendees": {"type": "array", "maxItems": 8,
                              "items": {"type": "string",
                                        "description": "Full name as written in the text"},
                              "description": "Participant names, only when stated"},
            },
            "required": ["title", "date", "start_time"],
        },
    },
    "support_ticket": {
        "label": "Support ticket",
        "description": "Classification of a customer message: category, priority, summary.",
        "record_description": "Record the classification of one customer support message.",
        "schema": {
            "type": "object",
            "properties": {
                "customer_name": {"type": "string"},
                "order_id": {"type": "string", "description": "Only when stated"},
                "category": {"type": "string", "enum": ["billing", "shipping", "product", "other"],
                             "description": "billing: payment or invoice issue; shipping: delivery problem; "
                                            "product: the product is faulty, broken or unusable; other: anything else"},
                "priority": {"type": "string", "enum": ["low", "medium", "high"],
                             "description": "Urgency: high when money is lost or the product is unusable"},
                "summary": {"type": "string", "description": "One-sentence summary of the problem"},
            },
            "required": ["customer_name", "category", "priority", "summary"],
        },
    },
}
