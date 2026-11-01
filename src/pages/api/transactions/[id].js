import sql from '../../../lib/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE({ params }) {
  try {
    const { id } = params || {};

    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or missing transaction ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transactionId = id.trim();

    const result = await sql`
      DELETE FROM transactions
      WHERE id = ${transactionId}
      RETURNING id
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Transaction deleted' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
