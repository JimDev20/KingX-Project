interface Props {
  value: string
  onChange: (value: string) => void
  className?: string
}

const CARRIERS = [
  { value: 'att', label: 'AT&T (number@txt.att.net)' },
  { value: 'verizon', label: 'Verizon (number@vtext.com)' },
  { value: 'tmobile', label: 'T-Mobile (number@tmomail.net)' },
  { value: 'sprint', label: 'Sprint (number@messaging.sprintpcs.com)' },
  { value: 'googlefi', label: 'Google Fi (number@msg.fi.google.com)' },
  { value: 'cricket', label: 'Cricket (number@mms.cricketwireless.net)' },
  { value: 'boost', label: 'Boost Mobile (number@sms.myboostmobile.com)' },
  { value: 'uscellular', label: 'US Cellular (number@email.uscc.net)' },
]

export default function SmsCarrierSelect({ value, onChange, className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${className}`}
    >
      <option value="">Select carrier</option>
      {CARRIERS.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  )
}
