const CARRIER_GATEWAYS: Record<string, string> = {
  att: 'txt.att.net',
  verizon: 'vtext.com',
  tmobile: 'tmomail.net',
  sprint: 'messaging.sprintpcs.com',
  googlefi: 'msg.fi.google.com',
  cricket: 'mms.cricketwireless.net',
  boost: 'sms.myboostmobile.com',
  uscellular: 'email.uscc.net',
}

export function getSmsEmail(phone: string, carrier: string): string | null {
  const domain = CARRIER_GATEWAYS[carrier]
  if (!domain) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  return `${digits}@${domain}`
}

export async function sendSms(phone: string, carrier: string, message: string): Promise<boolean> {
  const email = getSmsEmail(phone, carrier)
  if (!email) {
    console.warn(`[SMS] Invalid phone/carrier: ${phone}/${carrier}`)
    return false
  }
  // In production, this would use nodemailer or an SMS API
  // For now, just log the SMS that would be sent
  console.log(`[SMS] To: ${email} (${carrier}) - ${message}`)
  return true
}
