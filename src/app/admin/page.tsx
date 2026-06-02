'use client';
import { useEffect, useState, useCallback } from 'react';
import { Building2, Users, Trash2 } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

type Org = {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
};

export default function AdminPage() {
  const [orgs,         setOrgs]         = useState<Org[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState<ToastType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Org | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/organizations');
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

      <div>
        <h1 className="text-2xl font-bold text-slate-900">管理者パネル</h1>
        <p className="text-sm text-slate-500 mt-0.5">登録済み事業者の管理</p>
      </div>

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
                        メンバー {org.member_count} 名
                      </span>
                      <span className="text-xs text-slate-400">
                        登録: {new Date(org.created_at).toLocaleDateString('ja-JP')}
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
