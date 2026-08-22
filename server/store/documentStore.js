// store/documentStore.js — all SQL related to the provider_documents table.
import { query } from '../db.js';

export async function addDocument(providerId, documentType, fileUrl) {
  const { rows } = await query(
    `INSERT INTO provider_documents (provider_id, document_type, file_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [providerId, documentType, fileUrl]
  );
  return rows[0];
}

export async function listDocumentsForProvider(providerId) {
  const { rows } = await query(
    `SELECT * FROM provider_documents WHERE provider_id = $1 ORDER BY uploaded_at DESC`,
    [providerId]
  );
  return rows;
}
