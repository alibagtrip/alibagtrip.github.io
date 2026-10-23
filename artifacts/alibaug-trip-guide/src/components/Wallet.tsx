import { useMemo, useState } from 'react';
import { days } from '@/data/itinerary';

type WalletItem = { id: string; title: string; owner: 'His' | 'Hers' | 'Our'; kind: string; detail: string; tags: string[]; file?: string };
const STORAGE_KEY = 'alibaug-wallet-v1';
const defaults: WalletItem[] = [
  { id: 'booking', title: 'Hotel booking', owner: 'Our', kind: 'Reservation', detail: 'Blue Waves Resort · Varsoli', tags: ['check-in', 'stay'], file: '/hotel-booking.pdf' },
  { id: 'ferry', title: 'Ferry tickets', owner: 'Our', kind: 'Ticket', detail: 'Keep tickets ready for the outbound and return sailings.', tags: ['ferry', 'boat', 'travel'] },
  { id: 'bus', title: 'Bus / return tickets', owner: 'Our', kind: 'Ticket', detail: 'Have the return booking ready on Day 4.', tags: ['return', 'travel'] },
];
function loadItems(): WalletItem[] { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return defaults; const saved = JSON.parse(raw) as WalletItem[]; const clean = saved.filter(item => item.kind !== 'Identity'); return clean.map(item => ({ ...item, ...defaults.find(entry => entry.id === item.id && entry.file ? { file: entry.file } : {}) })); } catch { return defaults; } }
export default function Wallet() {
  const [items, setItems] = useState<WalletItem[]>(loadItems);
  const [filter, setFilter] = useState('All');
  const [editing, setEditing] = useState<WalletItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [owner, setOwner] = useState<WalletItem['owner']>('Our');
  const [file, setFile] = useState<string | undefined>();
  const [fileName, setFileName] = useState('');
  const today = new Date();
  const day = days.find(d => new Date(d.date).toDateString() === today.toDateString());
  const nextDay = days.find(d => new Date(d.date).getTime() >= new Date(today.toDateString()).getTime()) ?? days[0];
  const relevant = day ?? nextDay;
  const context = day ? `Today · Day ${day.id}` : `Coming up · Day ${nextDay.id}`;
  const hint = relevant.stops.some(s => /ferry|boat|jetty|mandwa/i.test(`${s.title} ${s.note}`)) ? 'ferry' : relevant.stops.some(s => /resort|check.?in/i.test(`${s.title} ${s.note}`)) ? 'check-in' : relevant.id === 4 ? 'return' : 'travel';
  const suggestions = useMemo(() => items.filter(item => item.tags.includes(hint)), [items, hint]);
  const visible = filter === 'All' ? items : items.filter(item => item.owner === filter);
  const persist = (next: WalletItem[]) => { setItems(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} };
  const openEditor = (item?: WalletItem) => { setEditing(item ?? null); setFormOpen(true); setTitle(item?.title ?? ''); setDetail(item?.detail ?? ''); setOwner(item?.owner ?? 'Our'); setFile(item?.file); setFileName(item?.file ? item.file.split('/').pop() ?? 'Attached document' : ''); };
  const saveItem = (e: React.FormEvent) => { e.preventDefault(); const clean = title.trim(); if (!clean) return; if (editing) persist(items.map(item => item.id === editing.id ? { ...item, title: clean, detail: detail.trim() || 'Added to your wallet on this device.', owner, file } : item)); else persist([{ id: crypto.randomUUID(), title: clean, owner, kind: 'Document', detail: detail.trim() || 'Added to your wallet on this device.', tags: ['travel'], file }, ...items]); setEditing(null); setFormOpen(false); };
  return <div className="wallet-page">
    <div className="wallet-top"><div><div className="eyebrow">Always within reach</div><h1>Our wallet<span>.</span></h1><p className="muted">The little things we need, together.</p></div><button className="btn primary" onClick={() => openEditor()}>＋ Add booking</button></div>
    <section className="wallet-predict"><div className="wallet-spark">✳</div><div className="wallet-predict-copy"><div className="eyebrow">Smart nudge · {context}</div><h2>{hint === 'ferry' ? 'Keep your ferry tickets close.' : hint === 'check-in' ? 'Check-in is on the horizon.' : hint === 'return' ? 'Have your return tickets ready.' : 'Your travel essentials, ready.'}</h2><p>Based on the itinerary and day of your trip.</p><div className="wallet-suggest">{suggestions.length ? suggestions.map(item => <span className="wallet-chip" key={item.id}>{item.owner === 'Our' ? '♡' : '◉'} {item.title} <small>{item.owner}</small></span>) : <span className="wallet-chip">Add your travel bookings to see reminders here</span>}</div></div><div className="wallet-date"><strong>{today.toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{today.toLocaleDateString('en-US', { month: 'short' })}</span></div></section>
    {formOpen && <form className="wallet-add" onSubmit={saveItem}><label>Booking or ticket name<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Ferry tickets" autoFocus /></label><label>Notes<input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Booking details or where to find it" /></label><label>Belongs to<select value={owner} onChange={e => setOwner(e.target.value as WalletItem['owner'])}><option>Our</option><option>His</option><option>Hers</option></select></label><label className="wallet-upload">Supporting document<input type="file" accept="application/pdf,image/*" onChange={e => { const selected = e.target.files?.[0]; if (!selected) return; if (selected.size > 8 * 1024 * 1024) { window.alert('Please choose a file smaller than 8 MB.'); e.target.value = ''; return; } if (!selected.type.startsWith('image/') && selected.type !== 'application/pdf') { window.alert('Choose a PDF or image file.'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') { setFile(reader.result); setFileName(selected.name); } }; reader.readAsDataURL(selected); }} />{fileName && <span>{fileName} <button type="button" className="wallet-remove-file" onClick={() => { setFile(undefined); setFileName(''); }}>Remove</button></span>}</label><button className="btn primary" type="submit">{editing ? 'Save changes' : 'Save booking'}</button><button className="btn soft" type="button" onClick={() => { setEditing(null); setFormOpen(false); }}>Cancel</button></form>}
    <div className="wallet-filters" role="tablist" aria-label="Filter wallet items">{['All', 'His', 'Hers', 'Our'].map(value => <button key={value} className={`wallet-filter ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)} role="tab" aria-selected={filter === value}>{value === 'Our' ? '♡ Our things' : value === 'All' ? 'Everything' : `${value}’s`}</button>)}</div>
    <div className="wallet-grid">{visible.map((item, index) => <article className={`wallet-item wallet-item-${index % 4}`} key={item.id}><div className="wallet-item-top"><span className="wallet-kind">{item.kind}</span><span className="wallet-owner">{item.owner === 'Our' ? '♡' : '◉'} {item.owner}</span></div><div className="wallet-icon">{item.kind === 'Ticket' ? '✈' : item.kind === 'Reservation' ? '⌂' : '▤'}</div><h3>{item.title}</h3><p>{item.detail}</p>{item.file && <a className="wallet-open" href={item.file} target="_blank" rel="noopener noreferrer">Open booking PDF <span>↗</span></a>}<button className="wallet-open" onClick={() => openEditor(item)}>Edit details <span>✎</span></button></article>)}</div>
    <p className="wallet-privacy">Bookings and tickets are saved on this device. Open attached PDFs in a new tab.</p>
  </div>;
}
