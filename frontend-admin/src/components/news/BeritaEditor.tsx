'use client';

import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    ImageIcon,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/viewmodels/useAuth';
import { adminService } from '@/services/adminService';

interface BeritaEditorProps {
    content: string;
    onChange: (html: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { idToken } = useAuth();

    if (!editor) {
        return null;
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !idToken) return;

        setIsUploading(true);
        try {
            const signRes = await adminService.getSignUpload(idToken, 'berita/inline');

            if (!signRes.success) throw new Error("Gagal mendapatkan izin unggahan.");

            const url = await uploadToCloudinary(file, 'berita/inline', signRes);

            editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
            console.error('Error uploading inline image:', error);
            alert('Gagal mengunggah gambar. Pastikan koneksi internet stabil.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-border-custom bg-surface-hover/30 p-2 rounded-t-xl">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded-md hover:bg-surface-hover transition ${editor.isActive('bold') ? 'bg-surface-hover font-bold text-foreground' : 'text-text-muted'
                    }`}
                title="Bold"
            >
                <Bold className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded-md hover:bg-surface-hover transition ${editor.isActive('italic') ? 'bg-surface-hover font-bold text-foreground' : 'text-text-muted'
                    }`}
                title="Italic"
            >
                <Italic className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={`p-2 rounded-md hover:bg-surface-hover transition ${editor.isActive('underline') ? 'bg-surface-hover font-bold text-foreground' : 'text-text-muted'
                    }`}
                title="Underline"
            >
                <UnderlineIcon className="h-4 w-4" />
            </button>

            <div className="w-px h-6 bg-border-custom mx-1" />

            {/* Alignments */}
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded-md hover:bg-surface-hover transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-surface-hover font-bold text-foreground' : 'text-text-muted'
                    }`}
                title="Align Left"
            >
                <AlignLeft className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded-md hover:bg-surface-hover transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-surface-hover font-bold text-foreground' : 'text-text-muted'
                    }`}
                title="Align Center"
            >
                <AlignCenter className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded-md hover:bg-surface-hover transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-surface-hover font-bold text-foreground' : 'text-text-muted'
                    }`}
                title="Align Right"
            >
                <AlignRight className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-2 rounded-md hover:bg-surface-hover transition ${editor.isActive({ textAlign: 'justify' }) ? 'bg-surface-hover font-bold text-foreground' : 'text-text-muted'
                    }`}
                title="Justify"
            >
                <AlignJustify className="h-4 w-4" />
            </button>

            <div className="w-px h-6 bg-border-custom mx-1" />

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 rounded-md hover:bg-surface-hover transition text-text-muted flex items-center gap-2"
                title="Insert Image"
            >
                {isUploading ? (
                    <div className="h-4 w-4 border-2 border-brand/50 border-t-brand-primary rounded-full animate-spin" />
                ) : (
                    <ImageIcon className="h-4 w-4" />
                )}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
    );
};

export default function BeritaEditor({ content, onChange }: BeritaEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'left',
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none min-h-[400px] p-6 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="border border-border-custom rounded-xl overflow-hidden bg-surface shadow-sm focus-within:border-brand-primary/50 focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
            <MenuBar editor={editor} />
            <div className="bg-surface">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
