import { useMemo, useState } from 'react';
import { days } from '@/data/itinerary';

type WalletItem = { id: string; title: string; owner: 'His' | 'Hers' | 'Our'; kind: string; detail: string; tags: string[] };
const STORAGE_KEY = 'alibaug-wallet-v1';
const defaults: WalletItem[] = [
  { id: 'his-id', title: 'Government ID', owner: 'His', kind: 'Identity', detail: 'Keep the original handy for hotel check-in and ferry boarding.', tags: ['check-in', 'ferry', 'travel'] },
  { id: 'hers-id', title: 'Government ID', owner: 'Hers', kind: 'Identity', detail: 'Keep the original handy for hotel check-in and ferry boarding.', tags: ['check-in', 'ferry', 'travel'] },
  { id: 'booking', title: 'Resort booking', owner: 'Our', kind: 'Reservation', detail: 'Blue Waves Resort · Varsoli', tags: ['check-in', 'stay'] },
  { id: 'ferry', title: 'Ferry tickets', owner: 'Our', kind: 'Ticket', detail: 'Keep tickets ready for the outbound and return sailings.', tags: ['ferry', 'boat', 'travel'] },
  { id: 'bus', title: 'Bus / return tickets', owner: 'Our', kind: 'Ticket', detail: 'Have the return booking ready on Day 4.', tags: ['return', 'travel'] },
];
function loadItems(): WalletItem[] { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as WalletItem[] : defaults; } catch { return defaults; } }
export default function Wallet() {
  const [items, setItems] = useState<WalletItem[]>(loadItems);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState<WalletItem['owner']>('Our');
  const today = new Date();
  const day = days.find(d => new Date(d.date).toDateString() === today.toDateString());
  const nextDay = days.find(d => new Date(d.date).getTime() >= new Date(today.toDateString()).getTime()) ?? days[0];
  const relevant = day ?? nextDay;
  const context = day ? `Today · Day ${day.id}` : `Coming up · Day ${nextDay.id}`;
  const hint = relevant.stops.some(s => /ferry|boat|jetty|mandwa/i.test(`${s.title} ${s.note}`)) ? 'ferry' : relevant.stops.some(s => /resort|check.?in/i.test(`${s.title} ${s.note}`)) ? 'check-in' : relevant.id === 4 ? 'return' : 'travel';
  const suggestions = useMemo(() => items.filter(item => item.tags.includes(hint)), [items, hint]);
  const visible = filter === 'All' ? items : items.filter(item => item.owner === filter);
  const persist = (next: WalletItem[]) => { setItems(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} };
  const addItem = (e: React.FormEvent) => { e.preventDefault(); const clean = title.trim(); if (!clean) return; persist([{ id: crypto.randomUUID(), title: clean, owner, kind: 'Document', detail: 'Added to your wallet on this device.', tags: ['travel'] }, ...items]); setTitle(''); setShowForm(false); };
  return <div className="wallet-page">
    <div className="wallet-top"><div><div className="eyebrow">Always within reach</div><h1>Our wallet<span>.</span></h1><p className="muted">The little things we need, together.</p></div><button className="btn primary" onClick={() => setShowForm(!showForm)}>＋ Add item</button></div>
    <section className="wallet-predict"><div className="wallet-spark">✳</div><div className="wallet-predict-copy"><div className="eyebrow">Smart nudge · {context}</div><h2>{hint === 'ferry' ? 'Keep your ferry tickets close.' : hint === 'check-in' ? 'Check-in is on the horizon.' : hint === 'return' ? 'Have your return tickets ready.' : 'Your travel essentials, ready.'}</h2><p>Based on the itinerary and day of your trip.</p><div className="wallet-suggest">{suggestions.length ? suggestions.map(item => <span className="wallet-chip" key={item.id}>{item.owner === 'Our' ? '♡' : '◉'} {item.title} <small>{item.owner}</small></span>) : <span className="wallet-chip">Add your travel documents to see reminders here</span>}</div></div><div className="wallet-date"><strong>{today.toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{today.toLocaleDateString('en-US', { month: 'short' })}</span></div></section>
    {showForm && <form className="wallet-add" onSubmit={addItem}><label>What are you keeping here?<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Passport, event tickets" autoFocus /></label><label>Belongs to<select value={owner} onChange={e => setOwner(e.target.value as WalletItem['owner'])}><option>Our</option><option>His</option><option>Hers</option></select></label><button className="btn primary" type="submit">Save to wallet</button></form>}
    <div className="wallet-filters" role="tablist" aria-label="Filter wallet items">{['All', 'His', 'Hers', 'Our'].map(value => <button key={value} className={`wallet-filter ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)} role="tab" aria-selected={filter === value}>{value === 'Our' ? '♡ Our things' : value === 'All' ? 'Everything' : `${value}’s`}</button>)}</div>
    <div className="wallet-grid">{visible.map((item, index) => <article className={`wallet-item wallet-item-${index % 4}`} key={item.id}><div className="wallet-item-top"><span className="wallet-kind">{item.kind}</span><span className="wallet-owner">{item.owner === 'Our' ? '♡' : '◉'} {item.owner}</span></div><div className="wallet-icon">{item.kind === 'Ticket' ? '✈' : item.kind === 'Reservation' ? '⌂' : '▤'}</div><h3>{item.title}</h3><p>{item.detail}</p><button className="wallet-open" onClick={() => alert('For your privacy, add a document to a secure vault before storing sensitive ID images. This wallet stores item names only.')}>View details <span>↗</span></button></article>)}</div>
    <p className="wallet-privacy">Your wallet is saved on this device. For your safety, don’t store ID numbers or document photos here.</p>
  </div>;
}
