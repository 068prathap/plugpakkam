import 'server-only';

export async function sendOtpSms(phone, code) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[otp] ${phone}: ${code}`);
      return true;
    }
    console.error('FAST2SMS_API_KEY is missing');
    return false;
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'otp', variables_values: code, numbers: phone }),
    });
    const data = await response.json();
    if (data.return !== true) console.error('Fast2SMS error', data);
    return data.return === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
