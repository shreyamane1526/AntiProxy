import { Check } from "lucide-react"

export default function VerificationStep({ step, title, active, done, last = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
          done ? "bg-success text-white" : active ? "bg-teal text-white" : "bg-border text-muted"
        }`}
      >
        {done ? <Check size={16} /> : step}
      </div>
      <p className={`text-sm font-medium ${active || done ? "text-navy" : "text-muted"}`}>{title}</p>
      {!last ? <div className="hidden h-px flex-1 bg-border sm:block" /> : null}
    </div>
  )
}
