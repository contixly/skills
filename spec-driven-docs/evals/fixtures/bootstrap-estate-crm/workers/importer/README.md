# Import Worker

The importer normalizes listing feeds into the internal listing model.

## Responsibilities

- poll partner sources
- map partner fields to internal listing attributes
- flag broken or incomplete records for manual review

## Non-responsibilities

- CRM pipeline stage changes
- invoicing
- user authentication

## Operational note

During MVP the worker may run on a simple schedule, but duplicate imports must still be avoided.
