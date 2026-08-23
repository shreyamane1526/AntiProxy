import { initials } from "../utils/attendance"

export default function Avatar({ name, src, size = "md", tone = "light" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  }
  const tones = {
    light: "bg-teal/15 text-teal-dark",
    dark: "bg-teal/20 text-teal",
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Profile photo"}
        className={`shrink-0 rounded-full object-cover ${sizes[size]}`}
      />
    )
  }

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizes[size]} ${tones[tone]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
