import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import type { FormEvent } from 'react';
import { BusFront, Ship, Ticket, Hotel, FileText, Pencil } from 'lucide-react';
import { days } from '@/data/itinerary';

type WalletItem = { id: string; title: string; kind: string; detail: string; tags: string[]; file?: string; fileId?: string; fileName?: string };
const STORAGE_KEY = 'alibaug-wallet-v1';
const DB_NAME = 'alibaug-local-files';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

const defaults: WalletItem[] = [
  { id: 'booking', title: 'Hotel booking', kind: 'Reservation', detail: 'Blue Waves Resort · Varsoli', tags: ['check-in', 'stay'], file: '/hotel-booking.pdf' },
  { id: 'ferry', title: 'Ferry tickets', kind: 'Ticket', detail: 'Keep tickets ready for the outbound and return sailings.', tags: ['ferry', 'boat', 'travel'] },
  { id: 'bus', title: 'Bus / return tickets', kind: 'Ticket', detail: 'Have the return booking ready on Day 4.', tags: ['return', 'travel'] },
];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is unavailable.'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { dbPromise = null; reject(request.error); };
      request.onblocked = () => { dbPromise = null; reject(new Error('Database is blocked.')); };
    });
  }
  return dbPromise;
}

async function saveFile(id: string, file: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function getFile(id: string): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFile(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function isBase64File(value?: string): boolean {
  return Boolean(value && /^data:[^,]*;base64,/i.test(value));
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',');
  const mime = header.match(/^data:(.*?);base64$/i)?.[1] || 'application/octet-stream';
  const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

async function loadItems(): Promise<WalletItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const saved = JSON.parse(raw) as (WalletItem & { owner?: string })[];
    const clean: WalletItem[] = [];

    for (const savedItem of saved) {
      if (savedItem.kind === 'Identity') continue;

      const { owner: _owner, ...rest } = savedItem;
      const defaultItem = defaults.find(entry => entry.id === savedItem.id);
      const legacyFile = isBase64File(savedItem.file) ? savedItem.file : undefined;

      const item: WalletItem = {
        ...defaultItem,
        ...rest,
        file: legacyFile ? undefined : savedItem.file ?? defaultItem?.file,
      };

      if (legacyFile) {
        const id = `wallet-${crypto.randomUUID()}`;
        try {
          await saveFile(id, dataUrlToBlob(legacyFile));
          item.fileId = id;
          item.fileName = savedItem.fileName || 'Attached document';
        } catch {
          item.file = legacyFile;
        }
      }

      clean.push(item);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {}

    return clean;
  } catch {
    return defaults;
  }
}

async function openNativeFile(blob: Blob, fileName: string): Promise<void> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the document.'));
    reader.readAsDataURL(blob);
  });
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'wallet-document';
  const saved = await Filesystem.writeFile({
    path: `wallet/${Date.now()}-${safeName}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });
  const extension = safeName.split('.').pop()?.toLowerCase();
  const contentType = blob.type || (extension === 'pdf' ? 'application/pdf' : extension === 'png' ? 'image/png' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'application/octet-stream');
  await FileOpener.open({ filePath: saved.uri, contentType, openWithDefault: true });
}

export default function Wallet() {
  const [items, setItems] = useState<WalletItem[]>(defaults);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<WalletItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [file, setFile] = useState<string | undefined>();
  const [fileId, setFileId] = useState<string | undefined>();
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [attachmentRemoved, setAttachmentRemoved] = useState(false);

  useEffect(() => {
    let active = true;
    loadItems().then(loaded => {
      if (active) {
        setItems(loaded);
        setReady(true);
      }
    }).catch(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  const today = new Date();
  const day = days.find(d => new Date(d.date).toDateString() === today.toDateString());
  const nextDay = days.find(d => new Date(d.date).getTime() >= new Date(today.toDateString()).getTime()) ?? days[0];
  const relevant = day ?? nextDay;
  const context = day ? `Today · Day ${day.id}` : `Coming up · Day ${nextDay.id}`;
  const hint = relevant.stops.some(s => /ferry|boat|jetty|mandwa/i.test(`${s.title} ${s.note}`)) ? 'ferry' : relevant.stops.some(s => /resort|check.?in/i.test(`${s.title} ${s.note}`)) ? 'check-in' : relevant.id === 4 ? 'return' : 'travel';
  const suggestions = useMemo(() => items.filter(item => item.tags.includes(hint)), [items, hint]);

  const persist = (next: WalletItem[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      return true;
    } catch {
      window.alert('Could not save booking details. Check available browser storage.');
      return false;
    }
  };

  const openEditor = (item?: WalletItem) => {
    setEditing(item ?? null);
    setFormOpen(true);
    setTitle(item?.title ?? '');
    setDetail(item?.detail ?? '');
    setFile(item?.file);
    setFileId(item?.fileId);
    setFileName(item?.fileName ?? item?.file?.split('/').pop() ?? '');
    setSelectedFile(undefined);
    setAttachmentRemoved(false);
  };

  const saveItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;

    let nextFile = attachmentRemoved ? undefined : file;
    let nextFileId = attachmentRemoved ? undefined : fileId;

    if (selectedFile) {
      nextFileId = `wallet-${crypto.randomUUID()}`;
      try {
        await saveFile(nextFileId, selectedFile);
        nextFile = undefined;
      } catch {
        window.alert('Could not save the document locally. Please try again.');
        return;
      }
    }

    const oldItem = editing ? items.find(item => item.id === editing.id) : undefined;

    const updatedItem: WalletItem = editing
      ? { ...editing, title: clean, detail: detail.trim() || 'Added to your wallet on this device.', file: nextFile, fileId: nextFileId, fileName: nextFile || nextFileId ? fileName : undefined }
      : { id: crypto.randomUUID(), title: clean, kind: 'Document', detail: detail.trim() || 'Added to your wallet on this device.', tags: ['travel'], file: nextFile, fileId: nextFileId, fileName: nextFile || nextFileId ? fileName : undefined };

    const nextItems = editing
      ? items.map(item => item.id === editing.id ? updatedItem : item)
      : [updatedItem, ...items];

    if (!persist(nextItems)) {
      if (selectedFile && nextFileId) void deleteFile(nextFileId).catch(() => undefined);
      return;
    }

    if (oldItem?.fileId && oldItem.fileId !== nextFileId) {
      void deleteFile(oldItem.fileId).catch(() => undefined);
    }

    setEditing(null);
    setFormOpen(false);
    setSelectedFile(undefined);
  };

  const openAttachment = async (item: WalletItem) => {
    const isNative = Capacitor.isNativePlatform();
    const popup = isNative ? null : window.open('about:blank', '_blank');
    if (!isNative && !popup) {
      window.alert('Please allow pop-ups to open your document.');
      return;
    }

    try {
      let blob: Blob | undefined;
      const name = item.fileName ?? item.file?.split('/').pop() ?? item.title;

      if (item.fileId) {
        blob = await getFile(item.fileId);
      } else if (item.file) {
        const response = await fetch(item.file);
        if (!response.ok) throw new Error('The document could not be loaded.');
        blob = await response.blob();
      }

      if (!blob) throw new Error('Saved document could not be found.');

      if (isNative) {
        await openNativeFile(blob, name);
      } else if (popup) {
        popup.location.href = URL.createObjectURL(blob);
      }
    } catch {
      popup?.close();
      window.alert('Could not open the saved document. Please check that a PDF or image viewer is installed and try again.');
    }
  };

  if (!ready) return <div className="wallet-page">Loading your wallet...</div>;

  return <div className="wallet-page">
    <div className="wallet-top"><div><div className="eyebrow">Always within reach</div><h1>Our wallet<span>.</span></h1><p className="muted">The little things we need, together.</p></div><button className="btn primary" onClick={() => openEditor()}>＋ Add booking</button></div>

    <section className="wallet-predict"><div className="wallet-spark">✳</div><div className="wallet-predict-copy"><div className="eyebrow">Smart nudge · {context}</div><h2>{hint === 'ferry' ? 'Keep your ferry tickets close.' : hint === 'check-in' ? 'Check-in is on the horizon.' : hint === 'return' ? 'Have your return tickets ready.' : 'Your travel essentials, ready.'}</h2><p>Based on the itinerary and day of your trip.</p><div className="wallet-suggest">{suggestions.length ? suggestions.map(item => <span className="wallet-chip" key={item.id}>♡ {item.title}</span>) : <span className="wallet-chip">Add your travel bookings to see reminders here</span>}</div></div><div className="wallet-date"><strong>{today.toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{today.toLocaleDateString('en-US', { month: 'short' })}</span></div></section>

    {formOpen && <form className="wallet-add" onSubmit={saveItem}><label>Booking or ticket name<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Ferry tickets" autoFocus /></label><label>Notes<input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Booking details or where to find it" /></label><label className="wallet-upload">Supporting document<input type="file" accept="application/pdf,image/*" onChange={e => { const selected = e.target.files?.[0]; if (!selected) return; if (selected.size > 8 * 1024 * 1024) { window.alert('Please choose a file smaller than 8 MB.'); e.target.value = ''; return; } if (!selected.type.startsWith('image/') && selected.type !== 'application/pdf') { window.alert('Choose a PDF or image file.'); e.target.value = ''; return; } setSelectedFile(selected); setFileName(selected.name); setAttachmentRemoved(false); }} />{fileName && <span>{fileName} <button type="button" className="wallet-remove-file" onClick={() => { setSelectedFile(undefined); setFile(undefined); setFileId(undefined); setFileName(''); setAttachmentRemoved(true); }}>Remove</button></span>}</label><button className="btn primary" type="submit">{editing ? 'Save changes' : 'Save booking'}</button><button className="btn soft" type="button" onClick={() => { setEditing(null); setFormOpen(false); }}>Cancel</button></form>}

    <div className="wallet-grid">{items.map((item, index) => <article className={`wallet-item wallet-item-${index % 4} ${item.file || item.fileId ? 'has-document' : ''}`} key={item.id} onClick={() => openAttachment(item)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && (item.file || item.fileId)) { e.preventDefault(); void openAttachment(item); } }} role={item.file || item.fileId ? 'link' : undefined} tabIndex={item.file || item.fileId ? 0 : undefined} aria-label={item.file || item.fileId ? `Open ${item.title} document` : undefined}><div className="wallet-item-top"><span className="wallet-kind">{item.kind}</span></div><div className="wallet-icon">{item.title.toLowerCase().includes('ferry') ? <Ship aria-hidden="true" /> : /bus|return/i.test(item.title) ? <BusFront aria-hidden="true" /> : item.kind === 'Reservation' ? <Hotel aria-hidden="true" /> : item.kind === 'Ticket' ? <Ticket aria-hidden="true" /> : <FileText aria-hidden="true" />}</div><h3>{item.title}</h3><p>{item.detail}</p><button className="wallet-open" onClick={e => { e.stopPropagation(); openEditor(item); }}>Edit details <Pencil size={14} aria-hidden="true" /></button></article>)}</div>

    <p className="wallet-privacy">Bookings and tickets are saved on this device. Attached documents are stored locally.</p>
  </div>;
}
