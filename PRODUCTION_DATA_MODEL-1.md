# Recommended production data model

users
roles
permissions
sessions
registration_requests
customers
quotes
quote_versions
quote_assignments
quote_approvals
products
calculator_versions
calculator_test_cases
insurance_conditions
underwriting_rules
rule_versions
quotation_templates
documents
audit_logs
security_events
notifications
renewals

## Critical rule
Insurance rules, calculator versions, and published quotation templates are versioned.
A quote stores the exact versions used to produce it, so historical quotes remain reproducible after future rule changes.
