export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get current date
    const today = new Date();
    const month = today.toLocaleString('en-US', { month: 'long' });
    const day = today.getDate();

    // --- CALL OPENAI INSTEAD OF ANTHROPIC ---
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        temperature: 0.9,
        messages: [
          {
            role: "user",
            content: `Give me 3 interesting historical events that happened on ${month} ${day}. Format each as: "YEAR: Brief description (1-2 sentences)". Make them diverse and fascinating. Include different types of events (science, politics, culture, sports, etc.). Each time give me DIFFERENT events - be creative and find lesser-known interesting facts!`
          }
        ]
      }),
    });

    const data = await response.json();

    const historyText =
      data?.choices?.[0]?.message?.content?.trim() ||
      "No history available today.";

    // Generate image with the history text
    const imageUrl = await generateHistoryImage(historyText, month, day);

    // Return Farcaster frame response
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="🔄 More History!" />
    <meta property="fc:frame:button:2" content="Share" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://${req.headers.host}" />
    <meta property="fc:frame:post_url" content="https://${req.headers.host}/api/history" />
</head>
<body></body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error:', error);

    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="https://${req.headers.host}/splash.png" />
    <meta property="fc:frame:button:1" content="Try Again" />
    <meta property="fc:frame:post_url" content="https://${req.headers.host}/api/history" />
</head>
<body></body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(errorHtml);
  }
}

async function generateHistoryImage(text, month, day) {
  const encodedText = encodeURIComponent(text);
  const title = encodeURIComponent(`${month} ${day} in History`);

  return `https://og-image.vercel.app/${title}.png?theme=light&md=1&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-black.svg&widths=250&heights=250`;
}
