# API Notes

The API is responsible for:

- workspace and specification CRUD
- comments, approval states, and roadmap entities
- export job orchestration

The API is not responsible for:

- identity lifecycle
- file blob storage
- direct email delivery

## Current technical pressure

- keep the domain model simple enough for MVP
- avoid coupling roadmap and approval flow so tightly that v1 changes become risky
