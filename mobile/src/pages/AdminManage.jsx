// mobile/src/pages/AdminManage.jsx
// /admin/users · /admin/listings · /admin/reports
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { getThumbnailUrl, handleImageError } from '../utils/imageUtils';

const PAGE = 25;
const ROLES = ['user', 'vendor', 'admin'];
const LISTING_STATUSES = ['active', 'inactive', 'pending', 'suspended'];

const SECTIONS = [
  { id: 'users', label: 'Users', path: '/admin/users' },
  { id: 'listings', label: 'Listings', path: '/admin/listings' },
  { id: 'reports', label: 'Reports', path: '/admin/reports' },
];

const fmtMK = (n) =>
  new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', maximumFractionDigits: 0 }).format(Number(n) || 0);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* Debounced search value */
const useDebounced = (value, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

const Pager = ({ offset, total, onChange }) => {
  if (total <= PAGE) return null;
  const page = Math.floor(offset / PAGE) + 1;
  const pages = Math.ceil(total / PAGE);
  return (
    <div className="pager">
      <button type="button" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - PAGE))}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button type="button" disabled={offset + PAGE >= total} onClick={() => onChange(offset + PAGE)}>Next</button>
    </div>
  );
};

/* ---------------- Users ---------------- */
const UsersSection = () => {
  const { user: me } = useAuth();
  const { showToast, success } = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ users: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const dq = useDebounced(q);

  useEffect(() => { setOffset(0); }, [dq, role]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminAPI.getUsers({ q: dq || undefined, role: role || undefined, limit: PAGE, offset })
      .then((res) => { if (!cancelled) setData({ users: res.data.users || [], total: res.data.total || 0 }); })
      .catch((err) => { if (!cancelled) showToast(err?.response?.data?.error || 'Failed to load users', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dq, role, offset, showToast]);

  const changeRole = async (u, next) => {
    if (next === u.role) return;
    if (!window.confirm(`Change ${u.email} from ${u.role} to ${next}?`)) return;
    setSavingId(u.id);
    try {
      await adminAPI.setUserRole(u.id, next);
      setData((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, role: next } : x)) }));
      success('Role updated');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to update role', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="toolbar">
        <input className="search" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="meta">{loading ? 'Loading…' : `${data.total.toLocaleString()} users`}</div>
      <div className="list">
        {data.users.map((u) => (
          <div key={u.id} className="row">
            <div className="row-main">
              <div className="row-title">{u.fullName || 'Unnamed user'}</div>
              <div className="row-sub">{u.email}{u.phone ? ` · ${u.phone}` : ''} · joined {fmtDate(u.createdAt)}</div>
            </div>
            <select
              value={u.role || 'user'}
              disabled={savingId === u.id || u.id === me?.id}
              onChange={(e) => changeRole(u, e.target.value)}
              aria-label={`Role for ${u.email}`}
              title={u.id === me?.id ? "You can't change your own role" : undefined}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        ))}
        {!loading && data.users.length === 0 && <p className="empty">No users match.</p>}
      </div>
      <Pager offset={offset} total={data.total} onChange={setOffset} />
    </>
  );
};

/* ---------------- Listings ---------------- */
const ListingsSection = () => {
  const { showToast, success } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ listings: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const dq = useDebounced(q);

  useEffect(() => { setOffset(0); }, [dq, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminAPI.getListings({ q: dq || undefined, status: status || undefined, limit: PAGE, offset })
      .then((res) => { if (!cancelled) setData({ listings: res.data.listings || [], total: res.data.total || 0 }); })
      .catch((err) => { if (!cancelled) showToast(err?.response?.data?.error || 'Failed to load listings', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dq, status, offset, showToast]);

  const changeStatus = async (l, next) => {
    if (next === l.status) return;
    setSavingId(l.id);
    try {
      await adminAPI.setListingStatus(l.id, next);
      setData((d) => ({ ...d, listings: d.listings.map((x) => (x.id === l.id ? { ...x, status: next } : x)) }));
      success(`Listing ${next}`);
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to update listing', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="toolbar">
        <input className="search" placeholder="Search title or business…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {LISTING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="meta">{loading ? 'Loading…' : `${data.total.toLocaleString()} listings`}</div>
      <div className="list">
        {data.listings.map((l) => {
          const img = Array.isArray(l.images) ? l.images.find((s) => /^https?:\/\//.test(s || '')) : null;
          const boosted = l.isPremium && l.premiumUntil && new Date(l.premiumUntil) > new Date();
          return (
            <div key={l.id} className="row">
              <div className="thumb">
                {img ? <img src={getThumbnailUrl(img, { width: 44 })} alt="" onError={handleImageError} /> : null}
              </div>
              <div className="row-main">
                <Link to={`/listing/${l.id}`} className="row-title">{l.title}</Link>
                <div className="row-sub">
                  {l.businessName || 'No business'}
                  {l.price != null ? ` · ${fmtMK(l.price)}` : ''}
                  {` · ${fmtDate(l.createdAt)}`}
                  {boosted ? ` · boosted until ${fmtDate(l.premiumUntil)}` : ''}
                </div>
              </div>
              <select
                className={`status-${l.status}`}
                value={l.status || 'active'}
                disabled={savingId === l.id}
                onChange={(e) => changeStatus(l, e.target.value)}
                aria-label={`Status for ${l.title}`}
              >
                {LISTING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          );
        })}
        {!loading && data.listings.length === 0 && <p className="empty">No listings match.</p>}
      </div>
      <Pager offset={offset} total={data.total} onChange={setOffset} />
    </>
  );
};

/* ---------------- Reports (payments & revenue) ---------------- */
const ReportsSection = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ payments: [], total: 0, byKind: [], byMonth: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { setOffset(0); }, [status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminAPI.getPayments({ status: status || undefined, limit: PAGE, offset })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) showToast(err?.response?.data?.error || 'Failed to load payments', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, offset, showToast]);

  const totalRevenue = (data.byKind || []).reduce((s, k) => s + (Number(k.total) || 0), 0);
  const maxMonth = Math.max(1, ...(data.byMonth || []).map((m) => Number(m.total) || 0));

  return (
    <>
      <div className="summary">
        <div className="summary-card">
          <div className="summary-label">Revenue (all time)</div>
          <div className="summary-value">{fmtMK(totalRevenue)}</div>
        </div>
        {(data.byKind || []).map((k) => (
          <div key={k.kind} className="summary-card">
            <div className="summary-label">{k.kind === 'boost' ? 'Boosts' : 'Subscriptions'}</div>
            <div className="summary-value">{fmtMK(k.total)}</div>
            <div className="summary-sub">{k.n} paid</div>
          </div>
        ))}
      </div>

      {(data.byMonth || []).length > 0 && (
        <div className="months" aria-label="Paid revenue by month, last 12 months">
          {data.byMonth.map((m) => (
            <div key={m.month} className="month">
              <div className="month-amount">{fmtMK(m.total)}</div>
              <div className="month-track">
                <div className="month-bar" style={{ width: `${(Number(m.total) / maxMonth) * 100}%` }} />
              </div>
              <div className="month-label">{m.month}</div>
            </div>
          ))}
        </div>
      )}

      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All payments</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="meta">{loading ? 'Loading…' : `${(data.total || 0).toLocaleString()} payments`}</div>
      <div className="list">
        {(data.payments || []).map((p) => (
          <div key={p.id} className="row">
            <div className="row-main">
              <div className="row-title">
                {p.kind === 'boost' ? `Boost · ${p.durationDays || '?'} days` : `Subscription · ${p.plan}`}
              </div>
              <div className="row-sub">
                {p.userEmail || 'unknown user'} · {p.paymentId} · {fmtDate(p.createdAt)}
                {p.listingId ? <> · <Link to={`/listing/${p.listingId}`}>listing</Link></> : null}
              </div>
            </div>
            <div className="row-end">
              <div className="amount">{fmtMK(p.amount)}</div>
              <span className={`pill pill-${p.status}`}>{p.status}</span>
            </div>
          </div>
        ))}
        {!loading && (data.payments || []).length === 0 && <p className="empty">No payments.</p>}
      </div>
      <Pager offset={offset} total={data.total || 0} onChange={setOffset} />
    </>
  );
};

/* ---------------- Shell ---------------- */
const AdminManage = ({ section = 'users' }) => {
  const navigate = useNavigate();
  const go = useCallback((path) => navigate(path), [navigate]);
  const current = SECTIONS.find((s) => s.id === section) || SECTIONS[0];

  return (
    <div className="admin-manage">
      <div className="inner">
        <Link to="/admin" className="back">← Admin dashboard</Link>
        <h1 className="title">{current.label}</h1>
        <div className="tabs" role="tablist">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === current.id}
              className={`tab ${s.id === current.id ? 'active' : ''}`}
              onClick={() => go(s.path)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {current.id === 'users' && <UsersSection />}
        {current.id === 'listings' && <ListingsSection />}
        {current.id === 'reports' && <ReportsSection />}
      </div>

      <style jsx>{`
        .admin-manage { min-height: 100vh; background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); padding-bottom: 80px; }
        .inner { max-width: 960px; margin: 0 auto; padding: 20px 16px 40px; }
        .back { font-size: 13px; color: var(--color-text-muted); text-decoration: none; }
        .title { font-family: var(--font-serif); font-size: 24px; font-weight: 600; margin: 8px 0 14px; }
        .tabs { display: flex; gap: 6px; margin-bottom: 16px; overflow-x: auto; }
        .tab { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .tab.active { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-text-inverse); }

        .admin-manage .toolbar { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .admin-manage .search { flex: 1; min-width: 180px; }
        .admin-manage input, .admin-manage select {
          padding: 9px 12px; border-radius: var(--radius-lg); border: 1px solid var(--color-border);
          background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 13px;
        }
        .admin-manage .meta { font-size: 12px; color: var(--color-text-muted); margin: 6px 0 10px; }
        .admin-manage .list { display: flex; flex-direction: column; gap: 8px; }
        .admin-manage .row {
          display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-xl);
          background: var(--color-surface); border: 1px solid var(--color-border);
        }
        .admin-manage .row-main { flex: 1; min-width: 0; }
        .admin-manage .row-title { font-size: 14px; font-weight: 600; color: var(--color-text); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .admin-manage .row-sub { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; overflow-wrap: anywhere; }
        .admin-manage .row-end { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .admin-manage .amount { font-weight: 700; font-size: 14px; }
        .admin-manage .thumb { width: 44px; height: 44px; border-radius: var(--radius-md); overflow: hidden; background: var(--color-surface-alt); flex-shrink: 0; }
        .admin-manage .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .admin-manage .status-suspended { border-color: var(--color-error, #DC2626); }
        .admin-manage .pill { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--color-surface-alt); color: var(--color-text-muted); text-transform: capitalize; }
        .admin-manage .pill-completed, .admin-manage .pill-success { background: var(--color-success-bg); color: var(--color-success); }
        .admin-manage .pill-failed { background: #FEE2E2; color: #DC2626; }
        .admin-manage .empty { color: var(--color-text-muted); font-size: 13px; text-align: center; padding: 24px 0; }
        .admin-manage .pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 14px; font-size: 13px; }
        .admin-manage .pager button { padding: 8px 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); font: inherit; cursor: pointer; }
        .admin-manage .pager button:disabled { opacity: 0.5; cursor: default; }

        .admin-manage .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 14px; }
        .admin-manage .summary-card { padding: 14px; border-radius: var(--radius-xl); background: var(--color-surface); border: 1px solid var(--color-border); }
        .admin-manage .summary-label { font-size: 12px; color: var(--color-text-muted); }
        .admin-manage .summary-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
        .admin-manage .summary-sub { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
        .admin-manage .months { display: flex; flex-direction: column; gap: 6px; padding: 14px; border-radius: var(--radius-xl); background: var(--color-surface); border: 1px solid var(--color-border); margin-bottom: 14px; }
        .admin-manage .month { display: grid; grid-template-columns: 64px 1fr 110px; align-items: center; gap: 10px; font-size: 12px; }
        .admin-manage .month-label { order: -1; color: var(--color-text-muted); }
        .admin-manage .month-track { height: 8px; border-radius: 999px; background: var(--color-surface-alt); overflow: hidden; }
        .admin-manage .month-bar { height: 100%; background: var(--color-primary); border-radius: 999px; }
        .admin-manage .month-amount { text-align: right; font-weight: 600; }
        @media (max-width: 480px) {
          .admin-manage .month { grid-template-columns: 56px 1fr 90px; }
        }
      `}</style>
    </div>
  );
};

export default AdminManage;
