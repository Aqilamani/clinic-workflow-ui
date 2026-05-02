import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  User, Mail, Phone, Briefcase, MapPin, Lock, Bell, Shield,
  LogOut, Camera, Check, Eye, EyeOff,
} from "lucide-react"
import { useToastStore } from "../store/useToastStore"
import { useAuthStore } from "../store/useAuthStore"
import { updateProfile, updatePassword } from "../api/profiles"

const ROLE_LABELS = {
  manager: "Clinic Manager",
  doctor: "Doctor",
  nurse: "Nurse",
  lab_tech: "Lab Technician",
  receptionist: "Receptionist",
  pharmacy: "Pharmacy",
  staff: "Staff",
}

function titleCase(s) {
  if (!s) return ""
  return s.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

function getInitials(name) {
  if (!name) return "?"
  const cleaned = titleCase(name).replace(/^Dr\.?\s+/i, "").trim()
  const words = cleaned.split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// ─── Reusable bits ────────────────────────────────────────────────────────────

function SectionCard({ eyebrow, title, description, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
    >
      <div className="px-6 pt-5 pb-4 border-b border-stone-100 bg-stone-50/50">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500 mb-1">
          {eyebrow}
        </p>
        <h2
          className="text-xl font-bold text-stone-900 leading-tight"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-[12px] text-stone-500 mt-1">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </motion.section>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-[0.18em] mb-1.5">
        {Icon && <Icon size={10} />}
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  )
}

const inputClass =
  "w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[13px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-400 focus:shadow-sm transition-all"

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-[#0d3a3a]" : "bg-stone-300"
      }`}
    >
      <motion.span
        animate={{ x: checked ? 18 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="inline-block h-4 w-4 rounded-full bg-white shadow"
      />
    </button>
  )
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-stone-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-stone-900">{title}</p>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Profile() {
  const addToast = useToastStore((s) => s.addToast)
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)
  const signOut = useAuthStore((s) => s.signOut)

  const [form, setForm] = useState({ full_name: "", role: "staff", phone: "" })
  const [notif, setNotif] = useState({
    notif_urgent_escalations: true,
    notif_pending_reviews: true,
    notif_daily_summary: false,
    notif_product_updates: false,
    two_factor_enabled: false,
  })
  const [password, setPassword] = useState({ next: "", confirm: "" })
  const [showNext, setShowNext] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        role: profile.role || "staff",
        phone: profile.phone || "",
      })
      setNotif({
        notif_urgent_escalations: profile.notif_urgent_escalations,
        notif_pending_reviews: profile.notif_pending_reviews,
        notif_daily_summary: profile.notif_daily_summary,
        notif_product_updates: profile.notif_product_updates,
        two_factor_enabled: profile.two_factor_enabled,
      })
    }
  }, [profile])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const updated = await updateProfile(form)
      setProfile(updated)
      addToast("success", "Profile updated")
    } catch (err) {
      addToast("warn", err.message || "Update failed")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!password.next || !password.confirm) {
      return addToast("warn", "Please fill in both password fields")
    }
    if (password.next !== password.confirm) {
      return addToast("warn", "Passwords don't match")
    }
    if (password.next.length < 6) {
      return addToast("warn", "Password must be at least 6 characters")
    }
    setSavingPassword(true)
    try {
      await updatePassword(password.next)
      setPassword({ next: "", confirm: "" })
      addToast("success", "Password updated")
    } catch (err) {
      addToast("warn", err.message || "Update failed")
    } finally {
      setSavingPassword(false)
    }
  }

  const handleNotifToggle = async (key, value) => {
    const prev = notif[key]
    setNotif({ ...notif, [key]: value })
    try {
      const updated = await updateProfile({ [key]: value })
      setProfile(updated)
    } catch {
      setNotif({ ...notif, [key]: prev })
      addToast("warn", "Failed to save")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      addToast("warn", "Failed to sign out")
    }
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto w-full flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-[#0d3a3a] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-12 space-y-6">
      {/* Editorial header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-2">
          Settings · {ROLE_LABELS[profile.role]}
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-stone-900 leading-[1.05] tracking-tight"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
        >
          <span className="italic font-light text-stone-500">Your</span> profile
        </h1>
      </motion.div>

      {/* Identity card — editorial cover */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative"
      >
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-[#0d3a3a] via-[#0a4747] to-[#082929] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-orange-500 opacity-15 blur-3xl" />
        </div>

        <div className="px-6 pb-6 -mt-14">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0d3a3a] to-[#082929] ring-4 ring-white flex items-center justify-center text-white text-2xl shadow-lg"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700 }}
              >
                {getInitials(profile.full_name)}
              </div>
              <button
                onClick={() => addToast("info", "Photo upload — coming soon")}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-600 hover:text-[#0d3a3a] hover:border-stone-400 shadow-sm transition-colors"
                title="Change photo"
              >
                <Camera size={12} />
              </button>
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <h2
                className="text-2xl font-bold text-stone-900 leading-tight truncate"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" }}
              >
                {titleCase(profile.full_name)}
              </h2>
              <p className="text-[13px] text-stone-500 mt-1 flex items-center gap-2">
                <span>{ROLE_LABELS[profile.role]}</span>
                <span className="text-stone-300">·</span>
                <span>Klinik Sejahtera PJ</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2.5">
                {user?.email_confirmed_at && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    <Check size={9} />
                    Verified
                  </span>
                )}
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-200">
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Personal information */}
      <SectionCard
        eyebrow="Personal information"
        title="Your details"
        description="Visible to staff across the clinic"
        delay={0.1}
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name" icon={User}>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Role" icon={Briefcase}>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass + " appearance-none cursor-pointer pr-9"}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a8a29e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.25em",
                }}
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Email" icon={Mail}>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className={inputClass + " opacity-60 cursor-not-allowed"}
              />
            </Field>
            <Field label="Phone" icon={Phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+60 12-345 6789"
                className={inputClass}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Clinic" icon={MapPin}>
                <input
                  type="text"
                  value="Klinik Sejahtera PJ"
                  disabled
                  className={inputClass + " opacity-60 cursor-not-allowed"}
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-100">
            <motion.button
              type="submit"
              disabled={savingProfile}
              whileTap={!savingProfile ? { scale: 0.98 } : {}}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                savingProfile
                  ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0d3a3a] to-[#082929] text-white shadow-md hover:shadow-lg"
              }`}
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </motion.button>
          </div>
        </form>
      </SectionCard>

      {/* Security */}
      <SectionCard
        eyebrow="Security"
        title="Password & two-factor"
        description="Protect access to your account"
        delay={0.18}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="New password" icon={Lock}>
              <input
                type={showNext ? "text" : "password"}
                value={password.next}
                onChange={(e) => setPassword({ ...password, next: e.target.value })}
                placeholder="At least 6 characters"
                className={inputClass + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowNext(!showNext)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </Field>
            <Field label="Confirm new password" icon={Lock}>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                placeholder="Re-enter password"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-100">
            <motion.button
              type="submit"
              disabled={savingPassword}
              whileTap={!savingPassword ? { scale: 0.98 } : {}}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                savingPassword
                  ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0d3a3a] to-[#082929] text-white shadow-md hover:shadow-lg"
              }`}
            >
              {savingPassword ? "Updating…" : "Update password"}
            </motion.button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100">
          <ToggleRow
            title="Two-factor authentication"
            description="Add an extra layer of security with a code from your authenticator app"
            checked={notif.two_factor_enabled}
            onChange={(v) => handleNotifToggle("two_factor_enabled", v)}
          />
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard
        eyebrow="Notifications"
        title="What you'd like to know about"
        description="Toggle in real time — saves automatically"
        delay={0.26}
      >
        <div className="-my-3.5">
          <ToggleRow
            title="Urgent escalations"
            description="Walk-ins flagged as urgent and AI-detected critical cases"
            checked={notif.notif_urgent_escalations}
            onChange={(v) => handleNotifToggle("notif_urgent_escalations", v)}
          />
          <ToggleRow
            title="Pending reviews"
            description="Workflows requiring your approval or human intervention"
            checked={notif.notif_pending_reviews}
            onChange={(v) => handleNotifToggle("notif_pending_reviews", v)}
          />
          <ToggleRow
            title="Daily summary"
            description="End-of-day report with workflow stats and unresolved items"
            checked={notif.notif_daily_summary}
            onChange={(v) => handleNotifToggle("notif_daily_summary", v)}
          />
          <ToggleRow
            title="Product updates"
            description="New features, GLM model improvements, and tips"
            checked={notif.notif_product_updates}
            onChange={(v) => handleNotifToggle("notif_product_updates", v)}
          />
        </div>
      </SectionCard>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.34 }}
        className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-stone-500 mb-1">
            Session
          </p>
          <h3
            className="text-[15px] font-semibold text-stone-900"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            End your session on this device
          </h3>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
        >
          <LogOut size={13} /> Sign out
        </button>
      </motion.div>
    </div>
  )
}