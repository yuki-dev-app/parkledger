'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, Settings as SettingsIcon, Plus, X, Users, Building2, FileText, Car, ChevronLeft } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Settings } from '@/lib/settings';
import AccountSection from './_components/AccountSection';
import { inputCls } from '@/lib/styles';

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({
    business_name: '', business_address: '', business_phone: '',
    parking_name: '', parking_address: '', receipt_no_prefix: 'R', cleaning_persons: '',
  });
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState<ToastType | null>(null);
  const [newPerson, setNewPerson] = useState('');

  // アカウント設定（AccountSection コンポーネントに委譲）
  const [currentEmail,   setCurrentEmail]   = useState('');
  const [loginId,        setLoginId]        = useState('');
  const [lastSignIn,     setLastSignIn]     = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    const [sRes, idRes, { data: { user } }] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/me/login-id'),
      supabase.auth.getUser(),
    ]);
    setForm(await sRes.json().catch(() => ({})));
    const idJson = await idRes.json().catch(() => ({}));
    setLoginId(idJson.login_id ?? '');
    setCurrentEmail(user?.email ?? '');
    if (user?.last_sign_in_at) {
      const d = new Date(user.last_sign_in_at);
      setLastSignIn(`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const persons = form.cleaning_persons
    ? form.cleaning_persons.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const save = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setLoading(false);
    setToast({ message: res.ok ? '保存しました' : '保存に失敗しました', kind: res.ok ? 'success' : 'error' });
  };

  const addPerson = async () => {
    const name = newPerson.trim();
    if (!name || persons.includes(name)) return;
    const updated = [...persons, name].join(',');
    setForm(f => ({ ...f, cleaning_persons: updated }));
    setNewPerson('');
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cleaning_persons: updated }) });
    setToast({ message: `${name} を追加しました`, kind: 'success' });
  };

  const removePerson = async (name: string) => {
    const updated = persons.filter(p => p !== name).join(',');
    setForm(f => ({ ...f, cleaning_persons: updated }));
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cleaning_persons: updated }) });
  };

  return (
    <div className="max-w-xl mx-auto pb-28">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* 戻るボタン */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 mb-4 py-2 pr-3 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
      >
        <ChevronLeft size={20} />
        <span className="font-medium text-base">ホームに戻る</span>
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-slate-800 text-white rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
          <SettingsIcon size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">設定</h1>
          <p className="text-xs text-slate-400">領収書・書類・清掃担当者・アカウント</p>
        </div>
      </div>

      {/* 事業者情報 */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1"><Building2 size={16} className="text-slate-600" /><h2 className="text-base font-bold text-slate-700">事業者情報</h2></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {[{ key:'business_name',label:'事業者名・氏名',placeholder:'山田 太郎'},{key:'business_address',label:'事業者の住所',placeholder:'〇〇県〇〇市〇〇町1-2-3'},{key:'business_phone',label:'電話番号',placeholder:'090-0000-0000'}].map(({key,label,placeholder})=>(
            <div key={key} className="px-4 py-3.5">
              <label className="text-sm font-medium text-slate-600 block mb-1.5">{label}</label>
              <input className={inputCls} value={(form as Record<string,string>)[key]??''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder}/>
            </div>
          ))}
        </div>
      </section>

      {/* 駐車場情報 */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1"><Car size={16} className="text-slate-600" /><h2 className="text-base font-bold text-slate-700">駐車場情報</h2></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {[{key:'parking_name',label:'駐車場の名称',placeholder:'〇〇パーキング',hint:'督促文・領収書に使用されます'},{key:'parking_address',label:'駐車場の所在地',placeholder:'〇〇県〇〇市〇〇町4-5',hint:'車庫証明の「保管場所の位置」に印刷されます'}].map(({key,label,placeholder,hint})=>(
            <div key={key} className="px-4 py-3.5">
              <label className="text-sm font-medium text-slate-600 block mb-1.5">{label}</label>
              <input className={inputCls} value={(form as Record<string,string>)[key]??''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder}/>
              {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* 書類設定 */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1"><FileText size={16} className="text-slate-600" /><h2 className="text-base font-bold text-slate-700">書類設定</h2></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3.5">
            <label className="text-sm font-medium text-slate-600 block mb-1.5">領収書番号のプレフィックス</label>
            <input className={inputCls} value={form.receipt_no_prefix??'R'} onChange={e=>setForm({...form,receipt_no_prefix:e.target.value})} placeholder="R（例: R0001）"/>
            <p className="text-xs text-slate-400 mt-1.5">領収書番号の先頭に付く文字（例: R → R0001）</p>
          </div>
        </div>
      </section>

      {/* 清掃担当者 */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1"><Users size={16} className="text-slate-600" /><h2 className="text-base font-bold text-slate-700">清掃担当者リスト</h2></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-400 mb-3">清掃記録の入力時にプルダウンで選択できます</p>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
            {persons.length === 0 && <p className="text-xs text-slate-400">担当者が登録されていません</p>}
            {persons.map(name=>(
              <span key={name} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">
                {name}
                <button onClick={()=>removePerson(name)} className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 -mr-1 ml-0.5 transition-colors"><X size={14}/></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputCls+' flex-1'} value={newPerson} onChange={e=>setNewPerson(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addPerson();}} placeholder="例: 田中、業者A"/>
            <button onClick={addPerson} disabled={!newPerson.trim()} className="flex items-center gap-1 bg-slate-800 text-white px-3.5 py-2 rounded-xl font-medium text-sm hover:bg-slate-700 disabled:opacity-40 shrink-0">
              <Plus size={14}/> 追加
            </button>
          </div>
        </div>
      </section>

      {/* 最終ログイン */}
      {lastSignIn && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">最終ログイン日時</p>
          <p className="text-sm font-bold text-slate-700 tabular-nums">{lastSignIn}</p>
        </div>
      )}

      {/* アカウント設定（AccountSection コンポーネントに委譲） */}
      <AccountSection
        loginId={loginId}
        currentEmail={currentEmail}
        onToast={setToast}
        onLoginIdSaved={id => setLoginId(id)}
      />

      {/* 車庫証明の補足 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4">
        <p className="text-xs font-bold text-amber-800 mb-1.5">車庫証明について（補足）</p>
        <ul className="text-[11px] text-amber-700 space-y-1 list-disc list-inside leading-relaxed">
          <li>型式・原動機型式が必要な場合は、印刷後に手書きで追記してください</li>
          <li>各都道府県警察の公式様式と合わせてご利用ください</li>
          <li>発行者の印鑑を押してから提出してください</li>
        </ul>
      </div>

      {/* 保存ボタン */}
      <div className="save-bar bg-white/95 backdrop-blur-md border-t border-slate-200 p-3">
        <div className="max-w-xl mx-auto">
          <button onClick={save} disabled={loading}
            className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-50"
            style={{fontSize:'16px'}}>
            <Check size={18}/>{loading?'保存中...':'事業者・書類情報を保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
