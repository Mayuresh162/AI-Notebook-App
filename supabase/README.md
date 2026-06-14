# Supabase Production Updates

Review `supabase/schema.sql` and apply it manually in Supabase SQL editor or
your migration tool. The application does not run schema changes automatically.

Before production launch:

- Confirm `vector` and `pgcrypto` extensions are enabled.
- Confirm `documents.embedding` dimensions match `OPENAI_EMBEDDING_MODEL`.
- Confirm `consume_usage_limit`, `match_documents`, and
  `delete_documents_by_names` execute only through the server service role.
- Confirm RLS blocks cross-user reads/writes for documents, integrations,
  threads, and messages.
- Use separate Supabase projects for local/staging/production where possible,
  and set `DATA_ENV` explicitly in each environment.
