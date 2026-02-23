'use client';

import { useState } from 'react';
import { useNewsManager } from '@/viewmodels/useNewsManager';
import NewsTable from '@/components/news/NewsTable';
import NewsFormModal from '@/components/news/NewsFormModal';
import type { NewsItem } from '@/models/member.types';

export default function NewsPage() {
    const vm = useNewsManager();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NewsItem | null>(null);

    const handleCreate = () => {
        setEditingItem(null);
        setModalOpen(true);
    };

    const handleEdit = (item: NewsItem) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSave = async (payload: any) => {
        if (editingItem) {
            await vm.updateNews({ id: payload.id, data: payload.data });
        } else {
            await vm.createNews(payload);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-white">Berita & CMS</h1>
                <p className="text-sm text-text-muted">
                    Kelola berita, acara, dan kegiatan organisasi
                </p>
            </div>

            <NewsTable
                news={vm.news}
                isLoading={vm.isLoading}
                onEdit={handleEdit}
                onDelete={(id) => vm.deleteNews(id)}
                onCreate={handleCreate}
                isDeleting={vm.isDeleting}
            />

            <NewsFormModal
                item={editingItem}
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingItem(null); }}
                onSave={handleSave}
                isSaving={vm.isCreating || vm.isUpdating}
            />
        </div>
    );
}
