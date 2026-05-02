import { useState, useEffect } from "react"
import {
  User, Mail, Phone, Briefcase, MapPin, Lock, Bell, Shield,
  LogOut, Camera, Check, Eye, EyeOff,
} from "lucide-react"
import { useToastStore } from "../store/useToastStore"
import { useAuthStore } from "../store/useAuthStore"
import { updateProfile, updatePassword } from "../api/profiles"

// ─── Reusable bits ────────────────────────────────────────────────────────────

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        )}
        {children}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  )
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// Compute initials from a full name (e.g. "Dr. Siti Rahimah" → "SR")
function getInitials(name) {
  if (!name) return "?"
  const words = name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// Role enum → display label
const ROLE_LABELS = {
  manager: "Clinic Manager",
  doctor: "Doctor",
  nurse: "Nurse",
  lab_tech: "Lab Technician",
  receptionist: "Receptionist",
  pharmacy: "Pharmacy",
  staff: "Staff",
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Profile() {
  const addToast = useToastStore((s) => s.addToast)
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)
  const signOut = useAuthStore((s) => s.signOut)

  // Form state — initialized from profile, edited locally, saved on submit
  const [form, setForm] = useState({
    full_name: "",
    role: "staff",
    phone: "",
  })

  // Notification prefs (separate from form because they auto-save on toggle)
  const [notif, setNotif] = useState({
    notif_urgent_escalations: true,
    notif_pending_reviews: true,
    notif_daily_summary: false,
    notif_product_updates: false,
    two_factor_enabled: false,
  })

  // Password state
  const [password, setPassword] = useState({ next: "", confirm: "" })
  const [showNext, setShowNext] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Hydrate form when profile loads/changes
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
      addToast("success", "Profile updated successfully")
    } catch (err) {
      addToast("warn", err.message || "Failed to update profile")
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
      return addToast("warn", "New passwords do not match")
    }
    if (password.next.length < 6) {
      return addToast("warn", "Password must be at least 6 characters")
    }

    setSavingPassword(true)
    try {
      await updatePassword(password.next)
      setPassword({ next: "", confirm: "" })
      addToast("success", "Password changed successfully")
    } catch (err) {
      addToast("warn", err.message || "Failed to update password")
    } finally {
      setSavingPassword(false)
    }
  }

  // Toggling a notification preference saves immediately (no Save button)
  const handleNotifToggle = async (key, value) => {
    const prev = notif[key]
    setNotif({ ...notif, [key]: value })  // optimistic update
    try {
      const updated = await updateProfile({ [key]: value })
      setProfile(updated)
    } catch (err) {
      setNotif({ ...notif, [key]: prev })  // rollback
      addToast("warn", "Failed to save preference")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // App.jsx will auto-route to Auth page when session becomes null
    } catch (err) {
      addToast("warn", "Failed to sign out")
    }
  }

  const inputClass =
    "w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"

  // Show a loading state if profile hasn't loaded yet
  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto w-full flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Profile & Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal information, security, and notification preferences.
          </p>
        </div>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#111827] h-24" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-blue-600 ring-4 ring-white flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getInitials(profile.full_name)}
              </div>
              <button
                onClick={() => addToast("info", "Photo upload — coming soon")}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors"
                title="Change photo"
              >
                <Camera size={13} />
              </button>
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-lg font-bold text-slate-900">{profile.full_name}</h2>
              <p className="text-sm text-slate-500">
                {ROLE_LABELS[profile.role] || profile.role} · Klinik Sejahtera PJ
              </p>
              <div className="flex items-center gap-2 mt-2">
                {user?.email_confirmed_at && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <Check size={10} /> Verified
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {ROLE_LABELS[profile.role] || profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <SectionCard
        title="Personal Information"
        description="Your details visible to staff across the clinic"
        icon={User}
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" icon={User}>
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
                className={inputClass + " appearance-none cursor-pointer"}
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Email Address" icon={Mail}>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className={inputClass + " opacity-60 cursor-not-allowed"}
              />
            </Field>
            <Field label="Phone Number" icon={Phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Security */}
      <SectionCard
        title="Security"
        description="Password and two-factor authentication"
        icon={Shield}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="New Password" icon={Lock}>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>
            <Field label="Confirm New Password" icon={Lock}>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                placeholder="Re-enter new password"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-60"
            >
              {savingPassword ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <ToggleRow
            title="Two-Factor Authentication"
            description="Add an extra layer of security with a code from your authenticator app"
            checked={notif.two_factor_enabled}
            onChange={(v) => handleNotifToggle("two_factor_enabled", v)}
          />
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard
        title="Notification Preferences"
        description="Choose what you'd like to be notified about"
        icon={Bell}
      >
        <div className="-my-3">
          <ToggleRow
            title="Urgent Escalations"
            description="Walk-ins flagged as urgent and AI-detected critical cases"
            checked={notif.notif_urgent_escalations}
            onChange={(v) => handleNotifToggle("notif_urgent_escalations", v)}
          />
          <ToggleRow
            title="Pending Reviews"
            description="Workflows requiring your approval or human intervention"
            checked={notif.notif_pending_reviews}
            onChange={(v) => handleNotifToggle("notif_pending_reviews", v)}
          />
          <ToggleRow
            title="Daily Summary"
            description="End-of-day report with workflow stats and unresolved items"
            checked={notif.notif_daily_summary}
            onChange={(v) => handleNotifToggle("notif_daily_summary", v)}
          />
          <ToggleRow
            title="Product Updates"
            description="New features, GLM model improvements, and tips"
            checked={notif.notif_product_updates}
            onChange={(v) => handleNotifToggle("notif_product_updates", v)}
          />
        </div>
      </SectionCard>

      {/* Sign out */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Sign out</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            End your session on this device.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-red-50 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  )
}