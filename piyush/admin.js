// Simple admin UI script
async function fetchBookings() {
    try {
      const res = await fetch('/api/bookings', { credentials: 'same-origin' });
      if (res.status === 401) {
        document.getElementById('tableWrap').innerHTML = '<p>Authentication required. Please sign in with your browser to view this page.</p>';
        return [];
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(err);
      document.getElementById('tableWrap').innerText = 'Error loading bookings.';
      return [];
    }
  }
  
  function renderTable(bookings) {
    if (!bookings.length) {
      document.getElementById('tableWrap').innerHTML = '<p>No bookings yet.</p>';
      return;
    }
    let html = '<table><thead><tr><th></th><th>ID</th><th>Service</th><th>Customer</th><th>Email</th><th>Date</th><th>Time</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>';
    for (const b of bookings) {
      const statusClass = b.status === 'paid' ? 'status-paid' : (b.status === 'pending' ? 'status-pending' : 'status-cancel');
      html += `<tr>
        <td><input type="checkbox" data-id="${b.id}"></td>
        <td>${b.id}</td>
        <td>${escapeHtml(b.serviceName)} (${b.serviceId})</td>
        <td>${escapeHtml(b.customerName)}</td>
        <td>${escapeHtml(b.email)}</td>
        <td>${escapeHtml(b.date)}</td>
        <td>${escapeHtml(b.time)}</td>
        <td>${(b.amount_cents/100).toFixed(2)} ${b.currency || 'usd'}</td>
        <td class="${statusClass}">${escapeHtml(b.status)}</td>
        <td>${escapeHtml(b.created_at)}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tableWrap').innerHTML = html;
  }
  
  function escapeHtml(s) {
    if (!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  
  async function refresh() {
    document.getElementById('tableWrap').innerText = 'Loading...';
    const bookings = await fetchBookings();
    renderTable(bookings);
  }
  
  async function updateSelectedStatus(status) {
    const checks = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    if (!checks.length) return alert('Select bookings first');
    for (const c of checks) {
      const id = c.dataset.id;
      try {
        await fetch(`/api/bookings/${id}/status`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ status })
        });
      } catch (err) {
        console.error('Update failed', err);
      }
    }
    await refresh();
  }
  
  document.getElementById('refreshBtn').addEventListener('click', refresh);
  document.getElementById('markPaidBtn').addEventListener('click', () => updateSelectedStatus('paid'));
  document.getElementById('markCancelBtn').addEventListener('click', () => updateSelectedStatus('canceled'));
  
  // Initial load
  refresh();