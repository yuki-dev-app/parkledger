'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, Settings as SettingsIcon, Plus, X, Users, Building2, FileText, Car, KeyRound, Eye, EyeOff, Mail, ChevronLeft } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Settings = {
  business_name: string; business_address: string; business_phone: string;
  parking_name: string; parking_address: string;
  receipt_no_prefix: string; cleaning_persons: string;
};

const inputCls = 'border border-slate-300 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-base';

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({
    business_name: '', business_address: '', business_phone: '',
    parking_name: '', parking_address: '', receipt_no_prefix: 'R', cleaning_persons: '',
  });
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState<ToastType | null>(null);
  const [newPerson, setNewPerson] = useState('');

  // アカウント設定
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail,     setNewEmail]     = useState('');
  const [savingEmail,  setSavingEmail]  = useState(false);
  const [currentPass,  setCurrentPass]  = useState('');
  const [newPass,      setNewPass]      = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [showCur,      setShowCur]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [savingPass,   setSavingPass]   = useState(false);

  // ログインID
  const [loginId,      setLoginId]      = useState('');
  const [newLoginId,   setNewLoginId]   = useState('');
  const [savingId,     setSavingId]     = useState(false);

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

  // Supabase のエラーメッセージを日本語に変換
  const toJaError = (msg: string): string => {
    const map: Record<string, string> = {
      'Email rate limit exceeded': 'メール送信の上限に達しました。しばらく待ってから再試行してください。',
      'User not found': 'ユーザーが見つかりません。',
      'Invalid email': 'メールアドレスの形式が正しくありません。',
      'Password should be at least 6 characters': 'パスワードは6文字以上にしてください。',
      'New password should be different from the old password': '新しいパスワードは現在のパスワードと異なるものにしてください。',
      'Invalid login credentials': 'パスワードが正しくありません。',
    };
    return map[msg] ?? 'エラーが発生しました。時間をおいて再試行してください。';
  };

  const changeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) return;
    setSavingEmail(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSavingEmail(false);
    if (error) { setToast({ message: toJaError(error.message), kind: 'error' }); return; }
    setNewEmail('');
    setToast({ message: '確認メールを送りました。新しいメールアドレスを確認してください。', kind: 'success' });
  };

  const saveLoginId = async () => {
    setSavingId(true);
    const res = await fetch('/api/me/login-id', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: newLoginId }),
    });
    setSavingId(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? '更新に失敗しました', kind: 'error' });
      return;
    }
    setLoginId(newLoginId);
    setNewLoginId('');
    setToast({ message: 'ログインIDを設定しました', kind: 'success' });
  };

  const changePassword = async () => {
    if (!currentPass || !newPass || newPass !== confirmPass || newPass.length < 8) return;
    setSavingPass(true);
    // Supabaseは現在のパスワードを先に確認してから変更
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentEmail, password: currentPass });
    if (signInError) {
      setSavingPass(false);
      setToast({ message: '現在のパスワードが違います', kind: 'error' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) { setToast({ message: toJaError(error.message), kind: 'error' }); return; }
    setCurrentPass(''); setNewPass(''); setConfirmPass('');
    setToast({ message: 'パスワードを変更しました', kind: 'success' });
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

      {/* アカウント設定 */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1"><KeyRound size={16} className="text-slate-600"/><h2 className="text-base font-bold text-slate-700">アカウント設定</h2></div>

        {/* ログインID */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <p className="text-xs text-slate-400 mb-0.5">現在のログインID</p>
            <p className="text-base font-bold text-slate-800">{loginId || '（未設定）'}</p>
            <p className="text-xs text-slate-400 mt-1">メールアドレスの代わりにこのIDでログインできます</p>
          </div>
          <div className="px-4 py-3.5">
            <label className="text-sm font-medium text-slate-600 block mb-1.5">新しいログインID</label>
            <input
              className={inputCls}
              value={newLoginId}
              onChange={e => setNewLoginId(e.target.value)}
              placeholder="例: yamada123（半角英数字・ハイフン・_、3〜30文字）"
            />
            <button
              onClick={saveLoginId}
              disabled={savingId || !newLoginId.trim()}
              className="mt-2.5 w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40"
            >
              <Check size={15} />{savingId ? '保存中...' : 'ログインIDを設定する'}
            </button>
          </div>
        </div>

        {/* メール変更 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <p className="text-xs text-slate-400 mb-0.5">現在のメールアドレス</p>
            <p className="text-base font-bold text-slate-800">{currentEmail || '—'}</p>
          </div>
          <div className="px-4 py-3.5">
            <label className="text-sm font-medium text-slate-600 block mb-1.5">新しいメールアドレス</label>
            <input type="email" className={inputCls} value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="new@example.com"/>
            <p className="text-xs text-slate-400 mt-1.5">変更するとSupabaseから確認メールが送られます</p>
            <button onClick={changeEmail} disabled={savingEmail||!newEmail||!newEmail.includes('@')}
              className="mt-2.5 w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40">
              <Mail size={15}/>{savingEmail?'送信中...':'確認メールを送って変更する'}
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3.5 flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-600">パスワードを変更する</label>
            <div className="relative">
              <input type={showCur?'text':'password'} className={inputCls+' pr-12'} value={currentPass} onChange={e=>setCurrentPass(e.target.value)} placeholder="現在のパスワード" autoComplete="current-password"/>
              <button type="button" onClick={()=>setShowCur(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showCur ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <div className="relative">
              <input type={showNew?'text':'password'} className={inputCls+' pr-12'} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="新しいパスワード（8文字以上）" autoComplete="new-password"/>
              <button type="button" onClick={()=>setShowNew(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showNew ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <input type={showNew?'text':'password'} className={inputCls} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="新しいパスワード（確認）" autoComplete="new-password"/>
            {newPass&&confirmPass&&newPass!==confirmPass&&<p className="text-xs text-red-500">パスワードが一致しません</p>}
            {newPass.length>0&&newPass.length<8&&<p className="text-xs text-red-500">8文字以上にしてください（今{newPass.length}文字）</p>}
            <button onClick={changePassword} disabled={savingPass||!currentPass||newPass.length<8||newPass!==confirmPass}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40">
              <Check size={15}/>{savingPass?'変更中...':'パスワードを変更する'}
            </button>
          </div>
        </div>
      </section>

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
