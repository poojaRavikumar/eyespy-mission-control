export default async function handler(req, res) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'HUBSPOT_ACCESS_TOKEN not set' });
  }

  try {
    // Fetch last 5 sent marketing emails
    const emailRes = await fetch(
      'https://api.hubapi.com/marketing/v3/emails?state=SENT&limit=5&sort=-publishDate',
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      // marketing-email scope not available — return graceful empty
      if (emailRes.status === 403) {
        return res.status(200).json({
          objects: [],
          _note: 'Marketing email access not available for this token'
        });
      }
      return res.status(emailRes.status).json({ error: emailData.message || 'HubSpot API error' });
    }

    const emails = emailData.objects || emailData.results || [];

    // Fetch stats for each email
    const withStats = await Promise.all(
      emails.slice(0, 5).map(async (email) => {
        try {
          const statsRes = await fetch(
            `https://api.hubapi.com/marketing/v3/emails/${email.id}/statistics/histogram?interval=TOTAL`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const totals = statsData?.data?.[0] || {};
            return {
              ...email,
              stats: {
                delivered:  totals.delivered  ?? null,
                openRate:   totals.openRate   ?? null,
                clickRate:  totals.clickRate  ?? null,
              }
            };
          }
        } catch {}
        // Fallback: try the simple stats endpoint
        try {
          const s2 = await fetch(
            `https://api.hubapi.com/email/public/v1/campaigns/${email.id}?appId=113`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (s2.ok) {
            const sd = await s2.json();
            const counters = sd.counters || {};
            const sent = counters.sent || 1;
            return {
              ...email,
              stats: {
                delivered: counters.delivered ?? null,
                openRate:  counters.open   ? counters.open   / sent : null,
                clickRate: counters.click  ? counters.click  / sent : null,
              }
            };
          }
        } catch {}
        return { ...email, stats: { delivered: null, openRate: null, clickRate: null } };
      })
    );

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ objects: withStats });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
