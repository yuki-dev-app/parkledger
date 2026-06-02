'use client';
/**
 * 管理者パネル
 * - 事業者（テナント）の一覧表示・作成
 * - 招待メールの送信
 * - is_admin: true のユーザーのみアクセス可（middleware で保護）
 */
import { useEffect, useState, useCallback } from 'react';
import { Plus, Mail, Building2, Users, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

type Org = {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
};

const inputCls = 'border border-slate-300 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-base';

export default function AdminPage() {
  const [orgs,       setOrgs]       = useState<Org[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState<ToastType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Org | null>(null);

  // 招待フォーム
  const [orgName,    setOrgName]    = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending,    setSending]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/organizations');
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!orgName.trim() || !inviteEmail.trim()) return;
    setSending(true);
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_name: orgName.trim(), email: inviteEmail.trim() }),
    });
    setSending(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? '招待の送信に失敗しました', kind: 'error' });
      return;
    }
    setOrgName('');
    setInviteEmail('');
    setToast({ message: `${inviteEmail} に招待メールを送りました`, kind: 'success' });
    load();
  };

  const deleteOrg = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/organizations/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    if (!res.ok) { setToast({ message: '削除に失敗しました', kind: 'error' }); return; }
    setToast({ message: `${deleteTarget.name} を削除しました`, kind: 'success' });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {deleteTarget && (
        <ConfirmDialog
          title={`「${deleteTarget.name}」を削除`}
          message="この事業者とすべてのデータが完全に削除されます。元に戻せません。"
          confirmLabel="完全に削除する"
          onConfirm={deleteOrg}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">管理者パネル</h1>
        <p className="text-sm text-slate-500 mt-0.5">事業者の追加・招待・管理</p>
      </div>

      {/* 招待フォーム */}
      <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-600 px-5 py-4 flex items-center gap-2">
          <Plus size={20} className="text-white" />
          <h2 className="text-white font-bold text-lg">新しい事業者を招待する</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-700 mb-1">招待の流れ</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>事業者名とメールアドレスを入力</li>
              <li>「招待メールを送る」を押す</li>
              <li>オーナーのメールに招待リンクが届く</li>
              <li>オーナーがリンクをクリック → パスワードを設定</li>
              <li>そのままログインして利用開始</li>
            </ol>
          </div>

          <div>
            <label className="text-base font-bold text-slate-700 block mb-2">
              事業者名 <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="例: 山田駐車場"
            />
          </div>
          <div>
            <label className="text-base font-bold text-slate-700 block mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={inputCls}
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="owner@example.com"
            />
            <p className="text-sm text-slate-400 mt-1.5">このメールアドレスに招待リンクが送られます</p>
          </div>
          <button
            onClick={invite}
            disabled={sending || !orgName.trim() || !inviteEmail.trim()}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40"
          >
            <Mail size={20} />
            {sending ? '送信中...' : '招待メールを送る'}
          </button>
        </div>
      </div>

      {/* 事業者一覧 */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Building2 size={18} className="text-slate-600" />
          <h2 className="text-lg font-bold text-slate-700">
            登録済み事業者 <span className="text-slate-400 font-normal text-base">（{orgs.length} 件）</span>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">読み込み中...</div>
        ) : orgs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Building2 size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-base">まだ事業者が登録されていません</p>
            <p className="text-slate-400 text-sm mt-1">上のフォームから最初の事業者を招待してください</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orgs.map(org => (
              <div key={org.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-lg">{org.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Users size={14} />
                        {org.member_count > 0 ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            ログイン済み
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle size={14} className="text-amber-500" />
                            招待未承諾
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400">
                        作成: {new Date(org.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(org)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 shrink-0"
                  >
                    <Trash2 size={15} /> 削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
