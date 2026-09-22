import { ConfirmedBookingDetail } from '../types';

/**
 * Generates an official, beautifully styled print-ready E-Ticket HTML document
 * that can be downloaded and saved directly as PDF via browser print.
 */
export function generateTicketHtml(booking: ConfirmedBookingDetail): string {
  const seatLabels = booking.seats.map(s => `${s.row}${s.number} (${s.tier})`).join(', ');
  const mealsList = booking.meals.length > 0
    ? booking.meals.map(m => `<li>${m.quantity}x ${m.meal.name} - ₹${m.meal.price * m.quantity}</li>`).join('')
    : '<li>No snacks selected</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>E-Ticket: ${booking.event.name} - ${booking.bookingCode}</title>
  <style>
    @media print {
      body { margin: 0; background: #fff; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .ticket-container {
      background: #ffffff;
      width: 100%;
      max-width: 650px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid #e2e8f0;
    }
    .ticket-header {
      background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
      color: #ffffff;
      padding: 24px 30px;
      position: relative;
    }
    .brand-tag {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 700;
      opacity: 0.9;
    }
    .movie-title {
      font-size: 24px;
      font-weight: 800;
      margin: 8px 0 4px 0;
    }
    .movie-meta {
      font-size: 13px;
      opacity: 0.9;
    }
    .ticket-body {
      padding: 30px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px 24px;
      margin-bottom: 24px;
    }
    .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 3px;
    }
    .highlight {
      color: #e11d48;
      font-size: 17px;
    }
    .perforation {
      border-top: 2px dashed #cbd5e1;
      position: relative;
      margin: 20px 0;
    }
    .perforation::before, .perforation::after {
      content: '';
      position: absolute;
      top: -12px;
      width: 24px;
      height: 24px;
      background: #0f172a;
      border-radius: 50%;
    }
    .perforation::before { left: -42px; }
    .perforation::after { right: -42px; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-bottom: 8px;
    }
    .meals-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #334155;
    }
    .footer-bar {
      background: #f8fafc;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .barcode-area {
      font-family: monospace;
      font-size: 24px;
      letter-spacing: 6px;
      font-weight: 900;
      background: #0f172a;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 6px;
      display: inline-block;
    }
    .print-button {
      background: #e11d48;
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }
    .print-button:hover { background: #be123c; }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="ticket-header">
      <div class="brand-tag">CinePulse / District Tickets • Official Cinema Pass</div>
      <div class="movie-title">${booking.event.name}</div>
      <div class="movie-meta">${booking.event.genre || 'Cinema Experience'} • ${booking.event.format || 'Standard'} • ${booking.event.duration || '2h'}</div>
    </div>

    <div class="ticket-body">
      <div class="grid">
        <div>
          <div class="label">Date & Showtime</div>
          <div class="value">${booking.dateStr} • ${booking.timeStr}</div>
        </div>
        <div>
          <div class="label">Auditorium / Screen</div>
          <div class="value">${booking.venueName}</div>
        </div>
        <div>
          <div class="label">Confirmed Seats (${booking.seats.length})</div>
          <div class="value highlight">${seatLabels}</div>
        </div>
        <div>
          <div class="label">Attendee Name</div>
          <div class="value">${booking.user.name} (${booking.user.email})</div>
        </div>
      </div>

      <div class="perforation"></div>

      <div class="section-title">Food & Beverages Summary</div>
      <ul class="meals-list">
        ${mealsList}
      </ul>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; background: #f1f5f9; padding: 14px 18px; border-radius: 10px;">
        <div>
          <div class="label">Payment Status</div>
          <div style="font-size: 14px; font-weight: 700; color: #16a34a; margin-top: 2px;">PAID via ${booking.paymentMethod}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Ref: ${booking.bookingCode} • ${booking.bookingTime}</div>
        </div>
        <div style="text-align: right;">
          <div class="label">Total Paid</div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a;">₹${booking.totalAmount.toLocaleString()}</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>
        <div class="barcode-area">||| | | |||| | ||| | ||</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Gate Code: ${booking.bookingCode}</div>
      </div>
      <button class="print-button no-print" onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads a printable HTML e-ticket file to the user's computer.
 */
export function downloadTicketAsHtml(booking: ConfirmedBookingDetail): void {
  const htmlContent = generateTicketHtml(booking);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CinePulse-Ticket-${booking.bookingCode}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean text-based receipt of the seat details and showtime.
 */
export function downloadTicketAsText(booking: ConfirmedBookingDetail): void {
  const seatLabels = booking.seats.map(s => `${s.row}${s.number} (${s.tier} - ₹${s.price})`).join(', ');
  const mealsText = booking.meals.length > 0
    ? booking.meals.map(m => `  * ${m.quantity}x ${m.meal.name} (₹${m.meal.price * m.quantity})`).join('\n')
    : '  * None selected';

  const textContent = `=====================================================
          CINEPULSE / DISTRICT TICKETING
              OFFICIAL BOOKING PASS
=====================================================

Booking Code : ${booking.bookingCode}
Status       : CONFIRMED & PAID
Event        : ${booking.event.name}
Venue        : ${booking.venueName}
Date & Time  : ${booking.dateStr} at ${booking.timeStr}
Format       : ${booking.event.format || 'Standard'} (${booking.event.language || 'Original'})

-----------------------------------------------------
SEAT DETAILS
-----------------------------------------------------
Total Seats  : ${booking.seats.length}
Seats        : ${seatLabels}

-----------------------------------------------------
SNACKS & MEALS
-----------------------------------------------------
${mealsText}

-----------------------------------------------------
BILLING SUMMARY
-----------------------------------------------------
Ticket Subtotal : ₹${booking.ticketSubtotal.toLocaleString()}
Meals Subtotal  : ₹${booking.mealsSubtotal.toLocaleString()}
Convenience Fee : ₹${booking.convenienceFee}
Taxes (GST)     : ₹${booking.taxes}
-----------------------------------------------------
TOTAL AMOUNT    : ₹${booking.totalAmount.toLocaleString()}
Payment Method  : ${booking.paymentMethod}
Booked At       : ${booking.bookingTime}
Booked By       : ${booking.user.name} (${booking.user.email})

=====================================================
Please display this ticket at the cinema gate / usher.
=====================================================`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CinePulse-Ticket-${booking.bookingCode}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
