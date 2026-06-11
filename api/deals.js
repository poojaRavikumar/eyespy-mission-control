export default async function handler(req, res) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'HUBSPOT_ACCESS_TOKEN not set' });
  }

  try {
    // Fetch deals from the default pipeline with the fields we need
    const url = new URL('https://api.hubapi.com/crm/v3/objects/deals');
    url.searchParams.set('limit', '100');
    url.searchParams.set('properties', 'dealname,amount,createdate,closedate,dealstage,pipeline');
    url.searchParams.set('filterGroups', JSON.stringify([{
      filters: [{ propertyName: 'pipeline', operator: 'EQ', value: 'default' }]
    }]));

    // Use search endpoint for filtering
    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: 'pipeline', operator: 'EQ', value: 'default' }]
        }],
        properties: ['dealname', 'amount', 'createdate', 'closedate', 'dealstage'],
        limit: 100,
        sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }]
      })
    });

    const data = await searchRes.json();

    if (!searchRes.ok) {
      return res.status(searchRes.status).json({ error: data.message || 'HubSpot API error' });
    }

    // Map dealstage IDs to readable labels
    // These are the stage names Eye Spy uses — adjust if HubSpot returns internal IDs
    const STAGE_MAP = {
      'proposalstarted':   'Proposal Started',
      'proposal_started':  'Proposal Started',
      'proposalsubmitted': 'Proposal Submitted',
      'proposal_submitted':'Proposal Submitted',
      'awarded':           'Awarded / Active',
      'active':            'Awarded / Active',
      'awardedactive':     'Awarded / Active',
      'awarded_active':    'Awarded / Active',
    };

    const results = (data.results || []).map(deal => {
      const raw = (deal.properties?.dealstage || '').toLowerCase().replace(/\s/g, '');
      const label = STAGE_MAP[raw] || deal.properties?.dealstage || 'Other';
      return {
        ...deal,
        properties: {
          ...deal.properties,
          dealstage_label: label,
        }
      };
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ results });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
