import sql from '../../lib/db.js';

export async function POST({ request }) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { amount, type, category_id, transaction_date, note } = body || {};

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Amount must be a valid positive number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const amount_cents = Math.round(parsedAmount * 100);
    if (!Number.isSafeInteger(amount_cents) || amount_cents <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount value' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate type
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return new Response(
        JSON.stringify({ success: false, error: "Type must be either 'INCOME' or 'EXPENSE'" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate category_id
    if (!category_id || typeof category_id !== 'string' || category_id.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Category is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate transaction_date
    if (!transaction_date || typeof transaction_date !== 'string' || transaction_date.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction date is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trimmedNote = typeof note === 'string' && note.trim().length > 0 ? note.trim() : null;

    // Insert transaction into database
    const [insertedRow] = await sql`
      INSERT INTO transactions (amount_cents, type, category_id, transaction_date, note)
      VALUES (${amount_cents}, ${type}::transaction_type, ${category_id.trim()}, ${transaction_date.trim()}, ${trimmedNote})
      RETURNING *
    `;

    return new Response(
      JSON.stringify({ success: true, transaction: insertedRow }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error creating transaction:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
