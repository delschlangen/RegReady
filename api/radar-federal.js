export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const url = `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=artificial+intelligence&conditions[publication_date][gte]=${dateStr}&per_page=20&order=newest`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Federal Register API returned ${response.status}`);
    }

    const data = await response.json();

    const items = (data.results || []).map((doc) => ({
      id: `fed-${doc.document_number}`,
      jurisdiction: 'United States (Federal)',
      jurisdictionType: 'US Federal',
      title: doc.title,
      status: doc.type || 'Notice',
      date: doc.publication_date,
      url: doc.html_url,
      abstract: doc.abstract || '',
      agencies: (doc.agencies || []).map((a) => a.name),
      source: 'federal-register',
      summary: null,
      relevance: null,
      productImpact: null,
    }));

    return res.status(200).json(items);
  } catch (error) {
    console.error('Federal Register API error:', error);
    return res.status(502).json({
      error: 'Failed to fetch federal register data',
      details: error.message,
    });
  }
}
